/* ===== AI Assistant, part 7: semantic engine. Reads any wording as concepts + dimensions + time + order, scores every permitted tool, fills the tool's own arguments from its schema, asks "did you mean" when two are close ===== */
const AI_CONCEPTS = [
  ['money_in', 'collection collected collect receipt receipts received receive revenue income money paid paying payment payments realised realized takings earned fees-received'],
  ['owed', 'outstanding pending dues unpaid receivable arrears owe owes owed overdue defaulter defaulters recovery recoverable'],
  ['admit', 'admission admissions admitted enrolled enrolment enrollment enrol join joined joining intake new-students'],
  ['leave_school', 'cancel cancelled cancellation cancellations withdraw withdrawn withdrawal withdrawals dropout drop-out left discontinued'],
  ['roll', 'strength students student pupils pupil roll headcount seats capacity enrolment-strength'],
  ['presence', 'attendance present absent absentee absentees absenteeism punctual presence turnout punch biometric'],
  ['late', 'late latecomer latecomers delay delayed tardy'],
  ['pay', 'payroll salary salaries wage wages payslip payslips remuneration ctc'],
  ['spend', 'expense expenses expenditure spend spending spent cost costs outflow overspend overspent'],
  ['plan', 'budget budgets budgeted target targets goal goals plan planned allocation'],
  ['profit', 'profit loss surplus deficit margin p&l pnl earnings cashflow cash-flow'],
  ['staff', 'staff employee employees teacher teachers faculty personnel workforce manpower hr'],
  ['recruit', 'recruitment vacancy vacancies candidate candidates hiring interview interviews offer offers applicant applicants'],
  ['purchase', 'purchase purchases procurement requisition requisitions vendor vendors supplier suppliers po order orders buying'],
  ['stock', 'stock inventory store items material materials reorder consumables'],
  ['asset', 'asset assets equipment furniture warranty amc depreciation machinery'],
  ['repair', 'maintenance repair repairs ticket tickets breakdown complaint complaints workorder helpdesk fault faults'],
  ['legal', 'legal licence license licences compliance noc affiliation registration court case cases renewal expiry expiring expired certificate'],
  ['bank', 'bank banks reconciliation reconcile reconciled unmatched statement cheque cheques deposit'],
  ['utility', 'utility utilities electricity electric water rent lease internet bill bills'],
  ['enquiry', 'enquiry enquiries inquiry inquiries lead leads crm funnel conversion conversions prospect prospects walk-in walkin'],
  ['concession', 'concession concessions scholarship scholarships discount discounts waiver waivers'],
  ['user_admin', 'user users login logins role roles access permission permissions'],
  ['summary', 'summary overview snapshot brief highlights digest picture'],
  ['risk', 'risk risks attention alert alerts exception exceptions concern concerns problem problems'],
  ['behind', 'lagging lag behind shortfall short missing underperforming underperform miss misses missed'],
  ['sync', 'sync synchronised synchronized synchronization erp refresh updated']
];
const AI_TIME = { today: /\b(today|todays|now|currently|current)\b/, yesterday: /\byesterday\b/, week: /\b(this week|weekly|last 7 days|past week|week)\b/, month: /\b(this month|monthly|month so far|mtd|month)\b/, year: /\b(this year|yearly|annual|academic year|year to date|ytd|financial year|fy)\b/ };
let AI_CMAP = null, AI_DF = null;
function aiCanon() {
  if (AI_CMAP) return AI_CMAP; AI_CMAP = {};
  AI_CONCEPTS.forEach(([c, ws]) => ws.split(' ').forEach(w => { w.split('-').forEach(p => { if (p.length > 2) AI_CMAP[aiStem(p)] = c; }); AI_CMAP[aiStem(w.replace(/-/g, ''))] = c; }));
  return AI_CMAP;
}
const aiConcepts = txt => { const M = aiCanon(), out = {}; aiNorm(aiLex(txt)).split(' ').forEach(w => { const s = aiStem(w); if (M[s]) out[M[s]] = (out[M[s]] || 0) + 1; }); return out; };
function aiToolConcepts() {
  const n = Object.keys(AI_T).length; if (AI_DF && AI_DF.n === n) return AI_DF; const df = {}, by = {};
  Object.values(AI_T).forEach(t => { const title = aiConcepts([t.title, t.kw || '', t.name.replace(/_/g, ' ')].join(' ')), desc = aiConcepts(t.desc || ''), m = {}; Object.keys(title).forEach(c => m[c] = 3); Object.keys(desc).forEach(c => { if (!m[c]) m[c] = 1.5; }); by[t.name] = m; Object.keys(m).forEach(c => df[c] = (df[c] || 0) + 1); });
  return AI_DF = { n, df, by };
}
/* fill a tool's arguments from its own schema using the wording of the question */
function aiSemArgs(t, q, s, limit, order) {
  const props = ((t.schema || {}).properties) || {}, a = {}, stems = new Set(aiNorm(q).split(' ').map(aiStem));
  Object.entries(props).forEach(([k, p]) => {
    if (k === 'limit' && limit) a.limit = limit;
    else if (k === 'top' && limit) a.top = limit;
    else if (k === 'order' && p.enum) a.order = order;
    else if (k === 'days') { const d = (s.match(/(?:last|past)\s+(\d+)\s+days/) || s.match(/(\d+)\s*days?/) || [])[1]; if (d) a.days = +d; }
    else if (k === 'below_pct') { const d = (s.match(/(?:below|under|less than)\s+(\d{1,3})\s*%/) || [])[1]; if (d) a.below_pct = +d; }
    else if (k === 'period' && p.enum) { const f = p.enum.find(v => /today/.test(v) && AI_TIME.today.test(s)) || (AI_TIME.week.test(s) && p.enum.find(v => /week/.test(v))) || (AI_TIME.year.test(s) && p.enum.find(v => /year/.test(v))) || (AI_TIME.month.test(s) && p.enum.find(v => /month/.test(v))); if (f) a.period = f; }
    else if (p.enum) {
      const hit = p.enum.filter(v => { const parts = String(v).split(/[_\s-]+/).map(aiStem).filter(x => x.length > 1); return parts.length && parts.every(x => stems.has(x)); });
      if (hit.length === 1) a[k] = hit[0];
      else if (/level|by/.test(k)) { const wise = (s.match(/\b(\w+)[- ]?wise\b/) || s.match(/\bby (\w+)/) || s.match(/\bper (\w+)/) || [])[1]; const m = wise && p.enum.find(v => aiStem(v) === aiStem(wise) || (wise === 'director' && v === 'rd')); if (m) a[k] = m; }
    } else if (k === 'status' && p.type === 'string') { const m = s.match(/\b(expired|overdue|due soon|late|absent|on leave|half day)\b/); if (m) a.status = m[1].replace(/^./, x => x.toUpperCase()); }
  });
  return a;
}
function aiSemantic(q0, place, limit, order) {
  const q = aiLex(q0), s = ' ' + q.toLowerCase().replace(/[^a-z0-9%&\/ -]+/g, ' ') + ' ', qc = aiConcepts(q); if (!Object.keys(qc).length) return null;
  const { df, by } = aiToolConcepts(), cfg = aiCfg(), N = Object.keys(AI_T).length, sc = [];
  Object.values(AI_T).forEach(t => {
    if (!can(t.mod, 'View') && !(t.alt || []).some(m => can(m, 'View'))) return; if (cfg.domains[t.domain] === false || cfg.tools[t.name] === false) return;
    const m = by[t.name] || {}; let v = 0, hits = 0; Object.keys(qc).forEach(c => { if (m[c]) { v += m[c] * (1 + Math.log(N / (df[c] || 1)) / 3); hits++; } });
    /* concepts the question does not mention but the tool is mostly about count slightly against it */
    const own = Object.keys(m).filter(c => m[c] === 3).length; if (hits) v = v * (0.7 + 0.3 * Math.min(1, hits / Math.max(1, own)));
    if (v > 0) sc.push({ t, v });
  });
  sc.sort((x, y) => y.v - x.v); const b = sc[0]; if (!b || b.v < 3) return null;
  const close = sc.filter(x => x.v >= b.v * 0.8).slice(0, 3), mk = x => ({ tool: x.t.name, args: Object.assign(aiSemArgs(x.t, q, s, limit, order), place || {}) });
  if (close.length > 1 && close.length <= 3 && b.v - sc[1].v < b.v * 0.1 && b.v >= 4.5) return { clarify: { question: 'I found more than one report that could answer this. Which one do you mean?', options: close.map(x => ({ label: x.t.title || x.t.name, q: '@tool:' + x.t.name + ' ' + q0 })) } };
  return [mk(b)];
}

