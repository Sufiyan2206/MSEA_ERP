import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { ensureLegacy, setLegacyRoot } from "@/legacy/bridge";
import { Loading } from "@/components/ui";

/** Hosts the legacy module runtime (all 192 original screens) inside the new shell.
 *  Route: /app/:page — the legacy sidebar, filters and view render inside this element; the
 *  legacy DOM skeleton below is the same one the original index.html had, minus the global bar. */
export default function LegacyHost() {
  const { page = "myday" } = useParams(); const root = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false); const [err, setErr] = useState<unknown>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const lg = await ensureLegacy(page, root.current!);
        if (!alive) return;
        setLegacyRoot(root.current!);
        if (lg.App.route !== page && lg.PAGES[page]) lg.go(page); else lg.render();
        setReady(true);
      } catch (e) { setErr(e); }
    })();
    return () => { alive = false; };
  }, [page]);
  return <div className="lg" ref={root} data-ready={ready ? "1" : "0"}>
    {err ? <div className="card" style={{ margin: "1rem", borderColor: "var(--err)" }}><b>Module runtime could not start.</b><pre style={{ marginTop: ".4rem", whiteSpace: "pre-wrap", fontSize: ".85rem" }}>{err instanceof Error ? err.message : String(err)}</pre><div className="small muted" style={{ marginTop: ".4rem" }}>See docs/DEVELOPER-GUIDE.md § legacy runtime.</div></div> : null}
    {!ready && !err && <Loading />}
    <div className="lgbar"><button className="gbtn menu-btn2" data-act="toggleNav" aria-label="Open module menu">☰ Modules</button><div className="gsearch"><input id="gsearch" type="search" list="gsl" placeholder="Search screens and modules…" aria-label="Search screens" autoComplete="off" /><datalist id="gsl" /></div><div id="sync" className="syncchip" /><div id="who" /></div>
    <div className="app">
      <aside className="side" aria-label="Module navigation"><nav id="nav" /><div className="mode" id="mode" /></aside>
      <div className="main">
        <header className="top"><div><button className="btn sm ftoggle" id="ftoggle" data-act="toggleFilters" aria-controls="filters">Filters</button><h1 id="title">Loading…</h1><div className="scope" id="scope" /></div></header>
        <div className="filters" id="filters" role="search" aria-label="Report filters" />
        <main id="view"><div className="empty">Loading module…</div></main>
      </div>
    </div>
    <div id="modal" hidden /><div id="toast" className="toast" role="status" aria-live="polite" />
  </div>;
}
