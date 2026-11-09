import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import dir from "@/legacy/directory.json";

interface Item { key: string; label: string; mod: string }
interface Group { group: string; items: Item[] }
const DIR = dir as Group[];
export const LEGACY_SCREENS: (Item & { group: string })[] = DIR.flatMap((g) => g.items.map((i) => ({ ...i, group: g.group })));

const ICON: Record<string, string> = {
  "My Day": "⌂", "Strength & admissions": "♟", "Fee collection": "₹", "Finance": "▥", "SRF incentives": "★", "Store & purchase": "▤",
  "Asset management": "▣", "Petty cash": "◉", "Utilities": "⚡", "Bank reconciliation": "⇄", "Human Resources": "♧", "Maintenance Management": "⚙",
  "Student information": "♙", "Academics": "✎", "Planner": "▦", "Franchise": "⌂", "Compliance": "☑", "Communication": "✉",
  "Admissions CRM": "▤", "IT Management": "▢", "Legal & Compliance": "⚖", "Payroll": "▣", "AI Assistant": "✦", "Admin control centre": "⚑",
};
const HUES = [210, 260, 160, 30, 45, 340, 190, 120, 50, 280, 175, 15, 230, 300, 200, 70, 150, 325, 95, 240, 20, 170, 265, 0];
const hue = (group: string) => HUES[Math.max(0, DIR.findIndex((g) => g.group === group)) % HUES.length];
const tint = (group: string) => ({ background: `hsl(${hue(group)} 70% 94%)`, color: `hsl(${hue(group)} 65% 42%)` });

/** Directory of every module screen of the original application, all running inside this PWA.
 *  Layout: area list on the left, the selected area's screens on the right, sized to fit one view. */
export default function Modules() {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const groups = useMemo(() => { const s = q.trim().toLowerCase(); return DIR.map((g) => ({ ...g, items: g.items.filter((i) => !s || i.label.toLowerCase().includes(s) || g.group.toLowerCase().includes(s) || i.key.includes(s)) })).filter((g) => g.items.length); }, [q]);
  const active = groups.find((g) => g.group === sel) ?? groups[0];
  return <div className="page mods">
    <div className="mods-head">
      <div><h1>All modules</h1><div className="muted small">{LEGACY_SCREENS.length} screens across {DIR.length} areas. Each opens with its own module menu; your role decides what is visible inside.</div></div>
      <div className="field"><input autoFocus type="search" aria-label="Find a screen" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a screen: petty cash, hostel, payroll, UDISE" /></div>
    </div>
    <div className="card mods-body">
      <div className="mods-cats" role="tablist" aria-label="Module areas">
        {groups.map((g) => <button key={g.group} type="button" role="tab" aria-selected={g.group === active?.group} className={`mods-cat ${g.group === active?.group ? "on" : ""}`} onClick={() => setSel(g.group)}>
          <span className="gi" style={tint(g.group)}>{ICON[g.group] ?? "▦"}</span><span className="cn">{g.group}</span><span className="cnt">{g.items.length}</span>
        </button>)}
      </div>
      <div className="mods-items">
        {active ? <>
          <div className="mods-title"><span className="gi gi-lg" style={tint(active.group)}>{ICON[active.group] ?? "▦"}</span><h2>{active.group}</h2><span className="cnt">{active.items.length} screen{active.items.length > 1 ? "s" : ""}</span></div>
          <div className="mods-list">{active.items.map((i) => <Link key={i.key} to={`/app/${i.key}`}>{i.label}</Link>)}</div>
        </> : <div className="empty">No screen matches “{q}”.</div>}
      </div>
    </div>
  </div>;
}
