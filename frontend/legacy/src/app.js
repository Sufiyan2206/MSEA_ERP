/* ===== App core: calculations, access scope, layout, shared components, exports ===== */
const E = Engine;
SRC.today = '2026-10-19';
const BUILD_HOLIDAYS = ['2026-08-15', '2026-08-26', '2026-10-02', '2026-10-20', '2026-11-08', '2026-12-25'];
const DIR0 = defaultDirectory(SRC);
Store.init({ config: defaultConfig(), users: DIR0.users, roles: defaultRoles(), mappings: DIR0.maps, branchmap: DIR0.bmap, emaildist: defaultEmail(), templates: defaultTemplates(), sync: defaultSync(), resolved: {}, adjustments: { list: [] } });
const DATA = E.build(Object.assign({}, SRC, { holidays: BUILD_HOLIDAYS }));
const TODAY = E.dn(SRC.today), AYS = E.dn('2026-04-01'), REPORT_DAY = E.dn(SRC.source.asOn);
const ACCESS_DATE = (() => { try { return new Date().toISOString().slice(0, 10); } catch (e) { return SRC.today; } })();

let A = null, allocKey = '', allocVer = 0;
function ensureAlloc() {
  const cfg = Store.get('config'), adj = Store.get('adjustments');
  const key = JSON.stringify(cfg.schedule) + JSON.stringify(adj.list);
  if (key === allocKey) return;
  allocKey = key; allocVer++;
  A = E.allocate(DATA, { schedule: cfg.schedule, adjustments: adj.list });
  MEMO.clear();
}
const MEMO = new Map();
const memo = (k, f) => { k = allocVer + '|' + k; if (MEMO.has(k)) return MEMO.get(k); const v = f(); MEMO.set(k, v); return v; };

/* ---------- formatting ---------- */
const fmt0 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const fmt2 = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const INR = x => (x < 0 ? '-₹' : '₹') + fmt0.format(Math.abs(Math.round(x || 0)));
const INRS = x => { const a = Math.abs(x || 0), s = x < 0 ? '-₹' : '₹'; return a >= 1e7 ? s + fmt2.format(a / 1e7) + ' Cr' : a >= 1e5 ? s + fmt2.format(a / 1e5) + ' L' : s + fmt0.format(Math.round(a)); };
const NUM = x => fmt0.format(Math.round(x || 0));
const PCT = (x, d = 1) => (isFinite(x) ? x.toFixed(d) : '0.0') + '%';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dLabel = d => { const s = E.ds(d); return `${+s.slice(8)} ${MON[+s.slice(5, 7) - 1]} ${s.slice(0, 4)}`; };
const isoLabel = s => s ? `${+s.slice(8, 10)} ${MON[+s.slice(5, 7) - 1]} ${s.slice(0, 4)}` : '—';
const tsLabel = s => { if (!s) return '—'; const t = new Date(s); if (isNaN(t)) return s; const ist = new Date(t.getTime() + 330 * 60000).toISOString(); return `${isoLabel(ist.slice(0, 10))}, ${ist.slice(11, 16)} IST`; };
const monthStart = D => E.dn(E.ds(D).slice(0, 8) + '01');
const monthEnd = D => { const s = E.ds(D); const y = +s.slice(0, 4), m = +s.slice(5, 7); return E.dn(new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10)); };
const ymOf = D => E.ds(D).slice(0, 7);

/* ---------- academic years ---------- */
const yearsList = () => (Store.get('config').years || []).slice().sort((a, b) => a.code.localeCompare(b.code));
const yearOf = code => yearsList().find(y => y.code === code) || null;
const yearCodes = () => yearsList().map(y => y.code);
const isCurYear = () => App.f.ay === CUR_AY;
const schedFor = ay => { const c = Store.get('config'); return ay === CUR_AY ? c.schedule : (c.yearSchedules || {})[ay] || []; };
const nextYearCode = () => { const last = yearCodes().at(-1) || '2026-27'; const y = +last.slice(0, 4) + 1; return `${y}-${String(y + 1).slice(2)}`; };
function yearNotice(what) {
  const y = yearOf(App.f.ay);
  return `<div class="noaccess"><h2>AY ${esc(App.f.ay)} · ${esc(y ? y.status.toLowerCase() : 'unknown')} year</h2><p>${what || 'ERP student, fee and collection data is synced for AY ' + CUR_AY + ' only.'} ${y && y.status === 'Upcoming' ? 'Target planning, capacity setup and the instalment schedule can already be prepared for this year.' : 'Use Multi-year comparison for earlier years, or Data import to load their history.'}</p><div class="btnrow"><button class="btn" data-act="setYear" data-v="${CUR_AY}">Back to AY ${CUR_AY}</button>${y && y.status === 'Upcoming' ? `<button class="btn primary" data-act="go" data-r="targets">Target planning</button><button class="btn" data-act="go" data-r="capacity">Capacity setup</button><button class="btn" data-act="go" data-r="settings">Instalment schedule</button>` : `<button class="btn primary" data-act="go" data-r="compare">Multi-year comparison</button>`}</div></div>`;
}

/* ---------- calendar ---------- */
function isWork(d) { const c = Store.get('config'); return !(c.weekOff || [0]).includes(E.dow(d)) && !(c.holidays || []).includes(E.ds(d)); }
function workDays(a, b) { let n = 0; for (let d = a; d <= b; d++) if (isWork(d)) n++; return n; }
function prevWork(D) { let d = D - 1; while (d > 0 && !isWork(d)) d--; return d; }

