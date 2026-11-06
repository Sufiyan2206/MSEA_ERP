"""Helpers shared by blueprints."""
from flask import jsonify

from app.core.db import SessionLocal


def db():
    return SessionLocal()


def ok(data=None, **extra):
    out = {"data": data}
    out.update(extra)
    return jsonify(out)


def rows(items, total: int | None = None):
    return jsonify({"data": [i.to_dict() if hasattr(i, "to_dict") else i for i in items], "total": total if total is not None else len(items)})
