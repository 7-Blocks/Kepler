"""
CelesTrak provider — the first fallback.

CelesTrak serves the same CCSDS/OMM JSON that Space-Track does, and needs no credentials,
which makes it a genuinely independent second source: a Space-Track outage or an expired
password does not affect it.

Two differences from Space-Track are handled here:

  * CelesTrak has no generic "debris" group, so Kepler's `debris`/`analyst` group maps to
    the major tracked debris clouds and their records are concatenated.
  * The GP endpoint has no `limit` parameter, so the cap is applied client-side.

OMM records omit `TLE_LINE1`/`TLE_LINE2`; the ingestion transform already treats those as
optional (`has_tle` simply becomes false), so no change is needed downstream.
"""

import logging
from typing import Any, Dict, List, Optional

import httpx

from app.core.config import settings
from sqlalchemy.orm import Session
from orbital.providers.base import ProviderError, SatelliteDataProvider

logger = logging.getLogger("app")

# Kepler group -> CelesTrak GROUP query value(s).
_GROUP_MAP: Dict[str, List[str]] = {
    "active":   ["active"],
    "starlink": ["starlink"],
    "analyst":  ["cosmos-1408-debris", "fengyun-1c-debris",
                 "iridium-33-debris", "cosmos-2251-debris"],
}
_GROUP_MAP["debris"] = _GROUP_MAP["analyst"]


class CelesTrakProvider(SatelliteDataProvider):
    name = "celestrak"

    def __init__(self, base_url: Optional[str] = None, timeout: float = 30.0):
        self.base_url = (base_url or settings.CELESTRAK_BASE_URL).rstrip("/")
        # CelesTrak asks clients to identify themselves so it can contact heavy users.
        self.client = httpx.Client(
            timeout=timeout,
            follow_redirects=True,
            headers={"User-Agent": "Kepler/1.0 (+https://github.com/7-Blocks/Kepler)"},
        )

    def fetch_group(
        self, group: str, limit: int, db: Optional[Session] = None
    ) -> List[Dict[str, Any]]:
        celestrak_groups = _GROUP_MAP.get(group)
        if not celestrak_groups:
            raise ProviderError(self.name, f"no CelesTrak group maps to '{group}'")

        records: List[Dict[str, Any]] = []
        errors: List[str] = []

        for ct_group in celestrak_groups:
            if len(records) >= limit:
                break
            try:
                records.extend(self._fetch_one(ct_group))
            except ProviderError as exc:
                # One debris cloud failing should not discard the ones that worked.
                errors.append(exc.reason)

        if not records:
            reason = "; ".join(errors) if errors else f"returned no records for '{group}'"
            raise ProviderError(self.name, reason)

        if errors:
            logger.warning(
                f"[CelesTrak] Partial result for '{group}': {len(records)} records, "
                f"{len(errors)} sub-group(s) failed — {errors}"
            )

        return records[:limit]

    def _fetch_one(self, celestrak_group: str) -> List[Dict[str, Any]]:
        url = f"{self.base_url}/NORAD/elements/gp.php"
        params = {"GROUP": celestrak_group, "FORMAT": "json"}

        try:
            resp = self.client.get(url, params=params)
        except httpx.RequestError as exc:
            raise ProviderError(
                self.name, f"network error for '{celestrak_group}': {exc}"
            ) from exc

        # CelesTrak refreshes GP data every 2 hours and answers 403 if you ask again before
        # it has changed. That is a rate limit, not an outage — the honest response is to
        # fall through to the cached payload, which holds exactly the data it is declining
        # to resend. Kepler's scheduler polls far more often than every 2 hours, so this is
        # the common case, not an edge case.
        if resp.status_code == 403 and "has not updated" in resp.text:
            raise ProviderError(
                self.name,
                f"data unchanged since our last download of '{celestrak_group}' "
                f"(CelesTrak refreshes every 2h)",
            )

        try:
            resp.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise ProviderError(
                self.name, f"HTTP {exc.response.status_code} for '{celestrak_group}'"
            ) from exc

        try:
            data = resp.json()
        except ValueError as exc:
            raise ProviderError(
                self.name, f"non-JSON response for '{celestrak_group}'"
            ) from exc

        # On an unknown group CelesTrak answers 200 with an error string, not a list.
        if not isinstance(data, list):
            raise ProviderError(
                self.name,
                f"unexpected response for '{celestrak_group}': {str(data)[:120]}",
            )

        logger.info(f"[CelesTrak] '{celestrak_group}': {len(data)} records.")
        return data
