import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useList, useOne, useAction } from "@/hooks/useApi";
import { api, fmtDate, inr, qs, today } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { DataTable, Field, Loading, ErrorBox, Modal, Pill, toneFor, Tabs } from "@/components/ui";
import { CLASSES, useBranches } from "./Students";

interface Lead extends Record<string, unknown> { id: string; no: string; name: string; class_name: string; parent_name: string | null; mobile: string; source: string; stage: string; branch: string; counsellor: string | null; next_follow_up: string | null; srf_paid: boolean; srf_amount: number; student_id: string | null; admission_no: string | null; lost_reason: string | null; events?: { at: string; kind: string; text: string; by: string }[] }
const STAGES = ["New", "Contacted", "Visited", "Application", "Documents", "SRF Paid", "Admitted", "Lost"];

export default function Admissions() {
  const [sp, setSp] = useSearchParams(); const nav = useNavigate(); const { can } = useAuth();
  const [stage, setStage] = useState("open"); const [q, setQ] = useState("");
  const list = useList<Lead>(["leads", stage, q], `/admissions/leads${qs({ stage: stage === "open" || stage === "all" ? undefined : stage, q, limit: 300 })}`);
  const rows = (list.data?.data ?? []).filter((l) => stage !== "open" || !["Admitted", "Lost"].includes(l.stage));
  const funnel = STAGES.map((s) => ({ s, n: (list.data?.data ?? []).filter((l) => l.stage === s).length }));
  return <div className="page">
    <div className="page-head"><h1>Admissions CRM</h1>{can("admissions", "Add") && <button className="btn primary" onClick={() => setSp({ new: "1" })}>+ New enquiry</button>}</div>
    {stage === "all" && <div className="card row">{funnel.map((f) => <span key={f.s} className="pill">{f.s}: <b>{f.n}</b></span>)}</div>}
    <div className="toolbar card"><Field label="Search"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="name, mobile, enquiry no" /></Field>
      <Field label="Stage"><select value={stage} onChange={(e) => setStage(e.target.value)}><option value="open">Open pipeline</option><option value="all">All (funnel)</option>{STAGES.map((s) => <option key={s}>{s}</option>)}</select></Field></div>
    {list.isLoading ? <Loading /> : list.error ? <ErrorBox e={list.error} /> : <DataTable rows={rows} onRow={(r) => nav(`/admissions/${r.id}`)} title={(r) => `${r.name} · ${r.class_name}`}
      cols={[{ key: "no", label: "Enquiry", hideMobile: true }, { key: "name", label: "Name", hideMobile: true }, { key: "class_name", label: "Class", hideMobile: true }, { key: "parent_name", label: "Parent" }, { key: "mobile", label: "Mobile" }, { key: "source", label: "Source" }, { key: "stage", label: "Stage", render: (r) => <Pill tone={toneFor(r.stage)}>{r.stage}</Pill> }, { key: "next_follow_up", label: "Follow-up", render: (r) => <span style={{ color: r.next_follow_up && r.next_follow_up < today() && !["Admitted", "Lost"].includes(r.stage) ? "var(--err)" : undefined }}>{fmtDate(r.next_follow_up)}</span> }, { key: "counsellor", label: "Counsellor", hideMobile: true }]} />}
    {sp.get("new") && <NewLead onClose={() => setSp({})} />}
  </div>;
}

function NewLead({ onClose }: { onClose: () => void }) {
  const br = useBranches(); const { me } = useAuth(); const nav = useNavigate();
  const [f, setF] = useState<Record<string, string>>({ branch_id: me?.branch_id ?? "", name: "", class_name: "Class 1", parent_name: "", mobile: "", email: "", source: "Walk-in", next_follow_up: today() });
  const save = useAction((d: Record<string, string>) => api.post<{ data: Lead }>("/admissions/leads", d), [["leads"]], "Enquiry created");
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  return <Modal title="New enquiry" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancel</button><button className="btn primary" disabled={!f.name || !f.mobile || !f.branch_id || save.isPending} onClick={() => save.mutateAsync(f).then((r) => { onClose(); nav(`/admissions/${r.data.id}`); })}>Create</button></>}>
    <div className="form"><Field label="Branch"><select value={f.branch_id} onChange={set("branch_id")}><option value="">—</option>{br.data?.data.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field><Field label="Class sought"><select value={f.class_name} onChange={set("class_name")}>{CLASSES.map((c) => <option key={c}>{c}</option>)}</select></Field>
      <Field label="Child's name" className="full"><input value={f.name} onChange={set("name")} /></Field><Field label="Parent"><input value={f.parent_name} onChange={set("parent_name")} /></Field><Field label="Mobile"><input value={f.mobile} onChange={set("mobile")} inputMode="tel" /></Field><Field label="Email"><input value={f.email} onChange={set("email")} /></Field>
      <Field label="Source"><select value={f.source} onChange={set("source")}>{["Walk-in", "Referral", "Website", "Social media", "Phone", "Event"].map((s) => <option key={s}>{s}</option>)}</select></Field><Field label="Next follow-up"><input type="date" value={f.next_follow_up} onChange={set("next_follow_up")} /></Field></div>
    <div className="small muted">A second open enquiry for the same mobile in the same branch is blocked (duplicate detector).</div>
  </Modal>;
}

