/* ===== AI Assistant tools, part 2: finance, payroll, HR, purchase, assets, petty cash, utilities =====
   Same rules as ai.js: aggregated figures only, scope and module permission enforced by aiRun(). */
const aiBid = id => id ? ((DATA.branches.find(b => b.id === id) || {}).name || id) : 'Head office / corporate';
/* a branch-owned record is visible only when its branch is in the caller's scope; corporate (blank) records only to all-branch scope */
const aiSeen = (c, bid) => bid ? c.ids.has(bid) : c.all;
/* finance helpers read dashboard filters from App.ui; run them with a clean filter state and restore it */
function aiClean(fn) { const keep = App.ui.fnF; App.ui.fnF = {}; try { return fn(); } finally { App.ui.fnF = keep; } }

aiTool('budget_vs_actual', {
  domain: 'finance', mod: 'fn_budget', drill: ['fn_budget', 'Budget & cost control'],
  desc: 'Budget versus actual expenses by branch (annual budget, pro-rata budget to date, actual, overspend). Use for budget vs actual, overspend, expense control.',
  schema: { type: 'object', properties: { show: { type: 'string', enum: ['expense', 'income'] }, sort: { type: 'string', enum: ['overspend', 'actual', 'budget'] }, limit: { type: 'integer' } } },
  run(a, c) {
    const kind = a.show === 'income' ? 'Income' : 'Expense';
    const rows = aiClean(() => fnBudgetRows()).filter(r => { try { return fnGl(r.gl).type === kind; } catch (e) { return false; } });
    const G = {}; rows.forEach(r => { const o = G[r.bid || ''] || (G[r.bid || ''] = { bud: 0, pro: 0, act: 0, com: 0 }); o.bud += r.annual; o.pro += r.prorata; o.act += r.actual; o.com += r.committed || 0; });
    const R = Object.entries(G).map(([k, o]) => ({ k, o, v: o.act - o.pro, p: aiPct(o.act - o.pro, o.pro) }));
    R.sort(a.sort === 'actual' ? (x, y) => y.o.act - x.o.act : a.sort === 'budget' ? (x, y) => y.o.bud - x.o.bud : (x, y) => y.v - x.v);
    const T = f => aiSum(R, r => r.o[f]), over = R.filter(r => r.v > 0).length;
    return {
      chart: { label: 0, value: 4, title: 'Over / (under) budget', fmt: 'inr' }, period: 'Financial year to date', title: `Budget versus actual ${kind.toLowerCase()} by branch`,
      kpis: { 'Annual budget': INRS(T('bud')), 'Budget to date': INRS(T('pro')), 'Actual to date': INRS(T('act')), 'Variance': INRS(T('act') - T('pro')), [kind === 'Expense' ? 'Branches over budget' : 'Branches ahead']: `${over} of ${R.length}` },
      cols: [{ h: 'Branch', t: 'text' }, { h: 'Annual budget', t: 'inr' }, { h: 'Budget to date', t: 'inr' }, { h: 'Actual to date', t: 'inr' }, { h: kind === 'Expense' ? 'Over / (under) budget' : 'Ahead / (behind) budget', t: 'inr' }, { h: 'Variance %', t: 'pct' }, { h: 'Committed (POs/PRs)', t: 'inr' }],
      rows: R.slice(0, aiLim(a, 100)).map(r => [aiBid(r.k), r.o.bud, r.o.pro, r.o.act, r.v, r.p, r.o.com]),
      headline: `${kind} to date is ${INRS(T('act'))} against ${INRS(T('pro'))} budgeted for the period (${PCT(aiPct(T('act') - T('pro'), T('pro')))}); ${over} of ${R.length} branches are over budget${R.length ? ', the largest being ' + aiBid(R[0].k) : ''}.`,
      bullets: ['Source: Finance budget lines and posted journals. Suggested action: ask the finance manager for a reason and corrective note on each line more than 10% over its pro-rata budget.']
    };
  }
});

