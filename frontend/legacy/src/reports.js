/* ===== Reporting screens ===== */
const PAGES = {};
const instCols = (D, upcoming) => A.sched.map((it, k) => ({ it, k })).filter(({ it }) => it.active && it.kind !== 'py' && (upcoming || it._due <= D));

/* ---------- Alerts & exceptions (rules) ---------- */
function alertsFor(D, idx) {
  return memo('al' + D + '_' + idx.join(','), () => {
    const cfg = Store.get('config'), ac = cfg.alerts, out = [];
    const rows = branchRows(D, idx), wk = D - 7;
    const agPrev = Calc.agg(wk);
    rows.forEach(r => {
      const b = DATA.branches[r.i];
      if (ac.belowDaily && isWork(D) && r.mRem > 0 && r.tNet < r.mDaily * 0.999) out.push({ sev: 'a', rule: 'Below daily required collection', b, text: `Collected ${INR(r.tNet)} today against ${INR(r.mDaily)} required per working day.` });
      if (ac.missTarget && r.mTarget > 0 && r.mProj < 100 && r.mRem > 0) out.push({ sev: r.mProj < 60 ? 'r' : 'a', rule: `Likely to miss ${PCT(r.mPct, 0)} monthly target`, b, text: `Projected month-end achievement ${PCT(r.mProj)} at the current run rate; ${INR(r.mRem)} still to collect.` });
      if (ac.osLimit && r.duePct > cfg.osLimitPct) out.push({ sev: 'a', rule: 'Outstanding above permitted limit', b, text: `Outstanding is ${PCT(r.duePct)} of fee due (limit ${cfg.osLimitPct}%).` });
      if (ac.zpLimit && r.zpOver) out.push({ sev: 'r', rule: 'Zero payer outstanding above limit', b, text: `${NUM(r.zpN)} zero payers owe ${INR(r.zpAmt)} (limit ${INR(Calc.zpLimit(b))}).` });
      const p = agPrev[r.i];
      if (p.zpN > 0 && (r.zpN - p.zpN) / p.zpN * 100 > ac.zpIncreasePct) out.push({ sev: 'a', rule: 'Increase in zero payer count', b, text: `Zero payers rose from ${NUM(p.zpN)} to ${NUM(r.zpN)} in 7 days.` });
      if (p.od > 0 && (r.od - p.od) / p.od * 100 > ac.overdueIncreasePct) out.push({ sev: 'a', rule: 'Major increase in overdue amount', b, text: `Overdue rose ${PCT((r.od - p.od) / p.od * 100)} in 7 days to ${INR(r.od)}.` });
      if (isWork(D) && r.tCnt === 0) out.push({ sev: 'a', rule: 'No collection posted', b, text: `No receipt posted by ${ac.noCollectionBy} on ${dLabel(D)}.` });
    });
    A.sched.forEach(it => { if (it.active && it._due > D && it._due - D <= ac.dueApproachDays) out.push({ sev: 'i', rule: 'Instalment due date approaching', b: null, text: `${it.name} falls due on ${dLabel(it._due)} (${it._due - D} days).` }); });
    const sync = Store.get('sync');
    if (ac.syncFail) sync.runs.filter(x => x.status !== 'Success' && !x.retried).slice(0, 2).forEach(x => out.push({ sev: 'r', rule: 'ERP sync failure', b: null, text: `${x.entity}: ${x.error || x.status} (${tsLabel(x.at)}).` }));
    if (ac.recon) Recon.branchDiffs(D).filter(x => idx.includes(x.i) && Math.abs(x.diff) > 0.5).forEach(x => out.push({ sev: 'r', rule: 'Reconciliation mismatch', b: DATA.branches[x.i], text: `ERP payment ledger differs from report total by ${INR(x.diff)}.` }));
    { const keep = {}; ['cls', 'sec', 'stCat', 'feeCat', 'source', 'couns'].forEach(k => { keep[k] = App.f[k]; App.f[k] = ''; }); try { out.push(...strengthAlerts(D, idx)); } finally { Object.assign(App.f, keep); } }
    const order = { r: 0, a: 1, i: 2 };
    return out.sort((x, y) => order[x.sev] - order[y.sev]);
  });
}
const Recon = {
  branchDiffs(D) {
    return memo('rc' + D, () => DATA.branches.map((b, i) => {
      const rec = DATA.receipts.filter(r => r.b === i && r.d <= D).reduce((a, r) => a + r.amt, 0);
      const dup = DATA.dups.filter(r => r.b === i && r.d <= D).reduce((a, r) => a + r.amt, 0);
      const orph = DATA.orphans.filter(r => r.b === i && r.d <= D).reduce((a, r) => a + r.amt, 0);
      const report = E.at(A.colCum[i], D);
      return { i, erp: rec + dup + orph, receipts: rec, report, diff: rec + dup + orph - report, dup, orph };
    }));
  },
  list(D) {
    return memo('ex' + D, () => {
      const X = [];
      DATA.dups.filter(r => r.d <= D).forEach(r => X.push({ id: 'DUP-' + r.no, type: 'Duplicate receipt', sev: 'r', b: r.b, text: `Receipt ${r.no} (${INR(r.amt)}, ${dLabel(r.d)}) is posted twice in the ERP payment ledger.` }));
      DATA.orphans.filter(r => r.d <= D).forEach(r => X.push({ id: 'MAP-' + r.no, type: 'Incorrect receipt mapping', sev: 'r', b: r.b, text: `${r.no} for ${INR(r.amt)} on ${dLabel(r.d)}: ${r.reason}.` }));
      DATA.students.filter(s => s.noPlan && s.join <= D).forEach(s => X.push({ id: 'PLAN-' + s.adm, type: 'Missing fee plan', sev: 'r', b: s.b, text: `${s.name} (${s.adm}, ${s.cls}) has receipts but no fee plan; payment shows as unallocated credit.` }));
      DATA.students.filter(s => s._credit > 0.5 && s.join <= D).forEach(s => X.push({ id: 'NEG-' + s.adm, type: 'Negative balance', sev: 'a', b: s.b, text: `${s.name} (${s.adm}) has a credit balance of ${INR(s._credit)} beyond the fee plan.` }));
      Store.get('sync').runs.filter(x => x.status !== 'Success' && !x.retried).forEach(x => X.push({ id: 'SYNC-' + x.at, type: 'ERP sync failure', sev: 'r', b: null, text: `${x.entity} sync ${x.status.toLowerCase()} at ${tsLabel(x.at)}: ${x.error || ''} ${x.failed ? `(${x.failed} records failed)` : ''}` }));
      Recon.branchDiffs(D).filter(x => Math.abs(x.diff) > 0.5).forEach(x => X.push({ id: 'REC-' + DATA.branches[x.i].id + '-' + E.ds(D), type: 'Reconciliation difference', sev: 'r', b: x.i, text: `ERP ledger ${INR(x.erp)} vs receipt register ${INR(x.receipts)} vs report ${INR(x.report)}: difference ${INR(x.diff)}.` }));
      const src = 'Source workbook';
      X.push({ id: 'XL-REF', type: 'Source report error', sev: 'a', b: null, src, text: 'Summary sheet row 91 contains #REF! errors in the Net Fee, Paid, Dues and Due % check columns.' });
      X.push({ id: 'XL-SNO', type: 'Source report error', sev: 'i', b: null, src, text: 'Summary sheet, Junior College section: serial numbers repeat (5 appears 5 times), so S. No. cannot be used as a key.' });
      X.push({ id: 'XL-PY', type: 'Data review', sev: 'a', b: DATA.branches.findIndex(b => /Degree College Charminar/.test(b.name)), src, text: 'Previous year dues (₹6,96,155) exceed the entire 1st-instalment net fee (₹6,65,000). Confirm the previous-year balance is correct.' });
      X.push({ id: 'XL-JAJ', type: 'Data review', sev: 'a', b: DATA.branches.findIndex(b => /Jajmau/.test(b.name)), src, text: 'No collection against the 1st instalment as on 21 Jul 2026 (₹79,040 due, ₹0 paid). Confirm receipts are being posted in the ERP.' });
      return X;
    });
  }
};

