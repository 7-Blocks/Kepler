"""
Multi-source satellite data providers (issue #15).

Ingestion no longer depends on a single upstream. `build_provider_chain` assembles the
sources in the order given by `settings.SATELLITE_PROVIDER_PRIORITY`, defaulting to:

    space-track -> celestrak -> cache
"""

import logging
from typing import Any, List

from app.core.config import settings
from orbital.providers.base import (
    AllProvidersFailedError,
    ProviderError,
    SatelliteDataProvider,
)
from orbital.providers.cache import LocalCacheProvider
from orbital.providers.celestrak import CelesTrakProvider
from orbital.providers.chain import ProviderChain
from orbital.providers.spacetrack import SpaceTrackProvider

logger = logging.getLogger("app")

__all__ = [
    "AllProvidersFailedError",
    "CelesTrakProvider",
    "LocalCacheProvider",
    "ProviderChain",
    "ProviderError",
    "SatelliteDataProvider",
    "SpaceTrackProvider",
    "build_provider_chain",
]


def build_provider_chain(spacetrack_service: Any) -> ProviderChain:
    """
    Build the failover chain in the configured priority order.

    `spacetrack_service` is injected rather than imported, so this module stays free of a
    circular dependency on `orbital.spacetrack`.
    """
    cache = LocalCacheProvider()
    available = {
        SpaceTrackProvider.name: lambda: SpaceTrackProvider(spacetrack_service),
        CelesTrakProvider.name:  CelesTrakProvider,
        LocalCacheProvider.name: lambda: cache,
    }

    providers: List[SatelliteDataProvider] = []
    for raw_name in settings.SATELLITE_PROVIDER_PRIORITY.split(","):
        name = raw_name.strip().lower()
        if not name:
            continue
        factory = available.get(name)
        if factory is None:
            logger.warning(
                f"[Providers] Unknown provider '{name}' in SATELLITE_PROVIDER_PRIORITY — "
                f"ignored. Known: {sorted(available)}."
            )
            continue
        providers.append(factory())

    if not providers:
        logger.error(
            "[Providers] SATELLITE_PROVIDER_PRIORITY produced no usable provider; "
            "falling back to the default chain."
        )
        providers = [SpaceTrackProvider(spacetrack_service), CelesTrakProvider(), cache]

    logger.info(f"[Providers] Chain: {' -> '.join(p.name for p in providers)}")
    return ProviderChain(providers, cache=cache)
