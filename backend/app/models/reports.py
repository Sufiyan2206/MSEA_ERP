"""Report builder definitions, delivery log, email log and key/value settings."""
from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.base import TimestampMixin


class ReportDefinition(Base, TimestampMixin):
    __tablename__ = "report_definitions"
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    dataset: Mapped[str] = mapped_column(String(40), nullable=False)
    columns: Mapped[list | None] = mapped_column(JSON)
    filters: Mapped[list | None] = mapped_column(JSON)
    group_by: Mapped[str | None] = mapped_column(String(40))
    sort_by: Mapped[str | None] = mapped_column(String(40))
    sort_desc: Mapped[bool] = mapped_column(default=False)
    row_limit: Mapped[int] = mapped_column(Integer, default=500)
    version: Mapped[int] = mapped_column(Integer, default=1)
    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    shared_roles: Mapped[list | None] = mapped_column(JSON)
    schedule: Mapped[dict | None] = mapped_column(JSON)  # {"on":true,"freq":"Weekly","day":1,"roles":[...]}
    last_run_on: Mapped[str | None] = mapped_column(String(10))


class ReportRun(Base, TimestampMixin):
    __tablename__ = "report_runs"
    no: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    definition_id: Mapped[str | None] = mapped_column(String(32), index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1)
    trigger: Mapped[str] = mapped_column(String(20), nullable=False)  # manual / schedule
    rows: Mapped[int] = mapped_column(Integer, default=0)
    recipients: Mapped[list | None] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String(40), nullable=False)
    file_url: Mapped[str | None] = mapped_column(String(255))


class EmailLog(Base, TimestampMixin):
    __tablename__ = "email_log"
    to: Mapped[str] = mapped_column(Text, nullable=False)
    subject: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str | None] = mapped_column(Text)
    trigger: Mapped[str | None] = mapped_column(String(80))
    status: Mapped[str] = mapped_column(String(40), nullable=False)  # Queued / Sent / Failed / Simulated
    error: Mapped[str | None] = mapped_column(Text)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime)


class Setting(Base):
    __tablename__ = "settings"
    key: Mapped[str] = mapped_column(String(80), primary_key=True)
    value: Mapped[dict | list | str | int | float | None] = mapped_column(JSON)
    updated_by: Mapped[str | None] = mapped_column(String(32))
