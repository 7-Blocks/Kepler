"""
Space-Track Live Data Service
==============================
Fetches real GP (General Perturbations) data from Space-Track.org and persists it
into MongoDB using duplicate-safe bulk upserts keyed on the NORAD catalog id.

Pipeline stages (each emits a structured log line):
    authentication -> request sent -> response received -> records fetched
    -> json parsing -> db connection -> upsert start -> upsert success / failure
    -> pipeline completion

Fixes for GitHub Issue #10 ("Satellite records not being persisted"):
  * Uses bulk_write([UpdateOne(filter, {"$set": doc}, upsert=True)]) so reruns
    never create duplicates (keyed on noradId, which has a unique index).
  * Exponential backoff retry for both Space-Track HTTP requests and MongoDB
    bulk writes (network/transient errors only).
  * Structured logging at every pipeline stage; no silent failures.
  * Per-group partial-failure isolation: one bad record/batch does not abort
    the rest of the ingestion.
  * Ingestion functions return a meaningful status dict.
"""

import httpx
import math
import time
import datetime
import logging
from typing import List, Dict, Any, Optional, Tuple

import pymongo
from pymongo import UpdateOne
from pymongo.errors import (
    BulkWriteError,
    ConnectionFailure,
    ServerSelectionTimeoutError,
    NetworkTimeout,
    OperationFailure,
)

from database.session import MongoSession
from app.core.config import settings
from orbital.providers import AllProvidersFailedError, ProviderChain, build_provider_chain

logger = logging.getLogger("app")

# Retry configuration -------------------------------------------------------
HTTP_MAX_ATTEMPTS = 4
HTTP_BASE_DELAY = 2.0          # seconds
HTTP_MAX_DELAY = 30.0
MONGO_MAX_ATTEMPTS = 3
MONGO_BASE_DELAY = 1.5
MONGO_MAX_DELAY = 15.0


def _retry(max_attempts: int, base_delay: float, max_delay: float, retry_on):
    """Decorator: retry the wrapped callable with exponential backoff."""
    def decorator(fn):
        def wrapper(*args, **kwargs):
            last_exc: Optional[BaseException] = None
            for attempt in range(1, max_attempts + 1):
                try:
                    return fn(*args, **kwargs)
                except retry_on as exc:  # type: ignore[misc]
                    last_exc = exc
                    if attempt >= max_attempts:
                        break
                    delay = min(base_delay * (2 ** (attempt - 1)), max_delay)
                    logger.warning(
                        f"[SpaceTrack] Retry {attempt}/{max_attempts} for "
                        f"{fn.__name__} after {delay:.1f}s — {exc}"
                    )
                    time.sleep(delay)
            logger.error(
                f"[SpaceTrack] {fn.__name__} failed after {max_attempts} "
                f"attempts: {last_exc}"
            )
            raise last_exc  # type: ignore[misc]
        return wrapper
    return decorator


# ---------------------------------------------------------------------------
# Sync group definitions: (group_name, objectType value in Mongo, description)
# ---------------------------------------------------------------------------
SYNC_GROUPS = [
    ("active",   "PAYLOAD", "Tracked active satellites"),
    ("starlink", "PAYLOAD", "Starlink constellation"),
    ("analyst",  "DEBRIS",  "Analyst debris objects"),
]

# Every group `_build_group_path` knows how to query, including the "debris" alias for
# "analyst". The API layer validates against this so an unknown group is rejected with a
# 422 instead of silently returning zero records.
KNOWN_GROUPS = ("active", "starlink", "analyst", "debris")


_TYPE_MAP = {
    "PAYLOAD":      "PAYLOAD",
    "ROCKET BODY":  "ROCKET_BODY",
    "DEBRIS":       "DEBRIS",
    "UNKNOWN":      "UNKNOWN",
}


def _semimajor_axis_from_mean_motion(mean_motion_revday: float) -> float:
    """Convert mean motion (rev/day) to semi-major axis (km)."""
    if mean_motion_revday <= 0:
        return 6778.0
    n_rads = mean_motion_revday * 2 * math.pi / 86400.0
    return (398600.4418 / (n_rads ** 2)) ** (1.0 / 3.0)


