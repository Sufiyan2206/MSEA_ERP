/* ===== Strength, target, capacity, admissions, revenue and comparison screens ===== */
const LVL = ['region', 'zone', 'branch', 'class', 'section', 'student'];
const LVL_NAME = { region: 'Region · Regional Director', zone: 'Zone · Zonal Director', branch: 'Branch', type: 'School type', class: 'Class', section: 'Section', student: 'Student', stcat: 'Student category', feecat: 'Fee category', source: 'Admission source', couns: 'Counsellor' };
const NEWT = ['New Admission', 'Transfer Admission', 'Re-admission'];
const SEASON = { 1: .10, 2: .12, 3: .20, 4: .22, 5: .15, 6: .12, 7: .05, 8: .02, 9: .01, 10: .01 };
const num0 = v => v == null ? '—' : NUM(v);
const inrN = v => v == null ? '—' : INR(v);
const pctN = v => v == null ? '—' : PCT(v);
const cmax = (...a) => Math.max(...a);

/* chart helpers (one axis per chart, categorical slots in fixed order, status colours only for status) */
function hbar(id, labels, sets, opts = {}) {
  labels = labels.map(l => String(l));
  mountChart(id, () => {
    const o = chartBase(opts.fmt || NUM); o.indexAxis = 'y';
    o.scales = { x: { grid: { color: cssVar('--grid') }, border: { display: false }, ticks: { color: cssVar('--ink-2'), font: { size: 11 }, callback: v => (opts.fmt ? opts.fmt(v) : NUM(v)).replace('.00', '') } }, y: { grid: { display: false }, ticks: { color: cssVar('--ink-2'), font: { size: 11 }, autoSkip: false } } };
    o.plugins.legend = { display: sets.length > 1, position: 'top', align: 'start', labels: { color: cssVar('--ink-2'), boxWidth: 10, boxHeight: 10, font: { size: 11 } } };
    o.interaction = { mode: 'nearest', axis: 'y', intersect: true };
    if (opts.onPick) { o.onClick = (e, els) => { if (els.length) opts.onPick(els[0].index); }; o.onHover = (e, els) => { e.native.target.style.cursor = els.length ? 'pointer' : 'default'; }; }
    return { type: 'bar', data: { labels, datasets: sets.map((s, i) => Object.assign({ backgroundColor: s.colors || cssVar('--chart-' + (i + 1)), borderRadius: 3, maxBarThickness: 14, categoryPercentage: .78, barPercentage: .9 }, s)) }, options: o };
  });
}
function vchart(id, type, labels, sets, opts = {}) {
  mountChart(id, () => {
    const o = chartBase(opts.fmt || NUM);
    o.scales.y.ticks.callback = v => (opts.fmt ? opts.fmt(v) : NUM(v)).replace('.00', '');
    o.plugins.legend = { display: sets.length > 1, position: 'top', align: 'start', labels: { color: cssVar('--ink-2'), boxWidth: 10, boxHeight: 10, font: { size: 11 } } };
    if (opts.onPick) { o.onClick = (e, els) => { if (els.length) opts.onPick(els[0].index); }; }
    return { type, data: { labels, datasets: sets.map((s, i) => Object.assign(type === 'line' ? { borderColor: cssVar('--chart-' + (i + 1)), backgroundColor: cssVar('--chart-' + (i + 1)), borderWidth: 2, pointRadius: 3, tension: .25 } : { backgroundColor: cssVar('--chart-' + (i + 1)), borderRadius: 3, maxBarThickness: 22 }, s)) }, options: o };
  });
}
const chartBox = (id, label, h = 260) => `<div class="chart" style="height:${h}px"><canvas id="${id}" role="img" aria-label="${esc(label)}"></canvas></div>`;
const ragColor = p => cssVar({ g: '--good', a: '--warn', r: '--bad' }[Str.rag(p)] || '--ink-3');

/* drill: set path to a branch / group and open the strength report */
function drillTo(level, row) {
  const path = [];
  if (level === 'branch') { App.ui.drill = [{ level: 'branch', key: row.bid, label: row.label }]; }
  else App.ui.drill = [{ level, key: row.key, label: row.label }];
  go('strength');
}

/* ---------- Executive dashboard ---------- */
PAGES.exec = { title: 'Executive Dashboard', mod: 'exec', sf: true, render() {
  const D = D_(), idx = scopeIdx(); if (!idx.length) return empty('No branches in your scope for these filters.');
  const by = App.ui.exBy || (new Set(idx.map(i => DATA.branches[i].region)).size > 1 ? 'region' : idx.length > 1 ? 'branch' : 'class');
  const rows = Str.rows(D, by, idx), T = Str.sum(rows);
  const newN = T.grossAdm, renN = T.renewN, wdN = T.exits;
  const tile = (n, lab, val, sub = '', r = null) => `<div class="kpi"><div class="kpi-n">${n}</div>${r ? `<div class="kpi-c">${chip(r)}</div>` : ''}<div class="kpi-l">${lab}</div><div class="kpi-v">${val}</div><div class="kpi-s">${sub}</div></div>`;
  const noT = T.target == null ? 'Targets are set by branch and class' : '';
  const kpis = `<div class="kpis k6">
    ${tile(1, 'Existing strength', NUM(T.existing), `active students on ${dLabel(D).slice(0, -5)}`)}
    ${tile(2, 'Manual target strength', num0(T.target), noT || (T.missing ? `${T.missing} branch${T.missing > 1 ? 'es' : ''} without a plan` : 'approved targets'))}
    ${tile(3, 'Students required', num0(T.required), T.target != null ? 'to reach target' : noT)}
    ${tile(4, 'Approved capacity', num0(T.capacity), 'manual, approved')}
    ${tile(5, 'Remaining capacity', num0(T.vacant), T.capAfter != null ? `${NUM(T.capAfter)} after target` : '')}
    ${tile(6, 'Target achievement', pctN(T.achPct), T.target != null ? `${NUM(T.existing)} of ${NUM(T.target)}` : '', Str.rag(T.achPct))}
    ${tile(7, 'Capacity utilisation', pctN(T.utilPct), T.tgtUtilPct != null ? `target uses ${PCT(T.tgtUtilPct)}` : '')}
    ${tile(8, 'Revenue target', T.revTarget != null ? INRS(T.revTarget) : '—', 'net annual fee')}
    ${tile(9, 'Revenue generated', INRS(T.net), 'net fee of enrolled students')}
    ${tile(10, 'Revenue achievement', pctN(T.revAchPct), T.revGap != null ? `gap ${INRS(Math.max(0, T.revGap))}` : '', Str.rag(T.revAchPct))}
    ${tile(11, 'Amount collected', INRS(T.collected), `${PCT(T.colPct)} of net revenue`)}
    ${tile(12, 'Outstanding balance', INRS(T.os), `${INRS(T.od)} overdue`)}
    ${tile(13, 'Zero-payer students', NUM(T.zpN), 'no payment against dues')}
    ${tile(14, 'Zero-payer outstanding', INRS(T.zpAmt), T.os ? `${PCT(T.zpAmt / T.os * 100)} of outstanding` : '')}
    ${tile(15, 'Concession + scholarship', INRS(T.conc + T.schol), `${PCT(T.concPct)} of gross fee`)}
    ${tile(16, 'New admissions', NUM(newN), `since ${isoLabel(App.f.from || '2026-01-01')}`)}
    ${tile(17, 'Renewals', NUM(renN), `since ${isoLabel(App.f.from || '2026-01-01')}`)}
    ${tile(18, 'Withdrawals / cancellations', NUM(wdN), `since ${isoLabel(App.f.from || '2026-01-01')}`)}
  </div>`;
  const since = isoLabel(App.f.from || '2026-01-01');
  const ns = `<h3 class="blk">Net strength · movements since ${since}</h3><div class="kpis k5">
    ${tile('N1', 'Opening strength', NUM(T.opening), `on roll on ${isoLabel(E.ds(E.dn(App.f.from || '2026-01-01') - 1))}`)}
    ${tile('N2', 'New admissions', NUM(T.newOnly), `+ ${NUM(T.readm)} re-admissions · + ${NUM(T.inward)} inward transfers`)}
    ${tile('N3', 'Cancellations', NUM(T.canc), `${PCT(T.cancPct)} of gross admissions`, T.cancPct > Store.get('config').strength.cancelRatePct ? 'r' : null)}
    ${tile('N4', 'Withdrawals', NUM(T.wd), `+ ${NUM(T.outward)} outward transfers · ${PCT(T.wdPct)} of opening`)}
    ${tile('N5', 'Net admission growth', (T.netGrowth >= 0 ? '+' : '') + NUM(T.netGrowth), `${NUM(T.grossAdm)} in − ${NUM(T.exits)} out`, T.netGrowth < 0 ? 'r' : null)}
    ${tile('N6', 'Net strength', NUM(T.netStrength), 'opening + net growth')}
    ${tile('N7', 'Manual target strength', num0(T.target), T.missing ? `${T.missing} branch${T.missing > 1 ? 'es' : ''} without a plan` : 'approved targets')}
    ${tile('N8', 'Gap to target', T.gap == null ? '—' : (T.gap > 0 ? NUM(T.gap) + ' short' : NUM(-T.gap) + ' above'), 'target − net strength', T.gap == null ? null : T.gap <= 0 ? 'g' : T.netStrength / T.target * 100 >= 85 ? 'a' : 'r')}
    ${tile('N9', 'Manual approved capacity', num0(T.capacity), 'approved')}
    ${tile('N10', 'Capacity utilisation', pctN(T.utilPct), T.capacity ? `${NUM(T.capacity - T.netStrength)} seats free` : '')}
  </div>`;
  const answer = `<div class="answer"><b>Right now:</b> ${NUM(T.existing)} students against a target of ${num0(T.target)} and approved capacity of ${num0(T.capacity)}; ${num0(T.required)} more students needed, worth about ${INRS(T.expRev)}. ${INRS(T.collected)} collected, ${INRS(T.os)} outstanding.</div>`;
  const byTabs = `<div class="tabs">${(['region', 'zone', 'branch'].concat(idx.length === 1 ? ['class'] : [])).map(k => `<button class="tab${k === by ? ' on' : ''}" data-act="ui" data-k="exBy" data-v="${k}">${LVL_NAME[k]}</button>`).join('')}</div>`;
  const top = rows.filter(r => r.target != null || r.capacity).sort((a, b) => (b.required || 0) - (a.required || 0)).slice(0, 15);
  const pick = list => i => { const r = list[i]; if (by === 'class') { App.f.cls = r.cls; App.ui.drill = [{ level: 'branch', key: DATA.branches[idx[0]].id, label: DATA.branches[idx[0]].name }, { level: 'class', key: r.cls, label: r.cls }]; go('strength'); } else drillTo(by, r); };
  hbar('cStc', top.map(r => r.label), [{ label: 'Existing', data: top.map(r => r.existing) }, { label: 'Target', data: top.map(r => r.target || 0) }, { label: 'Capacity', data: top.map(r => r.capacity || 0) }], { onPick: pick(top) });
  const ach = rows.filter(r => r.achPct != null).sort((a, b) => a.achPct - b.achPct).slice(0, 15);
  hbar('cAch', ach.map(r => r.label), [{ label: 'Target achievement %', data: ach.map(r => +r.achPct.toFixed(1)), colors: ach.map(r => ragColor(r.achPct)) }], { fmt: v => PCT(v, 0), onPick: pick(ach) });
  const gap = rows.filter(r => r.required).sort((a, b) => b.required - a.required).slice(0, 15);
  hbar('cGap', gap.map(r => r.label), [{ label: 'Students required', data: gap.map(r => r.required) }], { onPick: pick(gap) });
  const rv = rows.slice().sort((a, b) => (b.revTarget || b.net) - (a.revTarget || a.net)).slice(0, 15);
  hbar('cRev', rv.map(r => r.label), [{ label: 'Revenue target', data: rv.map(r => r.revTarget || 0) }, { label: 'Revenue generated', data: rv.map(r => r.net) }], { fmt: INRS, onPick: pick(rv) });
  const cv = rows.slice().sort((a, b) => b.os - a.os).slice(0, 15);
  hbar('cCol', cv.map(r => r.label), [{ label: 'Collected', data: cv.map(r => r.collected) }, { label: 'Outstanding', data: cv.map(r => r.os) }], { fmt: INRS, onPick: pick(cv) });
  // monthly admissions vs target
  const monthsAdm = Array.from({ length: 10 }, (_, m) => idx.reduce((a, i) => a + DATA.leads[i].months[m].adm, 0));
  const newTarget = Math.max(0, (T.target || 0) - (T.renewals + T.cont));
  const tgtM = Object.values(SEASON).map(w => Math.round(newTarget * w));
  vchart('cAdm', 'bar', MON.slice(0, 10), [{ label: 'Admission target', data: tgtM }, { label: 'Actual admissions', data: monthsAdm }]);
  // categories
  const cat = Str.rows(D, 'stcat', idx).sort((a, b) => b.existing - a.existing);
  hbar('cCat', cat.map(r => r.label), [{ label: 'Students', data: cat.map(r => r.existing) }], { onPick: i => { App.f.stCat = cat[i].key; go('students'); } });
  hbar('cCatR', cat.map(r => r.label), [{ label: 'Net revenue', data: cat.map(r => r.net) }], { fmt: INRS, onPick: i => { App.f.stCat = cat[i].key; go('revenue'); } });
  const zp = Str.rows(D, 'branch', idx).sort((a, b) => b.zpAmt - a.zpAmt).slice(0, 10);
  hbar('cZp', zp.map(r => r.label), [{ label: 'Zero-payer outstanding', data: zp.map(r => r.zpAmt) }], { fmt: INRS, onPick: i => { App.f.branch = zp[i].bid; go('zeropayer'); } });
  const h = n => Math.max(200, n * 26 + 60);
  const perf = Str.rows(D, 'branch', idx).filter(r => r.achPct != null).sort((a, b) => b.achPct - a.achPct);
  const pt = list => table('perf' + list.id, [{ h: 'Branch', k: r => r.label, t: 'text', cls: 'wrap' }, { h: 'Existing', k: r => r.existing, t: 'num' }, { h: 'Target', k: r => r.target, t: 'num' }, { h: 'Achievement', k: r => Str.chip(r.achPct), t: 'html', x: r => r.achPct, cls: 'n' }, { h: 'Revenue ach.', k: r => Str.chip(r.revAchPct), t: 'html', x: r => r.revAchPct, cls: 'n' }], list.rows, { rowAct: 'drillBranch', rowKey: r => r.bid, compact: true, title: list.t });
  const charts = `<div class="grid2">${card('Existing vs target vs capacity', chartBox('cStc', 'Existing strength, target and capacity', h(top.length * 1.6)), { sub: `By ${LVL_NAME[by].toLowerCase()}, largest gap first · click a bar to drill down` })}${card('Target achievement %', chartBox('cAch', 'Target achievement percent', h(ach.length)), { sub: 'Lowest first · green ≥ 100%, amber 85–99.99%, red below 85%' })}</div>
  <div class="grid2">${card('Student gap', chartBox('cGap', 'Students required by group', h(gap.length)), { sub: 'Students still required to reach target' })}${card('Monthly admissions: target vs actual', chartBox('cAdm', 'Monthly admission target and actual admissions', 260), { sub: 'Jan–Oct 2026 · target = new admissions needed, spread by the usual admission season' })}</div>
  <div class="grid2">${card('Revenue target vs generated', chartBox('cRev', 'Revenue target and revenue generated', h(rv.length * 1.3)))}${card('Collection vs outstanding', chartBox('cCol', 'Collected and outstanding', h(cv.length * 1.3)), { sub: 'Highest outstanding first' })}</div>
  <div class="grid3">${card('Students by category', chartBox('cCat', 'Students by category', h(cat.length)), { sub: 'Click a bar for the Student Corner' })}${card('Net revenue by category', chartBox('cCatR', 'Net revenue by category', h(cat.length)))}${card('Zero-payer amount by branch', chartBox('cZp', 'Zero-payer outstanding by branch', h(zp.length)), { sub: 'Top 10' })}</div>`;
  const tb = `<div class="grid2">${card('Top-performing branches', pt({ id: 'T', rows: perf.slice(0, 8), t: 'Top-performing branches' }))}${card('Low-performing branches', pt({ id: 'L', rows: perf.slice(-8).reverse(), t: 'Low-performing branches' }))}</div>`;
  return `${answer}${ns}${kpis}<div class="card"><div class="card-h"><h2>Charts by</h2><div>${byTabs}<button class="btn sm" data-act="execPdf">Executive summary (PDF)</button></div></div><p class="card-sub">Every chart opens the detailed report when you click a bar.</p></div>${charts}${tb}`;
} };

