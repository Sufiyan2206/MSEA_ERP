import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useList, useOne, useAction } from "@/hooks/useApi";
import { api, fmtDate, inr, qs, today, type Page, type One } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { DataTable, Field, Loading, ErrorBox, Modal, Pill, toneFor, ReasonModal, Tabs } from "@/components/ui";
import { CLASSES, useBranches, type Fees, type Student } from "./Students";

interface Receipt extends Record<string, unknown> { id: string; no: string; receipt_date: string; total: number; mode: string; reference: string | null; status: string; student: string; admission_no: string; lines: { head: string; amount: number }[]; signature_valid: boolean; cancel_reason: string | null; cashier_id: string }

/** Fee collection: pick a student, tick demands (or type partial amounts), choose mode, issue receipt. */
export default function Collect() {
  const [sp] = useSearchParams(); const nav = useNavigate();
  const [q, setQ] = useState(""); const [sid, setSid] = useState(sp.get("student") ?? "");
  const [amts, setAmts] = useState<Record<string, string>>({}); const [mode, setMode] = useState("Cash"); const [ref, setRef] = useState("");
  const search = useList<Student>(["students", "pick", q], `/students${qs({ q, limit: 10 })}`, q.length >= 2 && !sid);
  const stu = useOne<Student & { fees: Fees }>(["student", sid], `/students/${sid}`, !!sid);
  const modes = useQuery({ queryKey: ["modes"], queryFn: () => api.get<One<string[]>>("/fees/modes") });
  const collect = useAction((d: unknown) => api.post<One<Receipt>>("/fees/receipts", d), [["student", sid], ["receipts"], ["kpis"]], "Receipt issued");
  useEffect(() => { setAmts({}); }, [sid]);
  const demands = stu.data?.data.fees.demands ?? [];
  const total = useMemo(() => Object.values(amts).reduce((a, b) => a + (Number(b) || 0), 0), [amts]);
  const lines = Object.entries(amts).filter(([, v]) => Number(v) > 0).map(([demand_id, amount]) => ({ demand_id, amount: Number(amount) }));
  const toggle = (id: string, bal: number) => setAmts((a) => { const n = { ...a }; if (n[id]) delete n[id]; else n[id] = String(bal); return n; });
  return <div className="page">
    <h1>Collect fee</h1>
    {!sid && <div className="card stack"><Field label="Find student (name, admission no, mobile)"><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} /></Field>
      {search.data?.data.map((s) => <button key={s.id} className="btn" style={{ justifyContent: "space-between" }} onClick={() => setSid(s.id)}><span>{s.name} <span className="muted">{s.admission_no}</span></span><span className="muted small">{s.class_name}{s.section ? "-" + s.section : ""} · {s.branch}</span></button>)}</div>}
    {sid && (stu.isLoading ? <Loading /> : stu.error ? <ErrorBox e={stu.error} /> : <>
      <div className="card row"><div className="grow"><b>{stu.data!.data.name}</b> <span className="muted">{stu.data!.data.admission_no} · {stu.data!.data.class_name}{stu.data!.data.section ? "-" + stu.data!.data.section : ""}</span><div className="small">Balance <b>{inr(stu.data!.data.fees.balance)}</b>{stu.data!.data.fees.overdue > 0 && <> · <span style={{ color: "var(--err)" }}>overdue {inr(stu.data!.data.fees.overdue)}</span></>}</div></div><button className="btn sm" onClick={() => setSid("")}>Change</button></div>
      <div className="card stack"><h3>Select instalments</h3>
        {demands.filter((d) => d.balance > 0).map((d) => <div key={d.id} className="row" style={{ borderBottom: "1px solid var(--line)", paddingBottom: ".4rem" }}>
          <input type="checkbox" checked={!!amts[d.id]} onChange={() => toggle(d.id, d.balance)} id={`d${d.id}`} />
          <label htmlFor={`d${d.id}`} className="grow"><div>{d.head} #{d.instalment_no}</div><div className="small muted">due {fmtDate(d.due_date)} · balance {inr(d.balance)}{new Date(d.due_date) < new Date() && <Pill tone="err">overdue</Pill>}</div></label>
          {amts[d.id] !== undefined && <input type="number" className="mono" style={{ width: 120, border: "1px solid var(--line)", borderRadius: 8, padding: ".4rem", minHeight: 40 }} value={amts[d.id]} max={d.balance} min={1} onChange={(e) => setAmts({ ...amts, [d.id]: e.target.value })} />}
        </div>)}
        {!demands.some((d) => d.balance > 0) && <div className="muted">No pending demands.</div>}
      </div>
      <div className="card form"><Field label="Payment mode"><select value={mode} onChange={(e) => setMode(e.target.value)}>{(modes.data?.data ?? ["Cash"]).map((m) => <option key={m}>{m}</option>)}</select></Field>
        {mode !== "Cash" && <Field label="Reference / transaction id (mandatory)"><input value={ref} onChange={(e) => setRef(e.target.value)} /></Field>}
        <div className="field full row" style={{ justifyContent: "space-between" }}><div>Total <b style={{ fontSize: "1.3rem" }}>{inr(total)}</b></div>
          <button className="btn primary" disabled={!lines.length || collect.isPending || (mode !== "Cash" && !ref.trim())} onClick={() => collect.mutateAsync({ student_id: sid, lines, mode, reference: ref || undefined }).then((r) => nav(`/fees/receipts/${r.data.id}`))}>Issue receipt</button></div></div>
    </>)}
  </div>;
}