/* ---------- people, mapping, scope ---------- */
const users = () => Store.get('users').filter(u => u.role !== 'Branch Director' && u.status !== 'Deleted'); // the Branch Director level was removed; legacy accounts are hidden
const userById = id => users().find(u => u.id === id);
const activeOn = (m, iso) => (m.status || 'Active') === 'Active' && (!m.from || m.from <= iso) && (!m.to || m.to >= iso);
/* Reporting line is Principal → Zonal Director → Regional Director; the Zonal Director is the branch's director */
function directorOf(bid, iso) { const b = DATA.branches.find(x => x.id === bid); return b ? headOf('zd', b, iso) : null; }
function headOf(kind, b, iso = ACCESS_DATE) {
  const type = kind === 'rd' ? 'All Branches Under Region' : 'All Branches Under Zone', role = kind === 'rd' ? 'Regional Director' : 'Zonal Director';
  const m = Store.get('mappings').find(m => m.type === type && (kind === 'rd' ? m.region === b.region : m.zone === b.zone) && activeOn(m, iso) && (userById(m.user) || {}).role === role);
  return m ? userById(m.user) : null;
}
const pName = u => u ? u.name.replace(' (demo)', '') : 'Vacant';
const rdName = b => pName(headOf('rd', b)), zdName = b => pName(headOf('zd', b));
const regionLabel = b => `${b.region} · ${rdName(b)}`, zoneLabel = b => `${b.zone} · ${zdName(b)}`;
function scopeOf(u, iso = ACCESS_DATE) {
  const set = new Set();
  if (!u || u.status !== 'Active') return set;
  const role = Store.get('roles')[u.role]; if (role && role.active === false) return set;
  Store.get('mappings').filter(m => m.user === u.id && activeOn(m, iso)).forEach(m => {
    DATA.branches.forEach((b, i) => {
      if (m.type === 'All Branches') set.add(i);
      else if (m.type === 'All Branches Under Region' && b.region === m.region) set.add(i);
      else if (m.type === 'All Branches Under Zone' && b.zone === m.zone) set.add(i);
      else if (m.type === 'All Branches Under State' && (b.state || b.region) === m.state) set.add(i);
      else if (m.type === 'All Branches Under Entity' && (typeof fnEntityOf === 'function' ? fnEntityOf(b.id) : 'MSEWT') === m.entity) set.add(i);
      else if ((m.type === 'Own Branch Only') && (b.id === u.branch || (m.branches || []).includes(b.id))) set.add(i);
      else if (m.type === 'Selected Branches' && (m.branches || []).includes(b.id)) set.add(i);
    });
  });
  if (u.role === 'Super Admin') DATA.branches.forEach((b, i) => set.add(i));
  // acting / backup access and temporary grants add branches; data access rules can restrict school types
  const af = actingFor(u); if (af && af.id !== u.id) scopeOf(af, iso).forEach(i => set.add(i));
  activeGrants(u).forEach(g => (g.branches || []).forEach(bid => { const i = DATA.branches.findIndex(b => b.id === bid); if (i >= 0) set.add(i); }));
  const rule = dataRuleFor(u); if (rule && rule.types && rule.types.length) [...set].forEach(i => { if (!rule.types.includes(DATA.branches[i].type)) set.delete(i); });
  if (rule && rule.branches && rule.branches.length) [...set].forEach(i => { if (!rule.branches.includes(DATA.branches[i].id)) set.delete(i); });
  return set;
}
/* data access rule in force for a user: user-level rule wins over role-level */
function dataRuleFor(u) { if (!u) return null; const L = (Store.get('datarules') || { list: [] }).list.filter(r => r.active !== false); return L.find(r => r.scope === 'user' && r.target === u.id) || L.find(r => r.scope === 'role' && r.target === u.role) || null; }
/* ---------- access control core: role matrix + extra roles + acting access + temporary grants + module control + workflow approvers ---------- */
const VIEW_ACTS = new Set(['View', 'View student-level details', 'View branch-level details', 'View group consolidated data', 'View audit logs', 'Export Excel', 'Export PDF', 'Download CSV', 'Print', 'View Sensitive Data', 'View All Branches', 'View Only Assigned Branches']);
const SA_TODAY = () => ACCESS_DATE;
function rolePerm(role, mod, act) { const r = Store.get('roles')[role]; return !!(r && r.active !== false && (r.perms[mod] || []).includes(act)); }
function userRoles(u) { return u ? [u.role, ...(u.roles2 || [])].filter(Boolean) : []; }
function actingFor(u) { const A = u && u.acting; if (!A || !A.user) return null; const d = SA_TODAY(); if ((A.from && A.from > d) || (A.to && A.to < d)) return null; return userById(A.user); }
function activeGrants(u) { if (!u) return []; const d = SA_TODAY(); return (Store.get('grants') || { list: [] }).list.filter(g => g.user === u.id && g.status === 'Active' && g.from <= d && (!g.to || g.to >= d)); }
function moduleEntry(mod) { return (Store.get('modules') || { list: [] }).list.find(m => (m.mods || []).includes(mod)) || null; }
function moduleBlock(mod, u) {
  const m = moduleEntry(mod); if (!m || !u || u.role === 'Super Admin') return null;
  if (m.status === 'Inactive') return 'This module is switched off by the Super Admin.';
  if (m.status === 'Under Maintenance') return 'This module is under maintenance. Please try again later.';
  if (m.status === 'Available for Selected Roles' && !userRoles(u).some(r => (m.roles || []).includes(r))) return 'This module is available to selected roles only.';
  if (m.status === 'Available for Selected Branches') { const sc = [...scopeOf(u)].map(i => DATA.branches[i].id); if (!sc.some(b => (m.branches || []).includes(b))) return 'This module is available for selected branches only.'; }
  return null;
}
const WF_MOD = { capacity: 'Capacity change', targets: 'Target plan', cancel: 'Student cancellation and admission reversal', approvals: 'Fee concession and refund', exits: 'Student cancellation and admission reversal' };
function wfApproverOk(mod, u) { const name = WF_MOD[mod]; if (!name) return true; const w = (Store.get('workflows') || { list: [] }).list.find(x => x.name === name); if (!w || !w.levels || !w.levels.length) return true; const roles = w.levels.flatMap(l => l.roles || []); const af = actingFor(u); return !roles.length || userRoles(u).some(r => roles.includes(r)) || (af && userRoles(af).some(r => roles.includes(r))) || u.role === 'Super Admin'; }
function can(mod, act = 'View') {
  const u = App.user; if (!u || u.status !== 'Active') return false;
  if (moduleBlock(mod, u)) return false;
  if (u.role === 'Super Admin') return true;
  const m = moduleEntry(mod); if (m && m.status === 'Read Only' && !VIEW_ACTS.has(act)) return false;
  if ((act === 'Approve' || act === 'Reject') && !wfApproverOk(mod, u)) return false;
  if (userRoles(u).some(r => rolePerm(r, mod, act))) return true;
  const af = actingFor(u); if (af && userRoles(af).some(r => rolePerm(r, mod, act))) return true;
  return activeGrants(u).some(g => g.mod === mod && (g.acts || []).includes(act));
}
function canSensitive(cat) { const u = App.user; if (!u) return false; if (u.role === 'Super Admin') return true; return userRoles(u).some(r => { const x = Store.get('roles')[r]; return x && (x.sensitive || []).includes(cat); }); }

