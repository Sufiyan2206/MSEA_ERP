"""Admissions CRM: lead pipeline with stage rules and automatic onboarding
(the auOnboard automation from the single-file app): SRF paid → admit creates the
student, generates fee demands, assigns a section and notifies the parent desk."""
from datetime import date, datetime

from flask import g

from app.core.errors import Conflict, NotFound, PolicyViolation
from app.models import LEAD_STAGES, Branch, Lead, LeadEvent, Section, Student
from app.services import audit, notify
from app.services.fees import generate_demands
from app.services.numbering import next_no

NEXT = {LEAD_STAGES[i]: LEAD_STAGES[i + 1] for i in range(len(LEAD_STAGES) - 2)}


def add_event(s, lead: Lead, kind: str, text: str):
    s.add(LeadEvent(lead_id=lead.id, at=datetime.utcnow(), kind=kind, text=text, by_name=g.user.name))


def create_lead(s, d: dict) -> Lead:
    dup = s.query(Lead).filter(Lead.mobile == d["mobile"], Lead.branch_id == d["branch_id"], Lead.stage.notin_(["Admitted", "Lost"])).first()
    if dup:
        raise Conflict(f"An open enquiry {dup.no} already exists for mobile {d['mobile']} ({dup.name}).")
    branch = s.get(Branch, d["branch_id"])
    if not branch:
        raise NotFound("Branch not found.")
    lead = Lead(no=next_no(s, "ENQ", branch.code), branch_id=d["branch_id"], name=d["name"], class_name=d["class_name"], parent_name=d.get("parent_name"), mobile=d["mobile"], email=d.get("email"), source=d.get("source", "Walk-in"), stage="New", counsellor_id=d.get("counsellor_id") or g.user.id, next_follow_up=d.get("next_follow_up"), created_by=g.user.id)
    s.add(lead); s.flush()
    add_event(s, lead, "created", f"Enquiry created via {lead.source}")
    audit.record(s, "admissions", "Lead created", entity="lead", entity_id=lead.id, branch_id=lead.branch_id, new={"no": lead.no, "name": lead.name})
    return lead


def move_stage(s, lead_id: str, to: str, note: str | None, *, srf_amount: float | None = None, section: str | None = None) -> Lead:
    lead = s.get(Lead, lead_id)
    if not lead:
        raise NotFound("Enquiry not found.")
    if to not in LEAD_STAGES:
        raise PolicyViolation("Unknown stage.")
    if lead.stage in ("Admitted", "Lost"):
        raise Conflict(f"Enquiry is already {lead.stage}.")
    if to == "Lost":
        if len((note or "").strip()) < 5:
            raise PolicyViolation("Lost reason is mandatory.")
        lead.lost_reason = note
    elif to != NEXT.get(lead.stage):
        raise PolicyViolation(f"From {lead.stage} the next stage is {NEXT.get(lead.stage)}; stages cannot be skipped.")
    if to == "SRF Paid":
        if not srf_amount or srf_amount <= 0:
            raise PolicyViolation("SRF amount is required.")
        lead.srf_paid = True; lead.srf_amount = float(srf_amount)
    old = lead.stage; lead.stage = to
    add_event(s, lead, "stage", f"{old} → {to}" + (f": {note}" if note else ""))
    audit.record(s, "admissions", "Lead stage changed", entity="lead", entity_id=lead.id, branch_id=lead.branch_id, old={"stage": old}, new={"stage": to}, reason=note)
    if to == "Admitted":
        onboard(s, lead, section)
    return lead


def onboard(s, lead: Lead, section: str | None) -> Student:
    """Automatic onboarding: student record, admission number, section allocation,
    fee demands, welcome notification."""
    from flask import current_app
    ay = current_app.config["ACADEMIC_YEAR"]
    branch = s.get(Branch, lead.branch_id)
    if not section:
        # pick the section with most free seats
        secs = s.query(Section).filter_by(branch_id=lead.branch_id, class_name=lead.class_name).all()
        best, free = None, -1
        for sec in secs:
            used = s.query(Student).filter_by(branch_id=lead.branch_id, class_name=lead.class_name, section=sec.name, status="Active").count()
            if sec.capacity - used > free:
                best, free = sec.name, sec.capacity - used
        section = best
        if secs and free <= 0:
            notify.notify_roles(s, ["Principal"], f"Class {lead.class_name} at {branch.name} is over capacity after admitting {lead.name}", branch_id=lead.branch_id, kind="warn")
    stu = Student(admission_no=next_no(s, "ADM", branch.code), name=lead.name, branch_id=lead.branch_id, academic_year=ay, class_name=lead.class_name, section=section, parent_name=lead.parent_name, mobile=lead.mobile, email=lead.email, status="Active", join_date=date.today(), source=lead.source, lead_id=lead.id, created_by=g.user.id)
    s.add(stu); s.flush()
    lead.student_id = stu.id; lead.admission_no = stu.admission_no
    demands = generate_demands(s, stu, ay)
    add_event(s, lead, "onboard", f"Admitted as {stu.admission_no}, section {section or '-'}, {len(demands)} fee demands generated")
    audit.record(s, "students", "Student admitted (auto-onboarding)", entity="student", entity_id=stu.id, branch_id=stu.branch_id, new={"admission_no": stu.admission_no, "section": section, "demands": len(demands)})
    notify.notify_roles(s, ["Fee Collector", "Principal"], f"New admission {stu.admission_no} {stu.name} ({lead.class_name}{'-' + section if section else ''}) — fee demands ready", branch_id=lead.branch_id, ref=stu.id, route=f"/students/{stu.id}")
    if stu.email:
        notify.queue_email(s, stu.email, f"Welcome to {branch.name}", f"Dear {stu.parent_name or 'Parent'}, {stu.name} has been admitted. Admission no: {stu.admission_no}.", trigger="onboarding")
    return stu