/* ---------- Strength, target & capacity report with drill-down ---------- */
function drillState(idx) {
  const path = App.ui.drill || [];
  let ids = idx.slice(), cls = '', sec = '';
  path.forEach(p => {
    if (p.level === 'region') ids = ids.filter(i => DATA.branches[i].region === p.key || regionLabel(DATA.branches[i]) === p.key);
    if (p.level === 'zone') ids = ids.filter(i => DATA.branches[i].zone === p.key || zoneLabel(DATA.branches[i]) === p.key);
    if (p.level === 'branch') ids = ids.filter(i => DATA.branches[i].id === p.key);
    if (p.level === 'class') cls = p.key.split('|').at(-1);
    if (p.level === 'section') sec = p.key.split('|').at(-1);
  });
  const last = path.length ? path.at(-1).level : null;
  let next = last ? LVL[LVL.indexOf(last) + 1] : (App.ui.drillStart || 'region');
  if (!last && new Set(ids.map(i => DATA.branches[i].region)).size === 1 && next === 'region') next = ids.length === 1 ? 'class' : new Set(ids.map(i => DATA.branches[i].zone)).size > 1 ? 'zone' : 'branch';
  return { ids, cls, sec, next, path };
}
PAGES.strength = { title: 'Strength, Target & Capacity', mod: 'strength', sf: true, render() {
  const D = D_(), idx = scopeIdx(); if (!idx.length) return empty('No branches in your scope for these filters.');
  const st = drillState(idx);
  const save = { cls: App.f.cls, sec: App.f.sec };
  if (st.cls) App.f.cls = st.cls; if (st.sec) App.f.sec = st.sec;
  let body = '';
  try {
    const crumbs = `<nav class="crumbs" aria-label="Drill-down path"><button class="linkish" data-act="drillPop" data-k="0">All</button>${st.path.map((p, i) => ` › <button class="linkish" data-act="drillPop" data-k="${i + 1}">${esc(p.label)}</button>`).join('')} › <b>${LVL_NAME[st.next]}</b></nav>`;
    if (st.next === 'student') {
      const L = Str.list(D, st.ids).sort((a, b) => b.os - a.os);
      body = crumbs + table('strStud', studentCols(), L, { rowAct: 'openStudent', rowKey: x => x.s.id, limit: 50, title: 'Students' });
      return card(`${NUM(L.length)} students`, body, { right: exportBtns('strStud', 'strength', { label: false }), sub: 'Outstanding comes from the same student fee ledger at every level.' });
    }
    const rows = Str.rows(D, st.next, st.ids).sort((a, b) => st.next === 'class' || st.next === 'section' ? clsRank(a.cls) - clsRank(b.cls) || String(a.sec).localeCompare(b.sec) : (b.required || 0) - (a.required || 0));
    const T = Str.sum(rows);
    const cols = [{ h: LVL_NAME[st.next], k: r => r.label + (r.derived ? ' ≈' : ''), t: 'text', cls: 'sticky wrap', w: 170 }, ...(st.next === 'branch' ? [{ h: 'School type', k: r => r.type, t: 'text' }, { h: 'Zonal Director', k: r => r.bid ? zdName(DATA.branches.find(b => b.id === r.bid)) : '', t: 'text' }, { h: 'Regional Director', k: r => r.bid ? rdName(DATA.branches.find(b => b.id === r.bid)) : '', t: 'text' }] : st.next === 'class' || st.next === 'section' ? [] : [{ h: 'Branches', k: r => r.count, t: 'num' }]),
      { h: 'Opening strength', k: r => r.opening, t: 'num' }, { h: 'New admissions', k: r => r.newOnly, t: 'num' }, { h: 'Re-admissions', k: r => r.readm, t: 'num' }, { h: 'Inward transfers', k: r => r.inward, t: 'num' }, { h: 'Cancellations', k: r => r.canc, t: 'num', rc: r => r.canc ? 'red' : '' }, { h: 'Withdrawals', k: r => r.wd, t: 'num', rc: r => r.wd ? 'red' : '' }, { h: 'Outward transfers', k: r => r.outward, t: 'num' }, { h: 'Net strength', k: r => r.netStrength, t: 'num', cls: 'em' }, { h: 'Existing strength (ERP)', k: r => r.existing, t: 'num' }, { h: 'Manual target strength', k: r => r.target, t: 'num' }, { h: 'Gap to target', k: r => r.gap, t: 'num', rc: r => r.gap > 0 ? 'red' : r.gap != null ? 'green' : '' }, { h: 'Students required', k: r => r.required, t: 'num' },
      { h: 'Approved capacity', k: r => r.capacity, t: 'num' }, { h: 'Vacant seats', k: r => r.vacant, t: 'num', rc: r => r.vacant != null && r.vacant < 0 ? 'red' : '' }, { h: 'Capacity after target', k: r => r.capAfter, t: 'num', rc: r => r.capAfter != null && r.capAfter < 0 ? 'red' : '' },
      { h: 'Target achievement', k: r => Str.chip(r.achPct), t: 'html', x: r => r.achPct, cls: 'n' }, { h: 'Capacity utilisation', k: r => r.utilPct, t: 'pct', rc: r => r.utilPct >= Store.get('config').strength.capAlertPct ? 'amber' : '' },
      { h: 'Status', k: r => r.target == null ? pill('No target plan', 'warn') : r.capAfter != null && r.capAfter < 0 ? pill('Target above capacity', 'bad') : chip(Str.rag(r.achPct)), t: 'html', x: r => r.target == null ? 'No target plan' : r.capAfter < 0 ? 'Target above capacity' : ({ g: 'Achieved', a: 'Close', r: 'Below' }[Str.rag(r.achPct)]) },
      { h: 'Net revenue', k: r => r.net, t: 'inr' }, { h: 'Outstanding', k: r => r.os, t: 'inr' }, { h: 'Zero payers', k: r => r.zpN, t: 'num' }];
    body = crumbs + table('str', cols, rows, { total: T, rowAct: 'drill', rowKey: r => st.next + '~' + r.key + '~' + (r.label), title: 'Branch-wise Strength, Target and Capacity' });
    if (st.next === 'class' || st.next === 'section') {
      const cu = rows.filter(r => r.capacity);
      hbar('cCls', cu.map(r => r.label), [{ label: 'Capacity utilisation %', data: cu.map(r => +(r.utilPct || 0).toFixed(1)), colors: cu.map(r => (r.utilPct || 0) >= Store.get('config').strength.capAlertPct ? cssVar('--warn') : cssVar('--chart-1')) }], { fmt: v => PCT(v, 0) });
      body += `<h4>Capacity utilisation by ${st.next}</h4>${chartBox('cCls', 'Capacity utilisation', Math.max(180, cu.length * 24 + 50))}`;
    }
    return `<div class="note">Net strength = opening strength on ${isoLabel(E.ds(E.dn(App.f.from || '2026-01-01') - 1))} + new admissions + re-admissions + inward transfers − cancellations − withdrawals − outward transfers; gap to target = target − net strength. Change the “Admissions from” date to move the opening date. Drill down Region → Zone → Branch → Class → Section → Student by selecting a row. ≈ marks a class or section target split from the branch target by share of strength. The outstanding column comes from the same student fee ledger at every level, so the totals agree.</div>${card(`${LVL_NAME[st.next]}-wise strength, target and capacity · as on ${dLabel(D)}`, body, { right: exportBtns('str', 'strength', { label: false }) })}`;
  } finally { App.f.cls = save.cls; App.f.sec = save.sec; }
} };
function studentCols() {
  return [{ h: 'Student', k: x => x.s.name, t: 'text' }, { h: 'Admission no.', k: x => x.s.adm, t: 'text' }, { h: 'Branch', k: x => DATA.branches[x.s.b].name, t: 'text', cls: 'wrap' }, { h: 'Class', k: x => x.s.cls + ' ' + x.s.sec, t: 'text' }, { h: 'Category', k: x => Str.catName('student', x.s.stCat), t: 'text' }, { h: 'Fee category', k: x => Str.catName('fee', x.s.feeCat), t: 'text' }, { h: 'Parent mobile', k: x => x.s.mobile, t: 'text' }, { h: 'Net fee', k: x => x.s.annual, t: 'inr' }, { h: 'Collected', k: x => x.paid + x.adv, t: 'inr' }, { h: 'Outstanding', k: x => x.os, t: 'inr', cls: 'em' }, { h: 'Payment status', k: x => { const p = Str.payStatus(x); return pill(p, { 'Zero Payer': 'bad', Overdue: 'bad', 'Partly Paid': 'warn', 'Fully Paid': 'ok' }[p] || ''); }, t: 'html', x: x => Str.payStatus(x) }];
}

/* ---------- Target planning ---------- */
PAGES.targets = { title: 'Target Planning', mod: 'targets', render() {
  const D = D_(), idx = scopeIdx(); if (!idx.length) return empty('No branches in your scope.');
  const TG = Store.get('targets'), ed = can('targets', 'Edit') || can('targets', 'Add'), ap = can('targets', 'Approve'), PL = Str.plansFor();
  const NS = Object.fromEntries(Str.rows(D, 'branch', idx).map(r => [r.bid, r]));
  const rows = idx.filter(i => !DATA.branches[i].inactive).map(i => { const b = DATA.branches[i], p = PL[b.id] || {}, a = p.approved || null, cur = Str.rowsFor([i], D), cap = Str.branchCap(b.id, D) || null, ns = NS[b.id] || { netStrength: cur.strength, canc: 0, wd: 0, outward: 0, grossAdm: 0 };
    const tgt = a ? a.target : null; return { b, p, a, pend: p.pending, existing: cur.strength, ns, net: cur.net, cap, tgt, req: tgt != null ? Math.max(0, tgt - cur.strength) : null, ach: tgt ? cur.strength / tgt * 100 : null, expRev: tgt != null && a ? Math.max(0, tgt - cur.strength) * a.avgNet : null, gap: a ? a.revTarget - cur.net : null, over: tgt != null && cap && tgt > cap }; });
  const cols = [{ h: 'Branch', k: r => r.b.name, t: 'text', cls: 'sticky wrap', w: 180 }, { h: 'Region / zone', k: r => r.b.region ? r.b.region + ' / ' + r.b.zone : '', t: 'text' }, { h: 'Regional Director', k: r => r.b.region ? rdName(r.b) : '', t: 'text' }, { h: 'Zonal Director', k: r => r.b.zone ? zdName(r.b) : '', t: 'text' }, { h: 'School type', k: r => r.b.type, t: 'text' },
    { h: 'Existing strength (ERP)', k: r => r.existing, t: 'num' }, { h: 'Gross admissions', k: r => r.ns ? r.ns.grossAdm : null, t: 'num' }, { h: 'Cancellations + withdrawals', k: r => r.ns ? r.ns.canc + r.ns.wd + r.ns.outward : null, t: 'num' }, { h: 'Net strength', k: r => r.ns ? r.ns.netStrength : null, t: 'num', cls: 'em' }, { h: 'Manual target strength', k: r => r.tgt, t: 'num', cls: 'em' }, { h: 'Gap to target', k: r => r.tgt != null && r.ns ? r.tgt - r.ns.netStrength : null, t: 'num', rc: r => r.tgt != null && r.ns && r.tgt - r.ns.netStrength > 0 ? 'red' : 'green' }, { h: 'Approved capacity', k: r => r.cap, t: 'num', rc: r => r.over ? 'red' : '' },
    { h: 'Avg gross fee', k: r => r.a ? r.a.avgGross : null, t: 'inr' }, { h: 'Avg concession %', k: r => r.a ? r.a.concPct : null, t: 'pct' }, { h: 'Avg net fee', k: r => r.a ? r.a.avgNet : null, t: 'inr' }, { h: 'Revenue target', k: r => r.a ? r.a.revTarget : null, t: 'inr' },
    { h: 'Students required', k: r => r.req, t: 'num' }, { h: 'Target achievement', k: r => Str.chip(r.ach), t: 'html', x: r => r.ach, cls: 'n' }, { h: 'Expected revenue from pending admissions', k: r => r.expRev, t: 'inr' }, { h: 'Revenue gap', k: r => r.gap, t: 'inr', rc: r => r.gap > 0 ? 'red' : 'green' },
    { h: 'Completion date', k: r => r.a ? isoLabel(r.a.completion) : '', t: 'text' }, { h: 'Remarks', k: r => r.a ? r.a.remarks : '', t: 'text', cls: 'wrap small' },
    { h: 'Approval status', k: r => !r.a && !r.pend ? pill('No plan', 'warn') : r.pend ? pill(`${r.p.status}: ${NUM(r.pend.target)} pending`, 'warn') + (ap && r.pend.byId !== App.user.id && r.p.status === 'Submitted' ? ` <button class="btn sm primary" data-act="tgtApprove" data-k="${r.b.id}">Approve</button> <button class="btn sm" data-act="tgtReject" data-k="${r.b.id}">Reject</button>` : '') : pill('Approved', 'ok') + (r.over ? ' ' + pill('Above capacity', 'bad') : ''), t: 'html', x: r => r.pend ? r.p.status : r.a ? 'Approved' : 'No plan' },
    ...(ed ? [{ h: '', k: r => `<button class="btn sm" data-act="tgtEdit" data-k="${r.b.id}">${r.a || r.pend ? 'Edit target' : 'Add target'}</button>`, t: 'html', noexp: true }] : [])];
  const T = { b: { name: 'Total', region: '', zone: '', type: '' }, existing: 0, tgt: 0, cap: 0, req: 0, expRev: 0, gap: 0 }; rows.forEach(r => { T.existing += r.existing; T.tgt += r.tgt || 0; T.cap += r.cap || 0; T.req += r.req || 0; T.expRev += r.expRev || 0; T.gap += r.gap || 0; }); T.ach = T.tgt ? T.existing / T.tgt * 100 : null; T.a = null; T.p = {}; T.isTotal = true;
  const H = TG.history.filter(h => (h.ay || CUR_AY) === App.f.ay && idx.some(i => DATA.branches[i].id === h.bid)).slice().reverse();
  const ht = table('tgtHist', [{ h: 'Date and time', k: h => tsLabel(h.at), t: 'text', x: h => h.at }, { h: 'Branch', k: h => brName(h.bid), t: 'text', cls: 'wrap' }, { h: 'Old target', k: h => h.old, t: 'num' }, { h: 'Revised target', k: h => h.new, t: 'num' }, { h: 'Reason for change', k: h => h.reason, t: 'text', cls: 'wrap' }, { h: 'User', k: h => h.user, t: 'text' }, { h: 'Role', k: h => h.role, t: 'text' }, { h: 'Approval status', k: h => h.status, t: 'text' }, { h: 'Approved / rejected by', k: h => h.approver || '', t: 'text' }], H, { title: 'Target revision history', empty: 'No revisions yet. Demo targets were approved on 15 Mar 2026.', limit: 30 });
  const yn = isCurYear() ? '' : `<div class="note"><b>Planning for AY ${esc(App.f.ay)}.</b> Existing strength shown is today's roll (AY ${CUR_AY}); targets and revenue targets saved here apply to ${esc(App.f.ay)}.</div>`;
  return yn + `<div class="note">Existing strength is synced from the ERP. Targets take effect only after approval by System Admin or authorised Corporate Management; the previous approved target stays in force meanwhile. A target above approved capacity needs an override with remarks.</div>${card(`Target plan · AY ${esc(App.f.ay)}`, table('tgt', cols, rows, { total: T, title: 'Target Planning' }), { right: exportBtns('tgt', 'targets', { label: false }) })}${card('Target revision history', ht, { right: exportBtns('tgtHist', 'targets', { label: false }) })}`;
} };
function targetForm(bid) {
  const i = DATA.branches.findIndex(b => b.id === bid), b = DATA.branches[i], p = Str.plansFor()[bid] || {}, v = p.pending || p.approved || {}, cur = Str.rowsFor([i], D_()), cap = Str.branchCap(bid, D_());
  const avgG = v.avgGross || Math.round(cur.gross / Math.max(1, cur.strength)), cp = v.concPct != null ? v.concPct : Math.round((1 - cur.net / Math.max(1, cur.gross)) * 1000) / 10;
  const ct = Object.entries(p.classTargets || {}).map(([c, t]) => `${c}: ${t}`).join('\n');
  modal(`Target plan · ${b.name}`, `<div class="form-grid"><label class="fld"><span>Academic year</span><input value="${esc(App.f.ay)}" disabled></label><label class="fld"><span>Region / zone</span><input value="${esc(b.region + ' / ' + b.zone)}" disabled></label><label class="fld"><span>School type</span><input value="${esc(b.type)}" disabled></label><label class="fld"><span>Existing strength (ERP)</span><input value="${cur.strength}" disabled></label>
  <label class="fld"><span>Manual target strength</span><input id="gT" type="number" min="0" value="${v.target || ''}" data-act="tgtCalc"></label><label class="fld"><span>Approved capacity</span><input id="gCap" value="${cap || 'Not set'}" disabled></label>
  <label class="fld"><span>Average gross fee per student (₹)</span><input id="gG" type="number" value="${avgG}" data-act="tgtCalc"></label><label class="fld"><span>Average concession %</span><input id="gC" type="number" step="0.1" value="${cp}" data-act="tgtCalc"></label>
  <label class="fld"><span>Average net fee per student (₹)</span><input id="gN" disabled></label><label class="fld"><span>Revenue target (₹)</span><input id="gR" type="number" value="${v.revTarget || ''}"></label>
  <label class="fld"><span>Target completion date</span><input id="gD" type="date" value="${v.completion || (yearOf(App.f.ay) || {}).end || '2026-12-31'}"></label></div>
  <label class="fld"><span>Class targets (optional, one per line, e.g. “LKG: 80”)</span><textarea id="gCls" rows="3" placeholder="Leave blank to split the branch target by class strength">${esc(ct)}</textarea></label>
  <div id="gCalc" class="calc"></div><label class="chk big" id="gOvW" hidden><input type="checkbox" id="gOv"> Override: approve this target above approved capacity</label>
  <label class="fld"><span>Reason / remarks (required)</span><textarea id="gRem" rows="2"></textarea></label><p class="err" id="gErr" hidden></p>`,
  `<button class="btn" data-act="closeModal">Cancel</button><button class="btn" data-act="tgtSave" data-k="${bid}" data-v="Draft">Save draft</button><button class="btn primary" data-act="tgtSave" data-k="${bid}" data-v="Submitted">Submit for approval</button>`, true);
  tgtCalc(bid);
}
function tgtCalc(bid) {
  const i = DATA.branches.findIndex(b => b.id === bid), cur = Str.rowsFor([i], D_()), cap = Str.branchCap(bid, D_());
  const t = +v('gT') || 0, g = +v('gG') || 0, c = +v('gC') || 0, net = Math.round(g * (1 - c / 100)); const nEl = document.getElementById('gN'); if (nEl) nEl.value = INR(net);
  const rEl = document.getElementById('gR'); if (rEl && (!rEl.value || rEl.dataset.auto === '1')) { rEl.value = t * net; rEl.dataset.auto = '1'; }
  const rev = +(rEl ? rEl.value : 0) || t * net, req = Math.max(0, t - cur.strength), over = cap && t > cap;
  const el = document.getElementById('gCalc'); if (el) el.innerHTML = `<div class="kv4"><div><span>Students required</span><b>${NUM(req)}</b></div><div><span>Target achievement</span><b>${t ? PCT(cur.strength / t * 100) : '—'}</b></div><div><span>Expected revenue from pending admissions</span><b>${INR(req * net)}</b></div><div><span>Revenue gap</span><b>${INR(rev - cur.net)}</b></div></div>${over ? `<p class="err">Target ${NUM(t)} is above approved capacity ${NUM(cap)}. Submission needs an override with remarks.</p>` : ''}`;
  const w = document.getElementById('gOvW'); if (w) w.hidden = !over;
}

