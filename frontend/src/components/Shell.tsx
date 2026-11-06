import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/store/auth";
import { useUI } from "@/store/ui";
import { api, type Page } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Toasts } from "./ui";

interface NavItem { to: string; label: string; ic: string; mod?: string; act?: string; roles?: string[] }
const NAV: { grp: string; items: NavItem[] }[] = [
  { grp: "Overview", items: [{ to: "/", label: "My day", ic: "🏠" }, { to: "/dashboard", label: "Dashboard", ic: "📊", mod: "dashboard" }, { to: "/gaps", label: "Gap center", ic: "🚩", mod: "gaps" }, { to: "/tasks", label: "Tasks & checklist", ic: "✅" }] },
  { grp: "Students", items: [{ to: "/students", label: "Students", ic: "🎓", mod: "students" }, { to: "/admissions", label: "Admissions CRM", ic: "📝", mod: "admissions" }, { to: "/attendance", label: "Attendance", ic: "🗓️", mod: "attendance" }] },
  { grp: "Fees & cash", items: [{ to: "/fees/collect", label: "Collect fee", ic: "💳", mod: "fees", act: "Add" }, { to: "/fees/receipts", label: "Receipts", ic: "🧾", mod: "fees" }, { to: "/fees/approvals", label: "Concessions & refunds", ic: "🔏", mod: "fees" }, { to: "/cash/closing", label: "Cash closing", ic: "💰", mod: "cash" }, { to: "/cash/handovers", label: "Handovers", ic: "🏦", mod: "cash" }, { to: "/fees/structures", label: "Fee structures", ic: "📐", mod: "fees", act: "Configure Settings" }] },
  { grp: "People", items: [{ to: "/hr/employees", label: "Employees", ic: "👥", mod: "hr" }, { to: "/hr/leave", label: "Leave", ic: "🌴" }, { to: "/hr/payroll", label: "Payroll", ic: "🧮", mod: "payroll" }] },
  { grp: "All modules", items: [{ to: "/modules", label: "Module directory (192 screens)", ic: "🧩", mod: "legacy" }] },
  { grp: "Reports & admin", items: [{ to: "/reports", label: "Report builder", ic: "📈", mod: "reports" }, { to: "/admin/users", label: "Users & roles", ic: "🔐", mod: "admin" }, { to: "/admin/audit", label: "Audit log", ic: "🕵️", mod: "audit" }] },
];

export default function Shell() {
  const { me, can, logout } = useAuth(); const { drawer, setDrawer } = useUI(); const nav = useNavigate(); const loc = useLocation();
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => { const on = () => setOnline(true), off = () => setOnline(false); window.addEventListener("online", on); window.addEventListener("offline", off); return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); }; }, []);
  const notes = useQuery({ queryKey: ["notes-unread"], queryFn: () => api.get<Page<unknown>>("/notifications?unread=1&limit=1"), refetchInterval: 60_000 });
  const visible = NAV.map((g) => ({ ...g, items: g.items.filter((i) => (!i.mod || can(i.mod, i.act ?? "View")) && (!i.roles || i.roles.includes(me?.role ?? ""))) })).filter((g) => g.items.length);
  const bottom = [{ to: "/", label: "Home", ic: "🏠" }, ...(can("fees", "Add") ? [{ to: "/fees/collect", label: "Collect", ic: "💳" }] : []), ...(can("attendance", "Add") ? [{ to: "/attendance", label: "Attend", ic: "🗓️" }] : []), ...(can("gaps") ? [{ to: "/gaps", label: "Gaps", ic: "🚩" }] : []), { to: "/notifications", label: "Alerts", ic: "🔔" }].slice(0, 5);
  return (
    <div className="shell">
      <header className="topbar">
        <button className="icon" aria-label="Menu" onClick={() => setDrawer(!drawer)}>☰</button>
        <div className="brand grow">MSEA ERP<small className="small">{me?.role}</small></div>
        <button className="icon" aria-label="Search" onClick={() => nav("/search")}>🔍</button>
        <button className="icon" aria-label="Notifications" onClick={() => nav("/notifications")}>🔔{!!notes.data?.unread && <span className="badge">{notes.data.unread}</span>}</button>
        <button className="icon" aria-label="Sign out" title={me?.name} onClick={() => { api.post("/auth/logout").catch(() => undefined); logout(); }}>⏻</button>
      </header>
      {!online && <div className="offline">Offline — showing cached data; actions will fail until you are back online.</div>}
      <div className={`body ${loc.pathname.startsWith("/app") ? "lg-mode" : ""}`}>
        <nav className={`side ${drawer ? "open" : ""}`} onClick={() => setDrawer(false)}>
          <div className="grp small muted">{me?.name}</div>
          {visible.map((g) => <div key={g.grp}><h3 className="grp">{g.grp}</h3>{g.items.map((i) => <NavLink key={i.to} to={i.to} end={i.to === "/"}><span>{i.ic}</span>{i.label}</NavLink>)}</div>)}
        </nav>
        <main className={`main ${loc.pathname.startsWith("/app") ? "main-lg" : ""}`}><Outlet /></main>
      </div>
      <nav className="bottom">{bottom.map((b) => <NavLink key={b.to} to={b.to} end={b.to === "/"}><span className="ic">{b.ic}</span>{b.label}</NavLink>)}</nav>
      <Toasts />
    </div>
  );
}