/* ---------- app state ---------- */
const App = { user: null, route: 'exec', f: { ay: '2026-27', date: SRC.today, region: '', zone: '', director: '', rd: '', zd: '', branch: '', type: '', group: 'branch', cls: '', sec: '', stCat: '', feeCat: '', source: '', couns: '', from: '2026-01-01' }, sort: {}, ui: {}, tables: {}, charts: [], mounts: [], seen: new Set() };
const D_ = () => E.dn(App.f.date);
function scopeIdx() {
  const sc = scopeOf(App.user); const f = App.f; const iso = App.f.date;
  return DATA.branches.map((b, i) => i).filter(i => {
    const b = DATA.branches[i];
    if (!sc.has(i)) return false;
    if (b.closed && !f.showClosed) return false;
    if (f.region && b.region !== f.region) return false;
    if (f.zone && b.zone !== f.zone) return false;
    if (f.type && b.type !== f.type) return false;
    if (f.entity && (typeof fnEntityOf === 'function' ? fnEntityOf(b.id) : 'MSEWT') !== f.entity) return false;
    if (f.branch && b.id !== f.branch) return false;
    if (f.rd) { const d = headOf('rd', b); if (!d || d.id !== f.rd) return false; }
    if (f.zd) { const d = headOf('zd', b); if (!d || d.id !== f.zd) return false; }
    return true;
  });
}
function scopeLabel() {
  const f = App.f, idx = scopeIdx();
  if (f.branch) return DATA.branches.find(b => b.id === f.branch).name;
  if (f.zd) return zoneLabel(DATA.branches.find(b => (headOf('zd', b) || {}).id === f.zd));
  if (f.rd) return regionLabel(DATA.branches.find(b => (headOf('rd', b) || {}).id === f.rd));
  const parts = [f.region, f.zone, f.type].filter(Boolean);
  const all = scopeOf(App.user).size === DATA.branches.length;
  return (parts.length ? parts.join(' · ') : all ? 'Group consolidated' : 'Your branches') + ` · ${idx.length} branch${idx.length === 1 ? '' : 'es'}`;
}

