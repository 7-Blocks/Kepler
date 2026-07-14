"""
/api/v1/catalog — Live Orbital Catalog Endpoints
Exposes Space-Track data: satellites, debris, rocket bodies, and manual sync triggers.

Bug Fixes Applied:
  - Queries now go directly to MongoDB collections ("satellites", "debris") using
    db.db[collection] instead of the broken ORM wrapper that used wrong field names.
  - _serialize_space_object now reads camelCase Mongo field names correctly.
"""

from fastapi import APIRouter, Depends, Query, BackgroundTasks
from typing import List, Optional, Dict, Any
import datetime
import re

from database.session import get_db, MongoSession
from app.core.exceptions import (
    ExternalServiceError,
    NotFoundError,
    ServiceUnavailableError,
    ValidationError,
)
from schemas.api_schemas import APIResponse, PaginationSchema
from orbital.spacetrack import spacetrack_service, KNOWN_GROUPS, SYNC_GROUPS

router = APIRouter()

VALID_CLASSIFICATIONS = ("PAYLOAD", "DEBRIS", "ROCKET_BODY", "UNKNOWN")


def _validate_group(group: str) -> None:
    """Reject an unknown Space-Track group before we waste a round-trip on it."""
    if group not in KNOWN_GROUPS:
        raise ValidationError(
            f"'{group}' is not a known Space-Track group.",
            details={"field": "group", "value": group, "allowed": list(KNOWN_GROUPS)},
        )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _serialize_doc(doc: dict) -> Dict[str, Any]:
    """Serialize a raw MongoDB satellite/debris document for the API response."""
    epoch = doc.get("epoch")
    updated = doc.get("updatedAt") or doc.get("updated_at")
    return {
        "id":             str(doc.get("id") or doc.get("_id", "")),
        "name":           doc.get("objectName") or doc.get("name", ""),
        "catalog_number": doc.get("noradId") or doc.get("catalog_number", ""),
        "cospar_id":      doc.get("cospar_id"),
        "classification": doc.get("objectType") or doc.get("classification", "UNKNOWN"),
        "epoch":          epoch if isinstance(epoch, str) else (epoch.isoformat() if epoch else None),
        "inclination":    doc.get("inclination"),
        "eccentricity":   doc.get("eccentricity"),
        "semimajor_axis": doc.get("semimajor_axis"),
        "raan":           doc.get("raan"),
        "arg_of_perigee": doc.get("arg_of_perigee"),
        "mean_anomaly":   doc.get("mean_anomaly"),
        "mean_motion":    doc.get("meanMotion") or doc.get("mean_motion"),
        "period":         doc.get("period"),
        "has_tle":        bool(doc.get("tle_line1") and doc.get("tle_line2")),
        "updated_at":     updated if isinstance(updated, str) else (updated.isoformat() if updated else None),
    }


def _build_filter(classification: Optional[str], search: Optional[str]) -> dict:
    f = {}
    if classification:
        f["objectType"] = classification.upper()
    if search:
        pattern = re.compile(re.escape(search), re.IGNORECASE)
        f["$or"] = [{"objectName": pattern}, {"noradId": pattern}]
    return f


# ---------------------------------------------------------------------------
# GET /catalog/objects
# ---------------------------------------------------------------------------

@router.get("/objects", response_model=APIResponse[List[Dict[str, Any]]])
def list_space_objects(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=500),
    classification: Optional[str] = Query(None, description="PAYLOAD | DEBRIS | ROCKET_BODY | UNKNOWN"),
    search: Optional[str] = Query(None),
    db: MongoSession = Depends(get_db),
):
    """List all tracked space objects from MongoDB (satellites + debris merged view)."""
    if classification and classification.upper() not in VALID_CLASSIFICATIONS:
        raise ValidationError(
            f"'{classification}' is not a valid object classification.",
            details={
                "field": "classification",
                "value": classification,
                "allowed": list(VALID_CLASSIFICATIONS),
            },
        )

    flt = _build_filter(classification, search)

    # Query both collections
    sat_col   = db.db["satellites"]
    debris_col = db.db["debris"]

    # Determine which collections to query based on classification
    if classification and classification.upper() == "DEBRIS":
        collections = [debris_col]
    elif classification and classification.upper() in ("PAYLOAD", "ROCKET_BODY"):
        collections = [sat_col]
    else:
        collections = [sat_col, debris_col]

    all_docs: List[dict] = []
    for col in collections:
        col_filter = dict(flt)
        if not classification and col == debris_col:
            col_filter["objectType"] = "DEBRIS"
        docs = list(col.find(col_filter, {"_id": 0}))
        all_docs.extend(docs)

    total = len(all_docs)
    offset = (page - 1) * size
    page_docs = all_docs[offset: offset + size]
    pages = (total + size - 1) // size if total else 1

    data = [_serialize_doc(d) for d in page_docs]

    return APIResponse(
        success=True,
        message=f"Orbital catalog — {total} objects tracked",
        data=data,
        pagination=PaginationSchema(page=page, size=size, total=total, pages=pages),
    )


# ---------------------------------------------------------------------------
# GET /catalog/objects/{catalog_number}
# ---------------------------------------------------------------------------