export function Receipts() {
  const nav = useNavigate(); const { me } = useAuth(); const [date, setDate] = useState(today()); const [mine, setMine] = useState(me?.role === "Fee Collector");
  const list = useList<Receipt>(["receipts", date, mine], `/fees/receipts${qs({ date, mine: mine ? 1 : undefined, limit: 500 })}`);
  const rows = list.data?.data ?? []; const paid = rows.filter((r) => r.status === "Paid"); const byMode = paid.reduce<Record<string, number>>((a, r) => ({ ...a, [r.mode]: (a[r.mode] ?? 0) + r.total }), {});
  return <div className="page"><div className="page-head"><h1>Receipts</h1></div>
    <div className="toolbar card"><Field label="Date"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field><Field label="Scope"><select value={mine ? "1" : "0"} onChange={(e) => setMine(e.target.value === "1")}><option value="1">My receipts</option><option value="0">All in my branches</option></select></Field></div>
    <div className="card row">{Object.entries(byMode).map(([m, v]) => <span key={m} className="pill">{m}: <b>{inr(v)}</b></span>)}<span className="pill ok">Total {inr(paid.reduce((a, r) => a + r.total, 0))}</span></div>
    {list.isLoading ? <Loading /> : <DataTable rows={rows} onRow={(r) => nav(`/fees/receipts/${r.id}`)} title={(r) => `${r.no} · ${r.student}`} cols={[{ key: "no", label: "Receipt", hideMobile: true }, { key: "student", label: "Student", hideMobile: true }, { key: "admission_no", label: "Adm no" }, { key: "mode", label: "Mode" }, { key: "total", label: "Amount", num: true, render: (r) => inr(r.total) }, { key: "status", label: "Status", render: (r) => <Pill tone={toneFor(r.status)}>{r.status}</Pill> }]} />}
  </div>;
}

