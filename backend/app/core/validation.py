"""Tiny request-validation helpers (no heavy framework; errors are uniform)."""
from datetime import date, datetime
from decimal import Decimal, InvalidOperation

from flask import request

from app.core.errors import ApiError


def body() -> dict:
    data = request.get_json(silent=True)
    if data is None and not request.data:
        return {}
    if not isinstance(data, dict):
        raise ApiError("JSON body must be an object.")
    return data


def need(data: dict, *keys: str) -> None:
    missing = [k for k in keys if data.get(k) in (None, "", [])]
    if missing:
        raise ApiError("Missing required fields.", details={"missing": missing})


def as_date(v, field: str) -> date:
    if isinstance(v, date):
        return v
    try:
        return datetime.strptime(str(v), "%Y-%m-%d").date()
    except Exception:
        raise ApiError(f"{field} must be a date (YYYY-MM-DD).", details={"field": field})


def as_money(v, field: str, min_value: float = 0) -> Decimal:
    try:
        d = Decimal(str(v)).quantize(Decimal("0.01"))
    except (InvalidOperation, TypeError):
        raise ApiError(f"{field} must be a number.", details={"field": field})
    if d < Decimal(str(min_value)):
        raise ApiError(f"{field} must be at least {min_value}.", details={"field": field})
    return d


def one_of(v, options, field: str):
    if v not in options:
        raise ApiError(f"{field} must be one of {', '.join(map(str, options))}.", details={"field": field})
    return v


def page_args(default_limit: int = 50, max_limit: int = 500) -> tuple[int, int]:
    try:
        limit = min(max_limit, max(1, int(request.args.get("limit", default_limit))))
        offset = max(0, int(request.args.get("offset", 0)))
    except ValueError:
        raise ApiError("limit/offset must be integers.")
    return limit, offset