aiTool('profit_and_cash', {
  domain: 'finance', mod: 'fn_reports', drill: ['fn_reports', 'Financial reports'],
  desc: 'Income, expense and surplus by month from posted ledger journals (P&L), with fee collections (cash in) against vendor payments (cash out).',
  run(a, c) {
    const by = {}; aiClean(() => fnScoped()).filter(j => j.status === 'Posted').forEach(j => { const ym = j.date.slice(0, 7), o = by[ym] || (by[ym] = { inc: 0, exp: 0 }); j.lines.forEach(l => { let g; try { g = fnGl(l.gl); } catch (e) { return; } if (g.type === 'Income') o.inc += l.cr - l.dr; else if (g.type === 'Expense') o.exp += l.dr - l.cr; }); });
    const pay = {}; (Store.get('fin_tx').payments || []).filter(p => p.status === 'Paid' && aiSeen(c, p.bid)).forEach(p => { const ym = p.date.slice(0, 7); pay[ym] = (pay[ym] || 0) + p.amount; });
    const col = {}; if (c.all || true) { c.idx.forEach(i => { const r = yearRow(i, CUR_AY, c.D); if (r && r.monthCol) r.monthCol.forEach((v, k) => { const ym = (k < 9 ? '2026' : '2027') + '-' + String((k + 3) % 12 + 1).padStart(2, '0'); col[ym] = (col[ym] || 0) + v; }); }); }
    const yms = [...new Set([...Object.keys(by), ...Object.keys(pay)])].filter(y => y <= ymOf(c.D)).sort();
    const R = yms.map(y => [aiYm(y), (by[y] || {}).inc || 0, (by[y] || {}).exp || 0, ((by[y] || {}).inc || 0) - ((by[y] || {}).exp || 0), col[y] || 0, pay[y] || 0, (col[y] || 0) - (pay[y] || 0)]);
    const T = k => aiSum(R, r => r[k]);
    return {
      title: 'Profit and loss, and cash in / out by month',
      kpis: { 'Income (ledger)': INRS(T(1)), 'Expense (ledger)': INRS(T(2)), 'Surplus / (deficit)': INRS(T(3)), 'Fee collections (cash in)': INRS(T(4)), 'Vendor payments (cash out)': INRS(T(5)) },
      cols: [{ h: 'Month', t: 'text' }, { h: 'Income (ledger)', t: 'inr' }, { h: 'Expense (ledger)', t: 'inr' }, { h: 'Surplus / (deficit)', t: 'inr' }, { h: 'Fee collections (cash in)', t: 'inr' }, { h: 'Vendor payments (cash out)', t: 'inr' }, { h: 'Net cash movement', t: 'inr' }],
      rows: R,
      headline: `Ledger income ${INRS(T(1))} against expense ${INRS(T(2))} (surplus ${INRS(T(3))}). Fee collections ${INRS(T(4))} against vendor payments ${INRS(T(5))}.`,
      bullets: ['Ledger figures cover journals posted in the Finance module; fee collections come from the fee dashboard. Payroll and fee revenue recognised outside the ledger are not in the ledger columns.']
    };
  }
});

