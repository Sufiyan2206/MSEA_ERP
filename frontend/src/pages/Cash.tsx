import { useState } from "react";
import { useList, useOne, useAction } from "@/hooks/useApi";
import { api, fmtDate, inr, today } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { DataTable, Field, Loading, Modal, Pill, toneFor, ReasonModal } from "@/components/ui";

interface Expected { expected: number; denominations: number[]; closed: boolean; date: string }
interface Closing extends Record<string, unknown> { id: string; closing_date: string; cashier: string; expected: number; counted: number; difference: number; reason: string | null; status: string; cashier_id: string }
interface Handover extends Record<string, unknown> { id: string; no: string; handover_date: string; from_user: string; amount: number; state: string; accepted_amount: number | null; deposit_ref: string | null; note: string | null; auto: boolean }

/** Cashier closing: count notes by denomination; system compares with cash receipts; difference needs reason; auto handover created. */
export default function Closing() {
  const { can, me } = useAuth(); const [date, setDate] = useState(today()); const [notes, setNotes] = useState<Record<string, string>>({}); const [reason, setReason] = useState("");
  const exp = useOne<Expected>(["expected", date], `/cash/expected?date=${date}`, can("cash", "Add"));
  const list = useList<Closing>(["closings"], "/cash/closings");
  const close = useAction((d: unknown) => api.post<{ data: { handover: { no: string } | null } }>("/cash/closings", d), [["closings"], ["expected", date], ["handovers"]]);
  const verify = useAction((id: string) => api.post(`/cash/closings/${id}/verify`), [["closings"]], "Closing verified");
  const counted = Object.entries(notes).reduce((a, [k, v]) => a + Number(k) * (Number(v) || 0), 0); const expected = exp.data?.data.expected ?? 0; const diff = counted - expected;
  return <div className="page"><h1>Cash day closing</h1>
    {can("cash", "Add") && (exp.isLoading ? <Loading /> : exp.data && (exp.data.data.closed ? <div className="card">✅ Your cash day {fmtDate(date)} is closed. <button className="btn sm" onClick={() => setDate(today())}>Today</button></div> : <div className="card stack">
      <div className="row"><Field label="Closing date"><input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} /></Field><div className="kpi"><span className="v">{inr(expected)}</span><span className="l">Expected cash (your receipts)</span></div></div>
      <h3>Count notes & coins</h3>
      <div className="denoms">{exp.data.data.denominations.map((d) => <div key={d} className="d"><span className="mono">₹{d} ×</span><input type="number" inputMode="numeric" min={0} value={notes[d] ?? ""} onChange={(e) => setNotes({ ...notes, [d]: e.target.value })} /></div>)}</div>
      <div className="row" style={{ justifyContent: "space-between" }}><div>Counted <b style={{ fontSize: "1.2rem" }}>{inr(counted)}</b></div><div>Difference <b style={{ color: Math.abs(diff) > 0.5 ? "var(--err)" : "var(--ok)" }}>{diff >= 0 ? "+" : ""}{inr(diff)}</b></div></div>
      {Math.abs(diff) > 0.5 && <Field label="Reason for difference (10+ chars, audited, principal notified)"><textarea value={reason} onChange={(e) => setReason(e.target.value)} /></Field>}
      <button className="btn primary" disabled={close.isPending || (Math.abs(diff) > 0.5 && reason.trim().length < 10)} onClick={() => close.mutateAsync({ closing_date: date, denominations: Object.fromEntries(Object.entries(notes).filter(([, v]) => Number(v) > 0).map(([k, v]) => [k, Number(v)])), reason: reason || undefined }).then((r) => { setNotes({}); setReason(""); alert(r.data.handover ? `Day closed. Handover ${r.data.handover.no} created for the accountant.` : "Day closed (no cash)."); })}>Close day & hand over</button>
      <div className="small muted">Closing is final for the day. A cash handover to the Branch Accountant is created automatically; they count and accept it, then record the bank deposit.</div>
    </div>))}
    <h2>Closings</h2>
    <DataTable rows={list.data?.data ?? []} title={(r) => `${fmtDate(r.closing_date)} · ${r.cashier}`} cols={[{ key: "closing_date", label: "Date", render: (r) => fmtDate(r.closing_date), hideMobile: true }, { key: "cashier", label: "Cashier", hideMobile: true }, { key: "expected", label: "Expected", num: true, render: (r) => inr(r.expected) }, { key: "counted", label: "Counted", num: true, render: (r) => inr(r.counted) }, { key: "difference", label: "Diff", num: true, render: (r) => <span style={{ color: Math.abs(r.difference) > 0.5 ? "var(--err)" : undefined }}>{inr(r.difference)}</span> }, { key: "reason", label: "Reason" }, { key: "status", label: "Status", render: (r) => <Pill tone={toneFor(r.status)}>{r.status}</Pill> },
      { key: "a", label: "", render: (r) => r.status === "Submitted" && can("cash", "Verify") && r.cashier_id !== me?.id ? <button className="btn sm primary" onClick={() => verify.mutate(r.id)}>Verify</button> : null }]} />
  </div>;
}

