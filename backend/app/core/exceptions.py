"""
Centralized FastAPI exception handlers.

These handlers guarantee that every error — whether an explicit
``HTTPException``, a request validation failure, or an unexpected
server error — is returned as a unified JSON envelope:

    {
        "success": false,
        "error": {
            "code": "NOT_FOUND",
            "message": "Satellite with NORAD ID 25544 was not found.",
            "details": null
        }
    }

No stack traces or internal exception text are ever exposed to clients.
"""

import logging
from typing import Any, Dict, Optional, Union

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from schemas.api_schemas import APIErrorDetail, APIErrorResponse

logger = logging.getLogger("app")


# ---------------------------------------------------------------------------
# Error code resolution
# ---------------------------------------------------------------------------

# Map human-readable codes to HTTP status codes for consistency.
_STATUS_CODE_MAP: Dict[int, str] = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    422: "VALIDATION_ERROR",
    429: "RATE_LIMITED",
    500: "INTERNAL_SERVER_ERROR",
    502: "BAD_GATEWAY",
    503: "SERVICE_UNAVAILABLE",
    504: "GATEWAY_TIMEOUT",
}


def _code_for_status(status_code: int) -> str:
    return _STATUS_CODE_MAP.get(status_code, f"ERROR_{status_code}")


def _make_response(
    status_code: int,
    code: str,
    message: str,
    details: Optional[Any] = None,
) -> JSONResponse:
    payload = APIErrorResponse(
        success=False,
        error=APIErrorDetail(code=code, message=message, details=details),
    )
    return JSONResponse(status_code=status_code, content=payload.model_dump())


# ---------------------------------------------------------------------------
# Handlers
# ---------------------------------------------------------------------------

async def http_exception_handler(
    request: Request, exc: Union[StarletteHTTPException, RequestValidationError]
) -> JSONResponse:
    """Handle FastAPI/Starlette HTTPException with the unified envelope."""
    if isinstance(exc, StarletteHTTPException):
        status_code = exc.status_code
        code = _code_for_status(status_code)
        # `detail` may be a str or a structured dict/list.
        detail = exc.detail
        message = detail if isinstance(detail, str) else "Request failed."
        return _make_response(status_code, code, message)
    return _make_response(
        status.HTTP_500_INTERNAL_SERVER_ERROR,
        "INTERNAL_SERVER_ERROR",
        "An unexpected error occurred.",
    )


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Return 422 with the unified envelope, nesting Pydantic errors in details."""
    return _make_response(
        status.HTTP_422_UNPROCESSABLE_ENTITY,
        "VALIDATION_ERROR",
        "Request validation failed. Please review the supplied parameters.",
        details=exc.errors(),
    )


async def unhandled_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    """Catch every otherwise-unhandled exception and hide internals."""
    logger.error(
        "Unhandled exception on %s %s: %s",
        request.method,
        request.url.path,
        exc,
        exc_info=True,
    )
    return _make_response(
        status.HTTP_500_INTERNAL_SERVER_ERROR,
        "INTERNAL_SERVER_ERROR",
        "An internal server error occurred. Our team has been notified.",
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Attach all centralized handlers to the FastAPI application."""
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)