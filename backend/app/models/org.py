"""Organisation master: entities (companies), branches, academic years, sections."""
from sqlalchemy import Boolean, Date, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.models.base import TimestampMixin


class Entity(Base, TimestampMixin):
    __tablename__ = "entities"
    code: Mapped[str] = mapped_column(String(16), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    pan: Mapped[str | None] = mapped_column(String(16))
    gstin: Mapped[str | None] = mapped_column(String(20))


class Branch(Base, TimestampMixin):
    __tablename__ = "branches"
    code: Mapped[str] = mapped_column(String(16), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    entity_id: Mapped[str | None] = mapped_column(ForeignKey("entities.id"))
    region: Mapped[str | None] = mapped_column(String(60), index=True)
    zone: Mapped[str | None] = mapped_column(String(60), index=True)
    state: Mapped[str | None] = mapped_column(String(60))
    city: Mapped[str | None] = mapped_column(String(60))
    kind: Mapped[str] = mapped_column(String(30), default="School")  # School / Junior College / Degree College / Pre-school
    capacity: Mapped[int] = mapped_column(Integer, default=0)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    entity = relationship("Entity")


class AcademicYear(Base, TimestampMixin):
    __tablename__ = "academic_years"
    code: Mapped[str] = mapped_column(String(9), unique=True, nullable=False)  # 2026-27
    starts_on: Mapped[Date] = mapped_column(Date, nullable=False)
    ends_on: Mapped[Date] = mapped_column(Date, nullable=False)
    current: Mapped[bool] = mapped_column(Boolean, default=False)


class Section(Base, TimestampMixin):
    __tablename__ = "sections"
    __table_args__ = (UniqueConstraint("branch_id", "class_name", "name", name="uq_section"),)
    branch_id: Mapped[str] = mapped_column(ForeignKey("branches.id"), nullable=False, index=True)
    class_name: Mapped[str] = mapped_column(String(30), nullable=False)  # Nursery … XII, Inter 1st Year …
    name: Mapped[str] = mapped_column(String(8), nullable=False)  # A, B, C
    class_teacher_id: Mapped[str | None] = mapped_column(String(32))  # employees.id (no FK: teachers may be imported later)
    capacity: Mapped[int] = mapped_column(Integer, default=40)
    branch = relationship("Branch")
