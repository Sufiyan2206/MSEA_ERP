/* ===== AI Assistant tools, part 3: admissions this period, staff today, maintenance, payroll vs budget, expense categories,
   purchase approvals, student-level lists (permission-gated), class strength, multi-year trend, inventory ===== */
const aiDay = s => E.dn(String(s || '').slice(0, 10));
const AI_STAFF_PRESENT = ['Present', 'Regularised', 'Late', 'Early logout'];

aiTool('admissions_period', {
  domain: 'admissions', mod: 'strength', title: 'Admissions in a period', drill: ['strength', 'Strength, target & capacity'],
  desc: 'New student admissions in a period (today, last 7 days, this month or this academic year), by branch, zone or region. Use for "how many students were admitted this month".',
  schema: { type: 'object', properties: { period: { type: 'string', enum: ['today', 'week', 'month', 'year'] }, level: aiGroupSchema, limit: { type: 'integer' } } },
  run(a, c) {
    const per = ['today', 'week', 'month', 'year'].includes(a.period) ? a.period : 'month', D = c.D, F = per === 'today' ? D : per === 'week' ? D - 6 : per === 'year' ? AYS : monthStart(D), NA = Calc.newAdm(F, D), lvl = AI_LEVELS.includes(a.level) ? a.level : 'branch', G = {};
    c.idx.forEach(i => { const k = aiGroupOf(aiBr(i), lvl), o = G[k] || (G[k] = { n: 0, fee: 0, br: 0 }); o.n += NA[i].n; o.fee += NA[i].fee; o.br++; });
    const R = Object.entries(G).map(([k, o]) => Object.assign({ k }, o)).sort((x, y) => y.n - x.n), T = aiSum(R, r => r.n), TF = aiSum(R, r => r.fee);
    let prev = null; if (per === 'month') { const pf = monthStart(F - 1), pd = Math.min(pf + (D - F), F - 1), PN = Calc.newAdm(pf, pd); prev = aiSum(c.idx, i => PN[i].n); }
    const label = { today: 'today', week: 'in the last 7 days', month: 'this month', year: 'this academic year' }[per];
    return {
      title: `New admissions ${label}`, period: `${dLabel(F)} to ${dLabel(D)}`,
      kpis: Object.assign({ 'New admissions': NUM(T), 'Annual fee value': INRS(TF), 'Branches with admissions': `${R.filter(r => r.n > 0).length} of ${R.length}` }, prev != null ? { 'Same days last month': NUM(prev) } : {}),
      chart: { label: 0, value: 1, title: 'New admissions', fmt: 'num' },
      cols: [{ h: aiLevelName(lvl), t: 'text' }, { h: 'New admissions', t: 'num' }, { h: 'Annual fee value', t: 'inr' }].concat(lvl === 'branch' ? [] : [{ h: 'Branches', t: 'num' }]),
      rows: R.slice(0, aiLim(a, 100)).map(r => [r.k, r.n, r.fee].concat(lvl === 'branch' ? [] : [r.br])),
      headline: `${NUM(T)} students were admitted ${label} (${dLabel(F)} to ${dLabel(D)})${prev != null ? `, against ${NUM(prev)} over the same days last month` : ''}. ${R.length ? 'Highest: ' + R.slice(0, 3).filter(r => r.n > 0).map(r => `${r.k} (${r.n})`).join(', ') + '.' : ''}`, bullets: []
    };
  }
});

aiTool('staff_today', {
  domain: 'hr', mod: 'hr_att', alt: ['hr_reports'], title: 'Staff attendance and absenteeism', drill: ['hr_att', 'Attendance & shifts'],
  desc: "Staff attendance for a day (default: the dashboard date): present, late, half-day, absent, on leave, weekly off and punch exceptions, by branch, department, category or employee. Student attendance is not held in the dashboard.",
  schema: { type: 'object', properties: { by: { type: 'string', enum: ['branch', 'department', 'category', 'employee'], description: 'Grouping; employee lists individual staff and needs staff-level access' }, status: { type: 'string', description: 'For employee view: only this status, e.g. Absent, Late, On leave' }, category: { type: 'string', description: 'Teaching, Non-teaching, Administration, Support' }, sort: { type: 'string', enum: ['absenteeism', 'strength'] }, limit: { type: 'integer' } } },
  calc: 'Absenteeism % = (Absent + 0.5 × Half-day) ÷ (active staff − weekly off / holiday − staff on leave) × 100. Present includes Late, Early logout and Regularised.',
  run(a, c) {
    const sc = hrScope(App.user), date = E.ds(c.D), by = ['branch', 'department', 'category', 'employee'].includes(a.by) ? a.by : 'branch', cat = String(a.category || '').toLowerCase();
    let L = hrEmps().filter(e => e.status === 'Active' && sc.has(e.bid || '') && aiSeen(c, e.bid) && (!cat || String(e.cat || '').toLowerCase().startsWith(cat)));
    const rec = L.map(e => ({ e, a: hrAtt(e, date) })).filter(x => x.a && x.a.status && x.a.status !== 'Not employed');
    if (!rec.length) return { error: `Attendance for ${dLabel(c.D)} has not been synced, so staff attendance cannot be reported for that day. Check Data sync status.`, blocked: false };
    const warn = rec.length < L.length * 0.9 ? [`Attendance is available for ${NUM(rec.length)} of ${NUM(L.length)} active staff for ${dLabel(c.D)}; the rest are not marked or synced yet.`] : [];
    const cls = t => AI_STAFF_PRESENT.includes(t) ? 'pres' : t === 'Half-day' ? 'half' : t === 'Absent' ? 'abs' : t === 'On leave' ? 'lv' : (t === 'Weekly off' || t === 'Holiday') ? 'off' : 'exc';
    const key = x => by === 'branch' ? x.e.bid || '' : by === 'department' ? x.e.dept || hrDesig(x.e.desig).dept || 'Other' : x.e.cat || 'Other';
    if (by === 'employee') {
      if (!can('hr_emp', 'View') && !can('hr_att', 'View')) return { error: 'Employee-wise lists need access to Attendance & Shifts or the Employee Master, which your role does not include.', blocked: true };
      if (aiCfg().sensitive.staffLevel === false) return { error: 'Staff-level lists are switched off for the AI Assistant by the System Admin.', blocked: true };
      const want = String(a.status || 'Absent').toLowerCase(), R = rec.filter(x => String(x.a.status).toLowerCase() === want).sort((p, q) => (aiBid(p.e.bid) + p.e.name).localeCompare(aiBid(q.e.bid) + q.e.name));
      return { title: `Staff marked ${a.status || 'Absent'} · ${dLabel(c.D)}`, period: dLabel(c.D) + ' (day)', sensitive: true, noModelRows: true, warnings: warn, kpis: { 'Staff listed': NUM(R.length), 'Active staff checked': NUM(rec.length) },
        cols: [{ h: 'Employee ID', t: 'text' }, { h: 'Employee', t: 'text' }, { h: 'Branch', t: 'text' }, { h: 'Department', t: 'text' }, { h: 'Designation', t: 'text' }, { h: 'Status', t: 'text' }, { h: 'In', t: 'text' }, { h: 'Out', t: 'text' }],
        rows: R.slice(0, aiLim(a, 100)).map(x => [x.e.id, x.e.name, aiBid(x.e.bid), x.e.dept || hrDesig(x.e.desig).dept || '', x.e.desig || '', x.a.status, x.a.in || '—', x.a.out || '—']),
        headline: `${NUM(R.length)} staff were marked ${a.status || 'Absent'} on ${dLabel(c.D)} (of ${NUM(rec.length)} with attendance recorded).`, bullets: ['Employee-level rows are visible only to roles with staff-level access and are not shared with the AI model.'] };
    }
    const G = {}; rec.forEach(x => { const k = key(x), o = G[k] || (G[k] = { n: 0, pres: 0, half: 0, abs: 0, lv: 0, off: 0, late: 0, exc: 0 }); o.n++; const t = x.a.status, k2 = cls(t); o[k2]++; if (t === 'Late') o.late++; });
    const rate = o => aiPct(o.abs + o.half * 0.5, o.n - o.off - o.lv);
    const R = Object.entries(G).map(([k, o]) => Object.assign({ k }, o, { rate: rate(o) })).sort(a.sort === 'strength' ? (x, y) => y.n - x.n : (x, y) => y.rate - x.rate), T = f => aiSum(R, r => r[f]);
    const tot = { n: T('n'), abs: T('abs'), half: T('half'), off: T('off'), lv: T('lv') };
    const stat = {}; rec.forEach(x => stat[x.a.status] = (stat[x.a.status] || 0) + 1);
    return {
      title: `Staff attendance by ${by} · ${dLabel(c.D)}`, period: dLabel(c.D) + ' (day)', warnings: warn,
      kpis: { 'Active staff': NUM(T('n')), 'Present': NUM(T('pres')), 'Half-day': NUM(T('half')), 'Absent': NUM(T('abs')), 'On leave': NUM(T('lv')), 'Weekly off / holiday': NUM(T('off')), 'Punch exceptions': NUM(T('exc')), 'Absenteeism': PCT(rate(tot)) },
      chart: { label: 0, value: 4, title: 'Absenteeism %', fmt: 'pct' },
      cols: [{ h: by === 'branch' ? 'Branch' : by === 'department' ? 'Department' : 'Category', t: 'text' }, { h: 'Active staff', t: 'num' }, { h: 'Present', t: 'num' }, { h: 'Absent', t: 'num' }, { h: 'Absenteeism %', t: 'pct' }, { h: 'Half-day', t: 'num' }, { h: 'On leave', t: 'num' }, { h: 'Late', t: 'num' }, { h: 'Punch exceptions', t: 'num' }, { h: 'Weekly off / holiday', t: 'num' }],
      rows: R.slice(0, aiLim(a, 30)).map(r => [by === 'branch' ? aiBid(r.k) : r.k, r.n, r.pres, r.abs, r.rate, r.half, r.lv, r.late, r.exc, r.off]),
      headline: `${NUM(T('n'))} active staff on ${dLabel(c.D)}: ${NUM(T('pres'))} present (${NUM(T('late') ? R.reduce((s, r) => s + r.late, 0) : 0)} of them late), ${NUM(T('abs'))} absent, ${NUM(T('half'))} half-day, ${NUM(T('lv'))} on leave, ${NUM(T('exc'))} with incomplete punches. Absenteeism ${PCT(rate(tot))}.`,
      bullets: ['Status mix: ' + Object.entries(stat).sort((p, q) => q[1] - p[1]).map(([k, v]) => `${k} ${NUM(v)}`).join(', ') + '.', 'Student attendance is not part of the dashboard data, so only staff attendance is reported.']
    };
  }
});

