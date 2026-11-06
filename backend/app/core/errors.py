"""Uniform error responses.

Every error reaching the client has the shape
  {"error": {"code": "...", "message": "...", "details": {...}}}
and is logged with a correlation id so a developer can grep the server log.
Codes: validation_error, not_found, forbidden, unauthorized, conflict, policy_violation, server_error.
"""
import logging
import uuid

from flask import jsonify, g

log = logging.getLogger("msea")


class ApiError(Exception):
    status = 400
    code = "validation_error"

    def __init__(self, message: str, status: int | None = None, code: str | None = None, details: dict | None = None):
        super().__init__(message)
        self.message = message
        if status:
            self.status = status
        if code:
            self.code = code
        self.details = details or {}


class NotFound(ApiError):
    status = 404
    code = "not_found"


class Forbidden(ApiError):
    status = 403
    code = "forbidden"


class Unauthorized(ApiError):
    status = 401
    code = "unauthorized"


class Conflict(ApiError):
    status = 409
    code = "conflict"


class PolicyViolation(ApiError):
    """A business rule blocked the action (e.g. duplicate receipt, missing evidence)."""
    status = 422
    code = "policy_violation"


def register_error_handlers(app):
    @app.errorhandler(ApiError)
    def _api_error(e: ApiError):
        cid = getattr(g, "correlation_id", "")
        log.info("api_error cid=%s code=%s msg=%s", cid, e.code, e.message)
        return jsonify({"error": {"code": e.code, "message": e.message, "details": e.details, "correlation_id": cid}}), e.status

    @app.errorhandler(404)
    def _404(_):
        return jsonify({"error": {"code": "not_found", "message": "Route not found"}}), 404

    @app.errorhandler(Exception)
    def _500(e: Exception):
        cid = getattr(g, "correlation_id", "") or uuid.uuid4().hex[:8]
        log.exception("unhandled cid=%s", cid)
        return jsonify({"error": {"code": "server_error", "message": "Internal error; quote the correlation id to support.", "correlation_id": cid}}), 500