/* ---------- Capacity setup ---------- */
PAGES.capacity = { title: 'Capacity Setup & Planning', mod: 'capacity', render() {
  const D = D_(), idx = scopeIdx(); if (!idx.length) return empty('No branches in your scope.');
  const lv = App.ui.capLv || 'class', cfg = Store.get('config').strength, canCap = can('capacity', 'Add') || can('capacity', 'Edit'), canTgt = can('targets', 'Add') || can('targets', 'Edit'), canTog = can('capacity', 'Edit') || can('capacity', 'Approve');
  let rows = [];
  idx.forEach(i => {
    const b = DATA.branches[i], t = Str.branchTarget(b.id), act = Str.allActive(i, D); if (b.inactive && lv !== 'branch') return;
    if (lv === 'branch') { const cap = Str.branchCap(b.id, D) || null, n = act.length, tg = b.inactive ? null : t ? t.target : null; rows.push({ b, cls: '', sec: '', cap, n, tg, an: t ? t.avgNet : null, inactive: !!b.inactive, binact: b.inactive }); return; }
    const SK = Str.secKeys(b.id, D), keys = [...SK.keys()]; const classes = [...new Set(keys.map(k => k.split('|')[0]))].sort((a, c) => clsRank(a) - clsRank(c));
    classes.forEach(c => {
      if (lv === 'class') { const cp = Str.classPlan(i, c, '', D), ks = keys.filter(k => k.startsWith(c + '|')), ci = Str.classInactive(b.id, c), closing = ks.map(k => SK.get(k)).find(m => m.closingClass), allProp = ks.length && ks.every(k => SK.get(k).src === 'Proposed');
        rows.push({ b, cls: c, sec: '', cap: ci || allProp ? null : cp.capacity || null, n: act.filter(s => s.cls === c).length, tg: ci || allProp ? null : cp.target, an: t ? t.avgNet : null, derived: cp.derived, nsec: ks.filter(k => !SK.get(k).inactive).length, inactive: !!ci, meta: closing ? { closing: closing.closing, src: 'ERP' } : allProp ? { src: 'Proposed', e: SK.get(ks[0]).e } : null, cinact: ci }); }
      else keys.filter(k => k.startsWith(c + '|')).sort().forEach(k => { const sec = k.split('|')[1], m = SK.get(k), cp = Str.classPlan(i, c, sec, D), prop = m.src === 'Proposed'; rows.push({ b, cls: c, sec, cap: prop || m.inactive ? null : cp.capacity || null, n: act.filter(s => s.cls === c && s.sec === sec).length, tg: prop || m.inactive ? null : cp.target, an: t ? t.avgNet : null, derived: true, meta: m, inactive: !!m.inactive }); });
    });
  });
  rows.forEach(r => { r.vac = r.cap != null ? r.cap - r.n : null; r.req = r.tg != null ? Math.max(0, r.tg - r.n) : null; r.after = r.cap != null && r.tg != null ? r.cap - r.tg : null; r.util = r.cap ? r.n / r.cap * 100 : null; r.tutil = r.cap && r.tg != null ? r.tg / r.cap * 100 : null; r.exp = r.req != null && r.an ? r.req * r.an : null; r.rev = r.tg != null && r.an ? r.tg * r.an : null; });
  const secLabel = r => esc(r.sec) + (r.inactive ? ' ' + pill('Inactive', 'bad') : '') + (r.meta && r.meta.src === 'Proposed' ? ' ' + pill('Proposed', 'warn') : r.meta && r.meta.closing ? ' ' + pill(r.meta.closing.status === 'Approved' ? 'Closes ' + isoLabel(r.meta.closing.from) : 'Closure ' + r.meta.closing.status.toLowerCase(), 'bad') : r.meta && r.meta.src === 'Added' ? ' ' + pill('Added', 'ok') : '');
  const clsLabel = r => esc(r.cls) + (lv === 'class' && r.nsec != null ? ` <span class="small">(${r.nsec} section${r.nsec === 1 ? '' : 's'})</span>` : '') + (lv === 'class' && r.inactive ? ' ' + pill('Inactive', 'bad') : '') + (lv === 'class' && r.meta && r.meta.src === 'Proposed' ? ' ' + pill('Proposed', 'warn') : '') + (lv === 'class' && r.meta && r.meta.closing ? ' ' + pill(r.meta.closing.status === 'Approved' ? 'Closes ' + isoLabel(r.meta.closing.from) : 'Closure ' + r.meta.closing.status.toLowerCase(), 'bad') : '');
  const cols = [{ h: 'Branch', k: r => esc(r.b.name) + (lv === 'branch' && r.inactive ? ' ' + pill('Inactive', 'bad') : '') + (lv === 'branch' && r.b.addedInApp ? ' ' + pill('Added', 'ok') : ''), t: 'html', cls: 'wrap', x: r => r.b.name + (lv === 'branch' && r.inactive ? ' (inactive)' : '') }, ...(lv === 'branch' ? [{ h: 'Status', k: r => r.inactive ? 'Inactive' : 'Active', t: 'text' }] : []), ...(lv !== 'branch' ? [{ h: 'Class', k: clsLabel, t: 'html', x: r => r.cls + (lv === 'class' && r.inactive ? ' (inactive)' : '') }] : []), ...(lv === 'class' ? [{ h: 'Status', k: r => r.inactive ? 'Inactive' : r.meta && r.meta.src === 'Proposed' ? 'Proposed' : 'Active', t: 'text' }] : []), ...(lv === 'section' ? [{ h: 'Section', k: secLabel, t: 'html', x: r => r.sec + (r.inactive ? ' (inactive)' : '') }, { h: 'Status', k: r => r.inactive ? 'Inactive' : r.meta && r.meta.src === 'Proposed' ? 'Proposed' : 'Active', t: 'text' }] : []),
    { h: 'Manual approved capacity', k: r => r.cap, t: 'num', cls: 'em' }, { h: 'Existing strength', k: r => r.n, t: 'num' }, { h: 'Manual target strength', k: r => r.tg == null ? null : r.tg, t: 'num' }, { h: 'Vacant seats', k: r => r.vac, t: 'num', rc: r => r.vac < 0 ? 'red' : '' }, { h: 'Students required', k: r => r.req, t: 'num' },
    { h: 'Capacity after target', k: r => r.after, t: 'num', rc: r => r.after < 0 ? 'red' : '' }, { h: 'Capacity utilisation', k: r => r.util, t: 'pct', rc: r => r.util >= cfg.capAlertPct ? 'amber' : '' }, { h: 'Target capacity utilisation', k: r => r.tutil, t: 'pct', rc: r => r.tutil > 100 ? 'red' : '' }, { h: 'Average net fee', k: r => r.an, t: 'inr' }, { h: 'Revenue target', k: r => r.rev, t: 'inr' }, { h: 'Expected revenue', k: r => r.exp, t: 'inr' },
    { h: 'Alert', k: r => r.cap == null ? pill('No capacity', 'warn') : r.after != null && r.after < 0 ? pill('Target above capacity', 'bad') : r.util >= cfg.capAlertPct ? pill(`≥ ${cfg.capAlertPct}% full`, 'warn') : '', t: 'html', x: r => r.cap == null ? 'No capacity' : r.after < 0 ? 'Target above capacity' : r.util >= cfg.capAlertPct ? 'Nearly full' : '' },
    ...(canCap || canTgt ? [{ h: '', k: r => { if (r.meta && r.meta.src === 'Proposed') return `<span class="small">Awaiting approval (${esc(r.meta.e.id)})</span>`;
      if (lv === 'branch' && r.inactive) return `<span class="small">Inactive since ${isoLabel(r.binact.from)}</span> ` + (canTog ? `<button class="btn sm" data-act="branchStatus" data-k="${r.b.id}" data-v="on">Activate branch</button>` : '');
      if (r.inactive) { const x = lv === 'class' ? r.cinact : r.meta.inactive, cl = lv === 'class' || r.meta.inactiveClass; return `<span class="small">Inactive since ${isoLabel(x.from)}${cl && lv !== 'class' ? ' (whole class)' : ''}</span> ` + (canTog && (lv === 'class' || !r.meta.inactiveClass) ? `<button class="btn sm" data-act="secTog" data-b="${r.b.id}" data-c="${esc(r.cls)}" data-s="${lv === 'class' ? '*' : esc(r.sec)}" data-v="on">Activate${lv === 'class' ? ' class' : ''}</button>` : ''); }
      return (canCap ? `<button class="btn sm" data-act="capEdit" data-b="${r.b.id}" data-c="${esc(r.cls)}" data-s="${esc(r.sec)}">${r.cap == null ? 'Add capacity' : 'Edit capacity'}</button> ` : '') + (canTgt ? (lv === 'branch' ? `<button class="btn sm" data-act="tgtEdit" data-k="${r.b.id}">${r.tg == null ? 'Add target' : 'Edit target'}</button> ` : `<button class="btn sm" data-act="clsTgt" data-b="${r.b.id}" data-c="${esc(r.cls)}">${r.derived ? 'Set target' : 'Edit target'}</button> `) : '')
        + (canCap && lv !== 'branch' ? `<button class="btn sm" data-act="secAdd" data-b="${r.b.id}" data-c="${esc(r.cls)}">Add section</button> ` : '') + (canTog && lv === 'section' && !(r.meta && r.meta.closing) ? `<button class="btn sm" data-act="secTog" data-b="${r.b.id}" data-c="${esc(r.cls)}" data-s="${esc(r.sec)}" data-v="off">Deactivate</button> ` : '') + (canCap && lv === 'section' && !(r.meta && r.meta.closing) ? `<button class="btn sm danger" data-act="secDel" data-b="${r.b.id}" data-c="${esc(r.cls)}" data-s="${esc(r.sec)}">Delete section</button>` : '')
        + (canTog && lv === 'branch' ? `<button class="btn sm" data-act="branchStatus" data-k="${r.b.id}" data-v="off">Deactivate branch</button> <button class="btn sm danger" data-act="branchStatus" data-k="${r.b.id}" data-v="close">Close branch</button> ` : '')
        + (canTog && lv === 'class' && !(r.meta && r.meta.closing) ? `<button class="btn sm" data-act="secTog" data-b="${r.b.id}" data-c="${esc(r.cls)}" data-s="*" data-v="off">Deactivate class</button> ` : '') + (canCap && lv === 'class' && !(r.meta && r.meta.closing) ? `<button class="btn sm danger" data-act="secDel" data-b="${r.b.id}" data-c="${esc(r.cls)}" data-s="">Delete class</button>` : ''); }, t: 'html', noexp: true }] : [])];
  const T = { b: { name: 'Total' }, cls: '', sec: '', cap: 0, n: 0, tg: 0, vac: 0, req: 0, after: 0, exp: 0, rev: 0 }; rows.forEach(r => { T.cap += r.cap || 0; T.n += r.n; T.tg += r.tg || 0; T.req += r.req || 0; T.exp += r.exp || 0; T.rev += r.rev || 0; }); T.vac = T.cap - T.n; T.after = T.cap - T.tg; T.util = T.cap ? T.n / T.cap * 100 : null; T.tutil = T.cap ? T.tg / T.cap * 100 : null;
  const tabs = `<div class="tabs">${[['branch', 'Branch'], ['class', 'Class'], ['section', 'Section']].map(([k, l]) => `<button class="tab${k === lv ? ' on' : ''}" data-act="ui" data-k="capLv" data-v="${k}">${l}</button>`).join('')}</div>`;
  const E2 = Store.get('capacity').entries.filter(e => (e.ay || CUR_AY) === App.f.ay && idx.some(i => DATA.branches[i].id === e.bid)).slice().reverse();
  const myScope = scopeOf(App.user);
  const act = e => { const b = []; const inScope = myScope.has(DATA.branches.findIndex(x => x.id === e.bid));
    if (e.status === 'Draft' && e.byId === App.user.id) b.push(`<button class="btn sm" data-act="capStep" data-k="${e.id}" data-v="Submitted">Submit</button>`);
    if (['Draft', 'Submitted'].includes(e.status) && (e.byId === App.user.id || can('capacity', 'Edit'))) b.push((e.newSection || e.closeSection ? '' : `<button class="btn sm" data-act="capEdit" data-k="${e.id}">Edit</button> `) + `<button class="btn sm danger" data-act="capWithdraw" data-k="${e.id}">Withdraw</button>`);
    if (e.status === 'Rejected' && (e.byId === App.user.id || can('capacity', 'Add') || can('capacity', 'Edit')) && inScope) b.push(`<button class="btn sm" data-act="capEdit" data-k="${e.id}" data-v="revise">Revise and resubmit</button>`);
    if (e.status === 'Submitted' && can('capacity', 'Recommend') && inScope) b.push(`<button class="btn sm" data-act="capStep" data-k="${e.id}" data-v="Recommended">Recommend</button>`);
    if (['Submitted', 'Recommended'].includes(e.status) && can('capacity', 'Approve')) b.push(`<button class="btn sm primary" data-act="capStep" data-k="${e.id}" data-v="Approved">Approve</button><button class="btn sm" data-act="capStep" data-k="${e.id}" data-v="Rejected">Reject</button>`);
    return b.join(' '); };
  const et = table('capReq', [{ h: 'Requested', k: e => tsLabel(e.at), t: 'text', x: e => e.at }, { h: 'Branch', k: e => brName(e.bid), t: 'text', cls: 'wrap' }, { h: 'Level', k: e => (e.newClass ? 'New class · ' : e.newSection ? 'New section · ' : e.closeClass ? 'Close class · ' : e.closeSection ? 'Close section · ' : '') + (e.sec ? `${e.cls} ${e.sec}` : e.cls || 'Whole branch') + (e.moveTo ? ` → students to ${e.moveTo}` : ''), t: 'text' }, { h: 'Previous capacity', k: e => e.prev, t: 'num' }, { h: 'Revised capacity', k: e => e.capacity, t: 'num', cls: 'em' }, { h: 'Reason', k: e => e.reason, t: 'text', cls: 'wrap' }, { h: 'Document', k: e => e.doc || '—', t: 'text' }, { h: 'Effective', k: e => `${isoLabel(e.from)} → ${e.to ? isoLabel(e.to) : 'open'}`, t: 'text' }, { h: 'Requested by', k: e => e.by, t: 'text' }, { h: 'Recommended by', k: e => e.recBy || '—', t: 'text' }, { h: 'Approved / rejected by', k: e => e.apBy || '—', t: 'text' }, { h: 'Status', k: e => pill(e.status, { Approved: 'ok', Rejected: 'bad', Withdrawn: 'bad', Draft: '' }[e.status] || 'warn') + (e.override ? ' ' + pill('Override', 'bad') : '') + (e.revisedFrom ? ` <span class="small">revises ${esc(e.revisedFrom)}</span>` : ''), t: 'html', x: e => e.status + (e.revisedFrom ? ' (revises ' + e.revisedFrom + ')' : '') }, { h: 'Remarks', k: e => e.remarks || '', t: 'text', cls: 'wrap small' }, { h: '', k: e => act(e), t: 'html', noexp: true }], E2, { title: 'Capacity change requests and audit history', empty: 'No capacity changes yet. The demo baseline capacities are in force.' });
  const canNew = can('capacity', 'Add') || can('capacity', 'Edit');
  return `<div class="note">Capacity is entered manually and takes effect only after approval: Principal submits → Zone or Regional Director recommends → System Admin or Corporate Management approves. Section capacities add up to class and branch capacity unless a class- or branch-level capacity is approved. Branches, classes and sections can be added or closed here (classes and sections through the same approval). System Admin and Corporate Finance can also deactivate a section (kept in the master, excluded from capacity and targets) and activate it again at any time. Alerts fire at ${cfg.capAlertPct}% of capacity.</div>
  ${isCurYear() ? '' : `<div class="note"><b>Capacity for AY ${esc(App.f.ay)}.</b> Existing strength is today's roll; approved capacities here apply to ${esc(App.f.ay)}.</div>`}${card(`Capacity planning · AY ${esc(App.f.ay)} · as on ${dLabel(D)}`, tabs + table('cap', cols, rows, { total: T, limit: lv === 'branch' ? 200 : 60, title: 'Class-wise and Section-wise Capacity Planning' }), { right: exportBtns('cap', 'capacity', { label: false }) })}
  ${card('Capacity change requests and history', et, { right: `${canNew ? '<button class="btn primary sm" data-act="capNew">Add capacity request</button> <button class="btn sm" data-act="secAdd">Add section</button> <button class="btn sm" data-act="secAdd" data-n="class">Add class</button>' : ''}${canTog ? ' <button class="btn sm" data-act="branchNew">Add branch</button>' : ''}${exportBtns('capReq', 'capacity', { label: false })}` })}`;
} };
function capForm(pre) {
  pre = pre || {}; const idx = [...scopeOf(App.user)], e = pre.entry || null, bid0 = pre.bid || (e && e.bid) || '', edit = e && !pre.revise;
  const self = can('capacity', 'Approve');
  modal(edit ? `Edit capacity request · ${e.id}` : pre.revise ? `Revise capacity request · ${e.id}` : 'Capacity change request', `${pre.revise ? `<div class="note">Rejected earlier${e.remarks ? ': ' + esc(e.remarks) : ''}. Saving creates a new request linked to ${esc(e.id)}.</div>` : ''}<div class="form-grid"><label class="fld"><span>Branch</span><select id="cB" data-act="capPick"${edit ? ' disabled' : ''}>${idx.map(i => `<option value="${DATA.branches[i].id}"${DATA.branches[i].id === bid0 ? ' selected' : ''}>${esc(DATA.branches[i].name)}</option>`).join('')}</select></label>
  <label class="fld"><span>Class (blank = whole branch)</span><select id="cC" data-act="capPick"></select></label><label class="fld"><span>Section (blank = whole class)</span><select id="cS" data-act="capPick"></select></label>
  <label class="fld"><span>Current approved capacity</span><input id="cPrev" disabled></label><label class="fld"><span>Existing strength (ERP)</span><input id="cEx" disabled></label><label class="fld"><span>New manual capacity</span><input id="cN" type="number" min="0" data-act="capPick" value="${e ? e.capacity : ''}"></label>
  <label class="fld"><span>Effective from</span><input id="cF" type="date" value="${e ? e.from : ACCESS_DATE}"></label><label class="fld"><span>Effective to (blank = open)</span><input id="cT" type="date" value="${e && e.to ? e.to : ''}"></label><label class="fld"><span>Supporting document</span><input id="cDoc" type="file">${e && e.doc ? `<small>${esc(e.doc)}</small>` : ''}</label></div>
  <div id="cWarn"></div><label class="chk big" id="cOvW" hidden><input type="checkbox" id="cOv"> Override: allow capacity below the target strength</label>
  <label class="fld"><span>Reason for capacity change (required)</span><textarea id="cR" rows="2">${e ? esc(e.reason) : ''}</textarea></label><label class="fld"><span>Remarks</span><textarea id="cRm" rows="2">${e && !pre.revise ? esc(e.remarks || '') : ''}</textarea></label><p class="err" id="cErr" hidden></p>`,
  `<button class="btn" data-act="closeModal">Cancel</button><button class="btn" data-act="capSave" data-v="Draft"${edit ? ` data-k="${e.id}"` : ''}${pre.revise ? ` data-r="${e.id}"` : ''}>Save draft</button><button class="btn primary" data-act="capSave" data-v="Submitted"${edit ? ` data-k="${e.id}"` : ''}${pre.revise ? ` data-r="${e.id}"` : ''}>${edit && e.status === 'Submitted' ? 'Save changes' : 'Submit'}</button>${self ? `<button class="btn primary" data-act="capSave" data-v="Approved"${edit ? ` data-k="${e.id}"` : ''}>Approve now</button>` : ''}`, true);
  capPick(pre.cls != null ? pre.cls : e ? e.cls : undefined, pre.sec != null ? pre.sec : e ? e.sec : undefined);
}
/* Add or close a section: goes through the capacity approval chain as a capacity request flagged newSection / closeSection */
function secForm(o) {
  o = o || {}; const idx = [...scopeOf(App.user)], self = can('capacity', 'Approve'), del = !!o.del, D = D_(), clsMode = !!o.cls && o.sec === '' && del || o.n === 'class';
  const bid0 = o.bid || (App.f.branch && idx.some(i => DATA.branches[i].id === App.f.branch) ? App.f.branch : DATA.branches[idx[0]].id), cls0 = o.cls || '', sec0 = o.sec || '';
  const bi = DATA.branches.findIndex(b => b.id === bid0), classes = [...new Set([...Str.secList(bid0, D).map(k => k.split('|')[0]), ...Str.allActive(bi, D).map(s => s.cls)])].sort((a, c) => clsRank(a) - clsRank(c));
  const delCls = del && clsMode, n = del ? Str.allActive(bi, D).filter(s => s.cls === cls0 && (delCls || s.sec === sec0)).length : 0, cap = del ? (delCls ? Str.classCap(bid0, cls0, D) : Str.secCap(bid0, cls0, sec0, D)) : 0;
  const nsec = delCls ? Str.secList(bid0, D).filter(k => k.startsWith(cls0 + '|')).length : 0;
  modal(del ? (delCls ? `Close class · ${brName(bid0)} · ${cls0}` : `Close section · ${brName(bid0)} · ${cls0} ${sec0}`) : clsMode ? 'Add class' : 'Add section', `<div class="form-grid"><label class="fld"><span>Branch</span><select id="sB" data-act="secPick"${del ? ' disabled' : ''}>${idx.map(i => `<option value="${DATA.branches[i].id}"${DATA.branches[i].id === bid0 ? ' selected' : ''}>${esc(DATA.branches[i].name)}</option>`).join('')}</select></label>
  <label class="fld"><span>Class</span>${del ? `<input value="${esc(cls0)}" disabled>` : clsMode ? `<input id="sC" value="" placeholder="New class name, e.g. Class 11"><datalist id="sCls"></datalist>` : `<input id="sC" list="sCls" value="${esc(cls0)}" placeholder="Existing or new class"><datalist id="sCls">${classes.map(c => `<option value="${esc(c)}">`).join('')}</datalist>`}</label>
  <label class="fld"><span>${clsMode && !del ? 'First section' : 'Section'}</span>${del ? `<input value="${delCls ? nsec + ' sections' : esc(sec0)}" disabled>` : `<input id="sS" value="${clsMode ? 'A' : ''}" placeholder="e.g. C" maxlength="12">`}</label>
  ${del ? `<label class="fld"><span>Students on roll</span><input value="${n}" disabled></label><label class="fld"><span>Approved capacity</span><input value="${cap || 'Not set'}" disabled></label>${n ? (delCls ? `<label class="fld"><span>Move students to class</span><select id="sMv"><option value="">Choose class</option>${classes.filter(c => c !== cls0).map(c => `<option value="${esc(c)}">${esc(c)} · ${Str.allActive(bi, D).filter(s => s.cls === c).length} on roll${Str.classCap(bid0, c, D) ? ' / ' + Str.classCap(bid0, c, D) + ' seats' : ''}</option>`).join('')}</select></label>` : `<label class="fld"><span>Move students to section</span><select id="sMv"><option value="">Choose section</option>${Str.secList(bid0, D).filter(k => k.startsWith(cls0 + '|') && k !== cls0 + '|' + sec0).map(k => { const s2 = k.split('|')[1], c2 = Str.secCap(bid0, cls0, s2, D), n2 = Str.allActive(bi, D).filter(s => s.cls === cls0 && s.sec === s2).length; return `<option value="${esc(s2)}">${esc(s2)} · ${n2} on roll${c2 ? ' / ' + c2 + ' seats' : ''}</option>`; }).join('')}</select></label>`) : ''}` : `<label class="fld"><span>Section capacity (seats)</span><input id="sN" type="number" min="1" value=""></label>`}
  <label class="fld"><span>Effective from</span><input id="sF" type="date" value="${ACCESS_DATE}"></label></div>
  ${del ? (n ? `<div class="note">${n} students are on roll. Choose the ${delCls ? 'class' : 'section'} they move to; the move takes effect on approval and is shown in all reports from the effective date. The ERP will be updated by the next sync.</div>` : `<div class="note">Closing removes the ${delCls ? 'class with all its sections' : 'section'} and its capacity from this academic year\'s planning once approved. History and reports for earlier dates are unchanged.</div>`) : clsMode ? '<div class="note">A class is created with its first section and seats; add more sections afterwards. It counts towards branch capacity once approved.</div>' : '<div class="note">The new section and its seats count towards class and branch capacity once approved. Section names must be unique within the class.</div>'}
  <label class="fld"><span>Reason (required)</span><textarea id="sR" rows="2"></textarea></label><label class="fld"><span>Remarks</span><textarea id="sRm" rows="2"></textarea></label><p class="err" id="sErr" hidden></p>`,
  `<button class="btn" data-act="closeModal">Cancel</button>${['Draft', 'Submitted', 'Approved'].filter(x => x !== 'Approved' || self).map(x => `<button class="btn${x === 'Draft' ? '' : ' primary'}" data-act="secSave" data-v="${x}"${del ? ' data-d="1"' : ''}${clsMode ? ' data-cm="1"' : ''}>${x === 'Draft' ? 'Save draft' : x === 'Submitted' ? 'Submit for approval' : 'Approve now'}</button>`).join('')}`, true);
}
/* Class target strength: the split of the approved branch target by class (sections follow in proportion to strength) */
function classTargetForm(bid, cls) {
  const bi = DATA.branches.findIndex(b => b.id === bid), b = DATA.branches[bi], p = Str.plan(bid), t = Str.branchTarget(bid), D = D_();
  if (!t) return modal('Class target strength', `<div class="note">${esc(b.name)} has no approved branch target for AY ${esc(App.f.ay)} yet. Create and get the branch target approved first; class targets are a split of it.</div>`, `<button class="btn" data-act="closeModal">Close</button><button class="btn primary" data-act="tgtEdit" data-k="${bid}">Create branch target</button>`);
  const cp = Str.classPlan(bi, cls, '', D), ct = Object.assign({}, p.classTargets || {}), others = Object.entries(ct).filter(([c]) => c !== cls).reduce((a, [, n]) => a + (+n || 0), 0), n = Str.allActive(bi, D).filter(s => s.cls === cls).length;
  const list = Object.entries(ct).sort((x, y) => clsRank(x[0]) - clsRank(y[0])).map(([c, v]) => `${esc(c)}: ${NUM(v)}`).join(' · ');
  modal(`Target strength · ${b.name} · ${cls}`, `<div class="form-grid"><label class="fld"><span>Academic year</span><input value="${esc(App.f.ay)}" disabled></label><label class="fld"><span>Approved branch target</span><input value="${NUM(t.target)}" disabled></label><label class="fld"><span>Existing strength in ${esc(cls)}</span><input value="${n}" disabled></label><label class="fld"><span>Approved class capacity</span><input value="${cp.capacity || 'Not set'}" disabled></label>
  <label class="fld"><span>Target strength for ${esc(cls)}</span><input id="ctT" type="number" min="0" value="${cp.target != null ? cp.target : ''}"></label><label class="fld"><span>Other class targets already set</span><input value="${NUM(others)}" disabled></label></div>
  <p class="small">${cp.derived ? 'Currently derived from the branch target in proportion to class strength.' : 'Manual class target in force.'} Class targets together should not exceed the branch target of ${NUM(t.target)}${list ? ' · set so far: ' + list : ''}. A class target above the class capacity is flagged on the capacity screen.</p>
  <label class="chk big" id="ctOvW" hidden><input type="checkbox" id="ctOv"> Override: save even though class targets exceed the branch target</label>
  <label class="fld"><span>Reason / remarks (required)</span><textarea id="ctRem" rows="2"></textarea></label><p class="err" id="ctErr" hidden></p>`,
  `<button class="btn" data-act="closeModal">Cancel</button>${cp.derived ? '' : `<button class="btn" data-act="clsTgtSave" data-b="${bid}" data-c="${esc(cls)}" data-v="clear">Remove manual target</button>`}<button class="btn primary" data-act="clsTgtSave" data-b="${bid}" data-c="${esc(cls)}">Save target</button>`, true);
}
function capPick(cls0, sec0) {
  const bid = v('cB'), bi = DATA.branches.findIndex(b => b.id === bid), keys = Str.secList(bid, D_());
  const cEl = document.getElementById('cC'), sEl = document.getElementById('cS'); if (!cEl) return;
  if (cls0 !== undefined) cEl.value = cls0; if (sec0 !== undefined) sEl.value = sec0;
  const cs = [...new Set(keys.map(k => k.split('|')[0]))].sort((a, c) => clsRank(a) - clsRank(c)); const cv = cs.includes(cls0 !== undefined ? cls0 : cEl.value) ? (cls0 !== undefined ? cls0 : cEl.value) : '';
  cEl.innerHTML = `<option value="">Whole branch</option>` + cs.map(c => `<option ${c === cv ? 'selected' : ''}>${esc(c)}</option>`).join('');
  const ss = keys.filter(k => k.startsWith(cv + '|')).map(k => k.split('|')[1]); const sv = ss.includes(sec0 !== undefined ? sec0 : sEl.value) ? (sec0 !== undefined ? sec0 : sEl.value) : '';
  sEl.innerHTML = `<option value="">${cv ? 'Whole class' : '—'}</option>` + (cv ? ss.map(s => `<option ${s === sv ? 'selected' : ''}>${esc(s)}</option>`).join('') : ''); sEl.disabled = !cv;
  const D = D_(), prev = !cv ? Str.branchCap(bid, D) : !sv ? Str.classCap(bid, cv, D) : Str.secCap(bid, cv, sv, D);
  const act = Str.allActive(bi, D).filter(s => (!cv || s.cls === cv) && (!sv || s.sec === sv)).length;
  document.getElementById('cPrev').value = prev || 'Not set'; document.getElementById('cEx').value = act;
  const tg = !cv ? (Str.branchTarget(bid) || {}).target : Str.classPlan(bi, cv, sv, D).target; const n = +v('cN');
  const over = n && tg != null && tg > n;
  document.getElementById('cWarn').innerHTML = n ? `<div class="kv4"><div><span>Vacant seats</span><b>${NUM(n - act)}</b></div><div><span>Capacity after target</span><b class="${over ? 'red' : ''}">${tg != null ? NUM(n - tg) : '—'}</b></div><div><span>Capacity utilisation</span><b>${PCT(act / n * 100)}</b></div><div><span>Target capacity utilisation</span><b class="${over ? 'red' : ''}">${tg != null ? PCT(tg / n * 100) : '—'}</b></div></div>${over ? `<p class="err">Target strength ${NUM(tg)} is above this capacity. Submission needs an override with mandatory remarks.</p>` : ''}` : '';
  document.getElementById('cOvW').hidden = !over;
}

/* ---------- Admission target achievement plan ---------- */
function admPlanRow(i, D) {
  const b = DATA.branches[i], P = Object.assign({}, defaultAdmPlans()[b.id], Store.get('admplans')[b.id] || {}), t = Str.branchTarget(b.id), cur = Str.rowsFor([i], D);
  const start = E.dn(P.start), end = E.dn(P.completion), from = Math.max(D + 1, start);
  const days = P.workDays ? +P.workDays : workDays(from, end), totalDays = workDays(start, end);
  const atStart = DATA.students.filter(s => s.b === i && Str.active(s, Math.min(start, D))).length;
  const achieved = DATA.students.filter(s => s.b === i && NEWT.includes(s.admType) && s.enrol >= start && s.enrol <= D && !(s.exit && s.exit <= D)).length;
  const tgt = t ? t.target : null, need = tgt != null ? Math.max(0, tgt - cur.strength) : null;
  const avgNet = +P.avgNet || (t ? t.avgNet : cur.net / Math.max(1, cur.strength)), conv = (+P.conv || 25) / 100;
  const calDays = Math.max(1, end - from + 1), months = calDays / 30.4, weeks = calDays / 7;
  const plannedToDate = tgt != null ? Math.max(0, tgt - atStart) * Math.min(1, workDays(start, D) / Math.max(1, totalDays)) : 0;
  const rev = need != null ? need * avgNet : null;
  return { b, P, tgt, existing: cur.strength, need, days, monthly: P.monthlyTarget ? +P.monthlyTarget : need != null ? Math.ceil(need / Math.max(1, months)) : null, weekly: need != null ? Math.ceil(need / Math.max(1, weeks)) : null, daily: need != null && days ? need / days : null, leads: need != null ? Math.ceil(need / conv) : null, achieved, balance: need, rev, revM: rev != null ? rev / Math.max(1, months) : null, revW: rev != null ? rev / Math.max(1, weeks) : null, revD: rev != null && days ? rev / days : null, shortfall: Math.max(0, Math.round(plannedToDate - achieved)), revShort: t ? Math.max(0, t.revTarget - cur.net) : null, conv: +P.conv || 25, walkins: +P.walkins || 0, start: P.start, completion: P.completion, avgNet };
}
PAGES.admplan = { title: 'Admission Target Achievement Plan', mod: 'admplan', render() {
  const D = D_(), idx = scopeIdx(); if (!idx.length) return empty('No branches in your scope.');
  const rows = idx.map(i => admPlanRow(i, D)), ed = can('admplan', 'Edit');
  const resp = r => { if (!r.P) return ['', '', '']; const P = r.P; const pr = users().find(u => u.role === 'Principal' && u.branch === r.b.id), bdU = directorOf(r.b.id, App.f.date), co = users().find(u => u.role === 'Admissions Counsellor' && u.zone === r.b.zone); return [P.principal || (pr ? pr.name.replace(' (demo)', '') : '—'), P.bd || (bdU ? bdU.name.replace(' (demo)', '') : '—'), P.counsellor || (co ? co.name.replace(' (demo)', '') : '—')]; };
  const cols = [{ h: 'Branch', k: r => r.b.name, t: 'text', cls: 'sticky wrap', w: 180 }, { h: 'Students needed', k: r => r.need, t: 'num', cls: 'em' }, { h: 'Days remaining', k: r => r.days, t: 'num' }, { h: 'Monthly target', k: r => r.monthly, t: 'num' }, { h: 'Weekly target', k: r => r.weekly, t: 'num' }, { h: 'Daily target', k: r => r.daily == null ? null : Math.round(r.daily * 10) / 10, t: 'text', x: r => r.daily },
    { h: 'Leads required', k: r => r.leads, t: 'num' }, { h: 'Conversion %', k: r => r.conv, t: 'pct' }, { h: 'Admissions achieved', k: r => r.achieved, t: 'num' }, { h: 'Balance admissions', k: r => r.balance, t: 'num' }, { h: 'Admission shortfall', k: r => r.shortfall, t: 'num', rc: r => r.shortfall > 0 ? 'red' : '' },
    { h: 'Expected revenue', k: r => r.rev, t: 'inr' }, { h: 'Revenue per month', k: r => r.revM, t: 'inr' }, { h: 'Revenue per day', k: r => r.revD, t: 'inr' }, { h: 'Revenue shortfall', k: r => r.revShort, t: 'inr' },
    { h: 'Plan', k: r => `${isoLabel(r.start).slice(0, -5)} → ${isoLabel(r.completion)}`, t: 'text' }, { h: 'Principal', k: r => resp(r)[0], t: 'text' }, { h: 'Zonal Director', k: r => resp(r)[1], t: 'text' }, { h: 'Counsellor', k: r => resp(r)[2], t: 'text' },
    ...(ed ? [{ h: '', k: r => `<button class="btn sm" data-act="admEdit" data-k="${r.b.id}">Edit plan</button>`, t: 'html', noexp: true }] : [])];
  const T = { b: { name: 'Total' }, need: 0, monthly: 0, weekly: 0, leads: 0, achieved: 0, balance: 0, shortfall: 0, rev: 0, revM: 0, revD: 0, revShort: 0 }; rows.forEach(r => ['need', 'monthly', 'weekly', 'leads', 'achieved', 'balance', 'shortfall', 'rev', 'revM', 'revD', 'revShort'].forEach(k => T[k] += r[k] || 0)); T.days = rows[0] ? rows[0].days : 0; T.daily = T.days ? T.need / T.days : null;
  // charts: monthly target vs actual, required vs actual daily rate
  const monthsAdm = Array.from({ length: 10 }, (_, m) => idx.reduce((a, i) => a + DATA.leads[i].months[m].adm, 0));
  const leads = Array.from({ length: 10 }, (_, m) => idx.reduce((a, i) => a + DATA.leads[i].months[m].leads, 0));
  vchart('aM', 'bar', MON.slice(0, 10), [{ label: 'Leads / enquiries', data: leads }, { label: 'Admissions', data: monthsAdm }]);
  const last30 = DATA.students.filter(s => idx.includes(s.b) && NEWT.includes(s.admType) && s.enrol > D - 30 && s.enrol <= D).length, wd30 = workDays(D - 29, D);
  const actualRate = wd30 ? last30 / wd30 : 0;
  vchart('aR', 'bar', ['Required per day', 'Actual per day (last 30 days)'], [{ label: 'Admissions per working day', data: [+(T.daily || 0).toFixed(1), +actualRate.toFixed(1)], backgroundColor: [cssVar('--chart-1'), actualRate >= (T.daily || 0) ? cssVar('--good') : cssVar('--bad')] }]);
  const answer = `<div class="answer"><b>${NUM(T.need)} more students needed</b> by the plan dates, about ${(T.daily || 0).toFixed(1)} a working day (${NUM(T.leads)} leads at the planned conversion rates). Recent pace: ${actualRate.toFixed(1)} a day. Expected revenue from these admissions: ${INRS(T.rev)}.</div>`;
  return `${answer}<div class="grid2">${card('Leads and admissions by month', chartBox('aM', 'Leads and admissions by month', 240), { sub: 'Jan–Oct 2026' })}${card('Required vs actual daily admission rate', chartBox('aR', 'Required and actual admissions per day', 240))}</div>${card('Branch admission plan', table('adm', cols, rows, { total: T, title: 'Admission Target Achievement Plan' }), { right: exportBtns('adm', 'admplan', { label: false }), sub: 'Students needed = approved target − existing strength. Daily target uses the working-days calendar between today and the completion date.' })}`;
} };
function admForm(bid) {
  const P = Object.assign({}, defaultAdmPlans()[bid], Store.get('admplans')[bid] || {});
  const f = (id, l, val, t = 'text') => `<label class="fld"><span>${l}</span><input id="${id}" type="${t}" value="${esc(val == null ? '' : val)}"></label>`;
  modal('Admission plan · ' + brName(bid), `<div class="form-grid">${f('pS', 'Plan start date', P.start, 'date')}${f('pC', 'Target completion date', P.completion, 'date')}${f('pW', 'Working / admission days (blank = from calendar)', P.workDays, 'number')}${f('pWi', 'Expected daily walk-ins', P.walkins, 'number')}${f('pCv', 'Expected lead conversion %', P.conv, 'number')}${f('pN', 'Average net fee per student (blank = from target plan)', P.avgNet, 'number')}${f('pM', 'Monthly admission target (blank = calculated)', P.monthlyTarget, 'number')}${f('pPr', 'Responsible Principal', P.principal)}${f('pH', 'Admissions Head', P.head)}${f('pCo', 'Admissions Counsellor', P.counsellor)}${f('pBd', 'Zonal Director', P.bd)}</div><label class="fld"><span>Student category targets (one per line, e.g. “New Admission: 40”)</span><textarea id="pCat" rows="3">${esc(P.catTargets || '')}</textarea></label>`,
  `<button class="btn" data-act="closeModal">Cancel</button><button class="btn primary" data-act="admSave" data-k="${bid}">Save plan</button>`, true);
}

/* ---------- Revenue, collection and outstanding ---------- */
PAGES.revenue = { title: 'Revenue, Collection & Outstanding', mod: 'revenue', sf: true, render() {
  const D = D_(), idx = scopeIdx(); if (!idx.length) return empty('No branches in your scope for these filters.');
  const by = App.ui.rvBy || 'stcat';
  const rows = Str.rows(D, by, idx).sort((a, b) => b.net - a.net), T = Str.sum(Str.rows(D, 'branch', idx));
  const k = (l, vv, s = '') => `<div class="kpi"><div class="kpi-l">${l}</div><div class="kpi-v">${vv}</div><div class="kpi-s">${s}</div></div>`;
  const kp = `<div class="kpis k6">${k('Gross revenue potential', INRS(T.gross))}${k('Concession and scholarship impact', INRS(T.conc + T.schol), `${INRS(T.conc)} concession · ${INRS(T.schol)} scholarship`)}${k('Net revenue potential', INRS(T.net))}${k('Revenue target', T.revTarget != null ? INRS(T.revTarget) : '—')}${k('Revenue generated', INRS(T.net), T.revAchPct != null ? `${PCT(T.revAchPct)} of target` : '')}${k('Revenue shortfall', T.revGap != null ? INRS(Math.max(0, T.revGap)) : '—')}
    ${k('From new admissions', INRS(T.revNew), `${NUM(T.newAdm)} students`)}${k('From renewals', INRS(T.revRen), `${NUM(T.renewals)} students`)}${k('From continuing students', INRS(T.revCont), `${NUM(T.cont)} students`)}${k('Collection received', INRS(T.collected), `${PCT(T.colPct)} of net`)}${k('Outstanding balance', INRS(T.os))}${k('Zero payers', NUM(T.zpN), INRS(T.zpAmt))}${k('Expected revenue from pending target admissions', INRS(T.expRev))}</div>`;
  const tabs = `<div class="tabs">${['region', 'zone', 'branch', 'class', 'stcat', 'feecat'].map(x => `<button class="tab${x === by ? ' on' : ''}" data-act="ui" data-k="rvBy" data-v="${x}">${LVL_NAME[x]}</button>`).join('')}</div>`;
  const lab = r => by === 'class' && r.branch ? `${r.branch} · ${r.label}` : r.label;
  const cols = [{ h: LVL_NAME[by], k: lab, t: 'text', cls: 'wrap' }, { h: 'Student count', k: r => r.existing, t: 'num' }, { h: 'Gross fee', k: r => r.gross, t: 'inr' }, { h: 'Concession / scholarship', k: r => r.conc + r.schol, t: 'inr' }, { h: 'Net revenue', k: r => r.net, t: 'inr', cls: 'em' }, { h: 'Revenue target', k: r => r.revTarget, t: 'inr' }, { h: 'Revenue achievement', k: r => Str.chip(r.revAchPct), t: 'html', x: r => r.revAchPct, cls: 'n' }, { h: 'Amount collected', k: r => r.collected, t: 'inr' }, { h: 'Outstanding', k: r => r.os, t: 'inr' }, { h: 'Collection %', k: r => r.colPct, t: 'pct' }, { h: 'Zero payers', k: r => r.zpN, t: 'num' }, { h: 'Zero-payer amount', k: r => r.zpAmt, t: 'inr' }];
  const RT = Str.sum(rows);
  const ag = T.ag, agT = ag.reduce((a, x) => a + x, 0) || 1;
  const ageing = ['0–30 days', '31–60 days', '61–90 days', '91–180 days', 'Above 180 days'].map((l, i) => `<div class="hb"><span class="hb-l">${l}</span><span class="hb-t"><span style="width:${ag[i] / Math.max(...ag, 1) * 100}%" class="s${i}"></span></span><span class="hb-v">${INRS(ag[i])} <em>${PCT(ag[i] / agT * 100, 0)}</em></span></div>`).join('');
  return `${kp}${card('Revenue by', tabs + table('rev', cols, rows, { total: RT, rowAct: by === 'branch' ? 'drillBranch' : null, rowKey: r => r.bid, limit: 40, title: 'Revenue, Collection and Outstanding' }), { right: exportBtns('rev', 'revenue', { label: false }), sub: 'Revenue generated = net annual fee of enrolled students after concessions and scholarships. Collected and outstanding come from the same student fee ledger as the fee reports.' })}<div class="grid2">${card('Outstanding ageing', `<div class="hbars">${ageing}</div>`, { sub: 'Days past due date' })}${card('Zero payers', `<p>${NUM(T.zpN)} students owe ${INR(T.zpAmt)} with nothing paid against their dues.</p><button class="btn sm" data-act="go" data-r="zeropayer">Open zero payer analysis</button>`)}</div>`;
} };

/* ---------- Multi-year comparison ---------- */
function yearRow(bi, ay, D) {
  const b = DATA.branches[bi];
  if (ay !== CUR_AY) return Str.hist(b.id, ay) || null;
  const r = Str.rowsFor([bi], D), t = Str.branchTarget(b.id);
  const mc = Array.from({ length: 12 }, (_, m) => { const a = E.dn(new Date(Date.UTC(2026, 3 + m, 1)).toISOString().slice(0, 10)), z = Math.min(D, E.dn(new Date(Date.UTC(2026, 4 + m, 0)).toISOString().slice(0, 10))); return a > D ? null : E.sumRange(A.colCum[bi], a, z); });
  const prev = Str.hist(b.id, '2025-26') || {};
  return { strength: r.strength, target: t ? t.target : null, capacity: Str.branchCap(b.id, D) || null, newAdm: r.newAdm, renewals: r.renewals, withdrawals: r.withdrawals, cancellations: r.cancellations, transfersIn: r.transfersIn, transfersOut: r.transfersOut, newTarget: t ? Math.max(0, t.target - (r.strength - r.newAdm)) : null, renewTarget: prev.strength ? Math.round(prev.strength * 0.78) : null, gross: r.gross, conc: r.conc, schol: r.schol, net: r.net, revTarget: t ? t.revTarget : null, demand: r.net + r.pyOpen, collected: r.collected, outstanding: r.outstanding, openOS: r.pyOpen, zpAmt: r.zpAmt, monthCol: mc, current: true };
}
PAGES.compare = { title: 'Multi-year Comparison', mod: 'compare', render() {
  const D = D_(), idx = scopeIdx(); if (!idx.length) return empty('No branches in your scope for these filters.');
  const avail = yearsList().filter(y => y.status !== 'Upcoming').map(y => y.code);
  const yrs = (App.ui.years || '2023-24,2024-25,2025-26,2026-27').split(',').filter(y => avail.includes(y)), tab = App.ui.cmpTab || 'A';
  if (yrs.length < 2) return empty('Pick at least two academic years with data.');
  const share = App.f.cls ? (i => { const all = Str.allActive(i, D); return all.filter(s => s.cls === App.f.cls).length / Math.max(1, all.length); }) : () => 1;
  const Y = {}; yrs.forEach(y => { Y[y] = idx.map(i => { const r = yearRow(i, y, D); if (!r) return null; const f = y === CUR_AY ? 1 : share(i); return f === 1 ? r : Object.assign({}, r, ...['strength', 'target', 'capacity', 'newAdm', 'renewals', 'withdrawals', 'gross', 'conc', 'schol', 'net', 'revTarget', 'demand', 'collected', 'outstanding', 'zpAmt'].map(k => ({ [k]: r[k] == null ? null : r[k] * f }))); }); });
  const sumY = (y, k) => Y[y].reduce((a, r) => a + (r && r[k] != null ? r[k] : 0), 0);
  const ysel = `<div class="ctrls"><div class="fld"><span>Academic years (pick 2 to 5)</span><div class="btnrow">${avail.map(y => `<label class="chk"><input type="checkbox" data-act="yearPick" value="${y}" ${yrs.includes(y) ? 'checked' : ''}> ${y}</label>`).join('')}</div></div></div>`;
  const tabs = `<div class="tabs">${[['A', 'A. Student strength'], ['B', 'B. Revenue'], ['C', 'C. Collection & outstanding'], ['D', 'D. Admission performance']].map(([k, l]) => `<button class="tab${k === tab ? ' on' : ''}" data-act="ui" data-k="cmpTab" data-v="${k}">${l}</button>`).join('')}</div>`;
  const last = yrs.at(-1), prevY = yrs.at(-2);
  const g = (a, b) => b ? (a - b) / b * 100 : null;
  const brRow = (i, n) => ({ i, name: DATA.branches[i].name, bid: DATA.branches[i].id, y: Object.fromEntries(yrs.map(y => [y, Y[y][n]])) });
  const rowsB = idx.map((i, n) => brRow(i, n));
  const tot = { name: 'Total', y: Object.fromEntries(yrs.map(y => [y, Object.fromEntries(['strength', 'target', 'capacity', 'newAdm', 'renewals', 'withdrawals', 'cancellations', 'transfersIn', 'transfersOut', 'newTarget', 'renewTarget', 'gross', 'conc', 'schol', 'net', 'revTarget', 'demand', 'collected', 'outstanding', 'openOS', 'zpAmt'].map(k => [k, sumY(y, k)]))])) };
  const cur = yrs.includes(CUR_AY) ? CUR_AY : null;
  const note = `<p class="card-sub">Years before ${CUR_AY} are demo history until imported (Data Import) or synced from the ERP. ${App.f.cls ? `Class filter: earlier years are estimated from this year's class share.` : ''} ${App.f.stCat || App.f.feeCat || App.f.source || App.f.couns ? 'Category, source and counsellor filters apply to the current year only.' : ''}</p>`;
  let body = '', chartHtml = '';
  if (tab === 'A') {
    const cols = [{ h: 'Branch', k: r => r.name, t: 'text', cls: 'sticky wrap', w: 170 }, ...yrs.map(y => ({ h: `${y} strength`, k: r => r.y[y] ? r.y[y].strength : null, t: 'num' })), { h: 'Current target', k: r => cur && r.y[cur] ? r.y[cur].target : null, t: 'num' }, { h: 'Current actual', k: r => cur && r.y[cur] ? r.y[cur].strength : null, t: 'num' }, { h: `Growth / decline ${prevY}→${last}`, k: r => r.y[last] && r.y[prevY] ? g(r.y[last].strength, r.y[prevY].strength) : null, t: 'pct', rc: r => r.y[last] && r.y[prevY] && r.y[last].strength < r.y[prevY].strength ? 'red' : 'green' }];
    body = table('cmpA', cols, rowsB, { total: tot, rowAct: 'drillBranch', rowKey: r => r.bid, title: 'Student Strength Comparison' });
    const yt = table('cmpA2', [{ h: 'Year', k: r => r.y, t: 'text' }, { h: 'Strength', k: r => r.strength, t: 'num' }, { h: 'Target', k: r => r.target, t: 'num' }, { h: 'Target vs actual', k: r => r.target ? r.strength / r.target * 100 : null, t: 'pct' }, { h: 'Capacity', k: r => r.capacity, t: 'num' }, { h: 'Capacity utilisation', k: r => r.capacity ? r.strength / r.capacity * 100 : null, t: 'pct' }, { h: 'Gross admissions', k: r => r.newAdm, t: 'num' }, { h: 'Renewals', k: r => r.renewals, t: 'num' }, { h: 'Cancellations', k: r => r.cancellations, t: 'num' }, { h: 'Withdrawals', k: r => r.withdrawals, t: 'num' }, { h: 'Transfers out', k: r => r.transfersOut, t: 'num' }, { h: 'Net growth', k: r => r.newAdm - (r.cancellations || 0) - (r.withdrawals || 0) - (r.transfersOut || 0), t: 'num', cls: 'em' }, { h: 'Cancellation %', k: r => r.newAdm ? (r.cancellations || 0) / r.newAdm * 100 : null, t: 'pct' }, { h: 'Strength growth', k: r => r.gr, t: 'pct' }], yrs.map((y, n) => Object.assign({ y, gr: n ? g(tot.y[y].strength, tot.y[yrs[n - 1]].strength) : null }, tot.y[y])), { compact: true, title: 'Strength by year' });
    vchart('yN', 'bar', yrs, [{ label: 'Gross admissions', data: yrs.map(y => Math.round(tot.y[y].newAdm)) }, { label: 'Cancellations + withdrawals + transfers out', data: yrs.map(y => Math.round((tot.y[y].cancellations || 0) + (tot.y[y].withdrawals || 0) + (tot.y[y].transfersOut || 0))) }, { label: 'Net growth', data: yrs.map(y => Math.round(tot.y[y].newAdm - (tot.y[y].cancellations || 0) - (tot.y[y].withdrawals || 0) - (tot.y[y].transfersOut || 0))) }]);
    vchart('yS', 'line', yrs, [{ label: 'Strength', data: yrs.map(y => Math.round(tot.y[y].strength)) }, { label: 'Target', data: yrs.map(y => Math.round(tot.y[y].target)) }, { label: 'Capacity', data: yrs.map(y => Math.round(tot.y[y].capacity)) }]);
    chartHtml = `<div class="grid-main">${card('Year-wise strength trend', chartBox('yS', 'Strength, target and capacity by year', 240))}${card('Gross admissions vs net growth', chartBox('yN', 'Gross admissions, exits and net growth by year', 240), { sub: 'Exits = cancellations + withdrawals + transfers out' })}</div>${card('Strength, admissions and exits by year', yt)}`;
  } else if (tab === 'B') {
    const cols = [{ h: 'Branch', k: r => r.name, t: 'text', cls: 'sticky wrap', w: 170 }, ...yrs.map(y => ({ h: `${y} net revenue`, k: r => r.y[y] ? r.y[y].net : null, t: 'inr' })), { h: 'Current revenue target', k: r => cur && r.y[cur] ? r.y[cur].revTarget : null, t: 'inr' }, { h: 'Current revenue generated', k: r => cur && r.y[cur] ? r.y[cur].net : null, t: 'inr' }, { h: 'Variance', k: r => cur && r.y[cur] && r.y[cur].revTarget != null ? r.y[cur].net - r.y[cur].revTarget : null, t: 'inr', rc: r => cur && r.y[cur] && r.y[cur].net < (r.y[cur].revTarget || 0) ? 'red' : 'green' }];
    body = table('cmpB', cols, rowsB, { total: tot, rowAct: 'drillBranch', rowKey: r => r.bid, title: 'Revenue Comparison' });
    const yt = table('cmpB2', [{ h: 'Year', k: r => r.y, t: 'text' }, { h: 'Gross fee', k: r => r.gross, t: 'inr' }, { h: 'Concessions', k: r => r.conc, t: 'inr' }, { h: 'Scholarships', k: r => r.schol, t: 'inr' }, { h: 'Net revenue', k: r => r.net, t: 'inr' }, { h: 'Revenue per student', k: r => r.strength ? r.net / r.strength : null, t: 'inr' }, { h: 'Target', k: r => r.revTarget, t: 'inr' }, { h: 'Target vs actual', k: r => r.revTarget ? r.net / r.revTarget * 100 : null, t: 'pct' }, { h: 'Growth', k: r => r.gr, t: 'pct' }], yrs.map((y, n) => Object.assign({ y, gr: n ? g(tot.y[y].net, tot.y[yrs[n - 1]].net) : null }, tot.y[y])), { compact: true, title: 'Revenue by year' });
    vchart('yR', 'bar', yrs, [{ label: 'Revenue target', data: yrs.map(y => Math.round(tot.y[y].revTarget)) }, { label: 'Net revenue', data: yrs.map(y => Math.round(tot.y[y].net)) }], { fmt: INRS });
    chartHtml = `<div class="grid-main">${card('Year-wise revenue trend', chartBox('yR', 'Revenue target and net revenue by year', 240))}${card('By year', yt)}</div>`;
  } else if (tab === 'C') {
    const flat = []; rowsB.forEach(r => yrs.forEach(y => { const v = r.y[y]; if (v) flat.push({ name: r.name, bid: r.bid, y, ...v }); }));
    body = table('cmpC', [{ h: 'Branch', k: r => r.name, t: 'text', cls: 'wrap' }, { h: 'Academic year', k: r => r.y, t: 'text' }, { h: 'Opening outstanding', k: r => r.openOS, t: 'inr' }, { h: 'Total fee demand', k: r => r.demand, t: 'inr' }, { h: 'Amount collected', k: r => r.collected, t: 'inr' }, { h: 'Outstanding', k: r => r.outstanding, t: 'inr' }, { h: 'Collection %', k: r => r.demand ? r.collected / r.demand * 100 : null, t: 'pct' }, { h: 'Zero-payer amount', k: r => r.zpAmt, t: 'inr' }, { h: 'Concession', k: r => (r.conc || 0) + (r.schol || 0), t: 'inr' }], flat, { limit: 60, title: 'Collection and Outstanding Comparison' });
    vchart('yC', 'bar', yrs, [{ label: 'Collected', data: yrs.map(y => Math.round(tot.y[y].collected)) }, { label: 'Outstanding', data: yrs.map(y => Math.round(tot.y[y].outstanding)) }], { fmt: INRS });
    const ml = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    vchart('yM', 'line', ml, yrs.map(y => ({ label: y, data: ml.map((_, m) => { const vals = Y[y].map(r => r && r.monthCol ? r.monthCol[m] : null); return vals.every(x => x == null) ? null : Math.round(vals.reduce((a, x) => a + (x || 0), 0)); }) })), { fmt: INRS });
    chartHtml = `<div class="grid2">${card('Year-wise collection and outstanding', chartBox('yC', 'Collected and outstanding by year', 240))}${card('Month-wise collection', chartBox('yM', 'Collection by month for each year', 240), { sub: 'April to March' })}</div>`;
  } else {
    const flat = []; rowsB.forEach(r => yrs.forEach(y => { const v = r.y[y]; if (v) flat.push({ name: r.name, bid: r.bid, y, ...v }); }));
    body = table('cmpD', [{ h: 'Branch', k: r => r.name, t: 'text', cls: 'wrap' }, { h: 'Year', k: r => r.y, t: 'text' }, { h: 'New admission target', k: r => r.newTarget, t: 'num' }, { h: 'New admissions achieved', k: r => r.newAdm, t: 'num' }, { h: 'Cancellations', k: r => r.cancellations, t: 'num' }, { h: 'Withdrawals', k: r => r.withdrawals, t: 'num' }, { h: 'Net growth', k: r => r.newAdm - (r.cancellations || 0) - (r.withdrawals || 0) - (r.transfersOut || 0), t: 'num' }, { h: 'Renewal target', k: r => r.renewTarget, t: 'num' }, { h: 'Renewals achieved', k: r => r.renewals, t: 'num' }, { h: 'Total strength target', k: r => r.target, t: 'num' }, { h: 'Actual strength', k: r => r.strength, t: 'num' }], flat, { limit: 60, title: 'Admission Performance Comparison' });
    const src = Str.rows(D, 'source', idx).filter(r => r.key !== 'Existing student').sort((a, b) => b.newAdm - a.newAdm), cou = Str.rows(D, 'couns', idx).filter(r => r.key !== '—').sort((a, b) => b.newAdm - a.newAdm);
    hbar('ySrc', src.map(r => r.label), [{ label: `New admissions ${CUR_AY}`, data: src.map(r => r.newAdm) }]);
    chartHtml = `<div class="grid2">${card('Admissions by source · current year', chartBox('ySrc', 'New admissions by source', Math.max(180, src.length * 26 + 60)))}${card('Admissions by counsellor · current year', table('cmpCou', [{ h: 'Counsellor', k: r => r.label, t: 'text' }, { h: 'New admissions', k: r => r.newAdm, t: 'num' }, { h: 'Net revenue', k: r => r.revNew, t: 'inr' }], cou, { compact: true, title: 'Admissions by counsellor' }))}</div>`;
  }
  return card('Compare academic years', ysel + tabs + note) + chartHtml + card({ A: 'Student strength comparison', B: 'Revenue comparison', C: 'Collection and outstanding comparison', D: 'Admission performance comparison' }[tab], body, { right: exportBtns({ A: 'cmpA', B: 'cmpB', C: 'cmpC', D: 'cmpD' }[tab], 'compare', { label: false }) });
} };

/* ---------- Category masters ---------- */
PAGES.masters = { title: 'Student & Fee Category Masters', mod: 'masters', render() {
  const C = Store.get('categories'), ed = can('masters', 'Edit');
  const counts = { student: {}, fee: {}, cancel: {} }; const CR = C.cancel || []; DATA.students.forEach(s => { counts.student[s.stCat] = (counts.student[s.stCat] || 0) + 1; counts.fee[s.feeCat] = (counts.fee[s.feeCat] || 0) + 1; if (s.exit) { const c = CR.find(x => x.name === s.exitReason); if (c) counts.cancel[c.id] = (counts.cancel[c.id] || 0) + 1; } });
  const list = kind => `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Order</th><th>${kind === 'cancel' ? 'Reason' : 'Category'}</th><th class="n">Students</th><th>Status</th>${ed ? '<th></th>' : ''}</tr></thead><tbody>${C[kind].slice().sort((a, b) => a.order - b.order).map((c, i, arr) => `<tr><td>${i + 1}</td><td>${esc(c.name)}${c.derived ? ' <span class="muted small">(from payment status)</span>' : ''}</td><td class="n">${c.derived ? '—' : NUM(counts[kind][c.id] || 0)}</td><td>${c.active ? pill('Active', 'ok') : pill('Inactive')}</td>${ed ? `<td class="btnrow"><button class="btn sm" data-act="catMove" data-k="${kind}:${c.id}" data-v="-1" ${i ? '' : 'disabled'} aria-label="Move up">↑</button><button class="btn sm" data-act="catMove" data-k="${kind}:${c.id}" data-v="1" ${i < arr.length - 1 ? '' : 'disabled'} aria-label="Move down">↓</button><button class="btn sm" data-act="catEdit" data-k="${kind}:${c.id}">Rename</button><button class="btn sm" data-act="catToggle" data-k="${kind}:${c.id}">${c.active ? 'Deactivate' : 'Activate'}</button></td>` : ''}</tr>`).join('')}</tbody></table></div>${ed ? `<div class="ctrls"><label class="fld grow"><span>New ${kind === 'cancel' ? 'reason' : kind === 'student' ? 'student category' : 'fee category'}</span><input id="newCat_${kind}"></label><button class="btn" data-act="catAdd" data-k="${kind}">Add</button></div>` : ''}`;
  const cancList = list('cancel');
  return `<div class="note">Categories come from the ERP student and fee records. Renaming here changes the name shown in every report; the ERP code stays the same. Deactivated categories stay on historical records but cannot be chosen for new ones.</div><div class="grid2">${card('Student categories', list('student'))}${card('Fee categories', list('fee'))}</div>${card('Cancellation and withdrawal reasons', cancList, { sub: 'A reason is mandatory on every cancellation or withdrawal request. Reasons marked inactive stay on past records.' })}`;
} };

/* ---------- Data import ---------- */
const IMPORTS = {
  targets: { name: 'Target strength', cols: ['Academic Year', 'Branch ID', 'Class (optional)', 'Manual Target Strength', 'Average Gross Fee', 'Average Concession %', 'Revenue Target', 'Target Completion Date', 'Remarks'], ex: [[CUR_AY, 'B21', '', 1800, 85000, 6.5, 143055000, '2026-12-31', 'Board approved'], [CUR_AY, 'B21', 'Inter 1st Year', 950, '', '', '', '', '']] },
  capacity: { name: 'Capacity', cols: ['Academic Year', 'Branch ID', 'Class (optional)', 'Section (optional)', 'Manual Approved Capacity', 'Effective From', 'Effective To', 'Reason'], ex: [[CUR_AY, 'B21', 'Inter 1st Year', 'MPC-A', 120, '2026-11-01', '', 'Extra classroom'], [CUR_AY, 'B07', '', '', 1600, '2026-11-01', '', 'New block']] },
  history: { name: 'Historical year data', cols: ['Academic Year', 'Branch ID', 'Strength', 'Target Strength', 'Capacity', 'New Admissions', 'Renewals', 'Withdrawals', 'Cancellations', 'Transfers Out', 'Gross Fee', 'Concession', 'Scholarship', 'Net Revenue', 'Revenue Target', 'Total Fee Demand', 'Collected', 'Outstanding', 'Zero Payer Amount'], ex: [['2024-25', 'B21', 1650, 1700, 1800, 520, 1130, 48, 22, 6, 140000000, 6000000, 3000000, 131000000, 135000000, 140000000, 121000000, 19000000, 4200000]] }
};
PAGES.import = { title: 'Data Import (Excel)', mod: 'import', render() {
  const k = App.ui.impType || 'targets', I = IMPORTS[k], P = App.ui.impPreview;
  const tabs = `<div class="tabs">${Object.entries(IMPORTS).map(([x, d]) => `<button class="tab${x === k ? ' on' : ''}" data-act="ui" data-k="impType" data-v="${x}">${d.name}</button>`).join('')}</div>`;
  const prev = P && P.type === k ? `<h4>Preview · ${P.rows.length} rows · ${P.rows.filter(r => r.err).length} with errors</h4><div class="tbl-wrap"><table class="tbl mini"><thead><tr><th>Row</th>${I.cols.map(c => `<th>${esc(c)}</th>`).join('')}<th>Check</th></tr></thead><tbody>${P.rows.slice(0, 200).map(r => `<tr><td>${r.n}</td>${I.cols.map(c => `<td>${esc(r.v[c] == null ? '' : r.v[c])}</td>`).join('')}<td class="${r.err ? 'red' : 'green'}">${esc(r.err || 'OK')}</td></tr>`).join('')}</tbody></table></div><div class="btnrow"><button class="btn primary" data-act="impRun" ${P.rows.some(r => !r.err) ? '' : 'disabled'}>Import ${P.rows.filter(r => !r.err).length} valid rows</button><button class="btn" data-act="impClear">Clear</button></div>` : '';
  const what = { targets: 'Imported targets are saved as Submitted and take effect after approval on the Target Planning screen.', capacity: 'Imported capacities are saved as Submitted requests and follow the normal recommend and approve steps.', history: 'Historical figures replace the demo history for that branch and year in the multi-year comparison. Use it for years or fields not available in the ERP.' }[k];
  return `<div class="note">Authorised import for historical data or data not held in the ERP. Every import is recorded in the audit log with the file name and row count.</div>${card('Import from Excel or CSV', `${tabs}<p class="small">${what}</p><p class="small">Columns, in this order: ${I.cols.map(c => `<code>${esc(c)}</code>`).join(', ')}.</p><div class="ctrls"><button class="btn" data-act="impTemplate">Download template</button><label class="fld"><span>Choose file (.xlsx or .csv)</span><input type="file" id="impFile" accept=".xlsx,.xls,.csv" data-act="impFile"></label></div>${prev}`)}`;
} };

/* ---------- Hierarchy setup (System Admin) ---------- */
function hierOf(b, iso) {
  const M = Store.get('mappings'), U = users();
  const pr = M.filter(m => m.type === 'Own Branch Only' && activeOn(m, iso) && (m.branches || []).includes(b.id)).map(m => userById(m.user)).filter(u => u && u.role === 'Principal')[0];
  const zd = M.filter(m => m.type === 'All Branches Under Zone' && m.zone === b.zone && activeOn(m, iso)).map(m => userById(m.user)).filter(u => u && u.role === 'Zonal Director')[0];
  const rd = M.filter(m => m.type === 'All Branches Under Region' && m.region === b.region && activeOn(m, iso)).map(m => userById(m.user)).filter(u => u && u.role === 'Regional Director')[0];
  return { pr, zd, rd };
}
PAGES.hierarchy = { title: 'Organisation & directors', mod: 'admin_mapping', render() {
  const iso = ACCESS_DATE, ed = can('admin_mapping', 'Manage branch mapping') || can('admin_mapping', 'Edit');
  const nm = u => u ? u.name.replace(' (demo)', '') : '<span class="red">Vacant</span>';
  const rows = DATA.branches.map(b => Object.assign({ b }, hierOf(b, iso)));
  const btn = (pos, bid) => ed ? ` <button class="btn sm ghost" data-act="hierReplace" data-k="${bid}" data-v="${pos}" aria-label="Replace ${pos}">Replace</button>` : '';
  const t = table('hier', [{ h: 'Branch', k: r => r.b.name, t: 'text', cls: 'wrap' }, { h: 'Region', k: r => r.b.region, t: 'text' }, { h: 'Zone', k: r => r.b.zone, t: 'text' }, { h: 'School type', k: r => r.b.type, t: 'text' }, { h: 'Principal', k: r => nm(r.pr) + btn('Principal', r.b.id), t: 'html', x: r => r.pr ? r.pr.name : 'Vacant' }, { h: 'Zonal Director', k: r => nm(r.zd) + btn('Zonal Director', r.b.id), t: 'html', x: r => r.zd ? r.zd.name : 'Vacant' }, { h: 'Regional Director', k: r => nm(r.rd) + btn('Regional Director', r.b.id), t: 'html', x: r => r.rd ? r.rd.name : 'Vacant' }, { h: 'Status', k: r => r.b.status === 'CLOSED' ? pill('Inactive') : pill('Active', 'ok'), t: 'html', x: () => 'Active' }, ...(ed ? [{ h: '', k: r => `<button class="btn sm" data-act="branchEdit" data-k="${r.b.id}">Edit branch</button>`, t: 'html', noexp: true }] : [])], rows, { title: 'Organisation hierarchy', limit: 80 });
  // history = every assignment, active or ended
  const H = [];
  Store.get('mappings').forEach(m => { const u = userById(m.user); if (!u || !['Principal', 'Zonal Director', 'Regional Director'].includes(u.role)) return; H.push({ pos: u.role, who: u.name, where: m.type === 'Own Branch Only' ? (m.branches || []).map(brName).join(', ') : m.zone || m.region, from: m.from, to: m.to, status: activeOn(m, iso) ? 'Active' : 'Ended' }); });
  Object.entries(Store.get('branchmeta')).forEach(([bid, L]) => L.forEach(e => H.push({ pos: 'Branch master', who: `${e.field}: ${e.old} → ${e.val}`, where: brName(bid), from: e.from, to: '', status: 'Applied' })));
  H.sort((a, b) => (b.to || '9999').localeCompare(a.to || '9999') || b.from.localeCompare(a.from));
  const ht = table('hierHist', [{ h: 'Position', k: r => r.pos, t: 'text' }, { h: 'Person / change', k: r => r.who, t: 'text', cls: 'wrap' }, { h: 'Branch / zone / region', k: r => r.where, t: 'text', cls: 'wrap' }, { h: 'Effective from', k: r => isoLabel(r.from), t: 'text' }, { h: 'Effective to', k: r => r.to ? isoLabel(r.to) : 'Open', t: 'text' }, { h: 'Status', k: r => r.status, t: 'text' }], H, { limit: 40, title: 'Transfer and replacement history' });
  // Directors, regions & zones, branch reporting lines
  const tabK = App.ui.hoTab || 'dirs', tabs = `<div class="tabs">${[['dirs', 'Directors'], ['rz', 'Regions & zones'], ['bl', 'Branch reporting lines']].map(([k, l]) => `<button class="tab${k === tabK ? ' on' : ''}" data-act="ui" data-k="hoTab" data-v="${k}">${l}</button>`).join('')}</div>`;
  const live = DATA.branches.filter(b => !b.closed), nmEmp = u => (u.empId || '—');
  const dirRows = kind => users().filter(u => u.role === (kind === 'rd' ? 'Regional Director' : 'Zonal Director') && u.status === 'Active').map(u => {
    const areas = dirAreas(u, kind), brs = live.filter(b => areas.includes(kind === 'zd' ? b.zone : b.region));
    const regions = [...new Set(brs.map(b => b.region))], zones = [...new Set(brs.map(b => b.zone))];
    const maps = Store.get('mappings').filter(m => m.user === u.id && activeOn(m, ACCESS_DATE) && m.type === (kind === 'zd' ? 'All Branches Under Zone' : 'All Branches Under Region'));
    const rdOf = kind === 'zd' ? [...new Set(brs.map(b => rdName(b)))].join(', ') : '';
    return { u, kind, areas, brs, regions, zones, maps, reports: kind === 'zd' ? (rdOf || 'Vacant') + ' (Regional Director)' : 'Corporate Management' };
  });
  const all = [...dirRows('rd'), ...dirRows('zd')];
  const actCol = ed ? [{ h: '', k: r => `<div class="btnstack"><button class="btn sm" data-act="dirEdit" data-k="${r.u.id}" data-v="${r.kind}">Edit</button><button class="btn sm" data-act="dirAdd" data-k="${r.u.id}" data-v="${r.kind}">Add branches</button><button class="btn sm danger" data-act="dirRemove" data-k="${r.u.id}" data-v="${r.kind}">Remove</button></div>`, t: 'html', noexp: true }] : [];
  const dt = table('hierDirs', [
    { h: 'Director', k: r => `<b>${esc(pName(r.u))}</b><div class="id small muted">Employee #${esc(nmEmp(r.u))} · ${r.kind === 'rd' ? 'Regional Director' : 'Zonal Director'}</div>`, t: 'html', x: r => `${pName(r.u)} (#${nmEmp(r.u)})` },
    { h: 'Level', k: r => r.kind === 'rd' ? 'Regional' : 'Zonal', t: 'text' },
    { h: 'Region', k: r => r.regions.join(', ') || '—', t: 'text', cls: 'wrap' },
    { h: 'Zone', k: r => r.kind === 'rd' ? r.zones.join(', ') : r.zones.join(', ') || '—', t: 'text', cls: 'wrap' },
    { h: 'Branches', k: r => r.brs.length, t: 'num' },
    { h: 'Assigned branches', k: r => r.brs.map(b => esc(b.name)).join(', ') || '<span class="muted">None yet</span>', t: 'html', x: r => r.brs.map(b => b.name).join('; '), cls: 'wrap small', w: 320 },
    { h: 'Reports to', k: r => r.reports, t: 'text', cls: 'wrap' },
    { h: 'Access mapping', k: r => r.maps.map(m => `${r.kind === 'rd' ? 'All branches under region' : 'All branches under zone'}: ${r.kind === 'rd' ? m.region : m.zone} · ${m.level || 'Read Only'} · from ${isoLabel(m.from)}`).join('; ') || 'None', t: 'text', cls: 'wrap small', w: 260 },
    ...actCol], all, { title: `Directors (${all.length})` });
  const vacant = [...new Set(live.map(b => b.zone))].filter(z => !all.some(r => r.kind === 'zd' && r.areas.includes(z))).map(z => z + ' (zone)').concat([...new Set(live.map(b => b.region))].filter(z => !all.some(r => r.kind === 'rd' && r.areas.includes(z))).map(z => z + ' (region)'));
  const vacantNote = vacant.length ? `<div class="note warn">Without a director: <b>${vacant.map(esc).join(', ')}</b>. Add a director or edit an existing one to cover them.</div>` : '';
  const dirCard = card(`Directors (${all.length})`, `${vacantNote}${dt}`, { right: `${ed ? `<button class="btn primary sm" data-act="dirNew" data-v="rd">Add Regional Director</button><button class="btn primary sm" data-act="dirNew" data-v="zd">Add Zonal Director</button>` : ''}${exportBtns('hierDirs', 'admin_mapping', { label: false })}`, sub: 'Employee ID, level, region, zone, assigned branches, reporting line and access come from the director master. A change here moves the branches\' reporting line, approval routing, dashboards and report visibility in every module from the effective date.' });
  const zoneRows = [...new Set(live.map(b => b.region + '|' + b.zone))].map(k => { const [region, zone] = k.split('|'), brs = live.filter(b => b.region === region && b.zone === zone), b0 = brs[0]; const prs = brs.map(b => hierOf(b, ACCESS_DATE).pr).filter(Boolean); return { region, zone, brs, rd: rdName(b0), zd: zdName(b0), rdU: headOf('rd', b0), zdU: headOf('zd', b0), prs }; }).sort((a, b) => a.region.localeCompare(b.region) || a.zone.localeCompare(b.zone));
  const rzt = table('hierRZ', [{ h: 'Region', k: r => r.region, t: 'text' }, { h: 'Regional Director', k: r => r.rdU ? `${esc(r.rd)}<div class="small muted">Employee #${esc(nmEmp(r.rdU))}</div>` : '<span class="red">Vacant</span>', t: 'html', x: r => r.rd }, { h: 'Zone', k: r => r.zone, t: 'text' }, { h: 'Zonal Director', k: r => r.zdU ? `${esc(r.zd)}<div class="small muted">Employee #${esc(nmEmp(r.zdU))}</div>` : '<span class="red">Vacant</span>', t: 'html', x: r => r.zd }, { h: 'Branches', k: r => r.brs.length, t: 'num' }, { h: 'Principals', k: r => `${r.prs.length} of ${r.brs.length}`, t: 'text' }], zoneRows, { title: 'Regions & zones' });
  const rzCard = card('Regions & zones', `<p class="small muted">Hierarchy: Regional Director → Zonal Director → Principal → Branch.</p>${rzt}`, { right: exportBtns('hierRZ', 'admin_mapping', { label: false }) });
  const blCard = card('Branch reporting lines', t, { right: exportBtns('hier', 'admin_mapping', { label: false }) }) + card('Transfer and replacement history', ht, { right: exportBtns('hierHist', 'admin_mapping', { label: false }) });
  return `<div class="note">Reporting line: Regional Director → Zonal Director → Principal → Branch. Replacing a person ends the old assignment the day before the effective date, so access moves on that date. Every change is in the audit log.</div>${tabs}${tabK === 'dirs' ? dirCard : tabK === 'rz' ? rzCard : blCard}`;
} };