aiTool('payroll_summary', {
  domain: 'payroll', mod: 'py_reports', drill: ['py_reports', 'Payroll reports'],
  desc: 'Payroll runs by month: employees paid, gross, deductions, net payable and status; plus monthly salary cost by branch. Totals only, no individual salaries.',
  schema: { type: 'object', properties: { by: { type: 'string', enum: ['month', 'branch'] }, limit: { type: 'integer' } } },
  run(a, c) {
    if (a.by === 'branch') {
      const E = hrEmps().filter(e => e.status === 'Active' && e.payrollEligible !== false && aiSeen(c, e.bid)), G = {};
      E.forEach(e => { const o = G[e.bid || ''] || (G[e.bid || ''] = { n: 0, ctc: 0 }); o.n++; o.ctc += (e.ctc || 0) / 12; });
      const R = Object.entries(G).sort((x, y) => y[1].ctc - x[1].ctc);
      return { title: 'Monthly salary cost by branch (CTC ÷ 12)', cols: [{ h: 'Branch', t: 'text' }, { h: 'Active staff', t: 'num' }, { h: 'Monthly salary cost', t: 'inr' }, { h: 'Cost per employee', t: 'inr' }], rows: R.slice(0, aiLim(a, 100)).map(([k, o]) => [aiBid(k), o.n, o.ctc, o.n ? o.ctc / o.n : 0]), headline: `${NUM(aiSum(R, r => r[1].n))} active staff cost about ${INRS(aiSum(R, r => r[1].ctc))} a month at CTC level.`, bullets: [] };
    }
    if (!c.all) return { error: 'Payroll runs are group-level figures and are only available to users with all-branch scope.', blocked: true };
    const R = (Store.get('payroll').runs || []).filter(r => r.totals).sort((x, y) => y.ym.localeCompare(x.ym));
    return {
      title: 'Payroll runs by month',
      cols: [{ h: 'Month', t: 'text' }, { h: 'Run', t: 'text' }, { h: 'Status', t: 'text' }, { h: 'Employees', t: 'num' }, { h: 'Gross pay', t: 'inr' }, { h: 'Deductions', t: 'inr' }, { h: 'Net payable', t: 'inr' }, { h: 'Paid on', t: 'text' }],
      rows: R.slice(0, aiLim(a, 12)).map(r => [aiYm(r.ym), r.no, r.status, r.totals.n, r.totals.gross, r.totals.ded, r.totals.payable, r.paidOn || '—']),
      headline: R.length ? `Latest run ${aiYm(R[0].ym)} is ${R[0].status}: ${NUM(R[0].totals.n)} employees, net payable ${INRS(R[0].totals.payable)}.` : 'No payroll runs.', bullets: []
    };
  }
});

aiTool('attendance_summary', {
  domain: 'hr', mod: 'hr_att', drill: ['hr_att', 'Attendance & shifts'],
  desc: 'Staff attendance for a month by branch: working days, present %, late marks, absences and leave. Student attendance is not held in the dashboard and cannot be reported.',
  schema: { type: 'object', properties: { month: { type: 'string', description: 'YYYY-MM, default current month' }, sort: { type: 'string', enum: ['absence', 'late', 'present'] }, limit: { type: 'integer' } } },
  run(a, c) {
    const ym = /^\d{4}-\d{2}$/.test(a.month || '') ? a.month : ymOf(c.D), sc = hrScope(App.user), G = {};
    hrEmps().filter(e => e.status === 'Active' && sc.has(e.bid || '') && aiSeen(c, e.bid)).forEach(e => { const s = hrAttSummary(e, ym), o = G[e.bid || ''] || (G[e.bid || ''] = { n: 0, days: 0, pres: 0, late: 0, abs: 0, lv: 0 }); o.n++; o.days += s.days; o.pres += s.present + s.half * 0.5; o.late += s.late; o.abs += s.absent + s.missed; o.lv += s.leave; });
    const R = Object.entries(G).map(([k, o]) => ({ k, o, p: aiPct(o.pres, o.days), ab: aiPct(o.abs, o.days) })).sort(a.sort === 'late' ? (x, y) => y.o.late - x.o.late : a.sort === 'present' ? (x, y) => x.p - y.p : (x, y) => y.ab - x.ab);
    const T = f => aiSum(R, r => r.o[f]);
    return {
      title: `Staff attendance · ${aiYm(ym)}`,
      kpis: { 'Staff': NUM(T('n')), 'Present %': PCT(aiPct(T('pres'), T('days'))), 'Absent %': PCT(aiPct(T('abs'), T('days'))), 'Late marks': NUM(T('late')), 'Leave days': NUM(T('lv')) },
      cols: [{ h: 'Branch', t: 'text' }, { h: 'Staff', t: 'num' }, { h: 'Present %', t: 'pct' }, { h: 'Absent %', t: 'pct' }, { h: 'Late marks', t: 'num' }, { h: 'Leave days', t: 'num' }],
      rows: R.slice(0, aiLim(a, 15)).map(r => [aiBid(r.k), r.o.n, r.p, r.ab, r.o.late, r.o.lv]),
      headline: `Staff attendance in ${aiYm(ym)} is ${PCT(aiPct(T('pres'), T('days')))} present with ${NUM(T('late'))} late marks and ${PCT(aiPct(T('abs'), T('days')))} unexplained absence.`,
      bullets: ['Student attendance is not part of the dashboard data, so it cannot be answered here.']
    };
  }
});

