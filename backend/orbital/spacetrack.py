"""
Space-Track Live Data Service
==============================
Fetches real GP data from Space-Track.org and persists it into PostgreSQL
using duplicate-safe upserts keyed on the NORAD catalog id.
"""

import httpx
import math
import time
import datetime
import logging
from typing import List, Dict, Any, Optional, Tuple

from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert as pg_insert

from database.session import SessionLocal
from models.db_models import Satellite, Debris
from app.core.config import settings
from orbital.providers import AllProvidersFailedError, ProviderChain, build_provider_chain

logger = logging.getLogger("app")

HTTP_MAX_ATTEMPTS = 4
HTTP_BASE_DELAY   = 2.0
HTTP_MAX_DELAY    = 30.0


def _retry(max_attempts: int, base_delay: float, max_delay: float, retry_on):
    def decorator(fn):
        def wrapper(*args, **kwargs):
            last_exc = None
            for attempt in range(1, max_attempts + 1):
                try:
                    return fn(*args, **kwargs)
                except retry_on as exc:
                    last_exc = exc
                    if attempt >= max_attempts:
                        break
                    delay = min(base_delay * (2 ** (attempt - 1)), max_delay)
                    logger.warning(f"[SpaceTrack] Retry {attempt}/{max_attempts} for {fn.__name__} after {delay:.1f}s — {exc}")
                    time.sleep(delay)
            logger.error(f"[SpaceTrack] {fn.__name__} failed after {max_attempts} attempts: {last_exc}")
            raise last_exc
        return wrapper
    return decorator


SYNC_GROUPS = [
    ("active",   "PAYLOAD", "Tracked active satellites"),
    ("starlink", "PAYLOAD", "Starlink constellation"),
    ("analyst",  "DEBRIS",  "Analyst debris objects"),
]

KNOWN_GROUPS = ("active", "starlink", "analyst", "debris")

_TYPE_MAP = {
    "PAYLOAD":      "PAYLOAD",
    "ROCKET BODY":  "ROCKET_BODY",
    "DEBRIS":       "DEBRIS",
    "UNKNOWN":      "UNKNOWN",
}


def _semimajor_axis_from_mean_motion(mean_motion_revday: float) -> float:
    if mean_motion_revday <= 0:
        return 6778.0
    n_rads = mean_motion_revday * 2 * math.pi / 86400.0
    return (398600.4418 / (n_rads ** 2)) ** (1.0 / 3.0)


def _parse_epoch(epoch_str: str) -> Optional[str]:
    try:
        dt = datetime.datetime.fromisoformat(epoch_str.replace("Z", ""))
        return dt.isoformat()
    except Exception:
        return None


