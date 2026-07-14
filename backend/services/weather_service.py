"""
NASA DONKI Space Weather Service
==================================
Integrates with the NASA DONKI (Database Of Notifications, Knowledge, Information) API
to pull real-time space weather events:

  • CME   — Coronal Mass Ejections
  • FLR   — Solar Flares
  • GST   — Geomagnetic Storms
  • SEP   — Solar Energetic Particles
  • RBE   — Radiation Belt Enhancement
  • IPS   — Interplanetary Shocks

API Docs: https://api.nasa.gov/
Key used: configured via settings.NASA_DONKI_API_KEY
"""

import httpx
import datetime
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from models.db_models import SpaceWeather, Alert
from app.core.config import settings

logger = logging.getLogger("app")

_BASE = "https://api.nasa.gov/DONKI"






_FLARE_CLASS_SEVERITY = {
    "X": "EXTREME",
    "M": "MODERATE",
    "C": "NORMAL",
    "B": "NORMAL",
    "A": "NORMAL",
}

_GST_KP_TO_SEVERITY = {
    9: "EXTREME",  8: "EXTREME",
    7: "EXTREME",  6: "MODERATE",
    5: "MODERATE", 4: "NORMAL",
}


def _flare_severity(cls_type: str) -> str:
    if not cls_type:
        return "NORMAL"
    return _FLARE_CLASS_SEVERITY.get(cls_type[0].upper(), "NORMAL")


def _kp_severity(kp: float) -> str:
    k = int(kp)
    for threshold in sorted(_GST_KP_TO_SEVERITY, reverse=True):
        if k >= threshold:
            return _GST_KP_TO_SEVERITY[threshold]
    return "NORMAL"


def _date_range(days_back: int = 7):
    end   = datetime.date.today()
    start = end - datetime.timedelta(days=days_back)
    return start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d")






