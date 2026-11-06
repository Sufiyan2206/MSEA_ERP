import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import dir from "@/legacy/directory.json";
import { Field } from "@/components/ui";

interface Item { key: string; label: string; mod: string }
interface Group { group: string; items: Item[] }
const DIR = dir as Group[];
export const LEGACY_SCREENS: (Item & { group: string })[] = DIR.flatMap((g) => g.items.map((i) => ({ ...i, group: g.group })));

/** Directory of every module screen of the original application, all running inside this PWA. */
export default function Modules() {
  const [q, setQ] = useState("");
  const groups = useMemo(() => { const s = q.trim().toLowerCase(); return DIR.map((g) => ({ ...g, items: g.items.filter((i) => !s || i.label.toLowerCase().includes(s) || g.group.toLowerCase().includes(s) || i.key.includes(s)) })).filter((g) => g.items.length); }, [q]);
  return <div className="page">
    <div><h1>All modules</h1><div className="muted small">{LEGACY_SCREENS.length} screens across {DIR.length} areas. Each opens with its own module menu; your role decides what is visible inside.</div></div>
    <div className="card"><Field label="Find a screen"><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. petty cash, hostel, payroll, UDISE" /></Field></div>
    <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))" }}>
      {groups.map((g) => <div key={g.group} className="card"><h3>{g.group}</h3><div className="stack" style={{ gap: ".25rem" }}>{g.items.map((i) => <Link key={i.key} to={`/app/${i.key}`} className="small">{i.label}</Link>)}</div></div>)}
    </div>
  </div>;
}
