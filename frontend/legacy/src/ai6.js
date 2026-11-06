/* ===== AI Assistant, part 5: legal & compliance, bank reconciliation, administration tools; closest-match search and screen finder for any other question ===== */
aiTool('legal_compliance', {
  domain: 'legal', mod: 'lc_home', title: 'Legal documents and compliance', noFilter: true, drill: ['lc_home', 'Legal Documents & Compliance'],
  desc: 'Status of legal documents, licences, registrations, renewals and compliance filings: current, due soon, expired / overdue, needs review, with the items that need action first.',
  schema: { type: 'object', properties: { status: { type: 'string', description: 'Only this status, e.g. Expired, Due Soon, Needs Review' }, limit: { type: 'integer' } } },
  calc: 'Compliance % = applicable requirements that are valid, on record, renewed or submitted ÷ all applicable requirements. Days = expiry date − dashboard date.',
  run(a, c) {
    try { lcRun(); } catch (e) { }
    const I = lcItems().filter(i => lcVisible(i)), A = I.filter(i => i.applic === 'Applicable'), st = {}; A.forEach(i => { const s = lcStatus(i); st[s] = (st[s] || 0) + 1; });
    const ok = A.filter(i => ['Valid', 'On record', 'Renewed', 'Submitted'].includes(lcStatus(i))).length, act = A.filter(i => !['Valid', 'On record', 'Renewed', 'Submitted', 'Not Applicable'].includes(lcStatus(i)));
    const want = String(a.status || '').toLowerCase(), L = (want ? A.filter(i => lcStatus(i).toLowerCase().includes(want)) : act).sort((x, y) => (lcDue(x) || '9999').localeCompare(lcDue(y) || '9999'));
    return { title: want ? `Legal items: ${a.status}` : 'Legal and compliance items needing action', period: 'as on ' + dLabel(c.D),
      kpis: Object.assign({ 'Compliance': PCT(aiPct(ok, A.length)), 'Applicable items': NUM(A.length) }, Object.fromEntries(Object.entries(st).sort((p, q) => q[1] - p[1]).slice(0, 4).map(([k, v]) => [k, NUM(v)]))),
      cols: [{ h: 'Requirement', t: 'text' }, { h: 'Institution / unit', t: 'text' }, { h: 'Ref. no.', t: 'text' }, { h: 'Expiry / due', t: 'text' }, { h: 'Days', t: 'num' }, { h: 'Status', t: 'text' }, { h: 'Owner', t: 'text' }],
      rows: L.slice(0, aiLim(a, 100)).map(i => [i.name, (lcU(i.unit) || {}).name || '', i.refNo || '—', lcDue(i) || '—', lcDue(i) ? lcDays(lcDue(i)) : 0, lcStatus(i), i.owner || '']),
      headline: `Compliance is ${PCT(aiPct(ok, A.length))} (${NUM(ok)} of ${NUM(A.length)} applicable items current). ${NUM(L.length)} item${L.length === 1 ? '' : 's'} ${want ? 'are ' + a.status : 'need action'}${L[0] ? `; the earliest is ${L[0].name} (${lcDue(L[0]) || 'no date'}).` : '.'}`, bullets: ['Dates not yet verified by Legal are flagged on the Legal Document Register.'] };
  }
});
aiTool('bank_recon_status', {
  domain: 'bank', mod: 'br_home', title: 'Bank reconciliation status', noFilter: true, drill: ['br_home', 'Reconciliation dashboard'],
  desc: 'Bank reconciliation progress for each bank account: statement lines reconciled %, unmatched items, cheques not yet presented and deposits in transit.',
  schema: { type: 'object', properties: { limit: { type: 'integer' } } },
  calc: 'Reconciled % = statement lines matched / reconciled / approved ÷ all statement lines for the account up to the dashboard date.',
  run(a, c) {
    if (!c.all) return { error: 'Bank accounts are group-level and are only available to users with all-branch scope.', blocked: true };
    const asOf = PROC_TODAY, R = BKM().accounts.filter(x => x.status === 'Active').map(x => { const r = bkBrs(x.gl, asOf), S = r.S, done = S.filter(l => ['Reconciled', 'Matched', 'Approved', 'Interest', 'Bank Charges'].includes(l.status)).length; return [x.bank + ' · ' + x.gl, S.length, done, aiPct(done, S.length || 1), r.unm.length, r.unm.reduce((s, l) => s + l.cr + l.dr, 0), r.unpresented, r.inTransit]; });
    const T = i => aiSum(R, r => r[i]);
    return { title: 'Bank reconciliation status', period: 'as on ' + dLabel(c.D), kpis: { 'Bank accounts': NUM(R.length), 'Statement lines': NUM(T(1)), 'Reconciled': PCT(aiPct(T(2), T(1) || 1)), 'Unmatched lines': NUM(T(4)), 'Unmatched amount': INRS(T(5)) },
      cols: [{ h: 'Bank account', t: 'text' }, { h: 'Statement lines', t: 'num' }, { h: 'Reconciled', t: 'num' }, { h: 'Reconciled %', t: 'pct' }, { h: 'Unmatched lines', t: 'num' }, { h: 'Unmatched amount', t: 'inr' }, { h: 'Cheques not presented', t: 'inr' }, { h: 'Deposits in transit', t: 'inr' }],
      rows: R.slice(0, aiLim(a, 50)), headline: `${NUM(T(2))} of ${NUM(T(1))} statement lines are reconciled (${PCT(aiPct(T(2), T(1) || 1))}); ${NUM(T(4))} lines worth ${INRS(T(5))} are unmatched across ${R.length} bank accounts.`, bullets: [] };
  }
});
aiTool('admin_overview', {
  domain: 'admin', mod: 'admin_users', title: 'Users, roles and access requests', noFilter: true, drill: ['admin_users', 'Users'],
  desc: 'System administration overview: number of users by status and by role, locked accounts, accounts pending activation and pending access requests. No passwords or personal contact details.',
  schema: { type: 'object', properties: { limit: { type: 'integer' } } },
  run(a, c) {
    const U = users(), by = {}; U.forEach(u => { const o = by[u.role] || (by[u.role] = { n: 0, act: 0 }); o.n++; if (u.status === 'Active') o.act++; });
    const st = s => U.filter(u => u.status === s).length, req = ((Store.get('accessreq') || {}).list || []).filter(r => /Pending/i.test(r.status)).length;
    return { title: 'Users, roles and access requests', period: 'as on ' + dLabel(c.D), kpis: { 'Users': NUM(U.length), 'Active': NUM(st('Active')), 'Pending activation': NUM(st('Pending Activation')), 'Locked': NUM(st('Locked')), 'Inactive / resigned': NUM(st('Inactive') + st('Resigned')), 'Access requests pending': NUM(req) },
      cols: [{ h: 'Role', t: 'text' }, { h: 'Users', t: 'num' }, { h: 'Active', t: 'num' }], rows: Object.entries(by).sort((x, y) => y[1].n - x[1].n).slice(0, aiLim(a, 60)).map(([k, o]) => [k, o.n, o.act]),
      headline: `${NUM(U.length)} user accounts: ${NUM(st('Active'))} active, ${NUM(st('Pending Activation'))} awaiting activation, ${NUM(st('Locked'))} locked; ${NUM(req)} access request${req === 1 ? '' : 's'} pending approval.`, bullets: [] };
  }
});