aiTool('hr_overview', {
  domain: 'hr', mod: 'hr_home', drill: ['hr_home', 'HR dashboard'],
  desc: 'HR overview: headcount, open vacancies, recruitment pipeline, leave requests, exits in notice, performance appraisal status and manpower by branch.',
  schema: { type: 'object', properties: { view: { type: 'string', enum: ['overview', 'headcount_by_branch', 'recruitment', 'leave', 'exits', 'performance'] }, limit: { type: 'integer' } } },
  run(a, c) {
    const sc = hrScope(App.user), T = HRT(), E = hrEmps().filter(e => sc.has(e.bid || '') && aiSeen(c, e.bid)), act = E.filter(e => e.status === 'Active'), ids = new Set(E.map(e => e.id));
    const vs = (T.vacancies || []).filter(v => aiSeen(c, v.bid)), cs = (T.candidates || []).filter(x => aiSeen(c, x.bid)), ls = (T.leaves || []).filter(l => ids.has(l.emp)), ex = (T.exits || []).filter(x => ids.has(x.emp)), ap = (T.appraisals || []).filter(x => ids.has(x.emp));
    const cnt = (L, f) => { const o = {}; L.forEach(x => { const k = f(x) || '—'; o[k] = (o[k] || 0) + 1; }); return Object.entries(o).sort((x, y) => y[1] - x[1]); };
    const view = a.view || 'overview', two = (title, L, lab, h) => ({ title, cols: [{ h: lab, t: 'text' }, { h: 'Count', t: 'num' }], rows: L, headline: h, bullets: [] });
    if (view === 'headcount_by_branch') { const G = cnt(act, e => aiBid(e.bid)); return two('Active headcount by branch', G.slice(0, aiLim(a, 100)), 'Branch', `${NUM(act.length)} active employees across ${G.length} locations.`); }
    if (view === 'recruitment') return Object.assign(two('Recruitment pipeline by stage', cnt(cs, x => x.stage), 'Stage', `${vs.filter(v => v.status === 'Published').length} vacancies are published (${NUM(aiSum(vs.filter(v => v.status === 'Published'), v => v.count))} positions); ${cs.length} candidates are in the pipeline.`), { bullets: [] });
    if (view === 'leave') return two('Leave requests by status', cnt(ls, l => l.status), 'Status', `${ls.length} leave requests; ${ls.filter(l => /Submitted|Pending/.test(l.status)).length} are awaiting approval.`);
    if (view === 'exits') return two('Exits by stage', cnt(ex, x => x.status), 'Status', `${ex.length} exit cases; ${cnt(ex, x => x.kind).map(([k, n]) => k + ' ' + n).join(', ')}.`);
    if (view === 'performance') return two('Appraisals by status', cnt(ap, x => x.status), 'Status', `${ap.length} appraisal records in scope.`);
    const R = [['Active employees', act.length], ['Employees on notice / exit cases', ex.filter(x => !/Closed|Completed|Rejected/.test(x.status)).length], ['Published vacancies', vs.filter(v => v.status === 'Published').length], ['Positions open', aiSum(vs.filter(v => v.status === 'Published'), v => v.count)], ['Candidates in pipeline', cs.length], ['Leave requests awaiting approval', ls.filter(l => /Submitted|Pending/.test(l.status)).length], ['New joiners (last 90 days)', act.filter(e => e.doj >= E_ds(c.D - 90)).length]];
    return { title: 'HR and manpower overview', cols: [{ h: 'Measure', t: 'text' }, { h: 'Value', t: 'num' }], rows: R, headline: `${NUM(act.length)} active employees, ${R[2][1]} published vacancies for ${R[3][1]} positions, ${R[5][1]} leave requests awaiting approval and ${R[1][1]} exit cases open.`, bullets: [] };
  }
});
const E_ds = D => E.ds(D);

