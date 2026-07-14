"""
Central error handling for the Kepler API.

`register_exception_handlers(app)` wires four handlers plus a request-id middleware so
that *every* failure — a raised `KeplerError`, a legacy `HTTPException`, a FastAPI
validation failure, or an unforeseen crash — leaves the server in the same JSON shape:

    {
      "success": false,
      "message": "Satellite '99999' was not found.",
      "error": { "code": "NOT_FOUND", "details": {...} },
      "path": "/api/v1/satellites/99999/telemetry",
      "request_id": "3f2a…",
      "timestamp": "2026-07-14T12:00:00Z"
    }

The 500 handler never echoes the exception text back to the client: the traceback is
logged against `request_id`, and the client is given that same id to quote in a bug
report. That keeps internal details (connection strings, file paths) out of responses
while still making failures diagnosable.
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Callable, Dict, Optional

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.exceptions import ErrorCode, KeplerError
from schemas.api_schemas import ErrorResponse

logger = logging.getLogger("app")

REQUEST_ID_HEADER = "X-Request-ID"

# HTTP status -> error code, for HTTPExceptions raised outside our own hierarchy
# (Starlette's own 404/405, or any `raise HTTPException(...)` left in a route).
_STATUS_TO_CODE: Dict[int, ErrorCode] = {
    status.HTTP_400_BAD_REQUEST: ErrorCode.VALIDATION_ERROR,
    status.HTTP_401_UNAUTHORIZED: ErrorCode.UNAUTHORIZED,
    status.HTTP_403_FORBIDDEN: ErrorCode.FORBIDDEN,
    status.HTTP_404_NOT_FOUND: ErrorCode.NOT_FOUND,
    status.HTTP_405_METHOD_NOT_ALLOWED: ErrorCode.METHOD_NOT_ALLOWED,
    status.HTTP_409_CONFLICT: ErrorCode.CONFLICT,
    status.HTTP_422_UNPROCESSABLE_ENTITY: ErrorCode.VALIDATION_ERROR,
    status.HTTP_502_BAD_GATEWAY: ErrorCode.EXTERNAL_SERVICE_ERROR,
    status.HTTP_503_SERVICE_UNAVAILABLE: ErrorCode.SERVICE_UNAVAILABLE,
}


def get_request_id(request: Request) -> str:
    """Return this request's correlation id, generating one if the middleware was skipped."""
    request_id = getattr(request.state, "request_id", None)
    if not request_id:
        request_id = uuid.uuid4().hex
        request.state.request_id = request_id
    return request_id


def _error_response(
    request: Request,
    *,
    status_code: int,
    code: ErrorCode,
    message: str,
    details: Optional[Any] = None,
    headers: Optional[Dict[str, str]] = None,
) -> JSONResponse:
    request_id = get_request_id(request)
    payload = ErrorResponse(
        success=False,
        message=message,
        error={"code": code.value, "details": details},
        path=request.url.path,
        request_id=request_id,
        timestamp=datetime.now(timezone.utc),
    )
    response_headers = {REQUEST_ID_HEADER: request_id, **(headers or {})}
    return JSONResponse(
        status_code=status_code,
        content=payload.model_dump(mode="json"),
        headers=response_headers,
    )


async def kepler_error_handler(request: Request, exc: KeplerError) -> JSONResponse:
    """Errors we raised on purpose — the message is already client-safe."""
    logger.warning(
        f"[{get_request_id(request)}] {exc.code.value} on {request.method} "
        f"{request.url.path}: {exc.message}"
    )
    return _error_response(
        request,
        status_code=exc.status_code,
        code=exc.code,
        message=exc.message,
        details=exc.details,
        headers=exc.headers,
    )


async def http_exception_handler(
    request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    """Normalise Starlette/FastAPI HTTPExceptions (404 route, 405 method, …) into our shape."""
    code = _STATUS_TO_CODE.get(exc.status_code, ErrorCode.INTERNAL_ERROR)
    detail = exc.detail
    message = detail if isinstance(detail, str) else "The request could not be completed."
    details = None if isinstance(detail, str) else detail

    # Starlette's routing failures carry terse defaults ("Not Found"). Say something the
    # caller can act on, and point them at the API docs.
    docs_url = f"{settings.API_V1_STR}/docs"
    if message == "Not Found":
        message = (
            f"No endpoint matches {request.method} {request.url.path}. "
            f"See the API reference at {docs_url}."
        )
    elif message == "Method Not Allowed":
        message = (
            f"{request.method} is not allowed on {request.url.path}. "
            f"See the API reference at {docs_url}."
        )

    return _error_response(
        request,
        status_code=exc.status_code,
        code=code,
        message=message,
        details=details,
        headers=getattr(exc, "headers", None),
    )


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """
    Turn FastAPI's nested validation errors into a flat, readable field list.

    FastAPI's default body is a raw dump of pydantic internals; this reshapes it into
    `[{"field": "query.page", "message": "…", "type": "…"}]` so a client can highlight
    the offending input directly.
    """
    fields = []
    for err in exc.errors():
        location = ".".join(str(part) for part in err.get("loc", ()))
        fields.append(
            {
                "field": location or "body",
                "message": err.get("msg", "Invalid value."),
                "type": err.get("type", "invalid"),
            }
        )

    summary = fields[0]["field"] if len(fields) == 1 else f"{len(fields)} fields"
    return _error_response(
        request,
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        code=ErrorCode.VALIDATION_ERROR,
        message=f"Request validation failed for {summary}.",
        details={"fields": fields},
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Last line of defence: log the traceback, return a generic 500.

    The exception text is deliberately not sent to the client — it is logged against the
    request id, which the client receives and can quote.
    """
    request_id = get_request_id(request)
    logger.exception(
        f"[{request_id}] Unhandled {type(exc).__name__} on {request.method} "
        f"{request.url.path}: {exc}"
    )
    return _error_response(
        request,
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        code=ErrorCode.INTERNAL_ERROR,
        message=(
            "An unexpected internal error occurred. Quote the request_id below when "
            "reporting this issue."
        ),
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Attach the request-id middleware and all four exception handlers to `app`."""

    @app.middleware("http")
    async def _attach_request_id(request: Request, call_next: Callable):
        request_id = request.headers.get(REQUEST_ID_HEADER) or uuid.uuid4().hex
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers.setdefault(REQUEST_ID_HEADER, request_id)
        return response

    app.add_exception_handler(KeplerError, kepler_error_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)
