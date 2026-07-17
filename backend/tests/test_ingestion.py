"""
Tests for the Space-Track ingestion pipeline (issue #10).

Uses an in-memory SQLite database via SQLAlchemy so no network or live PostgreSQL
instance is required.
"""

import logging
from unittest.mock import MagicMock

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database.session import Base
import models.db_models  # noqa: F401 — registers all tables
import orbital.providers.cache  # noqa: F401 — registers ProviderCache with Base.metadata

from orbital.providers.chain import ProviderChain
from orbital.providers.spacetrack import SpaceTrackProvider
from orbital.spacetrack import SpaceTrackService, SYNC_GROUPS


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture()
def sqlite_db():
    """In-memory SQLite session — created fresh for each test."""
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    db = Session()
    yield db
    db.close()
    Base.metadata.drop_all(engine)


def _make_gp_record(norad_id: str, name: str, obj_type: str = "PAYLOAD") -> dict:
    return {
        "NORAD_CAT_ID": norad_id,
        "OBJECT_NAME": name,
        "OBJECT_TYPE": obj_type,
        "COUNTRY_CODE": "US",
        "LAUNCH_DATE": "2020-01-01",
        "EPOCH": "2024-01-01T00:00:00",
        "INCLINATION": "51.6",
        "ECCENTRICITY": "0.0001",
        "MEAN_MOTION": "15.5",
        "RA_OF_ASC_NODE": "120.0",
        "ARG_OF_PERICENTER": "0.0",
        "MEAN_ANOMALY": "10.0",
        "TLE_LINE1": "1 line1",
        "TLE_LINE2": "2 line2",
    }


def _build_service(payloads_per_group: dict) -> SpaceTrackService:
    svc = SpaceTrackService.__new__(SpaceTrackService)
    svc.username = "user"
    svc.password = "pass"
    svc.base_url = "https://www.space-track.org"
    svc._authenticated = False

    mock_client = MagicMock()
    login_resp = MagicMock(status_code=200, text="")
    mock_client.post.return_value = login_resp
    mock_client.cookies = {"spacetrack_session": "abc"}

    def _get(url):
        resp = MagicMock(status_code=200)
        resp.raise_for_status = MagicMock()
        for group, payload in payloads_per_group.items():
            if group == "starlink" and "~~STARLINK" in url:
                resp.json.return_value = payload
                return resp
            if group == "analyst" and "OBJECT_TYPE/DEBRIS" in url:
                resp.json.return_value = payload
                return resp
            if group == "active" and "OBJECT_TYPE/PAYLOAD" in url:
                resp.json.return_value = payload
                return resp
        resp.json.return_value = []
        return resp

    mock_client.get.side_effect = _get
    svc.client = mock_client
    svc.providers = ProviderChain([SpaceTrackProvider(svc)])
    return svc


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_authentication_succeeds_with_credentials():
    svc = _build_service({"active": [_make_gp_record("25544", "ISS")]})
    assert svc.authenticate() is True
    assert svc._authenticated is True
    svc.client.post.assert_called_once()


def test_json_payload_contains_satellites_and_parses():
    records = [_make_gp_record("25544", "ISS"), _make_gp_record("43013", "STARLINK-1")]
    svc = _build_service({"active": records})
    fetched = svc.fetch_group_json("active", limit=500)
    assert len(fetched) == 2
    assert fetched[0]["NORAD_CAT_ID"] == "25544"


def test_parsed_doc_has_valid_fields():
    rec = _make_gp_record("25544", "ISS (ZARYA)")
    svc = _build_service({"active": [rec]})
    doc = svc._gp_to_doc(rec)
    assert doc["noradId"] == "25544"
    assert doc["objectName"] == "ISS (ZARYA)"
    assert doc["objectType"] == "PAYLOAD"
    assert isinstance(doc["meanMotion"], float)
    assert doc["source"] == "space-track"


def test_pipeline_upserts_into_sqlite(sqlite_db):
    from models.db_models import Satellite
    records = [_make_gp_record("25544", "ISS"), _make_gp_record("43013", "STARLINK-1")]
    svc = _build_service({"active": records})

    status = svc.sync_group(sqlite_db, "active", "PAYLOAD", limit=500)
    assert status["fetched"] == 2
    assert status["parsed"] == 2
    assert status["upserted"] == 2
    assert status["failed"] == 0
    assert sqlite_db.query(Satellite).count() == 2


def test_rerun_does_not_create_duplicates(sqlite_db):
    from models.db_models import Satellite
    records = [_make_gp_record("25544", "ISS")]
    svc = _build_service({"active": records})

    svc.sync_group(sqlite_db, "active", "PAYLOAD", limit=500)
    svc.sync_group(sqlite_db, "active", "PAYLOAD", limit=500)

    assert sqlite_db.query(Satellite).count() == 1


def test_all_groups_sync_returns_meaningful_status(sqlite_db):
    from models.db_models import Satellite, Debris
    payloads = {
        "active":   [_make_gp_record("25544", "ISS")],
        "starlink": [_make_gp_record("43013", "STARLINK-1")],
        "analyst":  [_make_gp_record("99999", "DEB", "DEBRIS")],
    }
    svc = _build_service(payloads)
    status = svc.sync_all_groups(sqlite_db, limit_per_group=500)

    assert status["total_fetched"] == 3
    assert status["total_upserted"] == 3
    assert status["total_failed"] == 0
    assert sqlite_db.query(Debris).count() == 1
    assert sqlite_db.query(Satellite).count() == 2


def test_sync_all_groups_method_exists():
    svc = _build_service({"active": [_make_gp_record("25544", "ISS")]})
    assert hasattr(svc, "sync_all_groups")
    assert not hasattr(svc, "sync_objects")
