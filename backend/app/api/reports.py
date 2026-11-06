"""Report builder: datasets, saved definitions (versioned), ad-hoc runs, CSV export, email log."""
import csv
import io

from flask import Blueprint, Response, g, request

from app.api._common import db, ok
from app.core.errors import NotFound, PolicyViolation
from app.core.security import current_user, require
from app.core.validation import body, need
from app.models import EmailLog, ReportDefinition, ReportRun
from app.services import audit
from app.services.numbering import next_no
from app.services.reports import DATASETS, run_dataset

bp = Blueprint("reports", __name__, url_prefix="/reports")


@bp.get("/datasets")
@require("reports", "View")
def datasets():
    s = db(); out = []
    for k, (label, fn) in DATASETS.items():
        sample = fn(s, g.scope, {})[:1]
        out.append({"key": k, "label": label, "columns": list(sample[0].keys()) if sample else []})
    return ok(out)


@bp.post("/run")
@require("reports", "View")
def run():
    d = body(); need(d, "dataset"); s = db()
    rows = run_dataset(s, d["dataset"], g.scope, d.get("filters"), d.get("columns"), d.get("sort_by"), d.get("sort_desc"), d.get("group_by"), int(d.get("limit") or 2000))
    return ok(rows, total=len(rows))


@bp.post("/export")
@require("reports", "Export")
def export():
    d = body(); need(d, "dataset"); s = db()
    rows = run_dataset(s, d["dataset"], g.scope, d.get("filters"), d.get("columns"), d.get("sort_by"), d.get("sort_desc"), d.get("group_by"), int(d.get("limit") or 20000))
    buf = io.StringIO(); w = csv.writer(buf)
    if rows:
        w.writerow(rows[0].keys()); [w.writerow(r.values()) for r in rows]
    run_ = ReportRun(no=next_no(s, "RPT"), definition_id=d.get("definition_id"), name=d.get("name") or d["dataset"], version=int(d.get("version") or 1), trigger="manual", rows=len(rows), status="Downloaded", created_by=g.user.id)
    s.add(run_); audit.record(s, "reports", "Report exported", entity="report", entity_id=run_.id, new={"dataset": d["dataset"], "rows": len(rows)}); s.commit()
    return Response(buf.getvalue(), mimetype="text/csv", headers={"Content-Disposition": f"attachment; filename={d['dataset']}.csv"})


@bp.get("/definitions")
@require("reports", "View")
def definitions():
    u = current_user(); s = db()
    out = [x for x in s.query(ReportDefinition).order_by(ReportDefinition.name).all() if x.owner_id == u.id or (u.role.name in (x.shared_roles or [])) or u.role.name in ("Super Admin", "CEO", "CFO")]
    return ok([x.to_dict() for x in out])


@bp.post("/definitions")
@require("reports", "Add")
def save_definition():
    d = body(); need(d, "name", "dataset"); s = db()
    if d["dataset"] not in DATASETS: raise PolicyViolation("Unknown dataset.")
    ex = s.get(ReportDefinition, d["id"]) if d.get("id") else None
    if ex:
        if ex.owner_id != g.user.id and g.user.role.name != "Super Admin": raise PolicyViolation("Only the owner can change a report definition.")
        ex.version += 1
        for k in ("name", "dataset", "columns", "filters", "group_by", "sort_by", "sort_desc", "row_limit", "shared_roles", "schedule"):
            if k in d: setattr(ex, k, d[k])
        audit.record(s, "reports", "Report definition updated", entity="report_def", entity_id=ex.id, new={"version": ex.version}); s.commit(); return ok(ex.to_dict())
    rd = ReportDefinition(name=d["name"], dataset=d["dataset"], columns=d.get("columns"), filters=d.get("filters"), group_by=d.get("group_by"), sort_by=d.get("sort_by"), sort_desc=bool(d.get("sort_desc")), row_limit=int(d.get("row_limit") or 2000), version=1, owner_id=g.user.id, shared_roles=d.get("shared_roles"), schedule=d.get("schedule"), created_by=g.user.id)
    s.add(rd); audit.record(s, "reports", "Report definition created", entity="report_def", entity_id=rd.id, new={"name": rd.name, "dataset": rd.dataset}); s.commit(); return ok(rd.to_dict()), 201


@bp.get("/runs")
@require("reports", "View")
def runs():
    s = db(); return ok([r.to_dict() for r in s.query(ReportRun).order_by(ReportRun.created_at.desc()).limit(200).all()])


@bp.get("/emails")
@require("audit", "View")
def emails():
    s = db(); return ok([e.to_dict(exclude={"body"}) for e in s.query(EmailLog).order_by(EmailLog.created_at.desc()).limit(200).all()])