/* ---------- strength alerts (added to the alert list) ---------- */
function strengthAlerts(D, idx) {
  const c = Store.get('config').strength, out = [];
  const rows = Str.rows(D, 'branch', idx);
  rows.forEach(r => {
    const b = DATA.branches.find(x => x.id === r.bid), bi = DATA.branches.indexOf(b); if (b.inactive) return;
    if (r.target == null) out.push({ sev: 'a', rule: 'Missing target plan', b, text: 'No approved target strength for this academic year.' });
    if (!r.capacity) out.push({ sev: 'a', rule: 'Missing capacity plan', b, text: 'No approved capacity.' });
    if (r.achPct != null && r.achPct < (Store.get('config').rag.tgtAmber || 85)) out.push({ sev: 'r', rule: 'Below strength target', b, text: `${NUM(r.existing)} of ${NUM(r.target)} students (${PCT(r.achPct)}).` });
    if (r.capAfter != null && r.capAfter < 0) out.push({ sev: 'r', rule: 'Target strength exceeds approved capacity', b, text: `Target ${NUM(r.target)} vs capacity ${NUM(r.capacity)}.` });
    if (r.revAchPct != null && r.revAchPct < c.revAlertPct) out.push({ sev: 'a', rule: 'Below revenue target', b, text: `Net revenue ${INR(r.net)} is ${PCT(r.revAchPct)} of target.` });
    if (r.colPct < c.lowCollPct) out.push({ sev: 'a', rule: 'Low collection percentage', b, text: `${PCT(r.colPct)} of net revenue collected (alert below ${c.lowCollPct}%).` });
    if (r.concPct > c.highConcPct) out.push({ sev: 'a', rule: 'High concession percentage', b, text: `Concessions and scholarships are ${PCT(r.concPct)} of gross fee.` });
    if (r.existing && r.wd / r.existing * 100 > c.highWithdrawPct) out.push({ sev: 'a', rule: 'High withdrawals or cancellations', b, text: `${NUM(r.wd)} since ${isoLabel(App.f.from || '2026-01-01')}.` });
    const L = DATA.leads[bi].months.find(m => D >= m.from && D <= m.to) || DATA.leads[bi].months.at(-1);
    if (L.leads >= 10 && L.adm / L.leads * 100 < c.lowConvPct) out.push({ sev: 'a', rule: 'Low lead conversion', b, text: `${NUM(L.adm)} admissions from ${NUM(L.leads)} leads this month (${PCT(L.adm / L.leads * 100)}).` });
    const keys = Str.secList(b.id, D); const full = keys.filter(k => { const [cl, se] = k.split('|'), cap = Str.secCap(b.id, cl, se, D); return cap && Str.allActive(bi, D).filter(s => s.cls === cl && s.sec === se).length / cap * 100 >= c.capAlertPct; });
    if (full.length) out.push({ sev: 'i', rule: 'Classes nearing approved capacity', b, text: `${full.length} section${full.length > 1 ? 's' : ''} at ${c.capAlertPct}% or more: ${full.slice(0, 3).map(k => k.replace('|', ' ')).join(', ')}${full.length > 3 ? '…' : ''}.` });
    if (r.cancPct > c.cancelRatePct && r.canc >= 2) out.push({ sev: 'r', rule: 'Cancellation rate above limit', b, text: `${NUM(r.canc)} cancellations against ${NUM(r.grossAdm)} gross admissions (${PCT(r.cancPct)}; limit ${c.cancelRatePct}%).` });
    if (r.grossAdm && r.exits / r.grossAdm * 100 > c.cancelVsNewPct && r.exits >= 3) out.push({ sev: 'a', rule: 'High cancellations compared with new admissions', b, text: `${NUM(r.exits)} students left against ${NUM(r.grossAdm)} admitted (${PCT(r.exits / r.grossAdm * 100)}).` });
    if (r.target != null && r.netStrength < r.target && r.netStrength + r.exits >= r.target) out.push({ sev: 'r', rule: 'Cancellations pushed branch below target', b, text: `Net strength ${NUM(r.netStrength)} vs target ${NUM(r.target)}; without the ${NUM(r.exits)} exits it would have been met.` });
    if (r.cancLoss > 0 && r.revTarget != null && r.net < r.revTarget && r.net + r.cancLoss >= r.revTarget) out.push({ sev: 'a', rule: 'Cancellations caused revenue shortfall', b, text: `Revenue loss from exits ${INR(r.cancLoss)}; net revenue is ${INR(r.revTarget - r.net)} below target.` });
    const byCls = {}; DATA.students.forEach(s => { if (s.b === bi && s.exit && Str.exitKind(s) === 'canc' && s.exit <= D && s.exit >= D - 90) byCls[s.cls] = (byCls[s.cls] || 0) + 1; });
    Object.entries(byCls).filter(([, n]) => n >= c.classCancels).forEach(([cl, n]) => out.push({ sev: 'a', rule: 'Repeated cancellations in a class', b, text: `${n} cancellations in ${cl} in the last 90 days.` }));
    const ap = admPlanRow(bi, D); if (isWork(D) && ap.daily && ap.daily >= 0.5) { const today = DATA.students.filter(s => s.b === bi && NEWT.includes(s.admType) && s.enrol === D).length; if (today < ap.daily) out.push({ sev: 'a', rule: 'Below daily admission target', b, text: `${today} admissions today against ${ap.daily.toFixed(1)} needed per working day.` }); }
  });
  return out;
}

