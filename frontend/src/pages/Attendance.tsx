import { useEffect, useState } from "react";
import { useOne, useAction } from "@/hooks/useApi";
import { api, qs, today } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { Field, Loading, ErrorBox, Tabs } from "@/components/ui";
import { CLASSES, useBranches } from "./Students";

interface Sheet { date: string; period: number; locked: boolean; rows: { student_id: string; admission_no: string; name: string; section: string | null; status: string | null }[] }
interface StaffSheet { date: string; rows: { employee_id: string; emp_code: string; name: string; designation: string | null; status: string | null }[] }
const S_OPTS = ["P", "A", "L", "V", "M"]; const S_LBL: Record<string, string> = { P: "Present", A: "Absent", L: "Late", V: "Leave", M: "Medical", E: "Excused" };
const T_OPTS = ["P", "A", "H", "L", "W"]; const T_LBL: Record<string, string> = { P: "Present", A: "Absent", H: "Half day", L: "Leave", W: "Weekly off" };

/** Attendance: one-tap per student; default everyone present; back-dated >2 days requires a reason. Works well on phones. */
export default function Attendance() {
  const { can, me } = useAuth(); const [tab, setTab] = useState(can("attendance", "Add") ? "students" : "staff");
  return <div className="page"><h1>Attendance</h1>
    <Tabs value={tab} onChange={setTab} tabs={[...(can("attendance") ? [{ key: "students", label: "Students" }] : []), ...(can("hr") ? [{ key: "staff", label: "Staff" }] : []), { key: "self", label: "My check-in" }]} />
    {tab === "students" && <StudentSheet />}{tab === "staff" && <StaffSheetView />}{tab === "self" && <SelfCheckin linked={!!me} />}
  </div>;
}

function StudentSheet() {
  const { me, can } = useAuth(); const br = useBranches();
  const [bid, setBid] = useState(me?.branch_id ?? ""); const [cls, setCls] = useState("Class 1"); const [sec, setSec] = useState(""); const [date, setDate] = useState(today()); const [period, setPeriod] = useState("0"); const [reason, setReason] = useState("");
  const [marks, setMarks] = useState<Record<string, string>>({});
  const sheet = useOne<Sheet>(["att", bid, cls, sec, date, period], `/attendance/students${qs({ branch_id: bid, class_name: cls, section: sec, date, period })}`, !!bid && !!cls);
  useEffect(() => { if (sheet.data) setMarks(Object.fromEntries(sheet.data.data.rows.map((r) => [r.student_id, r.status ?? "P"]))); }, [sheet.data]);
  const save = useAction((d: unknown) => api.post("/attendance/students", d), [["att"], ["kpis"]], "Attendance saved");
  const rows = sheet.data?.data.rows ?? []; const counts = S_OPTS.map((o) => ({ o, n: Object.values(marks).filter((m) => m === o).length }));
  const locked = sheet.data?.data.locked ?? false;
  return <div className="stack">
    <div className="toolbar card">{(br.data?.data.length ?? 0) > 1 && <Field label="Branch"><select value={bid} onChange={(e) => setBid(e.target.value)}>{br.data!.data.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>}
      <Field label="Class"><select value={cls} onChange={(e) => setCls(e.target.value)}>{CLASSES.map((c) => <option key={c}>{c}</option>)}</select></Field><Field label="Section"><input value={sec} onChange={(e) => setSec(e.target.value.toUpperCase())} placeholder="all" /></Field>
      <Field label="Date"><input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} /></Field><Field label="Period"><select value={period} onChange={(e) => setPeriod(e.target.value)}><option value="0">Daily</option>{[1, 2, 3, 4, 5, 6, 7, 8].map((p) => <option key={p} value={p}>Period {p}</option>)}</select></Field></div>
    {sheet.isLoading ? <Loading /> : sheet.error ? <ErrorBox e={sheet.error} /> : <>
      <div className="card row" style={{ justifyContent: "space-between" }}><div className="row">{counts.map((c) => <span key={c.o} className={`pill ${c.o === "A" ? "err" : c.o === "P" ? "ok" : ""}`}>{S_LBL[c.o]} {c.n}</span>)}</div><button className="btn sm" onClick={() => setMarks(Object.fromEntries(rows.map((r) => [r.student_id, "P"])))}>All present</button></div>
      {locked && <div className="card" style={{ borderColor: "var(--warn)" }}><Field label="This date is more than 2 days old — correction reason required (needs Edit permission)"><input value={reason} onChange={(e) => setReason(e.target.value)} /></Field></div>}
      <div className="att-grid">{rows.map((r) => <div key={r.student_id} className="att-row"><div><div>{r.name}</div><div className="small muted">{r.admission_no}{r.section ? ` · ${r.section}` : ""}</div></div><div className="opts">{S_OPTS.map((o) => <button key={o} title={S_LBL[o]} className={`${marks[r.student_id] === o ? "on " + o : ""}`} onClick={() => setMarks({ ...marks, [r.student_id]: o })}>{o}</button>)}</div></div>)}</div>
      {rows.length > 0 && <button className="btn primary" disabled={save.isPending || !can("attendance", "Add") || (locked && reason.length < 5)} onClick={() => save.mutate({ branch_id: bid, class_name: cls, section: sec || undefined, date, period: Number(period), reason: reason || undefined, marks: rows.map((r) => ({ student_id: r.student_id, status: marks[r.student_id] ?? "P" })) })}>Save attendance ({rows.length})</button>}
      {!rows.length && <div className="card empty">No active students for this class/section.</div>}</>}
  </div>;
}