/* explicit concept hints per tool, so the scorer anchors on what each report is really for */
const AI_KW = { daily_collection: 'money received collection today', collection_by_date: 'day by day trend receipts payment', collection_vs_target: 'target goal lagging behind shortfall achievement collection', collection_compare: 'compare month income collection previous', outstanding_fees: 'owe owes arrears dues defaulter outstanding', fees_pending_detail: 'pending dues class student outstanding', zero_payer_students: 'nothing zero paid students fees', admissions_period: 'admission admitted joined new students', admissions_trend: 'admission previous years trend', cancellations: 'cancel withdraw left school', enquiries_conversions: 'enquiry walk-in lead conversion funnel', payroll_vs_budget: 'salary payroll budget plan', payroll_summary: 'payroll salary wages cost', statutory_deductions: 'payroll pf esi tds tax deduction', staff_today: 'staff attendance present absent late today', attendance_shortage: 'attendance shortage low', admin_overview: 'users login accounts roles access', management_summary: 'summary overview picture brief today', attention_branches: 'attention risk worry problem alert', petty_cash: 'petty cash imprest pocket money', sync_status: 'sync erp refresh updated data', budget_vs_actual: 'budget spend overspend expense', top_expenses: 'expense spend largest', profit_and_cash: 'profit loss surplus deficit cash', legal_compliance: 'legal licence compliance expiry', bank_recon_status: 'bank reconciliation unmatched', utilities_overview: 'utility electricity water rent bill', purchase_overview: 'purchase vendor order procurement', inventory_low_stock: 'stock inventory reorder low', assets_overview: 'asset equipment warranty amc', maintenance_pending: 'repair maintenance ticket breakdown', hr_overview: 'staff hr vacancy hiring headcount leave', hr_workflow: 'interview offer training grievance joiner birthday', student_strength: 'students strength enrolment pupils roll seats', class_strength: 'class students strength section', trial_balance: 'trial ledger debit credit', grn_status: 'goods received grn store' };
Object.entries(AI_KW).forEach(([k, v]) => { if (AI_T[k]) AI_T[k].kw = (AI_T[k].kw ? AI_T[k].kw + ' ' : '') + v; });