/* ---------- calculations ---------- */
const Calc = {
  agg(D) {
    return memo('agg' + D, () => {
      const K = A.K, S = E.studentsAt(DATA, A, D);
      const rows = DATA.branches.map(b => ({ b, n: 0, due: 0, paid: 0, os: 0, od: 0, adv: 0, zpN: 0, zpAmt: 0, ptN: 0, ptAmt: 0, fullN: 0, defN: 0, ag: [0, 0, 0, 0, 0], pyDue: 0, pyBal: 0, curDue: 0, curBal: 0, annual: 0, gross: 0, newN: 0, inst: Array.from({ length: K }, () => ({ due: 0, paid: 0, bal: 0 })), cls: {} }));
      S.forEach(x => {
        if (!x) return; const r = rows[x.s.b];
        if (x.exited) { r.due += x.due; r.paid += x.paid; r.annual += x.s.annual; r.gross += x.s.gross; return; }
        r.n++; r.due += x.due; r.paid += x.paid; r.os += x.os; r.od += x.od; r.adv += x.adv; r.pyDue += x.pyDue; r.pyBal += x.pyBal; r.curDue += x.curDue; r.curBal += x.curBal;
        r.annual += x.s.annual; r.gross += x.s.gross;
        if (x.status === 'Zero payer') { r.zpN++; r.zpAmt += x.os; } else if (x.status === 'Partial') { r.ptN++; r.ptAmt += x.os; } else if (x.status === 'Fully paid') r.fullN++;
        if (x.od > 0.5) r.defN++;
        for (let i = 0; i < 5; i++) r.ag[i] += x.ag[i];
        for (const k in x.inst) { const t = r.inst[k]; if (t) { t.due += x.inst[k].due; t.paid += Math.min(x.inst[k].paid, x.inst[k].due || x.inst[k].paid); t.bal += x.inst[k].bal; } }
        const ck = x.s.cls + '|' + x.s.sec; const c = r.cls[ck] || (r.cls[ck] = { cls: x.s.cls, sec: x.s.sec, n: 0, due: 0, paid: 0, os: 0, od: 0, zpN: 0, zpAmt: 0, ptN: 0 });
        c.n++; c.due += x.due; c.paid += x.paid; c.os += x.os; c.od += x.od; if (x.status === 'Zero payer') { c.zpN++; c.zpAmt += x.os; } if (x.status === 'Partial') c.ptN++;
      });
      return rows;
    });
  },
  monthSplit(F, D) {
    return memo('ms' + F + '_' + D, () => {
      const out = DATA.branches.map(() => ({ open: 0, fresh: 0, adv: 0 }));
      DATA.students.forEach(s => { for (const c of s._ch) { if (c.d > D) break; if (c.d < F || c.adj) continue; const o = out[s.b]; if (c.due > c.d) o.adv += c.a; else if (c.due <= F) o.open += c.a; else o.fresh += c.a; } });
      return out;
    });
  },
  newAdm(F, D) { return memo('na' + F + '_' + D, () => { const o = DATA.branches.map(() => ({ n: 0, fee: 0 })); DATA.students.forEach(s => { if (s.join >= F && s.join <= D) { o[s.b].n++; o[s.b].fee += s.annual; } }); return o; }); },
  month(bi, D) {
    return memo('m' + bi + '_' + D, () => {
      const cfg = Store.get('config'), b = DATA.branches[bi];
      const F = monthStart(D), L = monthEnd(D), ym = ymOf(D);
      const open = E.openingOS(A, bi, F);
      const pct = cfg.branchPct[b.id] != null ? +cfg.branchPct[b.id] : +cfg.targetPct;
      const fz = cfg.frozen[ym];
      const target = fz && fz.t && fz.t[b.id] != null ? fz.t[b.id] : open * pct / 100;
      const sp = Calc.monthSplit(F, D)[bi];
      const col = sp.open + sp.fresh + sp.adv;
      const achieved = sp.open + (cfg.freshCounts ? sp.fresh : 0) + (cfg.advanceCounts ? sp.adv : 0);
      const totalWD = workDays(F, L), elapsedWD = workDays(F, D), remWD = workDays(D + 1, L);
      const remaining = Math.max(0, target - achieved);
      const pace = totalWD ? elapsedWD / totalWD * 100 : 100;
      const achPct = target > 0 ? achieved / target * 100 : 100;
      const projected = elapsedWD ? achieved / elapsedWD * totalWD : achieved;
      const na = Calc.newAdm(F, D)[bi];
      return { open, pct, target, frozen: !!fz, col, adv: sp.adv, colOpen: sp.open, colFresh: sp.fresh, achieved, achPct, diff: achieved - target, remaining, totalWD, elapsedWD, remWD, dailyReq: remWD ? remaining / remWD : remaining, pace, projected, projPct: target > 0 ? projected / target * 100 : 100, fresh: E.freshDues(A, bi, F, D), newN: na.n, newFee: na.fee };
    });
  },
  day(bi, D) {
    return memo('d' + bi + '_' + D, () => {
      const modes = E.MODES.map((m, i) => A.modeDay[bi][i][Math.min(E.ND - 1, D)]);
      const gross = modes.reduce((a, x) => a + x, 0);
      const ref = A.refDay[bi][D] || 0, rev = A.revDay[bi][D] || 0;
      const net = A.colDay[bi][D] || 0, adv = A.advDay[bi][D] || 0;
      const F = monthStart(D);
      return { modes, gross, ref, rev, net, adv, cnt: A.cntDay[bi][D] || 0, open: E.openingOS(A, bi, D), mtd: E.sumRange(A.colCum[bi], F, D), ytd: E.sumRange(A.colCum[bi], AYS, D) };
    });
  },
  sum(rows, keys) { const t = {}; keys.forEach(k => t[k] = rows.reduce((a, r) => a + (+r[k] || 0), 0)); return t; },
  rag(kind, v, extra) {
    const g = Store.get('config').rag;
    if (kind === 'ach') { const r = extra > 0 ? v / extra * 100 : 100; return r >= g.achGreen ? 'g' : r >= g.achAmber ? 'a' : 'r'; }
    if (kind === 'os') return v <= g.osGreen ? 'g' : v <= g.osAmber ? 'a' : 'r';
    if (kind === 'zp') return extra ? 'r' : v <= g.zpGreen ? 'g' : v <= g.zpAmber ? 'a' : 'r';
  },
  zpLimit(b) { const c = Store.get('config'); return c.zpLimit[b.id] != null ? +c.zpLimit[b.id] : +c.zpLimitDefault; }
};

