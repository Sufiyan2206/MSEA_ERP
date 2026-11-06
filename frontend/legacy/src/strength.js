/* ===== Strength, categories, capacity, admissions and multi-year history (extends the ERP stand-in) ===== */
const ST_CATS = ['New Admission', 'Renewal', 'Continuing Student', 'Transfer Admission', 'Re-admission', 'Staff Child', 'Sibling Admission', 'Scholarship Student', 'Concession Student', 'Franchise Student', 'Special Approval Student', 'Withdrawn Student', 'Cancelled Admission'];
const FEE_CATS = ['Regular Fee', 'Full Fee Paid', 'Instalment Fee', 'Scholarship', 'Concession', 'Staff Concession', 'Sibling Concession', 'Management Concession', 'Special Discount', 'Zero Payer', 'Outstanding / Defaulter'];
const SOURCES = ['Walk-in', 'Website / online enquiry', 'Parent referral', 'Sibling', 'Social media', 'School event / open house', 'Newspaper / hoarding', 'Existing student'];
const CANCEL_REASONS = ['Parent Relocation', 'Fee Affordability', 'Academic Concern', 'Shifted to Another School', 'Incorrect Admission', 'Duplicate Admission', 'Personal / Family Reason', 'Dissatisfied with Service', 'Other'];
const EXIT_TYPES = ['Cancelled', 'Withdrawn', 'Transferred Out'];
const NEWT_ = ['New Admission', 'Transfer Admission', 'Re-admission'];
const YEARS0 = ['2022-23', '2023-24', '2024-25', '2025-26', '2026-27'];
const CUR_AY = '2026-27';
function defaultCategories() {
  return { cancel: CANCEL_REASONS.map((n, i) => ({ id: 'CR' + (i + 1), name: n, active: true, order: i })), student: ST_CATS.map((n, i) => ({ id: 'SC' + (i + 1), name: n, active: true, order: i })), fee: FEE_CATS.map((n, i) => ({ id: 'FC' + (i + 1), name: n, active: true, order: i, derived: i >= 9 })) };
}

