"""
Tests for the structured error contract (issue #11).

Every failure — validation, not-found, upstream outage, unhandled crash — must come back
in one shape, with a status code that matches what actually happened.

These tests deliberately avoid any endpoint that touches MongoDB, so they pass on a
machine (or CI runner) with no database running.
"""

from fastapi.testclient import TestClient
from pymongo.errors import ServerSelectionTimeoutError

from app.main import app
from orbital.spacetrack import spacetrack_service
from services.weather_service import weather_service

client = TestClient(app)

# Server errors must be observed as responses, not re-raised into the test.
unsafe_client = TestClient(app, raise_server_exceptions=False)


# A route that blows up in a way no handler anticipates, to exercise the 500 path.
# The secret in the message must never reach the client.
LEAKED_SECRET = "mongodb://admin:hunter2@prod-cluster"


@app.get("/api/v1/_test/boom", include_in_schema=False)
def _boom():
    raise RuntimeError(f"connection refused: {LEAKED_SECRET}")


def assert_error_shape(payload: dict, *, code: str, path: str) -> None:
    """Assert the response is a well-formed ErrorResponse."""
    assert payload["success"] is False
    assert payload["error"]["code"] == code
    assert payload["path"] == path
    assert payload["request_id"]
    assert payload["timestamp"]
    # A message the UI can show as-is: present, non-empty, and not a bare repr.
    assert isinstance(payload["message"], str) and payload["message"].strip()


# ---------------------------------------------------------------------------
# Consistent shape across every kind of failure
# ---------------------------------------------------------------------------

def test_unknown_route_returns_structured_404():
    resp = client.get("/api/v1/invalid-route")
    assert resp.status_code == 404
    assert_error_shape(resp.json(), code="NOT_FOUND", path="/api/v1/invalid-route")


def test_wrong_method_returns_structured_405():
    resp = client.post("/api/v1/dashboard/summary")
    assert resp.status_code == 405
    assert_error_shape(
        resp.json(), code="METHOD_NOT_ALLOWED", path="/api/v1/dashboard/summary"
    )


def test_every_response_carries_a_request_id_header():
    ok = client.get("/health")
    err = client.get("/api/v1/invalid-route")
    assert ok.headers["X-Request-ID"]
    assert err.headers["X-Request-ID"] == err.json()["request_id"]


def test_client_supplied_request_id_is_echoed_back():
    resp = client.get("/api/v1/invalid-route", headers={"X-Request-ID": "trace-abc-123"})
    assert resp.headers["X-Request-ID"] == "trace-abc-123"
    assert resp.json()["request_id"] == "trace-abc-123"


# ---------------------------------------------------------------------------
# Validation errors name the offending field
# ---------------------------------------------------------------------------

def test_query_param_out_of_range_returns_field_level_422():
    resp = client.get("/api/v1/collisions?page=0")
    assert resp.status_code == 422

    body = resp.json()
    assert_error_shape(body, code="VALIDATION_ERROR", path="/api/v1/collisions")

    fields = body["error"]["details"]["fields"]
    assert any(f["field"] == "query.page" for f in fields), fields


def test_unknown_enum_value_is_rejected_with_the_allowed_list():
    resp = client.get("/api/v1/catalog/live?group=not-a-real-group")
    assert resp.status_code == 422

    body = resp.json()
    assert_error_shape(body, code="VALIDATION_ERROR", path="/api/v1/catalog/live")

    details = body["error"]["details"]
    assert details["field"] == "group"
    assert details["value"] == "not-a-real-group"
    # The error tells the caller what *would* have worked.
    assert "active" in details["allowed"]


def test_weather_history_rejects_unknown_event_type():
    resp = client.get("/api/v1/weather/history?event_type=ALIEN_INVASION")
    assert resp.status_code == 422
    body = resp.json()
    assert_error_shape(body, code="VALIDATION_ERROR", path="/api/v1/weather/history")
    assert "SOLAR_FLARE" in body["error"]["details"]["allowed"]


# ---------------------------------------------------------------------------
# Upstream failures are 502s, not empty 200s
# ---------------------------------------------------------------------------

def test_failed_weather_sync_is_not_reported_as_success(monkeypatch):
    """
    Regression for the old behaviour: a sync that raised came back as HTTP 200 with
    success=false, so any caller checking the status code saw a failure as a success.
    A database outage must also be blamed on the database, not on NASA DONKI.
    """
    def _boom(_db):
        raise ServerSelectionTimeoutError("no mongo reachable")

    monkeypatch.setattr(weather_service, "sync_weather", _boom)

    resp = client.post("/api/v1/weather/sync")
    assert resp.status_code == 503

    body = resp.json()
    assert_error_shape(body, code="SERVICE_UNAVAILABLE", path="/api/v1/weather/sync")
    assert body["error"]["details"]["dependency"] == "MongoDB"


def test_failed_weather_fetch_is_reported_as_an_upstream_error(monkeypatch):
    def _boom(_db):
        raise RuntimeError("DONKI returned garbage")

    monkeypatch.setattr(weather_service, "sync_weather", _boom)

    resp = client.post("/api/v1/weather/sync")
    assert resp.status_code == 502

    body = resp.json()
    assert_error_shape(body, code="EXTERNAL_SERVICE_ERROR", path="/api/v1/weather/sync")
    assert body["error"]["details"]["service"] == "NASA DONKI"


def test_spacetrack_outage_returns_502_not_an_empty_success(monkeypatch):
    """
    Regression for the old behaviour: when Space-Track auth failed, /catalog/live
    returned HTTP 200 with an empty list, which a client could not distinguish from
    "Space-Track has no records for this group".
    """
    monkeypatch.setattr(spacetrack_service, "authenticate", lambda: False)

    resp = client.get("/api/v1/catalog/live?group=active")
    assert resp.status_code == 502

    body = resp.json()
    assert_error_shape(body, code="EXTERNAL_SERVICE_ERROR", path="/api/v1/catalog/live")
    assert body["error"]["details"]["service"] == "Space-Track"


# ---------------------------------------------------------------------------
# Unhandled crashes: generic 500, traceback kept server-side
# ---------------------------------------------------------------------------

def test_unhandled_exception_returns_structured_500():
    resp = unsafe_client.get("/api/v1/_test/boom")
    assert resp.status_code == 500
    assert_error_shape(resp.json(), code="INTERNAL_ERROR", path="/api/v1/_test/boom")


def test_unhandled_exception_does_not_leak_internals_to_the_client():
    resp = unsafe_client.get("/api/v1/_test/boom")
    assert LEAKED_SECRET not in resp.text
    assert "RuntimeError" not in resp.text
    # …but the client still gets an id it can quote in a bug report.
    assert resp.json()["request_id"]
