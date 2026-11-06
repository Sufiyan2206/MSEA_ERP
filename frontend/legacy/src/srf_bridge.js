/* ===== Bridge between Fee Desk and the SRF (Seat Reservation Fee) incentive module ===== */
const SRF_ROLE_MAP = { 'Super Admin': ['System Admin', 'Corporate Finance', 'Management'], 'Principal': ['Principal'], 'Accounts Executive': ['Accounts'], 'Finance Executive': ['Accounts'], 'Branch Accountant': ['Accounts'], 'HR Officer': ['HR'], 'Corporate Finance': ['Corporate Finance'], 'Finance Manager': ['Corporate Finance', 'Accounts'], 'CFO': ['Corporate Finance', 'Management'], 'System Admin': ['System Admin'], 'Auditor': ['Auditor'], 'Chairman': ['Management'], 'Vice Chairman / VCP': ['Management'], 'CEO': ['Management'], 'Read-Only Management User': ['Management'], 'Regional Director': ['Management'], 'Zonal Director': ['Management'], 'Admissions Head': ['Management'] };
const SRF_AMT = { 'School': 5000 };
/* The SRF incentive scheme applies to Schools only: colleges are outside the module (no receipts, no staff feed, no screens for their Principals) */
const SRF_TYPES = ['School'];
const srfBranch = b => !!b && SRF_TYPES.includes(b.type) && !b.closed;
const SRF_MODE = ['Cash', 'UPI', 'Card', 'Bank transfer', 'Cheque'];
const SRF_SEED_VER = 4; // demo workflow data set; bump when seed() changes so saved workspaces refresh
const SRF_BRIDGE_BR = S => SRF_BRIDGE_BRREF;
let SRF_BRIDGE_BRREF = {};
const SRF_BRIDGE = (() => {
  let X = null, ready = false, saveT = 0, last = {}, savedSubs = {};
  const codeOf = i => DATA.branches[i].id;
  const srfUsers = () => users().filter(u => SRF_ROLE_MAP[u.role]).map(u => { const sc = new Set([...scopeOf(u)].filter(i => srfBranch(DATA.branches[i]))); const all = sc.size === DATA.branches.filter(srfBranch).length;
    return { id: u.id, login: (u.email || '').split('@')[0] || u.id, name: u.name.replace(' (demo)', ''), empId: u.empId, roles: SRF_ROLE_MAP[u.role], scope: all ? { type: 'all', ids: [] } : { type: 'branch', ids: [...sc].map(codeOf) }, status: u.status === 'Active' ? 'Active' : 'Deactivated', reset: false, auth: '', last: u.lastLogin ? isoLabel(u.lastLogin.slice(0, 10)) : '—', fdRole: u.role }; });
  /* SRF academic years follow the central academic-year master (Admin control centre → Targets & instalments) */
  function syncYears(S) { const Y = yearsList(); if (!Y.length) return; const old = Object.fromEntries((S.ays || []).map(y => [y.id, y])); S.ays = Y.map(y => { const id = 'AY' + y.code.slice(0, 4), locked = y.status === 'Closed'; return { id, name: y.code.replace('-', '–'), from: y.start, to: y.end, status: locked ? 'Locked' : 'Open', current: y.code === CUR_AY, lockInfo: locked ? (old[id] && old[id].lockInfo) || { by: 'System Admin', at: y.end, reason: 'Year closed in the academic-year master' } : null }; }); }
  function masters(ctx) {
    X = Object.assign(X || {}, ctx); const { S, BR, BMETA, GEO, CLASSES } = ctx; syncYears(S);
    SRF_BRIDGE_BRREF = BR; Object.keys(BR).forEach(k => delete BR[k]); Object.keys(BMETA).forEach(k => delete BMETA[k]);
    GEO.regions.length = 0; GEO.zones.length = 0;
    const regions = [...new Set(DATA.branches.map(b => b.region))], zones = [...new Set(DATA.branches.map(b => b.zone))];
    regions.forEach((r, i) => GEO.regions.push({ id: 'RG' + (i + 1), name: r }));
    zones.forEach((z, i) => { const b = DATA.branches.find(x => x.zone === z); GEO.zones.push({ id: 'ZN' + (i + 1), name: z, region: GEO.regions.find(r => r.name === b.region).id }); });
    GEO.seq = regions.length + zones.length;
    DATA.branches.filter(srfBranch).forEach(b => { BR[b.id] = b.name; BMETA[b.id] = { zone: GEO.zones.find(z => z.name === b.zone).id, added: '2026-04-01', by: 'ERP master', type: b.type }; });
    const cls = [...new Set(DATA.students.map(s => s.cls))].sort((a, b) => clsRank(a) - clsRank(b)); CLASSES.length = 0; cls.forEach(c => CLASSES.push(c));
    S.users = srfUsers();
    S.cp.newRule.value = BR[Object.keys(BR)[0]];
    S.cp.newUser.branch = Object.keys(BR)[0];
  }
  function feed(ctx) {
    X = Object.assign(X || {}, ctx); const { S, mkEmp, mkAdm, fcRow } = ctx;
    // HRMS staff feed: Principal from the user directory, other designations generated per branch
    const R = E.rng(777), FN = ['Rubeena', 'Alishan', 'Rafia', 'Ishrath', 'Mujeeb', 'Sattar', 'Nazia', 'Farhana', 'Shabana', 'Yasmeen', 'Khadija', 'Ruksana', 'Asma', 'Nasreen', 'Javed', 'Akram', 'Naseer', 'Jameel', 'Parveen', 'Sameena'], LN = ['Khatoon', 'Saba', 'Osman', 'Begum', 'Ahmed', 'Khan', 'Ali', 'Fatima', 'Sultana', 'Hussain', 'Baig', 'Shaikh'];
    const nm = () => FN[Math.floor(R() * FN.length)] + ' ' + LN[Math.floor(R() * LN.length)];
    S.emps = [];
    DATA.branches.forEach((b, bi) => { if (!srfBranch(b)) return;
      const pr = users().find(u => u.role === 'Principal' && u.branch === b.id);
      S.emps.push(mkEmp(pr ? pr.empId : b.id + '-101', pr ? pr.name.replace(' (demo)', '') : 'Principal', 'Principal', b.id));
      let n = 110; const add = (desig, k, att = 'Present') => { for (let i = 0; i < k; i++) S.emps.push(mkEmp(b.id + '-' + (n++), nm(), desig, b.id, att)); };
      add('Counsellor', 2); add('FOE', 1); add('Cashier', 1); add('Security Guard', 2); add('Aya', 2, R() < .15 ? 'Absent' : 'Present');
    });
    // admissions and SRF receipts from the Fee Desk student ledger
    S.adms = []; S.fc = [];
    const catOf = s => s.stCat === 'SC6' ? 'Staff ward' : s.stCat === 'SC7' ? 'Sibling' : ['SC9', 'SC11'].includes(s.stCat) ? 'Concession' : 'General';
    DATA.students.forEach(s => {
      if (!NEWT.includes(s.admType)) return; const r = s.rc.find(x => x.amt > 0 && !x.adj); if (!r) return; if (r.d > DATA.TODAY) return;
      const b = DATA.branches[s.b]; if (!srfBranch(b)) return; const amt = Math.min(SRF_AMT[b.type] || 5000, r.amt);
      const row = mkAdm(s.adm, s.name, s.cls, b.id, E.ds(r.d), amt, { admDate: E.ds(s.enrol), receipt: r.no, mode: SRF_MODE[r.mode] || 'Cash', category: catOf(s), rstatus: s.exit && s.status === 'Cancelled' ? 'Cancelled' : 'Active', astatus: 'Confirmed', isNew: true, src: 'Fee Collection', synced: E.ds(r.d), studentId: s.id });
      S.adms.push(row);
      S.fc.push(fcRow(s.adm, s.name, s.cls, b.id, E.ds(r.d), amt, { receipt: r.no, mode: row.mode, category: row.category, rstatus: row.rstatus, astatus: 'Confirmed', isNew: true }));
    });
  }
  /* Demo workflow data. Everything below is created through the module's own functions (submit, decide, createBatch …)
     so statuses, claims, audit entries and notifications stay consistent. Bump SRF_SEED_VER when the demo set changes. */
  function seed(ctx) {
    X = Object.assign(X || {}, ctx); const { S, newDraft, submit, log } = ctx; syncYears(S);
    S.awRules.forEach(r => { if (r.scope === 'branch' && r.target === 'ABG') r.target = 'B21'; if (r.scope === 'user' && r.target === 'U2') { const p = S.users.find(u => u.roles.includes('Principal') && u.scope.ids.includes('B21')); r.target = p ? p.id : ''; } });
    S.audit.length = 0;
    const TODAY = E.ds(DATA.TODAY), day = n => E.ds(DATA.TODAY - n);
    const M = ctx, byRole = (role, pred) => S.users.find(u => u.status === 'Active' && u.roles.includes(role) && (!pred || pred(u)));
    const principalOf = b => byRole('Principal', u => u.scope.ids.includes(b));
    const accountsFor = b => byRole('Accounts', u => u.roles[0] === 'Accounts' && M.userBranches(u).includes(b)) || byRole('Accounts', u => M.userBranches(u).includes(b));
    const cf = byRole('Corporate Finance', u => u.roles.length === 1) || byRole('Corporate Finance'), hr = byRole('HR');
    const as = (u, role, fn) => { const u0 = S.uid, r0 = S.role; S.uid = u.id; S.role = role; try { return fn(); } catch (e) { console.warn('SRF seed', role, e); } finally { S.uid = u0; S.role = r0; } };
    const decideAs = (sub, type, remark, lineIds) => {
      const who = sub.level === 2 ? cf : accountsFor(sub.branch); if (!who) return;
      as(who, sub.level === 2 ? 'Corporate Finance' : (who.roles.includes('Accounts') ? 'Accounts' : who.roles[0]), () => {
        S.acc = { sel: sub.id, remark, checked: {} }; const all = sub.adms.flatMap(a => a.lines); (lineIds || all.map(l => l.id)).forEach(id => S.acc.checked[id] = true); M.decide(type);
      });
    };
    const approved = sub => sub.adms.flatMap(a => a.lines).filter(l => l.pstatus === 'Pending HR Processing').map(l => l.id);
    // policy: a second version from October makes sibling admissions eligible
    const v2 = M.clone(S.versions[0].p); v2.cats.Sibling = true;
    S.versions.push({ v: 2, from: '2026-10-01', by: (cf ? cf.name : 'Corporate Finance') + ' (Corporate Finance)', at: '2026-09-26', reason: 'Sibling admissions made SRF-eligible from October (Management note CF/2026/41)', p: v2 });
    S.cp.draft = M.clone(v2);
    // widen the Principal window while the demo submissions are created, so older SRF receipts can be claimed
    const tmp = { id: 'AW-TMP', scope: 'all', target: '', days: 120, preset: 'Custom', from: TODAY, status: 'Active', by: 'seed', at: '', reason: '' };
    S.awRules.push(tmp);
    const sizes = [3, 4, 2, 5, 3, 4, 8, 8, 6, 2, 4, 3, 2, 5, 3, 4], subs = [], extra = {};
    const remarks = ['SRF incentives for new admissions', 'Weekly SRF claim', 'SRF claim – admissions this fortnight', 'Pending SRF receipts for incentive', 'SRF incentive request'];
    try {
      for (const b of Object.keys(SRF_BRIDGE_BR(S))) {
        if (subs.length >= sizes.length) break;
        const u = principalOf(b); if (!u) continue;
        as(u, 'Principal', () => {
          const d = newDraft(b), keys = Object.keys(d.include).filter(k => d.include[k]); if (keys.length < 2) return;
          const n = Math.min(sizes[subs.length], keys.length); d.include = {}; keys.slice(0, n).forEach(k => d.include[k] = true);
          d.remark = remarks[subs.length % remarks.length]; const c = S.subs.length; submit(d, true);
          if (S.subs.length > c) { subs.push(S.subs.at(-1)); if (keys.length > n) extra[b] = { u, keys: keys.slice(n) }; }
        });
      }
      // a few branches submit a second time (fresh receipts after the first claim)
      Object.entries(extra).slice(0, 3).forEach(([b, x]) => as(x.u, 'Principal', () => {
        const d = newDraft(b); const ks = Object.keys(d.include).filter(k => d.include[k] && x.keys.includes(k)).slice(0, 3); if (ks.length < 1) return;
        d.include = {}; ks.forEach(k => d.include[k] = true); d.remark = 'Second SRF claim this month'; const c = S.subs.length; submit(d, true); if (S.subs.length > c) subs.push(S.subs.at(-1));
      }));
    } finally { S.awRules.splice(S.awRules.indexOf(tmp), 1); }
    // submission dates: oldest first
    subs.forEach((sub, i) => { sub.submittedAt = day(Math.max(0, Math.round(32 - i * (32 / Math.max(1, subs.length - 1))))); });
    const pick = i => subs[i];
    // --- verification outcomes ---
    [0, 1, 2, 3, 4, 5, 6, 7].forEach(i => { const s = pick(i); if (s) decideAs(s, 'approve', ''); });
    { const l2 = subs.filter(s => s.status === 'Pending L2 Verification'); l2.slice(0, -1).forEach(s => decideAs(s, 'approve', 'Checked against the SRF receipts in Fee Collection.')); } // the last one stays with Corporate Finance
    { const s = pick(8); if (s) { const ls = s.adms.flatMap(a => a.lines); decideAs(s, 'approve', 'Aya line left out: staff member was on leave on the collection date as per HRMS.', ls.slice(0, Math.max(1, ls.length - 1)).map(l => l.id)); } }
    { const s = pick(9); if (s) decideAs(s, 'return', 'Receipt numbers do not match the SRF register. Please check and resubmit.'); }
    { const s = pick(10); if (s) decideAs(s, 'reject', 'Duplicate of an earlier claim for the same students.'); }
    { const s = pick(11); if (s) decideAs(s, 'hold', 'Awaiting HRMS confirmation of the counsellor transfer date.'); }
    // --- HR payments ---
    if (hr) as(hr, 'HR', () => {
      S.hr.method = 'Payroll'; S.hr.checked = {}; S.hr.ref = {}; S.hr.reason = '';
      const pdm = S.hr.pd.month;
      // September payroll: first two claims paid
      S.hr.pd.month = '2026-09';
      [0, 1].forEach(i => { const s = pick(i); if (s) approved(s).forEach(id => S.hr.checked[id] = true); });
      const n0 = S.batches.length; M.createBatch();
      if (S.batches.length > n0) { const b = S.batches.at(-1); M.includePayroll(b.ref); S.hr.ref[b.ref] = 'PAYRUN-2026-09-SRF'; M.markPaid(b.ref); b.lines.forEach(k => { const l = M.lineById(k); if (l) l.paidOn = '2026-10-01'; }); b.paidOn = '2026-10-01'; }
      // October payroll: next two claims included, awaiting payroll posting
      S.hr.pd.month = pdm;
      [2, 3].forEach(i => { const s = pick(i); if (s) approved(s).forEach(id => S.hr.checked[id] = true); });
      const n1 = S.batches.length; M.createBatch(); if (S.batches.length > n1) M.includePayroll(S.batches.at(-1).ref);
      // a bank-transfer batch still open
      S.hr.method = 'Bank transfer'; { const s = pick(4); if (s) approved(s).forEach(id => S.hr.checked[id] = true); } M.createBatch(); S.hr.method = 'Payroll';
      // one approved line on hold
      { const s = pick(5); const id = s && approved(s)[0]; if (id) { S.hr.reason = 'Bank account details missing in HRMS'; M.holdLine(id); } }
      // reversal on a paid line (approved by Corporate Finance) and one still pending
      const paid = S.subs.flatMap(x => x.adms.flatMap(a => a.lines)).filter(l => l.pstatus === 'Paid');
      if (paid[1]) { S.hr.reason = 'Admission cancelled; SRF refunded on ' + day(6).split('-').reverse().join('/') + '.'; M.requestReversal(paid[1].id); }
      if (paid[3]) { S.hr.reason = 'Counsellor was not on duty on the collection date as per the attendance register.'; M.requestReversal(paid[3].id); }
      // recovery: receipt refunded after payment
      if (paid[5]) { paid[5].pstatus = 'Recovery Required'; paid[5].note = 'Receipt refunded after payment'; const a = M.adm(paid[5].enrol); if (a) a.rstatus = 'Refunded'; log('Receipt status','Receipt '+paid[5].enrol,'Active → Refunded (Fee Collection sync)','','System'); }
      if (paid[6]) { M.recovered(paid[6].id); const a = M.adm(paid[6].enrol); if (a) a.rstatus = 'Refunded'; }
      S.hr.reason = ''; S.hr.checked = {};
    });
    if (cf) as(cf, 'Corporate Finance', () => { const r = S.revs[0]; if (r && r.status === 'Pending') M.approveRev(r.id); });
    // --- Principal drafts and special access ---
    Object.entries(extra).slice(3, 5).forEach(([b, x], i) => as(x.u, 'Principal', () => {
      const d = newDraft(b); const ks = Object.keys(d.include).filter(k => d.include[k]).slice(0, 2); if (!ks.length) return;
      d.include = {}; ks.forEach(k => d.include[k] = true); d.remark = 'Draft – to complete after cross-checking receipts'; d.draftId = 'D' + (S.drafts.length + 1 + S.subs.length);
      S.drafts.push({ id: d.draftId, by: x.u.id, at: day(i + 1), d: M.clone(d) });
    }));
    { const s = pick(9); const pu = s && S.users.find(u => u.id === s.submittedBy); const sa = byRole('System Admin');
      if (pu) S.grants.push({ id: 'SA-001', uid: pu.id, branch: s.branch, from: day(20), to: day(8), n: 2, unit: 'Days', at: day(1) + ' 10:30', expires: day(-1) + ' 10:30', reason: 'Returned claim: receipts older than the normal window must be resubmitted', ref: 'MGT/SRF/2026/017', remarks: 'Approved by CFO over email', doc: '', by: sa ? sa.name : 'System Admin', status: 'Active', used: [], normal: 3 }); }
    // spread the audit trail over the last five weeks (newest first)
    { const n = S.audit.length, span = 33 * 864e5, end = Date.parse(TODAY + 'T17:30:00'); S.audit.forEach((a, i) => { a.at = new Date(end - span * (i / Math.max(1, n)) - (i % 7) * 60000).toISOString(); }); }
    S.fcs.last = (Store.get('sync').lastSuccess || '').replace('T', ' ').slice(0, 16); S.fcs.lastBy = 'ERP sync';
    S.lookup = { id: '', res: null }; S.draft = null; S.uid = ''; S.role = ''; S.view = 'dashboard';
    S.acc = { sel: null, remark: '', checked: {} }; S.hr.checked = {}; S.hr.ref = {}; S.hr.reason = '';
    { const t = SRF_ROOT.getElementById('toast'); if (t) t.hidden = true; } // no toasts from the demo set-up
    ready = true;
  }
  /* sign the Fee Desk user into the SRF module */
  function signIn() {
    const S = SRF.S, u = App.user; if (!u) return false;
    const su = S.users.find(x => x.id === u.id); if (!su || su.status !== 'Active') { return false; }
    if (S.uid !== u.id) { S.uid = u.id; S.role = su.roles[0]; SRF.landing(); }
    else if (!su.roles.includes(S.role)) S.role = su.roles[0];
    return true;
  }
  function refreshUsers() { if (!X) return; const S = SRF.S, keep = Object.fromEntries(S.users.map(u => [u.id, u])); S.users = srfUsers().map(u => Object.assign(u, keep[u.id] ? { reset: keep[u.id].reset, auth: keep[u.id].auth } : {})); }
  /* persistence in the shared workspace: settings, work items and audit; each submission as its own document */
  const SETTINGS = ['versions', 'perms', 'routing', 'notify', 'awRules', 'grants', 'seq'], WORK = ['batches', 'revs', 'drafts'];
  function save() {
    if (!ready || !Store.writable) return; const S = SRF.S;
    const put = (k, obj) => { const j = JSON.stringify(obj); if (last[k] !== j) { last[k] = j; Store.put(k, JSON.parse(j)); } };
    put('srf', Object.assign(Object.fromEntries(SETTINGS.map(k => [k, S[k]])), { seedVer: SRF_SEED_VER }));
    put('srf_work', Object.fromEntries(WORK.map(k => [k, S[k]])));
    put('srf_audit', { list: S.audit.slice(0, 300) });
    S.subs.forEach(sub => { const j = JSON.stringify(sub); if (savedSubs[sub.id] === j) return; if (j.length > 200000) { if (!sub._big) { sub._big = true; SRF.toast(sub.ref + ' is too large to save in the shared workspace; it stays in this session.'); } return; } savedSubs[sub.id] = j; Store.setDoc('srfsubs', sub.id, JSON.parse(j)); });
  }
  let applying = false, pendingKeys = [];
  /* The saved workspace is used only when it was written by this demo set (same SRF_SEED_VER). An older demo is
     replaced by the current seed and re-saved; stale submission documents are tombstoned. */
  function seedMatches() { const d = Store.get('srf'); return d && d.versions ? d.seedVer === SRF_SEED_VER : null; }
  function applyStore(k) {
    if (!ready || applying) return; const S = SRF.S;
    const m = seedMatches();
    if (m === null) { if (!pendingKeys.includes(k)) pendingKeys.push(k); return; }
    if (m === false) {
      const keep = new Set(S.subs.map(x => x.id)); (Store.list('srfsubs') || []).forEach(x => { if (!keep.has(x.id) && !x.deleted && Store.writable) Store.setDoc('srfsubs', x.id, { deleted: true }); });
      if (k === 'srf') { last = {}; savedSubs = {}; pendingKeys = []; clearTimeout(saveT); saveT = setTimeout(save, 300); }
      return;
    }
    applying = true;
    try {
      if (k === 'srf') { const d = Store.get('srf'); if (d && d.versions) { SETTINGS.forEach(x => { if (d[x] !== undefined) S[x] = SRF.clone(d[x]); }); last.srf = JSON.stringify(Object.fromEntries(SETTINGS.map(x => [x, S[x]]))); } }
      if (k === 'srf_work') { const d = Store.get('srf_work'); if (d && d.batches) { WORK.forEach(x => { if (d[x] !== undefined) S[x] = SRF.clone(d[x]); }); last.srf_work = JSON.stringify(Object.fromEntries(WORK.map(x => [x, S[x]]))); } }
      if (k === 'srf_audit') { const d = Store.get('srf_audit'); if (d && d.list && d.list.length >= S.audit.length) { S.audit = SRF.clone(d.list); last.srf_audit = JSON.stringify({ list: S.audit.slice(0, 300) }); } }
      if (k === 'srfsubs') { const L = (Store.list('srfsubs') || []).filter(x => !x.deleted && x.branch && SRF.BR[x.branch]); if (L.length) { S.subs = L.map(x => { const o = Object.assign({}, x); delete o.ts; return o; }).sort((a, b) => +a.id.slice(1) - +b.id.slice(1)); S.subs.forEach(s => savedSubs[s.id] = JSON.stringify(s)); S.adms.forEach(a => a.claimedBy = null); S.subs.forEach(s => { if (!['Rejected'].includes(s.status)) s.adms.forEach(x => { const a = SRF.adm(x.enrol); if (a) a.claimedBy = s.id; }); }); S.seq.sub = Math.max(S.seq.sub, ...S.subs.map(s => +s.id.slice(1))); S.seq.line = Math.max(S.seq.line, ...S.subs.flatMap(s => s.adms.flatMap(a => a.lines.map(l => +l.id.slice(1))))); } }
    } finally { applying = false; }
    if (k === 'srf' && pendingKeys.length) { const p = pendingKeys.filter(x => x !== 'srf'); pendingKeys = []; p.forEach(applyStore); }
    if (App.route.startsWith('srf_')) rerender();
  }
  /* label each cell with its column header so phones can show rows as stacked cards */
  function stackTables() { SRF_ROOT.querySelectorAll('.tw table').forEach(t => { const hs = [...t.querySelectorAll('thead th')].map(th => th.textContent.trim()); if (!hs.length) { t.classList.remove('stack'); return; } t.classList.add('stack'); t.querySelectorAll('tbody tr').forEach(tr => [...tr.children].forEach((td, i) => td.setAttribute('data-h', hs[i] || ''))); }); }
  function afterRender(ctx) { stackTables(); if (!ready) return; clearTimeout(saveT); saveT = setTimeout(save, 600); const view = ctx.S.view; const r = 'srf_' + view; if (SRF_HOST.isConnected && view && PAGES[r] && App.route !== r && App.route.startsWith('srf_')) { App.route = r; try { history.replaceState(null, '', '#' + r); } catch (e) { } renderShell(); $('#title').textContent = PAGES[r].title; } }
  function onLog(a) { if (!ready || !a) return; if (a.cat === 'System' && /Notification|Login/.test(a.action)) return; audit('SRF · ' + a.entity, a.action, { new: a.detail, reason: a.reason, approval: '—' }); }
  /* Fee Desk filter bar (region / zonal director / zone / branch / type) applied to the signed-in user's SRF branch list */
  function filterBranches(L) { if (!ready || !App.user) return L; const f = App.f; if (!(f.region || f.zone || f.branch || f.type || f.rd || f.zd)) return L; const ok = new Set(scopeIdx().map(i => DATA.branches[i].id)); return L.filter(c => ok.has(c)); }
  function badge(k) { if (!X || !ready || !App.user) return 0; const S = SRF.S; const su = S.users.find(x => x.id === App.user.id); if (!su || su.status !== 'Active') return 0; const keep = [S.uid, S.role]; S.uid = su.id; if (!su.roles.includes(S.role)) S.role = su.roles[0]; let n = 0; try { n = SRF.counts()[k] || 0; } catch (e) { } [S.uid, S.role] = keep; return n; }
  function visible(k) { if (!X || !ready || !App.user) return false; const S = SRF.S; const su = S.users.find(x => x.id === App.user.id); if (!su || su.status !== 'Active') return false; if (su.scope.type === 'branch' && !su.scope.ids.length) return false; const keep = [S.uid, S.role]; S.uid = su.id; if (!su.roles.includes(S.role)) S.role = su.roles[0]; let ok = false; try { ok = k === 'spec' || (SRF.can(k, 'View') && !(k === 'audit' && S.role === 'System Admin')); } catch (e) { } [S.uid, S.role] = keep; return ok; }
  return { masters, feed, seed, signIn, refreshUsers, save, applyStore, afterRender, onLog, badge, visible, filterBranches, syncYears, get ready() { return ready; } };
})();
