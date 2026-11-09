import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/store/auth";
import { useUI } from "@/store/ui";
import { api, type Page } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Toasts } from "./ui";

interface NavItem { to: string; label: string; ic: string; mod?: string; act?: string; roles?: string[] }
const NAV: { grp: string; short: string; ic: string; items: NavItem[] }[] = [
  { grp: "Overview", short: "Overview", ic: "⌂", items: [{ to: "/", label: "My day", ic: "⌂" }, { to: "/dashboard", label: "Dashboard", ic: "▥", mod: "dashboard" }, { to: "/gaps", label: "Gap center", ic: "⚑", mod: "gaps" }, { to: "/tasks", label: "Tasks & checklist", ic: "☑" }] },
  { grp: "Students", short: "Students", ic: "♟", items: [{ to: "/students", label: "Students", ic: "♟", mod: "students" }, { to: "/admissions", label: "Admissions CRM", ic: "▤", mod: "admissions" }, { to: "/attendance", label: "Attendance", ic: "▦", mod: "attendance" }] },
  { grp: "Fees & cash", short: "Fees", ic: "₹", items: [{ to: "/fees/collect", label: "Collect fee", ic: "₹", mod: "fees", act: "Add" }, { to: "/fees/receipts", label: "Receipts", ic: "▧", mod: "fees" }, { to: "/fees/approvals", label: "Concessions & refunds", ic: "◇", mod: "fees" }, { to: "/cash/closing", label: "Cash closing", ic: "◉", mod: "cash" }, { to: "/cash/handovers", label: "Handovers", ic: "⇄", mod: "cash" }, { to: "/fees/structures", label: "Fee structures", ic: "⌁", mod: "fees", act: "Configure Settings" }] },
  { grp: "People", short: "People", ic: "♧", items: [{ to: "/hr/employees", label: "Employees", ic: "♧", mod: "hr" }, { to: "/hr/leave", label: "Leave", ic: "◷" }, { to: "/hr/payroll", label: "Payroll", ic: "▣", mod: "payroll" }] },
  { grp: "Workspace", short: "Space", ic: "▦", items: [{ to: "/modules", label: "Module directory", ic: "▦", mod: "legacy" }] },
  { grp: "Reports & admin", short: "Admin", ic: "⌁", items: [{ to: "/reports", label: "Report builder", ic: "⌁", mod: "reports" }, { to: "/admin/users", label: "Users & roles", ic: "♙", mod: "admin" }, { to: "/admin/audit", label: "Audit log", ic: "◉", mod: "audit" }] },
];

function BellIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></svg>;
}

export default function Shell() {
  const { me, can, logout } = useAuth();
  const { drawer, setDrawer } = useUI();
  const nav = useNavigate();
  const loc = useLocation();
  const [online, setOnline] = useState(navigator.onLine);
  const [pick, setPick] = useState<string | null>(null);
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  const notes = useQuery({ queryKey: ["notes-unread"], queryFn: () => api.get<Page<unknown>>("/notifications?unread=1&limit=1"), refetchInterval: 60_000 });
  const visible = NAV.map((g) => ({ ...g, items: g.items.filter((i) => (!i.mod || can(i.mod, i.act ?? "View")) && (!i.roles || i.roles.includes(me?.role ?? ""))) })).filter((g) => g.items.length);
  const bottom = [{ to: "/", label: "Home", ic: "⌂" }, ...(can("fees", "Add") ? [{ to: "/fees/collect", label: "Collect", ic: "₹" }] : []), ...(can("attendance", "Add") ? [{ to: "/attendance", label: "Attend", ic: "▦" }] : []), ...(can("gaps") ? [{ to: "/gaps", label: "Gaps", ic: "⚑" }] : []), { to: "/notifications", label: "Alerts", ic: "♧" }].slice(0, 5);
  const matched = visible.find((g) => g.items.some((i) => i.to === "/" ? loc.pathname === "/" : loc.pathname === i.to || loc.pathname.startsWith(i.to + "/")))?.grp;
  useEffect(() => { setPick(null); }, [loc.pathname]);
  const active = visible.find((g) => g.grp === (pick ?? matched)) ?? visible[0];
  const initials = (me?.name ?? "User").split(/\s+/).slice(0, 2).map((s) => s[0]).join("").toUpperCase();
  const legacy = loc.pathname.startsWith("/app");
  return (
    <div className="shell">
      <header className="topbar">
        <button className="icon menu-toggle" aria-label="Toggle navigation" onClick={() => setDrawer(!drawer)}>☰</button>
        <button className="brand-lockup" onClick={() => nav("/")} aria-label="Eduvia home">
          <img className="brand-logo" src="/icons/eduvia-mark.png" alt="" /><span className="brand-copy"><strong>Eduvia</strong><small>A Smarter Pathway to Education</small></span>
        </button>
        <button className="global-search" onClick={() => nav("/search")} aria-label="Open search"><span>⌕</span><span>Search students, fees, modules...</span><kbd>⌘ K</kbd></button>
        <div className={`connection-state ${online ? "is-online" : "is-offline"}`}><i />{online ? "System online" : "Offline"}</div>
        <button className="icon notification-btn" aria-label="Notifications" onClick={() => nav("/notifications")}><BellIcon />{!!notes.data?.unread && <span className="badge">{notes.data.unread}</span>}</button>
        <div className="profile-button" title={me?.name}>
          <span className="avatar">{initials}</span><span className="profile-copy"><strong>{me?.name}</strong><small>{me?.role}</small></span>
        </div>
        <button className="icon signout-button" aria-label="Sign out" title="Sign out" onClick={() => { api.post("/auth/logout").catch(() => undefined); logout(); }}><img src="/icons/logout.png" alt="" /></button>
      </header>
      {!online && <div className="offline">Offline — showing cached data; actions will fail until you are back online.</div>}
      <div className={`body ${legacy ? "lg-mode" : ""}`}>
        <nav className={`side ${drawer ? "open" : ""}`} aria-label="Main navigation">
          <div className="rail">{visible.map((g) => <button key={g.grp} type="button" className={`rail-btn ${g.grp === active?.grp ? "on" : ""}`} aria-label={g.grp} aria-pressed={g.grp === active?.grp} title={g.grp} onClick={() => setPick(g.grp)}><span className="rail-ic">{g.ic}</span><small>{g.short}</small></button>)}</div>
          {active && <div className="panel"><h3 className="grp">{active.grp}</h3>{active.items.map((i) => <NavLink key={i.to} to={i.to} end={i.to === "/"} onClick={() => setDrawer(false)}><span className="nav-icon">{i.ic}</span><span>{i.label}</span></NavLink>)}</div>}
        </nav>
        <main className={`main ${legacy ? "main-lg" : ""}`}><Outlet /></main>
      </div>
      <nav className="bottom" aria-label="Quick navigation">{bottom.map((b) => <NavLink key={b.to} to={b.to} end={b.to === "/"}><span className="ic">{b.label === "Alerts" ? <BellIcon /> : b.ic}</span>{b.label}</NavLink>)}</nav>
      <Toasts />
    </div>
  );
}
