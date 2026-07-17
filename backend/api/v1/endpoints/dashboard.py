"""
/api/v1/dashboard — Live Dashboard KPI Endpoints
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database.session import get_db
from models.db_models import Satellite, Debris, Alert, CollisionPrediction, AgentRun, SpaceWeather
from schemas.api_schemas import APIResponse
from services.weather_service import weather_service
from typing import Dict, Any
import logging

logger = logging.getLogger("app")
router = APIRouter()


@router.get("/summary", response_model=APIResponse[Dict[str, Any]])
def get_dashboard_summary(db: Session = Depends(get_db)):
    try:
        sat_count    = db.query(Satellite).count()
        debris_count = db.query(Debris).count()
        alerts_count = db.query(Alert).filter(Alert.is_acknowledged == False).count()
        collisions   = db.query(CollisionPrediction).filter(CollisionPrediction.status == "PENDING").count()
        agent_runs   = db.query(AgentRun).filter(AgentRun.status == "RUNNING").count()

        latest_weather = (
            db.query(SpaceWeather)
            .order_by(SpaceWeather.recorded_at.desc())
            .first()
        )
        if latest_weather and latest_weather.k_index is not None:
            weather_index    = f"K{latest_weather.k_index}"
            weather_severity = latest_weather.severity or "NORMAL"
        else:
            try:
                live = weather_service._noaa_fallback()
                weather_index    = f"K{live['k_index']}"
                weather_severity = live.get("severity", "NORMAL")
            except Exception:
                weather_index    = "K0"
                weather_severity = "NORMAL"

        data: Dict[str, Any] = {
            "tracked_satellites":         sat_count,
            "debris_objects":             debris_count,
            "active_alerts_count":        alerts_count,
            "predicted_collisions_count": collisions,
            "active_agents_load":         agent_runs,
            "space_weather_index":        weather_index,
            "space_weather_severity":     weather_severity,
            "system_status":              "NOMINAL",
        }

        logger.info(
            f"[Dashboard] KPIs — sats: {sat_count}, debris: {debris_count}, "
            f"collisions: {collisions}, weather: {weather_index}"
        )

    except Exception as exc:
        logger.error(f"[Dashboard] DB query failed: {exc}")
        data = {
            "tracked_satellites":         0,
            "debris_objects":             0,
            "active_alerts_count":        0,
            "predicted_collisions_count": 0,
            "active_agents_load":         0,
            "space_weather_index":        "N/A",
            "space_weather_severity":     "UNKNOWN",
            "system_status":              "DB_UNAVAILABLE",
        }

    return APIResponse(
        success=True,
        message="Live dashboard telemetry compiled from production database",
        data=data,
    )
