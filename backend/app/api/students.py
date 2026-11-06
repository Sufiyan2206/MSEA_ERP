from flask import Blueprint, g, request

from app.api._common import db, ok
from app.core.errors import ApiError, NotFound
from app.core.security import assert_scope, require, scope_filter
from app.core.validation import as_date, body, need, page_args
from app.models import Branch, Student
from app.services import audit
from app.services.fees import generate_demands, student_balance
from app.services.numbering import next_no

bp = Blueprint("students", __name__, url_prefix="/students")


def _dto(st: Student):
    return dict(st.to_dict(), branch=st.branch.name if st.branch else None)


@bp.get("")
@require("students", "View")
def list_students():
    s = db(); limit, offset = page_args()
    q = scope_filter(s.query(Student), Student.branch_id)
    a = request.args
    if a.get("branch_id"): q = q.filter(Student.branch_id == a["branch_id"])
    if a.get("class_name"): q = q.filter(Student.class_name == a["class_name"])
    if a.get("section"): q = q.filter(Student.section == a["section"])
    if a.get("status"): q = q.filter(Student.status == a["status"])
    if a.get("q"):
        like = f"%{a['q']}%"; q = q.filter((Student.name.ilike(like)) | (Student.admission_no.ilike(like)) | (Student.mobile.ilike(like)))
    total = q.count()
    return ok([_dto(x) for x in q.order_by(Student.class_name, Student.section, Student.name).offset(offset).limit(limit).all()], total=total)


@bp.post("")
@require("students", "Add")
def add_student():
    d = body(); need(d, "name", "branch_id", "class_name"); s = db()
    assert_scope(d["branch_id"])
    branch = s.get(Branch, d["branch_id"])
    if not branch:
        raise NotFound("Branch not found.")
    from flask import current_app
    ay = d.get("academic_year") or current_app.config["ACADEMIC_YEAR"]
    st = Student(admission_no=d.get("admission_no") or next_no(s, "ADM", branch.code), name=d["name"], branch_id=d["branch_id"], academic_year=ay, class_name=d["class_name"], section=d.get("section"), gender=d.get("gender"),
                 dob=as_date(d["dob"], "dob") if d.get("dob") else None, parent_name=d.get("parent_name"), mobile=d.get("mobile"), email=d.get("email"), address=d.get("address"), category=d.get("category", "General"),
                 status="Active", join_date=as_date(d.get("join_date") or str(__import__("datetime").date.today()), "join_date"), source=d.get("source", "Direct"), created_by=g.user.id)
    if s.query(Student).filter_by(admission_no=st.admission_no).first():
        raise ApiError("Admission number already exists.")
    s.add(st); s.flush()
    n = len(generate_demands(s, st, ay)) if d.get("generate_demands", True) else 0
    audit.record(s, "students", "Student added", entity="student", entity_id=st.id, branch_id=st.branch_id, new={"admission_no": st.admission_no, "demands": n})
    s.commit()
    return ok(dict(_dto(st), demands_generated=n)), 201


@bp.get("/<sid>")
@require("students", "View")
def get_student(sid):
    s = db(); st = s.get(Student, sid)
    if not st:
        raise NotFound("Student not found.")
    assert_scope(st.branch_id)
    return ok(dict(_dto(st), fees=student_balance(s, sid)))


@bp.patch("/<sid>")
@require("students", "Edit")
def edit_student(sid):
    d = body(); s = db(); st = s.get(Student, sid)
    if not st:
        raise NotFound("Student not found.")
    assert_scope(st.branch_id)
    if len((d.get("reason") or "").strip()) < 5:
        raise ApiError("A reason (5+ chars) is required to edit a student record.")
    old = st.to_dict()
    for k in ("name", "section", "class_name", "gender", "parent_name", "mobile", "email", "address", "category", "photo_url"):
        if k in d: setattr(st, k, d[k])
    if "dob" in d: st.dob = as_date(d["dob"], "dob") if d["dob"] else None
    if d.get("status") in ("Active", "Withdrawn", "Transferred", "Alumni"):
        st.status = d["status"]
        if d["status"] != "Active":
            st.exit_date = as_date(d.get("exit_date") or str(__import__("datetime").date.today()), "exit_date")
    audit.record(s, "students", "Student edited", entity="student", entity_id=st.id, branch_id=st.branch_id, old=old, new={k: v for k, v in d.items() if k != "reason"}, reason=d["reason"])
    s.commit()
    return ok(_dto(st))


@bp.post("/<sid>/demands/generate")
@require("fees", "Add")
def regen(sid):
    s = db(); st = s.get(Student, sid)
    if not st:
        raise NotFound("Student not found.")
    assert_scope(st.branch_id)
    from flask import current_app
    n = len(generate_demands(s, st, body().get("academic_year") or current_app.config["ACADEMIC_YEAR"]))
    audit.record(s, "fees", "Demands generated", entity="student", entity_id=sid, branch_id=st.branch_id, new={"count": n}); s.commit()
    return ok({"generated": n, "fees": student_balance(s, sid)})
