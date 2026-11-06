import { Link } from "react-router-dom";
import { useAuth } from "@/store/auth";
import { useList, useOne, useAction } from "@/hooks/useApi";
import { api, inr } from "@/lib/api";
import { Kpi, Pill, toneFor, Loading } from "@/components/ui";

interface Kpis { collection_today: number; collection_mtd: number; outstanding: number; overdue: number; open_gaps: number; critical_gaps: number; open_enquiries: number; student_attendance_pct: number | null; staff_attendance_pct: number | null; cash_in_transit: number; compliance: { score: number } }
interface Gap extends Record<string, unknown> { id: string; no: string; title: string; text: string; risk: string; due_date: string; state: string; overdue: boolean }
interface Note extends Record<string, unknown> { id: string; text: string; route: string | null; kind: string; created_at: string }
interface Checklist { id: string; items: { id: number; text: string; done: boolean }[] }

/** "My day": role-aware landing page — KPIs the user can see, their gaps, checklist and alerts. */
export default function Home() {
  const { me, can } = useAuth();
  const k = useOne<Kpis>(["kpis"], "/dashboard/kpis");
  const gaps = useList<Gap>(["gaps-mine"], "/gaps?mine=1&limit=5", can("gaps"));
  const notes = useList<Note>(["notes", "home"], "/notifications?unread=1&limit=5");
  const cl = useOne<Checklist | null>(["checklist", "daily"], "/tasks/checklist?kind=daily");
  const tick = useAction((v: { id: number; done: boolean }) => api.post(`/tasks/checklist/items/${v.id}`, { done: v.done }), [["checklist"]]);
  const d = k.data?.data;
  return <div className="page">
    <div className="page-head"><div><h1>Good day, {me?.name.split(" ")[0]}</h1><div className="muted small">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} · {me?.role}</div></div>
      <div className="row">{can("fees", "Add") && <Link className="btn primary" to="/fees/collect">Collect fee</Link>}{can("attendance", "Add") && <Link className="btn" to="/attendance">Mark attendance</Link>}{can("admissions", "Add") && <Link className="btn" to="/admissions?new=1">New enquiry</Link>}</div></div>
    {k.isLoading ? <Loading /> : d && <div className="grid">
      {can("fees") && <><Kpi label="Collected today" value={inr(d.collection_today)} /><Kpi label="Collected this month" value={inr(d.collection_mtd)} sub={`Outstanding ${inr(d.outstanding)}`} /><Kpi label="Overdue fees" value={inr(d.overdue)} /></>}
      {can("gaps") && <Kpi label="Open gaps" value={d.open_gaps} sub={d.critical_gaps ? <Pill tone="err">{d.critical_gaps} critical</Pill> : "none critical"} />}
      {can("admissions") && <Kpi label="Open enquiries" value={d.open_enquiries} />}
      {can("attendance") && <Kpi label="Student attendance today" value={d.student_attendance_pct == null ? "—" : `${d.student_attendance_pct}%`} />}
      {can("cash") && <Kpi label="Cash in transit" value={inr(d.cash_in_transit)} sub="handed over, not yet banked" />}
      <Kpi label="Compliance score" value={`${d.compliance.score}/100`} />
    </div>}
    <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))" }}>
      {cl.data?.data && <div className="card"><h3>Today's checklist</h3><div className="stack">{cl.data.data.items.map((i) => <label key={i.id} className="row"><input type="checkbox" checked={i.done} onChange={(e) => tick.mutate({ id: i.id, done: e.target.checked })} /><span style={{ textDecoration: i.done ? "line-through" : undefined }}>{i.text}</span></label>)}</div></div>}
      {can("gaps") && <div className="card"><h3>My gaps</h3>{gaps.data?.data.length ? <div className="stack">{gaps.data.data.map((g) => <Link key={g.id} to={`/gaps/${g.id}`} className="row" style={{ color: "inherit" }}><Pill tone={toneFor(g.risk)}>{g.risk}</Pill><span className="grow">{g.title}</span>{g.overdue && <Pill tone="err">overdue</Pill>}</Link>)}<Link to="/gaps" className="small">All gaps →</Link></div> : <div className="muted small">No open gaps assigned to you.</div>}</div>}
      <div className="card"><h3>Alerts</h3>{notes.data?.data.length ? <div className="stack">{notes.data.data.map((n) => <Link key={n.id} to={n.route ?? "/notifications"} style={{ color: "inherit" }} className="small">• {n.text}</Link>)}<Link to="/notifications" className="small">All alerts →</Link></div> : <div className="muted small">You're all caught up.</div>}</div>
    </div>
  </div>;
}