/* ---- per-student attributes the fee engine does not need (own random stream, so fee figures are unchanged) ---- */
(function extendStudents() {
  const R = E.rng(97531), AYS0 = E.dn('2026-04-01'), J = DATA.J, T = DATA.TODAY;
  const PARENT = ['Mohammed', 'Syed', 'Abdul', 'Shaik', 'Mohd', 'Imran', 'Rashid', 'Farooq', 'Salman', 'Arif', 'Ramesh', 'Suresh', 'Anwar', 'Javed'];
  const counsellorOf = {}; users().filter(u => u.role === 'Admissions Counsellor').forEach(u => counsellorOf[u.zone] = u.id);
  const bi0 = s => s.b;
  const pickSrc = () => { const u = R(); return u < .30 ? 0 : u < .48 ? 1 : u < .63 ? 2 : u < .75 ? 3 : u < .85 ? 4 : u < .93 ? 5 : 6; };
  const admSeason = () => { const u = R(); const d = u < .15 ? E.dn('2026-01-05') + Math.floor(R() * 56) : u < .75 ? E.dn('2026-03-01') + Math.floor(R() * 92) : E.dn('2026-06-01') + Math.floor(R() * 50); return Math.min(d, J); };
  DATA.students.forEach(s => {
    const b = DATA.branches[s.b];
    let adm;
    if (s.isNew) { adm = 'New Admission'; s.enrol = s.join; }
    else {
      const pNew = s.ci === 0 ? 0.72 : 0.16, v = R();
      if (v < pNew) { adm = 'New Admission'; s.enrol = admSeason(); }
      else if (v < pNew + 0.02) { adm = 'Transfer Admission'; s.enrol = admSeason(); }
      else if (v < pNew + 0.03) { adm = 'Re-admission'; s.enrol = admSeason(); }
      else if (v < pNew + 0.03 + (0.97 - pNew) * 0.7) { adm = 'Renewal'; s.enrol = E.dn('2025-04-01') + Math.floor(R() * 100); s.renew = E.dn('2026-02-01') + Math.floor(R() * 70); }
      else { adm = 'Continuing Student'; s.enrol = E.dn('2025-04-01') + Math.floor(R() * 100); }
    }
    s.admType = adm;
    s.status = adm === 'Continuing Student' ? 'Continuing' : adm === 'Transfer Admission' ? 'Transferred' : adm;
    s.stCat = 'SC' + (ST_CATS.indexOf(adm) + 1);
    s.feeCat = s.fullYear ? 'FC2' : (R() < .4 ? 'FC1' : 'FC3');
    s.schol = 0; s.concAmt = E.r2(s.gross - s.annual);
    if (s.conc > 0) {
      const w = R();
      if (w < .2) { s.stCat = 'SC6'; s.feeCat = 'FC6'; }
      else if (w < .45) { s.stCat = 'SC7'; s.feeCat = 'FC7'; }
      else if (w < .7) { s.stCat = 'SC8'; s.feeCat = 'FC4'; s.schol = s.concAmt; s.concAmt = 0; }
      else if (w < .93) { s.stCat = 'SC9'; s.feeCat = R() < .5 ? 'FC5' : 'FC8'; }
      else { s.stCat = 'SC11'; s.feeCat = 'FC9'; }
    }
    if (/Super International/.test(b.name) && R() < .25) s.stCat = 'SC10';
    s.source = ['New Admission', 'Transfer Admission', 'Re-admission'].includes(adm) ? SOURCES[s.stCat === 'SC7' ? 3 : pickSrc()] : 'Existing student';
    s.counsellor = s.source !== 'Existing student' ? counsellorOf[b.zone] || '' : '';
    s.parent = PARENT[Math.floor(R() * PARENT.length)] + ' ' + s.name.split(' ').slice(-1)[0];
    // withdrawals and cancelled admissions after the uploaded report date
    const ex = R();
    if (!s.isNew && adm !== 'New Admission' && ex < .015) { s.exit = J + 1 + Math.floor(R() * (T - J - 3)); s.status = 'Withdrawn'; s.stCat = 'SC12'; }
    else if (!s.isNew && adm !== 'New Admission' && ex < .019) { s.exit = J + 1 + Math.floor(R() * (T - J - 3)); s.status = 'Transferred Out'; s.transferTo = DATA.branches[(bi0(s) + 7 + Math.floor(R() * 20)) % DATA.branches.length].name; }
    else if (adm === 'New Admission' && !s.isNew && R() < .009) { s.exit = Math.max(AYS0 + 5, Math.min(T - 2, Math.max(J + 1, s.enrol + 20 + Math.floor(R() * 90)))); s.status = 'Cancelled'; s.stCat = 'SC13'; }
    if (s.exit) { s.exitReason = s.status === 'Transferred Out' ? 'Transfer within the trust' : CANCEL_REASONS[Math.floor(R() * (s.status === 'Cancelled' ? 9 : 5))]; s.exitBy = 'ERP'; }
  });
  // exit financials: collected before exit, refund (posted as an ERP refund receipt), write-off, replacement
  let rno = Math.max(0, ...DATA.receipts.map(r => r.id)) + 1;
  DATA.students.filter(s => s.exit).forEach(s => {
    const coll = s.rc.filter(r => r.amt > 0 && r.d <= s.exit).reduce((a, r) => a + r.amt, 0);
    const share = s.status === 'Cancelled' ? 0.5 + 0.5 * R() : s.status === 'Withdrawn' ? (R() < .6 ? 0 : 0.15 + 0.25 * R()) : 0;
    s.exitRefund = E.r2(coll * share);
    if (s.exitRefund > 0) { const x = { id: rno++, no: `${DATA.branches[s.b].code}/RF${rno}`, s: s.id, b: s.b, d: Math.min(T, s.exit + 3 + Math.floor(R() * 10)), amt: -s.exitRefund, kind: 'F', mode: 3, type: 'Refund', exit: true }; s.rc.push(x); s.rc.sort((a, b) => a.d - b.d || a.id - b.id); DATA.receipts.push(x); }
    s.exitCollected = coll;
  });
  // enquiries / leads per branch per month, Jan–Oct 2026
  DATA.leads = DATA.branches.map((b, bi) => {
    const conv = 0.18 + 0.27 * R();
    const months = [];
    for (let m = 1; m <= 10; m++) {
      const a = E.dn(`2026-${String(m).padStart(2, '0')}-01`), z = m === 10 ? T : E.dn(`2026-${String(m + 1).padStart(2, '0')}-01`) - 1;
      const adm = DATA.students.filter(s => s.b === bi && ['New Admission', 'Transfer Admission', 'Re-admission'].includes(s.admType) && s.enrol >= a && s.enrol <= z).length;
      const leads = Math.round(adm / conv * (0.85 + 0.3 * R())) + Math.floor(R() * 4);
      months.push({ m, from: a, to: z, adm, leads, walkins: Math.round(leads * (0.32 + 0.16 * R())) });
    }
    return { conv, months };
  });
})();