export function Handovers() {
  const { can, me } = useAuth(); const list = useList<Handover>(["handovers"], "/cash/handovers");
  const trans = useAction((v: { id: string; to: string; accepted_amount?: number; deposit_ref?: string; note?: string }) => api.post(`/cash/handovers/${v.id}/transition`, v), [["handovers"], ["kpis"]], "Updated");
  const [acc, setAcc] = useState<Handover | null>(null); const [dep, setDep] = useState<Handover | null>(null); const [rej, setRej] = useState<Handover | null>(null); const [amt, setAmt] = useState(""); const [note, setNote] = useState(""); const [ref, setRef] = useState("");
  const pending = (list.data?.data ?? []).filter((h) => h.state === "Submitted").reduce((a, h) => a + h.amount, 0); const accepted = (list.data?.data ?? []).filter((h) => h.state === "Accepted").reduce((a, h) => a + h.amount, 0);
  return <div className="page"><h1>Cash handovers</h1>
    <div className="grid"><div className="card kpi"><span className="v">{inr(pending)}</span><span className="l">Awaiting acceptance</span></div><div className="card kpi"><span className="v">{inr(accepted)}</span><span className="l">Accepted, not yet banked</span></div></div>
    {list.isLoading ? <Loading /> : <DataTable rows={list.data!.data} title={(r) => `${r.no} · ${inr(r.amount)}`} cols={[{ key: "no", label: "No", hideMobile: true }, { key: "handover_date", label: "Date", render: (r) => fmtDate(r.handover_date) }, { key: "from_user", label: "From" }, { key: "amount", label: "Amount", num: true, render: (r) => inr(r.amount) }, { key: "state", label: "State", render: (r) => <Pill tone={toneFor(r.state)}>{r.state}</Pill> }, { key: "deposit_ref", label: "Deposit ref" }, { key: "note", label: "Note" },
      { key: "a", label: "", render: (r) => can("cash", "Verify") ? <span className="row">{r.state === "Submitted" && r.from_user !== me?.name && <><button className="btn sm primary" onClick={() => { setAcc(r); setAmt(String(r.amount)); }}>Accept</button><button className="btn sm danger" onClick={() => setRej(r)}>Reject</button></>}{r.state === "Accepted" && <button className="btn sm primary" onClick={() => setDep(r)}>Record deposit</button>}</span> : null }]} />}
    {acc && <Modal title={`Accept ${acc.no}`} onClose={() => setAcc(null)} footer={<button className="btn primary" onClick={() => trans.mutateAsync({ id: acc.id, to: "Accepted", accepted_amount: Number(amt), note: note || undefined }).then(() => { setAcc(null); setNote(""); })}>Accept</button>}>
      <div className="stack"><div>Handed over: <b>{inr(acc.amount)}</b></div><Field label="Amount you counted"><input type="number" value={amt} onChange={(e) => setAmt(e.target.value)} /></Field>{Math.abs(Number(amt) - acc.amount) > 0.5 && <Field label="Reason for difference (10+ chars)"><textarea value={note} onChange={(e) => setNote(e.target.value)} /></Field>}</div></Modal>}
    {dep && <Modal title={`Bank deposit for ${dep.no}`} onClose={() => setDep(null)} footer={<button className="btn primary" disabled={!ref.trim()} onClick={() => trans.mutateAsync({ id: dep.id, to: "Deposited", deposit_ref: ref }).then(() => { setDep(null); setRef(""); })}>Save</button>}><Field label="Bank deposit slip / reference"><input value={ref} onChange={(e) => setRef(e.target.value)} /></Field></Modal>}
    {rej && <ReasonModal title={`Reject ${rej.no}`} onCancel={() => setRej(null)} onOk={(n) => trans.mutateAsync({ id: rej.id, to: "Rejected", note: n }).then(() => setRej(null))} />}
  </div>;
}