/* ---------- any other question: closest report by meaning, then the screens that hold the data ---------- */
const AI_STOP = new Set('the and for are was were what which who how many much show give list get tell please all any with from that this have has had your our into out about between over under than then them they their there here where when why does did can could would should will shall report reports data details detail information info want need like see view display give prepare make generate full complete overall total'.split(' '));
const aiStem = w => w.replace(/(ing|ed|es|s|wise|ly)$/, '');
const aiTok = q => [...new Set(aiNorm(aiLex(q)).split(' ').filter(w => w.length > 2 && !AI_STOP.has(w)).map(aiStem).filter(w => w.length > 2))];
function aiFuzzy(q) {
  const T = aiTok(q); if (!T.length) return null; const cfg = aiCfg(); let best = null, second = 0;
  Object.values(AI_T).forEach(t => {
    if (!can(t.mod, 'View') && !(t.alt || []).some(m => can(m, 'View'))) return; if (cfg.domains[t.domain] === false || cfg.tools[t.name] === false) return;
    const bag = ' ' + [t.title, t.desc, t.kw || '', AI_DOMAINS[t.domain] || '', MODLABEL(t.mod)].join(' ').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ') + ' ', title = (' ' + String(t.title || '').toLowerCase() + ' ');
    let sc = 0; T.forEach(w => { if (bag.includes(' ' + w) ) sc += title.includes(w) ? 2 : 1; }); if (!best || sc > best.sc) { second = best ? best.sc : 0; best = { t, sc }; } else if (sc > second) second = sc;
  });
  return best && best.sc >= 3 && best.sc > second ? best.t.name : null;
}
function aiScreens(q) {
  const T = aiTok(q); if (!T.length) return []; const out = [];
  NAV.forEach(([group, items]) => items.forEach(([route, label]) => { if (!PAGES[route] || !pageOk(route)) return; const text = (' ' + group + ' ' + label + ' ').toLowerCase().replace(/[^a-z0-9 ]+/g, ' '); let sc = 0; T.forEach(w => { if (text.includes(' ' + w)) sc += label.toLowerCase().includes(w) ? 2 : 1; }); if (sc) out.push({ route, label, group, sc }); }));
  return out.sort((a, b) => b.sc - a.sc).slice(0, 6);
}
AI_ACT.aiGoScreen = t => { App.ui.aiOpen = false; go(t.dataset.k); };