/* Combined per-branch report row for a date (used by most screens) */
function branchRows(D, idx = scopeIdx()) {
  const ag = Calc.agg(D), iso = E.ds(D);
  return idx.map(i => {
    const a = ag[i], m = Calc.month(i, D), dy = Calc.day(i, D), b = a.b;
    return Object.assign({}, a, { i, id: b.id, name: b.name, region: b.region, zone: b.zone, type: b.type, director: zdName(b), rdName: rdName(b), zdName: zdName(b) },
      { mOpen: m.open, mPct: m.pct, mTarget: m.target, mAch: m.achieved, mAchPct: m.achPct, mDiff: m.diff, mRem: m.remaining, mDaily: m.dailyReq, mRemWD: m.remWD, mPace: m.pace, mAdv: m.adv, mColOpen: m.colOpen, mColFresh: m.colFresh, mFresh: m.fresh, mNewN: m.newN, mProj: m.projPct, mFrozen: m.frozen },
      { tNet: dy.net, tGross: dy.gross, tAdv: dy.adv, tRef: dy.ref, tRev: dy.rev, tCnt: dy.cnt, tOpen: dy.open, mtd: dy.mtd, ytd: dy.ytd, modes: dy.modes, cash: dy.modes[0], online: dy.modes[1] + dy.modes[2] + dy.modes[3], cheque: dy.modes[4] },
      { duePct: a.due > 0 ? a.os / a.due * 100 : 0, colPct: a.due > 0 ? a.paid / a.due * 100 : 0, zpOver: a.zpAmt > Calc.zpLimit(b) });
  });
}
const SUMK = ['n', 'due', 'paid', 'os', 'od', 'adv', 'zpN', 'zpAmt', 'ptN', 'ptAmt', 'fullN', 'defN', 'pyDue', 'pyBal', 'curDue', 'curBal', 'annual', 'gross', 'mOpen', 'mTarget', 'mAch', 'mDiff', 'mRem', 'mDaily', 'mAdv', 'mColOpen', 'mColFresh', 'mFresh', 'mNewN', 'tNet', 'tGross', 'tAdv', 'tRef', 'tRev', 'tCnt', 'tOpen', 'mtd', 'ytd', 'cash', 'online', 'cheque'];
function rollup(rows, by) {
  const keyOf = { branch: r => r.id, director: r => `${r.zdName} · ${r.zone}`, region: r => `${r.region} · ${r.rdName}`, zone: r => `${r.zone} · ${r.zdName}`, rd: r => `${r.rdName} · ${r.region}`, zd: r => `${r.zdName} · ${r.zone}`, type: r => r.type, group: () => 'Group consolidated' }[by] || (r => r.id);
  if (by === 'branch') return rows;
  const g = new Map();
  rows.forEach(r => { const k = keyOf(r); if (!g.has(k)) g.set(k, []); g.get(k).push(r); });
  return [...g.entries()].map(([k, rs]) => finishTotals(rs, k));
}
function finishTotals(rs, label) {
  const t = Calc.sum(rs, SUMK);
  t.name = label; t.id = label; t.count = rs.length; t.region = rs[0] ? rs[0].region : ''; t.zone = rs[0] ? rs[0].zone : ''; t.director = rs.length === 1 ? rs[0].director : ''; t.rdName = rs.length && rs.every(r => r.rdName === rs[0].rdName) ? rs[0].rdName : ''; t.zdName = rs.length && rs.every(r => r.zdName === rs[0].zdName) ? rs[0].zdName : '';
  t.inst = (rs[0] ? rs[0].inst : []).map((_, k) => ({ due: rs.reduce((a, r) => a + r.inst[k].due, 0), paid: rs.reduce((a, r) => a + r.inst[k].paid, 0), bal: rs.reduce((a, r) => a + r.inst[k].bal, 0) }));
  t.ag = [0, 1, 2, 3, 4].map(i => rs.reduce((a, r) => a + r.ag[i], 0));
  t.modes = E.MODES.map((_, i) => rs.reduce((a, r) => a + r.modes[i], 0));
  t.duePct = t.due > 0 ? t.os / t.due * 100 : 0; t.colPct = t.due > 0 ? t.paid / t.due * 100 : 0;
  t.mAchPct = t.mTarget > 0 ? t.mAch / t.mTarget * 100 : 100; t.mPct = t.mOpen > 0 ? t.mTarget / t.mOpen * 100 : 0;
  t.mRemWD = rs[0] ? rs[0].mRemWD : 0; t.mPace = rs[0] ? rs[0].mPace : 0; t.mDaily = t.mRemWD ? t.mRem / t.mRemWD : t.mRem;
  t.zpOver = rs.some(r => r.zpOver); t.mProj = rs.length ? rs.reduce((a, r) => a + r.mProj * r.mTarget, 0) / Math.max(1, t.mTarget) : 0;
  t.isTotal = true;
  return t;
}

