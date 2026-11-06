"""Database session management.

One scoped session per request (see app/__init__.py teardown). Services receive
the session explicitly so they can be unit-tested without Flask.
"""
import json
from contextlib import contextmanager
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, scoped_session, sessionmaker


class Base(DeclarativeBase):
    pass


engine = None
SessionLocal = scoped_session(sessionmaker(autoflush=False, expire_on_commit=False))


def _json_default(o):
    if isinstance(o, Decimal):
        return float(o)
    if isinstance(o, (datetime, date)):
        return o.isoformat()
    return str(o)


def json_dumps(o) -> str:
    """Serializer for JSON columns (audit old/new, denominations…): Decimal and dates are safe."""
    return json.dumps(o, default=_json_default, ensure_ascii=False)


def init_engine(url: str, echo: bool = False):
    global engine
    kwargs = {"echo": echo, "pool_pre_ping": True, "future": True, "json_serializer": json_dumps}
    if url.startswith("sqlite"):
        # :memory: (tests) needs one shared connection; a file DB (local dev) gets one connection per thread.
        kwargs.update(connect_args={"check_same_thread": False})
        if ":memory:" in url:
            from sqlalchemy.pool import StaticPool

            kwargs.update(poolclass=StaticPool)
    engine = create_engine(url, **kwargs)
    if url.startswith("sqlite"):
        @event.listens_for(engine, "connect")
        def _fk_on(dbapi_conn, _):  # pragma: no cover - sqlite only
            dbapi_conn.execute("PRAGMA foreign_keys=ON")
    SessionLocal.configure(bind=engine)
    return engine


@contextmanager
def session_scope():
    """Transactional scope for background jobs and scripts."""
    s = SessionLocal()
    try:
        yield s
        s.commit()
    except Exception:
        s.rollback()
        raise
    finally:
        SessionLocal.remove()
