"""
Tests for multi-source satellite provider support (issue #15).

No network and no PostgreSQL required: remote calls are mocked and the cache
is backed by an in-memory SQLite database.
"""

from typing import Any, Dict, List, Optional
from unittest.mock import MagicMock

import httpx
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database.session import Base
import models.db_models  # noqa: F401
import orbital.providers.cache  # noqa: F401 — registers ProviderCache with Base.metadata

from orbital.providers import build_provider_chain
from orbital.providers.base import AllProvidersFailedError, ProviderError, SatelliteDataProvider
from orbital.providers.cache import LocalCacheProvider, ProviderCache
from orbital.providers.celestrak import CelesTrakProvider
from orbital.providers.chain import ProviderChain
from orbital.providers.spacetrack import SpaceTrackProvider


# ---------------------------------------------------------------------------
# Fixtures / helpers
# ---------------------------------------------------------------------------

@pytest.fixture()
def sqlite_db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    db = Session()
    yield db
    db.close()
    Base.metadata.drop_all(engine)


def _gp_record(norad_id: str, name: str = "SAT") -> Dict[str, Any]:
    return {
        "NORAD_CAT_ID": norad_id,
        "OBJECT_NAME": f"{name}-{norad_id}",
        "EPOCH": "2026-07-14T00:00:00",
        "MEAN_MOTION": "15.5",
        "ECCENTRICITY": "0.0001",
        "INCLINATION": "51.6",
        "RA_OF_ASC_NODE": "120.0",
        "ARG_OF_PERICENTER": "90.0",
        "MEAN_ANOMALY": "270.0",
    }


class StubProvider(SatelliteDataProvider):
    def __init__(self, name: str, records=None, fail: bool = False, available: bool = True):
        self.name = name
        self._records = records or []
        self._fail = fail
        self._available = available
        self.calls: List[str] = []

    def is_available(self) -> bool:
        return self._available

    def fetch_group(self, group: str, limit: int, db: Optional[Any] = None):
        self.calls.append(group)
        if self._fail:
            raise ProviderError(self.name, "simulated outage")
        return self._records


# ---------------------------------------------------------------------------
# Priority order and automatic failover
# ---------------------------------------------------------------------------

def test_the_first_healthy_provider_wins_and_the_rest_are_never_called():
    primary   = StubProvider("space-track", records=[_gp_record("25544")])
    secondary = StubProvider("celestrak",   records=[_gp_record("99999")])
    chain     = ProviderChain([primary, secondary])

    records, source = chain.fetch_group("active", 100)
    assert source == "space-track"
    assert records[0]["NORAD_CAT_ID"] == "25544"
    assert secondary.calls == []


def test_failure_falls_through_to_the_next_provider_automatically():
    primary   = StubProvider("space-track", fail=True)
    secondary = StubProvider("celestrak",   records=[_gp_record("99999")])
    chain     = ProviderChain([primary, secondary])

    records, source = chain.fetch_group("active", 100)
    assert source == "celestrak"
    assert primary.calls == ["active"]


def test_an_unavailable_provider_is_skipped_without_being_called():
    primary   = StubProvider("space-track", available=False)
    secondary = StubProvider("celestrak",   records=[_gp_record("1")])
    chain     = ProviderChain([primary, secondary])

    _, source = chain.fetch_group("active", 100)
    assert source == "celestrak"
    assert primary.calls == []


def test_providers_are_tried_in_the_declared_order():
    tried: List[str] = []

    class Recorder(StubProvider):
        def fetch_group(self, group, limit, db=None):
            tried.append(self.name)
            return super().fetch_group(group, limit, db)

    chain = ProviderChain([
        Recorder("space-track", fail=True),
        Recorder("celestrak",   fail=True),
        Recorder("cache",       records=[_gp_record("1")]),
    ])
    _, source = chain.fetch_group("active", 100)
    assert tried == ["space-track", "celestrak", "cache"]
    assert source == "cache"


def test_a_crashing_provider_does_not_take_the_chain_down():
    class Exploding(StubProvider):
        def fetch_group(self, group, limit, db=None):
            raise RuntimeError("boom")

    chain = ProviderChain([Exploding("space-track"), StubProvider("celestrak", records=[_gp_record("1")])])
    _, source = chain.fetch_group("active", 100)
    assert source == "celestrak"


def test_all_providers_failing_reports_every_reason():
    chain = ProviderChain([
        StubProvider("space-track", fail=True),
        StubProvider("celestrak",   fail=True),
        StubProvider("cache",       fail=True),
    ])
    with pytest.raises(AllProvidersFailedError) as exc_info:
        chain.fetch_group("active", 100)
    failures = exc_info.value.failures
    assert set(failures) == {"space-track", "celestrak", "cache"}
    assert "simulated outage" in failures["space-track"]


# ---------------------------------------------------------------------------
# Cache provider (backed by SQLite)
# ---------------------------------------------------------------------------

def test_a_successful_remote_fetch_is_written_to_the_cache(sqlite_db):
    cache = LocalCacheProvider()
    chain = ProviderChain([StubProvider("space-track", records=[_gp_record("25544")])], cache=cache)

    chain.fetch_group("active", 100, db=sqlite_db)

    row = sqlite_db.query(ProviderCache).filter(ProviderCache.group_name == "active").first()
    assert row is not None
    assert row.source == "space-track"
    assert row.count == 1