@router.get("/objects/{catalog_number}", response_model=APIResponse[Dict[str, Any]])
def get_space_object(catalog_number: str, db: MongoSession = Depends(get_db)):
    """Get a single space object by NORAD catalog number."""
    doc = db.db["satellites"].find_one({"noradId": catalog_number}, {"_id": 0})
    if not doc:
        doc = db.db["debris"].find_one({"noradId": catalog_number}, {"_id": 0})
    if not doc:
        # Live fallback from Space-Track
        spacetrack_service.sync_by_catalog(db, catalog_number)
        doc = db.db["satellites"].find_one({"noradId": catalog_number}, {"_id": 0}) or \
              db.db["debris"].find_one({"noradId": catalog_number}, {"_id": 0})
    if not doc:
        raise NotFoundError(
            f"Object '{catalog_number}' was not found in the local catalog or on Space-Track.",
            details={"resource": "SpaceObject", "identifier": catalog_number},
        )
    return APIResponse(success=True, message="Object retrieved", data=_serialize_doc(doc))


# ---------------------------------------------------------------------------
# GET /catalog/stats
# ---------------------------------------------------------------------------

@router.get("/stats", response_model=APIResponse[Dict[str, Any]])
def get_catalog_stats(db: MongoSession = Depends(get_db)):
    """Return catalog statistics direct from MongoDB."""
    stats = spacetrack_service.get_stats(db)
    return APIResponse(success=True, message="Catalog statistics", data=stats)


# ---------------------------------------------------------------------------
# GET /catalog/providers
# ---------------------------------------------------------------------------

@router.get("/providers", response_model=APIResponse[Dict[str, Any]])
def get_provider_chain():
    """
    Show the data source failover chain and which links are currently usable.

    Ingestion walks this list top to bottom and uses the first provider that answers, so
    this is the quickest way to see why a sync came back from a fallback source.
    """
    chain = spacetrack_service.providers
    providers = [
        {"name": p.name, "priority": i + 1, "available": p.is_available()}
        for i, p in enumerate(chain.providers)
    ]
    usable = sum(1 for p in providers if p["available"])

    return APIResponse(
        success=True,
        message=f"{usable}/{len(providers)} providers available — {' → '.join(chain.order)}",
        data={"providers": providers},
    )


# ---------------------------------------------------------------------------
# POST /catalog/sync
# ---------------------------------------------------------------------------

@router.post("/sync", response_model=APIResponse[Dict[str, Any]])
def trigger_sync(
    group: Optional[str] = Query(None, description="active | starlink | analyst. Omit for all."),
    limit: int = Query(500, ge=1, le=5000),
    background_tasks: BackgroundTasks = None,
    db: MongoSession = Depends(get_db),
):
    """Manually trigger a catalog sync (Space-Track → CelesTrak → cache)."""
    if group:
        _validate_group(group)
        type_override = next(
            (t for g, t, _ in SYNC_GROUPS if g == group), None
        )
        status = spacetrack_service.sync_group(db, group, type_override, limit=limit)

        # sync_group reports an unreachable dependency through sentinels in `errors`
        # rather than by raising. Surface those as real failures — previously they came
        # back as "0 upserted, 0 failed" with HTTP 200, which reads like a clean sync.
        errors = status.get("errors") or []
        if "db_unreachable" in errors:
            raise ServiceUnavailableError(
                "The catalog database is unreachable, so the sync could not be stored.",
                details={"group": group, "sync_status": status},
            )
        if "all_providers_failed" in errors:
            # Only reachable once *every* source is down — including the local cache.
            raise ExternalServiceError(
                f"No satellite data provider could serve group '{group}'.",
                details={
                    "group": group,
                    "providers_tried": spacetrack_service.providers.order,
                    "provider_failures": status.get("provider_failures", {}),
                },
            )

        return APIResponse(
            success=status["failed"] == 0,
            message=(
                f"Synced group '{group}' from '{status['source']}': "
                f"{status['upserted']} upserted, {status['failed']} failed"
            ),
            data=status,
        )

    def _bg_sync():
        from database.session import SessionLocal
        _db = SessionLocal()
        try:
            spacetrack_service.sync_all_groups(_db, limit_per_group=limit)
        finally:
            _db.close()

    if background_tasks:
        background_tasks.add_task(_bg_sync)
        return APIResponse(
            success=True,
            message="Full Space-Track sync queued in background",
            data={"groups": [g[0] for g in SYNC_GROUPS], "limit_per_group": limit},
        )

    results = spacetrack_service.sync_all_groups(db, limit_per_group=limit)
    return APIResponse(
        success=True,
        message="Full Space-Track sync completed",
        data=results,
    )


# ---------------------------------------------------------------------------
# GET /catalog/live — pass-through without DB write
# ---------------------------------------------------------------------------

@router.get("/live", response_model=APIResponse[List[Dict[str, Any]]])
def fetch_live_from_spacetrack(
    group: str = Query("active"),
    limit: int = Query(100, ge=1, le=1000),
):
    """Pass-through: fetch live GP data directly from Space-Track (no DB write)."""
    _validate_group(group)

    # fetch_group_json swallows auth/HTTP failures and returns []. Checking auth first is
    # what lets us tell "Space-Track is down" (502) from "Space-Track has no records" (200).
    if not spacetrack_service.authenticate():
        raise ExternalServiceError(
            service="Space-Track",
            reason="authentication failed — check SPACETRACK_USERNAME / SPACETRACK_PASSWORD",
        )

    records = spacetrack_service.fetch_group_json(group)[:limit]
    return APIResponse(
        success=True,
        message=f"Live Space-Track data for group '{group}' ({len(records)} records)",
        data=records,
    )
