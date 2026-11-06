import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useList, useOne, useAction } from "@/hooks/useApi";
import { api, fmtDate, inr, qs } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { DataTable, Field, Loading, ErrorBox, Modal, Pill, toneFor, Tabs } from "@/components/ui";

export interface Student extends Record<string, unknown> { id: string; admission_no: string; name: string; branch: string; branch_id: string; class_name: string; section: string | null; status: string; mobile: string | null; parent_name: string | null; join_date: string; gender: string | null; dob: string | null; email: string | null; address: string | null; category: string }
export interface Demand { id: string; head: string; instalment_no: number; due_date: string; amount: number; concession: number; paid: number; balance: number }
export interface Fees { total: number; concession: number; paid: number; balance: number; overdue: number; demands: Demand[] }
interface Branch { id: string; name: string; code: string }
export const CLASSES = ["Nursery", "LKG", "UKG", ...Array.from({ length: 10 }, (_, i) => `Class ${i + 1}`)];

export function useBranches() { return useList<Branch>(["branches"], "/branches"); }

export default function Students() {
  const [q, setQ] = useState(""); const [cls, setCls] = useState(""); const [bid, setBid] = useState(""); const [add, setAdd] = useState(false);
  const nav = useNavigate(); const { can } = useAuth(); const br = useBranches();
  const list = useList<Student>(["students", q, cls, bid], `/students${qs({ q, class_name: cls, branch_id: bid, limit: 200 })}`);
  return <div className="page">
    <div className="page-head"><h1>Students <span className="muted small">{list.data?.total ?? ""}</span></h1>{can("students", "Add") && <button className="btn primary" onClick={() => setAdd(true)}>+ Direct admission</button>}</div>
    <div className="toolbar card">
      <Field label="Search"><input placeholder="name, admission no, mobile" value={q} onChange={(e) => setQ(e.target.value)} /></Field>
      <Field label="Class"><select value={cls} onChange={(e) => setCls(e.target.value)}><option value="">All</option>{CLASSES.map((c) => <option key={c}>{c}</option>)}</select></Field>
      {(br.data?.data.length ?? 0) > 1 && <Field label="Branch"><select value={bid} onChange={(e) => setBid(e.target.value)}><option value="">All</option>{br.data!.data.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>}
    </div>
    {list.isLoading ? <Loading /> : list.error ? <ErrorBox e={list.error} /> :
      <DataTable rows={list.data!.data} onRow={(r) => nav(`/students/${r.id}`)} title={(r) => `${r.name} · ${r.admission_no}`}
        cols={[{ key: "admission_no", label: "Adm no", hideMobile: true }, { key: "name", label: "Name", hideMobile: true }, { key: "class_name", label: "Class", render: (r) => `${r.class_name}${r.section ? "-" + r.section : ""}` }, { key: "branch", label: "Branch" }, { key: "parent_name", label: "Parent" }, { key: "mobile", label: "Mobile" }, { key: "status", label: "Status", render: (r) => <Pill tone={toneFor(r.status)}>{r.status}</Pill> }]} />}
    {add && <AddStudent onClose={() => setAdd(false)} />}
  </div>;
}

function AddStudent({ onClose }: { onClose: () => void }) {
  const br = useBranches(); const { me } = useAuth(); const nav = useNavigate();
  const [f, setF] = useState<Record<string, string>>({ branch_id: me?.branch_id ?? "", class_name: "Class 1", section: "A", name: "", parent_name: "", mobile: "", gender: "M", dob: "" });
  const save = useAction((d: Record<string, string>) => api.post<{ data: Student }>("/students", d), [["students"]], "Student admitted; fee demands generated");
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  return <Modal title="Direct admission" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" disabled={save.isPending || !f.name || !f.branch_id} onClick={() => save.mutateAsync(f).then((r) => { onClose(); nav(`/students/${r.data.id}`); })}>Admit</button></>}>
    <div className="form">
      <Field label="Branch"><select value={f.branch_id} onChange={set("branch_id")}><option value="">—</option>{br.data?.data.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>
      <Field label="Class"><select value={f.class_name} onChange={set("class_name")}>{CLASSES.map((c) => <option key={c}>{c}</option>)}</select></Field>
      <Field label="Section"><input value={f.section} onChange={set("section")} /></Field>
      <Field label="Student name" className="full"><input value={f.name} onChange={set("name")} required /></Field>
      <Field label="Parent name"><input value={f.parent_name} onChange={set("parent_name")} /></Field>
      <Field label="Mobile"><input value={f.mobile} onChange={set("mobile")} inputMode="tel" /></Field>
      <Field label="Gender"><select value={f.gender} onChange={set("gender")}><option value="M">Male</option><option value="F">Female</option></select></Field>
      <Field label="Date of birth"><input type="date" value={f.dob} onChange={set("dob")} /></Field>
    </div>
    <div className="small muted">Admission number is generated automatically. Fee demands are created from the approved fee structure of the class.</div>
  </Modal>;
}

export function StudentDetail() {
  const { id = "" } = useParams(); const { can } = useAuth(); const [tab, setTab] = useState("fees"); const [edit, setEdit] = useState(false);
  const q = useOne<Student & { fees: Fees }>(["student", id], `/students/${id}`);
  const att = useOne<{ days: number; present: number; pct: number | null; exam_eligible: boolean | null; by_status: Record<string, number>; rows: { date: string; status: string }[] }>(["att-sum", id], `/attendance/students/${id}/summary`, can("attendance") && tab === "attendance");
  const rec = useList<Record<string, unknown> & { id: string; no: string; receipt_date: string; total: number; mode: string; status: string }>(["receipts", id], `/fees/receipts?student_id=${id}`, can("fees") && tab === "receipts");
  if (q.isLoading) return <Loading />; if (q.error) return <ErrorBox e={q.error} />;
  const s = q.data!.data; const f = s.fees;
  return <div className="page">
    <div className="page-head"><div><h1>{s.name} <Pill tone={toneFor(s.status)}>{s.status}</Pill></h1><div className="muted small">{s.admission_no} · {s.class_name}{s.section ? "-" + s.section : ""} · {s.branch} · joined {fmtDate(s.join_date)}</div></div>
      <div className="row">{can("fees", "Add") && f.balance > 0 && <Link className="btn primary" to={`/fees/collect?student=${s.id}`}>Collect fee</Link>}{can("students", "Edit") && <button className="btn" onClick={() => setEdit(true)}>Edit</button>}</div></div>
    <div className="grid"><div className="card kpi"><span className="v">{inr(f.balance)}</span><span className="l">Balance</span></div><div className="card kpi"><span className="v" style={{ color: f.overdue ? "var(--err)" : undefined }}>{inr(f.overdue)}</span><span className="l">Overdue</span></div><div className="card kpi"><span className="v">{inr(f.paid)}</span><span className="l">Paid</span></div><div className="card kpi"><span className="v">{inr(f.concession)}</span><span className="l">Concession</span></div></div>
    <Tabs value={tab} onChange={setTab} tabs={[{ key: "fees", label: "Fee demands" }, { key: "receipts", label: "Receipts" }, { key: "attendance", label: "Attendance" }, { key: "profile", label: "Profile" }]} />
    {tab === "fees" && <DataTable rows={f.demands as unknown as Record<string, unknown>[]} title={(r) => `${r.head as string} #${r.instalment_no as number}`} cols={[{ key: "head", label: "Head", hideMobile: true }, { key: "instalment_no", label: "Inst.", hideMobile: true }, { key: "due_date", label: "Due", render: (r) => fmtDate(r.due_date as string) }, { key: "amount", label: "Amount", num: true, render: (r) => inr(r.amount as number) }, { key: "concession", label: "Concession", num: true, render: (r) => inr(r.concession as number) }, { key: "paid", label: "Paid", num: true, render: (r) => inr(r.paid as number) }, { key: "balance", label: "Balance", num: true, render: (r) => <b style={{ color: (r.balance as number) > 0 && new Date(r.due_date as string) < new Date() ? "var(--err)" : undefined }}>{inr(r.balance as number)}</b> }]} />}
    {tab === "receipts" && (rec.isLoading ? <Loading /> : <DataTable rows={rec.data?.data ?? []} title={(r) => r.no} onRow={(r) => window.location.assign(`/fees/receipts/${r.id}`)} cols={[{ key: "no", label: "Receipt", hideMobile: true }, { key: "receipt_date", label: "Date", render: (r) => fmtDate(r.receipt_date) }, { key: "mode", label: "Mode" }, { key: "total", label: "Amount", num: true, render: (r) => inr(r.total) }, { key: "status", label: "Status", render: (r) => <Pill tone={toneFor(r.status)}>{r.status}</Pill> }]} />)}
    {tab === "attendance" && (att.isLoading ? <Loading /> : att.data && <div className="stack"><div className="grid"><div className="card kpi"><span className="v">{att.data.data.pct ?? "—"}%</span><span className="l">Last 90 days</span></div><div className="card kpi"><span className="v">{att.data.data.present}/{att.data.data.days}</span><span className="l">Present / marked</span></div><div className="card kpi"><span className="v">{att.data.data.exam_eligible == null ? "—" : att.data.data.exam_eligible ? "Yes" : "No"}</span><span className="l">Exam eligible (≥75%)</span></div></div>
      <div className="card row">{att.data.data.rows.map((r) => <span key={r.date} title={r.date} className={`pill ${toneFor(r.status)}`}>{r.status}</span>)}</div></div>)}
    {tab === "profile" && <div className="card form"><Field label="Parent"><div>{s.parent_name ?? "—"}</div></Field><Field label="Mobile"><div>{s.mobile ?? "—"}</div></Field><Field label="Email"><div>{s.email ?? "—"}</div></Field><Field label="Gender"><div>{s.gender ?? "—"}</div></Field><Field label="DOB"><div>{fmtDate(s.dob)}</div></Field><Field label="Category"><div>{s.category}</div></Field><Field label="Address" className="full"><div>{s.address ?? "—"}</div></Field></div>}
    {edit && <EditStudent s={s} onClose={() => setEdit(false)} />}
  </div>;
}

function EditStudent({ s, onClose }: { s: Student; onClose: () => void }) {
  const [f, setF] = useState<Record<string, string>>({ name: s.name, section: s.section ?? "", parent_name: s.parent_name ?? "", mobile: s.mobile ?? "", email: s.email ?? "", address: s.address ?? "", status: s.status, reason: "" });
  const save = useAction((d: Record<string, string>) => api.patch(`/students/${s.id}`, d), [["student", s.id], ["students"]], "Saved");
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  return <Modal title="Edit student" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" disabled={f.reason.trim().length < 5 || save.isPending} onClick={() => save.mutateAsync(f).then(onClose)}>Save</button></>}>
    <div className="form"><Field label="Name" className="full"><input value={f.name} onChange={set("name")} /></Field><Field label="Section"><input value={f.section} onChange={set("section")} /></Field><Field label="Status"><select value={f.status} onChange={set("status")}>{["Active", "Withdrawn", "Transferred", "Alumni"].map((x) => <option key={x}>{x}</option>)}</select></Field>
      <Field label="Parent"><input value={f.parent_name} onChange={set("parent_name")} /></Field><Field label="Mobile"><input value={f.mobile} onChange={set("mobile")} /></Field><Field label="Email"><input value={f.email} onChange={set("email")} /></Field><Field label="Address" className="full"><input value={f.address} onChange={set("address")} /></Field>
      <Field label="Reason for change (audited)" className="full"><textarea value={f.reason} onChange={set("reason")} /></Field></div>
  </Modal>;
}