aiTool('purchase_overview', {
  domain: 'purchase', mod: 'pr_home', drill: ['pr_home', 'Store & purchase dashboard'],
  desc: 'Purchase and inventory position: material requests, purchase requests and purchase orders by status with values, and stock items at or below reorder level.',
  run(a, c) {
    const T = PT(), sc = pcScopeBr(), mine = x => (x.branch === 'CORP' || !x.branch) ? c.all : sc.has(x.branch) && c.ids.has(x.branch);
    const by = (L, f) => { const o = {}; L.forEach(x => { const k = x.status || '—', r = o[k] || (o[k] = [0, 0]); r[0]++; r[1] += f(x); }); return Object.entries(o); };
    const R = [].concat(by((T.mr || []).filter(mine), () => 0).map(([k, v]) => ['Material request', k, v[0], 0]), by((T.pr || []).filter(mine), x => x.value || 0).map(([k, v]) => ['Purchase request', k, v[0], v[1]]), by((T.po || []).filter(mine), x => x.value || 0).map(([k, v]) => ['Purchase order', k, v[0], v[1]]));
    const low = c.all ? (PM().items || []).filter(i => i.active !== false && ((((T.stock || {}).CS || {})[i.id]) || 0) <= (i.reorder || 0)).length : null;
    return {
      title: 'Purchase and inventory position',
      kpis: Object.assign({ 'Open purchase requests': NUM(aiSum(R.filter(r => r[0] === 'Purchase request' && !/Draft|Rejected|Closed|Cancelled/.test(r[1])), r => r[2])), 'Purchase orders value': INRS(aiSum(R.filter(r => r[0] === 'Purchase order' && !/Cancelled|Draft/.test(r[1])), r => r[3])) }, low != null ? { 'Central store items at/below reorder level': NUM(low) } : {}),
      cols: [{ h: 'Document', t: 'text' }, { h: 'Status', t: 'text' }, { h: 'Count', t: 'num' }, { h: 'Value', t: 'inr' }], rows: R,
      headline: `${NUM(aiSum(R.filter(r => r[0] === 'Purchase request'), r => r[2]))} purchase requests and ${NUM(aiSum(R.filter(r => r[0] === 'Purchase order'), r => r[2]))} purchase orders in your scope${low != null ? `; ${low} central-store items are at or below reorder level` : ''}.`, bullets: []
    };
  }
});

