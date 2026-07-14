"""
Tests for unified API error responses (GitHub Issue #11).

Verifies that:
  - 404 / invalid routes return the unified JSON envelope.
  - 422 validation failures return the unified JSON envelope with details.
  - HTTPException-based 4xx responses use the unified envelope.
  - Unhandled exceptions return a 500 unified envelope (no leaks).
  - The JSON schema is consistent (success=false, error.code, error.message).
"""

import pytest
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient

from app.main import app as real_app
from app.core.exceptions import (
    http_exception_handler,
    validation_exception_handler,
    unhandled_exception_handler,
    _make_response,
)
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException


client = TestClient(real_app)


# ---------------------------------------------------------------------------
# Schema contract
# ---------------------------------------------------------------------------

def _assert_error_envelope(payload: dict, status_code: int):
    assert payload.get("success") is False, "success flag must be false"
    error = payload.get("error")
    assert isinstance(error, dict), "error must be an object"
    assert "code" in error, "error.code is required"
    assert "message" in error, "error.message is required"
    assert isinstance(error["message"], str) and error["message"].strip(), \
        "error.message must be a non-empty string"
    # No internal exception leakage patterns
    assert "Traceback" not in error["message"]
    assert "Traceback" not in str(payload)
    return error


# ---------------------------------------------------------------------------
# 404 — unknown route
# ---------------------------------------------------------------------------

def test_404_unknown_route_returns_unified_envelope():
    resp = client.get("/api/v1/this-route-does-not-exist")
    assert resp.status_code == 404
    error = _assert_error_envelope(resp.json(), 404)
    assert error["code"] == "NOT_FOUND"


# ---------------------------------------------------------------------------
# 422 — validation error
# ---------------------------------------------------------------------------

def test_422_validation_error_returns_unified_envelope():
    # /satellites uses Query(ge=1). page=0 violates the constraint.
    resp = client.get("/api/v1/satellites?page=0")
    assert resp.status_code == 422
    error = _assert_error_envelope(resp.json(), 422)
    assert error["code"] == "VALIDATION_ERROR"
    assert error.get("details") is not None, "validation details should be present"


def test_422_validation_error_on_collisions_status():
    # update_collision_status expects a Body; missing body triggers 422.
    resp = client.patch("/api/v1/collisions/999/status")
    assert resp.status_code == 422
    error = _assert_error_envelope(resp.json(), 422)
    assert error["code"] == "VALIDATION_ERROR"


# ---------------------------------------------------------------------------
# 404 — known endpoint, missing resource (HTTPException path)
# ---------------------------------------------------------------------------

def test_404_missing_collision_returns_unified_envelope():
    resp = client.get("/api/v1/collisions/999999")
    assert resp.status_code == 404
    error = _assert_error_envelope(resp.json(), 404)
    assert error["code"] == "NOT_FOUND"


# ---------------------------------------------------------------------------
# 500 — unhandled exception
# ---------------------------------------------------------------------------

def test_500_unhandled_exception_returns_unified_envelope():
    # Build a throwaway app with a route that raises, to exercise the
    # global unhandled-exception handler without touching production routes.
    test_app = FastAPI()
    from app.core.exceptions import register_exception_handlers
    register_exception_handlers(test_app)

    @test_app.get("/boom")
    def boom():
        raise RuntimeError("secret-internal-detail")

    # raise_server_exceptions=False so the TestClient returns the
    # handled JSON response instead of re-raising the server error.
    test_client = TestClient(test_app, raise_server_exceptions=False)
    resp = test_client.get("/boom")
    assert resp.status_code == 500
    error = _assert_error_envelope(resp.json(), 500)
    assert error["code"] == "INTERNAL_SERVER_ERROR"
    # Internal detail must NOT be exposed
    assert "secret-internal-detail" not in resp.text


# ---------------------------------------------------------------------------
# Handler unit tests
# ---------------------------------------------------------------------------

def test_http_exception_handler_uses_unified_format():
    from starlette.requests import Request as StarletteRequest
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/x",
        "headers": [],
        "query_string": b"",
    }
    request = StarletteRequest(scope)
    exc = StarletteHTTPException(status_code=401, detail="bad credentials")
    import asyncio
    response = asyncio.run(http_exception_handler(request, exc))
    assert response.status_code == 401
    body = response.body.decode()
    assert '"success":false' in body or '"success": false' in body
    assert "UNAUTHORIZED" in body
    assert "bad credentials" in body


def test_422_handler_nests_validation_details():
    from starlette.requests import Request as StarletteRequest
    scope = {"type": "http", "method": "GET", "path": "/x", "headers": [], "query_string": b""}
    request = StarletteRequest(scope)
    # Minimal fake validation error list
    fake_exc = RequestValidationError(errors=[{"loc": ("query", "page"), "msg": "x", "type": "y"}])
    import asyncio
    response = asyncio.run(validation_exception_handler(request, fake_exc))
    assert response.status_code == 422
    body = response.body.decode()
    assert "VALIDATION_ERROR" in body
    assert "details" in body


def test_make_response_helper():
    resp = _make_response(409, "CONFLICT", "Duplicate resource")
    assert resp.status_code == 409
    assert "CONFLICT" in resp.body.decode()
    assert "Duplicate resource" in resp.body.decode()