"""
Local cache provider — the last resort.

Every successful remote fetch is written to the `provider_cache` collection, one document
per group. When Space-Track *and* CelesTrak are both unreachable, the chain replays the
last payload we received instead of ingesting nothing.

The data it serves is by definition stale, so the age of the payload is logged and
returned in the sync status. Ingestion keeping the catalog warm during an outage is the
point; pretending the data is fresh is not.
"""

import datetime
import logging
from typing import Any, Dict, List, Optional

from database.session import MongoSession
from orbital.providers.base import ProviderError, SatelliteDataProvider

logger = logging.getLogger("app")

CACHE_COLLECTION = "provider_cache"


class LocalCacheProvider(SatelliteDataProvider):
    name = "cache"

    def store(
        self,
        db: MongoSession,
        group: str,
        source: str,
        records: List[Dict[str, Any]],
    ) -> None:
        """Overwrite the cached payload for `group` with a fresh remote answer."""
        if not records:
            return

        db.db[CACHE_COLLECTION].update_one(
            {"_id": group},
            {
                "$set": {
                    "group":    group,
                    "source":   source,
                    "records":  records,
                    "count":    len(records),
                    "cachedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                }
            },
            upsert=True,
        )
        logger.info(f"[Cache] Stored {len(records)} records for '{group}' (from {source}).")

    def fetch_group(
        self, group: str, limit: int, db: Optional[MongoSession] = None
    ) -> List[Dict[str, Any]]:
        if db is None:
            raise ProviderError(self.name, "no database session available")

        doc = db.db[CACHE_COLLECTION].find_one({"_id": group})
        if not doc or not doc.get("records"):
            raise ProviderError(self.name, f"nothing cached for group '{group}'")

        cached_at = doc.get("cachedAt")
        logger.warning(
            f"[Cache] ⚠️  Serving STALE data for '{group}': {doc.get('count')} records "
            f"cached at {cached_at} (from {doc.get('source')}). All remote providers are down."
        )
        return doc["records"][:limit]

    def age(self, db: MongoSession, group: str) -> Optional[str]:
        """ISO timestamp of the cached payload for `group`, or None if nothing is cached."""
        doc = db.db[CACHE_COLLECTION].find_one({"_id": group}, {"cachedAt": 1})
        return doc.get("cachedAt") if doc else None