/* ---------- audit ---------- */
function audit(module, action, o = {}) {
  const u = App.user || {};
  const ua = (navigator.userAgent || '').replace(/^Mozilla\/5\.0 /, '').slice(0, 80);
  return Store.add('audit', { user: u.name || '—', userId: u.id || '', role: u.role || '', ip: u.id ? '10.0.' + (4 + (parseInt(String(u.id).slice(1), 10) || 0) % 6) + '.' + (20 + (parseInt(String(u.id).slice(1), 10) || 0) % 200) : '—', branch: u.branch ? brName(u.branch) : (App.f && App.f.branch ? brName(App.f.branch) : 'All'), module, action, old: o.old != null ? String(o.old).slice(0, 500) : '', new: o.new != null ? String(o.new).slice(0, 500) : '', reason: o.reason || '', device: ua, approval: o.approval || '—', approver: o.approver || '' });
}

/* ---------- UI helpers ---------- */
const $ = s => document.querySelector(s);
function toast(msg, kind = '') { const t = $('#toast'); t.textContent = msg; t.className = 'toast show ' + kind; clearTimeout(toast._t); toast._t = setTimeout(() => t.className = 'toast', 3600); }
function modal(title, body, actions = '', wide = false) {
  $('#modal').innerHTML = `<div class="scrim" data-act="closeModal"></div><div class="dlg${wide ? ' wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="dlg-h"><h3>${esc(title)}</h3><button class="icon-btn" data-act="closeModal" aria-label="Close">✕</button></div><div class="dlg-b">${body}</div>${actions ? `<div class="dlg-f">${actions}</div>` : ''}</div>`;
  $('#modal').hidden = false; const f = $('#modal .dlg input, #modal .dlg select, #modal .dlg textarea'); if (f) f.focus();
}
function closeModal() { $('#modal').hidden = true; $('#modal').innerHTML = ''; if (typeof rerender === 'function') rerender(); }
function chip(r, label) { const L = label || { g: 'On track', a: 'Watch', r: 'At risk' }[r]; const ic = { g: '●', a: '▲', r: '■' }[r]; return `<span class="rag ${r}"><i aria-hidden="true">${ic}</i>${esc(L)}</span>`; }
function pill(text, kind = '') { return `<span class="pill ${kind}">${esc(text)}</span>`; }
function bar(p, kind = '') { const w = Math.max(0, Math.min(100, p)); return `<span class="mbar ${kind}"><span style="width:${w}%"></span></span>`; }
function card(title, body, opts = {}) { return `<section class="card ${opts.cls || ''}">${title ? `<div class="card-h"><h2>${title}</h2>${opts.right || ''}</div>` : ''}${opts.sub ? `<p class="card-sub">${opts.sub}</p>` : ''}<div class="card-b">${body}</div></section>`; }
function empty(msg) { return `<div class="empty">${esc(msg)}</div>`; }
function noAccess(what) { return `<div class="noaccess"><h2>No access</h2><p>Your role (${esc(App.user ? App.user.role : '—')}) does not include ${esc(what)}. Ask a System Admin to change your role permissions.</p></div>`; }