/* ---- calculations ---- */
const Str = {
  cats: () => Store.get('categories'),
  catName(kind, id) { const c = (Str.cats()[kind] || []).find(x => x.id === id); return c ? c.name : id; },
  active: (s, D) => s.enrol <= D && !(s.exit && s.exit <= D),
  onRoll: (s, D) => s.enrol <= D && !(s.exit && s.exit <= D),
  isNewType: s => NEWT_.includes(s.admType),
  exitKind: s => s.status === 'Cancelled' ? 'canc' : s.status === 'Transferred Out' ? 'out' : 'wd',
  /* exit financials for a student who left (as on D) */
  exitInfo(s, D) {
    const x = E.studentsAt(DATA, A, D)[s.id] || {}, coll = s.exitCollected || 0, refund = s.exitRefund || 0;
    const dueAtExit = x.exitDue != null ? x.exitDue : 0, writeOff = Math.max(0, dueAtExit - coll);
    const net = coll - refund, loss = Math.max(0, s.annual - net);
    const rep = Str.replacement(s, D);
    return { coll, refund, writeOff, loss, demand: s.annual, gross: s.gross, replaced: rep };
  },
  replacement(s, D) { return memo('rep' + s.id + '_' + D, () => { const r = DATA.students.find(o => o.b === s.b && o.cls === s.cls && o.id !== s.id && NEWT_.includes(o.admType) && o.enrol > s.exit && o.enrol <= D && !(o.exit && o.exit <= D)); return r ? { by: r.name, on: r.enrol } : null; }); },
  payStatus(x) { if (!x || x.due <= 0.5) return x && x.adv > 0 ? 'Advance' : 'Not due'; if (x.paid <= 0.5) return 'Zero Payer'; if (x.od > 0.5) return 'Overdue'; if (x.os > 0.5) return 'Partly Paid'; return 'Fully Paid'; },
  lastPay(s, D) { let d = null; for (const r of s.rc) { if (r.d > D) break; if (r.amt > 0) d = r.d; } return d; },
  feeCatMatch(x, id) {
    if (id === 'FC10') return x && x.due > 0.5 && x.paid <= 0.5;
    if (id === 'FC11') return x && x.od > 0.5;
    return x && x.s.feeCat === id;
  },
  /* student filter from the page filters (class, section, categories, source, counsellor) */
  sfKey() { const f = App.f; return [f.cls, f.sec, f.stCat, f.feeCat, f.source, f.couns, f.from].join('|'); },
  sfActive() { const f = App.f; return !!(f.cls || f.sec || f.stCat || f.feeCat || f.source || f.couns); },
  passes(x) { const f = App.f, s = x.s; if (f.cls && s.cls !== f.cls) return false; if (f.sec && s.sec !== f.sec) return false; if (f.stCat && s.stCat !== f.stCat) return false; if (f.source && s.source !== f.source) return false; if (f.couns && s.counsellor !== f.couns) return false; if (f.feeCat && !Str.feeCatMatch(x, f.feeCat)) return false; return true; },
  /* list of {x, s} for scope + filters, active on D (inclActive=false also returns exited) */
  list(D, idx = scopeIdx(), opts = {}) {
    const key = 'sl' + D + '|' + idx.join(',') + '|' + Str.sfKey() + '|' + (opts.all ? 1 : 0);
    return memo(key, () => { const set = new Set(idx), S = E.studentsAt(DATA, A, D); const out = []; DATA.students.forEach((s, i) => { if (!set.has(s.b)) return; if (!opts.all && !Str.active(s, D)) return; const x = S[i] || { s, due: 0, paid: 0, os: 0, od: 0, adv: 0, ag: [0, 0, 0, 0, 0], inst: {}, status: 'Not due', pyDue: 0, pyBal: 0, curDue: 0, curBal: 0 }; if (!Str.passes(x)) return; out.push(x); }); return out; });
  },
  /* manual targets (effective = last approved values) */
  plansFor(ay = App.f.ay) { const T = Store.get('targets'); return ay === CUR_AY ? T.plans : ((T.byYear || {})[ay] || {}); },
  plan(bid) { const p = Str.plansFor()[bid]; return p || null; },
  branchTarget(bid) { const p = Str.plan(bid); return p && p.approved ? p.approved : null; },
  /* capacity: approved entries override the baseline (section → class → branch) */
  capEntry(bid, cls, sec, D) {
    const iso = E.ds(D);
    const L = Store.get('capacity').entries.filter(e => e.status === 'Approved' && (e.ay || CUR_AY) === App.f.ay && e.bid === bid && (e.cls || '') === (cls || '') && (e.sec || '') === (sec || '') && e.from <= iso && (!e.to || e.to >= iso));
    return L.length ? L.sort((a, b) => (a.approvedAt || '').localeCompare(b.approvedAt || '')).at(-1) : null;
  },
  /* section master for a branch: ERP/baseline sections plus sections added here, less sections closed here (approved, in force on D).
     Each key is 'class|section'; meta tells whether it is proposed (pending approval), added or being closed. */
  secKeys(bid, D) {
    const iso = E.ds(D), out = new Map(); Object.keys(CAP_BASE[bid] || {}).forEach(k => out.set(k, { src: 'ERP' }));
    DATA.students.forEach(s => { if (DATA.branches[s.b].id === bid && s.sec && Str.active(s, D)) { const k = s.cls + '|' + s.sec; if (!out.has(k)) out.set(k, { src: 'ERP' }); } });
    Store.get('capacity').entries.filter(e => (e.ay || CUR_AY) === App.f.ay && e.bid === bid && (e.newSection || e.closeSection) && !['Rejected', 'Withdrawn'].includes(e.status)).sort((a, b) => (a.at || '').localeCompare(b.at || '')).forEach(e => {
      const k = e.cls + '|' + e.sec;
      if (e.newSection) { if (e.status === 'Approved') out.set(k, { src: 'Added', e }); else if (!out.has(k)) out.set(k, { src: 'Proposed', e }); }
      else if (e.closeSection && e.closeClass) { [...out.keys()].filter(x => x.startsWith(e.cls + '|')).forEach(x => { if (e.status === 'Approved' && e.from <= iso) out.delete(x); else out.set(x, Object.assign({}, out.get(x), { closing: e, closingClass: true })); }); }
      else if (e.closeSection) { if (e.status === 'Approved' && e.from <= iso) out.delete(k); else if (out.has(k)) out.set(k, Object.assign({}, out.get(k), { closing: e })); }
    });
    const IN = (Store.get('capacity').inactive || []).filter(x => x.bid === bid && (x.ay || CUR_AY) === App.f.ay && x.from <= iso);
    IN.forEach(x => { if (x.sec === '*') { [...out.keys()].filter(k => k.startsWith(x.cls + '|')).forEach(k => out.set(k, Object.assign({}, out.get(k), { inactive: x, inactiveClass: true }))); return; } const k = x.cls + '|' + x.sec; if (out.has(k)) out.set(k, Object.assign({}, out.get(k), { inactive: x })); });
    return out;
  },
  /* sections that count: approved, not closed, not deactivated */
  secList(bid, D) { return [...Str.secKeys(bid, D).entries()].filter(([, m]) => m.src !== 'Proposed' && !m.inactive).map(([k]) => k); },
  secInactive(bid, cls, sec) { return (Store.get('capacity').inactive || []).find(x => x.bid === bid && x.cls === cls && (x.sec === sec || x.sec === '*') && (x.ay || CUR_AY) === App.f.ay) || null; },
  classInactive(bid, cls) { return (Store.get('capacity').inactive || []).find(x => x.bid === bid && x.cls === cls && x.sec === '*' && (x.ay || CUR_AY) === App.f.ay) || null; },
  secCap(bid, cls, sec, D) { const e = Str.capEntry(bid, cls, sec, D); if (e) return e.capacity; const base = CAP_BASE[bid]; return base && base[cls + '|' + sec] != null ? base[cls + '|' + sec] : 0; },
  classCap(bid, cls, D) { const e = Str.capEntry(bid, cls, '', D); if (e) return e.capacity; return Str.secList(bid, D).filter(k => k.startsWith(cls + '|')).reduce((a, k) => a + Str.secCap(bid, cls, k.split('|')[1], D), 0); },
  branchCap(bid, D) { const bb = DATA.branches.find(x => x.id === bid); if (bb && bb.inactive) return 0; const e = Str.capEntry(bid, '', '', D); if (e) return e.capacity; if (CAP_MISSING.has(bid)) return 0; return [...new Set(Str.secList(bid, D).map(k => k.split('|')[0]))].reduce((a, c) => a + Str.classCap(bid, c, D), 0); },
  /* aggregated rows for a level: region | zone | bd | branch | type | class | section | stcat | feecat | source | couns */
  rows(D, level, idx = scopeIdx()) {
    const key = 'sr' + D + '|' + level + '|' + idx.join(',') + '|' + Str.sfKey();
    return memo(key, () => {
      const iso = E.ds(D), G = new Map();
      const keyOf = x => { const b = DATA.branches[x.s.b]; return { region: b.region, zone: b.zone, branch: b.id, type: b.type, class: b.id + '|' + x.s.cls, section: b.id + '|' + x.s.cls + '|' + x.s.sec, stcat: x.s.stCat, feecat: x.s.feeCat, source: x.s.source, couns: x.s.counsellor || '—' }[level]; };
      const mk = (k, x) => { const b = DATA.branches[x.s.b]; return { key: k, level, label: { region: regionLabel(b), zone: zoneLabel(b), branch: b.name, type: b.type, class: x.s.cls, section: x.s.cls + ' ' + x.s.sec, stcat: Str.catName('student', x.s.stCat), feecat: Str.catName('fee', x.s.feeCat), source: x.s.source, couns: x.s.counsellor ? (userById(x.s.counsellor) || {}).name || x.s.counsellor : '—' }[level], branch: b.name, bid: b.id, region: b.region, zone: b.zone, type: b.type, cls: x.s.cls, sec: x.s.sec, brs: new Set(), existing: 0, gross: 0, conc: 0, schol: 0, net: 0, collected: 0, os: 0, od: 0, zpN: 0, zpAmt: 0, newAdm: 0, renewals: 0, cont: 0, revNew: 0, revRen: 0, revCont: 0, ag: [0, 0, 0, 0, 0], opening: 0, newOnly: 0, readm: 0, inward: 0, canc: 0, wd: 0, outward: 0, renewN: 0, cancDemand: 0, cancColl: 0, cancRefund: 0, cancWriteOff: 0, cancLoss: 0, exitReplaced: 0 }; };
      Str.list(D, idx).forEach(x => {
        const k = keyOf(x); if (!G.has(k)) G.set(k, mk(k, x)); const r = G.get(k); const s = x.s;
        r.brs.add(s.b); r.existing++; r.gross += s.gross; r.conc += s.concAmt; r.schol += s.schol; r.net += s.annual; r.collected += x.paid + x.adv; r.os += x.os; r.od += x.od;
        for (let i = 0; i < 5; i++) r.ag[i] += x.ag[i];
        if (x.due > 0.5 && x.paid <= 0.5) { r.zpN++; r.zpAmt += x.os; }
        if (['New Admission', 'Transfer Admission', 'Re-admission'].includes(s.admType)) { r.newAdm++; r.revNew += s.annual; } else if (s.admType === 'Renewal') { r.renewals++; r.revRen += s.annual; } else { r.cont++; r.revCont += s.annual; }
      });
      // movements in the date range [from, D]: opening strength, arrivals, renewals, exits with their financials
      const from = E.dn(App.f.from || '2026-01-01'), set = new Set(idx), SA = E.studentsAt(DATA, A, D);
      DATA.students.forEach((s, i) => {
        if (!set.has(s.b)) return; const x = SA[i] || { s, due: 0, paid: 0, os: 0, od: 0, adv: 0, ag: [0, 0, 0, 0, 0] }; if (!Str.passes(Object.assign({}, x, { s }))) return;
        const arrived = s.enrol >= from && s.enrol <= D, exited = s.exit && s.exit >= from && s.exit <= D, wasOn = Str.onRoll(s, from - 1);
        if (!wasOn && !arrived && !exited && !(s.renew >= from && s.renew <= D)) return;
        const k = keyOf({ s }); if (!G.has(k)) G.set(k, mk(k, { s })); const r = G.get(k);
        if (wasOn) r.opening++;
        if (arrived) { if (s.admType === 'Transfer Admission') r.inward++; else if (s.admType === 'Re-admission') r.readm++; else if (s.admType === 'New Admission') r.newOnly++; }
        if (s.renew >= from && s.renew <= D) r.renewN++;
        if (exited) { const kind = Str.exitKind(s); r[kind === 'out' ? 'outward' : kind]++; if (kind !== 'out') { const e = Str.exitInfo(s, D); r.cancDemand += e.demand; r.cancColl += e.coll; r.cancRefund += e.refund; r.cancWriteOff += e.writeOff; r.cancLoss += e.loss; if (e.replaced) r.exitReplaced++; } }
      });
      // targets, capacity and revenue targets
      const rows = [...G.values()];
      rows.forEach(r => {
        const t = Str.targetFor(r, D); Object.assign(r, t);
        r.netGrowth = r.newOnly + r.readm + r.inward - r.canc - r.wd - r.outward;
        r.netStrength = r.opening + r.netGrowth;
        r.gap = r.target != null ? r.target - r.netStrength : null;
        r.grossAdm = r.newOnly + r.readm + r.inward; r.exits = r.canc + r.wd + r.outward;
        r.cancPct = r.grossAdm ? r.canc / r.grossAdm * 100 : 0; r.wdPct = r.opening ? r.wd / r.opening * 100 : 0;
        r.required = r.target != null ? Math.max(0, r.target - r.existing) : null;
        r.vacant = r.capacity ? r.capacity - r.existing : null;
        r.capAfter = r.capacity && r.target != null ? r.capacity - r.target : null;
        r.achPct = r.target ? r.existing / r.target * 100 : null;
        r.utilPct = r.capacity ? r.existing / r.capacity * 100 : null;
        r.tgtUtilPct = r.capacity && r.target != null ? r.target / r.capacity * 100 : null;
        r.revAchPct = r.revTarget ? r.net / r.revTarget * 100 : null;
        r.colPct = r.net ? r.collected / r.net * 100 : 0;
        r.expRev = r.required != null ? r.required * (r.avgNet || (r.existing ? r.net / r.existing : 0)) : null;
        r.revGap = r.revTarget != null ? r.revTarget - r.net : null;
        r.concPct = r.gross ? (r.conc + r.schol) / r.gross * 100 : 0;
        r.count = r.brs.size;
      });
      return rows;
    });
  },
  /* target, capacity and revenue target for a row; branch targets split to classes / sections by share of strength */
  targetFor(r, D) {
    const lvl = r.level, cats = ['stcat', 'feecat', 'source', 'couns'];
    if (cats.includes(lvl) || (Str.sfActive() && (App.f.stCat || App.f.feeCat || App.f.source || App.f.couns))) return { target: null, capacity: null, revTarget: null, avgNet: null, derived: false };
    const brs = [...r.brs];
    if (['region', 'zone', 'branch', 'type'].includes(lvl) && !App.f.cls && !App.f.sec) {
      let target = 0, cap = 0, rev = 0, n = 0, miss = 0;
      brs.forEach(bi => { const b = DATA.branches[bi], t = Str.branchTarget(b.id); if (t) { target += t.target; rev += t.revTarget; n++; } else miss++; cap += Str.branchCap(b.id, D); });
      return { target: n ? target : null, capacity: cap || null, revTarget: n ? rev : null, avgNet: n ? rev / Math.max(1, target) : null, missing: miss, derived: false };
    }
    // class / section level (or class filter): class targets where set, else the class's share of the branch target
    const cls = lvl === 'class' || lvl === 'section' ? r.cls : App.f.cls, sec = lvl === 'section' ? r.sec : App.f.sec;
    let target = 0, tN = 0, cap = 0, rev = 0, derived = false;
    brs.forEach(bi => { const c = Str.classPlan(bi, cls, sec, D); if (c.target != null) { target += c.target; rev += c.rev; tN++; } cap += c.capacity; derived = derived || c.derived; });
    return { target: tN ? target : null, capacity: cap || null, revTarget: tN ? rev : null, avgNet: tN && target ? rev / target : null, derived };
  },
  classPlan(bi, cls, sec, D) {
    const b = DATA.branches[bi], t = Str.branchTarget(b.id), all = Str.allActive(bi, D);
    const clsN = all.filter(s => s.cls === cls).length, secN = sec ? all.filter(s => s.cls === cls && s.sec === sec).length : clsN;
    let target = null, derived = true;
    if (t) { const ct = t.classTargets && t.classTargets[cls] != null ? +t.classTargets[cls] : (Str.plan(b.id).classTargets || {})[cls] != null ? +Str.plan(b.id).classTargets[cls] : null; const clsT = ct != null ? ct : t.target * clsN / Math.max(1, all.length); derived = ct == null || !!sec; target = Math.round(sec ? clsT * secN / Math.max(1, clsN) : clsT); }
    return { target, rev: target != null && t ? target * t.avgNet : 0, capacity: sec ? Str.secCap(b.id, cls, sec, D) : Str.classCap(b.id, cls, D), derived };
  },
  allActive(bi, D) { return memo('aa' + bi + '_' + D, () => DATA.students.filter(s => s.b === bi && Str.active(s, D))); },
  sum(rows) {
    const T = { label: 'Total', existing: 0, gross: 0, conc: 0, schol: 0, net: 0, collected: 0, os: 0, od: 0, zpN: 0, zpAmt: 0, newAdm: 0, renewals: 0, cont: 0, wd: 0, revNew: 0, revRen: 0, revCont: 0, ag: [0, 0, 0, 0, 0], count: 0, opening: 0, newOnly: 0, readm: 0, inward: 0, canc: 0, outward: 0, renewN: 0, cancDemand: 0, cancColl: 0, cancRefund: 0, cancWriteOff: 0, cancLoss: 0, exitReplaced: 0, grossAdm: 0, exits: 0, netGrowth: 0, netStrength: 0 };
    let tg = 0, tgN = 0, cap = 0, capN = 0, rev = 0, revN = 0, miss = 0;
    rows.forEach(r => { Object.keys(T).forEach(k => { if (typeof T[k] === 'number' && k !== 'count') T[k] += r[k] || 0; }); for (let i = 0; i < 5; i++) T.ag[i] += r.ag[i]; T.count += r.count || 0; if (r.target != null) { tg += r.target; tgN++; } if (r.capacity) { cap += r.capacity; capN++; } if (r.revTarget != null) { rev += r.revTarget; revN++; } miss += r.missing || 0; });
    T.target = tgN ? tg : null; T.capacity = capN ? cap : null; T.revTarget = revN ? rev : null; T.missing = miss;
    T.required = T.target != null ? Math.max(0, T.target - T.existing) : null; T.vacant = T.capacity ? T.capacity - T.existing : null; T.capAfter = T.capacity && T.target != null ? T.capacity - T.target : null;
    T.achPct = T.target ? T.existing / T.target * 100 : null; T.utilPct = T.capacity ? T.existing / T.capacity * 100 : null; T.tgtUtilPct = T.capacity && T.target != null ? T.target / T.capacity * 100 : null;
    T.revAchPct = T.revTarget ? T.net / T.revTarget * 100 : null; T.colPct = T.net ? T.collected / T.net * 100 : 0; T.revGap = T.revTarget != null ? T.revTarget - T.net : null;
    T.gap = T.target != null ? T.target - T.netStrength : null; T.cancPct = T.grossAdm ? T.canc / T.grossAdm * 100 : 0; T.wdPct = T.opening ? T.wd / T.opening * 100 : 0;
    T.avgNet = T.target ? (T.revTarget || 0) / T.target : null; T.expRev = rows.reduce((a, r) => a + (r.expRev || 0), 0); T.concPct = T.gross ? (T.conc + T.schol) / T.gross * 100 : 0;
    return T;
  },
  rag(p) { if (p == null) return null; const g = Store.get('config').rag; return p >= (g.tgtGreen || 100) ? 'g' : p >= (g.tgtAmber || 85) ? 'a' : 'r'; },
  chip(p) { const r = Str.rag(p); return r ? `${PCT(p)} ${chip(r, ' ')}` : '—'; },
  /* history for a branch and year (import overrides the synthetic history) */
  hist(bid, ay) { const imp = Store.get('histimport')[bid]; if (imp && imp[ay]) return Object.assign({}, (HIST[bid] || {})[ay] || {}, imp[ay], { imported: true }); return (HIST[bid] || {})[ay]; },
  current(bi, D) {
    return memo('cur' + bi + '_' + D, () => {
      const b = DATA.branches[bi], rows = Str.rowsFor([bi], D), t = Str.branchTarget(b.id);
      return Object.assign({}, rows, { target: t ? t.target : null, revTarget: t ? t.revTarget : null, capacity: Str.branchCap(b.id, D) || null });
    });
  },
  rowsFor(idx, D) { const L = memo('rf' + idx.join(',') + '_' + D, () => { const set = new Set(idx), S = E.studentsAt(DATA, A, D); const r = { strength: 0, gross: 0, conc: 0, schol: 0, net: 0, collected: 0, outstanding: 0, zpAmt: 0, newAdm: 0, renewals: 0, withdrawals: 0, cancellations: 0, transfersIn: 0, transfersOut: 0, pyOpen: 0 }; DATA.students.forEach((s, i) => { if (!set.has(s.b)) return; const x = S[i]; if (s.admType === 'Transfer Admission' && s.enrol <= D) r.transfersIn++; if (s.exit && s.exit <= D) { const k = Str.exitKind(s); if (k === 'canc') r.cancellations++; else if (k === 'out') r.transfersOut++; else r.withdrawals++; } if (!Str.active(s, D)) return; r.strength++; r.gross += s.gross; r.conc += s.concAmt; r.schol += s.schol; r.net += s.annual; if (x) { r.collected += x.paid + x.adv; r.outstanding += x.os; if (x.due > 0.5 && x.paid <= 0.5) r.zpAmt += x.os; r.pyOpen += x.pyDue; } if (['New Admission', 'Transfer Admission', 'Re-admission'].includes(s.admType)) r.newAdm++; else if (s.admType === 'Renewal') r.renewals++; }); return r; }); return L; }
};

