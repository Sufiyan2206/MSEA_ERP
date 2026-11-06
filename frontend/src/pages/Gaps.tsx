import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useList, useOne, useAction } from "@/hooks/useApi";
import { api, fmtDate, inr, qs } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { DataTable, Field, Loading, ErrorBox, Modal, Pill, toneFor, Tabs, Kpi } from "@/components/ui";

interface Gap extends Record<string, unknown> { id: string; no: string; rule_code: string; category: string; title: string; text: string; branch_id: string | null; impact: number; risk: string; action: string; owner: string | null; reviewer: string | null; first_seen: string; due_date: string; state: string; escalation_level: number; overdue: boolean; evidence: string | null; resolution: string | null; history?: { at: string; by: string; to_state: string; note: string | null; file: string | null }[] }
interface Summary { open: number; overdue: number; escalated: number; impact: number; by_category: Record<string, number>; by_risk: Record<string, number>; compliance: { score: number } }
interface Rule extends Record<string, unknown> { id: string; code: string; category: string; title: string; owner_role: string; reviewer_role: string; risk: string; due_days: number; action: string; active: boolean; has_detector: boolean }
interface Level { level: number; offset_days: number; label: string; roles: string[] }

export default function Gaps() {
  const { can } = useAuth(); const nav = useNavigate(); const [tab, setTab] = useState("open"); const [cat, setCat] = useState(""); const [risk, setRisk] = useState("");
  const sum = useOne<Summary>(["gaps-sum"], "/gaps/summary"); const list = useList<Gap>(["gaps", tab, cat, risk], `/gaps${qs({ open: tab === "open" ? 1 : 0, state: tab === "resolved" ? "Resolved" : undefined, mine: tab === "mine" ? 1 : undefined, category: cat, risk })}`, tab !== "rules" && tab !== "matrix");
  const scan = useAction(() => api.post<{ data: { created: number; resolved: number; escalated: number } }>("/gaps/scan"), [["gaps"], ["gaps-sum"]]);
  const s = sum.data?.data;
  return <div className="page"><div className="page-head"><div><h1>Gap Analysis Center</h1><div className="muted small">Detected automatically every morning; escalates per matrix when overdue.</div></div>{can("gaps", "Approve") && <button className="btn" disabled={scan.isPending} onClick={() => scan.mutateAsync().then((r) => alert(`Scan done: ${r.data.created} new, ${r.data.resolved} auto-resolved, ${r.data.escalated} escalated`))}>Run scan now</button>}</div>
    {s && <div className="grid"><Kpi label="Open gaps" value={s.open} /><Kpi label="Overdue" value={s.overdue} /><Kpi label="Escalated (L3+)" value={s.escalated} /><Kpi label="Impact (₹ / count)" value={inr(s.impact)} /><Kpi label="Compliance score" value={`${s.compliance.score}/100`} /></div>}
    <Tabs value={tab} onChange={setTab} tabs={[{ key: "open", label: "Open" }, { key: "mine", label: "Mine" }, { key: "resolved", label: "Resolved" }, { key: "rules", label: "Rules" }, { key: "matrix", label: "Escalation matrix" }]} />
    {["open", "mine", "resolved"].includes(tab) && <>
      <div className="toolbar card"><Field label="Category"><select value={cat} onChange={(e) => setCat(e.target.value)}><option value="">All</option>{Object.keys(s?.by_category ?? {}).map((c) => <option key={c}>{c}</option>)}</select></Field><Field label="Risk"><select value={risk} onChange={(e) => setRisk(e.target.value)}><option value="">All</option>{["Critical", "High", "Medium", "Low"].map((c) => <option key={c}>{c}</option>)}</select></Field></div>
      {list.isLoading ? <Loading /> : list.error ? <ErrorBox e={list.error} /> : <DataTable rows={list.data!.data} onRow={(g) => nav(`/gaps/${g.id}`)} title={(g) => <span><Pill tone={toneFor(g.risk)}>{g.risk}</Pill> {g.title}</span>} cols={[{ key: "no", label: "No", hideMobile: true }, { key: "risk", label: "Risk", hideMobile: true, render: (g) => <Pill tone={toneFor(g.risk)}>{g.risk}</Pill> }, { key: "title", label: "Gap", hideMobile: true }, { key: "text", label: "Detail" }, { key: "owner", label: "Owner" }, { key: "due_date", label: "Due", render: (g) => <span style={{ color: g.overdue ? "var(--err)" : undefined }}>{fmtDate(g.due_date)}</span> }, { key: "escalation_level", label: "Esc.", num: true, render: (g) => g.escalation_level ? `L${g.escalation_level}` : "—" }, { key: "state", label: "State", render: (g) => <Pill tone={toneFor(g.state)}>{g.state}</Pill> }]} />}</>}
    {tab === "rules" && <Rules />}{tab === "matrix" && <Matrix />}
  </div>;
}