/* ---------- executive summary PDF ---------- */
async function execPdf() {
  if (!window.jspdf) return toast('The PDF library did not load. Check your connection and reload.', 'bad');
  const D = D_(), idx = scopeIdx(), by = new Set(idx.map(i => DATA.branches[i].region)).size > 1 ? 'region' : 'branch', rows = Str.rows(D, by, idx), T = Str.sum(rows);
  const doc = new window.jspdf.jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const R = x => x == null ? '—' : 'Rs.' + fmt0.format(Math.round(x)), N = x => x == null ? '—' : fmt0.format(Math.round(x)), P = x => x == null ? '—' : x.toFixed(1) + '%';
  try { doc.addImage('data:image/png;base64,' + LOGO_B64, 'PNG', 36, 22, 150, 30); } catch (e) { }
  doc.setFontSize(16); doc.text('MS Education Academy · Executive Summary', 200, 40); doc.setFontSize(10); doc.text(`As on ${dLabel(D)} · AY ${CUR_AY} · ${scopeLabel()} · ERP synced ${tsLabel(Store.get('sync').lastSuccess)}`, 200, 56);
  doc.setFontSize(11); doc.text(`${N(T.existing)} students against a target of ${N(T.target)} and capacity of ${N(T.capacity)}; ${N(T.required)} more needed (about ${R(T.expRev)}). Collected ${R(T.collected)}; outstanding ${R(T.os)}.`, 36, 80, { maxWidth: 770 });
  const k = [['Existing strength', N(T.existing)], ['Target strength', N(T.target)], ['Students required', N(T.required)], ['Approved capacity', N(T.capacity)], ['Target achievement', P(T.achPct)], ['Capacity utilisation', P(T.utilPct)], ['Revenue target', R(T.revTarget)], ['Revenue generated', R(T.net)], ['Revenue achievement', P(T.revAchPct)], ['Amount collected', R(T.collected)], ['Outstanding', R(T.os)], ['Zero payers', `${N(T.zpN)} · ${R(T.zpAmt)}`]];
  doc.autoTable({ startY: 100, head: [['Measure', 'Value', 'Measure', 'Value', 'Measure', 'Value']], body: [0, 1, 2, 3].map(i => [k[i][0], k[i][1], k[i + 4][0], k[i + 4][1], k[i + 8][0], k[i + 8][1]]), styles: { fontSize: 9 }, headStyles: { fillColor: [43, 58, 140] } });
  doc.autoTable({ startY: doc.lastAutoTable.finalY + 16, head: [[LVL_NAME[by], 'Existing', 'Target', 'Required', 'Capacity', 'Ach. %', 'Net revenue', 'Rev. target', 'Collected', 'Outstanding', 'Zero payers']], body: rows.sort((a, b) => b.existing - a.existing).slice(0, 25).map(r => [r.label, N(r.existing), N(r.target), N(r.required), N(r.capacity), P(r.achPct), R(r.net), R(r.revTarget), R(r.collected), R(r.os), N(r.zpN)]), styles: { fontSize: 8 }, headStyles: { fillColor: [43, 58, 140] } });
  if (await saveFile(`Executive_Summary_${App.f.date}.pdf`, new Blob([doc.output('arraybuffer')]))) audit('Executive Dashboard', 'Executive summary exported (PDF)', { new: scopeLabel() + ' · ' + App.f.date });
}

