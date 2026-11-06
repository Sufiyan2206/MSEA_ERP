/**
 * Bridge between the legacy module runtime (public/legacy/legacy-app.js, built from the
 * original single-file app) and the new platform: auth, storage, navigation, downloads.
 *
 * The legacy Store expects a Firestore-like `db` with doc(path).set/update/onSnapshot and
 * collection(c).add/orderBy().limit().onSnapshot. This file implements that contract on top of
 * /api/v1/legacy/* (whole-document writes, optimistic versions, 30 s change polling).
 */
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/store/auth";

type Snap = { exists: boolean; data: () => unknown };
type DocCb = (s: Snap) => void;
type QueryCb = (q: { docs: { id: string; data: () => Record<string, unknown> }[] }) => void;

interface Bootstrap { docs: Record<string, { v: unknown; version: number }>; colls: Record<string, Record<string, unknown>[]>; now: string }

const state = {
  docs: {} as Record<string, { v: unknown; version: number }>,
  colls: {} as Record<string, Record<string, unknown>[]>,
  docCbs: {} as Record<string, DocCb[]>,
  collCbs: {} as Record<string, QueryCb[]>,
  since: "", poll: 0 as unknown as ReturnType<typeof setInterval> | 0, loaded: false,
  legacyUserId: null as string | null, platformRole: "", initial: "myday",
};

async function load() {
  let r: { data: Bootstrap };
  try { r = await api.get<{ data: Bootstrap }>("/legacy/bootstrap"); }
  catch (e) {
    if (e instanceof ApiError && e.status === 404) throw new Error("The API server is an older version without the module runtime (/api/v1/legacy). Restart the backend from this package: cd backend && alembic upgrade head && flask --app wsgi run --port 8000");
    if (e instanceof ApiError && e.status === 403) throw new Error("Your role has no 'legacy' View permission. Re-run `python -m scripts.seed --no-demo` (adds it to all staff roles) or grant it under Users & roles.");
    if (e instanceof ApiError && e.status === 500) throw new Error("The database has no module-runtime tables yet: run `alembic upgrade head` in backend/ and restart the API (" + e.message + ").");
    throw e;
  }
  state.docs = r.data.docs; state.colls = r.data.colls; state.since = r.data.now; state.loaded = true;
}

function emitDoc(k: string) { (state.docCbs[k] ?? []).forEach((cb) => cb({ exists: k in state.docs, data: () => state.docs[k] })); }
function emitColl(c: string) {
  const rows = (state.colls[c] ?? []).slice().sort((a, b) => String(b.ts ?? "").localeCompare(String(a.ts ?? "")));
  (state.collCbs[c] ?? []).forEach((cb) => cb({ docs: rows.map((d) => ({ id: String(d.id), data: () => { const { id: _i, ...rest } = d; void _i; return rest; } })) }));
}

async function pollChanges() {
  if (!state.loaded || !useAuth.getState().token) return;
  try {
    const r = await api.get<{ data: Bootstrap }>(`/legacy/changes?since=${encodeURIComponent(state.since)}`);
    state.since = r.data.now;
    for (const [k, v] of Object.entries(r.data.docs)) { if (!state.docs[k] || state.docs[k].version !== v.version) { state.docs[k] = v; emitDoc(k); } }
    for (const [c, rows] of Object.entries(r.data.colls)) {
      const cur = state.colls[c] ?? []; let changed = false;
      for (const row of rows) { const i = cur.findIndex((x) => x.id === row.id); if (i >= 0) cur[i] = row; else cur.unshift(row); changed = true; }
      state.colls[c] = cur; if (changed) emitColl(c);
    }
  } catch { /* offline: keep working on the local copy */ }
}

const chains: Record<string, Promise<void>> = {}; const latest: Record<string, unknown> = {};