/* ===== tools on the newer modules: student attendance and cash handover ===== */
aiTool('student_attendance_low', {
  domain: 'hr', mod: 'att', title: 'Students below attendance floor', drill: ['attendance', 'Student attendance'],
  desc: 'Students whose attendance over a period is below a threshold (default the configured floor, usually 75%), by branch or by student. Use for "students below 75% attendance", "low attendance students", "attendance shortage students".',
  schema: { type: 'object', properties: { days: { type: 'number', description: 'Look-back window in days, default 30' }, below_pct: { type: 'number', description: 'Threshold %, default the configured floor' }, by: { type: 'string', description: 'branch (default) or student' } } },
  calc: 'Attendance % = (present + late) ÷ (present + late + absent) × 100 over marked days in the window; excused days are left out. A student with no marked days is not counted.',
  run(a, c) {
    const days = +a.days > 0 ? Math.min(365, +a.days) : 30, from = pcAddDays(PROC_TODAY, -(days - 1)), to = PROC_TODAY, th = +a.below_pct > 0 ? +a.below_pct : (atD().cfg.minPct || 75), by = a.by === 'student' ? 'student' : 'branch';
    if (by === 'student' && aiCfg().sensitive.studentLevel === false) return { error: 'Student-level lists are switched off for the AI Assistant by the System Admin.', blocked: true };
    const bids = DATA.branches.filter(b => aiSeen(c, b.id)).map(b => b.id), R = [];
    bids.forEach(bid => acSections(bid).forEach(s => atSectionRows(bid, s.cls, s.sec, from, to).forEach(r => { if (r.pct != null) R.push(Object.assign({ bid, cls: s.cls, sec: s.sec }, r)); })));
    if (!R.length) return { title: `Students below ${th}% attendance · last ${days} days`, period: `${from} to ${to}`, kpis: { 'Below floor': 0, 'Students marked': 0, 'Floor': th + '%' }, cols: [{ h: 'Branch', t: 'text' }, { h: 'Students marked', t: 'num' }, { h: 'Below floor', t: 'num' }], rows: [], headline: `No student attendance has been marked in the last ${days} days for the branches in view.`, bullets: ['Teachers mark attendance under Academics → Student attendance or the Teacher app.'] };
    const low = R.filter(r => r.pct < th).sort((p, q) => p.pct - q.pct);
    if (by === 'student') return { title: `Students below ${th}% attendance · last ${days} days`, period: `${from} to ${to}`, sensitive: true, noModelRows: true, kpis: { 'Below floor': NUM(low.length), 'Students marked': NUM(R.length), 'Floor': th + '%' }, cols: [{ h: 'Admission no.', t: 'text' }, { h: 'Student', t: 'text' }, { h: 'Branch', t: 'text' }, { h: 'Class', t: 'text' }, { h: 'Days marked', t: 'num' }, { h: 'Absent', t: 'num' }, { h: 'Attendance %', t: 'pct' }], rows: low.slice(0, aiLim(a, 100)).map(r => [r.s.adm, r.s.name, aiBid(r.bid), r.cls + ' ' + r.sec, r.days, r.A, r.pct]), headline: `${NUM(low.length)} of ${NUM(R.length)} students are below ${th}% attendance in the last ${days} days.`, bullets: ['Student rows are visible only to roles with student-level access and are not shared with the AI model.'] };
    const G = {}; R.forEach(r => { const o = G[r.bid] || (G[r.bid] = { n: 0, low: 0, sum: 0 }); o.n++; o.sum += r.pct; if (r.pct < th) o.low++; });
    const rows = Object.entries(G).map(([k, o]) => [aiBid(k), o.n, o.low, aiPct(o.low, o.n), o.sum / o.n]).sort((x, y) => y[3] - x[3]);
    return { title: `Students below ${th}% attendance by branch · last ${days} days`, period: `${from} to ${to}`, kpis: { 'Below floor': NUM(low.length), 'Students marked': NUM(R.length), 'Share below': PCT(aiPct(low.length, R.length)), 'Average attendance': PCT(aiSum(R, r => r.pct) / R.length) }, chart: { label: 0, value: 3, title: '% of students below the floor', fmt: 'pct' }, cols: [{ h: 'Branch', t: 'text' }, { h: 'Students marked', t: 'num' }, { h: 'Below floor', t: 'num' }, { h: '% below', t: 'pct' }, { h: 'Average attendance %', t: 'pct' }], rows: rows.slice(0, aiLim(a, 100)), headline: `${NUM(low.length)} of ${NUM(R.length)} students (${PCT(aiPct(low.length, R.length))}) are below ${th}% attendance in the last ${days} days.`, bullets: ['Ask "low attendance students student-wise" for the names (needs student-level access).'] };
  }
});
aiTool('cash_handover_pending', {
  domain: 'fees', mod: 'cch', title: 'Cash handover and deposit pending', drill: ['cashctl', 'Cash control'],
  desc: 'Branches where cash collected has not been handed over to the head cashier or deposited in the bank as on a day, with the cash control colour (Red = pending past cut-off, Amber = submitted and awaiting verification, Green = verified). Use for "cash handover not done today", "branches with cash pending", "bank deposit pending".',
  schema: { type: 'object', properties: { day: { type: 'string', description: 'YYYY-MM-DD, default today' }, colour: { type: 'string', description: 'Red, Amber, Blue or all (default: Red and Amber)' } } },
  calc: 'Pending cash = cash receipts at the desk up to the day − cash handed over (local branches) or deposited (bank-deposit branches), plus cash in transit. The colour follows the Cash control rules and the branch cut-off time.',
  run(a, c) {
    const day = /^\d{4}-\d{2}-\d{2}$/.test(a.day || '') ? a.day : PROC_TODAY, want = String(a.colour || '').toLowerCase();
    const rows = DATA.branches.filter(b => aiSeen(c, b.id)).map(b => { try { return chRow(b.id, day); } catch (e) { return null; } }).filter(r => r && r.hasCash);
    const sel = rows.filter(r => want === 'all' ? true : want ? r.col.toLowerCase() === want : ['Red', 'Amber'].includes(r.col)).sort((x, y) => (y.pend || 0) - (x.pend || 0));
    if (!rows.length) return { title: `Cash handover / deposit pending · ${day}`, period: day, kpis: { 'Branches with cash': 0, 'Red (pending past cut-off)': 0, 'Amber (awaiting verification)': 0, 'Cash pending': INRS(0) }, cols: [{ h: 'Branch', t: 'text' }, { h: 'Pending', t: 'inr' }], rows: [], headline: `No cash collection is recorded for ${day} in the branches in view.`, bullets: ['Cash receipts come from the Collections desk; handovers and deposits from Cash control.'] };
    const red = rows.filter(r => r.col === 'Red'), amber = rows.filter(r => r.col === 'Amber');
    return { title: `Cash handover / deposit pending · ${day}`, period: day, kpis: { 'Branches with cash': NUM(rows.length), 'Red (pending past cut-off)': NUM(red.length), 'Amber (awaiting verification)': NUM(amber.length), 'Cash pending': INRS(aiSum(sel, r => r.pend || 0)) }, chart: sel.length ? { label: 0, value: 3, title: 'Cash pending by branch', fmt: 'inr' } : undefined, cols: [{ h: 'Branch', t: 'text' }, { h: 'Type', t: 'text' }, { h: 'Cash collected', t: 'inr' }, { h: 'Pending', t: 'inr' }, { h: 'Colour', t: 'text' }, { h: 'Why', t: 'text' }, { h: 'Responsible', t: 'text' }], rows: sel.slice(0, aiLim(a, 100)).map(r => [r.name, r.type, r.cash, r.pend || 0, r.col, r.why, r.resp || r.head || '']), headline: sel.length ? `${NUM(red.length)} branch(es) are red and ${NUM(amber.length)} amber for cash handover on ${day}; ${INRS(aiSum(sel, r => r.pend || 0))} is pending.` : `Every branch with cash on ${day} has handed over or deposited it.`, bullets: ['Red means cash is still with collectors after the branch cut-off; the Principal and Head Cashier are named in Cash control.'] };
  }
});
