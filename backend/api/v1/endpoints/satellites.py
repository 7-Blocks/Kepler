"""
/api/v1/satellites — Satellite Fleet Endpoints
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from database.session import get_db
from models.db_models import Satellite, Telemetry
from app.core.exceptions import NotFoundError, BadRequestError
from schemas.api_schemas import APIResponse, PaginationSchema

router = APIRouter()


def _serialize_space_object_from_sat(sat: Satellite) -> dict:
    epoch = sat.epoch
    return {
        "id":             str(sat.id),
        "name":           sat.objectName or "",
        "catalog_number": sat.noradId or "",
        "cospar_id":      None,
        "classification": sat.objectType or "PAYLOAD",
        "epoch":          epoch if isinstance(epoch, str) else (epoch.isoformat() if epoch else None),
        "inclination":    sat.inclination,
        "eccentricity":   sat.eccentricity,
        "semimajor_axis": sat.semimajor_axis,
        "period":         sat.period,
        "mean_motion":    sat.meanMotion,
        "has_tle":        bool(sat.tle_line1 and sat.tle_line2),
    }


def _serialize_satellite(sat: Satellite) -> dict:
    return {
        "id":               str(sat.id),
        "status":           sat.status or "ACTIVE",
        "fuel_percentage":  sat.fuel_percentage or 100.0,
        "operational_mode": sat.operational_mode or "NORMAL",
        "space_object":     _serialize_space_object_from_sat(sat),
    }


@router.get("", response_model=APIResponse[List[Dict[str, Any]]])
def get_satellites(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=200),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Satellite)
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            Satellite.objectName.ilike(pattern) | Satellite.noradId.ilike(pattern)
        )

    total = query.count()
    offset = (page - 1) * size
    sats = query.offset(offset).limit(size).all()
    pages = (total + size - 1) // size if total else 1

    return APIResponse(
        success=True,
        message=f"Satellite fleet records retrieved — {total} total",
        data=[_serialize_satellite(s) for s in sats],
        pagination=PaginationSchema(page=page, size=size, total=total, pages=pages),
    )


@router.get("/norad/{norad_id}", response_model=APIResponse[dict])
def get_satellite_by_norad_id(norad_id: str, db: Session = Depends(get_db)):
    if not norad_id.isdecimal() or int(norad_id) <= 0:
        raise BadRequestError(message="NORAD ID must be a positive integer")

    sat = db.query(Satellite).filter(Satellite.noradId == str(int(norad_id))).first()
    if not sat:
        raise NotFoundError(resource="Satellite", identifier=norad_id)

    return APIResponse(success=True, message="Satellite found", data=_serialize_satellite(sat))


@router.get("/{satellite_id}/telemetry", response_model=APIResponse[List[dict]])
def get_satellite_telemetry(satellite_id: str, db: Session = Depends(get_db)):
    # Resolve satellite by numeric id or noradId
    sat = None
    if satellite_id.isdecimal():
        sat = db.query(Satellite).filter(
            (Satellite.id == int(satellite_id)) | (Satellite.noradId == satellite_id)
        ).first()
    if not sat:
        sat = db.query(Satellite).filter(Satellite.noradId == satellite_id).first()
    if not sat:
        raise NotFoundError(resource="Satellite", identifier=satellite_id)

    records = (
        db.query(Telemetry)
        .filter(Telemetry.satellite_id == sat.id)
        .order_by(Telemetry.timestamp.desc())
        .limit(50)
        .all()
    )

    data = [
        {
            "timestamp":      r.timestamp.isoformat() if r.timestamp else None,
            "altitude_km":    r.altitude_km,
            "velocity_kms":   r.velocity_kms,
            "temperature_c":  r.temperature_c,
            "battery_charge": r.battery_charge,
            "neural_load":    r.neural_load,
        }
        for r in records
    ]

    return APIResponse(
        success=True,
        message=f"Telemetry log stream fetched ({len(data)} records)",
        data=data,
    )
