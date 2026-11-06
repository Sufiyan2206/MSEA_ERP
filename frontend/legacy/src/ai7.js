/* ===== AI Assistant, part 6: statutory deductions, HR workflow counts, trial balance, GRN, ERP sync status ===== */
aiTool('statutory_deductions', {
  domain: 'payroll', mod: 'py_reports', title: 'PF, ESI, TDS and professional tax', drill: ['py_reports', 'Payroll reports'],
  desc: 'Statutory payroll deductions by month: employee PF, employer PF, employee ESI, employer ESI, professional tax and TDS deducted in each payroll run. Totals only.',
  schema: { type: 'object', properties: { limit: { type: 'integer' } } },
  calc: 'Taken straight from the totals of each processed payroll run (sum of the employee-wise statutory lines).',
  run(a, c) {
    if (!c.all) return { error: 'Payroll runs are group-level figures and are only available to users with all-branch scope.', blocked: true };
    const R = (Store.get('payroll').runs || []).filter(r => r.totals).sort((x, y) => y.ym.localeCompare(x.ym)), T = r => r.totals;
    if (!R.length) return { error: 'No payroll run has been processed yet, so there are no statutory deductions to report.' };
    const L = R[0];
    return { title: 'Statutory deductions by payroll month', kpis: { 'PF (employee)': INRS(T(L).pf || 0), 'PF (employer)': INRS(T(L).pfEr || 0), 'ESI (employee + employer)': INRS((T(L).esi || 0) + (T(L).esiEr || 0)), 'TDS': INRS(T(L).tds || 0), 'Professional tax': INRS(T(L).pt || 0) },
      cols: [{ h: 'Month', t: 'text' }, { h: 'Status', t: 'text' }, { h: 'PF – employee', t: 'inr' }, { h: 'PF – employer', t: 'inr' }, { h: 'ESI – employee', t: 'inr' }, { h: 'ESI – employer', t: 'inr' }, { h: 'Professional tax', t: 'inr' }, { h: 'TDS', t: 'inr' }],
      rows: R.slice(0, aiLim(a, 12)).map(r => [aiYm(r.ym), r.status, T(r).pf || 0, T(r).pfEr || 0, T(r).esi || 0, T(r).esiEr || 0, T(r).pt || 0, T(r).tds || 0]),
      headline: `For ${aiYm(L.ym)} (${L.status}): PF ${INRS(T(L).pf || 0)} employee and ${INRS(T(L).pfEr || 0)} employer, ESI ${INRS((T(L).esi || 0) + (T(L).esiEr || 0))}, TDS ${INRS(T(L).tds || 0)}.`, bullets: [] };
  }
});
aiTool('hr_workflow', {
  domain: 'hr', mod: 'hr_home', title: 'HR workflow status', drill: ['hr_home', 'HR dashboard'],
  desc: 'HR workflow counts: interviews scheduled, offers released or pending, training programmes, grievances open, new joiners and staff birthdays this month. Counts by status; grievance text is never shown.',
  schema: { type: 'object', properties: { view: { type: 'string', enum: ['interviews', 'offers', 'training', 'grievances', 'joiners', 'birthdays'] }, limit: { type: 'integer' } } },
  run(a, c) {
    const sc = hrScope(App.user), T = HRT(), E = hrEmps().filter(e => sc.has(e.bid || '') && aiSeen(c, e.bid)), ids = new Set(E.map(e => e.id)), v = a.view || 'interviews';
    const cnt = (L, f) => { const o = {}; L.forEach(x => { const k = f(x) || '—'; o[k] = (o[k] || 0) + 1; }); return Object.entries(o).sort((x, y) => y[1] - x[1]); };
    const two = (title, L, lab, h) => ({ title, cols: [{ h: lab, t: 'text' }, { h: 'Count', t: 'num' }], rows: L, headline: h, bullets: [] });
    const dIso = PROC_TODAY, ym = dIso.slice(0, 7), mm = dIso.slice(5, 7);
    if (v === 'interviews') { const I = (T.interviews || []), up = I.filter(i => (i.date || '') >= dIso); return { title: 'Interviews', cols: [{ h: 'Date', t: 'text' }, { h: 'Time', t: 'text' }, { h: 'Mode', t: 'text' }, { h: 'Status', t: 'text' }], rows: up.sort((x, y) => (x.date || '').localeCompare(y.date || '')).slice(0, aiLim(a, 50)).map(i => [i.date, i.time || '', i.mode || '', i.status || 'Scheduled']), headline: `${NUM(up.length)} interview${up.length === 1 ? ' is' : 's are'} scheduled from ${dLabel(c.D)} onward (${NUM(I.length)} on record in total).`, bullets: [], noModelRows: true }; }
    if (v === 'offers') { const O = (T.offers || []).filter(o => aiSeen(c, o.bid)); return two('Offers by status', cnt(O, o => o.status), 'Status', `${NUM(O.length)} offers on record; ${NUM(O.filter(o => o.status === 'Released').length)} released and awaiting acceptance.`); }
    if (v === 'training') { const R = (T.trainings || []); return { title: 'Training programmes', cols: [{ h: 'Programme', t: 'text' }, { h: 'Date', t: 'text' }, { h: 'Hours', t: 'num' }, { h: 'Status', t: 'text' }, { h: 'Mandatory', t: 'text' }], rows: R.slice().sort((x, y) => (x.date || '').localeCompare(y.date || '')).slice(0, aiLim(a, 50)).map(t => [t.name, t.date, t.hours || 0, t.status, t.mandatory ? 'Yes' : 'No']), headline: `${NUM(R.length)} training programmes: ${NUM(R.filter(t => t.status === 'Scheduled').length)} scheduled and ${NUM(R.filter(t => t.status === 'Completed').length)} completed.`, bullets: [] }; }
    if (v === 'grievances') { const G = (T.grievances || []).filter(g => ids.has(g.emp)); return two('Grievances by status', cnt(G, g => g.status), 'Status', `${NUM(G.filter(g => !/Closed|Resolved/.test(g.status)).length)} grievances are open out of ${NUM(G.length)}. Details are confidential and not shown here.`); }
    const L = E.filter(e => v === 'joiners' ? (e.doj || '').slice(0, 7) === ym : (e.dob || '').slice(5, 7) === mm && e.status !== 'Exited');
    return { title: v === 'joiners' ? 'New joiners this month' : 'Staff birthdays this month', sensitive: true, noModelRows: true, cols: [{ h: 'Branch', t: 'text' }, { h: 'Count', t: 'num' }], rows: cnt(L, e => aiBid(e.bid)).slice(0, aiLim(a, 100)), headline: `${NUM(L.length)} ${v === 'joiners' ? (L.length === 1 ? 'employee joined' : 'employees joined') : (L.length === 1 ? 'staff member has a birthday' : 'staff have birthdays')} in ${aiYm(ym)}.`, bullets: [] };
  }
});
aiTool('trial_balance', {
  domain: 'finance', mod: 'fn_gl', title: 'Trial balance', noFilter: true, drill: ['fn_gl', 'General Ledger'],
  desc: 'Trial balance from the General Ledger: debit, credit and closing balance for each account up to the dashboard date, with a check that total debits equal total credits.',
  schema: { type: 'object', properties: { limit: { type: 'integer' } } },
  calc: 'Sum of all posted journal lines per account up to the dashboard date. Debits must equal credits.',
  run(a, c) {
    if (!c.all) return { error: 'The trial balance is a group-level statement and is available to users with all-branch scope.', blocked: true };
    const T = fnTrial({ upto: PROC_TODAY }), dr = aiSum(T, r => r.dr), cr = aiSum(T, r => r.cr), diff = Math.round(dr - cr);
    return { title: 'Trial balance', period: 'up to ' + dLabel(c.D), kpis: { 'Total debit': INRS(dr), 'Total credit': INRS(cr), 'Difference': INRS(diff), 'Accounts': NUM(T.length) },
      cols: [{ h: 'Code', t: 'text' }, { h: 'Account', t: 'text' }, { h: 'Debit', t: 'inr' }, { h: 'Credit', t: 'inr' }, { h: 'Balance', t: 'inr' }], rows: T.slice(0, aiLim(a, 100)).map(r => [r.gl.code, r.gl.name, r.dr, r.cr, r.bal]),
      headline: diff === 0 ? `The trial balance agrees: debits and credits are both ${INRS(dr)} across ${NUM(T.length)} accounts.` : `The trial balance does NOT agree: debits ${INRS(dr)} against credits ${INRS(cr)} (difference ${INRS(diff)}).`, bullets: [], warnings: diff === 0 ? [] : ['Debits and credits differ; review the General Ledger.'] };
  }
});
aiTool('grn_status', {
  domain: 'purchase', mod: 'pr_home', title: 'Goods received notes', drill: ['pr_home', 'Store & purchase dashboard'],
  desc: 'Goods received notes (GRN) by status, with those not yet posted or awaiting invoice matching, by branch.',
  schema: { type: 'object', properties: { limit: { type: 'integer' } } },
  run(a, c) {
    const G = (PT().grn || []).filter(g => { const b = g.branch || g.bid; return (b === 'CORP' || !b) ? c.all : aiSeen(c, b) && pcScopeBr().has(b); }), o = {}; G.forEach(g => { const k = g.status || '—'; o[k] = (o[k] || 0) + 1; });
    const pend = G.filter(g => g.status !== 'Posted'), R = Object.entries(o).sort((x, y) => y[1] - x[1]);
    return { title: 'Goods received notes by status', cols: [{ h: 'Status', t: 'text' }, { h: 'GRNs', t: 'num' }], rows: R, headline: `${NUM(G.length)} GRNs in scope; ${NUM(pend.length)} are not yet posted to the ledger.`, bullets: [] };
  }
});
aiTool('sync_status', {
  domain: 'admin', mod: 'ai_chat', title: 'ERP data sync status', noFilter: true, drill: ['ai_chat', 'AI Assistant'],
  desc: 'When the ERP data was last synchronised, the latest sync runs and any failed runs, so you know how current the figures are.',
  schema: { type: 'object', properties: { limit: { type: 'integer' } } },
  run(a, c) {
    const S = Store.get('sync') || {}, runs = S.runs || [], bad = runs.filter(r => r.status && r.status !== 'Success');
    return { title: 'ERP data sync status', period: 'as on ' + dLabel(c.D), kpis: { 'Last successful sync': aiSyncLabel(), 'Recent runs': NUM(runs.length), 'Failed runs': NUM(bad.length) },
      cols: [{ h: 'Run time', t: 'text' }, { h: 'Status', t: 'text' }, { h: 'Detail', t: 'text' }], rows: runs.slice(0, aiLim(a, 20)).map(r => [tsLabel(r.at), r.status || '—', String(r.message || r.note || r.error || '')]),
      headline: `The last successful ERP sync was ${aiSyncLabel()}; ${NUM(bad.length)} of the ${NUM(runs.length)} recent runs did not succeed.`, bullets: [] };
  }
});
aiTool('student_profile_gaps', {
  domain: 'admissions', mod: 'sis', title: 'Student profile completeness', drill: ['sis', 'Student information system'],
  desc: 'How complete student profiles are in the Student Information System, by branch: missing APAAR, PEN / UDISE student ID, date of birth, ID proof, address, emergency contact and verified documents. Counts only, no student names.',
  schema: { type: 'object', properties: { limit: { type: 'integer' } } },
  calc: 'Profile % = required items present ÷ required items (gender, date of birth, PEN, APAAR, ID proof digits, address, emergency contact name and mobile, blood group, parent mobile, verified birth certificate, photograph and ID proof copy), per active student.',
  run(a, c) {
    const L = Str.list(c.D, c.idx), by = {}, gaps = {};
    L.forEach(x => { const sc = sisScore(x.s), b = DATA.branches[x.s.b].name, o = by[b] || (by[b] = { n: 0, sum: 0, apaar: 0, pen: 0 }); o.n++; o.sum += sc.pct; if (!sisP(x.s.adm).apaar) o.apaar++; if (!sisP(x.s.adm).pen) o.pen++; sc.miss.forEach(m => gaps[m] = (gaps[m] || 0) + 1); });
    const R = Object.entries(by).map(([b, o]) => [b, o.n, Math.round(o.sum / o.n), o.apaar, o.pen]).sort((x, y) => x[2] - y[2]), n = aiSum(R, r => r[1]), top = Object.entries(gaps).sort((x, y) => y[1] - x[1])[0];
    return { title: 'Student profile completeness by branch', cols: [{ h: 'Branch', t: 'text' }, { h: 'Active students', t: 'num' }, { h: 'Average complete %', t: 'num' }, { h: 'Missing APAAR', t: 'num' }, { h: 'Missing PEN / UDISE ID', t: 'num' }],
      rows: R.slice(0, aiLim(a, 100)), kpis: { 'Active students': NUM(n), 'Average complete': n ? Math.round(aiSum(R, r => r[2] * r[1]) / n) + '%' : '—', 'Missing APAAR': NUM(aiSum(R, r => r[3])) },
      headline: n ? `Student profiles are ${Math.round(aiSum(R, r => r[2] * r[1]) / n)}% complete on average across ${NUM(n)} active students; ${NUM(aiSum(R, r => r[3]))} have no APAAR ID. The most common gap is ${top ? top[0].replace(/aadhaar/ig, 'ID proof') : '—'}.` : 'No students in scope.', bullets: [] };
  }
});
aiTool('academic_status', {
  domain: 'admissions', mod: 'acad', title: 'Academic planning status', drill: ['acad', 'Academic management'],
  desc: 'Academic planning by branch: syllabus units planned, completed and delayed, lesson plans awaiting approval, teachers over the weekly workload limit, sections without subject allocation and timetable fill.',
  schema: { type: 'object', properties: { limit: { type: 'integer' } } },
  calc: 'A syllabus unit is delayed when its completion is behind the planned timeline by the configured points, or its planned end date has passed. Timetable fill = periods placed ÷ (sections × working days × periods per day).',
  run(a, c) {
    const D = acD(), R = c.idx.map(i => DATA.branches[i]).map(b => { const T = acTeachers(b.id), S = acSections(b.id), al = D.alloc.filter(x => x.bid === b.id), U = D.units.filter(u => u.bid === b.id).map(u => acUnitState(u)), slots = Object.values(D.tt[b.id] || {}).reduce((n, g) => n + Object.keys(g).length, 0), need = S.length * D.cfg.days.length * D.cfg.periods; return [b.name, T.length, S.length - new Set(al.map(x => acSecKey(x.cls, x.sec))).size, T.filter(e => acLoad(D, e.id) > D.cfg.maxLoad).length, need ? Math.round(slots / need * 100) : 0, U.length, U.filter(x => x.late).length, D.plans.filter(p => p.bid === b.id && p.state === 'Submitted').length]; }).sort((x, y) => y[6] - x[6]);
    const t = i => aiSum(R, r => r[i]);
    return { title: 'Academic planning status by branch', kpis: { 'Syllabus units': NUM(t(5)), 'Delayed units': NUM(t(6)), 'Plans awaiting approval': NUM(t(7)), 'Sections without allocation': NUM(t(2)) },
      cols: [{ h: 'Branch', t: 'text' }, { h: 'Teachers', t: 'num' }, { h: 'Sections without allocation', t: 'num' }, { h: 'Teachers over limit', t: 'num' }, { h: 'Timetable filled %', t: 'num' }, { h: 'Syllabus units', t: 'num' }, { h: 'Delayed units', t: 'num' }, { h: 'Plans awaiting approval', t: 'num' }], rows: R.slice(0, aiLim(a, 100)),
      headline: t(5) ? `${NUM(t(6))} of ${NUM(t(5))} planned syllabus units are delayed; ${NUM(t(7))} lesson plans await approval and ${NUM(t(2))} sections have no subject allocation.` : `No syllabus units have been planned yet; ${NUM(t(2))} sections have no subject allocation across ${R.length} branches.`, bullets: [] };
  }
});
aiTool('learning_status', {
  domain: 'admissions', mod: 'lms', title: 'Learning activity status', drill: ['lms', 'Learning management'],
  desc: 'Learning activity by branch: homework assigned and average submission %, tests published with average score, approved questions, questions awaiting approval and learning resources. Class totals only, no student names.',
  schema: { type: 'object', properties: { limit: { type: 'integer' } } },
  calc: 'Submission % = students who submitted (on time or late) ÷ students in the section excluding excused. Test average = mean of students\' marks ÷ maximum marks, absentees excluded.',
  run(a, c) {
    const D = lmD(), R = c.idx.map(i => DATA.branches[i]).map(b => { const H = D.hw.filter(h => h.bid === b.id).map(h => lmHwStats(h)), T = D.tests.filter(t => t.bid === b.id && ['Marked', 'Published'].includes(t.state)).map(t => lmTestStats(t)); return [b.name, H.length, H.length ? Math.round(H.reduce((s, x) => s + x.pct, 0) / H.length) : 0, D.tests.filter(t => t.bid === b.id && t.state === 'Published').length, T.length ? Math.round(T.reduce((s, x) => s + x.avg, 0) / T.length) : 0, D.qb.filter(q => q.bid === b.id && q.state === 'Approved').length, D.qb.filter(q => q.bid === b.id && q.state === 'Draft').length, D.res.filter(r => r.bid === b.id && !r.retired).length]; }).sort((x, y) => x[2] - y[2]), t = i => aiSum(R, r => r[i]);
    return { title: 'Learning activity by branch', kpis: { 'Homework assigned': NUM(t(1)), 'Tests published': NUM(t(3)), 'Questions awaiting approval': NUM(t(6)) },
      cols: [{ h: 'Branch', t: 'text' }, { h: 'Homework', t: 'num' }, { h: 'Avg submission %', t: 'num' }, { h: 'Tests published', t: 'num' }, { h: 'Avg test %', t: 'num' }, { h: 'Approved questions', t: 'num' }, { h: 'Awaiting approval', t: 'num' }, { h: 'Resources', t: 'num' }], rows: R.slice(0, aiLim(a, 100)),
      headline: t(1) || t(3) ? `${NUM(t(1))} homework tasks and ${NUM(t(3))} published tests across ${R.length} branches; ${NUM(t(6))} questions await approval.` : `No homework or tests have been recorded yet across ${R.length} branches.`, bullets: [] };
  }
});