aiTool('maintenance_pending', {
  domain: 'assets', mod: 'mm_home', title: 'Pending maintenance tickets', drill: ['mm_home', 'Maintenance Management'],
  desc: 'Maintenance requests, work orders and asset maintenance tickets still open for more than a given number of days (default 7).',
  schema: { type: 'object', properties: { days: { type: 'integer', description: 'Minimum days pending, default 7' }, domain: { type: 'string', enum: ['IT', 'NONIT'], description: 'IT tickets or non-IT maintenance only' }, limit: { type: 'integer' } } },
  run(a, c) {
    const min = a.days != null && +a.days >= 0 ? +a.days : 7, MM = Store.get('mm'), L = [];
    (MM.reqs || []).filter(r => r.status === 'New' && c.ids.has(r.ent)).forEach(r => L.push(['Request', r.no, r.ent, r.desc, r.priority, 'Awaiting conversion', String(r.created).slice(0, 10)]));
    (MM.wos || []).filter(w => !['Closed', 'Verified'].includes(w.status) && c.ids.has(w.ent) && (!a.domain || w.dom === a.domain)).forEach(w => L.push(['Work order', w.no, w.ent, w.desc, w.priority, w.status, String(w.opened).slice(0, 10)]));
    if (can('as_maint', 'View')) (AT().maint || []).filter(m => !/Draft|Closed|Completed|Rejected|Cancelled/.test(m.status) && c.ids.has(m.branch)).forEach(m => L.push(['Asset work order', m.no, m.branch, m.fault || m.desc || '', m.priority || '', m.status, String(m.createdAt || m.date).slice(0, 10)]));
    const R = L.map(x => ({ x, d: c.D - aiDay(x[6]) })).filter(r => r.d > min).sort((p, q) => q.d - p.d), crit = R.filter(r => /Critical|High/.test(r.x[4])).length;
    return {
      title: `Maintenance tickets pending more than ${min} days`, period: `open on ${dLabel(c.D)}`,
      kpis: { 'Pending tickets': NUM(R.length), 'High / critical priority': NUM(crit), 'Oldest (days)': NUM(R.length ? R[0].d : 0), 'All open tickets': NUM(L.length) },
      cols: [{ h: 'Type', t: 'text' }, { h: 'Ticket', t: 'text' }, { h: 'Branch', t: 'text' }, { h: 'Issue', t: 'text', cls: 'wrap small' }, { h: 'Priority', t: 'text' }, { h: 'Status', t: 'text' }, { h: 'Raised on', t: 'text' }, { h: 'Days pending', t: 'num' }],
      rows: R.slice(0, aiLim(a, 100)).map(r => [r.x[0], r.x[1], aiBid(r.x[2]), r.x[3], r.x[4], r.x[5], r.x[6], r.d]),
      headline: R.length ? `${NUM(R.length)} maintenance tickets have been open for more than ${min} days (${crit} high or critical); the oldest has waited ${R[0].d} days.` : `No maintenance ticket in your scope has been open for more than ${min} days.`,
      bullets: R.length ? ['Suggested action: ask the Maintenance Manager for a dated plan on the oldest and the high-priority tickets, and check whether any are waiting for parts or vendor approval.'] : []
    };
  }
});