export function LeadDetail() {
  const { id = "" } = useParams(); const { can } = useAuth(); const nav = useNavigate();
  const q = useOne<Lead>(["lead", id], `/admissions/leads/${id}`); const [tab, setTab] = useState("timeline");
  const [fu, setFu] = useState({ note: "", next_follow_up: "" }); const [modal, setModal] = useState<"srf" | "lost" | "admit" | null>(null); const [v, setV] = useState({ srf: "5000", note: "", section: "" });
  const follow = useAction((d: typeof fu) => api.post(`/admissions/leads/${id}/follow-up`, d), [["lead", id], ["leads"]], "Follow-up saved");
  const stage = useAction((d: Record<string, unknown>) => api.post<{ data: Lead }>(`/admissions/leads/${id}/stage`, d), [["lead", id], ["leads"]], "Stage updated");
  if (q.isLoading) return <Loading />; if (q.error) return <ErrorBox e={q.error} />;
  const l = q.data!.data; const idx = STAGES.indexOf(l.stage); const next = idx >= 0 && idx < 6 ? STAGES[idx + 1] : null; const closed = ["Admitted", "Lost"].includes(l.stage);
  const go = (to: string, extra: Record<string, unknown> = {}) => stage.mutateAsync({ to, ...extra }).then((r) => { setModal(null); if (to === "Admitted" && r.data.student_id) nav(`/students/${r.data.student_id}`); });
  return <div className="page">
    <div className="page-head"><div><h1>{l.name} <Pill tone={toneFor(l.stage)}>{l.stage}</Pill></h1><div className="muted small">{l.no} · {l.class_name} · {l.branch} · {l.source} · counsellor {l.counsellor ?? "—"}</div></div>
      {can("admissions", "Edit") && !closed && <div className="row">
        {next && next !== "SRF Paid" && next !== "Admitted" && <button className="btn primary" onClick={() => go(next)}>Move to {next}</button>}
        {next === "SRF Paid" && <button className="btn primary" onClick={() => setModal("srf")}>Record SRF payment</button>}
        {next === "Admitted" && (can("students", "Add") || can("admissions", "Approve")) && <button className="btn primary" onClick={() => setModal("admit")}>Admit student</button>}
        <button className="btn danger" onClick={() => setModal("lost")}>Mark lost</button></div>}
      {l.student_id && <button className="btn" onClick={() => nav(`/students/${l.student_id}`)}>Open student {l.admission_no}</button>}</div>
    <div className="card row" style={{ gap: ".3rem" }}>{STAGES.slice(0, 7).map((s, i) => <span key={s} className={`pill ${i < idx ? "ok" : i === idx ? "info" : ""}`}>{s}</span>)}</div>
    <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))" }}>
      <div className="card"><h3>Contact</h3><div className="stack small"><div>Parent: <b>{l.parent_name ?? "—"}</b></div><div>Mobile: <a href={`tel:${l.mobile}`}>{l.mobile}</a></div><div>Next follow-up: <b>{fmtDate(l.next_follow_up)}</b></div>{l.srf_paid && <div>SRF paid: <b>{inr(l.srf_amount)}</b></div>}{l.lost_reason && <div>Lost: {l.lost_reason}</div>}</div></div>
      {can("admissions", "Edit") && !closed && <div className="card"><h3>Record follow-up</h3><div className="stack"><Field label="Note"><textarea value={fu.note} onChange={(e) => setFu({ ...fu, note: e.target.value })} placeholder="Spoke to parent; visiting on Saturday" /></Field><Field label="Next follow-up date"><input type="date" value={fu.next_follow_up} onChange={(e) => setFu({ ...fu, next_follow_up: e.target.value })} /></Field><button className="btn primary" disabled={!fu.note || follow.isPending} onClick={() => follow.mutateAsync(fu).then(() => setFu({ note: "", next_follow_up: "" }))}>Save</button></div></div>}
    </div>
    <Tabs value={tab} onChange={setTab} tabs={[{ key: "timeline", label: "Timeline" }]} />
    <div className="card timeline">{(l.events ?? []).map((e, i) => <div key={i} className="ev"><time>{new Date(e.at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</time><div><Pill>{e.kind}</Pill> {e.text} <span className="muted small">— {e.by}</span></div></div>)}</div>
    {modal === "srf" && <Modal title="Record SRF payment" onClose={() => setModal(null)} footer={<button className="btn primary" onClick={() => go("SRF Paid", { srf_amount: Number(v.srf) })}>Save</button>}><Field label="Amount"><input type="number" value={v.srf} onChange={(e) => setV({ ...v, srf: e.target.value })} /></Field></Modal>}
    {modal === "lost" && <Modal title="Mark enquiry lost" onClose={() => setModal(null)} footer={<button className="btn danger" disabled={v.note.length < 5} onClick={() => go("Lost", { note: v.note })}>Mark lost</button>}><Field label="Reason"><textarea value={v.note} onChange={(e) => setV({ ...v, note: e.target.value })} /></Field></Modal>}
    {modal === "admit" && <Modal title="Admit student (auto-onboarding)" onClose={() => setModal(null)} footer={<button className="btn primary" onClick={() => go("Admitted", { section: v.section || undefined })}>Admit</button>}><div className="stack"><div className="small">Creates the student record, admission number, fee demands from the approved structure, allocates a section with free seats and notifies the fee desk.</div><Field label="Section (blank = auto-allocate)"><input value={v.section} onChange={(e) => setV({ ...v, section: e.target.value.toUpperCase() })} /></Field></div></Modal>}
  </div>;
}
