"""
Tests for GitHub Issue #10 — Space-Track ingestion pipeline.

These tests mock the Space-Track HTTP client and MongoDB so no network or
live database is required. They verify the acceptance criteria:

  * authentication succeeds
  * JSON payload contains satellites
  * parsed objects are valid (correct field names / noradId present)
  * MongoDB receives bulk upserts keyed on noradId
  * re-running ingestion does NOT create duplicates
  * the pipeline returns a meaningful status dict
  * structured logs are emitted for every stage (no silent failures)
"""

import logging
from unittest.mock import MagicMock, patch

import pytest

from orbital.spacetrack import SpaceTrackService, SYNC_GROUPS


# ---------------------------------------------------------------------------
# Fixtures / helpers
# ---------------------------------------------------------------------------

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


class FakeCollection:
    """In-memory stand-in for a pymongo collection that supports bulk_write."""

    def __init__(self):
        self.docs = {}            # noradId -> doc
        self.bulk_calls = 0

    def bulk_write(self, operations, ordered=True):
        self.bulk_calls += 1
        upserted = modified = 0
        for op in operations:
            filt = op._filter
            norad = filt["noradId"]
            is_new = norad not in self.docs
            self.docs[norad] = op._doc["$set"]
            if is_new:
                upserted += 1
            else:
                modified += 1
        result = MagicMock()
        result.upserted_count = upserted
        result.modified_count = modified
        result.matched_count = len(operations)
        return result

    def count_documents(self, *_a, **_k):
        return len(self.docs)

    def find_one(self, *_a, **_k):
        return None

    def create_index(self, *_a, **_k):
        return "idx"


class FakeDb:
    """Fake MongoSession-like object used by the service.

    Mirrors the real MongoSession interface the service relies on:
    `db.db[collection]` for collection access and `db.client` for ping.
    """

    def __init__(self):
        self.collections = {"satellites": FakeCollection(), "debris": FakeCollection()}
        self.db = self.collections  # MongoSession exposes collections via .db[name]
        self.client = MagicMock()
        self.client.admin.command.return_value = {"ok": 1}


def _build_service_with_mock_client(payloads_per_group):
    """
    Build a SpaceTrackService with a mocked httpx.Client.

    payloads_per_group: dict group -> list of GP records returned for that group.
    """
    svc = SpaceTrackService.__new__(SpaceTrackService)
    svc.username = "user"
    svc.password = "pass"
    svc.base_url = "https://www.space-track.org"
    svc._authenticated = False

    mock_client = MagicMock()
    login_resp = MagicMock()
    login_resp.status_code = 200
    login_resp.text = ""
    mock_client.post.return_value = login_resp
    mock_client.cookies = {"spacetrack_session": "abc"}

    def _get(url):
        resp = MagicMock()
        resp.status_code = 200
        resp.raise_for_status = MagicMock()
        # Map the requested URL back to a configured group by its query signature.
        # (The literal group name is not present in the Space-Track query path.)
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
    return svc


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_authentication_succeeds_with_credentials():
    payloads = {"active": [_make_gp_record("25544", "ISS (ZARYA)")]}
    svc = _build_service_with_mock_client(payloads)
    ok = svc.authenticate()
    assert ok is True
    assert svc._authenticated is True
    # login was attempted
    svc.client.post.assert_called_once()


def test_json_payload_contains_satellites_and_parses():
    records = [
        _make_gp_record("25544", "ISS (ZARYA)"),
        _make_gp_record("43013", "STARLINK-1001"),
    ]
    payloads = {"active": records}
    svc = _build_service_with_mock_client(payloads)
    fetched = svc.fetch_group_json("active", limit=500)
    assert len(fetched) == 2
    assert fetched[0]["NORAD_CAT_ID"] == "25544"


def test_parsed_doc_has_valid_fields():
    rec = _make_gp_record("25544", "ISS (ZARYA)")
    svc = _build_service_with_mock_client({"active": [rec]})
    doc = svc._gp_to_satellite_doc(rec)
    assert doc["noradId"] == "25544"
    assert doc["objectName"] == "ISS (ZARYA)"
    assert doc["objectType"] == "PAYLOAD"
    assert isinstance(doc["meanMotion"], float)
    assert doc["source"] == "space-track"


def test_pipeline_upserts_and_dashboard_reflects_count():
    records = [
        _make_gp_record("25544", "ISS (ZARYA)"),
        _make_gp_record("43013", "STARLINK-1001"),
    ]
    payloads = {"active": records}
    svc = _build_service_with_mock_client(payloads)
    db = FakeDb()

    status = svc.sync_group(db, "active", "PAYLOAD", limit=500)
    assert status["fetched"] == 2
    assert status["parsed"] == 2
    assert status["upserted"] == 2
    assert status["failed"] == 0

    # Dashboard counts come from the same collections.
    sat_count = db.collections["satellites"].count_documents({})
    assert sat_count == 2
    assert db.collections["satellites"].bulk_calls == 1


def test_rerun_does_not_create_duplicates():
    records = [_make_gp_record("25544", "ISS (ZARYA)")]
    payloads = {"active": records}
    svc = _build_service_with_mock_client(payloads)
    db = FakeDb()

    svc.sync_group(db, "active", "PAYLOAD", limit=500)
    svc.sync_group(db, "active", "PAYLOAD", limit=500)  # rerun

    # Still only one document — upsert (not insert) prevents duplicates.
    assert db.collections["satellites"].count_documents({}) == 1
    # Two bulk_write calls, but second one only modified, did not upsert new.
    assert db.collections["satellites"].bulk_calls == 2


def test_all_groups_sync_returns_meaningful_status():
    payloads = {
        "active": [_make_gp_record("25544", "ISS")],
        "starlink": [_make_gp_record("43013", "STARLINK-1")],
        "analyst": [_make_gp_record("99999", "DEB", "DEBRIS")],
    }
    svc = _build_service_with_mock_client(payloads)
    db = FakeDb()
    status = svc.sync_all_groups(db, limit_per_group=500)

    assert status["total_fetched"] == 3
    assert status["total_upserted"] == 3
    assert status["total_failed"] == 0
    # debris went to the debris collection
    assert db.collections["debris"].count_documents({}) == 1
    assert db.collections["satellites"].count_documents({}) == 2


def test_logs_emitted_for_every_stage(caplog):
    records = [_make_gp_record("25544", "ISS (ZARYA)")]
    payloads = {"active": records}
    svc = _build_service_with_mock_client(payloads)
    db = FakeDb()

    with caplog.at_level(logging.INFO, logger="app"):
        svc.sync_all_groups(db, limit_per_group=500)

    log_text = caplog.text
    assert "Authentication" in log_text
    assert "Request sent" in log_text
    assert "Response received" in log_text
    assert "Records fetched" in log_text
    assert "JSON parsing" in log_text
    assert "Database connection" in log_text
    assert "Upsert start" in log_text
    assert "Upsert success" in log_text
    assert "Pipeline complete" in log_text


def test_sync_objects_no_longer_missing(caplog):
    """Regression: the Celery task previously called a non-existent sync_objects()
    method which was silently swallowed. Confirm the correct method exists and works."""
    records = [_make_gp_record("25544", "ISS")]
    payloads = {"active": records}
    svc = _build_service_with_mock_client(payloads)
    db = FakeDb()

    # The Celery task calls sync_all_groups — ensure it is the real method.
    assert hasattr(svc, "sync_all_groups")
    assert not hasattr(svc, "sync_objects") or callable(getattr(svc, "sync_objects", None)) is False

    status = svc.sync_all_groups(db, limit_per_group=500)
    assert status["total_upserted"] == 1