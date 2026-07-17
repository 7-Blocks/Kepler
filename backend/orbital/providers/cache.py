"""
Local cache provider — the last resort.

Stores the last successful remote fetch per group in the `provider_cache` PostgreSQL table.
When Space-Track and CelesTrak are both unreachable, the chain replays the last payload.
"""

import datetime
import json
import logging
from typing import Any, Dict, List, Optional

from sqlalchemy import Column, Integer, String, Text, DateTime, func
from sqlalchemy.orm import Session

from database.session import Base
from orbital.providers.base import ProviderError, SatelliteDataProvider

logger = logging.getLogger("app")


class ProviderCache(Base):
    """One row per group — stores the last successful remote payload as JSON."""
    __tablename__ = "provider_cache"

    id: int = Column(Integer, primary_key=True, autoincrement=True)
    group_name: str = Column(String(50), unique=True, nullable=False, index=True)
    source: str = Column(String(50))
    records_json: str = Column(Text)
    count: int = Column(Integer)
    cached_at: datetime.datetime = Column(DateTime(timezone=True), server_default=func.now())


class LocalCacheProvider(SatelliteDataProvider):
    name = "cache"

    def store(self, db: Session, group: str, source: str, records: List[Dict[str, Any]]) -> None:
        if not records:
            return
        existing = db.query(ProviderCache).filter(ProviderCache.group_name == group).first()
        now = datetime.datetime.now(datetime.timezone.utc)
        if existing:
            existing.source       = source
            existing.records_json = json.dumps(records)
            existing.count        = len(records)
            existing.cached_at    = now
        else:
            db.add(ProviderCache(
                group_name=group, source=source,
                records_json=json.dumps(records), count=len(records), cached_at=now,
            ))
        db.commit()
        logger.info(f"[Cache] Stored {len(records)} records for '{group}' (from {source}).")

    def fetch_group(self, group: str, limit: int, db: Optional[Session] = None) -> List[Dict[str, Any]]:
        if db is None:
            raise ProviderError(self.name, "no database session available")

        row = db.query(ProviderCache).filter(ProviderCache.group_name == group).first()
        if not row or not row.records_json:
            raise ProviderError(self.name, f"nothing cached for group '{group}'")

        records = json.loads(row.records_json)
        logger.warning(
            f"[Cache] ⚠️  Serving STALE data for '{group}': {row.count} records "
            f"cached at {row.cached_at} (from {row.source}). All remote providers are down."
        )
        return records[:limit]

    def age(self, db: Session, group: str) -> Optional[str]:
        row = db.query(ProviderCache).filter(ProviderCache.group_name == group).first()
        return row.cached_at.isoformat() if row and row.cached_at else None