aiTool('payroll_vs_budget', {
  domain: 'payroll', mod: 'py_reports', needs: ['fn_budget'], title: 'Payroll versus budget', drill: ['py_reports', 'Payroll reports'],
  desc: "A month's payroll cost (gross pay and employer PF / ESI from the payroll run) against the monthly salary budget, with the year-to-date ledger position.",
  schema: { type: 'object', properties: { month: { type: 'string', description: 'YYYY-MM, default current month' } } },
  run(a, c) {
    if (!c.all) return { error: 'Payroll is a group-level figure and is only available to users with all-branch scope.', blocked: true };
    const want = /^\d{4}-\d{2}$/.test(a.month || '') ? a.month : ymOf(c.D), runs = (Store.get('payroll').runs || []).filter(r => r.totals).sort((x, y) => y.ym.localeCompare(x.ym)), run = runs.find(r => r.ym === want) || runs.find(r => r.ym < want);
    if (!run) return { error: 'No payroll run is available yet.' };
    const B = aiClean(() => fnBudgetRows()).filter(b => b.gl === '5001'), mb = aiSum(B, b => b.annual) / 12, gross = run.totals.gross, er = run.totals.pfEr + run.totals.esiEr;
    const led = aiClean(() => fnScoped()).filter(j => j.status === 'Posted' && j.date.slice(0, 7) === run.ym).reduce((s, j) => s + j.lines.filter(l => l.gl === '5001').reduce((x, l) => x + l.dr - l.cr, 0), 0);
    return {
      title: `Payroll against budget · ${aiYm(run.ym)}`, period: aiYm(run.ym) + (run.ym !== want ? ` (latest processed run; ${aiYm(want)} is not processed yet)` : ''),
      kpis: { 'Payroll gross': INRS(gross), 'Monthly salary budget': INRS(mb), 'Variance': INRS(gross - mb) + ' (' + PCT(aiPct(gross - mb, mb)) + ')', 'Employer PF + ESI (extra)': INRS(er), 'Employees paid': NUM(run.totals.n), 'Run status': run.status },
      chart: { label: 0, series: [1, 2], seriesNames: ['Monthly budget', 'Payroll run'], title: 'Budget and payroll', fmt: 'inr' },
      cols: [{ h: 'Measure', t: 'text' }, { h: 'Monthly budget', t: 'inr' }, { h: 'Payroll run', t: 'inr' }, { h: 'Over / (under) budget', t: 'inr' }, { h: 'Variance %', t: 'pct' }, { h: 'Salary posted in ledger this month', t: 'inr' }],
      rows: [['Gross salaries & wages', mb, gross, gross - mb, aiPct(gross - mb, mb), led]],
      headline: `Payroll gross for ${aiYm(run.ym)} is ${INRS(gross)} against a monthly salary budget of ${INRS(mb)}: ${gross > mb ? 'over' : 'under'} by ${INRS(Math.abs(gross - mb))} (${PCT(Math.abs(aiPct(gross - mb, mb)))}). Employer PF and ESI add ${INRS(er)}.`,
      bullets: ['The budget is the annual salary line (ledger 5001) divided by 12; there are no separate budget lines for employer PF / ESI.', led ? `Salary expense actually posted to the ledger in ${aiYm(run.ym)} is ${INRS(led)}, which differs from the payroll run because journals are posted separately from payroll processing.` : 'No salary journal has been posted to the ledger for this month yet.']
    };
  }
});

aiTool('top_expenses', {
  domain: 'finance', mod: 'fn_reports', title: 'Top expense categories', drill: ['fn_reports', 'Financial reports'],
  desc: 'Largest expense categories (ledger accounts) for a month, or the year to date, from posted journals.',
  schema: { type: 'object', properties: { month: { type: 'string', description: 'YYYY-MM, default current month' }, top: { type: 'integer', description: 'How many categories, default 5' }, ytd: { type: 'boolean' } } },
  run(a, c) {
    const ym = /^\d{4}-\d{2}$/.test(a.month || '') ? a.month : ymOf(c.D), top = Math.max(1, Math.min(20, +a.top || 5)), J = aiClean(() => fnScoped()).filter(j => j.status === 'Posted' && j.date <= E.ds(c.D));
    const sumBy = f => { const G = {}; J.filter(f).forEach(j => j.lines.forEach(l => { let g; try { g = fnGl(l.gl); } catch (e) { return; } if (g.type !== 'Expense') return; const o = G[g.name] || (G[g.name] = { amt: 0, n: 0 }); o.amt += l.dr - l.cr; o.n++; })); return Object.entries(G).map(([k, o]) => ({ k, amt: o.amt, n: o.n })).filter(x => x.amt > 0).sort((x, y) => y.amt - x.amt); };
    let R = a.ytd ? sumBy(() => true) : sumBy(j => j.date.slice(0, 7) === ym), per = a.ytd ? 'financial year to date' : aiYm(ym), fell = false;
    if (!R.length && !a.ytd) { R = sumBy(() => true); per = 'financial year to date'; fell = true; }
    const tot = aiSum(R, r => r.amt);
    return {
      title: `Top ${top} expense categories · ${per}`, period: per,
      kpis: { 'Total expense': INRS(tot), 'Categories': NUM(R.length), 'Top category': R[0] ? R[0].k : '—' },
      chart: { label: 1, value: 2, title: 'Expense', fmt: 'inr' },
      cols: [{ h: 'Rank', t: 'num' }, { h: 'Expense category', t: 'text' }, { h: 'Amount', t: 'inr' }, { h: '% of total expense', t: 'pct' }, { h: 'Postings', t: 'num' }],
      rows: R.slice(0, top).map((r, i) => [i + 1, r.k, r.amt, aiPct(r.amt, tot), r.n]),
      headline: R.length ? `${fell ? `No expense journals are posted for ${aiYm(ym)}, so this shows the financial year to date. ` : ''}The top ${Math.min(top, R.length)} expense categories for ${per} are ${R.slice(0, top).map(r => `${r.k} (${INRS(r.amt)})`).join(', ')}, together ${PCT(aiPct(aiSum(R.slice(0, top), r => r.amt), tot))} of ${INRS(tot)}.` : `No expense journals are posted in your scope for ${per}.`,
      bullets: ['Source: posted ledger journals. Expenses not yet posted to the ledger (for example unbooked bills) are not included.']
    };
  }
});

aiTool('purchase_pending_approval', {
  domain: 'purchase', mod: 'pr_pr', title: 'Purchase requests pending approval', drill: ['pr_inbox', 'Purchase approvals inbox'],
  desc: 'Purchase requests waiting for approval, by the approver they are currently with (Principal, Zonal Director, Regional Director, Corporate Purchase, Finance, CFO). Use for "pending with the CFO".',
  schema: { type: 'object', properties: { approver: { type: 'string', description: 'Current approver role, e.g. CFO, Finance, Corporate Purchase, Regional Director' }, limit: { type: 'integer' } } },
  run(a, c) {
    const L = [];
    (PT().pr || []).filter(p => p.status === 'Submitted' && p.chain && p.chain[p.level] && (!p.branch || p.branch === 'CORP' ? c.all : c.ids.has(p.branch))).forEach(p => { const cur = p.chain[p.level]; L.push({ p, role: cur.role, label: cur.label || cur.role }); });
    const by = {}; L.forEach(x => by[x.role] = (by[x.role] || 0) + 1); const q = aiNorm(a.approver), F = q ? L.filter(x => aiNorm(x.role) === q || aiNorm(x.role).includes(q) || aiNorm(x.label).includes(q)) : L;
    const R = F.map(x => ({ x, d: Math.max(0, c.D - aiDay(x.p.submittedAt || x.p.createdAt)) })).sort((u, v) => v.d - u.d);
    const brk = Object.entries(by).sort((u, v) => v[1] - u[1]).map(([r, n]) => `${r} ${n}`).join(', ');
    return {
      title: a.approver ? `Purchase requests pending with ${a.approver}` : 'Purchase requests pending approval', period: `pending on ${dLabel(c.D)}`,
      kpis: Object.assign({ 'Pending requests': NUM(R.length), 'Value': INRS(aiSum(R, r => r.x.p.value || 0)) }, Object.fromEntries(Object.entries(by).map(([k, v]) => ['With ' + k, NUM(v)]))),
      cols: [{ h: 'Purchase request', t: 'text' }, { h: 'Branch', t: 'text' }, { h: 'Department', t: 'text' }, { h: 'Value', t: 'inr' }, { h: 'Now with', t: 'text' }, { h: 'Submitted on', t: 'text' }, { h: 'Days waiting', t: 'num' }],
      rows: R.slice(0, aiLim(a, 100)).map(r => [r.x.p.no, aiBid(r.x.p.branch === 'CORP' ? '' : r.x.p.branch), r.x.p.dept || '—', r.x.p.value || 0, r.x.label || r.x.role, String(r.x.p.submittedAt || r.x.p.createdAt).slice(0, 10), r.d]),
      headline: R.length ? `${NUM(R.length)} purchase requests${a.approver ? ' are pending with ' + a.approver : ' are pending approval'}, worth ${INRS(aiSum(R, r => r.x.p.value || 0))}; the longest has waited ${R[0].d} days.` : `No purchase request is currently pending with ${a.approver || 'any approver'}${a.approver && L.length ? `. Where requests are waiting: ${brk}` : ''}.`,
      bullets: R.length || !L.length ? [] : [`Currently pending by approver: ${brk}.`]
    };
  }
});