/* ---------- Dashboard ---------- */
PAGES.dashboard = { title: 'Management Dashboard', mod: 'dashboard', render() {
  const D = D_(), idx = scopeIdx();
  if (!idx.length) return empty('No branches in your scope for these filters.');
  const rows = branchRows(D, idx), T = finishTotals(rows, ''), pD = prevWork(D);
  const prevNet = idx.reduce((a, i) => a + Calc.day(i, pD).net, 0);
  const cfg = Store.get('config');
  const achR = Calc.rag('ach', T.mAchPct, T.mPace), osR = Calc.rag('os', T.duePct), zpR = Calc.rag('zp', T.os ? T.zpAmt / T.os * 100 : 0, rows.filter(r => r.zpOver).length > rows.length / 3);
  const delta = T.tNet - prevNet;
  const kpi = (lab, val, sub, extra = '') => `<div class="kpi">${extra}<div class="kpi-l">${lab}</div><div class="kpi-v">${val}</div><div class="kpi-s">${sub}</div></div>`;
  const kpis = `<div class="kpis">
    ${kpi(`Collection on ${dLabel(D).slice(0, -5)}`, INR(T.tNet), `<span class="${delta >= 0 ? 'up' : 'down'}">${delta >= 0 ? '▲' : '▼'} ${INRS(Math.abs(delta))}</span> vs ${dLabel(pD).slice(0, -5)} · ${NUM(T.tCnt)} receipts`)}
    ${kpi('Month-to-date vs target', INRS(T.mAch), `${PCT(T.mAchPct)} of ${INRS(T.mTarget)} · expected pace ${PCT(T.mPace, 0)}`, `<div class="kpi-c">${chip(achR)}</div>`) }
    ${kpi('Net outstanding', INRS(T.os), `${PCT(T.duePct)} of ${INRS(T.due)} due till date`, `<div class="kpi-c">${chip(osR)}</div>`)}
    ${kpi('Overdue beyond grace', INRS(T.od), `${NUM(T.defN)} defaulters`)}
    ${kpi('Zero payers', NUM(T.zpN), `${INRS(T.zpAmt)} outstanding · ${rows.filter(r => r.zpOver).length} branches over limit`, `<div class="kpi-c">${chip(zpR)}</div>`)}
    ${kpi('Advance collection', INRS(T.adv), `${INRS(T.mAdv)} this month · ${cfg.advanceCounts ? 'counted toward target' : 'not counted toward target'}`)}
  </div>`;
  const ym = dLabel(monthStart(D)).slice(2);
  const strip = card(`${ym.trim()} collection target`, `<div class="strip">
    <div><span>Opening outstanding (1st)</span><b>${INR(T.mOpen)}</b></div>
    <div><span>Target (${PCT(T.mPct, 0)} of opening)</span><b>${INR(T.mTarget)}</b></div>
    <div><span>Achieved</span><b>${INR(T.mAch)}</b></div>
    <div><span>Achievement</span><b>${PCT(T.mAchPct)}</b>${bar(T.mAchPct, achR)}</div>
    <div><span>Remaining</span><b>${INR(T.mRem)}</b></div>
    <div><span>Daily required · ${T.mRemWD} working days left</span><b>${INR(T.mDaily)}</b></div>
    <div class="muted"><span>Fresh dues this month (not in target)</span><b>${INR(T.mFresh)}</b></div>
    <div class="muted"><span>New admissions this month</span><b>${NUM(T.mNewN)}</b></div>
  </div>`, { right: pill(rows.some(r => r.mFrozen) ? 'Target frozen' : 'Provisional – not yet frozen', rows.some(r => r.mFrozen) ? 'ok' : 'warn') });
  // trends
  const s0 = Math.max(AYS, D - 44); const days = []; for (let d = s0; d <= D; d++) days.push(d);
  const daily = days.map(d => idx.reduce((a, i) => a + A.colDay[i][d], 0));
  mountChart('chDaily', () => { const o = chartBase(INR); return { type: 'bar', data: { labels: days.map(d => dLabel(d).slice(0, -5)), datasets: [{ label: 'Net collection', data: daily, backgroundColor: cssVar('--chart-1'), borderRadius: 3, maxBarThickness: 16 }] }, options: o }; });
  const wks = []; for (let d = AYS; d <= D; d += 7) wks.push(d); if (wks[wks.length - 1] !== D) wks.push(D);
  const osSeries = wks.map(d => idx.reduce((a, i) => a + E.branchQuick(A, i, d).os, 0));
  mountChart('chOS', () => { const o = chartBase(INR); return { type: 'line', data: { labels: wks.map(d => dLabel(d).slice(0, -5)), datasets: [{ label: 'Net outstanding', data: osSeries, borderColor: cssVar('--chart-2'), backgroundColor: cssVar('--chart-2-soft'), fill: true, tension: .25, borderWidth: 2, pointRadius: wks.map((_, i) => i === wks.length - 1 ? 4 : 0), pointBackgroundColor: cssVar('--chart-2') }] }, options: o }; });
  const trends = `<div class="grid2">${card('Daily net collection', `<div class="chart"><canvas id="chDaily" role="img" aria-label="Daily net collection for the last ${days.length} days"></canvas></div>`, { sub: `Last ${days.length} days · daily required now ${INRS(T.mDaily)}` })}${card('Net outstanding trend', `<div class="chart"><canvas id="chOS" role="img" aria-label="Weekly net outstanding since April"></canvas></div>`, { sub: 'Weekly since 1 Apr · jumps when an instalment falls due' })}</div>`;
  // instalment + ageing + concession
  const ins = [{ name: 'Previous Year Dues', ...(A.pyK >= 0 ? T.inst[A.pyK] : { due: 0, paid: 0, bal: 0 }) }].concat(instCols(D).map(({ it, k }) => ({ name: it.name, ...T.inst[k] })));
  const insT = table('dashInst', [{ h: 'Fee head', k: r => r.name, t: 'text' }, { h: 'Due till date', k: r => r.due, t: 'inr' }, { h: 'Collected', k: r => r.paid, t: 'inr' }, { h: 'Outstanding', k: r => r.bal, t: 'inr' }, { h: 'Collection %', k: r => r.due ? r.paid / r.due * 100 : 0, t: 'pct' }], ins, { compact: true, title: 'Instalment-wise outstanding' });
  const agT = T.ag.reduce((a, x) => a + x, 0) || 1;
  const ageing = ['0–30 days', '31–60 days', '61–90 days', '91–180 days', 'Above 180 days'].map((l, i) => `<div class="hb"><span class="hb-l">${l}</span><span class="hb-t"><span style="width:${T.ag[i] / Math.max(...T.ag, 1) * 100}%" class="s${i}"></span></span><span class="hb-v">${INRS(T.ag[i])} <em>${PCT(T.ag[i] / agT * 100, 0)}</em></span></div>`).join('');
  const refY = idx.reduce((a, i) => a + E.sumRange(E.cumOf(A.refDay[i]), AYS, D), 0), revY = idx.reduce((a, i) => a + E.sumRange(E.cumOf(A.revDay[i]), AYS, D), 0);
  const impact = `<dl class="dl"><div><dt>Gross annual fee</dt><dd>${INR(T.gross)}</dd></div><div><dt>Approved concessions</dt><dd>−${INR(T.gross - T.annual)}</dd></div><div><dt>Net annual fee</dt><dd><b>${INR(T.annual)}</b></dd></div><div><dt>Refunds (AY to date)</dt><dd>−${INR(refY)}</dd></div><div><dt>Cheque reversals (AY to date)</dt><dd>−${INR(revY)}</dd></div><div><dt>Advance held (separate line)</dt><dd>${INR(T.adv)}</dd></div><div><dt>Collection AY to date (net)</dt><dd><b>${INR(T.ytd)}</b></dd></div></dl>`;
  // rankings
  const tab = App.ui.rankTab || 'ach';
  const tabs = [['ach', 'Ranking by achievement'], ['os', 'Highest outstanding'], ['od', 'Highest overdue'], ['low', 'Lowest achievement'], ['zp', 'Highest zero payer outstanding']];
  const sorted = { ach: [...rows].sort((a, b) => b.mAchPct - a.mAchPct), os: [...rows].sort((a, b) => b.os - a.os), od: [...rows].sort((a, b) => b.od - a.od), low: [...rows].sort((a, b) => a.mAchPct - b.mAchPct), zp: [...rows].sort((a, b) => b.zpAmt - a.zpAmt) }[tab];
  const rk = table('rank', [{ h: '#', k: r => sorted.indexOf(r) + 1, t: 'num' }, { h: 'Branch', k: r => r.name, t: 'text', cls: 'wrap' }, { h: 'Zonal Director', k: r => r.zdName, t: 'text' }, { h: 'MTD collection', k: r => r.mAch, t: 'inr' }, { h: 'Target', k: r => r.mTarget, t: 'inr' }, { h: 'Achievement', k: r => `${PCT(r.mAchPct)} ${chip(Calc.rag('ach', r.mAchPct, r.mPace), ' ')}`, t: 'html', x: r => r.mAchPct }, { h: 'Outstanding', k: r => r.os, t: 'inr' }, { h: 'Overdue', k: r => r.od, t: 'inr' }, { h: 'Zero payer outstanding', k: r => r.zpAmt, t: 'inr', rc: r => r.zpOver ? 'red' : '' }], tab === 'ach' ? sorted : sorted.slice(0, 10), { rowAct: 'openBranch', rowKey: r => r.id, title: tabs.find(t => t[0] === tab)[1], limit: tab === 'ach' ? 15 : 0 });
  const ranks = card('Branch performance', `<div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" aria-selected="${k === tab}" class="tab${k === tab ? ' on' : ''}" data-act="ui" data-k="rankTab" data-v="${k}">${l}</button>`).join('')}</div>${rk}`, { right: exportBtns('rank', 'dashboard', { label: false }) });
  // roll-up
  const by = ['region', 'zone', 'type'].includes(App.ui.dashBy) ? App.ui.dashBy : (new Set(rows.map(r => r.region)).size > 1 ? 'region' : 'zone');
  const ru = rollup(rows, by).sort((a, b) => b.os - a.os);
  const ruT = table('rollup', [{ h: { region: 'Region · Regional Director', zone: 'Zone · Zonal Director', type: 'School type' }[by], k: r => r.name, t: 'text' }, { h: 'Branches', k: r => r.count, t: 'num' }, { h: 'Today', k: r => r.tNet, t: 'inr' }, { h: 'MTD', k: r => r.mAch, t: 'inr' }, { h: 'Target', k: r => r.mTarget, t: 'inr' }, { h: 'Achievement', k: r => `${PCT(r.mAchPct)} ${chip(Calc.rag('ach', r.mAchPct, r.mPace), ' ')}`, t: 'html', x: r => r.mAchPct }, { h: 'Outstanding', k: r => r.os, t: 'inr' }, { h: 'Due %', k: r => `${PCT(r.duePct)} ${chip(Calc.rag('os', r.duePct), ' ')}`, t: 'html', x: r => r.duePct }, { h: 'Overdue', k: r => r.od, t: 'inr' }, { h: 'Zero payers', k: r => r.zpN, t: 'num' }, { h: 'Zero payer outstanding', k: r => r.zpAmt, t: 'inr' }], ru, { total: T, title: 'Roll-up by ' + by });
  const ruCard = card('Consolidated by', `<div class="tabs">${['region', 'zone', 'type'].map(k => `<button class="tab${k === by ? ' on' : ''}" data-act="ui" data-k="dashBy" data-v="${k}">${{ region: 'Region', zone: 'Zone', type: 'School type' }[k]}</button>`).join('')}</div>${ruT}`, { right: exportBtns('rollup', 'dashboard', { label: false }) });
  const al = alertsFor(D, idx); const exN = Recon.list(D).filter(x => !Store.get('resolved')[x.id] && (x.b == null || idx.includes(x.b))).length;
  const alCard = card(`Alerts <span class="count">${al.length}</span>`, `<ul class="alerts">${al.slice(0, 6).map(a => `<li class="sev-${a.sev}"><span class="sev">${{ r: 'Critical', a: 'Warning', i: 'Info' }[a.sev]}</span><div><b>${esc(a.rule)}</b>${a.b ? ` · ${esc(a.b.name)}` : ''}<p>${esc(a.text)}</p></div></li>`).join('') || '<li>No alerts.</li>'}</ul>`, { right: `<button class="btn sm ghost" data-act="go" data-r="alerts">All alerts</button>`, sub: can('exceptions') ? `<button class="linkish" data-act="go" data-r="exceptions">${exN} open exceptions and reconciliation differences →</button>` : '' });
  const top = `${kpis}<div class="grid-main"><div class="stack">${strip}${card('Instalment-wise outstanding', insT)}</div>${alCard}</div>`;
  const agCard = card('Outstanding ageing', `<div class="hbars">${ageing}</div>`, { sub: 'Days past due date, all heads' });
  if (idx.length === 1) return `${top}${classCard(idx[0], D)}<div class="grid2">${pendingCard(idx[0], D)}${agCard}</div>${trends}${card('Concession, refund & advance', impact)}`;
  return `${top}${trends}<div class="grid2">${agCard}${card('Concession, refund & advance', impact)}</div>${ranks}${ruCard}`;
} };

/* ---------- Single-branch (Principal) sections ---------- */
const CLASS_ORDER = ['Nursery', 'LKG', 'UKG', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'Inter 1st Year', 'Inter 2nd Year', 'B.Com Year 1', 'B.Com Year 2', 'B.Com Year 3', 'B.Sc Year 1', 'B.Sc Year 2', 'BBA Year 1'];
const clsRank = c => { const i = CLASS_ORDER.indexOf(c); return i < 0 ? 99 : i; };
function classCard(bi, D) {
  const by = App.ui.clsBy || 'class', b = DATA.branches[bi];
  const secs = Object.values(Calc.agg(D)[bi].cls);
  let rows;
  if (by === 'section') rows = secs.map(c => Object.assign({ key: c.cls + '|' + c.sec, label: c.cls }, c));
  else { const m = new Map(); secs.forEach(c => { const r = m.get(c.cls) || { key: c.cls + '|', label: c.cls, cls: c.cls, sec: '', secN: 0, n: 0, due: 0, paid: 0, os: 0, od: 0, zpN: 0, zpAmt: 0, ptN: 0 }; r.secN++; ['n', 'due', 'paid', 'os', 'od', 'zpN', 'zpAmt', 'ptN'].forEach(k => r[k] += c[k]); m.set(c.cls, r); }); rows = [...m.values()]; }
  rows.sort((a, c) => clsRank(a.cls) - clsRank(c.cls) || a.sec.localeCompare(c.sec));
  const T = { label: '', sec: '', secN: secs.length, n: 0, due: 0, paid: 0, os: 0, od: 0, zpN: 0, zpAmt: 0, ptN: 0 }; rows.forEach(r => ['n', 'due', 'paid', 'os', 'od', 'zpN', 'zpAmt', 'ptN'].forEach(k => T[k] += r[k]));
  const maxOs = Math.max(1, ...rows.map(r => r.os));
  const cp = r => r.due > 0 ? r.paid / r.due * 100 : 100;
  const cols = [{ h: 'Class', k: r => r.label, t: 'text' }, ...(by === 'section' ? [{ h: 'Section', k: r => r.sec, t: 'text' }] : [{ h: 'Sections', k: r => r.secN, t: 'num' }]),
    { h: 'Students', k: r => r.n, t: 'num' }, { h: 'Due till date', k: r => r.due, t: 'inr' }, { h: 'Collected', k: r => r.paid, t: 'inr' },
    { h: 'Outstanding', k: r => `<span class="osbar"><span style="width:${r.os / maxOs * 100}%"></span></span>${INR(r.os)}`, t: 'html', x: r => r.os, cls: 'n em' },
    { h: 'Overdue', k: r => r.od, t: 'inr' }, { h: 'Collection %', k: r => `${PCT(cp(r))} ${chip(Calc.rag('os', 100 - cp(r)), ' ')}`, t: 'html', x: r => cp(r), cls: 'n' },
    { h: 'Zero payers', k: r => r.zpN, t: 'num' }, { h: 'Zero payer outstanding', k: r => r.zpAmt, t: 'inr' }, { h: 'Partial payers', k: r => r.ptN, t: 'num' }];
  const tabs = `<div class="tabs">${[['class', 'By class'], ['section', 'By class and section']].map(([k, l]) => `<button class="tab${k === by ? ' on' : ''}" data-act="ui" data-k="clsBy" data-v="${k}">${l}</button>`).join('')}</div>`;
  const worst = [...rows].sort((a, c) => c.os - a.os)[0];
  return card('Class-wise outstanding', tabs + table('clsDash', cols, rows, { total: T, rowAct: can('students', 'View student-level details') ? 'clsGo' : null, rowKey: r => bi + '~' + r.key, title: `Class-wise outstanding – ${b.name}` }),
    { right: exportBtns('clsDash', 'dashboard', { label: false }), sub: `${esc(b.name)} · as on ${dLabel(D)}${worst ? ` · highest outstanding: ${esc(worst.label)}${worst.sec ? ' ' + esc(worst.sec) : ''} (${INR(worst.os)})` : ''}. Select a row to see its students.` });
}
function pendingCard(bi, D) {
  if (!can('students', 'View student-level details')) return card('Pending students', '<p class="muted small">Student-level details are not enabled for your role.</p>');
  const S = E.studentsAt(DATA, A, D).filter(x => x && x.s.b === bi && x.os > 0.5).sort((a, c) => c.os - a.os);
  const t = table('pendDash', [{ h: 'Student', k: r => r.s.name, t: 'text' }, { h: 'Class', k: r => r.s.cls + ' ' + r.s.sec, t: 'text' }, { h: 'Parent mobile', k: r => r.s.mobile, t: 'text' }, { h: 'Outstanding', k: r => r.os, t: 'inr', cls: 'em' }, { h: 'Ageing', k: r => oldestAge(r), t: 'text' }, { h: 'Status', k: r => pill(r.status, { 'Zero payer': 'bad', Partial: 'warn' }[r.status] || ''), t: 'html', x: r => r.status }], S, { limit: 10, rowAct: 'openStudent', rowKey: r => r.s.id, title: 'Pending students', compact: true });
  return card(`Pending students <span class="count">${NUM(S.length)}</span>`, t, { right: `<button class="btn sm ghost" data-act="toStudents" data-k="${DATA.branches[bi].id}">All students</button>`, sub: 'Highest outstanding first' });
}

/* ---------- Daily collection ---------- */
PAGES.daily = { title: 'Daily Branch Collection', mod: 'daily', group: true, render() {
  const D = D_(), idx = scopeIdx(); if (!idx.length) return empty('No branches in your scope for these filters.');
  const rows = branchRows(D, idx), by = App.f.group, data = rollup(rows, by), T = finishTotals(rows, '');
  const lab = { branch: 'Branch', region: 'Region · Regional Director', zone: 'Zone · Zonal Director', rd: 'Regional Director', zd: 'Zonal Director', type: 'School type', group: 'Group' }[by];
  const cols = [
    { h: lab, k: r => r.name, t: 'text', cls: 'sticky wrap', w: 190 },
    ...(by === 'branch' ? [{ h: 'Zonal Director', k: r => r.zdName, t: 'text' }, { h: 'Regional Director', k: r => r.rdName, t: 'text' }] : [{ h: 'Branches', k: r => r.count, t: 'num' }]),
    { h: 'Opening outstanding', k: r => r.tOpen, t: 'inr' }, { h: "Today's collection", k: r => r.tGross, t: 'inr' },
    { h: 'Cash', k: r => r.cash, t: 'inr' }, { h: 'Online / UPI / Card / Bank', k: r => r.online, t: 'inr' }, { h: 'Cheque', k: r => r.cheque, t: 'inr' },
    { h: 'Advance (in today)', k: r => r.tAdv, t: 'inr' }, { h: 'Refunds & reversals', k: r => r.tRef + r.tRev, t: 'inr' }, { h: 'Net collection', k: r => r.tNet, t: 'inr', cls: 'em' },
    { h: 'MTD', k: r => r.mtd, t: 'inr' }, { h: 'YTD', k: r => r.ytd, t: 'inr' }, { h: 'Monthly target', k: r => r.mTarget, t: 'inr' },
    { h: 'Achieved for target', k: r => r.mAch, t: 'inr' }, { h: 'Achievement', k: r => `${PCT(r.mAchPct)} ${chip(Calc.rag('ach', r.mAchPct, r.mPace), ' ')}`, t: 'html', x: r => r.mAchPct },
    { h: 'Shortfall / excess', k: r => r.mAch - r.mTarget, t: 'inr', rc: r => r.mAch - r.mTarget < 0 ? 'red' : 'green' }, { h: 'Daily required', k: r => r.mDaily, t: 'inr' },
    { h: 'Closing outstanding', k: r => r.os, t: 'inr' }, { h: 'Due up to date', k: r => r.due, t: 'inr' }, { h: 'Overdue', k: r => r.od, t: 'inr' },
    { h: 'Defaulters', k: r => r.defN, t: 'num' }, { h: 'Zero payers', k: r => r.zpN, t: 'num' }, { h: 'Zero payer outstanding', k: r => r.zpAmt, t: 'inr', rc: r => r.zpOver ? 'red' : '' },
    { h: 'Partial payers', k: r => r.ptN, t: 'num' }, { h: 'Partial payer outstanding', k: r => r.ptAmt, t: 'inr' }
  ];
  const tb = table('daily', cols, data, { total: T, rowAct: by === 'branch' ? 'openBranch' : null, rowKey: r => r.id, title: 'Daily Branch Collection Report' });
  const remWD = rows[0] ? rows[0].mRemWD : 0;
  return `<div class="note">${isWork(D) ? '' : `<b>${dLabel(D)} is a non-working day.</b> `}Advance collection is shown separately and ${Store.get('config').advanceCounts ? 'counts' : 'does not count'} toward the monthly target. Daily required = remaining target ÷ ${remWD} remaining working days. Select a branch row for mode split, comparisons and pending classes.</div>
  ${card(`Collection on ${dLabel(D)} · ${esc(scopeLabel())}`, tb, { right: exportBtns('daily', 'daily') })}`;
} };

function openBranch(bid) {
  const i = DATA.branches.findIndex(b => b.id === bid); if (i < 0) return;
  const D = D_(), r = branchRows(D, [i])[0], b = DATA.branches[i];
  const pD = prevWork(D); const s = E.ds(D); const pm = E.dn(`${s.slice(0, 5)}${String(+s.slice(5, 7) - 1).padStart(2, '0')}${s.slice(7)}`);
  const cmp = (lab, d) => { const x = d >= 0 ? Calc.day(i, d) : null; return `<tr><td>${lab}</td><td class="n">${x ? INR(x.net) : '—'}</td><td class="n">${x ? INR(x.mtd) : '—'}</td></tr>`; };
  const cls = Object.values(Calc.agg(D)[i].cls).sort((a, b) => b.os - a.os).slice(0, 6);
  const body = `<div class="kv4"><div><span>Net collection today</span><b>${INR(r.tNet)}</b></div><div><span>MTD / target</span><b>${INRS(r.mAch)} / ${INRS(r.mTarget)}</b></div><div><span>Achievement</span><b>${PCT(r.mAchPct)}</b> ${chip(Calc.rag('ach', r.mAchPct, r.mPace))}</div><div><span>Daily required</span><b>${INR(r.mDaily)}</b></div></div>
  <div class="grid2 tight"><div><h4>Collection by mode</h4><table class="tbl mini"><tbody>${E.MODES.map((m, k) => `<tr><td>${m}</td><td class="n">${INR(r.modes[k])}</td></tr>`).join('')}<tr><td>Refunds</td><td class="n">−${INR(r.tRef)}</td></tr><tr><td>Cheque reversals</td><td class="n">−${INR(r.tRev)}</td></tr><tr class="tot"><td>Net</td><td class="n">${INR(r.tNet)}</td></tr><tr><td>of which advance</td><td class="n">${INR(r.tAdv)}</td></tr></tbody></table></div>
  <div><h4>Comparison</h4><table class="tbl mini"><thead><tr><th></th><th class="n">Net that day</th><th class="n">MTD then</th></tr></thead><tbody>${cmp('Selected date · ' + dLabel(D), D)}${cmp('Previous working day · ' + dLabel(pD), pD)}${cmp('Same date last month · ' + dLabel(pm), pm >= 0 && pm >= E.dn('2026-03-01') ? pm : -1)}<tr><td>Same date last year</td><td class="n" colspan="2"><span class="muted">AY 2025-26 receipts not synced</span></td></tr></tbody></table></div></div>
  <h4>Top pending classes and sections</h4><table class="tbl mini"><thead><tr><th>Class</th><th>Section</th><th class="n">Students</th><th class="n">Outstanding</th><th class="n">Overdue</th><th class="n">Zero payers</th></tr></thead><tbody>${cls.map(c => `<tr><td>${esc(c.cls)}</td><td>${esc(c.sec)}</td><td class="n">${c.n}</td><td class="n">${INR(c.os)}</td><td class="n">${INR(c.od)}</td><td class="n">${c.zpN}</td></tr>`).join('')}</tbody></table>
  <dl class="dl cols"><div><dt>Opening outstanding (day)</dt><dd>${INR(r.tOpen)}</dd></div><div><dt>Closing outstanding</dt><dd>${INR(r.os)}</dd></div><div><dt>Overdue</dt><dd>${INR(r.od)}</dd></div><div><dt>Defaulters</dt><dd>${NUM(r.defN)}</dd></div><div><dt>Zero payers</dt><dd>${NUM(r.zpN)} · ${INR(r.zpAmt)}</dd></div><div><dt>Partial payers</dt><dd>${NUM(r.ptN)} · ${INR(r.ptAmt)}</dd></div><div><dt>Zonal Director</dt><dd>${esc(r.zdName)}</dd></div><div><dt>Region / zone</dt><dd>${esc(b.region)} · ${esc(b.zone)}</dd></div></dl>`;
  modal(`${b.name} · ${dLabel(D)}`, body, `${can('students', 'View student-level details') ? `<button class="btn" data-act="toStudents" data-k="${b.id}">Open students</button>` : ''}<button class="btn primary" data-act="closeModal">Close</button>`, true);
}

/* ---------- Monthly target ---------- */
PAGES.target = { title: 'Monthly Collection Target', mod: 'target', group: true, render() {
  const D = D_(), idx = scopeIdx(); if (!idx.length) return empty('No branches in your scope for these filters.');
  const rows = branchRows(D, idx), data = rollup(rows, App.f.group), T = finishTotals(rows, '');
  const cfg = Store.get('config'), ym = ymOf(D);
  const months = []; for (let m = 4; m <= +SRC.today.slice(5, 7); m++) months.push(m);
  const mbtn = months.map(m => { const dd = Math.min(TODAY, monthEnd(E.dn(`2026-${String(m).padStart(2, '0')}-01`))); return `<button class="tab${E.ds(dd).slice(0, 7) === ym ? ' on' : ''}" data-act="setDate" data-v="${E.ds(dd)}">${MON[m - 1]}</button>`; }).join('');
  const lab = { branch: 'Branch', region: 'Region · Regional Director', zone: 'Zone · Zonal Director', rd: 'Regional Director', zd: 'Zonal Director', type: 'School type', group: 'Group' }[App.f.group];
  const cols = [{ h: lab, k: r => r.name, t: 'text', cls: 'sticky wrap', w: 190 }, ...(App.f.group === 'branch' ? [{ h: 'Zonal Director', k: r => r.zdName, t: 'text' }, { h: 'Regional Director', k: r => r.rdName, t: 'text' }] : [{ h: 'Branches', k: r => r.count, t: 'num' }]),
    { h: 'Opening outstanding (1st)', k: r => r.mOpen, t: 'inr' }, { h: 'Target %', k: r => r.mPct, t: 'pct' }, { h: 'Monthly target', k: r => r.mTarget, t: 'inr', cls: 'em' },
    { h: 'Collected vs opening dues', k: r => r.mColOpen, t: 'inr' }, { h: 'Collected vs fresh dues', k: r => r.mColFresh, t: 'inr' }, { h: 'Advance (separate)', k: r => r.mAdv, t: 'inr' },
    { h: 'Actual for target', k: r => r.mAch, t: 'inr', cls: 'em' }, { h: 'Achievement', k: r => `${PCT(r.mAchPct)} ${chip(Calc.rag('ach', r.mAchPct, r.mPace), ' ')}`, t: 'html', x: r => r.mAchPct },
    { h: 'Shortfall / excess', k: r => r.mAch - r.mTarget, t: 'inr', rc: r => r.mAch - r.mTarget < 0 ? 'red' : 'green' }, { h: 'Remaining', k: r => r.mRem, t: 'inr' }, { h: 'Daily required', k: r => r.mDaily, t: 'inr' },
    { h: 'Projected month-end', k: r => r.mProj, t: 'pct' }, { h: 'Fresh dues in month', k: r => r.mFresh, t: 'inr' }, { h: 'New admissions', k: r => r.mNewN, t: 'num' }];
  const rem = rows[0];
  const head = `<div class="tabs">${mbtn}</div><div class="strip">
    <div><span>Opening outstanding on 1 ${MON[+ym.slice(5) - 1]}</span><b>${INR(T.mOpen)}</b></div><div><span>Target</span><b>${INR(T.mTarget)}</b></div>
    <div><span>Actual for target${cfg.freshCounts ? ' (incl. fresh dues)' : ' (opening dues only)'}${cfg.advanceCounts ? ' + advance' : ''}</span><b>${INR(T.mAch)}</b></div><div><span>Achievement</span><b>${PCT(T.mAchPct)}</b>${bar(T.mAchPct, Calc.rag('ach', T.mAchPct, T.mPace))}</div>
    <div><span>Shortfall / excess</span><b class="${T.mAch - T.mTarget < 0 ? 'red' : 'green'}">${INR(T.mAch - T.mTarget)}</b></div><div><span>Daily required · ${rem.mRemWD} of ${workDays(monthStart(D), monthEnd(D))} working days left</span><b>${INR(T.mDaily)}</b></div></div>`;
  const rule = `<div class="note"><b>Rule:</b> Monthly target = ${cfg.targetPct}% × opening outstanding on the first calendar day of the month${Object.keys(cfg.branchPct).length ? `; ${Object.keys(cfg.branchPct).length} branch-specific percentages approved` : ''}. The target stays fixed for the month: fresh dues, new admissions and advance collection are shown separately and do not change it. Achievement counts collection against the opening outstanding${cfg.freshCounts ? ' and against dues that fell due during the month' : ''}${cfg.advanceCounts ? ', plus advance' : ''} (Finance settings). Roll-ups add the branch targets. ${T.mTarget && rows.some(r => r.mFrozen) ? 'Targets for this month are frozen.' : 'Targets for this month are provisional until Finance freezes them.'}</div>`;
  return `${card(`Target for ${MON[+ym.slice(5) - 1]} ${ym.slice(0, 4)} · as on ${dLabel(D)}`, head)}${rule}${card('Target versus achievement · ' + esc(scopeLabel()), table('target', cols, data, { total: T, rowAct: App.f.group === 'branch' ? 'openBranch' : null, rowKey: r => r.id, title: 'Monthly Collection Target' }), { right: exportBtns('target', 'target') })}`;
} };

/* ---------- Instalment dues ---------- */
PAGES.instalment = { title: 'Instalment-wise Dues & Outstanding', mod: 'instalment', group: true, render() {
  const D = D_(), idx = scopeIdx(); if (!idx.length) return empty('No branches in your scope for these filters.');
  const up = !!App.ui.showUpcoming;
  const rows = branchRows(D, idx), data = rollup(rows, App.f.group), T = finishTotals(rows, '');
  const ic = instCols(D, up);
  let sn = 0;
  const cols = [{ h: 'S. No.', k: r => r.isTotal && App.f.group === 'branch' ? '' : (r._sn || ''), t: 'text', noexp: false }, { h: 'Region / Zone', k: r => r.region ? `${r.region} / ${r.zone}` : '', t: 'text' }, { h: 'Regional / Zonal Director', k: r => [r.rdName, r.zdName].filter(Boolean).join(' / '), t: 'text' }, { h: { branch: 'Branch', region: 'Region · Regional Director', zone: 'Zone · Zonal Director', rd: 'Regional Director', zd: 'Zonal Director', type: 'School type', group: 'Group' }[App.f.group], k: r => r.name, t: 'text', cls: 'sticky wrap', w: 190 },
    { h: 'Net fee (annual)', k: r => r.annual, t: 'inr' }, ...(A.pyK >= 0 ? [{ h: 'Previous year due', k: r => r.inst[A.pyK].bal, t: 'inr' }] : [])];
  ic.forEach(({ it, k }) => {
    if (it._due <= D) cols.push({ h: `${it.name} due`, k: r => r.inst[k].due, t: 'inr' }, { h: `${it.name} paid`, k: r => r.inst[k].paid, t: 'inr' }, { h: `${it.name} balance`, k: r => r.inst[k].bal, t: 'inr', cls: 'em' });
    else cols.push({ h: `${it.name} (due ${dLabel(it._due).slice(0, -5)}) advance received`, k: r => r.inst[k].paid, t: 'inr', cls: 'muted' });
  });
  cols.push({ h: 'Total due till date', k: r => r.due, t: 'inr' }, { h: 'Total paid till date', k: r => r.paid, t: 'inr' }, { h: 'Net outstanding', k: r => r.os, t: 'inr', cls: 'em' }, { h: 'Zero payer count', k: r => r.zpN, t: 'num' }, { h: 'Zero payer amount', k: r => r.zpAmt, t: 'inr', rc: r => r.zpOver ? 'red' : '' },
    { h: 'Partial payers', k: r => r.ptN, t: 'num' }, { h: 'Fully paid', k: r => r.fullN, t: 'num' }, { h: 'Due %', k: r => r.duePct, t: 'pct' }, { h: 'Collection %', k: r => r.colPct, t: 'pct' });
  data.forEach(r => r._sn = String(++sn));
  // reconciliation banner on the uploaded report's date
  let rec = '';
  if (D === REPORT_DAY && idx.length === DATA.branches.length && !App.f.region) {
    const g = SRC.source.grand, i1 = A.sched.findIndex(x => x.key === 'I1');
    const ok = Math.abs(T.inst[i1].due - g.netFee) < 1 && Math.abs(T.inst[i1].paid - g.paid) < 1 && Math.abs(T.inst[A.pyK].bal - g.pyDue) < 1;
    rec = `<div class="note ${ok ? 'ok' : 'bad'}"><b>${ok ? 'Reconciled' : 'Not reconciled'} with the uploaded report (21 Jul 2026):</b> Instalment 1 net fee ${INR(T.inst[i1].due)} vs ${INR(g.netFee)}, paid ${INR(T.inst[i1].paid)} vs ${INR(g.paid)}, previous-year dues ${INR(T.inst[A.pyK].bal)} vs ${INR(g.pyDue)}.</div>`;
  }
  const quick = [['Today', SRC.today], ['Month start', E.ds(monthStart(D))], ['Previous month end', E.ds(monthStart(D) - 1)], ['Report date 21 Jul 2026', SRC.source.asOn], ['Year start', '2026-04-01']];
  const datebar = `<div class="datebar"><label class="fld"><span>Outstanding as on date</span><input type="date" id="osDate" data-f="date" value="${App.f.date}" min="2026-04-01" max="${SRC.today}"></label><div class="btnrow">${quick.map(([l, d]) => `<button class="btn sm${d === App.f.date ? ' primary' : ''}" data-act="setDate" data-v="${d}">${l}</button>`).join('')}</div><span class="small muted">Dues, collections and outstanding are recalculated for the chosen date from the daily snapshots.</span></div>`;
  const agCols = [{ h: { branch: 'Branch', region: 'Region · Regional Director', zone: 'Zone · Zonal Director', rd: 'Regional Director', zd: 'Zonal Director', type: 'School type', group: 'Group' }[App.f.group], k: r => r.name, t: 'text', cls: 'wrap' }, { h: '0–30 days', k: r => r.ag[0], t: 'inr' }, { h: '31–60 days', k: r => r.ag[1], t: 'inr' }, { h: '61–90 days', k: r => r.ag[2], t: 'inr' }, { h: '91–180 days', k: r => r.ag[3], t: 'inr' }, { h: 'Above 180 days', k: r => r.ag[4], t: 'inr', cls: 'em' }, { h: 'Total outstanding', k: r => r.os, t: 'inr' }];
  return `${datebar}${rec}${card(`Instalment-wise dues as on ${dLabel(D)} · ${esc(scopeLabel())}`, table('inst', cols, data, { total: T, rowAct: App.f.group === 'branch' ? 'openBranch' : null, rowKey: r => r.id, title: 'Instalment-wise Due and Outstanding Report' }), { right: `<label class="chk"><input type="checkbox" id="upc" data-act="toggleUi" data-k="showUpcoming" ${up ? 'checked' : ''}> Show upcoming instalments</label>${exportBtns('inst', 'instalment')}`, sub: `Columns follow the instalment schedule for AY ${Store.get('config').ay}: ${ic.filter(x => x.it._due <= D).length} instalment(s) due by this date.` })}
  ${card('Outstanding ageing', table('ageing', agCols, data, { total: T, title: 'Outstanding Ageing' }), { right: exportBtns('ageing', 'instalment', { label: false }), sub: 'Days past each instalment due date' })}`;
} };

/* ---------- Zero payer analysis ---------- */
function zpView(x, dues) {
  if (dues === 'py') { const k = A.pyK; const t = x.inst[k]; if (!t || !t.due) return null; return { due: t.due, paid: t.paid, os: t.bal, zero: t.paid <= 0.005 }; }
  if (dues === 'cur') { if (x.curDue <= 0.005) return null; const paid = x.curDue - x.curBal; return { due: x.curDue, paid, os: x.curBal, zero: paid <= 0.005 }; }
  if (x.due <= 0.005) return null; return { due: x.due, paid: x.paid, os: x.os, zero: x.paid <= 0.005 };
}
const AGE = ['0–30', '31–60', '61–90', '91–180', '180+'];
const oldestAge = x => { for (let i = 4; i >= 0; i--) if (x.ag[i] > 0.5) return AGE[i] + ' days'; return '—'; };
PAGES.zeropayer = { title: 'Zero Payer Analysis', mod: 'zeropayer', render() {
  const D = D_(), idx = scopeIdx(); if (!idx.length) return empty('No branches in your scope for these filters.');
  const pt = App.ui.zpType || 'zero', dues = App.ui.zpDues || 'all', by = App.ui.zpBy || 'branch';
  const S = E.studentsAt(DATA, A, D), set = new Set(idx), iso = E.ds(D);
  const keyOf = { branch: s => DATA.branches[s.b].name, class: s => DATA.branches[s.b].name + ' · ' + s.cls, section: s => DATA.branches[s.b].name + ' · ' + s.cls + ' ' + s.sec, region: s => regionLabel(DATA.branches[s.b]), zone: s => zoneLabel(DATA.branches[s.b]), group: () => 'Group consolidated' }[by];
  const G = new Map(); const studs = [];
  S.forEach(x => {
    if (!x || !set.has(x.s.b)) return; const v = zpView(x, dues); if (!v) return;
    const k = keyOf(x.s); if (!G.has(k)) G.set(k, { name: k, b: x.s.b, n: 0, zpN: 0, zpAmt: 0, ptN: 0, ptAmt: 0, due: 0, os: 0, brs: new Set() });
    const g = G.get(k); g.n++; g.due += v.due; g.os += v.os; g.brs.add(x.s.b);
    if (v.zero) { g.zpN++; g.zpAmt += v.os; } else if (v.os > 0.005) { g.ptN++; g.ptAmt += v.os; }
    if ((pt === 'zero' && v.zero) || (pt === 'partial' && !v.zero && v.os > 0.005) || (pt === 'both' && v.os > 0.005)) studs.push({ x, v, key: k });
  });
  const grows = [...G.values()].map(g => { const lim = by === 'branch' ? Calc.zpLimit(DATA.branches[g.b]) : [...g.brs].reduce((a, b) => a + Calc.zpLimit(DATA.branches[b]), 0); return Object.assign(g, { lim, over: by === 'branch' || by === 'region' || by === 'zone' || by === 'group' ? g.zpAmt > lim : false, share: g.os ? g.zpAmt / g.os * 100 : 0 }); }).sort((a, b) => b.zpAmt - a.zpAmt);
  const T = { name: '', n: 0, zpN: 0, zpAmt: 0, ptN: 0, ptAmt: 0, os: 0, lim: 0 }; grows.forEach(g => ['n', 'zpN', 'zpAmt', 'ptN', 'ptAmt', 'os'].forEach(k => T[k] += g[k])); T.share = T.os ? T.zpAmt / T.os * 100 : 0;
  const showLim = !['class', 'section'].includes(by);
  const cols = [{ h: { branch: 'Branch', class: 'Branch · class', section: 'Branch · class · section', region: 'Region · Regional Director', zone: 'Zone · Zonal Director', group: 'Group' }[by], k: r => r.name, t: 'text', cls: 'wrap' }, { h: 'Students with dues', k: r => r.n, t: 'num' }, { h: 'Zero payer count', k: r => r.zpN, t: 'num', cls: 'em' }, { h: 'Zero payer outstanding', k: r => r.zpAmt, t: 'inr', cls: 'em', rc: r => r.over ? 'red' : '' }, ...(showLim ? [{ h: 'Limit (Finance)', k: r => r.lim, t: 'inr' }] : []), { h: 'Share of outstanding', k: r => r.share, t: 'pct' }, { h: 'Partial payers', k: r => r.ptN, t: 'num' }, { h: 'Partial payer outstanding', k: r => r.ptAmt, t: 'inr' }, { h: 'Total outstanding', k: r => r.os, t: 'inr' }];
  const sel = (k, v, opts) => `<label class="fld"><span>${k}</span><select data-act="uiSel" data-k="${v}">${opts.map(([a, b]) => `<option value="${a}" ${(App.ui[v] || opts[0][0]) === a ? 'selected' : ''}>${b}</option>`).join('')}</select></label>`;
  const ctrls = `<div class="ctrls">${sel('Show students', 'zpType', [['zero', 'Complete zero payers'], ['partial', 'Partial payers'], ['both', 'Zero and partial payers']])}${sel('Dues', 'zpDues', [['all', 'All dues till date'], ['py', 'Previous year dues only'], ['cur', 'Current academic year dues only']])}${sel('Group by', 'zpBy', [['branch', 'Branch'], ['class', 'Class'], ['section', 'Section'], ['region', 'Region'], ['zone', 'Zone'], ['group', 'Group']])}</div>`;
  const drill = App.ui.zpDrill && G.has(App.ui.zpDrill) ? App.ui.zpDrill : null;
  const list = (drill ? studs.filter(s => s.key === drill) : studs).sort((a, b) => b.v.os - a.v.os);
  const stCols = [{ h: 'Student', k: r => r.x.s.name, t: 'text' }, { h: 'Admission no.', k: r => r.x.s.adm, t: 'text' }, { h: 'Branch', k: r => DATA.branches[r.x.s.b].name, t: 'text', cls: 'wrap' }, { h: 'Class', k: r => r.x.s.cls, t: 'text' }, { h: 'Section', k: r => r.x.s.sec, t: 'text' }, { h: 'Parent mobile', k: r => r.x.s.mobile, t: 'text' }, { h: 'Total due', k: r => r.v.due, t: 'inr' }, { h: 'Total paid', k: r => r.v.paid, t: 'inr' }, { h: pt === 'zero' ? 'Zero payer outstanding' : 'Outstanding', k: r => r.v.os, t: 'inr', cls: 'em' }, { h: 'Overdue ageing', k: r => oldestAge(r.x), t: 'text' }, { h: 'Status', k: r => r.v.zero ? 'Zero payer' : 'Partial', t: 'text' }];
  const studCard = can('zeropayer', 'View student-level details') ? card(`${drill ? esc(drill) + ' · ' : ''}${NUM(list.length)} ${pt === 'zero' ? 'zero payer' : pt === 'partial' ? 'partial payer' : 'zero and partial payer'} students`, table('zpStud', stCols, list, { limit: 50, rowAct: 'openStudent', rowKey: r => r.x.s.id, title: 'Zero Payer Student List' }), { right: `${drill ? `<button class="btn sm ghost" data-act="ui" data-k="zpDrill" data-v="">Show all</button>` : ''}${exportBtns('zpStud', 'zeropayer', { label: false })}`, sub: 'Mobile numbers are masked in this demo. Select a student for the fee ledger.' }) : '';
  const lim = Store.get('config');
  return `<div class="kpis k4"><div class="kpi"><div class="kpi-l">Zero payer students</div><div class="kpi-v">${NUM(T.zpN)}</div><div class="kpi-s">of ${NUM(T.n)} students with dues</div></div><div class="kpi"><div class="kpi-l">Zero payer outstanding</div><div class="kpi-v ${grows.some(g => g.over) ? 'red' : ''}">${INRS(T.zpAmt)}</div><div class="kpi-s">${PCT(T.share)} of outstanding · ${grows.filter(g => g.over).length} over limit</div></div><div class="kpi"><div class="kpi-l">Partial payers</div><div class="kpi-v">${NUM(T.ptN)}</div><div class="kpi-s">${INRS(T.ptAmt)} outstanding</div></div><div class="kpi"><div class="kpi-l">Default branch limit</div><div class="kpi-v">${INRS(lim.zpLimitDefault)}</div><div class="kpi-s">${Object.keys(lim.zpLimit).length} branch overrides · set by Finance</div></div></div>
  ${card('Zero payer analysis · ' + esc(scopeLabel()), ctrls + table('zp', cols, grows, { total: T, rowAct: 'zpDrill', rowKey: r => r.name, title: 'Zero Payer Analysis' }), { right: exportBtns('zp', 'zeropayer'), sub: 'Zero payer: no payment against the amount due as on the selected date. Red = above the limit set by Finance. Select a row to list its students.' })}${studCard}`;
} };

/* ---------- Students drill-down ---------- */
PAGES.students = { title: 'Student Corner', mod: 'students', sf: true, render() {
  const D = D_(), idx = scopeIdx(); if (!idx.length) return empty('No branches in your scope for these filters.');
  if (!can('students', 'View student-level details')) return noAccess('student-level details');
  const q = (App.ui.scQ || '').toLowerCase().trim(), ps = App.ui.scPay || '', stt = App.ui.scStatus || '';
  const L = Str.list(D, idx, { all: true }).filter(x => (!q || x.s.name.toLowerCase().includes(q) || x.s.adm.toLowerCase().includes(q) || x.s.mobile.includes(q) || x.s.parent.toLowerCase().includes(q)) && (!ps || Str.payStatus(x) === ps) && (!stt || x.s.status === stt)).sort((a, b) => b.os - a.os);
  const ctl = `<div class="ctrls"><label class="fld grow"><span>Search name, admission no., parent or mobile</span><input id="scQ" type="search" value="${esc(App.ui.scQ || '')}" data-act="uiInput" data-k="scQ" placeholder="e.g. Ayesha, B21-26014, 98"></label><label class="fld"><span>Payment status</span><select data-act="uiSel" data-k="scPay"><option value="">All</option>${['Fully Paid', 'Partly Paid', 'Overdue', 'Zero Payer', 'Advance', 'Not due'].map(x => `<option ${ps === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label><label class="fld"><span>Student status</span><select data-act="uiSel" data-k="scStatus"><option value="">All</option>${['New Admission', 'Renewal', 'Continuing', 'Transferred', 'Re-admission', 'Withdrawn', 'Cancelled'].map(x => `<option ${stt === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label></div>`;
  const brn = x => DATA.branches[x.s.b];
  const full = [{ h: 'Student name', k: x => x.s.name, t: 'text' }, { h: 'Admission number', k: x => x.s.adm, t: 'text' }, { h: 'Academic year', k: () => CUR_AY, t: 'text' }, { h: 'Region', k: x => brn(x).region, t: 'text' }, { h: 'Zone', k: x => brn(x).zone, t: 'text' }, { h: 'Branch', k: x => brn(x).name, t: 'text' }, { h: 'School type', k: x => brn(x).type, t: 'text' }, { h: 'Class', k: x => x.s.cls, t: 'text' }, { h: 'Section', k: x => x.s.sec, t: 'text' }, { h: 'Parent name', k: x => x.s.parent, t: 'text' }, { h: 'Parent mobile', k: x => x.s.mobile, t: 'text' }, { h: 'Admission date', k: x => E.ds(x.s.enrol), t: 'text' }, { h: 'Admission source', k: x => x.s.source, t: 'text' }, { h: 'Counsellor', k: x => x.s.counsellor ? (userById(x.s.counsellor) || {}).name || '' : '', t: 'text' }, { h: 'Student status', k: x => x.s.status, t: 'text' }, { h: 'Student category', k: x => Str.catName('student', x.s.stCat), t: 'text' }, { h: 'Fee category', k: x => Str.catName('fee', x.s.feeCat), t: 'text' }, { h: 'Gross annual fee', k: x => x.s.gross, t: 'inr' }, { h: 'Concession', k: x => x.s.concAmt, t: 'inr' }, { h: 'Scholarship', k: x => x.s.schol, t: 'inr' }, { h: 'Net annual fee', k: x => x.s.annual, t: 'inr' }, { h: 'Amount collected', k: x => x.paid + x.adv, t: 'inr' }, { h: 'Outstanding', k: x => x.os, t: 'inr' }, { h: 'Payment status', k: x => Str.payStatus(x), t: 'text' }, { h: 'Last payment date', k: x => { const d = Str.lastPay(x.s, D); return d == null ? '' : E.ds(d); }, t: 'text' }, { h: 'Withdrawal / cancellation date', k: x => x.s.exit ? E.ds(x.s.exit) : '', t: 'text' }];
  table('cornerFull', full, L, { title: 'Student Corner', limit: 1 });
  const shown = [{ h: 'Student', k: x => `${esc(x.s.name)}<br><span class="muted small">${esc(x.s.adm)}</span>`, t: 'html', x: x => x.s.name }, { h: 'Branch', k: x => brn(x).name, t: 'text', cls: 'wrap' }, { h: 'Class', k: x => x.s.cls + ' ' + x.s.sec, t: 'text' }, { h: 'Status', k: x => x.s.status, t: 'text' }, { h: 'Category', k: x => Str.catName('student', x.s.stCat), t: 'text' }, { h: 'Fee category', k: x => Str.catName('fee', x.s.feeCat), t: 'text' }, { h: 'Parent mobile', k: x => x.s.mobile, t: 'text' }, { h: 'Net fee', k: x => x.s.annual, t: 'inr' }, { h: 'Collected', k: x => x.paid + x.adv, t: 'inr' }, { h: 'Outstanding', k: x => x.os, t: 'inr', cls: 'em' }, { h: 'Payment status', k: x => { const p = Str.payStatus(x); return pill(p, { 'Zero Payer': 'bad', Overdue: 'bad', 'Partly Paid': 'warn', 'Fully Paid': 'ok' }[p] || ''); }, t: 'html', x: x => Str.payStatus(x) }];
  const tot = L.reduce((a, x) => (a.n++, a.net += x.s.annual, a.col += x.paid + x.adv, a.os += x.os, a), { n: 0, net: 0, col: 0, os: 0 });
  const single = idx.length === 1 || App.f.branch;
  return `${single ? classCard(App.f.branch ? DATA.branches.findIndex(b => b.id === App.f.branch) : idx[0], D) : ''}${card(`${NUM(tot.n)} students · ${INRS(tot.net)} net fee · ${INRS(tot.col)} collected · ${INRS(tot.os)} outstanding`, ctl + table('corner', shown, L, { limit: 50, rowAct: 'openStudent', rowKey: x => x.s.id, title: 'Student Corner' }), { right: exportBtns('cornerFull', 'students', { label: false }), sub: 'Use the filters above for branch, class, section, category, fee category, source and counsellor. Downloads include every profile field. Select a student for the full profile and fee ledger.' })}`;
} };
function openStudent(id) {
  const s = DATA.students[+id]; if (!s) return;
  const D = D_(), x = E.studentsAt(DATA, A, D)[s.id];
  const rows = [];
  if (s._py) rows.push({ name: 'Previous Year Dues', due: s._py.due, amt: s._py.amt, k: s._py.k });
  s._items.forEach(it => rows.push({ name: it.k >= 0 ? A.sched[it.k].name : 'Approved adjustment', due: it.due, amt: it.amt, k: it.k }));
  const ledger = rows.map(r => { const t = x && x.inst[r.k] ? x.inst[r.k] : { paid: 0, bal: 0 }; const st = r.due > D ? 'Upcoming' : t.bal <= 0.5 ? 'Paid' : t.paid > 0 ? 'Part paid' : 'Unpaid'; return `<tr><td>${esc(r.name)}</td><td>${dLabel(r.due)}</td><td class="n">${INR(r.amt)}</td><td class="n">${INR(t.paid)}</td><td class="n">${r.due > D ? '—' : INR(t.bal)}</td><td>${pill(st, { Paid: 'ok', 'Part paid': 'warn', Unpaid: 'bad' }[st] || '')}</td></tr>`; }).join('');
  const rc = s.rc.filter(r => r.d <= D).map(r => `<tr><td>${dLabel(r.d)}</td><td>${esc(r.no)}</td><td>${r.kind === 'PY' ? 'Previous year' : 'Current year'}</td><td>${esc(E.MODES[r.mode] || '')}</td><td>${esc(r.type || (r.amt < 0 ? 'Reversal' : 'Receipt'))}</td><td class="n ${r.amt < 0 ? 'red' : ''}">${INR(r.amt)}</td></tr>`).join('');
  const adj = Store.get('adjustments').list.filter(a => a.studentId === s.id);
  const lp = Str.lastPay(s, D), bb = DATA.branches[s.b];
  const body = `<dl class="dl cols"><div><dt>Academic year</dt><dd>${CUR_AY}</dd></div><div><dt>Region / zone</dt><dd>${esc(bb.region)} · ${esc(bb.zone)}</dd></div><div><dt>School type</dt><dd>${esc(bb.type)}</dd></div><div><dt>Parent name</dt><dd>${esc(s.parent)}</dd></div><div><dt>Admission date</dt><dd>${dLabel(s.enrol)}</dd></div><div><dt>Admission source</dt><dd>${esc(s.source)}</dd></div><div><dt>Admissions counsellor</dt><dd>${esc(s.counsellor ? (userById(s.counsellor) || {}).name || '' : '—')}</dd></div><div><dt>Student status</dt><dd>${esc(s.status)}</dd></div><div><dt>Student category</dt><dd>${esc(Str.catName('student', s.stCat))}</dd></div><div><dt>Fee category</dt><dd>${esc(Str.catName('fee', s.feeCat))}</dd></div><div><dt>Scholarship</dt><dd>${INR(s.schol)}</dd></div><div><dt>Amount collected</dt><dd>${x ? INR(x.paid + x.adv) : '—'}</dd></div><div><dt>Outstanding</dt><dd>${x ? INR(x.os) : '—'}</dd></div><div><dt>Payment status</dt><dd>${x ? esc(Str.payStatus(x)) : '—'}</dd></div><div><dt>Last payment date</dt><dd>${lp != null ? dLabel(lp) : '—'}</dd></div><div><dt>Withdrawal / cancellation</dt><dd>${s.exit ? `${esc(s.status)} · ${dLabel(s.exit)} · ${esc(s.exitReason || '')}${s.exitRefund ? ' · refund ' + INR(s.exitRefund) : ''}` : '—'}</dd></div></dl><dl class="dl cols"><div><dt>Admission no.</dt><dd>${esc(s.adm)}</dd></div><div><dt>Branch</dt><dd>${esc(DATA.branches[s.b].name)}</dd></div><div><dt>Class / section</dt><dd>${esc(s.cls)} ${esc(s.sec)}</dd></div><div><dt>Parent mobile</dt><dd>${esc(s.mobile)}</dd></div><div><dt>Gross annual fee</dt><dd>${INR(s.gross)}</dd></div><div><dt>Concession</dt><dd>${s.concAmt ? INR(s.concAmt) : '—'}</dd></div><div><dt>Net annual fee</dt><dd>${s.noPlan ? '<span class="red">No fee plan in ERP</span>' : INR(s.annual)}</dd></div><div><dt>Status on ${dLabel(D)}</dt><dd>${x ? pill(x.status) : 'Not yet admitted'}</dd></div></dl>
  <h4>Fee ledger</h4><div class="tbl-wrap"><table class="tbl mini"><thead><tr><th>Fee head</th><th>Due date</th><th class="n">Amount</th><th class="n">Paid</th><th class="n">Balance</th><th>Status</th></tr></thead><tbody>${ledger || '<tr><td colspan="6">No fee plan.</td></tr>'}</tbody></table></div>
  <h4>Receipts (from ERP)</h4><div class="tbl-wrap"><table class="tbl mini"><thead><tr><th>Date</th><th>Receipt no.</th><th>Fee year</th><th>Mode</th><th>Type</th><th class="n">Amount</th></tr></thead><tbody>${rc || '<tr><td colspan="6">No receipts up to this date.</td></tr>'}</tbody></table></div>
  ${adj.length ? `<h4>Approved adjustments</h4><ul>${adj.map(a => `<li>${INR(a.amount)} on ${isoLabel(a.date)} · ${esc(a.reason)} (approved by ${esc(a.approver)})</li>`).join('')}</ul>` : ''}<p class="muted small">ERP-synced figures cannot be edited here. Corrections go through a maker-checker adjustment.</p>`;
  modal(`${s.name}`, body, `${!s.exit && can('cancel', 'Add') ? `<button class="btn" data-act="exitNew" data-k="${s.id}">Record cancellation / withdrawal</button>` : ''}${can('approvals', 'Add') ? `<button class="btn" data-act="newAdj" data-k="${s.id}">Request adjustment</button>` : ''}<button class="btn primary" data-act="closeModal">Close</button>`, true);
}

/* ---------- Alerts / exceptions pages ---------- */
PAGES.alerts = { title: 'Alerts & Escalations', mod: 'alerts', render() {
  const D = D_(), idx = scopeIdx(); const al = alertsFor(D, idx);
  const sev = App.ui.alSev || '';
  const list = al.filter(a => !sev || a.sev === sev);
  const counts = { r: al.filter(a => a.sev === 'r').length, a: al.filter(a => a.sev === 'a').length, i: al.filter(a => a.sev === 'i').length };
  const t = table('alerts', [{ h: 'Severity', k: a => `<span class="sevtag ${a.sev}">${{ r: 'Critical', a: 'Warning', i: 'Info' }[a.sev]}</span>`, t: 'html', x: a => ({ r: 'Critical', a: 'Warning', i: 'Info' }[a.sev]) }, { h: 'Alert', k: a => a.rule, t: 'text' }, { h: 'Branch', k: a => a.b ? a.b.name : 'All', t: 'text', cls: 'wrap' }, { h: 'Detail', k: a => a.text, t: 'text', cls: 'wrap' }, { h: 'Channels', k: () => 'Dashboard · Email', t: 'text' }], list, { title: 'Alerts', limit: 80 });
  const tabs = `<div class="tabs">${[['', `All (${al.length})`], ['r', `Critical (${counts.r})`], ['a', `Warning (${counts.a})`], ['i', `Info (${counts.i})`]].map(([k, l]) => `<button class="tab${k === sev ? ' on' : ''}" data-act="ui" data-k="alSev" data-v="${k}">${l}</button>`).join('')}</div>`;
  const ac = Store.get('config').alerts;
  const rules = `<ul class="rules"><li>Branch collection below daily required collection ${ac.belowDaily ? pill('On', 'ok') : pill('Off')}</li><li>Branch likely to miss monthly target (run-rate projection) ${ac.missTarget ? pill('On', 'ok') : pill('Off')}</li><li>Outstanding above ${Store.get('config').osLimitPct}% of fee due ${ac.osLimit ? pill('On', 'ok') : pill('Off')}</li><li>Zero payer outstanding above branch limit ${ac.zpLimit ? pill('On', 'ok') : pill('Off')}</li><li>Zero payer count up more than ${ac.zpIncreasePct}% in 7 days</li><li>Instalment due within ${ac.dueApproachDays} days</li><li>Overdue up more than ${ac.overdueIncreasePct}% in 7 days</li><li>No collection posted by ${ac.noCollectionBy}</li><li>ERP sync failure ${ac.syncFail ? pill('On', 'ok') : pill('Off')}</li><li>Reconciliation mismatch ${ac.recon ? pill('On', 'ok') : pill('Off')}</li><li>WhatsApp alerts ${pill('Future provision')}</li></ul>`;
  return `<div class="grid-main">${card(`Alerts on ${dLabel(D)} · ${esc(scopeLabel())}`, tabs + t, { right: exportBtns('alerts', 'alerts') })}${card('Alert rules', rules + (can('settings', 'Edit') ? '<button class="btn sm" data-act="go" data-r="settings">Edit thresholds</button>' : '<p class="muted small">Thresholds are set by Finance.</p>'))}</div>`;
} };
PAGES.exceptions = { title: 'Exceptions & Reconciliation', mod: 'exceptions', render() {
  const D = D_(), idx = scopeIdx(), res = Store.get('resolved');
  const show = App.ui.exShow || 'open';
  const X = Recon.list(D).filter(x => x.b == null || x.b < 0 || idx.includes(x.b)).filter(x => show === 'all' || (show === 'open' ? !res[x.id] : !!res[x.id]));
  const canRes = can('exceptions', 'Resolve sync exceptions');
  const t = table('exc', [{ h: 'Severity', k: a => `<span class="sevtag ${a.sev}">${{ r: 'Critical', a: 'Warning', i: 'Info' }[a.sev]}</span>`, t: 'html', x: a => a.sev }, { h: 'Exception', k: a => a.type, t: 'text' }, { h: 'Branch', k: a => a.b != null && a.b >= 0 ? DATA.branches[a.b].name : (a.src || 'All'), t: 'text', cls: 'wrap' }, { h: 'Detail', k: a => a.text, t: 'text', cls: 'wrap' }, { h: 'Status', k: a => res[a.id] ? `Resolved by ${esc(res[a.id].by)} · ${esc(res[a.id].reason)}` : (canRes ? `<button class="btn sm" data-act="resolveEx" data-k="${esc(a.id)}">Resolve</button>` : 'Open'), t: 'html', x: a => res[a.id] ? 'Resolved: ' + res[a.id].reason : 'Open' }], X, { title: 'Exception Report' });
  const R = Recon.branchDiffs(D).filter(x => idx.includes(x.i));
  const RT = { name: '', erp: 0, receipts: 0, report: 0, diff: 0 }; R.forEach(r => ['erp', 'receipts', 'report', 'diff'].forEach(k => RT[k] += r[k]));
  const rt = table('recon', [{ h: 'Branch', k: r => r.i != null ? DATA.branches[r.i].name : '', t: 'text', cls: 'wrap' }, { h: 'ERP payment ledger', k: r => r.erp, t: 'inr' }, { h: 'Receipt register', k: r => r.receipts, t: 'inr' }, { h: 'Report collection', k: r => r.report, t: 'inr' }, { h: 'Difference', k: r => r.diff, t: 'inr', rc: r => Math.abs(r.diff) > 0.5 ? 'red' : '' }, { h: 'Status', k: r => Math.abs(r.diff) > 0.5 ? pill('Mismatch', 'bad') : pill('Matched', 'ok'), t: 'html', x: r => Math.abs(r.diff) > 0.5 ? 'Mismatch' : 'Matched' }], R.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)), { total: RT, title: 'Payment Reconciliation', limit: 20 });
  const tabs = `<div class="tabs">${[['open', 'Open'], ['resolved', 'Resolved'], ['all', 'All']].map(([k, l]) => `<button class="tab${k === show ? ' on' : ''}" data-act="ui" data-k="exShow" data-v="${k}">${l}</button>`).join('')}</div>`;
  return `${card(`Exceptions as on ${dLabel(D)}`, tabs + t, { right: exportBtns('exc', 'exceptions'), sub: 'Checks run after every ERP sync: negative balances, receipt mapping, missing fee plans, duplicate receipts, sync failures and reconciliation differences. Source workbook checks are from the uploaded Excel.' })}${card('ERP payments vs receipts vs report (AY to date)', rt, { right: exportBtns('recon', 'exceptions', { label: false }) })}`;
} };

/* ---------- Email reports ---------- */
const MAIL_KINDS = [['Collection', 'Fee collection & outstanding'], ['Target', 'Target strength & capacity'], ['SRF', 'SRF incentives']];
function mailWrap(u, t, fill, kindLabel, D, items, tableHtml, extra) {
  return `<div class="mail"><div class="mail-logo"><img src="data:image/png;base64,${LOGO_B64}" alt="MS Education Academy"></div><div class="mail-h"><div><b>Subject:</b> ${esc(fill(t.subject))}</div><div><b>To:</b> ${esc(u.name)} &lt;${esc(u.email)}&gt;</div><div><b>Attachments:</b> ${esc(kindLabel)}_report_${E.ds(D)}.pdf · ${esc(kindLabel)}_report_${E.ds(D)}.xlsx</div></div><div class="mail-b"><p>${esc(fill(t.greeting))}</p><p>${esc(fill(t.intro))}</p><ul>${items.map(([k, v]) => `<li>${k}: <b>${v}</b></li>`).join('')}</ul>${tableHtml}${extra || ''}<p>${esc(fill(t.closing))}</p><p class="mail-link">Open your dashboard: <u>https://fees.msea.example/dashboard</u> (sign-in required; you will see only your branches)</p><p style="white-space:pre-line">${esc(t.signature)}</p></div></div>`;
}
function mailPortfolio(u, idx) { return u.role === 'Principal' && idx.length === 1 ? DATA.branches[idx[0]].name : u.role === 'Regional Director' ? `${u.region} region` : u.role === 'Zonal Director' ? `${u.zone} zone` : idx.length === DATA.branches.length ? 'Group' : `${idx.length} branches`; }
/* Target strength & capacity statement */
function emailTarget(u, D) {
  const t = Store.get('templates')['Target Strength'] || Store.get('templates').Management, idx = [...scopeOf(u)].filter(i => !DATA.branches[i].inactive && !DATA.branches[i].closed).sort((a, b) => a - b); if (!idx.length) return null;
  const rows = Str.rows(D, 'branch', idx).map(x => { const b = DATA.branches.find(y => y.id === x.bid), bi = DATA.branches.indexOf(b), tg = Str.branchTarget(b.id), cap = Str.branchCap(b.id, D) || null;
    return { name: b.name, existing: x.existing, gross: x.grossAdm || 0, exits: (x.canc || 0) + (x.wd || 0) + (x.outward || 0), net: x.netStrength, target: tg ? tg.target : null, gap: tg ? tg.target - x.netStrength : null, cap, util: cap ? x.existing / cap * 100 : null, req: tg ? Math.max(0, tg.target - x.existing) : null, rev: tg ? tg.revTarget : null, exp: tg ? Math.max(0, tg.target - x.existing) * tg.avgNet : null, status: !tg ? 'No plan' : tg.target - x.netStrength > 0 ? 'Below target' : 'On target', over: tg && cap && tg.target > cap }; });
  const T = rows.reduce((a, x) => { ['existing', 'gross', 'exits', 'net', 'target', 'cap', 'req', 'rev', 'exp'].forEach(k => a[k] = (a[k] || 0) + (x[k] || 0)); return a; }, { name: 'Total' }); T.gap = T.target - T.net; T.util = T.cap ? T.existing / T.cap * 100 : null; T.status = '';
  const fill = s => s.replace(/\{name\}/g, u.name.replace(' (demo)', '')).replace(/\{date\}/g, dLabel(D)).replace(/\{portfolio\}/g, mailPortfolio(u, idx));
  const items = [['Existing strength (ERP)', NUM(T.existing)], ['Gross admissions this year', NUM(T.gross)], ['Cancellations, withdrawals and transfers out', NUM(T.exits)], ['Net strength', NUM(T.net)], ['Target strength', NUM(T.target)], ['Gap to target', NUM(T.gap)], ['Approved capacity', NUM(T.cap)], ['Capacity utilisation', T.util != null ? PCT(T.util) : '—'], ['Students required', NUM(T.req)], ['Revenue target', INR(T.rev)], ['Expected revenue from pending admissions', INR(T.exp)], ['Branches below target', NUM(rows.filter(x => x.status === 'Below target').length)], ['Branches without an approved plan', NUM(rows.filter(x => x.status === 'No plan').length)]];
  const tableHtml = rows.length > 1 ? `<table class="mailtbl"><thead><tr><th>Branch</th><th>Existing</th><th>Net strength</th><th>Target</th><th>Gap</th><th>Capacity</th><th>Utilisation</th><th>Status</th></tr></thead><tbody>${rows.map(x => `<tr><td>${esc(x.name)}</td><td>${NUM(x.existing)}</td><td>${NUM(x.net)}</td><td>${x.target != null ? NUM(x.target) : '—'}</td><td${x.gap > 0 ? ' class="red"' : ''}>${x.gap != null ? NUM(x.gap) : '—'}</td><td${x.over ? ' class="red"' : ''}>${x.cap != null ? NUM(x.cap) : '—'}</td><td>${x.util != null ? PCT(x.util) : '—'}</td><td>${esc(x.status)}${x.over ? ' · above capacity' : ''}</td></tr>`).join('')}</tbody></table>` : '';
  const cols = [{ h: 'Branch', k: x => x.name, t: 'text' }, { h: 'Existing strength', k: x => x.existing, t: 'num' }, { h: 'Gross admissions', k: x => x.gross, t: 'num' }, { h: 'Exits', k: x => x.exits, t: 'num' }, { h: 'Net strength', k: x => x.net, t: 'num' }, { h: 'Target strength', k: x => x.target, t: 'num' }, { h: 'Gap', k: x => x.gap, t: 'num' }, { h: 'Approved capacity', k: x => x.cap, t: 'num' }, { h: 'Utilisation %', k: x => x.util, t: 'pct' }, { h: 'Students required', k: x => x.req, t: 'num' }, { h: 'Revenue target', k: x => x.rev, t: 'inr' }, { h: 'Expected revenue', k: x => x.exp, t: 'inr' }, { h: 'Status', k: x => x.status, t: 'text' }];
  return { kind: 'Target Strength', label: 'Target', subject: fill(t.subject), html: mailWrap(u, t, fill, 'Target_Strength', D, items, tableHtml), rows, T, idx, cols };
}
/* SRF incentive pending actions & summary, from the SRF module's live state within the user's branch scope */
function emailSRF(u, D) {
  const t = Store.get('templates')['SRF Incentive'] || Store.get('templates').Management; if (typeof SRF === 'undefined' || !SRF_BRIDGE.ready) return null;
  const S = SRF.S, idx = [...scopeOf(u)].filter(i => srfBranch(DATA.branches[i])).sort((a, b) => a - b); if (!idx.length) return null; const bids = new Set(idx.map(i => DATA.branches[i].id));
  const subs = S.subs.filter(s => bids.has(s.branch)), lines = subs.flatMap(s => s.adms.flatMap(a => a.lines)), amt = L => L.reduce((a, l) => a + l.amount, 0), iso = E.ds(D), month = iso.slice(0, 7), sla = SRF.curV().p.approval.slaDays || 7;
  const pend = subs.filter(s => ['Pending Accounts Verification', 'Pending L2 Verification', 'On Hold'].includes(s.status)), over = pend.filter(s => E.dn(iso) - E.dn(s.submittedAt) > sla);
  const toPay = lines.filter(l => l.pstatus === 'Pending HR Processing'), hold = lines.filter(l => l.pstatus === 'On Hold'), inBatch = lines.filter(l => ['In Batch', 'Included in Payroll', 'Payment Released'].includes(l.pstatus)), paidM = lines.filter(l => l.pstatus === 'Paid' && (l.paidOn || '').slice(0, 7) === month), rec = lines.filter(l => l.pstatus === 'Recovery Required'), revs = S.revs.filter(x => x.status === 'Pending' && subs.some(s => s.adms.some(a => a.lines.some(l => l.id === x.line))));
  const old = toPay.filter(l => { const s = subs.find(x => x.id === l.sub); return s && E.dn(iso) - E.dn(s.submittedAt) > 30; });
  const rows = [...bids].map(bid => { const ss = subs.filter(s => s.branch === bid), ll = ss.flatMap(s => s.adms.flatMap(a => a.lines)); return { bid, name: brName(bid), subs: ss.length, pend: ss.filter(s => ['Pending Accounts Verification', 'Pending L2 Verification', 'On Hold'].includes(s.status)).length, pendAmt: amt(ss.filter(s => ['Pending Accounts Verification', 'Pending L2 Verification', 'On Hold'].includes(s.status)).flatMap(s => s.adms.flatMap(a => a.lines))), toPay: ll.filter(l => l.pstatus === 'Pending HR Processing').length, toPayAmt: amt(ll.filter(l => l.pstatus === 'Pending HR Processing')), paid: amt(ll.filter(l => l.pstatus === 'Paid' && (l.paidOn || '').slice(0, 7) === month)), hold: ll.filter(l => l.pstatus === 'On Hold').length, rec: ll.filter(l => l.pstatus === 'Recovery Required').length }; }).filter(x => x.subs).sort((a, b) => b.pendAmt + b.toPayAmt - a.pendAmt - a.toPayAmt);
  const T = rows.reduce((a, x) => { ['subs', 'pend', 'pendAmt', 'toPay', 'toPayAmt', 'paid', 'hold', 'rec'].forEach(k => a[k] = (a[k] || 0) + x[k]); return a; }, { name: 'Total' });
  const fill = s => s.replace(/\{name\}/g, u.name.replace(' (demo)', '')).replace(/\{date\}/g, dLabel(D)).replace(/\{portfolio\}/g, mailPortfolio(u, idx));
  const items = [['Requests awaiting verification', `${NUM(pend.length)} (${INR(amt(pend.flatMap(s => s.adms.flatMap(a => a.lines))))})`], [`Awaiting verification beyond the ${sla}-day SLA`, NUM(over.length)], ['Verified incentives awaiting HR payment', `${NUM(toPay.length)} lines · ${INR(amt(toPay))}`], ['Awaiting payment beyond the payroll cycle (30 days)', NUM(old.length)], ['In payment batches / payroll', `${NUM(inBatch.length)} lines · ${INR(amt(inBatch))}`], ['Payments on hold', NUM(hold.length)], ['Paid this month', `${NUM(paidM.length)} lines · ${INR(amt(paidM))}`], ['Recovery required (receipt refunded after payment)', NUM(rec.length)], ['Reversals awaiting Corporate Finance', NUM(revs.length)]];
  const tableHtml = rows.length ? `<table class="mailtbl"><thead><tr><th>Branch</th><th>Requests</th><th>Awaiting verification</th><th>Amount</th><th>Awaiting payment</th><th>Amount</th><th>Paid this month</th><th>On hold</th><th>Recovery</th></tr></thead><tbody>${rows.map(x => `<tr><td>${esc(x.name)}</td><td>${NUM(x.subs)}</td><td>${NUM(x.pend)}</td><td>${INR(x.pendAmt)}</td><td>${NUM(x.toPay)}</td><td>${INR(x.toPayAmt)}</td><td>${INR(x.paid)}</td><td>${NUM(x.hold)}</td><td${x.rec ? ' class="red"' : ''}>${NUM(x.rec)}</td></tr>`).join('')}</tbody></table>` : '<p>No SRF incentive requests for your branches.</p>';
  const extra = over.length ? `<p><b>Overdue for verification</b></p><ol>${over.slice(0, 10).map(s => `<li>${esc(s.ref)} – ${esc(brName(s.branch))} – submitted ${isoLabel(s.submittedAt)} – ${INR(amt(s.adms.flatMap(a => a.lines)))} – ${esc(s.status)}</li>`).join('')}</ol>` : '';
  const cols = [{ h: 'Branch', k: x => x.name, t: 'text' }, { h: 'Requests', k: x => x.subs, t: 'num' }, { h: 'Awaiting verification', k: x => x.pend, t: 'num' }, { h: 'Amount awaiting verification', k: x => x.pendAmt, t: 'inr' }, { h: 'Awaiting payment', k: x => x.toPay, t: 'num' }, { h: 'Amount awaiting payment', k: x => x.toPayAmt, t: 'inr' }, { h: 'Paid this month', k: x => x.paid, t: 'inr' }, { h: 'On hold', k: x => x.hold, t: 'num' }, { h: 'Recovery required', k: x => x.rec, t: 'num' }];
  return { kind: 'SRF Incentive', label: 'SRF', subject: fill(t.subject), html: mailWrap(u, t, fill, 'SRF_Incentive', D, items, tableHtml, extra), rows, T, idx, cols };
}
function emailFor(u, D, mailKind) {
  if (mailKind === 'Target') return emailTarget(u, D); if (mailKind === 'SRF') return emailSRF(u, D);
  const tpl = Store.get('templates');
  const kind = u.role === 'Principal' ? 'Principal' : ['Regional Director', 'Zonal Director'].includes(u.role) ? 'Director' : 'Management';
  const idx = [...scopeOf(u)].sort((a, b) => a - b);
  if (!idx.length) return null;
  const rows = branchRows(D, idx), T = finishTotals(rows, '');
  const portfolio = kind === 'Principal' ? DATA.branches[idx[0]].name : u.role === 'Regional Director' ? `${u.region} region` : u.role === 'Zonal Director' ? `${u.zone} zone` : 'Group';
  const t = tpl[kind]; const fill = s => s.replace(/\{name\}/g, u.name.replace(' (demo)', '')).replace(/\{date\}/g, dLabel(D)).replace(/\{portfolio\}/g, portfolio);
  const items = [["Today's Collection", INR(T.tNet)], ['Month-to-Date Collection', INR(T.mAch)], ['Monthly Collection Target', INR(T.mTarget)], ['Target Achievement', PCT(T.mAchPct)], ['Remaining Target', INR(T.mRem)], ['Daily Required Collection', INR(T.mDaily)], ['Total Fee Due Till Date', INR(T.due)], ['Total Collection Till Date', INR(T.paid)], ['Net Outstanding', INR(T.os)], ['Overdue Outstanding', INR(T.od)], ['Zero Payer Students', NUM(T.zpN)], ['Zero Payer Outstanding Amount', INR(T.zpAmt)], ['Number of Defaulters', NUM(T.defN)]];
  let tableHtml = '';
  if (kind !== 'Principal') {
    const list = kind === 'Management' ? rollup(rows, 'region') : rows;
    tableHtml = `<table class="mailtbl"><thead><tr><th>${kind === 'Management' ? 'Region' : 'Branch'}</th><th>Collection</th><th>Monthly target</th><th>Achievement</th><th>Outstanding</th><th>Overdue</th><th>Zero payers</th><th>Zero payer outstanding</th></tr></thead><tbody>${list.map(r => `<tr><td>${esc(r.name)}</td><td>${INR(r.mAch)}</td><td>${INR(r.mTarget)}</td><td>${PCT(r.mAchPct)}</td><td>${INR(r.os)}</td><td>${INR(r.od)}</td><td>${NUM(r.zpN)}</td><td${r.zpOver ? ' class="red"' : ''}>${INR(r.zpAmt)}</td></tr>`).join('')}</tbody></table>`;
    if (kind === 'Management') tableHtml += `<p><b>Top 10 branches by zero payer outstanding</b></p><ol>${[...rows].sort((a, b) => b.zpAmt - a.zpAmt).slice(0, 10).map(r => `<li>${esc(r.name)} – ${INR(r.zpAmt)} (${NUM(r.zpN)} students)</li>`).join('')}</ol>`;
  }
  const html = `<div class="mail"><div class="mail-logo"><img src="data:image/png;base64,${LOGO_B64}" alt="MS Education Academy"></div><div class="mail-h"><div><b>Subject:</b> ${esc(fill(t.subject))}</div><div><b>To:</b> ${esc(u.name)} &lt;${esc(u.email)}&gt;</div><div><b>Attachments:</b> ${esc(kind)}_report_${E.ds(D)}.pdf · ${esc(kind)}_report_${E.ds(D)}.xlsx</div></div><div class="mail-b"><p>${esc(fill(t.greeting))}</p><p>${esc(fill(t.intro))}</p><ul>${items.map(([k, v]) => `<li>${k}: <b>${v}</b></li>`).join('')}</ul>${tableHtml}<p>${esc(fill(t.closing))}</p><p class="mail-link">Open your dashboard: <u>https://fees.msea.example/dashboard</u> (sign-in required; you will see only your branches)</p><p style="white-space:pre-line">${esc(t.signature)}</p></div></div>`;
  const cols = [{ h: 'Branch', k: r => r.name, t: 'text' }, { h: "Today's collection", k: r => r.tNet, t: 'inr' }, { h: 'MTD', k: r => r.mAch, t: 'inr' }, { h: 'Monthly target', k: r => r.mTarget, t: 'inr' }, { h: 'Achievement %', k: r => r.mAchPct, t: 'pct' }, { h: 'Daily required', k: r => r.mDaily, t: 'inr' }, { h: 'Due till date', k: r => r.due, t: 'inr' }, { h: 'Collected till date', k: r => r.paid, t: 'inr' }, { h: 'Net outstanding', k: r => r.os, t: 'inr' }, { h: 'Overdue', k: r => r.od, t: 'inr' }, { h: 'Zero payers', k: r => r.zpN, t: 'num' }, { h: 'Zero payer outstanding', k: r => r.zpAmt, t: 'inr' }, { h: 'Defaulters', k: r => r.defN, t: 'num' }];
  return { kind, label: 'Collection', subject: fill(t.subject), html, rows, T, idx, cols };
}
const MAIL_ROLES = { Collection: ['Principal', 'Regional Director', 'Zonal Director', 'Chairman', 'Vice Chairman / VCP', 'CEO', 'CFO', 'Corporate Finance'], Target: ['Principal', 'Regional Director', 'Zonal Director', 'Admissions Head', 'Chairman', 'Vice Chairman / VCP', 'CEO', 'CFO', 'Corporate Finance'], SRF: ['Principal', 'Accounts Executive', 'Finance Executive', 'Branch Accountant', 'Finance Manager', 'HR Officer', 'Corporate Finance', 'CFO', 'CEO', 'Auditor'] };
PAGES.email = { title: 'Daily Email Reports', mod: 'email', render() {
  const D = D_(), mk = MAIL_KINDS.some(([k]) => k === App.ui.mailKind) ? App.ui.mailKind : 'Collection';
  const rec = users().filter(u => u.status === 'Active' && MAIL_ROLES[mk].includes(u.role));
  const mine = scopeOf(App.user);
  const allowed = rec.filter(u => [...scopeOf(u)].every(i => mine.has(i)));
  const sel = App.ui.mailTo && allowed.find(u => u.id === App.ui.mailTo) ? App.ui.mailTo : (allowed.find(u => u.role === (mk === 'SRF' ? 'Accounts Executive' : 'Zonal Director')) || allowed[0] || {}).id;
  const u = userById(sel); const m = u ? emailFor(u, D, mk) : null;
  const kindSel = `<label class="fld"><span>Report</span><select data-act="uiSel" data-k="mailKind">${MAIL_KINDS.map(([k, l]) => `<option value="${k}" ${k === mk ? 'selected' : ''}>${l}</option>`).join('')}</select></label>`;
  const opts = MAIL_ROLES[mk].map(r => { const g = allowed.filter(x => x.role === r); return g.length ? `<optgroup label="${r}">${g.map(x => `<option value="${x.id}" ${x.id === sel ? 'selected' : ''}>${esc(x.name.replace(' (demo)', ''))}</option>`).join('')}</optgroup>` : ''; }).join('');
  const m365 = Store.get('emaildist').m365;
  const canSend = can('email', 'Email report');
  const log = Store.list('emaillog');
  const lt = table('mlog', [{ h: 'Sent', k: r => tsLabel(r.ts), t: 'text', x: r => r.ts }, { h: 'Recipient', k: r => r.to, t: 'text' }, { h: 'Subject', k: r => r.subject, t: 'text', cls: 'wrap' }, { h: 'Trigger', k: r => r.trigger, t: 'text' }, { h: 'Delivery status', k: r => pill(r.status, r.status === 'Delivered' ? 'ok' : r.status.startsWith('Failed') ? 'bad' : 'warn'), t: 'html', x: r => r.status }, { h: 'Failure reason', k: r => r.reason || '', t: 'text', cls: 'wrap' }, { h: '', k: r => canSend ? `<button class="btn sm" data-act="resend" data-k="${esc(r.id)}">Resend</button>` : '', t: 'html', noexp: true }], log, { title: 'Sent email history', empty: 'No emails sent from this app yet.', limit: 25 });
  const tplEdit = can('email', 'Configure email templates') ? `<button class="btn sm" data-act="editTpl" data-k="${m ? m.kind : 'Principal'}">Edit ${m ? m.kind : ''} template</button>` : '';
  const mailTitle = { Collection: 'Daily Email Reports', Target: 'Target Strength Email', SRF: 'SRF Incentive Email' }[mk];
  return `<div class="note ${m365.status === 'Connected' ? 'ok' : ''}"><b>Microsoft 365:</b> ${esc(m365.status)}. ${m365.status === 'Connected' ? '' : 'Emails from this demo are recorded in the history as “Simulated” and are not delivered. In production a server-side job sends them through Microsoft Graph after each validated ERP sync.'}${can('admin_email') ? ' <button class="linkish" data-act="go" data-r="admin_email">Email distribution settings →</button>' : ''}</div>
  <div class="grid-main">${card('Preview', `<div class="ctrls">${kindSel}<label class="fld grow"><span>Recipient (data follows their access scope)</span><select data-act="uiSel" data-k="mailTo">${opts}</select></label></div>${m ? m.html : empty('This recipient has no branch access.')}`, { right: tplEdit })}
  ${card('Send', `<p class="small">Sends the ${m ? m.kind.toLowerCase() : ''} report for ${dLabel(D)} to ${u ? esc(u.email) : '—'} with PDF and Excel attachments and a role-based dashboard link.</p>${canSend ? `<button class="btn primary" data-act="sendMail" data-k="${sel}" data-v="${mk}">Send now</button> <button class="btn" data-act="sendAll">Run today's distribution</button>` : '<p class="muted small">Your role cannot send reports.</p>'}<h4>Attachments</h4><div class="btnrow">${m ? `<button class="btn sm" data-act="mailAttach" data-k="${sel}" data-v="${mk}" data-fmt="pdf">PDF</button><button class="btn sm" data-act="mailAttach" data-k="${sel}" data-v="${mk}" data-fmt="xlsx">Excel</button>` : ''}</div><p class="small muted">Scheduled distributions for all three report kinds are set up under Admin control centre → Email distribution.</p>`)}</div>
  ${card('Sent email history', lt, { right: exportBtns('mlog', 'email', { label: false }) })}`;
} };