class SpaceTrackService:
    def __init__(self):
        self.username = settings.SPACETRACK_USERNAME
        self.password = settings.SPACETRACK_PASSWORD
        self.base_url = "https://www.space-track.org"
        self.client   = httpx.Client(timeout=60.0, follow_redirects=True)
        self._authenticated = False
        self._providers: Optional["ProviderChain"] = None

    @property
    def providers(self) -> "ProviderChain":
        if getattr(self, "_providers", None) is None:
            self._providers = build_provider_chain(self)
        return self._providers

    @providers.setter
    def providers(self, chain: "ProviderChain") -> None:
        self._providers = chain

    # ------------------------------------------------------------------
    # Authentication
    # ------------------------------------------------------------------

    def authenticate(self) -> bool:
        if self._authenticated:
            logger.debug("[SpaceTrack] Using cached session (already authenticated)")
            return True
        if not self.username or not self.password:
            logger.warning("[SpaceTrack] SPACETRACK_USERNAME / SPACETRACK_PASSWORD not set — Space-Track unavailable")
            return False
        try:
            logger.info("[SpaceTrack] Authenticating with Space-Track.org ...")
            resp = self.client.post(
                f"{self.base_url}/ajaxauth/login",
                data={"identity": self.username, "password": self.password},
            )
            if resp.status_code == 200 and "spacetrack_session" in self.client.cookies:
                self._authenticated = True
                logger.info("[SpaceTrack] Authentication successful")
                return True
            logger.error(f"[SpaceTrack] Auth failed — HTTP {resp.status_code}")
            return False
        except httpx.RequestError as exc:
            logger.error(f"[SpaceTrack] Network error during auth (Space-Track may be down): {exc}")
            return False
        except Exception as exc:
            logger.error(f"[SpaceTrack] Auth exception: {exc}", exc_info=True)
            return False

    def _reset_auth(self):
        self._authenticated = False

    # ------------------------------------------------------------------
    # Raw API fetch
    # ------------------------------------------------------------------

    def _build_group_path(self, group: str, limit: int) -> Optional[str]:
        if group not in KNOWN_GROUPS:
            return None
        if group == "active":
            return (f"/basicspacedata/query/class/gp/OBJECT_TYPE/PAYLOAD/"
                    f"decay_date/null-val/orderby/NORAD_CAT_ID/limit/{limit}/format/json")
        if group == "starlink":
            return (f"/basicspacedata/query/class/gp/OBJECT_NAME/~~STARLINK/"
                    f"decay_date/null-val/orderby/NORAD_CAT_ID/limit/{limit}/format/json")
        if group in ("analyst", "debris"):
            return (f"/basicspacedata/query/class/gp/OBJECT_TYPE/DEBRIS/"
                    f"decay_date/null-val/orderby/NORAD_CAT_ID/limit/{limit}/format/json")
        return None

    @_retry(HTTP_MAX_ATTEMPTS, HTTP_BASE_DELAY, HTTP_MAX_DELAY,
            retry_on=(httpx.RequestError, httpx.HTTPStatusError))
    def _send_request(self, url: str) -> List[Dict[str, Any]]:
        logger.debug(f"[SpaceTrack] GET {url}")
        resp = self.client.get(url)
        resp.raise_for_status()
        data = resp.json()
        if not isinstance(data, list):
            self._reset_auth()
            logger.warning(f"[SpaceTrack] Unexpected response type {type(data)} — resetting auth")
            raise ValueError(f"Unexpected Space-Track response type: {type(data)}")
        logger.debug(f"[SpaceTrack] Response: {len(data)} records")
        return data

    def fetch_group_json(self, group: str, limit: int = 500) -> List[Dict[str, Any]]:
        path = self._build_group_path(group, limit)
        if not path:
            logger.warning(f"[SpaceTrack] Unknown group '{group}' — no query path defined")
            return []

        if not self.authenticate():
            logger.warning(f"[SpaceTrack] Skipping fetch for group '{group}' — not authenticated")
            return []

        try:
            data = self._send_request(f"{self.base_url}{path}")
            logger.info(f"[SpaceTrack] Fetched {len(data)} records for group '{group}'")
            return data
        except httpx.HTTPStatusError as exc:
            logger.error(f"[SpaceTrack] HTTP {exc.response.status_code} for group '{group}': {exc}")
            return []
        except httpx.RequestError as exc:
            logger.error(f"[SpaceTrack] Network error for group '{group}': {exc}")
            return []
        except Exception as exc:
            logger.error(f"[SpaceTrack] Fetch failed for group '{group}': {exc}", exc_info=True)
            return []

    def fetch_by_catalog_json(self, catalog_number: str) -> Optional[Dict[str, Any]]:
        if not self.authenticate():
            return None
        url = (f"{self.base_url}/basicspacedata/query/class/gp/NORAD_CAT_ID/"
               f"{catalog_number}/format/json")
        try:
            data = self._send_request(url)
            result = data[0] if data else None
            if result:
                logger.info(f"[SpaceTrack] fetch_by_catalog({catalog_number}): found record")
            else:
                logger.warning(f"[SpaceTrack] fetch_by_catalog({catalog_number}): no record found")
            return result
        except Exception as exc:
            logger.error(f"[SpaceTrack] fetch_by_catalog({catalog_number}) failed: {exc}")
            return None

    # ------------------------------------------------------------------
    # Transform GP record -> dict for ORM
    # ------------------------------------------------------------------

    def _gp_to_doc(
        self,
        rec: Dict[str, Any],
        object_type_override: Optional[str] = None,
        source: str = "space-track",
    ) -> Dict[str, Any]:
        norad_id     = str(rec.get("NORAD_CAT_ID", "")).strip()
        object_name  = rec.get("OBJECT_NAME", f"OBJ-{norad_id}").strip()
        raw_type     = rec.get("OBJECT_TYPE", "UNKNOWN")
        object_type  = object_type_override or _TYPE_MAP.get(raw_type, "UNKNOWN")
        mean_motion  = float(rec.get("MEAN_MOTION", 0) or 0)
        inclination  = float(rec.get("INCLINATION", 0) or 0)
        eccentricity = float(rec.get("ECCENTRICITY", 0) or 0)
        semimajor    = _semimajor_axis_from_mean_motion(mean_motion)
        period       = (1440.0 / mean_motion) if mean_motion > 0 else None
        epoch        = _parse_epoch(rec.get("EPOCH", ""))
        tle1         = rec.get("TLE_LINE1") or rec.get("LINE1")
        tle2         = rec.get("TLE_LINE2") or rec.get("LINE2")
        now          = datetime.datetime.now(datetime.timezone.utc)

        if not norad_id:
            logger.warning(f"[SpaceTrack] Record missing NORAD_CAT_ID: {rec.get('OBJECT_NAME', '?')}")

        return {
            "noradId":          norad_id,
            "objectName":       object_name,
            "objectType":       object_type,
            "countryCode":      rec.get("COUNTRY_CODE", ""),
            "launchDate":       rec.get("LAUNCH_DATE", ""),
            "epoch":            epoch,
            "inclination":      inclination,
            "eccentricity":     eccentricity,
            "meanMotion":       mean_motion,
            "source":           source,
            "updatedAt":        now,
            "semimajor_axis":   semimajor,
            "period":           period,
            "tle_line1":        tle1,
            "tle_line2":        tle2,
            "status":           "ACTIVE",
            "fuel_percentage":  100.0,
            "operational_mode": "NORMAL",
        }

    # ------------------------------------------------------------------
    # PostgreSQL upsert
    # ------------------------------------------------------------------

    def _bulk_upsert(
        self, db: Session, is_debris: bool, docs: List[Dict[str, Any]]
    ) -> Tuple[int, int, List[str], List[str]]:
        """
        Upsert using PostgreSQL INSERT ... ON CONFLICT (noradId) DO UPDATE SET ...
        Falls back to individual merge for non-PostgreSQL dialects (e.g. SQLite in tests).

        Returns (inserted, updated, failed_ids, skipped_ids).
        Skipped ids are records that already exist and were updated in place.
        """
        if not docs:
            return 0, 0, [], []

        model = Debris if is_debris else Satellite
        model_cols = {c.name for c in model.__table__.columns}
        failed: List[str] = []
        inserted = 0
        updated = 0

        dialect = db.bind.dialect.name if db.bind else "postgresql"

        if dialect == "postgresql":
            filtered_docs = []
            for doc in docs:
                filtered_docs.append({k: v for k, v in doc.items() if k in model_cols})
            try:
                stmt = pg_insert(model).values(filtered_docs)
                update_cols = {
                    c.name: c
                    for c in stmt.excluded
                    if c.name not in ("id", "noradId", "createdAt")
                }
                stmt = stmt.on_conflict_do_update(
                    index_elements=["noradId"],
                    set_=update_cols,
                )
                result = db.execute(stmt)
                db.commit()
                inserted = result.rowcount
            except Exception as exc:
                db.rollback()
                logger.error(f"[SpaceTrack] Bulk upsert failed: {exc}", exc_info=True)
                failed = [d.get("noradId", "?") for d in docs]
        else:
            for doc in docs:
                try:
                    safe_doc = {k: v for k, v in doc.items() if k in model_cols}
                    existing = db.query(model).filter(model.noradId == doc["noradId"]).first()
                    if existing:
                        for k, v in safe_doc.items():
                            if k not in ("id", "noradId", "createdAt") and hasattr(existing, k):
                                setattr(existing, k, v)
                        updated += 1
                    else:
                        db.add(model(**safe_doc))
                        inserted += 1
                except Exception as exc:
                    logger.warning(f"[SpaceTrack] Row upsert failed for {doc.get('noradId')}: {exc}")
                    failed.append(doc.get("noradId", "?"))
            db.commit()

        logger.info(
            f"[SpaceTrack] {model.__tablename__} upsert: "
            f"{inserted} inserted, {updated} updated, "
            f"{len(failed)} failed, {len(docs) - inserted - updated - len(failed)} skipped"
        )
        return inserted, updated, failed, []

    def _ensure_db_connection(self, db: Session) -> bool:
        try:
            db.execute(__import__("sqlalchemy").text("SELECT 1"))
            logger.debug("[SpaceTrack] Database connection OK")
            return True
        except Exception as exc:
            logger.error(f"[SpaceTrack] Database unreachable: {exc}", exc_info=True)
            return False

    # ------------------------------------------------------------------
    # Public sync API
    # ------------------------------------------------------------------

    def sync_group(
        self,
        db: Session,
        group: str,
        object_type_override: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> Dict[str, Any]:
        logger.info(f"[SpaceTrack] Starting sync for group '{group}' (limit={limit or 500})")

        if not self._ensure_db_connection(db):
            logger.error(f"[SpaceTrack] DB unreachable for group '{group}'")
            return {"group": group, "fetched": 0, "parsed": 0, "upserted": 0,
                    "inserted": 0, "updated": 0,
                    "failed": 0, "source": None, "errors": ["db_unreachable"]}

        # Check authentication
        if not self.authenticate():
            logger.warning(f"[SpaceTrack] Not authenticated for group '{group}' — falling through provider chain")

        try:
            records, source = self.providers.fetch_group(group, limit or 500, db=db)
            logger.info(f"[SpaceTrack] Group '{group}': fetched {len(records)} records from '{source}'")
        except AllProvidersFailedError as exc:
            logger.error(f"[SpaceTrack] All providers failed for group '{group}': {exc.failures}")
            return {
                "group": group, "fetched": 0, "parsed": 0, "upserted": 0,
                "inserted": 0, "updated": 0,
                "failed": 0, "source": None,
                "errors": ["all_providers_failed"], "provider_failures": exc.failures,
            }

        is_debris = (object_type_override == "DEBRIS" or group in ("analyst", "debris"))
        docs: List[Dict[str, Any]] = []
        parse_errors: List[str] = []

        for rec in records:
            try:
                doc = self._gp_to_doc(rec, object_type_override, source=source)
                if doc.get("noradId"):
                    docs.append(doc)
                else:
                    parse_errors.append(str(rec.get("NORAD_CAT_ID", "?")))
            except Exception as exc:
                parse_errors.append(f"{rec.get('NORAD_CAT_ID', '?')}:{exc}")

        try:
            inserted, updated, failed_ids, _ = self._bulk_upsert(db, is_debris, docs)
            total_upserted = inserted + updated
            total_failed = len(failed_ids) + len(parse_errors)
            logger.info(
                f"[SpaceTrack] Group '{group}' — fetched={len(records)}, "
                f"parsed={len(docs)}, inserted={inserted}, updated={updated}, "
                f"failed={total_failed}, source={source}"
            )
            return {
                "group": group, "fetched": len(records), "parsed": len(docs),
                "upserted": total_upserted, "inserted": inserted, "updated": updated,
                "failed": total_failed, "source": source,
                "errors": failed_ids + parse_errors,
            }
        except Exception as exc:
            logger.error(f"[Ingest] Upsert failure for '{group}': {exc}", exc_info=True)
            return {
                "group": group, "fetched": len(records), "parsed": len(docs),
                "upserted": 0, "inserted": 0, "updated": 0,
                "failed": len(docs) + len(parse_errors),
                "source": source, "errors": [str(exc)] + parse_errors,
            }

    def sync_all_groups(self, db: Session, limit_per_group: int = 500) -> Dict[str, Any]:
        per_group: Dict[str, Any] = {}
        total_fetched = total_upserted = total_failed = total_inserted = total_updated = 0

        for group, type_override, _ in SYNC_GROUPS:
            status = self.sync_group(db, group, type_override, limit=limit_per_group)
            per_group[group] = status
            total_fetched   += status["fetched"]
            total_upserted  += status.get("upserted", 0)
            total_inserted  += status.get("inserted", 0)
            total_updated   += status.get("updated", 0)
            total_failed    += status["failed"]

        logger.info(
            f"[SpaceTrack] Sync complete — "
            f"fetched={total_fetched}, inserted={total_inserted}, "
            f"updated={total_updated}, failed={total_failed}"
        )

        return {
            "total_fetched":   total_fetched,
            "total_upserted":  total_upserted,
            "total_inserted":  total_inserted,
            "total_updated":   total_updated,
            "total_failed":    total_failed,
            "groups":          per_group,
        }

    def sync_by_catalog(self, db: Session, catalog_number: str) -> Optional[Dict]:
        rec = self.fetch_by_catalog_json(catalog_number)
        if not rec:
            return None
        obj_type  = _TYPE_MAP.get(rec.get("OBJECT_TYPE", "UNKNOWN"), "UNKNOWN")
        is_debris = obj_type == "DEBRIS"
        doc       = self._gp_to_doc(rec, obj_type)
        try:
            inserted, updated, failed_ids, _ = self._bulk_upsert(db, is_debris, [doc])
            if failed_ids:
                logger.error(f"[SpaceTrack] Single upsert failed for {catalog_number}: {failed_ids}")
            else:
                logger.info(
                    f"[SpaceTrack] sync_by_catalog({catalog_number}): "
                    f"{'inserted' if inserted else 'updated'}"
                )
        except Exception as exc:
            logger.error(f"[SpaceTrack] Single upsert failed for {catalog_number}: {exc}", exc_info=True)
        model = Debris if is_debris else Satellite
        return db.query(model).filter(model.noradId == catalog_number).first()

    def get_stats(self, db: Session) -> Dict[str, Any]:
        try:
            sat_total  = db.query(Satellite).count()
            payload_ct = db.query(Satellite).filter(Satellite.objectType == "PAYLOAD").count()
            debris_ct  = db.query(Debris).count()
            rocket_ct  = db.query(Satellite).filter(Satellite.objectType == "ROCKET_BODY").count()
            unknown_ct = db.query(Satellite).filter(Satellite.objectType == "UNKNOWN").count()
            return {
                "total":         sat_total + debris_ct,
                "payloads":      payload_ct,
                "debris":        debris_ct,
                "rocket_bodies": rocket_ct,
                "unknown":       unknown_ct,
                "last_sync":     datetime.datetime.utcnow().isoformat(),
            }
        except Exception as exc:
            logger.error(f"[SpaceTrack] get_stats failed: {exc}")
            return {"total": 0, "payloads": 0, "debris": 0, "rocket_bodies": 0, "unknown": 0}


spacetrack_service = SpaceTrackService()