def test_ingestion_survives_a_total_remote_outage_by_replaying_the_cache(sqlite_db):
    cache = LocalCacheProvider()

    # Good day: Space-Track answers and payload is cached.
    healthy = ProviderChain([StubProvider("space-track", records=[_gp_record("25544")])], cache=cache)
    healthy.fetch_group("active", 100, db=sqlite_db)

    # Bad day: both remote sources are down.
    degraded = ProviderChain(
        [StubProvider("space-track", fail=True), StubProvider("celestrak", fail=True), cache],
        cache=cache,
    )
    records, source = degraded.fetch_group("active", 100, db=sqlite_db)
    assert source == "cache"
    assert records[0]["NORAD_CAT_ID"] == "25544"


def test_the_cache_does_not_overwrite_itself_when_it_serves_a_request(sqlite_db):
    cache = LocalCacheProvider()
    cache.store(sqlite_db, "active", "space-track", [_gp_record("25544")])
    row_before = sqlite_db.query(ProviderCache).filter(ProviderCache.group_name == "active").first()
    cached_at_before = row_before.cached_at

    chain = ProviderChain([cache], cache=cache)
    chain.fetch_group("active", 100, db=sqlite_db)

    row_after = sqlite_db.query(ProviderCache).filter(ProviderCache.group_name == "active").first()
    assert row_after.cached_at == cached_at_before


def test_an_empty_cache_fails_rather_than_returning_nothing(sqlite_db):
    cache = LocalCacheProvider()
    with pytest.raises(ProviderError):
        cache.fetch_group("active", 100, db=sqlite_db)


# ---------------------------------------------------------------------------
# SpaceTrack provider
# ---------------------------------------------------------------------------

def test_spacetrack_provider_is_unavailable_without_credentials():
    assert SpaceTrackProvider(MagicMock(username=None, password=None)).is_available() is False
    assert SpaceTrackProvider(MagicMock(username="u", password="p")).is_available() is True


def test_spacetrack_provider_treats_an_empty_answer_as_a_failure():
    service = MagicMock(username="u", password="p")
    service.authenticate.return_value = True
    service.fetch_group_json.return_value = []
    with pytest.raises(ProviderError):
        SpaceTrackProvider(service).fetch_group("active", 100)


def test_spacetrack_provider_fails_when_authentication_is_rejected():
    service = MagicMock(username="u", password="p")
    service.authenticate.return_value = False
    with pytest.raises(ProviderError, match="authentication failed"):
        SpaceTrackProvider(service).fetch_group("active", 100)


# ---------------------------------------------------------------------------
# CelesTrak provider
# ---------------------------------------------------------------------------

def _celestrak_provider(handler) -> CelesTrakProvider:
    provider = CelesTrakProvider(base_url="https://celestrak.test")
    provider.client = httpx.Client(transport=httpx.MockTransport(handler))
    return provider


def test_celestrak_returns_omm_records_and_respects_the_limit():
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.params["GROUP"] == "active"
        return httpx.Response(200, json=[_gp_record(str(i)) for i in range(10)])

    records = _celestrak_provider(handler).fetch_group("active", limit=3)
    assert len(records) == 3


def test_celestrak_maps_debris_onto_the_tracked_debris_clouds():
    seen: List[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(request.url.params["GROUP"])
        return httpx.Response(200, json=[_gp_record("1")])

    _celestrak_provider(handler).fetch_group("debris", limit=500)
    assert "cosmos-2251-debris" in seen
    assert all("debris" in g for g in seen)


def test_celestrak_raises_on_an_http_error():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(503)

    with pytest.raises(ProviderError, match="503"):
        _celestrak_provider(handler).fetch_group("active", limit=10)


def test_celestrak_rate_limit_falls_through_to_the_cache(sqlite_db):
    body = (
        "GP data has not updated since your last successful download of "
        "GROUP=starlink at 2026-07-14 17:57:21 UTC. Data is updated once every 2 hours."
    )

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(403, text=body)

    provider = _celestrak_provider(handler)
    with pytest.raises(ProviderError, match="data unchanged"):
        provider.fetch_group("starlink", limit=10)

    cache = LocalCacheProvider()
    cache.store(sqlite_db, "starlink", "celestrak", [_gp_record("25544")])

    records, source = ProviderChain([provider, cache], cache=cache).fetch_group(
        "starlink", 10, db=sqlite_db
    )
    assert source == "cache"
    assert records[0]["NORAD_CAT_ID"] == "25544"


def test_celestrak_raises_when_the_response_is_not_a_record_list():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"error": "Invalid query"})

    with pytest.raises(ProviderError):
        _celestrak_provider(handler).fetch_group("active", limit=10)


def test_celestrak_keeps_the_debris_clouds_that_did_answer():
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.params["GROUP"] == "cosmos-1408-debris":
            return httpx.Response(500)
        return httpx.Response(200, json=[_gp_record("42")])

    records = _celestrak_provider(handler).fetch_group("debris", limit=500)
    assert len(records) > 0


# ---------------------------------------------------------------------------
# Chain assembly from configuration
# ---------------------------------------------------------------------------

def test_the_default_chain_is_spacetrack_then_celestrak_then_cache():
    chain = build_provider_chain(MagicMock(username="u", password="p"))
    assert chain.order == ["space-track", "celestrak", "cache"]


def test_the_priority_order_is_configurable(monkeypatch):
    from app.core import config
    monkeypatch.setattr(config.settings, "SATELLITE_PROVIDER_PRIORITY", "celestrak,cache")
    chain = build_provider_chain(MagicMock(username="u", password="p"))
    assert chain.order == ["celestrak", "cache"]


def test_an_unknown_provider_name_is_ignored_rather_than_crashing(monkeypatch):
    from app.core import config
    monkeypatch.setattr(config.settings, "SATELLITE_PROVIDER_PRIORITY", "space-track,not-a-provider,cache")
    chain = build_provider_chain(MagicMock(username="u", password="p"))
    assert chain.order == ["space-track", "cache"]