/* ---------- add branches under a Regional / Zonal Director ---------- */
/* Add / edit / remove a Regional or Zonal Director (person + area mapping) */
function dirPersonForm(uid, kind) {
  const u = uid ? userById(uid) : null, role = kind === 'zd' ? 'Zonal Director' : 'Regional Director', area = u ? dirArea(u, kind) : '';
  const live = DATA.branches.filter(b => !b.closed), regions = [...new Set(live.map(b => b.region))].sort(), zones = [...new Set(live.map(b => b.zone))].sort();
  const taken = a => users().find(x => x.role === role && x.status === 'Active' && x.id !== uid && dirArea(x, kind) === a);
  const areaOpts = (kind === 'zd' ? zones : regions).map(a => { const t = taken(a); return `<option value="${esc(a)}"${a === area ? ' selected' : ''}>${esc(a)}${t ? ' · currently ' + esc(pName(t)) : ''}</option>`; }).join('');
  modal(u ? `Edit ${role} · ${pName(u)}` : `Add ${role}`, `<div class="form-grid"><label class="fld"><span>Full name</span><input id="dpName" value="${u ? esc(pName(u)) : ''}" placeholder="e.g. Imran Qureshi"></label><label class="fld"><span>Employee ID</span><input id="dpEmp" value="${u ? esc(u.empId || '') : ''}" placeholder="e.g. MSEA1234"></label><label class="fld"><span>Email</span><input id="dpEmail" type="email" value="${u ? esc(u.email || '') : ''}" placeholder="name@msea.example"></label><label class="fld"><span>Mobile</span><input id="dpMob" value="${u ? esc(u.mobile || '') : ''}"></label>
  <label class="fld"><span>${kind === 'zd' ? 'Zone' : 'Region'}</span><select id="dpArea"><option value="">Select</option>${areaOpts}${kind === 'zd' ? '<option value="__new">New zone…</option>' : '<option value="__new">New region…</option>'}</select></label><label class="fld"><span>New ${kind === 'zd' ? 'zone' : 'region'} name (if chosen)</span><input id="dpNew" placeholder="${kind === 'zd' ? 'e.g. Hyderabad North' : 'e.g. Karnataka'}"></label>
  ${kind === 'zd' ? `<label class="fld"><span>Region of a new zone</span><select id="dpReg">${regions.map(r => `<option${u && u.region === r ? ' selected' : ''}>${esc(r)}</option>`).join('')}</select></label>` : ''}<label class="fld"><span>Effective from</span><input type="date" id="dpFrom" value="${ACCESS_DATE}"></label></div>
  <div class="note">${u ? 'Changing the area moves this director to it from the effective date; a director already covering that area is relieved the day before.' : 'The director gets a user account with ' + role + ' access to every branch in the area. If someone already covers it, they are relieved the day before the effective date.'}</div>
  <label class="fld"><span>Reason (required)</span><textarea id="dpReason" rows="2"></textarea></label><p class="err" id="dpErr" hidden></p>`,
  `<button class="btn" data-act="closeModal">Cancel</button><button class="btn primary" data-act="dirPersonOk" data-k="${uid || 'new'}" data-v="${kind}">${u ? 'Save changes' : 'Add ' + role}</button>`, true);
}
async function dirPersonOk(uid, kind) {
  const err = m => { const e = document.getElementById('dpErr'); e.textContent = m; e.hidden = false; };
  const role = kind === 'zd' ? 'Zonal Director' : 'Regional Director', name = (v('dpName') || '').trim(), emp = (v('dpEmp') || '').trim().toUpperCase(), email = (v('dpEmail') || '').trim(), mob = (v('dpMob') || '').trim(), from = v('dpFrom'), r = (v('dpReason') || '').trim();
  let area = v('dpArea'); if (area === '__new') area = (v('dpNew') || '').trim();
  if (name.length < 3) return err('Enter the director\'s full name.'); if (!emp) return err('Enter the employee ID.'); if (!/^\S+@\S+\.\S+$/.test(email)) return err('Enter a valid email.'); if (!area) return err(`Choose or enter the ${kind === 'zd' ? 'zone' : 'region'}.`); if (!from) return err('Enter the effective date.'); if (!r) return err('Enter the reason.');
  const U = Store.clone(users()), M = Store.clone(Store.get('mappings')), isNew = uid === 'new';
  if (U.some(u => u.id !== uid && (u.empId === emp || (u.email || '').toLowerCase() === email.toLowerCase()))) return err('Another user already has this employee ID or email.');
  const region = kind === 'zd' ? ((DATA.branches.find(b => b.zone === area) || {}).region || v('dpReg')) : area;
  const y = E.ds(E.dn(from) - 1), type = kind === 'zd' ? 'All Branches Under Zone' : 'All Branches Under Region';
  let u, oldArea = '';
  if (isNew) { const id = 'U' + String(U.length + 1 + Math.floor(Math.random() * 900)).padStart(3, '0'); u = { id, empId: emp, name, email, mobile: mob, dept: 'Management', desig: role, role, region, zone: kind === 'zd' ? area : '', branch: '', status: 'Active', manager: '', doj: from, lastLogin: '', mfa: true, sessionTimeout: 30, singleSession: false, forceChange: true }; U.push(u); }
  else { u = U.find(x => x.id === uid); if (!u) return err('User not found.'); oldArea = dirArea(u, kind); Object.assign(u, { name: name + (u.name.endsWith(' (demo)') ? '' : ''), empId: emp, email, mobile: mob, region, zone: kind === 'zd' ? area : u.zone }); }
  // relieve whoever covers the area, end this director's old mapping, add the new one
  const key = m => kind === 'zd' ? m.zone : m.region;
  if (isNew || oldArea !== area) {
    M.filter(m => m.type === type && key(m) === area && activeOn(m, ACCESS_DATE) && (userById(m.user) || {}).role === role && m.user !== u.id).forEach(m => m.to = y);
    M.filter(m => m.user === u.id && m.type === type && activeOn(m, ACCESS_DATE)).forEach(m => m.to = y);
    M.push(Object.assign({ id: 'M' + Date.now().toString(36), user: u.id, from, to: '', status: 'Active', level: 'Read Only', type }, kind === 'zd' ? { zone: area } : { region: area }));
    if (kind === 'zd') { const BM = Store.clone(Store.get('branchmeta') || {}); DATA.branches.filter(b => b.zone === area && b.region !== region).forEach(b => { (BM[b.id] = BM[b.id] || []).push({ field: 'region', old: b.region, val: region, from, by: App.user.name, at: nowIso() }); }); await Store.put('branchmeta', BM); }
  }
  await Store.put('users', U); await Store.put('mappings', M);
  audit('Hierarchy Setup', isNew ? role + ' added' : role + ' updated', { old: isNew ? '' : `${oldArea}`, new: `${name} · ${area}${isNew ? ' · from ' + from : ''}`, reason: r }); MEMO.clear();
  closeModal(); toast(isNew ? role + ' added.' : 'Director updated.');
}
function dirRemoveForm(uid, kind) {
  const u = userById(uid), role = kind === 'zd' ? 'Zonal Director' : 'Regional Director', area = dirArea(u, kind), brs = DATA.branches.filter(b => !b.closed && (kind === 'zd' ? b.zone : b.region) === area);
  const succ = users().filter(x => x.role === role && x.status === 'Active' && x.id !== uid);
  modal(`Remove ${role} · ${pName(u)}`, `<p class="small">${esc(pName(u))} covers <b>${esc(area)}</b> (${brs.length} branches). Removing ends the assignment and the access the day before the effective date.</p><div class="form-grid"><label class="fld"><span>Effective from</span><input type="date" id="drFrom" value="${ACCESS_DATE}"></label><label class="fld"><span>Hand ${esc(area)} to</span><select id="drTo"><option value="">Leave vacant for now</option>${succ.map(x => `<option value="${x.id}">${esc(pName(x))}${dirArea(x, kind) ? ' · ' + esc(dirArea(x, kind)) : ''}</option>`).join('')}</select></label><label class="fld"><span>User account</span><select id="drAcc"><option value="deactivate">Deactivate the account</option><option value="keep">Keep the account active (other role)</option></select></label></div>
  <label class="fld"><span>Reason (required)</span><textarea id="drReason" rows="2"></textarea></label><p class="err" id="drErr" hidden></p>`,
  `<button class="btn" data-act="closeModal">Cancel</button><button class="btn primary danger" data-act="dirRemoveOk" data-k="${uid}" data-v="${kind}">Remove director</button>`);
}
async function dirRemoveOk(uid, kind) {
  const err = m => { const e = document.getElementById('drErr'); e.textContent = m; e.hidden = false; };
  const role = kind === 'zd' ? 'Zonal Director' : 'Regional Director', from = v('drFrom'), to = v('drTo'), acc = v('drAcc'), r = (v('drReason') || '').trim(); if (!from) return err('Enter the effective date.'); if (!r) return err('Enter the reason.');
  const U = Store.clone(users()), M = Store.clone(Store.get('mappings')), u = U.find(x => x.id === uid); if (!u) return; const area = dirArea(u, kind), y = E.ds(E.dn(from) - 1), type = kind === 'zd' ? 'All Branches Under Zone' : 'All Branches Under Region';
  M.filter(m => m.user === uid && activeOn(m, ACCESS_DATE)).forEach(m => m.to = y);
  if (to) M.push(Object.assign({ id: 'M' + Date.now().toString(36), user: to, from, to: '', status: 'Active', level: 'Read Only', type }, kind === 'zd' ? { zone: area } : { region: area }));
  if (acc === 'deactivate') u.status = 'Inactive';
  await Store.put('mappings', M); await Store.put('users', U);
  audit('Hierarchy Setup', role + ' removed', { old: `${pName(u)} · ${area}`, new: to ? `${area} → ${pName(userById(to))} from ${from}` : `${area} vacant from ${from}`, reason: r }); MEMO.clear();
  closeModal(); toast(role + ' removed.');
}
function dirAreas(u, kind) { const t = kind === 'zd' ? 'All Branches Under Zone' : 'All Branches Under Region'; const L = Store.get('mappings').filter(m => m.user === u.id && activeOn(m, ACCESS_DATE) && m.type === t).map(m => kind === 'zd' ? m.zone : m.region); return [...new Set(L)]; }
function dirArea(u, kind) {
  const m = Store.get('mappings').find(m => m.user === u.id && activeOn(m, ACCESS_DATE) && m.type === (kind === 'zd' ? 'All Branches Under Zone' : 'All Branches Under Region'));
  return m ? (kind === 'zd' ? m.zone : m.region) : (kind === 'zd' ? u.zone : u.region) || '';
}
function dirForm(uid, kind) {
  const u = userById(uid), area = dirArea(u, kind);
  const others = DATA.branches.filter(b => (kind === 'zd' ? b.zone : b.region) !== area);
  const groups = [...new Set(others.map(b => b.zone))].sort();
  const zonesIn = [...new Set(DATA.branches.filter(b => b.region === area).map(b => b.zone))].sort();
  const list = groups.map(z => `<fieldset class="brgroup"><legend>${esc(z)} · ${esc(zdName(others.find(b => b.zone === z)))}</legend>${others.filter(b => b.zone === z).map(b => `<label class="chk"><input type="checkbox" class="dirPick" value="${b.id}"> ${esc(b.name)}</label>`).join('')}</fieldset>`).join('');
  modal(`Add branches under ${pName(u)}`, `<p class="small">${esc(pName(u))} is ${kind === 'zd' ? 'Zonal Director for <b>' + esc(area) + '</b>' : 'Regional Director for <b>' + esc(area) + '</b>'}. Tick the branches to bring under them.</p>
  <label class="fld"><span>Search branches</span><input type="search" id="dirQ" data-act="dirFilter" placeholder="Type part of a branch name"></label>
  <div class="brpick" id="dirList">${list || '<p class="muted">Every branch is already under this director.</p>'}</div>
  <div class="form-grid">${kind === 'rd' ? `<label class="fld"><span>Place the branches in zone</span><select id="dirZone">${zonesIn.map(z => `<option>${esc(z)}</option>`).join('')}<option value="__keep">Keep their current zone</option><option value="__new">New zone…</option></select></label><label class="fld"><span>New zone name (if chosen)</span><input id="dirNewZone" placeholder="e.g. Hyderabad North"></label>` : ''}
  <label class="fld"><span>Effective from</span><input type="date" id="dirFrom" value="${ACCESS_DATE}"></label></div>
  <label class="fld"><span>Reason</span><textarea id="dirReason" rows="2" placeholder="e.g. Restructuring approved by CEO"></textarea></label><p class="err" id="dirErr" hidden></p>`,
  `<button class="btn" data-act="closeModal">Cancel</button><button class="btn primary" data-act="dirAddOk" data-k="${uid}" data-v="${kind}">Add selected branches</button>`, true);
}
async function dirAddOk(uid, kind) {
  const err = m => { const e = document.getElementById('dirErr'); e.textContent = m; e.hidden = false; };
  const ids = [...document.querySelectorAll('.dirPick:checked')].map(x => x.value), from = v('dirFrom'), reason = (v('dirReason') || '').trim();
  if (!ids.length) return err('Tick at least one branch.'); if (!from) return err('Choose the effective date.'); if (!reason) return err('Enter a reason.');
  const u = userById(uid), area = dirArea(u, kind);
  let zone = null, region;
  if (kind === 'zd') { zone = area; const any = DATA.branches.find(b => b.zone === area); region = any ? any.region : u.region; if (!region) return err('This Zonal Director has no region. Set it in User Management first.'); }
  else { region = area; const z = v('dirZone'); if (z === '__new') { zone = (v('dirNewZone') || '').trim(); if (!zone) return err('Enter the new zone name.'); } else if (z !== '__keep') zone = z; }
  const BM = Store.clone(Store.get('branchmeta')), moved = [];
  ids.forEach(bid => { const b = DATA.branches.find(x => x.id === bid), L = BM[bid] || (BM[bid] = []);
    if (b.region !== region) L.push({ field: 'region', old: b.region, val: region, from, by: App.user.name, at: nowIso() });
    if (zone && b.zone !== zone) L.push({ field: 'zone', old: b.zone, val: zone, from, by: App.user.name, at: nowIso() });
    moved.push(`${b.name} (${b.zone} → ${zone || b.zone})`); });
  await Store.put('branchmeta', BM);
  audit('Hierarchy Setup', `Branches added under ${kind === 'zd' ? 'Zone' : 'Regional'} Director`, { new: `${pName(u)} · ${area}: ${moved.join('; ')} from ${from}`, reason });
  closeModal(); toast(`${ids.length} branch${ids.length > 1 ? 'es' : ''} added under ${pName(u)}${from > ACCESS_DATE ? ' from ' + isoLabel(from) : ''}.`);
}