export function ReceiptView() {
  const { id = "" } = useParams(); const { can } = useAuth(); const [cancel, setCancel] = useState(false);
  const q = useOne<Receipt>(["receipt", id], `/fees/receipts/${id}`);
  const doCancel = useAction((reason: string) => api.post(`/fees/receipts/${id}/cancel`, { reason }), [["receipt", id], ["receipts"]], "Receipt cancelled");
  if (q.isLoading) return <Loading />; if (q.error) return <ErrorBox e={q.error} />;
  const r = q.data!.data;
  return <div className="page"><div className="page-head"><div><h1>Receipt {r.no} <Pill tone={toneFor(r.status)}>{r.status}</Pill></h1><div className="muted small">{fmtDate(r.receipt_date)} · {r.mode}{r.reference ? ` · ${r.reference}` : ""} · {r.signature_valid ? "✔ signature valid" : "⚠ signature mismatch"}</div></div>
    <div className="row"><button className="btn" onClick={() => window.print()}>Print</button>{can("fees", "Delete") && r.status === "Paid" && <button className="btn danger" onClick={() => setCancel(true)}>Cancel receipt</button>}</div></div>
    <div className="card stack"><div><b>{r.student}</b> <span className="muted">{r.admission_no}</span></div>
      <table className="tbl"><tbody>{r.lines.map((l, i) => <tr key={i}><td>{l.head}</td><td className="num">{inr(l.amount)}</td></tr>)}<tr><td><b>Total</b></td><td className="num"><b>{inr(r.total)}</b></td></tr></tbody></table>
      {r.cancel_reason && <div className="pill err">Cancelled: {r.cancel_reason}</div>}</div>
    {cancel && <ReasonModal title="Cancel receipt" onCancel={() => setCancel(false)} onOk={(reason) => doCancel.mutateAsync(reason).then(() => setCancel(false))} extra={<div className="small muted">Allowed only before the cash day is verified. After that, raise a refund.</div>} />}
  </div>;
}

interface Conc extends Record<string, unknown> { id: string; student: string; kind: string; amount: number; document: string | null; status: string; reason: string | null; created_at: string }
interface Refund extends Record<string, unknown> { id: string; no: string; student: string; amount: number; reason: string; status: string }

export function Approvals() {
  const { can } = useAuth(); const [tab, setTab] = useState("concessions"); const [newC, setNewC] = useState(false); const [newR, setNewR] = useState(false);
  const conc = useList<Conc>(["concessions"], "/fees/concessions"); const ref = useList<Refund>(["refunds"], "/fees/refunds");
  const decide = useAction((v: { id: string; approve: boolean; note?: string }) => api.post(`/fees/concessions/${v.id}/decide`, v), [["concessions"]], "Decision saved");
  const rtrans = useAction((v: { id: string; to: string; note?: string }) => api.post(`/fees/refunds/${v.id}/transition`, v), [["refunds"]], "Updated");
  const [reason, setReason] = useState<{ kind: "conc" | "ref"; id: string; to: string } | null>(null);
  return <div className="page"><div className="page-head"><h1>Concessions & refunds</h1><div className="row">{can("fees", "Add") && <><button className="btn" onClick={() => setNewC(true)}>+ Concession</button><button className="btn" onClick={() => setNewR(true)}>+ Refund</button></>}</div></div>
    <Tabs value={tab} onChange={setTab} tabs={[{ key: "concessions", label: `Concessions (${conc.data?.data.filter((c) => c.status === "Requested").length ?? 0})` }, { key: "refunds", label: `Refunds (${ref.data?.data.filter((r) => r.status !== "Paid" && r.status !== "Rejected").length ?? 0})` }]} />
    {tab === "concessions" && <DataTable rows={conc.data?.data ?? []} title={(r) => `${r.student} · ${inr(r.amount)}`} cols={[{ key: "student", label: "Student", hideMobile: true }, { key: "kind", label: "Kind" }, { key: "amount", label: "Amount", num: true, render: (r) => inr(r.amount) }, { key: "document", label: "Document" }, { key: "status", label: "Status", render: (r) => <Pill tone={toneFor(r.status)}>{r.status}</Pill> },
      { key: "act", label: "", render: (r) => r.status === "Requested" && can("fees", "Approve") ? <span className="row"><button className="btn sm primary" onClick={(e) => { e.stopPropagation(); decide.mutate({ id: r.id, approve: true }); }}>Approve</button><button className="btn sm danger" onClick={(e) => { e.stopPropagation(); setReason({ kind: "conc", id: r.id, to: "reject" }); }}>Reject</button></span> : null }]} />}
    {tab === "refunds" && <DataTable rows={ref.data?.data ?? []} title={(r) => `${r.no} · ${r.student}`} cols={[{ key: "no", label: "Refund", hideMobile: true }, { key: "student", label: "Student", hideMobile: true }, { key: "amount", label: "Amount", num: true, render: (r) => inr(r.amount) }, { key: "reason", label: "Reason" }, { key: "status", label: "Status", render: (r) => <Pill tone={toneFor(r.status)}>{r.status}</Pill> },
      { key: "act", label: "", render: (r) => can("fees", "Approve") ? <span className="row">{r.status === "Requested" && <><button className="btn sm primary" onClick={(e) => { e.stopPropagation(); rtrans.mutate({ id: r.id, to: "Approved" }); }}>Approve</button><button className="btn sm danger" onClick={(e) => { e.stopPropagation(); setReason({ kind: "ref", id: r.id, to: "Rejected" }); }}>Reject</button></>}{r.status === "Approved" && <button className="btn sm primary" onClick={(e) => { e.stopPropagation(); rtrans.mutate({ id: r.id, to: "Paid" }); }}>Mark paid</button>}</span> : null }]} />}
    {reason && <ReasonModal title={reason.kind === "conc" ? "Reject concession" : "Reject refund"} min={5} onCancel={() => setReason(null)} onOk={(note) => { (reason.kind === "conc" ? decide.mutateAsync({ id: reason.id, approve: false, note }) : rtrans.mutateAsync({ id: reason.id, to: reason.to, note })).then(() => setReason(null)); }} />}
    {newC && <NewConcession onClose={() => setNewC(false)} />}{newR && <NewRefund onClose={() => setNewR(false)} />}
  </div>;
}

