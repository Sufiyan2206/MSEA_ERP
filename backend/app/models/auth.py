"""Users, roles, permissions, branch-scope mappings, audit trail, notifications.

Permission model (same as the current application):
  role -> list of (module, action); actions: View, Add, Edit, Verify, Approve,
  Reject, Delete, Export, Configure Settings.
  A user sees data only for the branches in an active AccessMapping
  ("All Branches", "Selected Branches", "All Branches Under Zone/Region/State/Entity").
"""
from datetime import date, datetime

from sqlalchemy import JSON, Boolean, Date, DateTime, ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.models.base import TimestampMixin

ACTIONS = ["View", "Add", "Edit", "Verify", "Approve", "Reject", "Delete", "Export", "Configure Settings"]


class Role(Base, TimestampMixin):
    __tablename__ = "roles"
    name: Mapped[str] = mapped_column(String(60), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(200))
    system: Mapped[bool] = mapped_column(Boolean, default=False)  # cannot be deleted
    permissions = relationship("RolePermission", cascade="all, delete-orphan", back_populates="role")


class RolePermission(Base):
    __tablename__ = "role_permissions"
    __table_args__ = (UniqueConstraint("role_id", "module", "action", name="uq_role_perm"),)
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    role_id: Mapped[str] = mapped_column(ForeignKey("roles.id", ondelete="CASCADE"), nullable=False, index=True)
    module: Mapped[str] = mapped_column(String(40), nullable=False)
    action: Mapped[str] = mapped_column(String(30), nullable=False)
    role = relationship("Role", back_populates="permissions")


class User(Base, TimestampMixin):
    __tablename__ = "users"
    username: Mapped[str] = mapped_column(String(60), unique=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String(120), unique=True)
    mobile: Mapped[str | None] = mapped_column(String(20))
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role_id: Mapped[str] = mapped_column(ForeignKey("roles.id"), nullable=False, index=True)
    branch_id: Mapped[str | None] = mapped_column(ForeignKey("branches.id"), index=True)
    employee_id: Mapped[str | None] = mapped_column(String(32), index=True)
    status: Mapped[str] = mapped_column(String(12), default="Active")  # Active / Inactive / Locked
    failed_logins: Mapped[int] = mapped_column(default=0)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime)
    must_change_password: Mapped[bool] = mapped_column(Boolean, default=True)
    legacy_user_id: Mapped[str | None] = mapped_column(String(16))  # id in the legacy 'users' document (strangler runtime)
    kids: Mapped[list | None] = mapped_column(JSON)  # Parent/Student: [{"branch_id":..,"student_id":..}]
    role = relationship("Role")
    branch = relationship("Branch")


class AccessMapping(Base, TimestampMixin):
    __tablename__ = "access_mappings"
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    scope_type: Mapped[str] = mapped_column(String(40), nullable=False)  # All Branches | Selected Branches | All Branches Under Zone | ... Region | ... State | ... Entity
    scope_value: Mapped[str | None] = mapped_column(String(120))  # zone / region / state / entity code
    branch_ids: Mapped[list | None] = mapped_column(JSON)  # for Selected Branches
    valid_from: Mapped[date] = mapped_column(Date, nullable=False)
    valid_to: Mapped[date | None] = mapped_column(Date)
    level: Mapped[str] = mapped_column(String(20), default="Read Only")  # Read Only / Transact
    status: Mapped[str] = mapped_column(String(12), default="Active")


class AuditLog(Base):
    """Every create / edit / delete / approval / status change. Written by
    app.services.audit.record(); never updated or deleted."""
    __tablename__ = "audit_log"
    __table_args__ = (Index("ix_audit_entity", "entity", "entity_id"), Index("ix_audit_ts", "ts"))
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ts: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    user_id: Mapped[str | None] = mapped_column(String(32), index=True)
    user_name: Mapped[str | None] = mapped_column(String(120))
    role: Mapped[str | None] = mapped_column(String(60))
    module: Mapped[str] = mapped_column(String(40), nullable=False)
    action: Mapped[str] = mapped_column(String(80), nullable=False)
    entity: Mapped[str | None] = mapped_column(String(60))
    entity_id: Mapped[str | None] = mapped_column(String(64))
    branch_id: Mapped[str | None] = mapped_column(String(32), index=True)
    old: Mapped[dict | None] = mapped_column(JSON)
    new: Mapped[dict | None] = mapped_column(JSON)
    reason: Mapped[str | None] = mapped_column(Text)
    evidence: Mapped[str | None] = mapped_column(String(255))
    ip: Mapped[str | None] = mapped_column(String(64))
    device: Mapped[str | None] = mapped_column(String(255))
    screen: Mapped[str | None] = mapped_column(String(80))


class Notification(Base, TimestampMixin):
    __tablename__ = "notifications"
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    text: Mapped[str] = mapped_column(String(500), nullable=False)
    ref: Mapped[str | None] = mapped_column(String(64))
    route: Mapped[str | None] = mapped_column(String(80))  # frontend route to open
    kind: Mapped[str] = mapped_column(String(20), default="info")  # info / reminder / escalation / critical
    read_at: Mapped[datetime | None] = mapped_column(DateTime)
    acknowledged_at: Mapped[datetime | None] = mapped_column(DateTime)
    ack_remark: Mapped[str | None] = mapped_column(String(300))  # critical alerts need a remark