aiTool('purchase_budget', {
  domain: 'purchase', mod: 'pr_budget', drill: ['pr_budget', 'Purchase budget'],
  desc: 'Purchase budget versus committed, ordered and received spend by branch.',
  schema: { type: 'object', properties: { limit: { type: 'integer' } } },
  run(a, c) {
    const sc = pcScopeBr(), rows = pcBudgetRows(r => r.branch === 'CORP' ? c.all : sc.has(r.branch) && c.ids.has(r.branch)), G = {};
    rows.forEach(r => { const o = G[r.branch] || (G[r.branch] = { b: 0, cm: 0, od: 0, ac: 0 }); o.b += r.amount || 0; o.cm += r.committed || 0; o.od += r.ordered || 0; o.ac += r.actual || 0; });
    const R = Object.entries(G).map(([k, o]) => ({ k, o, u: aiPct(o.cm + o.od + o.ac, o.b) })).sort((x, y) => y.u - x.u), T = f => aiSum(R, r => r.o[f]);
    return {
      title: 'Purchase budget against commitments and spend',
      kpis: { 'Budget': INRS(T('b')), 'Committed (requests)': INRS(T('cm')), 'Ordered (POs)': INRS(T('od')), 'Received (actual)': INRS(T('ac')), 'Utilised': PCT(aiPct(T('cm') + T('od') + T('ac'), T('b'))) },
      cols: [{ h: 'Branch', t: 'text' }, { h: 'Budget', t: 'inr' }, { h: 'Committed', t: 'inr' }, { h: 'Ordered', t: 'inr' }, { h: 'Received', t: 'inr' }, { h: 'Utilised %', t: 'pct' }],
      rows: R.slice(0, aiLim(a, 100)).map(r => [aiBid(r.k === 'CORP' ? '' : r.k), r.o.b, r.o.cm, r.o.od, r.o.ac, r.u]),
      headline: `${INRS(T('cm') + T('od') + T('ac'))} of the ${INRS(T('b'))} purchase budget is committed, ordered or received (${PCT(aiPct(T('cm') + T('od') + T('ac'), T('b')))}).`, bullets: []
    };
  }
});

aiTool('assets_overview', {
  domain: 'assets', mod: 'as_home', drill: ['as_home', 'Asset dashboard'],
  desc: 'Fixed assets by category (count and cost), assets under maintenance or missing, open maintenance work orders and expired warranties.',
  run(a, c) {
    const T = AT(), A = (T.assets || []).filter(x => aiSeen(c, x.branch) && x.status !== 'Disposed'), cats = AM().cats, G = {};
    A.forEach(x => { const o = G[x.cat] || (G[x.cat] = { n: 0, cost: 0, mt: 0 }); o.n++; o.cost += x.cost || 0; if (x.status === 'Under Maintenance') o.mt++; });
    const today = E.ds(c.D), open = (T.maint || []).filter(m => aiSeen(c, m.branch) && !/Closed|Completed|Rejected|Cancelled/.test(m.status)), expired = A.filter(x => x.warrantyTo && x.warrantyTo < today && !(x.amc && x.amc.to >= today)).length;
    const R = Object.entries(G).map(([k, o]) => [((cats.find(x => x.id === k) || {}).name) || k, o.n, o.cost, o.mt]).sort((x, y) => y[2] - x[2]);
    return {
      title: 'Asset register overview',
      kpis: { 'Assets': NUM(A.length), 'Cost value': INRS(aiSum(A, x => x.cost)), 'Under maintenance': NUM(A.filter(x => x.status === 'Under Maintenance').length), 'Open work orders': NUM(open.length), 'Warranty expired (no AMC)': NUM(expired), 'Missing': NUM(A.filter(x => x.status === 'Missing').length) },
      cols: [{ h: 'Category', t: 'text' }, { h: 'Assets', t: 'num' }, { h: 'Cost value', t: 'inr' }, { h: 'Under maintenance', t: 'num' }], rows: R,
      headline: `${NUM(A.length)} assets worth ${INRS(aiSum(A, x => x.cost))} at cost; ${NUM(A.filter(x => x.status === 'Under Maintenance').length)} are under maintenance, ${open.length} work orders are open and ${expired} have an expired warranty without AMC cover.`, bullets: []
    };
  }
});