function StudentPick({ onPick }: { onPick: (s: Student) => void }) {
  const [q, setQ] = useState(""); const search = useList<Student>(["students", "pick", q], `/students${qs({ q, limit: 8 })}`, q.length >= 2);
  return <div className="stack"><Field label="Student (type to search)"><input value={q} onChange={(e) => setQ(e.target.value)} /></Field>{search.data?.data.map((s) => <button key={s.id} className="btn" onClick={() => onPick(s)}>{s.name} · {s.admission_no}</button>)}</div>;
}

function NewConcession({ onClose }: { onClose: () => void }) {
  const [s, setS] = useState<Student | null>(null); const [f, setF] = useState({ kind: "Sibling", amount: "", document: "", reason: "" });
  const save = useAction((d: unknown) => api.post("/fees/concessions", d), [["concessions"]], "Concession requested");
  return <Modal title="Request concession" onClose={onClose} footer={<button className="btn primary" disabled={!s || !f.amount || !f.document || save.isPending} onClick={() => save.mutateAsync({ student_id: s!.id, ...f, amount: Number(f.amount) }).then(onClose)}>Submit for approval</button>}>
    {!s ? <StudentPick onPick={setS} /> : <div className="form"><div className="full"><b>{s.name}</b> {s.admission_no}</div><Field label="Kind"><select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>{["Sibling", "Staff ward", "Merit", "Financial hardship", "Management"].map((k) => <option key={k}>{k}</option>)}</select></Field><Field label="Amount"><input type="number" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field><Field label="Supporting document ref (mandatory)" className="full"><input value={f.document} onChange={(e) => setF({ ...f, document: e.target.value })} /></Field><Field label="Reason" className="full"><textarea value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></Field></div>}
  </Modal>;
}

