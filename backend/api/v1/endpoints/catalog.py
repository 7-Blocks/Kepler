"""
/api/v1/catalog — Live Orbital Catalog Endpoints
"""

from fastapi import APIRouter, Depends, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import datetime

from database.session import get_db
from models.db_models import Satellite, Debris
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
    if group not in KNOWN_GROUPS:
        raise ValidationError(
            f"'{group}' is not a known Space-Track group.",
            details={"field": "group", "value": group, "allowed": list(KNOWN_GROUPS)},
        )


def _serialize_sat(sat: Satellite) -> Dict[str, Any]:
    epoch   = sat.epoch
    updated = sat.updatedAt
    return {
        "id":             str(sat.id),
        "name":           sat.objectName or "",
        "catalog_number": sat.noradId or "",
        "cospar_id":      None,
        "classification": sat.objectType or "UNKNOWN",
        "epoch":          epoch if isinstance(epoch, str) else (epoch.isoformat() if epoch else None),
        "inclination":    sat.inclination,
        "eccentricity":   sat.eccentricity,
        "semimajor_axis": sat.semimajor_axis,
        "raan":           None,
        "arg_of_perigee": None,
        "mean_anomaly":   None,
        "mean_motion":    sat.meanMotion,
        "period":         sat.period,
        "has_tle":        bool(sat.tle_line1 and sat.tle_line2),
        "updated_at":     updated.isoformat() if updated else None,
    }


def _serialize_debris(deb: Debris) -> Dict[str, Any]:
    epoch = deb.epoch
    return {
        "id":             str(deb.id),
        "name":           deb.objectName or "",
        "catalog_number": deb.noradId or "",
        "cospar_id":      None,
        "classification": "DEBRIS",
        "epoch":          epoch if isinstance(epoch, str) else (epoch.isoformat() if epoch else None),
        "inclination":    deb.inclination,
        "eccentricity":   deb.eccentricity,
        "semimajor_axis": deb.semimajor_axis,
        "raan":           None,
        "arg_of_perigee": None,
        "mean_anomaly":   None,
        "mean_motion":    deb.meanMotion,
        "period":         deb.period,
        "has_tle":        bool(deb.tle_line1 and deb.tle_line2),
        "updated_at":     None,
    }


@router.get("/objects", response_model=APIResponse[List[Dict[str, Any]]])
def list_space_objects(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=500),
    classification: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    if classification and classification.upper() not in VALID_CLASSIFICATIONS:
        raise ValidationError(
            f"'{classification}' is not a valid object classification.",
            details={"field": "classification", "value": classification, "allowed": list(VALID_CLASSIFICATIONS)},
        )

    cls = classification.upper() if classification else None
    pattern = f"%{search}%" if search else None

    all_docs: List[Dict[str, Any]] = []

    if cls != "DEBRIS":
        q = db.query(Satellite)
        if cls:
            q = q.filter(Satellite.objectType == cls)
        if pattern:
            q = q.filter(Satellite.objectName.ilike(pattern) | Satellite.noradId.ilike(pattern))
        all_docs.extend(_serialize_sat(s) for s in q.all())

    if cls in (None, "DEBRIS"):
        q = db.query(Debris)
        if pattern:
            q = q.filter(Debris.objectName.ilike(pattern) | Debris.noradId.ilike(pattern))
        all_docs.extend(_serialize_debris(d) for d in q.all())

    total  = len(all_docs)
    offset = (page - 1) * size
    pages  = (total + size - 1) // size if total else 1

    return APIResponse(
        success=True,
        message=f"Orbital catalog — {total} objects tracked",
        data=all_docs[offset: offset + size],
        pagination=PaginationSchema(page=page, size=size, total=total, pages=pages),
    )


@router.get("/objects/{catalog_number}", response_model=APIResponse[Dict[str, Any]])
def get_space_object(catalog_number: str, db: Session = Depends(get_db)):
    if catalog_number.isdecimal():
        catalog_number = str(int(catalog_number))

    sat = db.query(Satellite).filter(Satellite.noradId == catalog_number).first()
    if sat:
        return APIResponse(success=True, message="Object retrieved", data=_serialize_sat(sat))

    deb = db.query(Debris).filter(Debris.noradId == catalog_number).first()
    if deb:
        return APIResponse(success=True, message="Object retrieved", data=_serialize_debris(deb))

    # Live fallback from Space-Track
    spacetrack_service.sync_by_catalog(db, catalog_number)
    sat = db.query(Satellite).filter(Satellite.noradId == catalog_number).first()
    if sat:
        return APIResponse(success=True, message="Object retrieved", data=_serialize_sat(sat))
    deb = db.query(Debris).filter(Debris.noradId == catalog_number).first()
    if deb:
        return APIResponse(success=True, message="Object retrieved", data=_serialize_debris(deb))

    raise NotFoundError(
        f"Object '{catalog_number}' was not found in the local catalog or on Space-Track.",
        details={"resource": "SpaceObject", "identifier": catalog_number},
    )


@router.get("/stats", response_model=APIResponse[Dict[str, Any]])
def get_catalog_stats(db: Session = Depends(get_db)):
    stats = spacetrack_service.get_stats(db)
    return APIResponse(success=True, message="Catalog statistics", data=stats)


@router.get("/providers", response_model=APIResponse[Dict[str, Any]])
def get_provider_chain():
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


@router.post("/sync", response_model=APIResponse[Dict[str, Any]])
def trigger_sync(
    group: Optional[str] = Query(None),
    limit: int = Query(500, ge=1, le=5000),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
):
    if group:
        _validate_group(group)
        type_override = next((t for g, t, _ in SYNC_GROUPS if g == group), None)
        status = spacetrack_service.sync_group(db, group, type_override, limit=limit)

        errors = status.get("errors") or []
        if "db_unreachable" in errors:
            raise ServiceUnavailableError(
                "The catalog database is unreachable, so the sync could not be stored.",
                details={"group": group, "sync_status": status},
            )
        if "all_providers_failed" in errors:
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
    return APIResponse(success=True, message="Full Space-Track sync completed", data=results)


@router.get("/live", response_model=APIResponse[List[Dict[str, Any]]])
def fetch_live_from_spacetrack(
    group: str = Query("active"),
    limit: int = Query(100, ge=1, le=1000),
):
    _validate_group(group)
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
