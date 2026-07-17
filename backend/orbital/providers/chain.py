"""
Priority chain over the satellite data providers.

Tries each provider in order and returns the first usable answer, so a single upstream
outage no longer stops ingestion. Whatever a remote provider returns is written to the
local cache, which is what lets the last link in the chain keep serving data when every
remote source is down.

    Space-Track  ->  CelesTrak  ->  local cache
"""

import logging
from typing import Any, Dict, List, Optional, Sequence, Tuple

from sqlalchemy.orm import Session
from orbital.providers.base import (
    AllProvidersFailedError,
    ProviderError,
    SatelliteDataProvider,
)
from orbital.providers.cache import LocalCacheProvider

logger = logging.getLogger("app")


class ProviderChain:
    """Ordered set of providers with automatic failover."""

    def __init__(
        self,
        providers: Sequence[SatelliteDataProvider],
        cache: Optional[LocalCacheProvider] = None,
    ):
        self.providers = list(providers)
        self.cache = cache

    @property
    def order(self) -> List[str]:
        return [p.name for p in self.providers]

    def fetch_group(
        self, group: str, limit: int, db: Optional[Session] = None
    ) -> Tuple[List[Dict[str, Any]], str]:
        """
        Return `(records, provider_name)` from the first provider that can serve `group`.

        Raises `AllProvidersFailedError` — carrying each provider's reason — only when
        every source has been tried and none produced records.
        """
        failures: Dict[str, str] = {}

        for provider in self.providers:
            if not provider.is_available():
                reason = "unavailable (not configured or unreachable)"
                logger.warning(f"[Providers] Skipping '{provider.name}' — {reason}.")
                failures[provider.name] = reason
                continue

            try:
                logger.info(f"[Providers] Trying '{provider.name}' for group '{group}' …")
                records = provider.fetch_group(group, limit, db=db)
            except ProviderError as exc:
                logger.warning(f"[Providers] '{provider.name}' failed: {exc.reason}")
                failures[provider.name] = exc.reason
                continue
            except Exception as exc:
                # A provider must never take the whole chain down with it.
                logger.exception(f"[Providers] '{provider.name}' raised unexpectedly: {exc}")
                failures[provider.name] = f"unexpected error: {exc}"
                continue

            logger.info(
                f"[Providers] ✅ '{provider.name}' served {len(records)} records "
                f"for group '{group}'."
            )
            self._cache(group, provider, records, db)
            return records, provider.name

        logger.error(f"[Providers] ❌ Every provider failed for group '{group}': {failures}")
        raise AllProvidersFailedError(group, failures)

    def _cache(
        self,
        group: str,
        provider: SatelliteDataProvider,
        records: List[Dict[str, Any]],
        db: Optional[Session],
    ) -> None:
        """Refresh the local cache from a remote provider's answer, never from itself."""
        if self.cache is None or db is None or provider is self.cache:
            return
        try:
            self.cache.store(db, group, provider.name, records)
        except Exception as exc:
            # Failing to cache must not fail an otherwise successful fetch.
            logger.warning(f"[Providers] Could not cache group '{group}': {exc}")
