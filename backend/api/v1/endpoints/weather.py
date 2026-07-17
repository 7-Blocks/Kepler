"""
/api/v1/weather — NASA DONKI Space Weather Intelligence Endpoints
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import logging

from database.session import get_db
from models.db_models import SpaceWeather
from app.core.exceptions import (
    ExternalServiceError,
    ServiceUnavailableError,
    ValidationError,
)
from schemas.api_schemas import APIResponse, PaginationSchema
from services.weather_service import weather_service

logger = logging.getLogger("app")
router = APIRouter()

VALID_EVENT_TYPES = (
    "SOLAR_CME",
    "SOLAR_FLARE",
    "GEOMAGNETIC_STORM",
    "SOLAR_ENERGETIC_PARTICLE",
    "RADIATION_BELT_ENHANCEMENT",
)


@router.get("/status", response_model=APIResponse[Dict[str, Any]])
def get_weather_status():
    status = weather_service.get_current_status()
    return APIResponse(
        success=True,
        message=f"Space weather status: {status['overall_severity']} — Kp{status['kp_index']}",
        data=status,
    )


@router.get("/cme", response_model=APIResponse[List[Dict[str, Any]]])
def get_cme_events(days: int = Query(7, ge=1, le=30)):
    events = weather_service.fetch_cme(days_back=days)
    return APIResponse(success=True, message=f"{len(events)} CME events in the last {days} days", data=events)


@router.get("/flares", response_model=APIResponse[List[Dict[str, Any]]])
def get_solar_flares(days: int = Query(7, ge=1, le=30)):
    events = weather_service.fetch_solar_flares(days_back=days)
    return APIResponse(success=True, message=f"{len(events)} solar flare events in the last {days} days", data=events)


@router.get("/storms", response_model=APIResponse[List[Dict[str, Any]]])
def get_geomagnetic_storms(days: int = Query(7, ge=1, le=30)):
    events = weather_service.fetch_geomagnetic_storms(days_back=days)
    return APIResponse(success=True, message=f"{len(events)} geomagnetic storm events in the last {days} days", data=events)


@router.get("/radiation", response_model=APIResponse[List[Dict[str, Any]]])
def get_radiation_events(days: int = Query(7, ge=1, le=30)):
    events = weather_service.fetch_radiation_events(days_back=days)
    return APIResponse(success=True, message=f"{len(events)} radiation events in the last {days} days", data=events)


@router.get("/all", response_model=APIResponse[Dict[str, Any]])
def get_all_weather_events(days: int = Query(7, ge=1, le=30)):
    data  = weather_service.fetch_all_events(days_back=days)
    total = sum(len(v) for v in data.values())
    return APIResponse(
        success=True,
        message=f"{total} total space weather events in the last {days} days — NASA DONKI",
        data=data,
    )


@router.get("/history", response_model=APIResponse[List[Dict[str, Any]]])
def get_weather_history(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    event_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    if event_type and event_type.upper() not in VALID_EVENT_TYPES:
        raise ValidationError(
            f"'{event_type}' is not a known space weather event type.",
            details={"field": "event_type", "value": event_type, "allowed": list(VALID_EVENT_TYPES)},
        )

    query = db.query(SpaceWeather).order_by(SpaceWeather.recorded_at.desc())
    if event_type:
        query = query.filter(SpaceWeather.event_type == event_type.upper())

    total  = query.count()
    offset = (page - 1) * size
    rows   = query.offset(offset).limit(size).all()
    pages  = (total + size - 1) // size if total else 1

    data = [
        {
            "id":          r.id,
            "event_type":  r.event_type,
            "severity":    r.severity,
            "k_index":     r.k_index,
            "description": r.description,
            "recorded_at": r.recorded_at.isoformat() if r.recorded_at else None,
        }
        for r in rows
    ]

    return APIResponse(
        success=True,
        message=f"Space weather history — {total} records",
        data=data,
        pagination=PaginationSchema(page=page, size=size, total=total, pages=pages),
    )


@router.post("/sync", response_model=APIResponse[Dict[str, Any]])
def trigger_weather_sync(
    days: int = Query(1, ge=1, le=7),
    db: Session = Depends(get_db),
):
    try:
        weather_service.sync_weather(db)
    except Exception as exc:
        logger.exception(f"NASA DONKI sync failed: {exc}")
        raise ExternalServiceError(
            service="NASA DONKI",
            reason="the space weather sync did not complete",
        ) from exc

    return APIResponse(
        success=True,
        message="NASA DONKI sync complete — events persisted to database.",
        data={"synced_at": datetime.now(timezone.utc).isoformat(), "source": "NASA DONKI API"},
    )