const aiStuOK = () => ['zeropayer', 'instalment', 'students', 'revenue'].some(m => can(m, 'View student-level details'));
const aiPlain = fn => { const sv = App.f; App.f = Object.assign(F0(), { date: sv.date, ay: CUR_AY }); try { return fn(); } finally { App.f = sv; } };
aiTool('zero_payer_students', {
  domain: 'fees', mod: 'zeropayer', sens: 'studentLevel', title: 'Zero-payer students', drill: ['zeropayer', 'Zero payer analysis'],
  desc: 'List of students who have paid nothing against fees that have fallen due (zero payers), across the branches in the caller\'s scope, with branch, class, section and amount outstanding. Shown to the user only when their role has student-level access; individual rows are never sent to the AI model.',
  schema: { type: 'object', properties: { class: { type: 'string', description: 'Only this class' }, limit: { type: 'integer' } } },
  calc: 'Zero payer = student with fees due on or before the date and nothing paid. Outstanding = fees due − fees paid.',
  run(a, c) {
    const AG = Calc.agg(c.D), n = aiSum(c.idx, i => AG[i].zpN), amt = aiSum(c.idx, i => AG[i].zpAmt);
    const brk = c.idx.filter(i => AG[i].zpN).sort((x, y) => AG[y].zpN - AG[x].zpN);
    if (!aiStuOK()) return { title: 'Zero payers by branch', kpis: { 'Zero payers': NUM(n), 'Outstanding of zero payers': INRS(amt) }, cols: [{ h: 'Branch', t: 'text' }, { h: 'Zero payers', t: 'num' }, { h: 'Their outstanding', t: 'inr' }], rows: brk.slice(0, 100).map(i => [aiBr(i).name, AG[i].zpN, AG[i].zpAmt]), headline: `${NUM(n)} zero payers owe ${INRS(amt)}. Your role can see counts but not individual student details.`, bullets: [] };
    const S = E.studentsAt(DATA, A, c.D), set = new Set(c.idx), cl = String(a.class || '').toLowerCase(), R = [];
    S.forEach(x => { if (x && !x.exited && set.has(x.s.b) && x.status === 'Zero payer' && (!cl || String(x.s.cls).toLowerCase() === cl || String(x.s.cls).toLowerCase() === 'class ' + cl)) R.push(x); });
    R.sort((p, q) => q.os - p.os);
    return {
      title: `Zero-payer students${c.n === 1 ? ' · ' + aiBr(c.idx[0]).name : ''}`, noModelRows: true, sensitive: true,
      kpis: { 'Zero payers': NUM(R.length), 'Outstanding': INRS(aiSum(R, x => x.os)), 'Overdue': INRS(aiSum(R, x => x.od)), 'Branches': NUM(new Set(R.map(x => x.s.b)).size) },
      cols: [{ h: 'Admission no.', t: 'text' }, { h: 'Student', t: 'text' }, { h: 'Branch', t: 'text' }, { h: 'Class', t: 'text' }, { h: 'Section', t: 'text' }, { h: 'Outstanding', t: 'inr' }, { h: 'Overdue', t: 'inr' }, { h: 'Annual fee', t: 'inr' }],
      rows: R.slice(0, aiLim(a, 100)).map(x => [x.s.adm, x.s.name, aiBr(x.s.b).name, x.s.cls, x.s.sec, x.os, x.od, x.s.annual]),
      headline: `${NUM(R.length)} students${cl ? ' of ' + a.class : ''} have paid nothing; together they owe ${INRS(aiSum(R, x => x.os))} (${INRS(aiSum(R, x => x.od))} overdue).`,
      bullets: R.length > 100 ? ['Showing the first 100 by outstanding amount; the Excel / PDF download carries the same rows. Narrow by branch or class for the rest.'] : ['Student-level rows are visible only to roles with student-level access and are not shared with the AI model.']
    };
  }
});