/* Table component: cols = [{h, k(row), t:'inr'|'inrs'|'num'|'pct'|'text'|'html', x(row) export value, cls}] */
function fmtCell(t, v) { if (v == null || v === '') return ''; if (typeof v === 'number' && !isFinite(v)) return ''; if (['inr', 'inrs', 'num', 'pct'].includes(t) && typeof v === 'string' && isNaN(+v)) return esc(v); return t === 'inr' ? INR(v) : t === 'inrs' ? INRS(v) : t === 'num' ? NUM(v) : t === 'pct' ? PCT(v) : esc(v); }
function table(id, cols, rows, o = {}) {
  App.tables[id] = { cols, rows, o };
  const st = App.sort[id];
  let data = rows.slice();
  if (st) { const c = cols[st.i]; const val = r => c.x ? c.x(r) : c.k(r); data.sort((a, b) => { const x = val(a), y = val(b); return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))) * st.dir; }); }
  const lim = App.ui['lim_' + id] || o.limit || 0; const more = lim && data.length > lim; if (more) data = data.slice(0, lim);
  const num = c => ['inr', 'inrs', 'num', 'pct'].includes(c.t);
  const th = cols.map((c, i) => `<th class="${num(c) ? 'n' : ''} ${c.cls || ''}" ${c.w ? `style="min-width:${c.w}px"` : ''}><button class="th" data-act="sort" data-t="${id}" data-i="${i}" aria-label="${c.h ? 'Sort by ' + esc(c.h) : 'Sort'}">${esc(c.h)}${st && st.i === i ? (st.dir > 0 ? ' ↑' : ' ↓') : ''}</button></th>`).join('');
  const td = r => cols.map(c => { const v = c.k(r); return `<td class="${num(c) ? 'n' : ''} ${c.cls || ''} ${c.rc ? c.rc(r) : ''}">${c.t === 'html' ? (v == null ? '' : v) : fmtCell(c.t, v)}</td>`; }).join('');
  const tr = data.map(r => `<tr${o.rowAct ? ` class="click" data-act="${o.rowAct}" data-k="${esc(o.rowKey(r))}" tabindex="0"` : ''}>${td(r)}</tr>`).join('');
  const tv = (c, t) => { try { const v = c.k(t); return typeof v === 'string' && /\bundefined\b|\bNaN\b/.test(v) ? '' : v; } catch (e) { return ''; } };
  if (o.total === true) { o.totalVals = cols.map(c => num(c) ? rows.reduce((s2, r) => { let x; try { x = c.x ? c.x(r) : c.k(r); } catch (e) { x = 0; } return s2 + (typeof x === 'number' && isFinite(x) ? x : 0); }, 0) : null); o.total = null; }
  if (o.totalVals) return `<div class="tbl-wrap${o.compact ? ' compact' : ''}"><table class="tbl"><thead><tr>${th}</tr></thead><tbody>${tr || `<tr><td colspan="${cols.length}" class="emptyrow">${esc(o.empty || 'No records for the selected filters.')}</td></tr>`}</tbody><tfoot><tr>${cols.map((c, i) => `<td class="${num(c) ? 'n' : ''} ${c.cls || ''}">${i === 0 ? 'Total' : fmtCell(c.t === 'html' ? 'text' : c.t, o.totalVals[i])}</td>`).join('')}</tr></tfoot></table></div>${more ? `<button class="btn ghost more" data-act="more" data-t="${id}">Show ${Math.min(rows.length - lim, 200)} more of ${NUM(rows.length - lim)}</button>` : ''}`;
  const tot = o.total ? `<tfoot><tr>${cols.map((c, i) => { const v = tv(c, o.total); return `<td class="${num(c) ? 'n' : ''} ${c.cls || ''}">${i === 0 && !v ? 'Total' : c.t === 'html' ? (v || '') : fmtCell(c.t, v)}</td>`; }).join('')}</tr></tfoot>` : '';
  return `<div class="tbl-wrap${o.compact ? ' compact' : ''}"><table class="tbl"><thead><tr>${th}</tr></thead><tbody>${tr || `<tr><td colspan="${cols.length}" class="emptyrow">${esc(o.empty || 'No records for the selected filters.')}</td></tr>`}</tbody>${tot}</table></div>${more ? `<button class="btn ghost more" data-act="more" data-t="${id}">Show ${Math.min(rows.length - lim, 200)} more of ${NUM(rows.length - lim)}</button>` : ''}`;
}
function exportBtns(id, mod, opts = {}) {
  const b = [];
  if (can(mod, 'Export Excel')) b.push(`<button class="btn sm" data-act="export" data-t="${id}" data-fmt="xlsx" data-m="${mod}">Excel</button>`);
  if (can(mod, 'Export PDF')) b.push(`<button class="btn sm" data-act="export" data-t="${id}" data-fmt="pdf" data-m="${mod}">PDF</button>`);
  if (can(mod, 'Download CSV')) b.push(`<button class="btn sm" data-act="export" data-t="${id}" data-fmt="csv" data-m="${mod}">CSV</button>`);
  return b.length ? `<div class="btnrow" role="group" aria-label="Download">${opts.label !== false ? '<span class="lbl">Download</span>' : ''}${b.join('')}</div>` : '';
}