/* ---------- Cancellation & Withdrawal dashboard ---------- */
function exitList(D, idx) {
  const from = E.dn(App.f.from || '2026-01-01'), set = new Set(idx), SA = E.studentsAt(DATA, A, D);
  return memo('xl' + D + '|' + idx.join(',') + '|' + Str.sfKey(), () => DATA.students.filter(s => set.has(s.b) && s.exit && s.exit >= from && s.exit <= D && Str.passes(Object.assign({}, SA[s.id] || { due: 0, paid: 0, od: 0 }, { s }))).map(s => Object.assign({ s, kind: Str.exitKind(s) }, Str.exitInfo(s, D))).sort((a, b) => b.s.exit - a.s.exit));
}
PAGES.cancel = { title: 'Cancellations & Withdrawals', mod: 'cancel', sf: true, render() {
  const D = D_(), idx = scopeIdx(); if (!idx.length) return empty('No branches in your scope for these filters.');
  const T = Str.sum(Str.rows(D, 'branch', idx)), L = exitList(D, idx), since = isoLabel(App.f.from || '2026-01-01');
  const canc = L.filter(e => e.kind === 'canc'), wd = L.filter(e => e.kind === 'wd'), out = L.filter(e => e.kind === 'out');
  const cfg = Store.get('config').strength;
  const k = (l, vv, s = '', r = null) => `<div class="kpi">${r ? `<div class="kpi-c">${chip(r)}</div>` : ''}<div class="kpi-l">${l}</div><div class="kpi-v">${vv}</div><div class="kpi-s">${s}</div></div>`;
  const kpis = `<div class="kpis k5">${k('Total cancellations', NUM(canc.length), `since ${since}`)}${k('Total withdrawals', NUM(wd.length), `+ ${NUM(out.length)} transfers out`)}${k('Cancellation %', PCT(T.cancPct), `of ${NUM(T.grossAdm)} gross admissions · limit ${cfg.cancelRatePct}%`, T.cancPct > cfg.cancelRatePct ? 'r' : 'g')}${k('Withdrawal %', PCT(T.wdPct), `of ${NUM(T.opening)} opening strength`)}${k('Net strength impact', '−' + NUM(T.exits), `net growth ${T.netGrowth >= 0 ? '+' : ''}${NUM(T.netGrowth)} · net strength ${NUM(T.netStrength)}`, T.netGrowth < 0 ? 'r' : null)}
    ${k('Cancelled fee demand', INRS(T.cancDemand), 'net annual fee of cancelled and withdrawn students')}${k('Collected before cancellation', INRS(T.cancColl))}${k('Refund amount', INRS(T.cancRefund), `${PCT(T.cancColl ? T.cancRefund / T.cancColl * 100 : 0)} of collected`)}${k('Outstanding written off / adjusted', INRS(T.cancWriteOff), 'dues fallen due but not collected at exit')}${k('Revenue loss due to cancellations', INRS(T.cancLoss), `${NUM(T.exitReplaced)} of ${NUM(canc.length + wd.length)} seats replaced by new admissions`)}</div>`;
  const byB = Str.rows(D, 'branch', idx).filter(r => r.exits).sort((a, b) => b.canc + b.wd - a.canc - a.wd);
  const bt = table('cxB', [{ h: 'Branch', k: r => r.label, t: 'text', cls: 'wrap' }, { h: 'Gross admissions', k: r => r.grossAdm, t: 'num' }, { h: 'Cancellations', k: r => r.canc, t: 'num', cls: 'em' }, { h: 'Withdrawals', k: r => r.wd, t: 'num' }, { h: 'Transfers out', k: r => r.outward, t: 'num' }, { h: 'Cancellation %', k: r => r.cancPct, t: 'pct', rc: r => r.cancPct > cfg.cancelRatePct ? 'red' : '' }, { h: 'Net growth', k: r => r.netGrowth, t: 'num', rc: r => r.netGrowth < 0 ? 'red' : '' }, { h: 'Net strength', k: r => r.netStrength, t: 'num' }, { h: 'Gap to target', k: r => r.gap, t: 'num', rc: r => r.gap > 0 ? 'red' : '' }, { h: 'Revenue loss', k: r => r.cancLoss, t: 'inr' }, { h: 'Replaced', k: r => r.exitReplaced, t: 'num' }], byB, { total: Str.sum(byB), rowAct: 'drillBranch', rowKey: r => r.bid, title: 'Cancellations by branch', limit: 25 });
  const bySec = Str.rows(D, 'section', idx).filter(r => r.canc + r.wd).sort((a, b) => b.canc + b.wd - a.canc - a.wd);
  const st = table('cxS', [{ h: 'Branch', k: r => r.branch, t: 'text', cls: 'wrap' }, { h: 'Class / section', k: r => r.label, t: 'text' }, { h: 'Cancellations', k: r => r.canc, t: 'num' }, { h: 'Withdrawals', k: r => r.wd, t: 'num' }, { h: 'Opening', k: r => r.opening, t: 'num' }, { h: 'Net strength', k: r => r.netStrength, t: 'num' }, { h: 'Revenue loss', k: r => r.cancLoss, t: 'inr' }], bySec, { title: 'Cancellations by class and section', limit: 15, compact: true });
  const byCat = Str.rows(D, 'stcat', idx).filter(r => r.canc + r.wd).sort((a, b) => b.canc + b.wd - a.canc - a.wd);
  const ct = table('cxC', [{ h: 'Student category', k: r => r.label, t: 'text' }, { h: 'Cancellations', k: r => r.canc, t: 'num' }, { h: 'Withdrawals', k: r => r.wd, t: 'num' }, { h: 'Revenue loss', k: r => r.cancLoss, t: 'inr' }], byCat, { title: 'Cancellations by student category', compact: true });
  const reasons = {}; L.forEach(e => { if (e.kind !== 'out') reasons[e.s.exitReason] = (reasons[e.s.exitReason] || 0) + 1; });
  const rs = Object.entries(reasons).sort((a, b) => b[1] - a[1]);
  hbar('cxR', rs.map(r => r[0]), [{ label: 'Students', data: rs.map(r => r[1]) }]);
  const months = []; for (let m = 0; m < 10; m++) { const a = E.dn(`2026-${String(m + 1).padStart(2, '0')}-01`), z = m === 9 ? D : E.dn(`2026-${String(m + 2).padStart(2, '0')}-01`) - 1; months.push({ l: MON[m], c: canc.filter(e => e.s.exit >= a && e.s.exit <= z).length, w: wd.filter(e => e.s.exit >= a && e.s.exit <= z).length }); }
  vchart('cxM', 'bar', months.map(m => m.l), [{ label: 'Cancellations', data: months.map(m => m.c) }, { label: 'Withdrawals', data: months.map(m => m.w) }]);
  const det = table('cxD', [{ h: 'Student name', k: e => e.s.name, t: 'text' }, { h: 'Admission no.', k: e => e.s.adm, t: 'text' }, { h: 'Branch', k: e => DATA.branches[e.s.b].name, t: 'text', cls: 'wrap' }, { h: 'Class', k: e => e.s.cls + ' ' + e.s.sec, t: 'text' }, { h: 'Type', k: e => pill(e.s.status, e.kind === 'canc' ? 'bad' : e.kind === 'wd' ? 'warn' : ''), t: 'html', x: e => e.s.status }, { h: 'Admission date', k: e => dLabel(e.s.enrol), t: 'text', x: e => E.ds(e.s.enrol) }, { h: 'Cancellation date', k: e => dLabel(e.s.exit), t: 'text', x: e => E.ds(e.s.exit) }, { h: 'Reason', k: e => e.s.exitReason, t: 'text', cls: 'wrap' }, { h: 'Gross fee', k: e => e.gross, t: 'inr' }, { h: 'Collected amount', k: e => e.coll, t: 'inr' }, { h: 'Refund', k: e => e.refund, t: 'inr' }, { h: 'Written off', k: e => e.writeOff, t: 'inr' }, { h: 'Revenue loss', k: e => e.loss, t: 'inr', cls: 'em' }, { h: 'Replaced admission', k: e => e.kind === 'out' ? '—' : e.replaced ? pill('Replaced', 'ok') + ` <span class="small muted">${esc(e.replaced.by)} · ${dLabel(e.replaced.on)}</span>` : pill('Seat open', 'warn'), t: 'html', x: e => e.kind === 'out' ? '' : e.replaced ? 'Replaced by ' + e.replaced.by : 'Seat open' }, { h: 'Approval', k: e => e.s.exitBy === 'ERP' ? 'ERP record' : `Approved by ${e.s.exitApprover || ''}`, t: 'text' }], L, { rowAct: 'openStudent', rowKey: e => e.s.id, limit: 50, title: 'Cancellation Detail Report' });
  return `${kpis}<div class="grid2">${card('Cancellations and withdrawals by month', chartBox('cxM', 'Cancellations and withdrawals by month', 240), { sub: 'Jan–Oct 2026, by exit date' })}${card('Reasons', chartBox('cxR', 'Exit reasons', Math.max(200, rs.length * 28 + 50)), { sub: 'Cancellations and withdrawals' })}</div>
  ${card('Cancelled student count by branch', bt, { right: exportBtns('cxB', 'cancel', { label: false }), sub: 'Select a branch to open the strength report' })}
  <div class="grid2">${card('By class / section', st, { right: exportBtns('cxS', 'cancel', { label: false }) })}${card('By student category', ct, { right: exportBtns('cxC', 'cancel', { label: false }) })}</div>
  ${card(`Cancellation detail report · ${NUM(L.length)} students`, det, { right: `${can('cancel', 'Add') ? '<button class="btn primary sm" data-act="exitNew">Record cancellation / withdrawal</button>' : ''}${exportBtns('cxD', 'cancel', { label: false })}`, sub: 'Revenue loss = net annual fee − (collected − refund). Written off = dues fallen due by the exit date that were not collected. Exits recorded in the app need approval before they take effect.' })}`;
} };
function exitForm(sid) {
  const s = sid !== '' && sid != null ? DATA.students[+sid] : null;
  const reasons = (Store.get('categories').cancel || []).filter(c => c.active).sort((a, b) => a.order - b.order);
  modal('Record cancellation / withdrawal', `<div class="form-grid"><label class="fld"><span>Student admission no.</span><input id="xAdm" value="${s ? esc(s.adm) : ''}" placeholder="e.g. B21-26014"></label>
  <label class="fld"><span>Type</span><select id="xType"><option>Cancelled</option><option>Withdrawn</option><option>Transferred Out</option></select></label>
  <label class="fld"><span>Effective date</span><input id="xDate" type="date" value="${App.f.date}" max="${SRC.today}"></label>
  <label class="fld"><span>Reason (mandatory)</span><select id="xReason"><option value="">Select…</option>${reasons.map(r => `<option>${esc(r.name)}</option>`).join('')}</select></label>
  <label class="fld"><span>Refund to parent (₹)</span><input id="xRefund" type="number" min="0" step="1" value="0"></label><label class="fld"><span>Supporting document</span><input id="xFile" type="file"></label></div>
  <div id="xInfo" class="small muted"></div><label class="fld"><span>Remarks</span><textarea id="xRem" rows="2"></textarea></label><p class="err" id="xErr" hidden></p><p class="small muted">The request goes to Approvals. On approval the student leaves the roll from the effective date, the refund is posted as a fee adjustment and any dues not collected are written off. The ERP remains the record of the cancellation itself.</p>`,
  `<button class="btn" data-act="closeModal">Cancel</button><button class="btn primary" data-act="exitSubmit">Submit for approval</button>`, true);
}
async function exitSubmit() {
  const err = m => { const e = $('#xErr'); e.textContent = m; e.hidden = false; };
  const adm = (v('xAdm') || '').trim().toUpperCase(), s = DATA.students.find(x => x.adm.toUpperCase() === adm), type = v('xType'), date = v('xDate'), reason = v('xReason'), refund = +v('xRefund') || 0, rem = (v('xRem') || '').trim(), f = document.getElementById('xFile').files[0];
  if (!s) return err('No student with that admission number.'); if (!scopeOf(App.user).has(s.b)) return err('That student is outside your data scope.');
  if (s.exit) return err('This student has already left the roll.'); if (!date) return err('Enter the effective date.'); if (!reason) return err('Select the reason; it is mandatory.');
  const x = E.studentsAt(DATA, A, E.dn(date))[s.id] || { paid: 0, due: 0 }; if (refund > x.paid) return err(`Refund cannot exceed the ${INR(x.paid)} collected from this student.`);
  if (type === 'Cancelled' && !f) return err('Attach the cancellation request or approval document.');
  await Store.add('approvals', { type: 'exit', payload: { studentId: s.id, studentName: s.name, adm: s.adm, exitType: type, date, reason, refund, collected: x.paid, dueAtExit: x.due, original: x.os, revised: 0 }, reason: reason + (rem ? ' · ' + rem : ''), attachment: f ? `${f.name} (${Math.ceil(f.size / 1024)} KB)` : '', requester: App.user.name, requesterId: App.user.id, status: 'Pending' });
  audit('Cancellations & Withdrawals', type + ' requested', { old: s.adm + ' on roll', new: `${type} from ${date} · refund ${INR(refund)}`, reason, approval: 'Pending' });
  closeModal(); toast('Sent for approval.'); if (App.route !== 'approvals' && can('approvals')) go('approvals'); else rerender();
}
/* approved exits recorded in the app are applied on top of the ERP data */
function applyExits() {
  const L = (Store.get('exits') || { list: [] }).list;
  DATA.students.forEach(s => { if (s.exitBy === 'App') { s.exit = null; s.status = s.admType === 'Continuing Student' ? 'Continuing' : s.admType === 'Transfer Admission' ? 'Transferred' : s.admType; s.exitReason = ''; s.exitBy = ''; s.exitRefund = 0; s.exitCollected = 0; if (s.stCat === 'SC12' || s.stCat === 'SC13') s.stCat = s._stCat0 || 'SC1'; s.rc = s.rc.filter(r => !r.appExit); } });
  DATA.receipts = DATA.receipts.filter(r => !r.appExit);
  let rno = Math.max(0, ...DATA.receipts.map(r => r.id)) + 1;
  L.forEach(e => { const s = DATA.students[e.studentId]; if (!s || s.exitBy === 'ERP') return; s.exit = E.dn(e.date); s.status = e.exitType; s.exitReason = e.reason; s.exitBy = 'App'; s.exitApprover = e.approver; s.exitRefund = e.refund || 0; s.exitCollected = s.rc.filter(r => r.amt > 0 && r.d <= s.exit).reduce((a, r) => a + r.amt, 0); if (!s._stCat0) s._stCat0 = s.stCat; if (e.exitType === 'Cancelled') s.stCat = 'SC13'; else if (e.exitType === 'Withdrawn') s.stCat = 'SC12';
    if (e.refund > 0) { const x = { id: rno++, no: `${DATA.branches[s.b].code}/RF-APP-${e.id || rno}`, s: s.id, b: s.b, d: Math.min(DATA.TODAY, s.exit + 1), amt: -e.refund, kind: 'F', mode: 3, type: 'Refund', appExit: true }; s.rc.push(x); s.rc.sort((a, b) => a.d - b.d || a.id - b.id); DATA.receipts.push(x); } });
}