/* ---- demo baselines: section capacity, branch targets, history (replaced by approved entries / imports) ---- */
const CAP_BASE = {}, CAP_MISSING = new Set(['B60']), HIST = {};
function demoTargets() {
  const R = E.rng(24680), plans = {}, T = DATA.TODAY;
  DATA.branches.forEach((b, bi) => {
    const act = DATA.students.filter(s => s.b === bi && Str.active(s, T));
    const n = act.length; const gross = act.reduce((a, s) => a + s.gross, 0), net = act.reduce((a, s) => a + s.annual, 0);
    // section capacity baseline
    const sec = {}; act.forEach(s => { const k = s.cls + '|' + s.sec; sec[k] = (sec[k] || 0) + 1; });
    CAP_BASE[b.id] = {}; Object.entries(sec).forEach(([k, c], i) => { const full = (bi + i) % 9 === 0; CAP_BASE[b.id][k] = full ? c : Math.ceil(c * (1.03 + 0.25 * R()) / 5) * 5; });
    const avgNet0 = n ? net / n : 0, concPct0 = gross ? (1 - net / gross) * 100 : 0;
    // multi-year history
    HIST[b.id] = {};
    const g = -0.04 + 0.16 * R(), base = Math.max(8, n);
    let prevOS = 0;
    for (let k = 4; k >= 1; k--) {
      const ay = YEARS0[4 - k], strength = Math.max(5, Math.round(base / Math.pow(1 + g, k) * (0.97 + 0.06 * R())));
      const an = avgNet0 / Math.pow(1.07, k), netY = strength * an, cs = Math.max(0.02, Math.min(0.2, concPct0 / 100 * (0.9 + 0.2 * R())));
      const grossY = netY / (1 - cs), concT = grossY - netY, coll = netY * (0.86 + 0.1 * R()), osY = netY - coll + prevOS * 0.3;
      const newAdm = Math.round(strength * (0.24 + 0.1 * R())), wdAll = Math.round(strength * (0.03 + 0.03 * R())), canc = Math.round(wdAll * (0.3 + 0.3 * R())), wd = wdAll - canc, tin = Math.round(strength * 0.01 * R()), tout = Math.round(strength * 0.01 * R()), tgt = Math.round(strength * (0.98 + 0.14 * R()));
      const mw = [.30, .12, .10, .08, .06, .05, .06, .05, .04, .06, .04, .04];
      HIST[b.id][ay] = { strength, target: tgt, capacity: Math.round(Math.max(tgt, strength) * (1.05 + 0.15 * R()) / 10) * 10, newAdm, renewals: strength - newAdm, withdrawals: wd, cancellations: canc, transfersIn: tin, transfersOut: tout, newTarget: Math.round(newAdm * (1 + 0.12 * R())), renewTarget: Math.round((strength - newAdm) * (1 + 0.05 * R())), gross: grossY, conc: concT * 0.6, schol: concT * 0.4, net: netY, revTarget: tgt * an, demand: netY + prevOS, collected: coll + prevOS * 0.7, outstanding: osY, openOS: prevOS, zpAmt: osY * (0.15 + 0.2 * R()), monthCol: mw.map(w => coll * w) };
      prevOS = osY;
    }
    if (['B05', 'B33'].includes(b.id)) return; // no plan yet (shows as "missing target plan")
    let target = Math.round(n * (bi % 8 === 0 ? 0.96 : 1.02 + 0.14 * R()));
    if (['B10', 'B44'].includes(b.id)) target = Math.round(Object.values(CAP_BASE[b.id]).reduce((a, x) => a + x, 0) * 1.06); // target above capacity
    const avgGross = n ? gross / n : 0, avgNet = n ? net / n : 0, concPct = gross ? (1 - net / gross) * 100 : 0;
    const v = { target, avgGross: Math.round(avgGross), concPct: Math.round(concPct * 10) / 10, avgNet: Math.round(avgNet), revTarget: Math.round(target * avgNet * (1 + 0.06 * R())), completion: '2026-12-31', remarks: 'Demo target for AY 2026-27' };
    plans[b.id] = { approved: Object.assign({}, v, { approvedBy: 'CEO (demo)', approvedAt: '2026-03-15T10:00:00+05:30', override: ['B10', 'B44'].includes(b.id) ? 'Approved above capacity: extra sections planned (demo)' : '' }), pending: null, status: 'Approved', classTargets: {} };
  });
  return { plans, history: [] };
}
function defaultCapacity() { return { entries: [] }; }
function defaultAdmPlans() {
  const P = {};
  DATA.branches.forEach((b, bi) => { const L = DATA.leads[bi]; P[b.id] = { start: '2026-10-01', completion: '2026-12-31', workDays: '', walkins: L ? Math.max(1, Math.round(L.months[8].walkins / 25)) : '', conv: L ? Math.round(L.conv * 100) : '', avgNet: '', monthlyTarget: '', catTargets: '', principal: '', head: '', counsellor: '', bd: '' }; });
  return P;
}

Store.init({ exits: { list: [] }, categories: defaultCategories(), targets: demoTargets(), capacity: defaultCapacity(), admplans: defaultAdmPlans(), branchmeta: {}, histimport: {} });