aiTool('fees_pending_detail', {
  domain: 'fees', mod: 'revenue', sens: null, title: 'Pending fees class-wise / student-wise', drill: ['instalment', 'Instalment dues'],
  desc: 'Pending (outstanding) fees by class and section, or student by student. Use for "pending fees class-wise", "student-wise pending fees", "overdue by class". Student-wise lists need student-level access.',
  schema: { type: 'object', properties: { by: { type: 'string', enum: ['class', 'student'], description: 'class-wise (default) or student-wise' }, class: { type: 'string' }, overdue_only: { type: 'boolean' }, limit: { type: 'integer' } } },
  calc: 'Pending = fees fallen due up to the date − fees paid. Overdue = pending past the grace period. Class totals add every section of the class across the branches in scope.',
  run(a, c) {
    const by = a.by === 'student' ? 'student' : 'class', cl = String(a.class || '').toLowerCase(), okc = x => !cl || String(x).toLowerCase() === cl || String(x).toLowerCase() === 'class ' + cl;
    if (by === 'student') {
      if (!aiStuOK()) return { error: 'Student-wise lists need student-level access, which your role does not include. Class-wise totals are available.', blocked: true };
      if (aiCfg().sensitive.studentLevel === false) return { error: 'Student-level lists are switched off for the AI Assistant by the System Admin.', blocked: true };
      const S = E.studentsAt(DATA, A, c.D), set = new Set(c.idx), R = []; S.forEach(x => { if (x && !x.exited && set.has(x.s.b) && x.os > 0.5 && okc(x.s.cls) && (!a.overdue_only || x.od > 0.5)) R.push(x); }); R.sort((p, q) => q.os - p.os);
      return { title: 'Pending fees student-wise', sensitive: true, noModelRows: true, kpis: { 'Students with dues': NUM(R.length), 'Pending': INRS(aiSum(R, x => x.os)), 'Overdue': INRS(aiSum(R, x => x.od)) },
        cols: [{ h: 'Admission no.', t: 'text' }, { h: 'Student', t: 'text' }, { h: 'Branch', t: 'text' }, { h: 'Class', t: 'text' }, { h: 'Section', t: 'text' }, { h: 'Fee due to date', t: 'inr' }, { h: 'Paid', t: 'inr' }, { h: 'Pending', t: 'inr' }, { h: 'Overdue', t: 'inr' }, { h: 'Status', t: 'text' }],
        rows: R.slice(0, aiLim(a, 100)).map(x => [x.s.adm, x.s.name, aiBr(x.s.b).name, x.s.cls, x.s.sec, x.due, x.paid, x.os, x.od, x.status]),
        headline: `${NUM(R.length)} students have pending fees totalling ${INRS(aiSum(R, x => x.os))} (${INRS(aiSum(R, x => x.od))} overdue).`, bullets: R.length > 100 ? ['Showing the 100 highest dues; the download carries the same rows. Narrow by branch or class for the rest.'] : ['Student-level rows are not shared with the AI model.'] };
    }
    const AG = Calc.agg(c.D), G = {}, ord = []; c.idx.forEach(i => Object.values(AG[i].cls).forEach(k => { if (!okc(k.cls)) return; const key = c.n === 1 ? k.cls + ' ' + k.sec : k.cls; if (!G[key]) { G[key] = { n: 0, due: 0, paid: 0, os: 0, od: 0, zp: 0, br: new Set() }; ord.push(key); } const o = G[key]; o.n += k.n; o.due += k.due; o.paid += k.paid; o.os += k.os; o.od += k.od; o.zp += k.zpN; o.br.add(i); }));
    const natural = (x, y) => (parseInt(String(x).replace(/\D+/g, '')) || 0) - (parseInt(String(y).replace(/\D+/g, '')) || 0) || String(x).localeCompare(y), R = ord.map(k => Object.assign({ k }, G[k])).filter(r => !a.overdue_only || r.od > 0).sort((p, q) => natural(p.k, q.k));
    return { title: c.n === 1 ? 'Pending fees class and section-wise' : 'Pending fees class-wise', kpis: { 'Pending': INRS(aiSum(R, r => r.os)), 'Overdue': INRS(aiSum(R, r => r.od)), 'Students': NUM(aiSum(R, r => r.n)), 'Zero payers': NUM(aiSum(R, r => r.zp)) },
      chart: { label: 0, value: 4, title: 'Pending fees', fmt: 'inr' },
      cols: [{ h: c.n === 1 ? 'Class / section' : 'Class', t: 'text' }, { h: 'Students', t: 'num' }, { h: 'Fee due to date', t: 'inr' }, { h: 'Paid', t: 'inr' }, { h: 'Pending', t: 'inr' }, { h: 'Overdue', t: 'inr' }, { h: 'Zero payers', t: 'num' }, { h: 'Pending %', t: 'pct' }],
      rows: R.map(r => [r.k, r.n, r.due, r.paid, r.os, r.od, r.zp, aiPct(r.os, r.due)]),
      headline: `${INRS(aiSum(R, r => r.os))} is pending across ${R.length} ${c.n === 1 ? 'class sections' : 'classes'} (${INRS(aiSum(R, r => r.od))} overdue). Highest pending: ${R.slice().sort((p, q) => q.os - p.os).slice(0, 3).map(r => `${r.k} (${INRS(r.os)})`).join(', ')}.`, bullets: ['For the student-wise list ask "student-wise pending fees" (needs student-level access).'] };
  }
});

aiTool('collection_compare', {
  domain: 'fees', mod: 'revenue', title: 'Collection: this month against last month', drill: ['revenue', 'Revenue & collection'],
  desc: "Compare this month's fee collection (month to date) with the same days of last month and with the whole of last month, by branch, zone, region or in total.",
  schema: { type: 'object', properties: { level: aiGroupSchema, limit: { type: 'integer' } } },
  calc: 'Collection = receipts posted in the period (fees received), excluding adjustments. "Same days" compares day 1 to today of this month with day 1 to the same day number of last month.',
  run(a, c) {
    const D = c.D, F = monthStart(D), pf = monthStart(F - 1), pl = F - 1, pd = Math.min(pf + (D - F), pl), lvl = AI_LEVELS.includes(a.level) ? a.level : 'branch';
    const cur = Calc.monthSplit(F, D), same = Calc.monthSplit(pf, pd), full = Calc.monthSplit(pf, pl), v = x => x.open + x.fresh + x.adv, G = {};
    c.idx.forEach(i => { const k = aiGroupOf(aiBr(i), lvl), o = G[k] || (G[k] = { a: 0, b: 0, f: 0 }); o.a += v(cur[i]); o.b += v(same[i]); o.f += v(full[i]); });
    const R = Object.entries(G).map(([k, o]) => [k, o.a, o.b, o.a - o.b, aiPct(o.a - o.b, o.b), o.f]).sort((x, y) => x[3] - y[3]), T = i => aiSum(R, r => r[i]);
    return { title: `Collection: ${aiYm(ymOf(D))} against ${aiYm(ymOf(pf))}`, period: `${dLabel(F)} to ${dLabel(D)} against ${dLabel(pf)} to ${dLabel(pd)}`,
      kpis: { [aiYm(ymOf(D)) + ' (to date)']: INRS(T(1)), [aiYm(ymOf(pf)) + ' (same days)']: INRS(T(2)), 'Change': INRS(T(3)) + ' (' + PCT(aiPct(T(3), T(2))) + ')', [aiYm(ymOf(pf)) + ' (full month)']: INRS(T(5)) },
      chart: { label: 0, series: [1, 2], seriesNames: ['This month', 'Last month (same days)'], title: 'Collection', fmt: 'inr' },
      cols: [{ h: aiLevelName(lvl), t: 'text' }, { h: 'This month to date', t: 'inr' }, { h: 'Last month, same days', t: 'inr' }, { h: 'Change', t: 'inr' }, { h: 'Change %', t: 'pct' }, { h: 'Last month, full', t: 'inr' }],
      rows: R.slice(0, aiLim(a, 100)).concat(R.length > 1 ? [['Total', T(1), T(2), T(3), aiPct(T(3), T(2)), T(5)]] : []),
      headline: `${aiYm(ymOf(D))} collection to ${dLabel(D)} is ${INRS(T(1))} against ${INRS(T(2))} over the same days of ${aiYm(ymOf(pf))}: ${T(3) >= 0 ? 'up' : 'down'} ${INRS(Math.abs(T(3)))} (${PCT(Math.abs(aiPct(T(3), T(2))))}). Full ${aiYm(ymOf(pf))} was ${INRS(T(5))}.`, bullets: [] };
  }
});

aiTool('collection_by_date', {
  domain: 'fees', mod: 'daily', title: 'Date-wise fee collection', drill: ['daily', 'Daily collection'],
  desc: 'Day-by-day fee collection (receipts, refunds, net) for the last N days or the month to date, in total or for the chosen branch / zone.',
  schema: { type: 'object', properties: { days: { type: 'integer', description: 'Last N days, 1 to 62; default month to date' }, limit: { type: 'integer' } } },
  calc: 'Net collection for a day = receipts − refunds posted that day across the branches in scope.',
  run(a, c) {
    const D = c.D, F = a.days > 0 ? D - Math.min(62, +a.days) + 1 : monthStart(D), R = [];
    for (let d = D; d >= F; d--) { let net = 0, cnt = 0, ref = 0; c.idx.forEach(i => { const x = Calc.day(i, d); net += x.net; cnt += x.cnt; ref += x.ref || 0; }); R.push([dLabel(d), E.dow ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][E.dow(d)] : '', cnt, net + ref, ref, net]); }
    const tot = aiSum(R, r => r[5]), best = R.slice().sort((x, y) => y[5] - x[5])[0];
    return { title: `Date-wise collection · ${dLabel(F)} to ${dLabel(D)}`, period: `${dLabel(F)} to ${dLabel(D)}`, kpis: { 'Net collection': INRS(tot), 'Receipts': NUM(aiSum(R, r => r[2])), 'Best day': best ? best[0] + ' (' + INRS(best[5]) + ')' : '—', 'Daily average': INRS(tot / Math.max(1, R.length)) },
      chart: { label: 0, value: 5, title: 'Net collection', fmt: 'inr' }, cols: [{ h: 'Date', t: 'text' }, { h: 'Day', t: 'text' }, { h: 'Receipts', t: 'num' }, { h: 'Gross', t: 'inr' }, { h: 'Refunds', t: 'inr' }, { h: 'Net collection', t: 'inr' }],
      rows: R.slice(0, aiLim(a, 70)), headline: `Net collection from ${dLabel(F)} to ${dLabel(D)} is ${INRS(tot)} over ${R.length} days; best day ${best ? best[0] + ' (' + INRS(best[5]) + ')' : '—'}.`, bullets: [] };
  }
});