/* Section closures approved in the app: move the students of the closed section to the chosen section (until the ERP sync carries the change) */
function applySections() {
  DATA.students.forEach(s => { if (s._sec0 != null) { s.sec = s._sec0; delete s._sec0; } });
  DATA.students.forEach(s => { if (s._cls0 != null) { s.cls = s._cls0; delete s._cls0; } });
  const iso = E.ds(DATA.TODAY), L = (Store.get('capacity') || { entries: [] }).entries.filter(e => e.closeSection && e.moveTo && e.status === 'Approved' && e.from <= iso).sort((a, b) => (a.from || '').localeCompare(b.from || ''));
  L.forEach(e => { const bi = DATA.branches.findIndex(b => b.id === e.bid); DATA.students.forEach(s => { if (s.b !== bi || s.cls !== e.cls) return; if (e.closeClass) { if (s._cls0 == null) s._cls0 = s.cls; s.cls = e.moveTo; } else if (s.sec === e.sec) { if (s._sec0 == null) s._sec0 = s.sec; s.sec = e.moveTo; } }); });
  MEMO.clear();
}

/* ---------- SRF (Seat Reservation Fee) incentive module: native screens driven by the SRF engine ---------- */
const SRF_SCREENS = [['dashboard', 'SRF dashboard'], ['submission', 'SRF request'], ['verification', 'Verification'], ['payment', 'Payments'], ['policy', 'Incentive policy'], ['reports', 'SRF reports'], ['audit', 'SRF audit log'], ['sysadmin', 'SRF system admin'], ['spec', 'Help & specification']];
SRF_SCREENS.forEach(([k, l]) => {
  PAGES['srf_' + k] = { title: l, mod: 'srf', srf: k, show: () => SRF_BRIDGE.visible(k), badge: () => SRF_BRIDGE.badge(k), render() {
    if (!SRF_BRIDGE.signIn()) return `<div class="noaccess"><h2>No SRF access</h2><p>${esc(App.user.name)} (${esc(App.user.role)}) has no role in the SRF incentive module. Roles with access: Principal, Accounts and Finance roles, HR Officer, Corporate Finance, System Admin, Auditor and management.</p></div>`;
    App.mounts.push(() => { const m = document.getElementById('srf-mount'); if (!m) return; m.appendChild(SRF_HOST); SRF_HOST.setAttribute('data-theme', document.documentElement.getAttribute('data-theme') || ''); SRF.S.view = k; SRF.render(); });
    return `<div id="srf-mount"></div>`;
  } };
});