function StaffSheetView() {
  const { me, can } = useAuth(); const br = useBranches(); const [bid, setBid] = useState(me?.branch_id ?? ""); const [date, setDate] = useState(today()); const [marks, setMarks] = useState<Record<string, string>>({}); const [reason, setReason] = useState("");
  const sheet = useOne<StaffSheet>(["satt", bid, date], `/attendance/staff${qs({ branch_id: bid, date })}`, !!bid);
  useEffect(() => { if (sheet.data) setMarks(Object.fromEntries(sheet.data.data.rows.map((r) => [r.employee_id, r.status ?? "P"]))); }, [sheet.data]);
  const save = useAction((d: unknown) => api.post("/attendance/staff", d), [["satt"], ["kpis"]], "Staff attendance saved");
  const rows = sheet.data?.data.rows ?? []; const changed = rows.some((r) => r.status && r.status !== marks[r.employee_id]);
  return <div className="stack"><div className="toolbar card">{(br.data?.data.length ?? 0) > 1 && <Field label="Branch"><select value={bid} onChange={(e) => setBid(e.target.value)}>{br.data!.data.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>}<Field label="Date"><input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} /></Field></div>
    {sheet.isLoading ? <Loading /> : <><div className="att-grid">{rows.map((r) => <div key={r.employee_id} className="att-row"><div><div>{r.name}</div><div className="small muted">{r.emp_code} · {r.designation ?? ""}</div></div><div className="opts">{T_OPTS.map((o) => <button key={o} title={T_LBL[o]} className={marks[r.employee_id] === o ? "on " + o : ""} onClick={() => setMarks({ ...marks, [r.employee_id]: o })}>{o}</button>)}</div></div>)}</div>
      {changed && <Field label="Reason for changing an existing mark (regularisation)"><input value={reason} onChange={(e) => setReason(e.target.value)} /></Field>}
      {rows.length > 0 && can("hr", "Add") && <button className="btn primary" disabled={save.isPending || (changed && reason.length < 5)} onClick={() => save.mutate({ branch_id: bid, date, reason: reason || undefined, marks: rows.map((r) => ({ employee_id: r.employee_id, status: marks[r.employee_id] ?? "P" })) })}>Save ({rows.length})</button>}</>}
  </div>;
}

function SelfCheckin({ linked }: { linked: boolean }) {
  const ci = useAction(() => api.post("/attendance/self-checkin", { device: navigator.userAgent.slice(0, 80), at: new Date().toISOString() }), [], "Checked in. Have a good day!");
  return <div className="card stack"><h3>Mobile check-in</h3><div className="small muted">Marks you present for today from your phone. Your login must be linked to an employee record; the device and time are stored in the audit log.</div><button className="btn primary" disabled={!linked || ci.isPending} onClick={() => ci.mutate()}>Check in now</button></div>;
}