aiTool('strength_movement', {
  domain: 'admissions', mod: 'cancel', alt: ['strength'], title: 'Admissions, cancellations and net strength', drill: ['cancel', 'Cancellations & withdrawals'],
  desc: 'Student movement since 1 January 2026: opening strength, new admissions, cancellations, withdrawals, transfers out, net growth and net strength, by branch, zone, region or class.',
  schema: { type: 'object', properties: { level: { type: 'string', enum: ['branch', 'zone', 'region', 'class'] }, limit: { type: 'integer' } } },
  calc: 'Net strength = opening strength + new admissions (incl. re-admissions and inward transfers) − cancellations − withdrawals − transfers out.',
  run(a, c) {
    const lvl = ['branch', 'zone', 'region', 'class'].includes(a.level) ? a.level : 'branch', rows = aiPlain(() => Str.rows(c.D, lvl, c.idx)).slice().sort((x, y) => y.netStrength - x.netStrength), T = f => aiSum(rows, r => r[f]);
    return { title: `Admissions, cancellations and net strength by ${lvl}`, period: '1 Jan 2026 to ' + dLabel(c.D),
      kpis: { 'Opening strength': NUM(T('opening')), 'New admissions': NUM(T('grossAdm')), 'Cancellations': NUM(T('canc')), 'Withdrawals': NUM(T('wd')), 'Transfers out': NUM(T('outward')), 'Net strength': NUM(T('netStrength')) },
      chart: { label: 0, value: 7, title: 'Net strength', fmt: 'num' },
      cols: [{ h: { branch: 'Branch', zone: 'Zone', region: 'Region', class: 'Class' }[lvl], t: 'text' }, { h: 'Opening', t: 'num' }, { h: 'New admissions', t: 'num' }, { h: 'Cancellations', t: 'num' }, { h: 'Withdrawals', t: 'num' }, { h: 'Transfers out', t: 'num' }, { h: 'Net growth', t: 'num' }, { h: 'Net strength', t: 'num' }, { h: 'Target', t: 'num' }],
      rows: rows.slice(0, aiLim(a, 100)).map(r => [r.label, r.opening, r.grossAdm, r.canc, r.wd, r.outward, r.netGrowth, r.netStrength, r.target == null ? 0 : r.target]),
      headline: `Since 1 Jan 2026: ${NUM(T('grossAdm'))} admissions, ${NUM(T('canc'))} cancellations and ${NUM(T('wd'))} withdrawals took strength from ${NUM(T('opening'))} to ${NUM(T('netStrength'))} (net ${T('netGrowth') >= 0 ? '+' : ''}${NUM(T('netGrowth'))}).`, bullets: [] };
  }
});

aiTool('concessions', {
  domain: 'fees', mod: 'revenue', title: 'Fee concessions and scholarships', drill: ['revenue', 'Revenue & collection'],
  desc: 'Gross fee, concessions, scholarships and net fee by branch, zone or region, with concession % of gross fee.',
  schema: { type: 'object', properties: { level: { type: 'string', enum: ['branch', 'zone', 'region', 'class'] }, limit: { type: 'integer' } } },
  calc: 'Concession % = (concessions + scholarships) ÷ gross fee × 100. Net fee = gross fee − concessions − scholarships.',
  run(a, c) {
    const lvl = ['branch', 'zone', 'region', 'class'].includes(a.level) ? a.level : 'zone', rows = aiPlain(() => Str.rows(c.D, lvl, c.idx)).slice().sort((x, y) => (y.conc + y.schol) - (x.conc + x.schol)), T = f => aiSum(rows, r => r[f]);
    return { title: `Fee concessions by ${lvl}`, kpis: { 'Gross fee': INRS(T('gross')), 'Concessions': INRS(T('conc')), 'Scholarships': INRS(T('schol')), 'Net fee': INRS(T('net')), 'Concession %': PCT(aiPct(T('conc') + T('schol'), T('gross'))) },
      chart: { label: 0, value: 4, title: 'Concession + scholarship', fmt: 'inr' }, cols: [{ h: { branch: 'Branch', zone: 'Zone', region: 'Region', class: 'Class' }[lvl], t: 'text' }, { h: 'Gross fee', t: 'inr' }, { h: 'Concessions', t: 'inr' }, { h: 'Scholarships', t: 'inr' }, { h: 'Concession + scholarship', t: 'inr' }, { h: 'Net fee', t: 'inr' }, { h: 'Concession %', t: 'pct' }],
      rows: rows.slice(0, aiLim(a, 100)).map(r => [r.label, r.gross, r.conc, r.schol, r.conc + r.schol, r.net, r.concPct]),
      headline: `Concessions and scholarships total ${INRS(T('conc') + T('schol'))} (${PCT(aiPct(T('conc') + T('schol'), T('gross')))} of the ${INRS(T('gross'))} gross fee); net fee is ${INRS(T('net'))}.`, bullets: [] };
  }
});

