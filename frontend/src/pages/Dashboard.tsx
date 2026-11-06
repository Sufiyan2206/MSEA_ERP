import { useOne } from "@/hooks/useApi";
import { inr } from "@/lib/api";
import { DataTable, Kpi, Loading, ErrorBox, Pill } from "@/components/ui";

interface Brief { headline: string; flags: string[]; kpis: Record<string, number>; branches: (Record<string, unknown> & { branch: string; outstanding: number; mtd: number; open_gaps: number; attendance: number | null; compliance: number })[] }

export default function Dashboard() {
  const q = useOne<Brief>(["brief"], "/dashboard/brief");
  if (q.isLoading) return <Loading />; if (q.error) return <ErrorBox e={q.error} />;
  const b = q.data!.data; const k = b.kpis;
  return <div className="page">
    <div><h1>Executive dashboard</h1><div className="muted">{b.headline}</div></div>
    {b.flags.length > 0 && <div className="card" style={{ borderColor: "var(--warn)" }}><h3>Red flags</h3><ul style={{ margin: 0, paddingLeft: "1.1rem" }}>{b.flags.map((f, i) => <li key={i}>{f}</li>)}</ul></div>}
    <div className="grid">
      <Kpi label="Students" value={k.students} /><Kpi label="Collected MTD" value={inr(k.collection_mtd)} sub={`${k.collection_pct}% of demand`} /><Kpi label="Outstanding" value={inr(k.outstanding)} sub={`overdue ${inr(k.overdue)}`} />
      <Kpi label="Admissions MTD" value={k.admissions_mtd} sub={`${k.open_enquiries} open enquiries`} /><Kpi label="Open gaps" value={k.open_gaps} sub={k.critical_gaps ? <Pill tone="err">{k.critical_gaps} critical</Pill> : undefined} />
      <Kpi label="Student attendance" value={k.student_attendance_pct == null ? "—" : `${k.student_attendance_pct}%`} /><Kpi label="Staff attendance" value={k.staff_attendance_pct == null ? "—" : `${k.staff_attendance_pct}%`} /><Kpi label="Compliance" value={`${(k as unknown as { compliance: { score: number } }).compliance.score}/100`} />
    </div>
    <div><h2>Branch scorecard</h2>
      <DataTable rows={b.branches} title={(r) => r.branch} cols={[{ key: "branch", label: "Branch", hideMobile: true }, { key: "mtd", label: "Collected MTD", num: true, render: (r) => inr(r.mtd) }, { key: "outstanding", label: "Outstanding", num: true, render: (r) => inr(r.outstanding) },
        { key: "attendance", label: "Attendance", num: true, render: (r) => r.attendance == null ? "—" : `${r.attendance}%` }, { key: "open_gaps", label: "Open gaps", num: true }, { key: "compliance", label: "Compliance", num: true, render: (r) => <span className="row" style={{ justifyContent: "flex-end" }}><span className="bar" style={{ width: 60 }}><i style={{ width: `${r.compliance}%` }} /></span>{r.compliance}</span> }]} />
    </div>
  </div>;
}
