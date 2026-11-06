"""SQLAlchemy models. Importing this package registers every table on Base.metadata,
which is what Alembic autogenerate reads (see migrations/env.py)."""
from app.models.base import TimestampMixin, new_id  # noqa: F401
from app.models.org import Entity, Branch, AcademicYear, Section  # noqa: F401
from app.models.auth import User, Role, RolePermission, AccessMapping, AuditLog, Notification, ACTIONS  # noqa: F401
from app.models.student import Student, Lead, LeadEvent, LEAD_STAGES  # noqa: F401
from app.models.fees import (  # noqa: F401
    FeeHead, FeeStructure, FeeDemand, Receipt, ReceiptLine, Concession, Refund,
    CashierClosing, CashHandover, PAYMENT_MODES,
)
from app.models.attendance import StudentAttendance, StaffAttendance, STUDENT_STATUS  # noqa: F401
from app.models.hr import Employee, LeaveRequest, PayrollRun, PayrollLine  # noqa: F401
from app.models.gaps import GapRule, GapRecord, GapHistory, EscalationLevel, GAP_CATEGORIES, GAP_RISKS, GAP_STATES  # noqa: F401
from app.models.tasks import Delegation, Checklist, ChecklistItem  # noqa: F401
from app.models.reports import ReportDefinition, ReportRun, EmailLog, Setting  # noqa: F401
from app.models.legacy import LegacyDoc, LegacyRecord  # noqa: F401