/** Firestore-like shim consumed by the legacy Store. */
const dbShim = {
  doc(path: string) {
    const [root, id] = path.split("/");
    if (root === "app") {
      const k = id;
      return {
        onSnapshot(cb: DocCb) { (state.docCbs[k] ??= []).push(cb); cb({ exists: k in state.docs, data: () => state.docs[k] }); },
        set(obj: { v: unknown }) {
          // Writes to one document are serialised and coalesced: the legacy app often calls
          // Store.put several times in a row (seed/migrate helpers); only the latest value is sent,
          // always with the freshest server version, so our own writes never conflict.
          latest[k] = obj.v;
          const run = async () => {
            if (!(k in latest)) return;
            const v = latest[k]; delete latest[k];
            try {
              const r = await api.put<{ data: { version: number } }>(`/legacy/docs/${k}`, { v, version: state.docs[k]?.version });
              state.docs[k] = { v, version: r.data.version };
            } catch (e) {
              if (e instanceof ApiError && e.status === 409) { const d = e.details as { version: number; v: unknown }; state.docs[k] = { v: d.v, version: d.version }; emitDoc(k); throw { code: "conflict", message: e.message }; }
              throw { code: e instanceof ApiError ? e.code : "network", message: String(e) };
            }
          };
          chains[k] = (chains[k] ?? Promise.resolve()).then(run, run);
          return chains[k];
        },
        async update(p: Record<string, unknown>) { await api.patch(`/legacy/colls/${root}/${id}`, p); },
      };
    }
    // collection record: "<coll>/<id>"
    return {
      async update(p: Record<string, unknown>) { await api.patch(`/legacy/colls/${root}/${id}`, p); const row = (state.colls[root] ?? []).find((x) => x.id === id); if (row) Object.assign(row, p); },
      async set(obj: Record<string, unknown>) { await api.put(`/legacy/colls/${root}/${id}`, obj); const cur = state.colls[root] ??= []; const i = cur.findIndex((x) => x.id === id); const row = { ...obj, id }; if (i >= 0) cur[i] = row; else cur.unshift(row); },
      onSnapshot() { /* not used by the legacy app for single records */ },
    };
  },
  collection(c: string) {
    const q = {
      orderBy: () => q, limit: () => q,
      onSnapshot(cb: QueryCb) { (state.collCbs[c] ??= []).push(cb); emitColl(c); },
      async add(obj: Record<string, unknown>) { const r = await api.post<{ data: { id: string } }>(`/legacy/colls/${c}`, obj); (state.colls[c] ??= []).unshift({ ...obj, id: r.data.id }); emitColl(c); },
    };
    return q;
  },
};

function saveBlob(filename: string, data: Blob | string) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: filename.endsWith(".csv") ? "text/csv" : "application/octet-stream" });
  const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export interface Bridge {
  use(cap: string): Promise<unknown>; root(): HTMLElement; navigate(page: string): void; initialPage(): string;
  legacyUserId(): string | null; platformRole(): string; canSwitchUser(): boolean;
}
declare global { interface Window { MSEA_BRIDGE?: Bridge; MSEA_LEGACY?: LegacyApi } }
export interface LegacyApi { go(p: string): void; render(): void; rerender(): void; PAGES: Record<string, { title: string; mod: string }>; NAV: [string, [string, string][]][]; App: { route: string; user: { id: string; name: string; role: string } }; pageOk(k: string): boolean; pickUser(): void; toast(t: string, k?: string): void }

let scriptsPromise: Promise<void> | null = null;
function loadScript(src: string) { return new Promise<void>((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = () => res(); s.onerror = () => rej(new Error("failed " + src)); document.head.appendChild(s); }); }

/** Installs the bridge, loads data, vendor libs and the legacy bundle (once per page lifetime). */
export async function ensureLegacy(initialPage: string, rootEl: HTMLElement): Promise<LegacyApi> {
  const me = useAuth.getState().me!;
  state.initial = initialPage; state.platformRole = me.role;
  if (!state.loaded) {
    const [, link] = await Promise.all([load(), api.get<{ data: { legacy_user_id: string | null } }>("/legacy/me")]);
    state.legacyUserId = link.data.legacy_user_id;
    if (!state.poll) state.poll = setInterval(pollChanges, 30_000);
  }
  let root = rootEl;
  window.MSEA_BRIDGE = {
    use: async (cap) => cap === "db" ? dbShim : cap === "user" ? { can: async () => useAuth.getState().can("legacy", "Add") } : cap === "downloads" ? { save: async ({ filename, data }: { filename: string; data: Blob | string }) => saveBlob(filename, data) } : null,
    root: () => root, navigate: (p) => { try { history.replaceState(null, "", "/app/" + p); } catch { /* ignore */ } }, initialPage: () => state.initial,
    legacyUserId: () => state.legacyUserId, platformRole: () => state.platformRole, canSwitchUser: () => state.platformRole === "Super Admin",
  };
  (window as unknown as { __setLegacyRoot: (e: HTMLElement) => void }).__setLegacyRoot = (e) => { root = e; };
  if (!window.MSEA_LEGACY) {
    if (!scriptsPromise) {
      scriptsPromise = (async () => {
        if (!document.getElementById("lg-css")) { const l = document.createElement("link"); l.id = "lg-css"; l.rel = "stylesheet"; l.href = "/legacy/legacy.css"; document.head.appendChild(l); }
        for (const v of ["chart.umd.js", "xlsx.full.min.js", "jspdf.umd.min.js", "jspdf.plugin.autotable.min.js", "qrcode.js"]) await loadScript("/legacy/vendor/" + v);
        await loadScript("/legacy/legacy-app.js");
      })();
    }
    await scriptsPromise;
  }
  return window.MSEA_LEGACY!;
}
export function setLegacyRoot(e: HTMLElement) { (window as unknown as { __setLegacyRoot?: (e: HTMLElement) => void }).__setLegacyRoot?.(e); }
export function legacyLoaded() { return !!window.MSEA_LEGACY; }
