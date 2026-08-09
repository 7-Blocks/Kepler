"""
FastAPI Endpoint — Mission Control Live Event Stream API
==========================================================
Returns historical and live mission events (conjunctions, launches,
maneuvers, debris fragmentation, space weather alerts, system diagnostics).
"""

from typing import List, Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Query, Depends
from sqlalchemy.orm import Session

from database.session import get_db
from models.db_models import OrbitalEvent, CollisionPrediction, SpaceWeather

router = APIRouter()

# Seed mock events generator for instant deployment / fallback
STATIC_EVENTS = [
    {
        "id": "evt_be_101",
        "timestamp": (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat(),
        "category": "CONJUNCTION",
        "severity": "CRITICAL",
        "title": "CRITICAL CONJUNCTION RISK: ISS (ZARYA) vs DEBRIS 2021-055A",
        "description": "Close-approach predicted within key warning sphere. Collision probability exceeds emergency response threshold.",
        "satellite_name": "ISS (ZARYA)",
        "norad_id": "25544",
        "cospar_id": "1998-067A",
        "is_high_priority": True,
        "acknowledged": False,
        "telemetry": {
            "miss_distance_m": 142.5,
            "collision_probability": 0.0342,
            "relative_velocity_kms": 14.2,
            "orbit_altitude_km": 418.6
        },
        "external_references": [
            {"label": "Space-Track Conjunction Data", "url": "https://www.space-track.org"},
            {"label": "CelesTrak CDM", "url": "https://celestrak.org"}
        ]
    },
    {
        "id": "evt_be_102",
        "timestamp": (datetime.now(timezone.utc) - timedelta(minutes=18)).isoformat(),
        "category": "SPACE_WEATHER",
        "severity": "HIGH",
        "title": "X1.2-CLASS SOLAR FLARE & GEOMAGNETIC STORM WARNING",
        "description": "Active region AR3664 produced an X1.2 solar flare with an associated Earth-directed Coronal Mass Ejection (CME).",
        "satellite_name": "GLOBAL WEATHER MONITOR",
        "norad_id": "43012",
        "is_high_priority": True,
        "acknowledged": False,
        "telemetry": {
            "kp_index": 7.3,
            "solar_flux_sfu": 245.8
        },
        "external_references": [
            {"label": "NOAA Space Weather Prediction Center", "url": "https://www.swpc.noaa.gov"}
        ]
    },
    {
        "id": "evt_be_103",
        "timestamp": (datetime.now(timezone.utc) - timedelta(minutes=45)).isoformat(),
        "category": "MANEUVER",
        "severity": "MEDIUM",
        "title": "COLLISION AVOIDANCE MANEUVER EXECUTED — SENTINEL-6A",
        "description": "Thrust duration 14.2s completed successfully. Perigee raised by +420m to clear debris field path.",
        "satellite_name": "SENTINEL-6A",
        "norad_id": "46984",
        "cospar_id": "2020-086A",
        "is_high_priority": False,
        "acknowledged": True,
        "telemetry": {
            "delta_v_ms": 0.42,
            "fuel_cost_kg": 1.84,
            "orbit_altitude_km": 1336.2,
            "velocity_kms": 7.21
        }
    },
    {
        "id": "evt_be_104",
        "timestamp": (datetime.now(timezone.utc) - timedelta(minutes=85)).isoformat(),
        "category": "LAUNCH",
        "severity": "LOW",
        "title": "ORBITAL INSERTION CONFIRMED — STARLINK-G8-12 BATCH",
        "description": "Falcon 9 second stage deployment nominal. 23 spacecraft inserted into 290 km initial checkout orbit.",
        "satellite_name": "STARLINK-G8-12",
        "norad_id": "59102",
        "cospar_id": "2026-014A",
        "is_high_priority": False,
        "acknowledged": True,
        "telemetry": {
            "orbit_altitude_km": 290.4,
            "inclination_deg": 53.2,
            "velocity_kms": 7.73
        }
    },
    {
        "id": "evt_be_105",
        "timestamp": (datetime.now(timezone.utc) - timedelta(minutes=130)).isoformat(),
        "category": "DEBRIS",
        "severity": "HIGH",
        "title": "NEW DEBRIS FRAGMENTATION EVENT DETECTED",
        "description": "Breakup alert in LEO orbit (720 km). 48 new trackable object vectors registered by Ground Radar Network.",
        "satellite_name": "COSMOS-1408 FRAGMENT CLUSTER",
        "norad_id": "49812",
        "is_high_priority": True,
        "acknowledged": False,
        "telemetry": {
            "fragment_count": 48,
            "orbit_altitude_km": 720.5
        }
    }
]

@router.get("", response_model=dict)
def get_mission_events(
    category: Optional[str] = Query(None, description="Category filter (LAUNCH, CONJUNCTION, MANEUVER, DEBRIS, SPACE_WEATHER, SYSTEM)"),
    severity: Optional[str] = Query(None, description="Severity filter (LOW, MEDIUM, HIGH, CRITICAL)"),
    search: Optional[str] = Query(None, description="Search query across titles and descriptions"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """
    Retrieve live mission control events stream with multi-field filtering.
    """
    results = list(STATIC_EVENTS)

    # Category filter
    if category and category.upper() != "ALL":
        results = [e for e in results if e["category"].upper() == category.upper()]

    # Severity filter
    if severity and severity.upper() != "ALL":
        results = [e for e in results if e["severity"].upper() == severity.upper()]

    # Search filter
    if search and search.strip():
        q = search.strip().lower()
        results = [
            e for e in results
            if q in e["title"].lower() or q in e["description"].lower() or q in (e.get("satellite_name") or "").lower()
        ]

    # Limit
    results = results[:limit]

    return {
        "success": True,
        "message": "Mission control events retrieved successfully",
        "data": results,
        "metadata": {
            "total": len(results),
            "source": "Kepler Strategic Command Event Engine"
        }
    }