def _parse_epoch(epoch_str: str) -> Optional[str]:
    """Return ISO string or None — store as string in Mongo."""
    try:
        dt = datetime.datetime.fromisoformat(epoch_str.replace("Z", ""))
        return dt.isoformat()
    except Exception:
        return None


class SpaceTrackService:
    """
    Production Space-Track GP data service.
    Writes directly into MongoDB collections via MongoSession.
    """

    def __init__(self):
        self.username = settings.SPACETRACK_USERNAME
        self.password = settings.SPACETRACK_PASSWORD
        self.base_url = "https://www.space-track.org"
        self.client   = httpx.Client(timeout=60.0, follow_redirects=True)
        self._authenticated = False
        self._providers: Optional["ProviderChain"] = None

    @property
    def providers(self) -> "ProviderChain":
        """
        The multi-source failover chain (Space-Track -> CelesTrak -> cache).

        Built on first use rather than in __init__ so that tests can substitute a chain,
        and so importing this module never constructs HTTP clients. `getattr` keeps this
        working for instances created via `__new__` (as the ingestion tests do).
        """
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
        """Authenticate with Space-Track. Returns True on success."""
        if self._authenticated:
            logger.info("[SpaceTrack] Authentication: already authenticated (cached session).")
            return True

        if not self.username or not self.password:
            logger.warning(
                "SPACETRACK_USERNAME / SPACETRACK_PASSWORD not set — "
                "Space-Track calls will be skipped."
            )
            return False

        try:
            logger.info(f"[SpaceTrack] Authentication: logging in as '{self.username}' …")
            resp = self.client.post(
                f"{self.base_url}/ajaxauth/login",
                data={"identity": self.username, "password": self.password},
            )
            logger.info(
                f"[SpaceTrack] Authentication response: HTTP {resp.status_code}, "
                f"cookies={list(self.client.cookies.keys())}"
            )
            if resp.status_code == 200 and "spacetrack_session" in self.client.cookies:
                self._authenticated = True
                logger.info("[SpaceTrack] Authentication: ✅ successful.")
                return True

            logger.error(
                f"[SpaceTrack] Authentication: ❌ failed — HTTP {resp.status_code}. "
                f"Body preview: {resp.text[:300]}"
            )
            return False
        except Exception as exc:
            logger.error(f"[SpaceTrack] Authentication: ❌ exception: {exc}")
            return False

    def _reset_auth(self):
        """Force re-authentication on next call (e.g. session expired)."""
        self._authenticated = False

    # ------------------------------------------------------------------
    # Raw API fetch (with exponential backoff)
    # ------------------------------------------------------------------

    def _build_group_path(self, group: str, limit: int) -> Optional[str]:
        if group not in KNOWN_GROUPS:
            logger.warning(f"[SpaceTrack] Unknown group '{group}'.")
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
        logger.warning(f"[SpaceTrack] Unknown group '{group}'.")
        return None

    @_retry(
        HTTP_MAX_ATTEMPTS,
        HTTP_BASE_DELAY,
        HTTP_MAX_DELAY,
        retry_on=(httpx.RequestError, httpx.HTTPStatusError),
    )
    def _send_request(self, url: str, expect_list: bool = True) -> List[Dict[str, Any]]:
        """Send a GET request with retry/backoff. Raises on persistent failure."""
        logger.info(f"[SpaceTrack] Request sent: GET {url}")
        resp = self.client.get(url)
        resp.raise_for_status()
        data = resp.json()
        if expect_list and not isinstance(data, list):
            logger.error(
                f"[SpaceTrack] Response received but unexpected type {type(data)} — "
                f"preview: {str(data)[:300]}"
            )
            self._reset_auth()
            raise ValueError(f"Unexpected Space-Track response type: {type(data)}")
        logger.info(
            f"[SpaceTrack] Response received: {len(data) if isinstance(data, list) else '?'} "
            f"records (HTTP {resp.status_code})."
        )
        return data  # type: ignore[return-value]

    def fetch_group_json(self, group: str, limit: int = 500) -> List[Dict[str, Any]]:
        """Fetch a named group from Space-Track. Returns list of GP records."""
        if not self.authenticate():
            logger.error(f"[SpaceTrack] Cannot fetch group '{group}' — auth failed.")
            return []

        path = self._build_group_path(group, limit)
        if not path:
            return []

        url = f"{self.base_url}{path}"
        try:
            data = self._send_request(url, expect_list=True)
            logger.info(
                f"[SpaceTrack] Records fetched for '{group}': {len(data)}. "
                f"First record keys: {list(data[0].keys()) if data else 'N/A'}"
            )
            return data
        except httpx.HTTPStatusError as exc:
            logger.error(
                f"[SpaceTrack] HTTP {exc.response.status_code} for group '{group}': "
                f"{exc.response.text[:300]}"
            )
            self._reset_auth()
            return []
        except Exception as exc:
            logger.error(f"[SpaceTrack] Fetch failed for group '{group}': {exc}")
            return []

    def fetch_by_catalog_json(self, catalog_number: str) -> Optional[Dict[str, Any]]:
        """Fetch a single object by NORAD catalog number."""
        if not self.authenticate():
            return None
        url = (f"{self.base_url}/basicspacedata/query/class/gp/NORAD_CAT_ID/"
               f"{catalog_number}/format/json")
        try:
            data = self._send_request(url, expect_list=True)
            return data[0] if data else None
        except Exception as exc:
            logger.error(f"[SpaceTrack] fetch_by_catalog({catalog_number}) failed: {exc}")
            return None

    # ------------------------------------------------------------------
    # Transform GP record -> MongoDB document (correct camelCase field names)
    # ------------------------------------------------------------------

    def _gp_to_satellite_doc(
        self,
        rec: Dict[str, Any],
        object_type_override: Optional[str] = None,
        source: str = "space-track",
    ) -> Dict[str, Any]:
        """
        Map a GP/OMM JSON record to a MongoDB satellite/debris document.

        Every provider speaks this same CCSDS field vocabulary, so the transform is shared;
        `source` records which one actually served the record.

        Field names match the MongoDB Satellite/SpaceObject schema (camelCase):
        noradId, objectName, objectType, meanMotion …  Writing snake_case names
        earlier left the collections empty because nothing matched the schema.
        """
        norad_id     = str(rec.get("NORAD_CAT_ID", "")).strip()
        object_name  = rec.get("OBJECT_NAME", f"OBJ-{norad_id}").strip()
        raw_type     = rec.get("OBJECT_TYPE", "UNKNOWN")
        object_type  = object_type_override or _TYPE_MAP.get(raw_type, "UNKNOWN")

        mean_motion  = float(rec.get("MEAN_MOTION", 0) or 0)
        inclination  = float(rec.get("INCLINATION", 0) or 0)
        eccentricity = float(rec.get("ECCENTRICITY", 0) or 0)
        raan         = float(rec.get("RA_OF_ASC_NODE", 0) or 0)
        arg_perigee  = float(rec.get("ARG_OF_PERICENTER", 0) or 0)
        mean_anomaly = float(rec.get("MEAN_ANOMALY", 0) or 0)
        semimajor    = _semimajor_axis_from_mean_motion(mean_motion)
        period       = (1440.0 / mean_motion) if mean_motion > 0 else None
        epoch        = _parse_epoch(rec.get("EPOCH", ""))

        tle1 = rec.get("TLE_LINE1") or rec.get("LINE1")
        tle2 = rec.get("TLE_LINE2") or rec.get("LINE2")

        now = datetime.datetime.utcnow().isoformat()

        return {
            "noradId":      norad_id,           # unique key (unique index exists)
            "objectName":   object_name,
            "objectType":   object_type,
            "countryCode":  rec.get("COUNTRY_CODE", ""),
            "launchDate":   rec.get("LAUNCH_DATE", ""),
            "epoch":        epoch,
            "inclination":  inclination,
            "eccentricity": eccentricity,
            "meanMotion":   mean_motion,
            "source":       source,
            "createdAt":    now,
            "updatedAt":    now,
            "semimajor_axis":  semimajor,
            "period":          period,
            "raan":            raan,
            "arg_of_perigee":  arg_perigee,
            "mean_anomaly":    mean_anomaly,
            "tle_line1":       tle1,
            "tle_line2":       tle2,
            "status":           "ACTIVE",
            "fuel_percentage":  100.0,
            "operational_mode": "NORMAL",
        }

    # ------------------------------------------------------------------
    # MongoDB write (bulk_write + UpdateOne upsert, with backoff retry)
    # ------------------------------------------------------------------

    def _ensure_db_connection(self, db: MongoSession) -> bool:
        """Verify the Mongo client can reach the server; log the result."""
        try:
            logger.info("[SpaceTrack] Database connection: pinging MongoDB …")
            db.client.admin.command("ping")
            logger.info("[SpaceTrack] Database connection: ✅ reachable.")
            return True
        except Exception as exc:
            logger.error(f"[SpaceTrack] Database connection: ❌ unreachable: {exc}")
            return False

    @_retry(
        MONGO_MAX_ATTEMPTS,
        MONGO_BASE_DELAY,
        MONGO_MAX_DELAY,
        retry_on=(ConnectionFailure, ServerSelectionTimeoutError, NetworkTimeout, OperationFailure),
    )
    def _bulk_upsert(
        self, db: MongoSession, collection: str, docs: List[Dict[str, Any]]
    ) -> Tuple[int, List[str]]:
        """
        Duplicate-safe bulk upsert using UpdateOne(upsert=True) keyed on noradId.
        Returns (successful_writes, failed_norad_ids).
        ordered=False so a single bad document does not abort the batch.
        """
        ops = [
            UpdateOne({"noradId": d["noradId"]}, {"$set": d}, upsert=True)
            for d in docs
        ]
        try:
            result = db.db[collection].bulk_write(ops, ordered=False)
            written = (result.upserted_count or 0) + (result.modified_count or 0)
            logger.info(
                f"[SpaceTrack] Bulk write OK on '{collection}': {written} "
                f"upserted/modified (matched={result.matched_count})."
            )
            return written, []
        except BulkWriteError as exc:
            details = exc.details or {}
            write_errors = details.get("writeErrors", [])
            failed_ids = [str(e.get("key", {}).get("noradId", "?")) for e in write_errors]
            written = (details.get("nUpserted", 0) or 0) + (details.get("nModified", 0) or 0)
            logger.error(
                f"[SpaceTrack] Bulk write partial failure on '{collection}': "
                f"{written} written, {len(failed_ids)} failed — {failed_ids[:10]}"
            )
            return written, failed_ids
        except (ConnectionFailure, ServerSelectionTimeoutError, NetworkTimeout, OperationFailure):
            # Let the retry decorator handle transient Mongo errors.
            raise
        except Exception as exc:
            logger.error(f"[SpaceTrack] Bulk write unexpected error on '{collection}': {exc}")
            raise

    # ------------------------------------------------------------------
    # Public sync API
    # ------------------------------------------------------------------

    def sync_group(
        self,
        db: MongoSession,
        group: str,
        object_type_override: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Fetch a group and bulk-upsert all records into MongoDB.
        Returns a meaningful status dict:
            {group, fetched, parsed, upserted, failed, errors}
        """
        if not self._ensure_db_connection(db):
            return {"group": group, "fetched": 0, "parsed": 0, "upserted": 0,
                    "failed": 0, "source": None, "errors": ["db_unreachable"]}

        logger.info(f"[Ingest] Upsert start: group '{group}'.")

        # Ask the provider chain rather than Space-Track directly: if Space-Track is down
        # we fall through to CelesTrak, then to the last cached payload (issue #15).
        try:
            records, source = self.providers.fetch_group(group, limit or 500, db=db)
        except AllProvidersFailedError as exc:
            logger.error(f"[Ingest] Upsert aborted for '{group}': every provider failed.")
            return {
                "group": group, "fetched": 0, "parsed": 0, "upserted": 0, "failed": 0,
                "source": None,
                "errors": ["all_providers_failed"],
                "provider_failures": exc.failures,
            }

        logger.info(
            f"[Ingest] JSON parsing: building docs for {len(records)} records "
            f"from '{source}' …"
        )
        is_debris = (object_type_override == "DEBRIS" or group in ("analyst", "debris"))
        collection = "debris" if is_debris else "satellites"

        docs: List[Dict[str, Any]] = []
        parse_errors: List[str] = []
        for rec in records:
            try:
                doc = self._gp_to_satellite_doc(rec, object_type_override, source=source)
                if doc.get("noradId"):
                    docs.append(doc)
                else:
                    parse_errors.append(str(rec.get("NORAD_CAT_ID", "?")))
            except Exception as exc:
                parse_errors.append(f"{rec.get('NORAD_CAT_ID', '?')}:{exc}")

        logger.info(
            f"[Ingest] Upsert start: writing {len(docs)} docs to '{collection}' "
            f"({len(parse_errors)} unparseable)."
        )
        try:
            upserted, failed_ids = self._bulk_upsert(db, collection, docs)
            logger.info(
                f"[Ingest] ✅ Upsert success: group '{group}' via '{source}' — "
                f"{upserted} written, {len(failed_ids)} failed."
            )
            return {
                "group": group,
                "fetched": len(records),
                "parsed": len(docs),
                "upserted": upserted,
                "failed": len(failed_ids) + len(parse_errors),
                "source": source,
                "errors": failed_ids + parse_errors,
            }
        except Exception as exc:
            logger.error(f"[Ingest] ❌ Upsert failure: group '{group}': {exc}")
            return {
                "group": group,
                "fetched": len(records),
                "parsed": len(docs),
                "upserted": 0,
                "failed": len(docs) + len(parse_errors),
                "source": source,
                "errors": [str(exc)] + parse_errors,
            }

    def sync_all_groups(self, db: MongoSession, limit_per_group: int = 500) -> Dict[str, Any]:
        """Sync all configured groups. Returns an aggregate status dict."""
        logger.info("[SpaceTrack] Pipeline start: syncing all groups.")
        per_group: Dict[str, Any] = {}
        total_fetched = total_upserted = total_failed = 0

        for group, type_override, desc in SYNC_GROUPS:
            logger.info(f"[SpaceTrack] ── Syncing: {group} ({desc})")
            status = self.sync_group(db, group, type_override, limit=limit_per_group)
            per_group[group] = status
            total_fetched += status["fetched"]
            total_upserted += status["upserted"]
            total_failed += status["failed"]

        logger.info(
            f"[SpaceTrack] 🏁 Pipeline complete: {total_upserted} upserted, "
            f"{total_failed} failed, {total_fetched} fetched. Details: {per_group}"
        )
        return {
            "total_fetched": total_fetched,
            "total_upserted": total_upserted,
            "total_failed": total_failed,
            "groups": per_group,
        }

    def sync_by_catalog(self, db: MongoSession, catalog_number: str) -> Optional[Dict]:
        """Fetch and upsert a single object by catalog number. Returns the doc."""
        rec = self.fetch_by_catalog_json(catalog_number)
        if not rec:
            return None
        obj_type = _TYPE_MAP.get(rec.get("OBJECT_TYPE", "UNKNOWN"), "UNKNOWN")
        collection = "debris" if obj_type == "DEBRIS" else "satellites"
        doc = self._gp_to_satellite_doc(rec, obj_type)
        try:
            self._bulk_upsert(db, collection, [doc])
            logger.info(f"[SpaceTrack] ✅ Upserted single catalog {catalog_number}.")
        except Exception as exc:
            logger.error(f"[SpaceTrack] ❌ Single upsert failed for {catalog_number}: {exc}")
        return db.db[collection].find_one({"noradId": catalog_number}, {"_id": 0})

    def get_stats(self, db: MongoSession) -> Dict[str, Any]:
        """Return satellite/debris count statistics from MongoDB."""
        try:
            sat_total   = db.db["satellites"].count_documents({})
            payload_ct  = db.db["satellites"].count_documents({"objectType": "PAYLOAD"})
            debris_ct   = db.db["debris"].count_documents({})
            rocket_ct   = db.db["satellites"].count_documents({"objectType": "ROCKET_BODY"})
            unknown_ct  = db.db["satellites"].count_documents({"objectType": "UNKNOWN"})

            logger.info(
                f"[SpaceTrack] DB stats — satellites: {sat_total}, "
                f"payload: {payload_ct}, debris: {debris_ct}, "
                f"rocket_bodies: {rocket_ct}, unknown: {unknown_ct}"
            )
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
            return {"total": 0, "payloads": 0, "debris": 0,
                    "rocket_bodies": 0, "unknown": 0}


spacetrack_service = SpaceTrackService()