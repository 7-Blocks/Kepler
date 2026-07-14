"""
Space-Track provider — the primary source.

This wraps the existing `SpaceTrackService` rather than reimplementing it: the service is
injected, so this module does not import `orbital.spacetrack` and there is no import
cycle. Everything Space-Track-specific (session auth, retry/backoff, group query paths)
stays where it already lives.
"""

import logging
from typing import Any, Dict, List, Optional

from database.session import MongoSession
from orbital.providers.base import ProviderError, SatelliteDataProvider

logger = logging.getLogger("app")


class SpaceTrackProvider(SatelliteDataProvider):
    name = "space-track"

    def __init__(self, service: Any):
        # Duck-typed: anything exposing authenticate() and fetch_group_json().
        self.service = service

    def is_available(self) -> bool:
        """Space-Track needs credentials; without them every request is a wasted round-trip."""
        return bool(self.service.username and self.service.password)

    def fetch_group(
        self, group: str, limit: int, db: Optional[MongoSession] = None
    ) -> List[Dict[str, Any]]:
        if not self.service.authenticate():
            raise ProviderError(self.name, "authentication failed")

        records = self.service.fetch_group_json(group, limit=limit)
        if not records:
            # fetch_group_json swallows HTTP errors and returns []. For these groups an
            # empty answer means Space-Track is degraded, not that the sky is empty.
            raise ProviderError(self.name, f"returned no records for group '{group}'")

        return records
