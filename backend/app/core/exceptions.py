"""
Kepler API exception hierarchy.

Every error the API returns to a client originates from one of these classes (or is
normalised into one by the handlers in `app.core.error_handlers`). Raising a
`KeplerError` subclass instead of a bare `HTTPException` gives the response a stable
machine-readable `code` on top of the HTTP status, so clients can branch on the reason
for a failure without string-matching an English message.

Usage:

    raise NotFoundError(resource="Satellite", identifier=norad_id)
    raise ExternalServiceError(service="Space-Track", reason="authentication rejected")
"""

from enum import Enum
from typing import Any, Dict, Optional


class ErrorCode(str, Enum):
    """Stable, machine-readable error identifiers returned as `error.code`."""

    VALIDATION_ERROR = "VALIDATION_ERROR"
    NOT_FOUND = "NOT_FOUND"
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    CONFLICT = "CONFLICT"
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR"
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
    METHOD_NOT_ALLOWED = "METHOD_NOT_ALLOWED"
    INTERNAL_ERROR = "INTERNAL_ERROR"


class KeplerError(Exception):
    """
    Base class for every error the API deliberately returns.

    Attributes:
        status_code: HTTP status sent to the client.
        code:        Stable `ErrorCode` the client can branch on.
        message:     Human-readable explanation, safe to display to an end user.
        details:     Optional structured context (offending field, valid values, ...).
        headers:     Optional extra response headers (e.g. `WWW-Authenticate`).
    """

    status_code: int = 500
    code: ErrorCode = ErrorCode.INTERNAL_ERROR
    message: str = "An unexpected error occurred."

    def __init__(
        self,
        message: Optional[str] = None,
        *,
        details: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
    ):
        self.message = message or self.message
        self.details = details
        self.headers = headers
        super().__init__(self.message)


class ValidationError(KeplerError):
    """A parameter was syntactically valid but semantically unacceptable (422)."""

    status_code = 422
    code = ErrorCode.VALIDATION_ERROR
    message = "The request contains invalid parameters."


class BadRequestError(KeplerError):
    """The request itself is malformed or asks for something that cannot exist (400)."""

    status_code = 400
    code = ErrorCode.VALIDATION_ERROR
    message = "The request could not be understood."


class NotFoundError(KeplerError):
    """A requested resource does not exist (404)."""

    status_code = 404
    code = ErrorCode.NOT_FOUND
    message = "The requested resource was not found."

    def __init__(
        self,
        message: Optional[str] = None,
        *,
        resource: Optional[str] = None,
        identifier: Optional[Any] = None,
        details: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
    ):
        if message is None and resource is not None:
            message = (
                f"{resource} '{identifier}' was not found."
                if identifier is not None
                else f"{resource} was not found."
            )
        if details is None and resource is not None:
            details = {"resource": resource, "identifier": identifier}
        super().__init__(message, details=details, headers=headers)


class UnauthorizedError(KeplerError):
    """Authentication is missing or the supplied credentials are wrong (401)."""

    status_code = 401
    code = ErrorCode.UNAUTHORIZED
    message = "Authentication failed."

    def __init__(
        self,
        message: Optional[str] = None,
        *,
        details: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
    ):
        # Per RFC 7235 a 401 must tell the client how to authenticate.
        super().__init__(
            message,
            details=details,
            headers=headers or {"WWW-Authenticate": "Bearer"},
        )


class ForbiddenError(KeplerError):
    """The caller is authenticated but not allowed to perform this action (403)."""

    status_code = 403
    code = ErrorCode.FORBIDDEN
    message = "You do not have permission to perform this action."


class ConflictError(KeplerError):
    """The request conflicts with the current state of the resource (409)."""

    status_code = 409
    code = ErrorCode.CONFLICT
    message = "The request conflicts with the current state of the resource."


class ExternalServiceError(KeplerError):
    """An upstream provider (Space-Track, NASA DONKI, OpenAI) failed us (502)."""

    status_code = 502
    code = ErrorCode.EXTERNAL_SERVICE_ERROR
    message = "An upstream service failed to respond correctly."

    def __init__(
        self,
        message: Optional[str] = None,
        *,
        service: Optional[str] = None,
        reason: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
    ):
        if message is None and service is not None:
            message = f"{service} is unavailable or returned an unusable response."
            if reason:
                message = f"{message} ({reason})"
        if details is None and service is not None:
            details = {"service": service}
            if reason:
                details["reason"] = reason
        super().__init__(message, details=details, headers=headers)


class ServiceUnavailableError(KeplerError):
    """A Kepler dependency (database, scheduler) is temporarily unreachable (503)."""

    status_code = 503
    code = ErrorCode.SERVICE_UNAVAILABLE
    message = "The service is temporarily unavailable. Please retry shortly."


class InternalError(KeplerError):
    """An unexpected server-side failure (500)."""

    status_code = 500
    code = ErrorCode.INTERNAL_ERROR
    message = "An unexpected internal error occurred."