function NewRefund({ onClose }: { onClose: () => void }) {
  const [s, setS] = useState<Student | null>(null); const [f, setF] = useState({ amount: "", reason: "" });
  const save = useAction((d: unknown) => api.post("/fees/refunds", d), [["refunds"]], "Refund requested");
  return <Modal title="Request refund" onClose={onClose} footer={<button className="btn primary" disabled={!s || !f.amount || f.reason.length < 10 || save.isPending} onClick={() => save.mutateAsync({ student_id: s!.id, ...f, amount: Number(f.amount) }).then(onClose)}>Submit</button>}>
    {!s ? <StudentPick onPick={setS} /> : <div className="form"><div className="full"><b>{s.name}</b> {s.admission_no}</div><Field label="Amount"><input type="number" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field><Field label="Reason (10+ chars)" className="full"><textarea value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></Field></div>}
  </Modal>;
}

interface Structure extends Record<string, unknown> { id: string; branch_id: string; academic_year: string; class_name: string; head: string; head_id: string; amount: number; instalments: number; version: number; status: string }
export function Structures() {
  const { can, me } = useAuth(); const br = useBranches(); const [bid, setBid] = useState(me?.branch_id ?? ""); const [add, setAdd] = useState(false);
  const list = useList<Structure>(["structures", bid], `/fees/structures${qs({ branch_id: bid })}`); const heads = useQuery({ queryKey: ["heads"], queryFn: () => api.get<Page<{ id: string; name: string }>>("/fees/heads") });
  const approve = useAction((id: string) => api.post(`/fees/structures/${id}/approve`), [["structures"]], "Approved");
  const save = useAction((d: unknown) => api.post("/fees/structures", d), [["structures"]], "Draft saved");
  const [f, setF] = useState({ class_name: "Class 1", head_id: "", amount: "", instalments: "4", academic_year: "2026-27" });
  return <div className="page"><div className="page-head"><h1>Fee structures</h1>{can("fees", "Configure Settings") && <button className="btn primary" onClick={() => setAdd(true)}>+ New version</button>}</div>
    <div className="toolbar card"><Field label="Branch"><select value={bid} onChange={(e) => setBid(e.target.value)}><option value="">All</option>{br.data?.data.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field></div>
    <DataTable rows={list.data?.data ?? []} title={(r) => `${r.class_name} · ${r.head}`} cols={[{ key: "academic_year", label: "AY" }, { key: "class_name", label: "Class", hideMobile: true }, { key: "head", label: "Head", hideMobile: true }, { key: "amount", label: "Amount", num: true, render: (r) => inr(r.amount) }, { key: "instalments", label: "Inst.", num: true }, { key: "version", label: "v", num: true }, { key: "status", label: "Status", render: (r) => <Pill tone={toneFor(r.status)}>{r.status}</Pill> }, { key: "a", label: "", render: (r) => r.status === "Draft" && can("fees", "Approve") ? <button className="btn sm primary" onClick={() => approve.mutate(r.id)}>Approve</button> : null }]} />
    {add && <Modal title="New fee structure version" onClose={() => setAdd(false)} footer={<button className="btn primary" disabled={!bid || !f.head_id || !f.amount} onClick={() => save.mutateAsync({ ...f, branch_id: bid, amount: Number(f.amount), instalments: Number(f.instalments) }).then(() => setAdd(false))}>Save draft</button>}>
      <div className="form"><Field label="Class"><select value={f.class_name} onChange={(e) => setF({ ...f, class_name: e.target.value })}>{CLASSES.map((c) => <option key={c}>{c}</option>)}</select></Field><Field label="Head"><select value={f.head_id} onChange={(e) => setF({ ...f, head_id: e.target.value })}><option value="">—</option>{heads.data?.data.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select></Field><Field label="Annual amount"><input type="number" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field><Field label="Instalments"><input type="number" value={f.instalments} onChange={(e) => setF({ ...f, instalments: e.target.value })} /></Field></div>
      <div className="small muted">Drafts need approval by a second person (maker ≠ approver). Approving retires the previous version.</div></Modal>}
  </div>;
}