aiTool('petty_cash', {
  domain: 'cash', mod: 'cb_home', drill: ['cb_home', 'Petty cash dashboard'],
  desc: 'Petty cash by branch: balance in hand, spend this month and vouchers awaiting approval.',
  schema: { type: 'object', properties: { limit: { type: 'integer' } } },
  run(a, c) {
    const T = Store.get('pcash_tx'), F = E.ds(monthStart(c.D)), G = {};
    (T.ledger || []).filter(l => aiSeen(c, l.bid)).forEach(l => { const o = G[l.bid || ''] || (G[l.bid || ''] = { bal: 0, sp: 0, pend: 0 }); o.bal += l.amount || 0; if (l.type === 'Payment' && l.date >= F) o.sp += -(l.amount || 0); });
    (T.vouchers || []).filter(v => aiSeen(c, v.bid) && /Submitted|Pending/.test(v.status)).forEach(v => { const o = G[v.bid || ''] || (G[v.bid || ''] = { bal: 0, sp: 0, pend: 0 }); o.pend++; });
    const R = Object.entries(G).sort((x, y) => y[1].sp - x[1].sp), t = f => aiSum(R, r => r[1][f]);
    return {
      title: 'Petty cash by branch', kpis: { 'Cash in hand': INRS(t('bal')), 'Spent this month': INRS(t('sp')), 'Vouchers awaiting approval': NUM(t('pend')) },
      cols: [{ h: 'Branch', t: 'text' }, { h: 'Balance in hand', t: 'inr' }, { h: 'Spent this month', t: 'inr' }, { h: 'Vouchers awaiting approval', t: 'num' }], rows: R.slice(0, aiLim(a, 100)).map(([k, o]) => [aiBid(k), o.bal, o.sp, o.pend]),
      headline: `Petty cash in hand is ${INRS(t('bal'))}; ${INRS(t('sp'))} has been spent this month and ${NUM(t('pend'))} vouchers await approval.`, bullets: []
    };
  }
});

aiTool('utilities_overview', {
  domain: 'utilities', mod: 'ut_home', drill: ['ut_home', 'Utilities dashboard'],
  desc: 'Utility bills (electricity, water, internet, rent and others) by type: billed, paid, unpaid and overdue.',
  run(a, c) {
    const T = Store.get('util_tx'), cn = {}; (T.conns || []).forEach(x => cn[x.id] = x);
    const B = (T.bills || []).filter(b => b.kind === 'bill' && aiSeen(c, b.bid || (cn[b.conn] || {}).bid)), today = E.ds(c.D), G = {};
    B.filter(b => (b.billDate || '').slice(0, 7) === ymOf(c.D)).forEach(b => { const o = G[b.type] || (G[b.type] = { n: 0, amt: 0, paid: 0, unpaid: 0, od: 0 }); const v = b.current || 0; o.n++; o.amt += v; if (b.status === 'Paid') o.paid += v; else { o.unpaid += v; if (b.dueDate && b.dueDate < today) o.od += v; } });
    const types = (Store.get('util').types || []), R = Object.entries(G).map(([k, o]) => [((types.find(t => t.id === k || t.code === k) || {}).name) || k, o.n, o.amt, o.paid, o.unpaid, o.od]).sort((x, y) => y[2] - x[2]), t = i => aiSum(R, r => r[i]);
    return {
      title: `Utility bills · ${aiYm(ymOf(c.D))}`, kpis: { 'Billed': INRS(t(2)), 'Paid': INRS(t(3)), 'Unpaid': INRS(t(4)), 'Overdue': INRS(t(5)) },
      cols: [{ h: 'Utility type', t: 'text' }, { h: 'Bills', t: 'num' }, { h: 'Billed', t: 'inr' }, { h: 'Paid', t: 'inr' }, { h: 'Unpaid', t: 'inr' }, { h: 'Overdue', t: 'inr' }], rows: R,
      headline: `${NUM(t(1))} utility bills this month total ${INRS(t(2))}; ${INRS(t(4))} is unpaid of which ${INRS(t(5))} is overdue.`, bullets: []
    };
  }
});