/* ---------- exports (via the viewer's download prompt) ---------- */
let DL = null;
async function saveFile(filename, data) {
  if (DL === null) { try { DL = window.claude && window.claude.use ? await window.claude.use('downloads') : false; } catch (e) { DL = false; } }
  if (!DL) { toast('Downloads are not available in this view. Open the app in Claude to download files.', 'bad'); return false; }
  try { await DL.save({ filename, data }); try { const sz = data && data.size != null ? data.size : (typeof data === 'string' ? data.length : 0); audit('Downloads', 'File downloaded', { new: `${filename} · ${(PAGES[App.route] || {}).title || App.route}${App.ui && App.ui._dlCtx ? ' · ' + App.ui._dlCtx : ''} · ${Math.round(sz / 1024)} KB`, reason: `AY ${(Store.get('config') || {}).ay || ''} · ${scopeLabel()}` }); } catch (e) { } return true; } catch (e) { if (e && e.code === 'declined') toast('Download cancelled.'); else toast('Download failed: ' + (e && e.message || 'unknown error'), 'bad'); return false; }
}
function exportMatrix(id) {
  const T = App.tables[id]; const st = App.sort[id];
  let rows = T.rows.slice();
  if (st) { const c = T.cols[st.i]; const val = r => c.x ? c.x(r) : c.k(r); rows.sort((a, b) => { const x = val(a), y = val(b); return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))) * st.dir; }); }
  const cols = T.cols.filter(c => !c.noexp);
  const val = (c, r) => { let v = c.x ? c.x(r) : c.k(r); if (c.t === 'html' && !c.x) v = String(v || '').replace(/<[^>]+>/g, ''); return v; };
  const body = rows.map(r => cols.map(c => val(c, r)));
  if (T.o.totalVals) body.push(cols.map((c, i) => i === 0 ? 'Total' : (T.o.totalVals[T.cols.indexOf(c)] == null ? '' : T.o.totalVals[T.cols.indexOf(c)])));
  else if (T.o.total) body.push(cols.map((c, i) => { let v; try { v = val(c, T.o.total); } catch (e) { v = ''; } return i === 0 && !v ? 'Total' : v; }));
  return { cols, head: cols.map(c => c.h), body, title: T.o.title || id };
}
async function doExport(id, fmt, mod) {
  const M = exportMatrix(id); App.ui._dlCtx = `${M.title} · ${fmt.toUpperCase()} · ${M.body.length} rows`;
  const meta = [`MS Educational and Welfare Trust`, M.title, `As on ${dLabel(D_())} · AY ${Store.get('config').ay} · ${scopeLabel()}`, `Generated ${tsLabel(new Date().toISOString())} by ${App.user.name} · Last ERP sync ${tsLabel(Store.get('sync').lastSuccess)}`];
  const base = (M.title + ' ' + App.f.date).replace(/[^A-Za-z0-9 -]+/g, '').replace(/\s+/g, '_');
  let ok = false;
  if (fmt === 'csv') {
    const q = v => { const s = typeof v === 'number' ? (Math.round(v * 100) / 100).toString() : String(v == null ? '' : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    ok = await saveFile(base + '.csv', [M.head, ...M.body].map(r => r.map(q).join(',')).join('\n'));
  } else if (fmt === 'xlsx') {
    if (!window.XLSX) return toast('The Excel library did not load. Check your connection and reload.', 'bad');
    const aoa = [...meta.map(m => [m]), [], M.head, ...M.body.map(r => r.map(v => typeof v === 'number' ? Math.round(v * 100) / 100 : v))];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = M.head.map((h, i) => ({ wch: Math.max(10, Math.min(42, h.length + 2, ...M.body.slice(0, 50).map(r => String(r[i] == null ? '' : r[i]).length + 2))) }));
    M.cols.forEach((c, ci) => { if (['inr', 'inrs'].includes(c.t)) for (let r = 0; r <= M.body.length; r++) { const ref = XLSX.utils.encode_cell({ r: meta.length + 2 + r, c: ci }); if (ws[ref] && typeof ws[ref].v === 'number') ws[ref].z = '[$₹-4009]#,##,##0'; } });
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Report');
    ok = await saveFile(base + '.xlsx', new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })]));
  } else if (fmt === 'pdf') {
    if (!window.jspdf) return toast('The PDF library did not load. Check your connection and reload.', 'bad');
    const doc = new window.jspdf.jsPDF({ orientation: M.head.length > 7 ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' });
    pdfHeader(doc, meta);
    const pf = (c, v) => typeof v !== 'number' ? String(v == null ? '' : v).replace(/₹/g, 'Rs.') : ['inr', 'inrs'].includes(c.t) ? 'Rs.' + fmt0.format(Math.round(v)) : c.t === 'pct' ? v.toFixed(1) + '%' : fmt0.format(Math.round(v));
    doc.autoTable({ head: [M.head], body: M.body.map(r => r.map((v, i) => pf(M.cols[i], v))), startY: 90, styles: { fontSize: M.head.length > 12 ? 5.5 : 7, cellPadding: 2 }, headStyles: { fillColor: [43, 58, 140] }, columnStyles: Object.fromEntries(M.cols.map((c, i) => [i, { halign: ['inr', 'inrs', 'num', 'pct'].includes(c.t) ? 'right' : 'left' }])) });
    ok = await saveFile(base + '.pdf', new Blob([doc.output('arraybuffer')]));
  }
  if (ok) audit(MODLABEL(mod), `Report export (${fmt.toUpperCase()})`, { new: M.title + ' · ' + App.f.date });
  App.ui._dlCtx = ""; return ok;
}
const MODLABEL = m => (MODULES.find(x => x[0] === m) || [m, m])[1];

/* ---------- charts ---------- */
function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
function mountChart(id, cfgFn) { App.mounts.push(() => { const el = document.getElementById(id); if (!el || !window.Chart) { if (el) el.parentElement.innerHTML = empty('Chart library not loaded.'); return; } App.charts.push(new Chart(el, cfgFn())); }); }
function chartBase(yFmt) {
  const ink = cssVar('--ink-2'), grid = cssVar('--grid');
  return { responsive: true, maintainAspectRatio: false, animation: false, interaction: { mode: 'index', intersect: false },
    plugins: { legend: { display: false }, tooltip: { backgroundColor: cssVar('--surface'), titleColor: cssVar('--ink'), bodyColor: cssVar('--ink'), borderColor: cssVar('--line'), borderWidth: 1, padding: 10, callbacks: { label: c => ' ' + (c.dataset.label ? c.dataset.label + ': ' : '') + (yFmt ? yFmt(c.parsed.y != null ? c.parsed.y : c.parsed.x) : c.formattedValue) } } },
    scales: { x: { grid: { display: false }, ticks: { color: ink, maxRotation: 0, autoSkipPadding: 14, font: { size: 11 } }, border: { color: grid } }, y: { grid: { color: grid }, border: { display: false }, ticks: { color: ink, font: { size: 11 }, callback: v => INRS(v).replace('.00', '') } } } };
}

/* the academy logo on a PDF: top-right by default (w in points, works for mm / pt documents) */
const LOGO_AR = 4.97;
function pdfLogo(doc, x, y, w) { try { const k = doc.internal.scaleFactor, pw = doc.internal.pageSize.getWidth(); w = w || 112; const wu = w / k, hu = wu / LOGO_AR; const xx = x == null ? pw - wu - 36 / k : x / k; doc.addImage('data:image/png;base64,' + LOGO_B64, 'PNG', xx, (y == null ? 14 : y) / k, wu, hu); } catch (e) { } }
/* PDF header with the academy logo */
function pdfHeader(doc, meta) {
  try { doc.addImage('data:image/png;base64,' + LOGO_B64, 'PNG', 36, 22, 150, 30); } catch (e) { }
  doc.setFontSize(12); doc.text(meta[0], 200, 36); doc.setFontSize(10); doc.text(meta[1], 200, 52); doc.setFontSize(8); doc.text(meta[2], 36, 68); doc.text(meta[3], 36, 80);
}