function Rules() {
  const { can } = useAuth(); const rules = useList<Rule>(["rules"], "/gaps/rules");
  const edit = useAction((v: { id: string; active: boolean }) => api.patch(`/gaps/rules/${v.id}`, { active: v.active, reason: "toggled from UI" }), [["rules"]], "Rule updated");
  return <DataTable rows={rules.data?.data ?? []} title={(r) => `${r.code} · ${r.title}`} cols={[{ key: "code", label: "Code", hideMobile: true }, { key: "category", label: "Category" }, { key: "title", label: "Rule", hideMobile: true }, { key: "owner_role", label: "Owner" }, { key: "reviewer_role", label: "Reviewer" }, { key: "risk", label: "Risk", render: (r) => <Pill tone={toneFor(r.risk)}>{r.risk}</Pill> }, { key: "due_days", label: "Due (days)", num: true }, { key: "action", label: "Expected action" }, { key: "active", label: "Active", render: (r) => can("gaps", "Configure Settings") ? <input type="checkbox" checked={r.active} onChange={(e) => edit.mutate({ id: r.id, active: e.target.checked })} /> : (r.active ? "Yes" : "No") }]} />;
}

function Matrix() {
  const m = useOne<Record<string, Level[]>>(["matrix"], "/gaps/matrix");
  if (m.isLoading) return <Loading />;
  return <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))" }}>{Object.entries(m.data?.data ?? {}).map(([cat, lv]) => <div key={cat} className="card"><h3>{cat}</h3><table className="tbl"><tbody>{lv.map((l) => <tr key={l.level}><td>L{l.level}</td><td>due +{l.offset_days}d</td><td>{l.label}</td><td className="small muted">{l.roles.join(", ")}</td></tr>)}</tbody></table></div>)}</div>;
}

export function GapDetail() {
  const { id = "" } = useParams(); const { can } = useAuth(); const q = useOne<Gap>(["gap", id], `/gaps/${id}`);
  const trans = useAction((v: { to: string; note?: string; file?: string }) => api.post(`/gaps/${id}/transition`, v), [["gap", id], ["gaps"], ["gaps-sum"], ["gaps-mine"]], "Gap updated"); const [modal, setModal] = useState<string | null>(null); const [note, setNote] = useState(""); const [file, setFile] = useState("");
  if (q.isLoading) return <Loading />; if (q.error) return <ErrorBox e={q.error} />; const g = q.data!.data;
  const nexts: Record<string, string[]> = { Open: ["Acknowledged", "Rejected"], Acknowledged: ["In progress", "Rejected"], "In progress": ["Resolved"], Rejected: ["Open"], Resolved: [] };
  return <div className="page"><div className="page-head"><div><h1>{g.no} <Pill tone={toneFor(g.risk)}>{g.risk}</Pill> <Pill tone={toneFor(g.state)}>{g.state}</Pill></h1><div className="muted small">{g.category} · rule {g.rule_code} · first seen {fmtDate(g.first_seen)} · due {fmtDate(g.due_date)}{g.escalation_level ? ` · escalated L${g.escalation_level}` : ""}</div></div>
    {can("gaps", "Edit") && <div className="row">{nexts[g.state].map((n) => <button key={n} className={`btn ${n === "Resolved" ? "primary" : n === "Rejected" ? "danger" : ""}`} onClick={() => ["Resolved", "Rejected"].includes(n) ? setModal(n) : trans.mutate({ to: n })}>{n === "Acknowledged" ? "Acknowledge" : n === "In progress" ? "Start work" : n === "Resolved" ? "Resolve" : n === "Rejected" ? "Reject" : "Reopen"}</button>)}</div>}</div>
    <div className="card stack"><h2>{g.title}</h2><div>{g.text}</div><div className="small"><b>Expected action:</b> {g.action}</div><div className="small muted">Owner: {g.owner ?? "—"} · Reviewer: {g.reviewer ?? "—"} · Impact: {inr(g.impact)}{g.evidence ? ` · Evidence: ${g.evidence}` : ""}</div>{g.resolution && <div className="pill ok">Resolution: {g.resolution}</div>}</div>
    <div className="card"><h3>History</h3><div className="timeline">{(g.history ?? []).map((h, i) => <div key={i} className="ev"><time>{new Date(h.at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</time><div><Pill tone={toneFor(h.to_state)}>{h.to_state}</Pill> {h.note} <span className="muted small">— {h.by}{h.file ? ` · 📎 ${h.file}` : ""}</span></div></div>)}</div></div>
    {modal && <Modal title={modal === "Resolved" ? "Resolve gap" : "Reject gap"} onClose={() => setModal(null)} footer={<button className={`btn ${modal === "Resolved" ? "primary" : "danger"}`} disabled={note.trim().length < 10 || trans.isPending} onClick={() => trans.mutateAsync({ to: modal, note, file: file || undefined }).then(() => setModal(null))}>Confirm</button>}>
      <Field label="Note (10+ characters)"><textarea value={note} onChange={(e) => setNote(e.target.value)} /></Field>{modal === "Resolved" && <Field label={`Evidence file reference${["High", "Critical"].includes(g.risk) ? " (mandatory for High/Critical)" : ""}`}><input value={file} onChange={(e) => setFile(e.target.value)} placeholder="e.g. deposit-slip-2026-11-06.pdf" /></Field>}</Modal>}
  </div>;
}
