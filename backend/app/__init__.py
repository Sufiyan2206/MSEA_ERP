"""Flask application factory.

create_app() wires: config, database engine, CORS, request correlation ids,
error handlers, blueprints under /api/v1, the scheduler (automation jobs) and
the health endpoint used by the OCI load balancer.
"""
import logging
import uuid
from decimal import Decimal

from flask import Flask, g, jsonify, request
from flask.json.provider import DefaultJSONProvider
from flask_cors import CORS

from app.core.config import Config
from app.core.db import SessionLocal, init_engine
from app.core.errors import register_error_handlers

API_PREFIX = "/api/v1"


class _JSON(DefaultJSONProvider):
    """Money columns are Decimal; serialise as numbers, dates as ISO strings."""
    @staticmethod
    def default(o):
        if isinstance(o, Decimal):
            return float(o)
        return DefaultJSONProvider.default(o)


def create_app(config_object=Config) -> Flask:
    app = Flask(__name__)
    app.json = _JSON(app)
    app.config.from_object(config_object)
    logging.basicConfig(level=app.config["LOG_LEVEL"], format="%(asctime)s %(levelname)s %(name)s %(message)s")
    init_engine(app.config["DATABASE_URL"], echo=app.config["SQL_ECHO"])
    CORS(app, origins=app.config["CORS_ORIGINS"], supports_credentials=False)
    register_error_handlers(app)

    @app.before_request
    def _cid():
        g.correlation_id = request.headers.get("X-Request-Id") or uuid.uuid4().hex[:12]

    @app.after_request
    def _headers(resp):
        resp.headers["X-Request-Id"] = getattr(g, "correlation_id", "")
        resp.headers["X-Content-Type-Options"] = "nosniff"
        resp.headers["X-Frame-Options"] = "DENY"
        return resp

    @app.teardown_appcontext
    def _remove_session(_exc):
        SessionLocal.remove()

    @app.get("/health")
    def health():
        from sqlalchemy import text
        try:
            SessionLocal().execute(text("SELECT 1"))
            db = "ok"
        except Exception as e:  # pragma: no cover
            db = f"error: {e.__class__.__name__}"
        return jsonify({"status": "ok" if db == "ok" else "degraded", "db": db, "env": app.config["ENV"]})

    from app.api import register_blueprints
    register_blueprints(app, API_PREFIX)

    if app.config.get("SCHEDULER_ENABLED"):
        from app.services.scheduler import start_scheduler
        start_scheduler(app)
    return app
