import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useIsMobile } from "@/hooks/useApi";
import { useUI } from "@/store/ui";

export const Pill = ({ tone = "", children }: { tone?: "ok" | "warn" | "err" | "info" | ""; children: ReactNode }) => <span className={`pill ${tone}`}>{children}</span>;

export function toneFor(v: string | null | undefined): "ok" | "warn" | "err" | "info" | "" {
  if (!v) return "";
  const s = v.toLowerCase();
  if (["paid", "approved", "active", "resolved", "verified", "deposited", "accepted", "admitted", "present", "p", "delivered"].includes(s)) return "ok";
  if (["cancelled", "rejected", "critical", "lost", "locked", "absent", "a", "withdrawn", "failed"].includes(s)) return "err";
  if (["requested", "submitted", "open", "draft", "high", "in progress", "acknowledged", "new", "warn"].includes(s)) return "warn";
  if (["medium", "contacted", "visited", "application", "documents", "srf paid", "info"].includes(s)) return "info";
  return "";
}

export const Kpi = ({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) => (
  <div className="card kpi"><span className="v">{value}</span><span className="l">{label}</span>{sub && <span className="small muted">{sub}</span>}</div>
);

export function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return <div className={`field ${className}`}><label>{label}</label>{children}</div>;
}

export function Modal({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => { const h = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [onClose]);
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><h2>{title}</h2><button className="btn sm" onClick={onClose} aria-label="Close">✕</button></div>
        {children}
        {footer && <div className="row" style={{ justifyContent: "flex-end" }}>{footer}</div>}
      </div>
    </div>
  );
}

export function Toasts() {
  const { toasts, dismiss } = useUI();
  return <div className="toasts" aria-live="polite">{toasts.map((t) => <div key={t.id} className={`toast ${t.kind}`} onClick={() => dismiss(t.id)}>{t.text}</div>)}</div>;
}

export interface Col<T> { key: string; label: string; num?: boolean; render?: (row: T) => ReactNode; width?: string; hideMobile?: boolean }

/** Responsive table: real <table> on desktop, stacked cards on mobile. Sortable by header click. */
export function DataTable<T extends Record<string, unknown>>({ cols, rows, onRow, empty = "Nothing to show", keyField = "id", title }:
  { cols: Col<T>[]; rows: T[]; onRow?: (r: T) => void; empty?: string; keyField?: string; title?: (r: T) => ReactNode }) {
  const mobile = useIsMobile();
  const [sort, setSort] = useState<{ k: string; d: 1 | -1 } | null>(null);
  const sorted = useMemo(() => {
    if (!sort) return rows;
    return [...rows].sort((a, b) => { const x = a[sort.k], y = b[sort.k]; if (x == null) return 1; if (y == null) return -1; return (x > y ? 1 : x < y ? -1 : 0) * sort.d; });
  }, [rows, sort]);
  const cell = (c: Col<T>, r: T) => c.render ? c.render(r) : (r[c.key] as ReactNode) ?? "—";
  if (!rows.length) return <div className="card empty">{empty}</div>;
  if (mobile) {
    return <div className="cards">{sorted.map((r, i) => (
      <div key={String(r[keyField] ?? i)} className="rowcard" onClick={() => onRow?.(r)} role={onRow ? "button" : undefined}>
        {title && <div className="title">{title(r)}</div>}
        {cols.filter((c) => !c.hideMobile).map((c) => <div className="kv" key={c.key}><b>{c.label}</b><span className={c.num ? "mono" : ""}>{cell(c, r)}</span></div>)}
      </div>))}</div>;
  }
  return (
    <div className="tbl-wrap"><table className="tbl">
      <thead><tr>{cols.map((c) => <th key={c.key} className={c.num ? "num" : ""} style={{ width: c.width }} onClick={() => setSort((s) => s?.k === c.key ? { k: c.key, d: s.d === 1 ? -1 : 1 } : { k: c.key, d: 1 })}
        aria-sort={sort?.k === c.key ? (sort.d === 1 ? "ascending" : "descending") : "none"}>{c.label}{sort?.k === c.key ? (sort.d === 1 ? " ▲" : " ▼") : ""}</th>)}</tr></thead>
      <tbody>{sorted.map((r, i) => <tr key={String(r[keyField] ?? i)} className={onRow ? "click" : ""} onClick={() => onRow?.(r)}>{cols.map((c) => <td key={c.key} className={c.num ? "num" : ""}>{cell(c, r)}</td>)}</tr>)}</tbody>
    </table></div>
  );
}

export function Tabs({ tabs, value, onChange }: { tabs: { key: string; label: string }[]; value: string; onChange: (k: string) => void }) {
  return <div className="tabs" role="tablist">{tabs.map((t) => <button key={t.key} role="tab" aria-selected={value === t.key} className={value === t.key ? "active" : ""} onClick={() => onChange(t.key)}>{t.label}</button>)}</div>;
}

/** Reason prompt used for every sensitive action (mirrors the old app's askReason). */
export function ReasonModal({ title, min = 10, onCancel, onOk, extra }: { title: string; min?: number; onCancel: () => void; onOk: (reason: string) => void; extra?: ReactNode }) {
  const [r, setR] = useState("");
  return <Modal title={title} onClose={onCancel} footer={<><button className="btn" onClick={onCancel}>Cancel</button><button className="btn primary" disabled={r.trim().length < min} onClick={() => onOk(r.trim())}>Confirm</button></>}>
    {extra}<Field label={`Reason (at least ${min} characters, recorded in the audit log)`}><textarea value={r} onChange={(e) => setR(e.target.value)} autoFocus /></Field>
  </Modal>;
}

export const Loading = () => <div className="card empty">Loading…</div>;
export const ErrorBox = ({ e }: { e: unknown }) => <div className="card" style={{ borderColor: "var(--err)" }}><b>Could not load.</b> <span className="muted">{e instanceof Error ? e.message : String(e)}</span></div>;