class SpaceWeatherService:
    """
    Pulls live space weather data from NASA DONKI API.
    Falls back to NOAA Scales JSON if DONKI is unavailable.
    Always produces at least one synthetic record so the dashboard is never empty.
    """

    def __init__(self):
        self.api_key   = settings.NASA_DONKI_API_KEY
        self.base_url  = _BASE
        self.noaa_url  = "https://services.swpc.noaa.gov/products/noaa-scales.json"
        self.client    = httpx.Client(timeout=20.0, follow_redirects=True)

    

    def _get(self, path: str, params: Dict[str, Any] = None) -> Any:
        url = f"{self.base_url}/{path}"
        p   = {"api_key": self.api_key, **(params or {})}
        try:
            resp = self.client.get(url, params=p)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.warning(f"DONKI {path} fetch failed: {e}")
            return []

    

    def fetch_cme(self, days_back: int = 7) -> List[Dict]:
        """Coronal Mass Ejections."""
        start, end = _date_range(days_back)
        data = self._get("CME", {"startDate": start, "endDate": end})
        events = []
        for item in (data or []):
            speed = None
            for analysis in (item.get("cmeAnalyses") or []):
                if analysis.get("speed"):
                    speed = analysis["speed"]
                    break
            events.append({
                "type":        "CME",
                "event_type":  "SOLAR_CME",
                "activity_id": item.get("activityID", ""),
                "start_time":  item.get("startTime", ""),
                "note":        item.get("note", ""),
                "speed_kms":   speed,
                "severity":    "MODERATE" if speed and float(speed) > 800 else "NORMAL",
                "link":        item.get("link", ""),
            })
        logger.info(f"DONKI CME: {len(events)} events in last {days_back} days")
        return events

    def fetch_solar_flares(self, days_back: int = 7) -> List[Dict]:
        """Solar Flare events."""
        start, end = _date_range(days_back)
        data = self._get("FLR", {"startDate": start, "endDate": end})
        events = []
        for item in (data or []):
            cls = item.get("classType", "")
            events.append({
                "type":         "SOLAR_FLARE",
                "event_type":   "SOLAR_FLARE",
                "activity_id":  item.get("flrID", ""),
                "class_type":   cls,
                "peak_time":    item.get("peakTime", ""),
                "begin_time":   item.get("beginTime", ""),
                "end_time":     item.get("endTime", ""),
                "source_location": item.get("sourceLocation", ""),
                "severity":     _flare_severity(cls),
                "note":         f"Solar flare class {cls} detected from {item.get('sourceLocation', 'unknown')}.",
                "link":         item.get("link", ""),
            })
        logger.info(f"DONKI FLR: {len(events)} flares in last {days_back} days")
        return events

    def fetch_geomagnetic_storms(self, days_back: int = 7) -> List[Dict]:
        """Geomagnetic Storm events with Kp index."""
        start, end = _date_range(days_back)
        data = self._get("GST", {"startDate": start, "endDate": end})
        events = []
        for item in (data or []):
            kp_index = None
            for kp_data in (item.get("allKpIndex") or []):
                if kp_data.get("kpIndex"):
                    kp_index = float(kp_data["kpIndex"])
                    break
            events.append({
                "type":        "GEOMAGNETIC_STORM",
                "event_type":  "GEOMAGNETIC_STORM",
                "activity_id": item.get("gstID", ""),
                "start_time":  item.get("startTime", ""),
                "kp_index":    kp_index,
                "severity":    _kp_severity(kp_index or 0),
                "note":        f"Geomagnetic storm Kp={kp_index}. Atmospheric drag coefficient affected.",
                "link":        item.get("link", ""),
            })
        logger.info(f"DONKI GST: {len(events)} storms in last {days_back} days")
        return events

    def fetch_radiation_events(self, days_back: int = 7) -> List[Dict]:
        """Solar Energetic Particle / Radiation Belt Enhancement events."""
        start, end = _date_range(days_back)
        sep  = self._get("SEP", {"startDate": start, "endDate": end}) or []
        rbe  = self._get("RBE", {"startDate": start, "endDate": end}) or []
        events = []
        for item in sep:
            events.append({
                "type":        "RADIATION",
                "event_type":  "SOLAR_ENERGETIC_PARTICLE",
                "activity_id": item.get("sepID", ""),
                "start_time":  item.get("eventTime", ""),
                "severity":    "MODERATE",
                "note":        "Solar Energetic Particle event detected. Radiation shielding advisory issued.",
                "link":        item.get("link", ""),
            })
        for item in rbe:
            events.append({
                "type":        "RADIATION",
                "event_type":  "RADIATION_BELT_ENHANCEMENT",
                "activity_id": item.get("rbeID", ""),
                "start_time":  item.get("eventTime", ""),
                "severity":    "MODERATE",
                "note":        "Radiation Belt Enhancement — increased flux in inner/outer belt.",
                "link":        item.get("link", ""),
            })
        return events

    def fetch_all_events(self, days_back: int = 7) -> Dict[str, List[Dict]]:
        """Fetch all event types in one call."""
        return {
            "cme":                 self.fetch_cme(days_back),
            "solar_flares":        self.fetch_solar_flares(days_back),
            "geomagnetic_storms":  self.fetch_geomagnetic_storms(days_back),
            "radiation_events":    self.fetch_radiation_events(days_back),
        }

    

    def _noaa_fallback(self) -> Dict[str, Any]:
        """Fetch Kp index from NOAA scales as a secondary source."""
        try:
            resp = self.client.get(self.noaa_url, timeout=10.0)
            resp.raise_for_status()
            data     = resp.json()
            g_scale  = data.get("0", {}).get("geomagnetic", {})
            k_raw    = int(g_scale.get("scale", 0))
            k_index  = k_raw + 3
            return {
                "event_type":  "GEOMAGNETIC_STORM",
                "severity":    _kp_severity(k_index),
                "k_index":     k_index,
                "description": f"NOAA Geomagnetic index K{k_index}. Drag recalibration advisory.",
                "source":      "NOAA",
            }
        except Exception as e:
            logger.warning(f"NOAA fallback also failed: {e}")
            return {
                "event_type":  "GEOMAGNETIC_STORM",
                "severity":    "NORMAL",
                "k_index":     3,
                "description": "Nominal space weather conditions. No alerts active.",
                "source":      "MOCK",
            }

    

    def sync_weather(self, db: Session):
        """
        Main sync entry point called by the scheduler.
        Fetches all DONKI event types, persists to DB, and raises alerts for serious events.
        """
        all_events = self.fetch_all_events(days_back=1)  

        total_synced = 0

        
        for evt in all_events["geomagnetic_storms"]:
            kp = evt.get("kp_index") or 3
            sw = SpaceWeather(
                event_type=evt["event_type"],
                severity=evt["severity"],
                k_index=int(kp),
                description=evt["note"],
            )
            db.add(sw)
            total_synced += 1
            if evt["severity"] in ("MODERATE", "EXTREME"):
                db.add(Alert(
                    title=f"🌩 GEOMAGNETIC STORM — Kp{kp:.0f}",
                    description=evt["note"],
                    alert_type="WEATHER",
                    severity="CRITICAL" if evt["severity"] == "EXTREME" else "WARNING",
                ))

        
        for evt in all_events["solar_flares"]:
            sw = SpaceWeather(
                event_type="SOLAR_FLARE",
                severity=evt["severity"],
                k_index=None,
                description=evt["note"],
            )
            db.add(sw)
            total_synced += 1
            if evt["severity"] in ("MODERATE", "EXTREME"):
                db.add(Alert(
                    title=f"☀️ SOLAR FLARE — Class {evt.get('class_type', '?')}",
                    description=evt["note"],
                    alert_type="WEATHER",
                    severity="CRITICAL" if evt["severity"] == "EXTREME" else "WARNING",
                ))

        
        for evt in all_events["cme"]:
            sw = SpaceWeather(
                event_type="SOLAR_CME",
                severity=evt["severity"],
                k_index=None,
                description=f"CME detected. Speed: {evt.get('speed_kms', 'unknown')} km/s. {evt.get('note', '')}",
            )
            db.add(sw)
            total_synced += 1
            if evt["severity"] in ("MODERATE", "EXTREME"):
                db.add(Alert(
                    title=f"☄️ CORONAL MASS EJECTION — {evt.get('speed_kms', '?')} km/s",
                    description=sw.description,
                    alert_type="WEATHER",
                    severity="WARNING",
                ))

        
        for evt in all_events["radiation_events"]:
            sw = SpaceWeather(
                event_type=evt["event_type"],
                severity=evt["severity"],
                k_index=None,
                description=evt["note"],
            )
            db.add(sw)
            total_synced += 1

        
        if total_synced == 0:
            fallback = self._noaa_fallback()
            db.add(SpaceWeather(
                event_type=fallback["event_type"],
                severity=fallback["severity"],
                k_index=fallback["k_index"],
                description=fallback["description"],
            ))

        try:
            db.commit()
            logger.info(f"✅ Space weather sync complete — {total_synced} DONKI events persisted.")
        except Exception as e:
            db.rollback()
            logger.error(f"Weather DB commit failed: {e}")
            # Swallowing this used to make a sync that persisted nothing look successful to
            # every caller. The scheduler and the Celery task both catch and log; the API
            # endpoint turns it into a 502 instead of a misleading 200.
            raise

    

    def get_current_status(self) -> Dict[str, Any]:
        """
        Returns a synthesised current space weather status dict
        suitable for the dashboard without touching the DB.
        """
        gst  = self.fetch_geomagnetic_storms(days_back=3)
        flr  = self.fetch_solar_flares(days_back=3)
        cme  = self.fetch_cme(days_back=3)
        rad  = self.fetch_radiation_events(days_back=3)

        
        severities = [e.get("severity", "NORMAL") for e in gst + flr + cme + rad]
        if "EXTREME" in severities:
            overall = "EXTREME"
        elif "MODERATE" in severities:
            overall = "MODERATE"
        else:
            overall = "NORMAL"

        
        kp = 3
        if gst:
            kp = int(gst[-1].get("kp_index") or 3)

        return {
            "overall_severity": overall,
            "kp_index":         kp,
            "active_cme_count":         len(cme),
            "active_flare_count":       len(flr),
            "active_storm_count":       len(gst),
            "active_radiation_count":   len(rad),
            "events": {
                "cme":                cme[-5:],     
                "solar_flares":       flr[-5:],
                "geomagnetic_storms": gst[-5:],
                "radiation_events":   rad[-5:],
            },
            "fetched_at": datetime.datetime.utcnow().isoformat(),
            "source": "NASA DONKI API",
        }



weather_service = SpaceWeatherService()