aiTool('attendance_shortage', {
  domain: 'hr', mod: 'hr_att', alt: ['hr_reports'], title: 'Staff attendance shortage', drill: ['hr_att', 'Attendance & shifts'],
  desc: 'Teacher (or other staff) attendance shortage for a month: staff whose attendance % is below a threshold (default 90), by branch or employee. Use for "teacher attendance shortage report".',
  schema: { type: 'object', properties: { month: { type: 'string', description: 'YYYY-MM, default current month' }, below_pct: { type: 'number', description: 'Attendance % threshold, default 90' }, category: { type: 'string', description: 'Teaching (default), Non-teaching, Administration, Support, or all' }, by: { type: 'string', enum: ['branch', 'employee'] }, limit: { type: 'integer' } } },
  calc: 'Attendance % = (days present + 0.5 × half-days) ÷ (working days − approved leave days) × 100, over the working days recorded in the month. Weekly offs and holidays are excluded.',
  run(a, c) {
    const ym = /^\d{4}-\d{2}$/.test(a.month || '') ? a.month : ymOf(c.D), th = +a.below_pct > 0 ? +a.below_pct : 90, cat = String(a.category || 'teaching').toLowerCase(), by = a.by === 'employee' ? 'employee' : 'branch', sc = hrScope(App.user);
    if (by === 'employee' && aiCfg().sensitive.staffLevel === false) return { error: 'Staff-level lists are switched off for the AI Assistant by the System Admin.', blocked: true };
    const L = hrEmps().filter(e => e.status === 'Active' && sc.has(e.bid || '') && aiSeen(c, e.bid) && (cat === 'all' || String(e.cat || '').toLowerCase().startsWith(cat)));
    const R = L.map(e => { const s = hrAttSummary(e, ym), work = s.days - s.off - s.holiday - s.leave - s.lwp, got = s.present + s.half * 0.5; return { e, s, work, pct: work > 0 ? got / work * 100 : 100 }; }).filter(r => r.work > 0);
    if (!R.length) return { error: `No attendance has been recorded yet for ${aiYm(ym)}, so a shortage report cannot be prepared.` };
    const low = R.filter(r => r.pct < th), cn = cat === 'all' ? 'staff' : cat === 'teaching' ? 'teachers' : cat + ' staff';
    if (by === 'employee') {
      if (!can('hr_emp', 'View') && !can('hr_att', 'View')) return { error: 'Employee-wise lists need access to Attendance & Shifts, which your role does not include.', blocked: true };
      low.sort((p, q) => p.pct - q.pct);
      return { title: `Attendance shortage (below ${th}%) · ${aiYm(ym)}`, period: aiYm(ym), sensitive: true, noModelRows: true, kpis: { 'Below threshold': NUM(low.length), [cn[0].toUpperCase() + cn.slice(1) + ' checked']: NUM(R.length), 'Threshold': th + '%' },
        cols: [{ h: 'Employee ID', t: 'text' }, { h: 'Employee', t: 'text' }, { h: 'Branch', t: 'text' }, { h: 'Department', t: 'text' }, { h: 'Working days', t: 'num' }, { h: 'Present', t: 'num' }, { h: 'Half-days', t: 'num' }, { h: 'Absent', t: 'num' }, { h: 'Attendance %', t: 'pct' }],
        rows: low.slice(0, aiLim(a, 100)).map(r => [r.e.id, r.e.name, aiBid(r.e.bid), r.e.dept || hrDesig(r.e.desig).dept || '', r.work, r.s.present, r.s.half, r.s.absent, r.pct]),
        headline: `${NUM(low.length)} of ${NUM(R.length)} ${cn} have attendance below ${th}% in ${aiYm(ym)}.`, bullets: ['Employee-level rows are visible only to roles with staff-level access and are not shared with the AI model.'] };
    }
    const G = {}; R.forEach(r => { const k = r.e.bid || '', o = G[k] || (G[k] = { n: 0, low: 0, sum: 0 }); o.n++; o.sum += r.pct; if (r.pct < th) o.low++; });
    const rows = Object.entries(G).map(([k, o]) => [aiBid(k), o.n, o.low, aiPct(o.low, o.n), o.sum / o.n]).sort((x, y) => y[3] - x[3]);
    return { title: `Attendance shortage by branch (below ${th}%) · ${aiYm(ym)}`, period: aiYm(ym), kpis: { 'Below threshold': NUM(low.length), [cn[0].toUpperCase() + cn.slice(1) + ' checked']: NUM(R.length), 'Share below': PCT(aiPct(low.length, R.length)), 'Average attendance': PCT(aiSum(R, r => r.pct) / R.length) },
      chart: { label: 0, value: 3, title: '% of staff below threshold', fmt: 'pct' }, cols: [{ h: 'Branch', t: 'text' }, { h: 'Staff checked', t: 'num' }, { h: 'Below threshold', t: 'num' }, { h: '% below', t: 'pct' }, { h: 'Average attendance %', t: 'pct' }],
      rows: rows.slice(0, aiLim(a, 100)), headline: `${NUM(low.length)} of ${NUM(R.length)} ${cn} (${PCT(aiPct(low.length, R.length))}) are below ${th}% attendance in ${aiYm(ym)}.`, bullets: ['Ask "attendance shortage employee-wise" for the names (needs staff-level access).'] };
  }
});

aiTool('finance_mis', {
  domain: 'finance', mod: 'revenue', title: 'Finance MIS', drill: ['fn_reports', 'Financial reports'],
  desc: 'Finance management information report, branch by branch within scope: students, fee demand, collection, outstanding, monthly target achievement, concessions and, where permitted, expense against budget. Use for "prepare Finance MIS".',
  schema: { type: 'object', properties: { limit: { type: 'integer' } } },
  calc: 'Each column uses the same definition as its own report: collection and outstanding from the fee ledger, target achievement from the monthly target, expense and budget from posted journals and the approved budget.',
  run(a, c) {
    const AG = Calc.agg(c.D), ex = {}; let hasBud = false, bn = '';
    if (can('fn_budget', 'View') && aiCfg().tools.budget_vs_actual !== false && aiCfg().domains.finance !== false) { try { const r = AI_T.budget_vs_actual.run({ show: 'expense', limit: 100 }, c); if (r && r.rows) { const bi = r.cols.findIndex(x => x.h === 'Branch'), ai = r.cols.findIndex(x => /Actual/i.test(x.h)), pi = r.cols.findIndex(x => x.h === 'Budget to date'); r.rows.forEach(x => ex[x[bi]] = { act: x[ai], bud: x[pi] }); hasBud = true; } } catch (e) { bn = 'Expense and budget columns could not be read.'; } }
    const R = c.idx.map(i => { const m = Calc.month(i, c.D), g = AG[i], e = ex[aiBr(i).name];  return [aiBr(i).name, g.n, g.due, g.paid, g.os, g.od, m.target, m.achieved, m.achPct].concat(hasBud ? [e ? e.act : 0, e ? e.bud : 0] : []); }).sort((x, y) => y[4] - x[4]);
    const T = i => aiSum(R, r => r[i]);
    return { title: `Finance MIS · ${c.n === 1 ? aiBr(c.idx[0]).name : c.n + ' branches'}`, kpis: Object.assign({ 'Fee due to date': INRS(T(2)), 'Collected': INRS(T(3)), 'Outstanding': INRS(T(4)), 'Overdue': INRS(T(5)), 'Month target achieved': PCT(aiPct(T(7), T(6))) }, hasBud ? { 'Expense (to date)': INRS(T(9)), 'Budget (to date)': INRS(T(10)) } : {}),
      chart: { label: 0, series: [3, 4], seriesNames: ['Collected', 'Outstanding'], title: 'Collected and outstanding', fmt: 'inr' },
      cols: [{ h: 'Branch', t: 'text' }, { h: 'Students', t: 'num' }, { h: 'Fee due to date', t: 'inr' }, { h: 'Collected', t: 'inr' }, { h: 'Outstanding', t: 'inr' }, { h: 'Overdue', t: 'inr' }, { h: 'Month target', t: 'inr' }, { h: 'Month collection', t: 'inr' }, { h: 'Target achieved %', t: 'pct' }].concat(hasBud ? [{ h: 'Expense to date', t: 'inr' }, { h: 'Budget to date', t: 'inr' }] : []),
      rows: R.slice(0, aiLim(a, 100)).concat(R.length > 1 ? [['Total', T(1), T(2), T(3), T(4), T(5), T(6), T(7), aiPct(T(7), T(6))].concat(hasBud ? [T(9), T(10)] : [])] : []),
      warnings: hasBud ? [] : ['Expense and budget columns are not shown because your role does not include Budget & cost control.'].concat(bn ? [bn] : []),
      headline: `Finance MIS for ${c.n === 1 ? aiBr(c.idx[0]).name : NUM(c.n) + ' branches'} as on ${dLabel(c.D)}: ${INRS(T(3))} collected of ${INRS(T(2))} due, ${INRS(T(4))} outstanding (${INRS(T(5))} overdue); monthly target achievement ${PCT(aiPct(T(7), T(6)))}.`, bullets: [] };
  }
});

