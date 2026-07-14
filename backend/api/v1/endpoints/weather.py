"""
/api/v1/weather — NASA DONKI Space Weather Intelligence Endpoints
Exposes real-time space weather events: CME, solar flares, geomagnetic storms,
radiation events, and overall severity status from NASA DONKI API.
"""

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime

from database.session import get_db
from models.db_models import SpaceWeather, Alert
from schemas.api_schemas import APIResponse, PaginationSchema
from services.weather_service import weather_service

import logging

logger = logging.getLogger("app")

router = APIRouter()





@router.get("/status", response_model=APIResponse[Dict[str, Any]])
def get_weather_status():
    """
    Real-time space weather status snapshot pulled live from NASA DONKI.
    Returns overall severity, Kp index, event counts, and last 5 events per type.
    """
    status = weather_service.get_current_status()
    return APIResponse(
        success=True,
        message=f"Space weather status: {status['overall_severity']} — Kp{status['kp_index']}",
        data=status,
    )





@router.get("/cme", response_model=APIResponse[List[Dict[str, Any]]])
def get_cme_events(days: int = Query(7, ge=1, le=30, description="Look-back window in days")):
    """Fetch Coronal Mass Ejection events from NASA DONKI."""
    events = weather_service.fetch_cme(days_back=days)
    return APIResponse(
        success=True,
        message=f"{len(events)} CME events in the last {days} days",
        data=events,
    )





@router.get("/flares", response_model=APIResponse[List[Dict[str, Any]]])
def get_solar_flares(days: int = Query(7, ge=1, le=30)):
    """Fetch Solar Flare events from NASA DONKI."""
    events = weather_service.fetch_solar_flares(days_back=days)
    return APIResponse(
        success=True,
        message=f"{len(events)} solar flare events in the last {days} days",
        data=events,
    )





@router.get("/storms", response_model=APIResponse[List[Dict[str, Any]]])
def get_geomagnetic_storms(days: int = Query(7, ge=1, le=30)):
    """Fetch Geomagnetic Storm (GST) events from NASA DONKI with Kp index."""
    events = weather_service.fetch_geomagnetic_storms(days_back=days)
    return APIResponse(
        success=True,
        message=f"{len(events)} geomagnetic storm events in the last {days} days",
        data=events,
    )





@router.get("/radiation", response_model=APIResponse[List[Dict[str, Any]]])
def get_radiation_events(days: int = Query(7, ge=1, le=30)):
    """Fetch Solar Energetic Particle and Radiation Belt Enhancement events."""
    events = weather_service.fetch_radiation_events(days_back=days)
    return APIResponse(
        success=True,
        message=f"{len(events)} radiation events in the last {days} days",
        data=events,
    )





@router.get("/all", response_model=APIResponse[Dict[str, Any]])
def get_all_weather_events(days: int = Query(7, ge=1, le=30)):
    """Fetch all NASA DONKI event types (CME, flares, storms, radiation) in one call."""
    data = weather_service.fetch_all_events(days_back=days)
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
    event_type: Optional[str] = Query(None, description="e.g. SOLAR_FLARE | GEOMAGNETIC_STORM | SOLAR_CME"),
    db: Session = Depends(get_db),
):
    """List persisted space weather events from the database."""
    query = db.query(SpaceWeather).order_by(SpaceWeather.recorded_at.desc())
    if event_type:
        query = query.filter(SpaceWeather.event_type == event_type.upper())

    total  = query.count()
    offset = (page - 1) * size
    rows   = query.offset(offset).limit(size).all()
    pages  = (total + size - 1) // size

    data = [
        {
            "id":           r.id,
            "event_type":   r.event_type,
            "severity":     r.severity,
            "k_index":      r.k_index,
            "description":  r.description,
            "recorded_at":  r.recorded_at.isoformat(),
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
    days: int = Query(1, ge=1, le=7, description="Days to look back from NASA DONKI"),
    db: Session = Depends(get_db),
):
    """
    Manually trigger a NASA DONKI space weather sync.
    Fetches latest events and persists them to the database.
    """
    try:
        weather_service.sync_weather(db)
    except Exception:
        logger.error("NASA DONKI weather sync failed", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Space weather sync could not be completed. The NASA DONKI service may be temporarily unavailable.",
        )
    return APIResponse(
        success=True,
        message="NASA DONKI sync complete — events persisted to database.",
        data={"synced_at": datetime.utcnow().isoformat(), "source": "NASA DONKI API"},
    )
