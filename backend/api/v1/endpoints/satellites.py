"""
/api/v1/satellites — Satellite Fleet Endpoints

Bug Fixes Applied:
  - Removed broken SatelliteResponse.from_attributes() call (Pydantic v2 schema has
    no such method on non-ORM objects — caused every request to 500).
  - Now queries MongoDB directly using db.db["satellites"] with correct camelCase fields.
  - Serialisation is done inline — no Pydantic model needed for raw Mongo docs.
"""

from fastapi import APIRouter, Depends, Query
from typing import List, Optional, Dict, Any
import datetime

from database.session import get_db, MongoSession
from app.core.exceptions import NotFoundError, BadRequestError
from schemas.api_schemas import APIResponse, PaginationSchema

router = APIRouter()


# ---------------------------------------------------------------------------
# Serialiser helpers
# ---------------------------------------------------------------------------

def _serialize_space_object_from_sat(doc: dict) -> dict:
    epoch = doc.get("epoch")
    return {
        "id":             str(doc.get("id") or doc.get("noradId", "")),
        "name":           doc.get("objectName", ""),
        "catalog_number": doc.get("noradId", ""),
        "cospar_id":      doc.get("cospar_id"),
        "classification": doc.get("objectType", "PAYLOAD"),
        "epoch":          epoch if isinstance(epoch, str) else (epoch.isoformat() if epoch else None),
        "inclination":    doc.get("inclination"),
        "eccentricity":   doc.get("eccentricity"),
        "semimajor_axis": doc.get("semimajor_axis"),
        "period":         doc.get("period"),
        "mean_motion":    doc.get("meanMotion"),
        "has_tle":        bool(doc.get("tle_line1") and doc.get("tle_line2")),
    }


def _serialize_satellite(doc: dict) -> dict:
    return {
        "id":               str(doc.get("id") or doc.get("noradId", "")),
        "status":           doc.get("status", "ACTIVE"),
        "fuel_percentage":  doc.get("fuel_percentage", 100.0),
        "operational_mode": doc.get("operational_mode", "NORMAL"),
        "space_object":     _serialize_space_object_from_sat(doc),
    }


# ---------------------------------------------------------------------------
# GET /satellites
# ---------------------------------------------------------------------------

@router.get("", response_model=APIResponse[List[Dict[str, Any]]])
def get_satellites(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=200),
    search: Optional[str] = Query(None),
    db: MongoSession = Depends(get_db),
):
    """Return paginated satellite list from MongoDB."""
    import re
    flt: dict = {}
    if search:
        pattern = re.compile(re.escape(search), re.IGNORECASE)
        flt["$or"] = [{"objectName": pattern}, {"noradId": pattern}]

    col = db.db["satellites"]
    total  = col.count_documents(flt)
    offset = (page - 1) * size
    docs   = list(col.find(flt, {"_id": 0}).skip(offset).limit(size))
    pages  = (total + size - 1) // size if total else 1

    data = [_serialize_satellite(d) for d in docs]
    return APIResponse(
        success=True,
        message=f"Satellite fleet records retrieved — {total} total",
        data=data,
        pagination=PaginationSchema(page=page, size=size, total=total, pages=pages),
    )


# ---------------------------------------------------------------------------
# GET /satellites/norad/{norad_id}
# ---------------------------------------------------------------------------

@router.get("/norad/{norad_id}", response_model=APIResponse[dict])
def get_satellite_by_norad_id(norad_id: str, db: MongoSession = Depends(get_db)):
    """Search for a satellite using its NORAD Catalog ID."""
    if not norad_id.isdecimal() or int(norad_id) <= 0:
        raise BadRequestError(message="NORAD ID must be a positive integer")

    sat = db.db["satellites"].find_one({"noradId": str(int(norad_id))}, {"_id": 0})
    if not sat:
        raise NotFoundError(resource="Satellite", identifier=norad_id)

    return APIResponse(
        success=True,
        message="Satellite found",
        data=_serialize_satellite(sat),
    )


# ---------------------------------------------------------------------------
# GET /satellites/{satellite_id}/telemetry
# ---------------------------------------------------------------------------

@router.get("/{satellite_id}/telemetry", response_model=APIResponse[List[dict]])
def get_satellite_telemetry(satellite_id: str, db: MongoSession = Depends(get_db)):
    """Return telemetry records for a satellite (looked up by noradId or int id)."""
    # Try numeric id first, then treat as noradId string
    flt = {}
    try:
        flt = {"id": int(satellite_id)}
    except ValueError:
        flt = {"noradId": satellite_id}

    sat = db.db["satellites"].find_one(flt, {"_id": 0})
    if not sat:
        raise NotFoundError(resource="Satellite", identifier=satellite_id)

    records = list(
        db.db["telemetry"]
        .find({"satellite_id": str(sat.get("id") or sat.get("noradId"))}, {"_id": 0})
        .sort("timestamp", -1)
        .limit(50)
    )

    data = []
    for r in records:
        ts = r.get("timestamp")
        data.append({
            "timestamp":    ts.isoformat() if hasattr(ts, "isoformat") else str(ts),
            "altitude_km":  r.get("altitude_km"),
            "velocity_kms": r.get("velocity_kms"),
            "temperature_c": r.get("temperature_c"),
            "battery_charge": r.get("battery_charge"),
            "neural_load":  r.get("neural_load"),
        })

    return APIResponse(
        success=True,
        message=f"Telemetry log stream fetched ({len(data)} records)",
        data=data,
    )