aiTool('class_strength', {
  domain: 'admissions', mod: 'strength', title: 'Class-wise strength (academics)', drill: ['strength', 'Strength, target & capacity'],
  desc: 'Class-wise student strength, target, new admissions and capacity across the branches in scope (academics view). Marks, timetable and results are not held in the dashboard.',
  schema: { type: 'object', properties: { limit: { type: 'integer' } } },
  run(a, c) {
    const G = {}, order = []; Str.rows(c.D, 'class', c.idx).forEach(r => { const k = r.cls || r.label; if (!G[k]) { G[k] = { n: 0, tg: 0, na: 0, cap: 0, ex: 0 }; order.push(k); } const o = G[k]; o.n += r.netStrength || 0; o.tg += r.target || 0; o.na += r.newAdm || 0; o.cap += r.capacity || 0; o.ex += (r.canc || 0) + (r.wd || 0); });
    const R = order.map(k => [k, G[k].n, G[k].tg, aiPct(G[k].n, G[k].tg), G[k].na, G[k].cap, G[k].ex]), T = i => aiSum(R, r => r[i]);
    return {
      title: 'Class-wise strength', chart: { label: 0, value: 1, title: 'Strength', fmt: 'num' },
      kpis: { 'Strength': NUM(T(1)), 'Target': NUM(T(2)), 'New admissions': NUM(T(4)), 'Classes': NUM(R.length) },
      cols: [{ h: 'Class', t: 'text' }, { h: 'Strength', t: 'num' }, { h: 'Target', t: 'num' }, { h: 'Achievement %', t: 'pct' }, { h: 'New admissions', t: 'num' }, { h: 'Capacity', t: 'num' }, { h: 'Cancellations + withdrawals', t: 'num' }],
      rows: R.slice(0, aiLim(a, 100)),
      headline: `${NUM(T(1))} students across ${R.length} classes (${PCT(aiPct(T(1), T(2)))} of target).`, bullets: ['Academics coverage is strength and admissions by class; marks, timetables and results are not part of the dashboard data.']
    };
  }
});

aiTool('admissions_trend', {
  domain: 'admissions', mod: 'compare', title: 'Admissions against previous years', drill: ['compare', 'Multi-year comparison'],
  desc: 'Compare a measure for the current academic year with the previous N years (default 3), in total or grouped by zone / region / branch. Use for "compare current admissions with the previous three years".',
  schema: { type: 'object', properties: { metric: { type: 'string', enum: ['new_admissions', 'strength', 'withdrawals', 'cancellations', 'collected', 'outstanding'] }, previous_years: { type: 'integer', description: 'How many earlier years, 1 to 4' }, level: aiGroupSchema } },
  run(a, c) {
    const yrs = yearsList().filter(y => y.status !== 'Upcoming').map(y => y.code), ci = yrs.indexOf(CUR_AY), n = Math.max(1, Math.min(4, +a.previous_years || 3)), use = yrs.slice(Math.max(0, ci - n), ci + 1);
    const m = { new_admissions: ['newAdm', 'New admissions', 'num'], strength: ['strength', 'Strength', 'num'], withdrawals: ['withdrawals', 'Withdrawals', 'num'], cancellations: ['cancellations', 'Cancellations', 'num'], collected: ['collected', 'Fees collected', 'inr'], outstanding: ['outstanding', 'Outstanding fees', 'inr'] }[a.metric || 'new_admissions'] || ['newAdm', 'New admissions', 'num'];
    const lvl = AI_LEVELS.includes(a.level) ? a.level : 'zone', G = {}; c.idx.forEach(i => { const k = aiGroupOf(aiBr(i), lvl), o = G[k] || (G[k] = use.map(() => 0)); use.forEach((y, j) => { const r = yearRow(i, y, c.D); o[j] += r ? +r[m[0]] || 0 : 0; }); });
    const R = Object.entries(G).map(([k, v]) => [k].concat(v)).sort((x, y) => y[y.length - 1] - x[x.length - 1]), tot = use.map((_, j) => aiSum(R, r => r[j + 1])), cur = tot[tot.length - 1], prev = tot[tot.length - 2];
    const fm = v => m[2] === 'inr' ? INRS(v) : NUM(v);
    return {
      title: `${m[1]}: ${use[use.length - 1]} against the previous ${use.length - 1} year${use.length > 2 ? 's' : ''}`, period: use.join(', '),
      kpis: Object.fromEntries(use.map((y, j) => [y + (y === CUR_AY ? ' (to date)' : ''), fm(tot[j])])),
      chart: { label: 0, series: use.map((_, j) => j + 1), seriesNames: use, title: m[1], fmt: m[2] },
      cols: [{ h: aiLevelName(lvl), t: 'text' }].concat(use.map(y => ({ h: y, t: m[2] }))).concat([{ h: 'Change vs last year', t: 'pct' }]),
      rows: R.map(r => r.concat([aiPct(r[r.length - 1] - r[r.length - 2], r[r.length - 2])])).concat([['Total'].concat(tot, [aiPct(cur - prev, prev)])]),
      headline: `${m[1]} are ${fm(cur)} in ${use[use.length - 1]} (to ${dLabel(c.D)}) against ${use.slice(0, -1).map((y, j) => `${fm(tot[j])} in ${y}`).reverse().join(', ')}.`,
      bullets: [`${use[use.length - 1]} is the running year; earlier years are complete, so volume comparisons favour the closed years until this year ends.`]
    };
  }
});

aiTool('inventory_low_stock', {
  domain: 'purchase', mod: 'pr_store', title: 'Inventory at or below reorder level', drill: ['pr_store', 'Store & inventory'],
  desc: 'Stock items at or below their reorder level in the central store and in branch stores in scope.',
  schema: { type: 'object', properties: { limit: { type: 'integer' } } },
  run(a, c) {
    const ST = PT().stock || {}, items = PM().items || [], R = [];
    Object.entries(ST).forEach(([sid, m]) => { const bid = pcStore(sid).branch || ''; if (!aiSeen(c, bid)) return; items.filter(i => i.active !== false && (i.reorder || 0) > 0).forEach(i => { const q = m[i.id] || 0; if (q <= i.reorder) R.push([sid === 'CS' ? 'Central store' : aiBid(bid), i.code, i.name, i.uom, q, i.reorder, i.max || 0, Math.max(0, (i.max || 0) - q) * (i.rate || 0)]); }); });
    R.sort((x, y) => (x[4] - x[5]) - (y[4] - y[5]));
    return {
      title: 'Inventory at or below reorder level',
      kpis: { 'Items to reorder': NUM(R.length), 'Out of stock': NUM(R.filter(r => r[4] === 0).length), 'Value to restock to maximum': INRS(aiSum(R, r => r[7])) },
      cols: [{ h: 'Store', t: 'text' }, { h: 'Item code', t: 'text' }, { h: 'Item', t: 'text' }, { h: 'Unit', t: 'text' }, { h: 'On hand', t: 'num' }, { h: 'Reorder level', t: 'num' }, { h: 'Maximum', t: 'num' }, { h: 'Cost to restock to maximum', t: 'inr' }],
      rows: R.slice(0, aiLim(a, 100)),
      headline: R.length ? `${NUM(R.length)} stock lines are at or below reorder level (${NUM(R.filter(r => r[4] === 0).length)} out of stock); restocking to maximum would cost about ${INRS(aiSum(R, r => r[7]))}.` : 'No stock line is at or below its reorder level.', bullets: []
    };
  }
});
