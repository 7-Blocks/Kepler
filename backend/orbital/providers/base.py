"""
The contract every satellite data provider implements.

Providers all speak the same dialect: they return **GP/OMM records** — the CCSDS field
names Space-Track already serves (`NORAD_CAT_ID`, `OBJECT_NAME`, `MEAN_MOTION`, …). That
is the shape `SpaceTrackService._gp_to_satellite_doc` already consumes, so a new provider
plugs into the existing ingestion pipeline without touching the transform.

A provider signals failure by raising `ProviderError`. Returning an empty list counts as a
failure too: for the groups Kepler syncs ("active", "starlink", "debris") an empty catalog
is never a legitimate answer — it means the provider is degraded — so the chain falls
through to the next source rather than persisting nothing and calling it a success.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

from database.session import MongoSession


class ProviderError(Exception):
    """A provider could not serve the requested group."""

    def __init__(self, provider: str, reason: str):
        self.provider = provider
        self.reason = reason
        super().__init__(f"{provider}: {reason}")


class AllProvidersFailedError(Exception):
    """Every provider in the chain failed. Carries the reason each one gave."""

    def __init__(self, group: str, failures: Dict[str, str]):
        self.group = group
        self.failures = failures
        detail = "; ".join(f"{name} ({reason})" for name, reason in failures.items())
        super().__init__(f"All providers failed for group '{group}': {detail}")


class SatelliteDataProvider(ABC):
    """A source of GP/OMM records for a named group."""

    #: Stable identifier, stored on each ingested document as `source`.
    name: str = "unknown"

    def is_available(self) -> bool:
        """
        Cheap, non-fetching readiness check (credentials present, service reachable…).

        The chain skips a provider that reports False instead of paying for a doomed
        request. Defaults to True for providers that need no setup.
        """
        return True

    @abstractmethod
    def fetch_group(
        self, group: str, limit: int, db: Optional[MongoSession] = None
    ) -> List[Dict[str, Any]]:
        """
        Return GP/OMM records for `group`, or raise `ProviderError`.

        `db` is only used by providers backed by our own database (the local cache);
        remote providers ignore it.
        """
        raise NotImplementedError
