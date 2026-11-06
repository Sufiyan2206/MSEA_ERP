/* ===== Payroll cycle & phased salary disbursement. HR prepares payroll → Finance reconciles → CFO approves (payroll and each release batch) → HR processes the bank file → Finance reconciles the payment. Layered on the Payroll module (runs, lines, bank details). ===== */
const PSD_SEED_VER = 2;
const PSD_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const psdMonth = ym => ym ? `${PSD_MONTHS[+ym.slice(5, 7) - 1]} ${ym.slice(0, 4)}` : '';
const psdPrevYm = ym => { const d = new Date(ym + '-01T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() - 1); return d.toISOString().slice(0, 7); };
const PSD_MG = ['Senior Management', 'Directors', 'Managers'];
const PSD_INST = ['School', 'Junior College', 'Degree College', 'Corporate Office'];
const PSD_MODES = ['NEFT', 'RTGS', 'IMPS', 'Cheque'];
const PSD_FORMATS = ['HDFC Enet (bulk NEFT)', 'ICICI CIB bulk upload', 'SBI CMP bulk upload', 'Generic CSV'];
/* payroll cycle (month level) */
const PSD_PROC = ['Submitted to Finance', 'Under Finance reconciliation', 'Returned to Finance', 'Submitted to CFO', 'On Hold', 'CFO Approved', 'CFO Partially Approved'];
const PSD_APPR = ['CFO Approved', 'CFO Partially Approved'];
const PSD_BATCHOK = ['Under Finance reconciliation', 'Returned to Finance', 'Submitted to CFO', 'CFO Approved', 'CFO Partially Approved'];
const PSD_LOCKED = ['Submitted to Finance', 'Under Finance reconciliation', 'Returned to Finance', 'Submitted to CFO', 'On Hold', 'CFO Approved', 'CFO Partially Approved'];
/* release batch */
const PSD_BREADY = ['CFO Approved', 'CFO Partially Approved', 'Ready for Bank Processing'];
const PSD_BOPEN = ['Bank File Generated', 'Uploaded to Bank', 'Under Bank Processing'];
const PSD_BDONE = ['Paid', 'Partially Paid', 'Failed', 'Reconciliation Pending', 'Reconciled and Closed'];
const PSD_SENT = [...PSD_BREADY, ...PSD_BOPEN, ...PSD_BDONE];
const PSD_FILEOUT = [...PSD_BOPEN, ...PSD_BDONE];
const PSD_LIVE = b => !['Rejected', 'Cancelled', 'Returned'].includes(b.status);
const PSD_STAT = ['Payroll not processed', 'Payroll processed', 'Pending management approval', 'Approved for release', 'Included in payment batch', 'Payment initiated', 'Salary paid', 'Partially paid', 'On hold', 'Rejected / returned', 'Pending due to insufficient funds', 'Payment failed / returned', 'Payment under correction'];
/* colour: g = fully paid, y = part-paid / scheduled, r = pending / overdue, n = on hold (grey), x = not processed */
const PSD_COL = { 'Payroll not processed': 'x', 'Payroll processed': 'r', 'Pending management approval': 'y', 'Approved for release': 'y', 'Included in payment batch': 'y', 'Payment initiated': 'y', 'Salary paid': 'g', 'Partially paid': 'y', 'On hold': 'n', 'Rejected / returned': 'r', 'Pending due to insufficient funds': 'r', 'Payment failed / returned': 'r', 'Payment under correction': 'y' };
/* what an employee is allowed to see: no fund position, no management or CFO wording, no other groups */
const PSD_SELF = { 'Payroll not processed': 'Payroll under process', 'Payroll processed': 'Payroll under process', 'Included in payment batch': 'Payroll under process', 'Pending due to insufficient funds': 'Payroll under process', 'On hold': 'Payroll under process', 'Rejected / returned': 'Payroll under process', 'Pending management approval': 'Pending CFO approval', 'Approved for release': 'Approved for payment', 'Payment initiated': 'Submitted to bank', 'Salary paid': 'Salary credited', 'Partially paid': 'Salary partially paid', 'Payment failed / returned': 'Payment failed / returned', 'Payment under correction': 'Payment under correction' };
const PSD_EXC = ['Verified', 'Clarification required from HR', 'Corrected by HR', 'Approved with justification', 'Rejected', 'On hold'];
function defaultPSD() {
  return {
    seedVer: 0, stamp: 0, seq: { f: 0, c: 0, t: 0, r: 0 }, funds: [], batches: [], pay: [], holds: {}, defer: {}, comms: [], log: [], cycles: {}, tickets: [], prr: [],
    cfg: {
      blockOverFunds: true, dueDay: 7, apiOn: false, apiKey: '', varPct: 10, varAmt: 10000, cfoPartial: true, payslipPolicy: 'bank', reprocessBy: 'CFO',
      makers: ['Payroll Executive', 'HR Officer'], authorisers: ['HR Admin', 'Corporate HR'],
      rules: [{ id: 'R1', name: 'All salary release batches', cat: 'Any', min: 0, chain: ['CFO'] }],
      tpl: [
        { id: 'T1', name: 'Processed and scheduled', text: 'Dear {name}, your salary for {month} has been processed and is scheduled for release.' },
        { id: 'T2', name: 'Credited', text: 'Dear {name}, your salary payment for {month} has been credited.' },
        { id: 'T3', name: 'Under process', text: 'Dear {name}, your salary payment for {month} is under process. For clarification, please contact HR.' }
      ]
    }
  };
}
Store.init({ psd: defaultPSD() });
const PSD = () => Store.get('psd');
let PSD_CACHE = {};
const psdCan = a => !!App.user && can('psd_home', a);
const psdYm = () => App.ui.psdYm || PROC_TODAY.slice(0, 7);
const psdRun = ym => (PYT().runs || []).find(r => r.ym === ym) || null;
const psdCycle = ym => PSD().cycles[ym] || null;
const psdCs = ym => { const c = psdCycle(ym), r = psdRun(ym); return c ? c.status : (r && r.status === 'Paid' ? 'Paid (before phased release)' : 'Under preparation'); };
async function psdEdit(fn) { const d = Store.clone(PSD()); const r = fn(d); if (r === false) return false; d.stamp = (d.stamp || 0) + 1; await Store.put('psd', d); PSD_CACHE = {}; return r === undefined ? true : r; }
function psdLog(d, action, remark = '', x = {}) { d.log = d.log || []; d.log.push(Object.assign({ at: nowIso(), by: App.user ? App.user.name : 'System', byId: App.user ? App.user.id : '', role: App.user ? App.user.role : '', action, remark }, x)); }
const psdSeq = (d, k) => { d.seq[k] = (d.seq[k] || 0) + 1; return d.seq[k]; };
const psdIsHR = (u = App.user) => !!u && userRoles(u).some(r => ['Payroll Executive', 'HR Admin', 'Corporate HR', 'HR Officer', 'Branch HR'].includes(r));
/* the payroll run follows the cycle: Draft while HR prepares, Submitted while with Finance / CFO, Approved after CFO approval */
async function psdSetRun(ym, status, locked) { const P = Store.clone(PYT()), r = P.runs.find(x => x.ym === ym); if (!r) return; r.status = status; r.locked = locked; r.ver = (r.ver || 0) + 1; await Store.put('payroll', P); PY_CACHE = {}; PSD_CACHE = {}; }

/* ---------- employee grouping (management group is derived from designation / grade) ---------- */
function psdMg(l) { const ds = l.desig || ''; if (/Director/.test(ds)) return 'Directors'; if (/^(CEO|CFO|COO|CTO|Chairman)/.test(ds) || l.grade === 'G9') return 'Senior Management'; if (/Manager|Principal/.test(ds)) return 'Managers'; return ''; }
function psdDecor(l) { const b = DATA.branches.find(x => x.id === l.bid), e = hrEmp(l.emp) || {}; return Object.assign({}, l, { inst: b ? b.type : 'Corporate Office', zone: b ? b.zone : 'Head Office', region: b ? b.region : 'Head Office', entity: e.entity || 'MSEWT', mg: psdMg(l), brName: l.bid ? hrBr(l.bid) : 'Head Office' }); }

/* ---------- per-month state: every employee's status, paid, committed and batch history ---------- */
function psdBuild(ym) {
  const D = PSD(), run = psdRun(ym), cyc = D.cycles[ym], key = `${ym}|${D.stamp || 0}|${run ? run.status + (run.ver || 0) : '-'}|${hrEmps().length}`;
  if (PSD_CACHE[ym] && PSD_CACHE[ym].key === key) return PSD_CACHE[ym];
  const cs = cyc ? cyc.status : 'Under preparation';
  const S = { key, ym, run, cs, rows: [], by: {}, legacy: false, proc: false, appr: false };
  S.legacy = !!run && !cyc && run.status === 'Paid' && !D.batches.some(b => b.ym === ym);
  S.proc = S.legacy || (!!run && PSD_PROC.includes(cs)); S.appr = PSD_APPR.includes(cs);
  if (S.proc) {
    const seenE = new Set(); const lines = pyLines(run).filter(l => !l.excluded && !seenE.has(l.emp) && seenE.add(l.emp)).map(psdDecor);
    const batches = D.batches.filter(b => b.ym === ym);
    const items = {}; batches.forEach(b => b.items.forEach(it => (items[it.emp] = items[it.emp] || []).push({ b, it })));
    const pays = {}; D.pay.filter(p => p.ym === ym).forEach(p => (pays[p.emp] = pays[p.emp] || []).push(p));
    const tks = {}; D.tickets.filter(t => t.ym === ym && !['Resolved', 'Closed'].includes(t.status)).forEach(t => (tks[t.emp] = tks[t.emp] || []).push(t));
    lines.forEach(l => {
      const net = l.net, ps = pays[l.emp] || [], paid = S.legacy ? (l.hold ? 0 : net) : ps.filter(p => p.status === 'Paid').reduce((s, p) => s + p.amount, 0);
      const its = (items[l.emp] || []).slice().sort((a, b) => a.b.createdAt < b.b.createdAt ? -1 : 1);
      const live = its.filter(x => PSD_LIVE(x.b));
      const paidIn = b => ps.filter(p => p.batch === b.id && p.status === 'Paid').reduce((s, p) => s + p.amount, 0);
      const failedIn = b => ps.some(p => p.batch === b.id && p.status === 'Failed');
      const committed = live.reduce((s, x) => s + (x.b.settled ? paidIn(x.b) : failedIn(x.b) ? 0 : x.it.rel), 0);
      const hold = D.holds[ym + '|' + l.emp] || null, payHold = l.hold || '';
      const open = live.filter(x => !x.b.settled && !failedIn(x.b)).pop(), lastBad = its.filter(x => !PSD_LIVE(x.b)).pop();
      const failed = ps.some(p => p.status === 'Failed') && !ps.some(p => p.status === 'Initiated');
      const rel = S.legacy ? paid : live.filter(x => PSD_SENT.includes(x.b.status)).reduce((s, x) => s + (x.b.settled ? paidIn(x.b) : x.it.rel), 0);
      const tk = tks[l.emp] || [];
      let st;
      if (net > 0 && paid >= net - 0.5) st = 'Salary paid';
      else if (hold || payHold || (open && open.b.status === 'On Hold') || cs === 'On Hold') st = 'On hold';
      else if (paid > 0) st = 'Partially paid';
      else if (open) st = ({ Draft: 'Included in payment batch', 'Submitted to CFO': 'Pending management approval', 'CFO Approved': 'Approved for release', 'CFO Partially Approved': 'Approved for release', 'Ready for Bank Processing': 'Approved for release', 'Bank File Generated': 'Payment initiated', 'Uploaded to Bank': 'Payment initiated', 'Under Bank Processing': 'Payment initiated' })[open.b.status] || 'Included in payment batch';
      else if (failed && !live.some(x => !x.b.settled)) st = tk.some(t => ['Reprocess requested', 'Under correction'].includes(t.status)) ? 'Payment under correction' : 'Payment failed / returned';
      else if (lastBad && !live.length) st = 'Rejected / returned';
      else if (D.defer[ym + '|' + l.emp]) st = 'Pending due to insufficient funds';
      else st = cs === 'Submitted to CFO' ? 'Pending management approval' : 'Payroll processed';
      const avail = (hold || payHold) ? 0 : Math.max(0, Math.round((net - committed) * 100) / 100);
      const dates = ps.filter(p => p.status === 'Paid').map(p => p.at.slice(0, 10)).sort();
      const r = Object.assign({}, l, { status: st, col: PSD_COL[st], rel: Math.min(rel, net), paid: Math.min(paid, net), bal: Math.max(0, net - paid), committed, avail, hold: hold ? hold.reason : payHold, holdSrc: hold ? 'Finance' : payHold ? 'Payroll' : '', hist: ps.slice().sort((a, b) => a.at < b.at ? -1 : 1), dates, its, def: D.defer[ym + '|' + l.emp] || null, legacy: S.legacy, paidOn: S.legacy ? run.paidOn : '', tickets: tk });
      S.rows.push(r); S.by[l.emp] = r;
    });
  } else {
    S.pre = true; S.rows = pyEmployeesFor(ym).map(e => { const l = { emp: e.id, name: e.name, bid: e.bid, dept: e.dept, desig: e.desig, cat: e.cat, grade: e.grade, type: e.type, gross: 0, ded: 0, net: 0, bank: '', acct: '', ifsc: '', hold: '' }; return Object.assign(psdDecor(l), { status: 'Payroll not processed', col: 'x', rel: 0, paid: 0, bal: 0, committed: 0, avail: 0, holdSrc: '', hist: [], dates: [], its: [], def: null, tickets: [] }); }); S.rows.forEach(r => { S.by[r.emp] = r; });
  }
  PSD_CACHE[ym] = S; return S;
}
const psdDue = ym => { const [y, m] = ym.split('-').map(Number), d = new Date(Date.UTC(y, m, +(PSD().cfg.dueDay || 7))); return d.toISOString().slice(0, 10); };
const psdOverdue = (ym, r) => r.bal > 0 && r.status !== 'On hold' && PROC_TODAY > psdDue(ym);
function psdVisible(rows) { const S = hrScope(); return rows.filter(r => S.has(r.bid || '')); }
/* the payroll must not change after HR submits it: compare today's figures with the submission snapshot */
function psdIntegrity(ym) { const c = psdCycle(ym), run = psdRun(ym); if (!c || !c.snap || !run || !PSD_LOCKED.includes(c.status)) return { ok: true, msg: '' }; const L = pyLines(run).filter(l => !l.excluded); const n = L.length, net = L.reduce((s, l) => s + l.net, 0); if (n !== c.snap.n || Math.abs(net - c.snap.net) > 1) return { ok: false, msg: `Payroll for ${psdMonth(ym)} has changed since HR submitted it (${c.snap.n} employees / ${INR(c.snap.net)} then, ${n} / ${INR(net)} now). Raise a Payroll Revision Request.` }; return { ok: true, msg: '' }; }

/* ---------- funds ---------- */
const psdAccounts = () => (BKM().accounts || []).filter(a => a.status !== 'Closed');
const psdAcctLabel = gl => { const a = (BKM().accounts || []).find(x => x.gl === gl); return a ? `${a.bank} · ${a.acct.slice(0, 2)}…${a.acct.slice(-4)} (${a.entity})` : gl; };
const psdFundNet = f => Math.max(0, (f.balance || 0) - (f.statutory || 0) - (f.critical || 0));
function psdFundUse(D, fid, exceptId) { return D.batches.filter(b => b.fundId === fid && b.id !== exceptId && PSD_LIVE(b)).reduce((s, b) => s + b.approved, 0); }
const psdFundLeft = (D, f, exceptId) => psdFundNet(f) - psdFundUse(D, f.id, exceptId);
/* budgeted salary cost for a month, from the Finance budgets on salaries (GL 5001) */
function psdBudget(ym) { const fy = +ym.slice(5, 7) >= 4 ? `${ym.slice(0, 4)}-${String(+ym.slice(2, 4) + 1)}` : `${+ym.slice(0, 4) - 1}-${ym.slice(2, 4)}`; const B = (FM().budgets || []).filter(b => b.gl === '5001' && (!b.fy || b.fy === fy)); const by = {}; B.forEach(b => { by[b.bid || ''] = (by[b.bid || ''] || 0) + b.annual / 12; }); return { total: B.reduce((s, b) => s + b.annual / 12, 0), by, n: B.length }; }

/* ---------- batches ---------- */
function psdTotals(b) { b.n = b.items.length; b.gross = b.items.reduce((s, i) => s + i.gross, 0); b.ded = b.items.reduce((s, i) => s + i.ded, 0); b.net = b.items.reduce((s, i) => s + i.net, 0); b.approved = Math.round(b.items.reduce((s, i) => s + i.rel, 0) * 100) / 100; return b; }
const PSD_FKEYS = [['entity', 'Company / entity'], ['bid', 'Branch / location'], ['zone', 'Zone'], ['region', 'Region'], ['dept', 'Department'], ['cat', 'Employee category'], ['inst', 'Institution type'], ['desig', 'Designation'], ['grade', 'Grade'], ['etype', 'Employment type'], ['mg', 'Management group'], ['bank', 'Employee bank']];
function psdMatch(r, f) {
  for (const [k] of PSD_FKEYS) { const want = f[k]; if (!want) continue; const have = k === 'etype' ? r.type : r[k]; if (k === 'cat' && want === 'Non-teaching') { if (r.cat === 'Teaching') return false; continue; } if (have !== want) return false; }
  if (f.ids && f.ids.length && !f.ids.includes(r.emp)) return false;
  return true;
}
function psdFilterText(f) { const p = PSD_FKEYS.filter(([k]) => f[k]).map(([k, l]) => `${l}: ${k === 'bid' ? hrBr(f[k]) : f[k]}`); if (f.ids && f.ids.length) p.push(`${f.ids.length} selected employee${f.ids.length > 1 ? 's' : ''}`); return p.join(' · ') || 'All employees'; }
function psdAutoName(ym, f, n) { const lbl = f.mg ? f.mg : f.ids && f.ids.length ? 'Selected staff' : f.inst && f.cat ? `${f.inst} ${f.cat === 'Teaching' ? 'Teaching' : 'Non-Teaching'} Staff` : f.inst ? `${f.inst} Staff` : f.cat ? (f.cat === 'Teaching' ? 'Teaching Staff' : 'Non-Teaching Staff') : f.bid ? hrBr(f.bid) : f.zone ? `${f.zone} Zone` : f.dept ? `${f.dept} Department` : 'All staff'; return `${psdMonth(ym)} – ${lbl} – Batch ${n}`; }
const psdBatchNo = (D, ym) => D.batches.filter(b => b.ym === ym).length + 1;
function psdKind(items) { const rows = items.map(i => i.mg ? 'M' : i.cat === 'Teaching' ? 'T' : 'N'); if (rows.includes('M')) return 'Management group'; if (rows.every(x => x === 'T')) return 'Teaching'; if (rows.every(x => x === 'N')) return 'Non-teaching'; return 'Mixed'; }
function psdChainFor(D, kind, amt) { const r = D.cfg.rules.find(x => (x.cat === 'Any' || x.cat === kind) && amt >= (x.min || 0)) || D.cfg.rules[D.cfg.rules.length - 1]; return { rule: r, chain: r.chain.map(role => ({ role, label: role, status: 'Pending', by: '', at: '', remark: '' })) }; }
/* the items for a new batch from the pool of employees whose payroll is with Finance or approved */
function psdPlan(ym, f, o = {}) {
  const S = psdBuild(ym); const ok = S.proc && !S.legacy && PSD_BATCHOK.includes(S.cs);
  const all = S.rows.filter(r => psdMatch(r, f)); const sel = (o.drop ? all.filter(r => !o.drop.includes(r.emp)) : all);
  const elig = ok ? sel.filter(r => r.avail > 0 && !['On hold', 'Salary paid'].includes(r.status)) : [];
  return { all, sel, elig, skipped: sel.length - elig.length, tot: { n: sel.length, gross: sel.reduce((s, r) => s + r.gross, 0), ded: sel.reduce((s, r) => s + r.ded, 0), net: sel.reduce((s, r) => s + r.net, 0), pay: elig.reduce((s, r) => s + r.avail, 0) }, ok };
}
function psdItem(r) { return { emp: r.emp, name: r.name, bid: r.bid, dept: r.dept, desig: r.desig, cat: r.cat, grade: r.grade, mg: r.mg, inst: r.inst, gross: r.gross, ded: r.ded, net: r.net, rel: r.avail, bankName: r.bank, acct: r.acct, ifsc: r.ifsc, mod: '' }; }
/* approvers: the next level of a batch's route (CFO first; others only where configured) */
function psdCanAct(b, u = App.user) { if (!u || u.status !== 'Active' || !['Submitted to CFO', 'On Hold'].includes(b.status) || !psdCan('Approve')) return false; const L = b.chain[b.level]; if (!L) return false; if (u.id === b.preparedById) return false; if (b.chain.some(c => c.status === 'Approved' && c.byId === u.id)) return false; return u.role === 'Super Admin' || userRoles(u).includes(L.role); }
const psdAwaiting = b => { const L = b.chain && b.chain[b.level]; return b.status === 'Submitted to CFO' && L ? L.role : ''; };
function psdNotify(role, text, ref) { try { const us = users().filter(u => u.status === 'Active' && userRoles(u).includes(role)); if (us.length) fnNotify(us.map(u => u.id), text, ref, 'psd_home'); } catch (e) { } }
function psdRefs(b) { return b.items.map((i, k) => ({ ref: `${b.no.replace(/[^A-Z0-9]/gi, '')}${String(k + 1).padStart(4, '0')}`, item: i })); }
/* bank file contents, in the format of the chosen bank; only for a batch that has CFO approval */
const PSD_IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/;
function psdBankCheck(b) {
  if (!PSD_SENT.includes(b.status)) return ['A payment file can be made only for a batch with CFO approval.'];
  const S = psdBuild(b.ym), E = []; const seen = {};
  b.items.forEach(i => { if (i.rel <= 0) return; const r = S.by[i.emp]; if (!i.name) E.push(`${i.emp}: no name`); if (!/^\d{9,18}$/.test(i.acct || '')) E.push(`${i.name} (${i.emp}): account number is missing or invalid`); if (!PSD_IFSC.test((i.ifsc || '').toUpperCase())) E.push(`${i.name} (${i.emp}): IFSC is missing or invalid`); if (!(i.rel > 0)) E.push(`${i.name}: amount`); if (r && !i.corrected && (r.acct !== i.acct || r.ifsc !== i.ifsc)) E.push(`${i.name} (${i.emp}): bank details changed after CFO approval – raise a Payroll Revision Request`); if (i.acct) { (seen[i.acct] = seen[i.acct] || []).push(i.name); } });
  const okDup = new Set((typeof psdExList === 'function' ? psdExList(b.ym) : []).filter(x => x.code === 'DUPBANK' && ['Verified', 'Approved with justification', 'Corrected by HR'].includes(x.dec)).map(x => x.name)); Object.entries(seen).forEach(([a, n]) => { if (n.length > 1 && !n.every(x => okDup.has(x))) E.push(`Account ${psdMaskA(a)} is used by ${n.length} employees (${n.slice(0, 3).join(', ')})`); });
  return E;
}
const psdMaskA = a => a ? '••••' + String(a).slice(-4) : '—';
function psdBankRows(b, fmt) {
  if (!PSD_SENT.includes(b.status)) throw new Error('A payment file can be generated only for a batch with CFO approval.');
  fmt = fmt || b.format || PSD_FORMATS[0]; const R = psdRefs(b).filter(x => x.item.rel > 0), mode = b.mode;
  if (/HDFC/.test(fmt)) return R.map(({ ref, item }, k) => ({ 'Sr': k + 1, 'Transaction Type': mode === 'RTGS' ? 'R' : mode === 'IMPS' ? 'I' : 'N', 'Beneficiary Account Number': item.acct, 'Amount': item.rel, 'Beneficiary Name': item.name, 'IFSC': item.ifsc, 'Beneficiary Bank': item.bankName, 'Customer Reference': ref, 'Employee ID': item.emp, 'Narration': `Salary ${psdMonth(b.ym)}` }));
  if (/ICICI/.test(fmt)) return R.map(({ ref, item }) => ({ 'PYMT_PROD_TYPE_CODE': 'PAB_VENDOR', 'PYMT_MODE': mode, 'DEBIT_ACC_NO': (psdAcctOf(b) || {}).acct || '', 'BNF_NAME': item.name, 'BENE_ACC_NO': item.acct, 'BENE_IFSC': item.ifsc, 'AMOUNT': item.rel, 'REMARKS': `Salary ${psdMonth(b.ym)}`, 'CUSTOMER_REF_NO': ref, 'Employee ID': item.emp }));
  if (/SBI/.test(fmt)) return R.map(({ ref, item }) => ({ 'Beneficiary Name': item.name, 'Beneficiary Account': item.acct, 'IFSC': item.ifsc, 'Amount': item.rel, 'Payment Type': mode, 'Reference': ref, 'Employee ID': item.emp }));
  return R.map(({ ref, item }) => ({ 'Payment reference': ref, 'Employee name': item.name, 'Employee ID': item.emp, 'Bank name': item.bankName, 'Account number': item.acct, 'IFSC': item.ifsc, 'Net amount approved': item.rel, 'Narration': `Salary ${psdMonth(b.ym)}` }));
}
const psdAcctOf = b => (BKM().accounts || []).find(a => a.gl === b.acct) || null;
const psdRowAmt = r => r['Net amount approved'] != null ? r['Net amount approved'] : r['Amount'] != null ? r['Amount'] : r['AMOUNT'];

/* ---------- exception tickets for HR ---------- */
function psdTicket(d, b, emp, type, amount, note) { const e = hrEmp(emp) || {}; const t = { id: 'TK' + (d.tickets.length + 1), no: 'EXC/' + b.ym + '/' + String(psdSeq(d, 't')).padStart(4, '0'), ym: b.ym, batch: b.id, batchNo: b.no, emp, name: e.name || emp, type, amount, note, status: 'Open', createdAt: nowIso(), createdBy: App.user ? App.user.name : 'System', log: [{ at: nowIso(), by: App.user ? App.user.name : 'System', action: 'Raised', remark: note }] }; d.tickets.push(t); return t; }

/* ---------- applying a bank result (HR upload of the bank's success / failed report, a button, or the bank API) ---------- */
function psdApplyConfirm(d, b, rows, o = {}) {
  const refs = Object.fromEntries(psdRefs(b).map(x => [x.ref, x.item])); const out = { ok: 0, partial: 0, failed: 0, dup: 0, excess: 0, unknown: [] };
  rows.forEach(r => {
    const it = refs[r.ref]; if (!it) { out.unknown.push(r.ref); return; }
    const st = String(r.status || 'Success').toLowerCase(); const failedRow = /fail|reject|return/.test(st); const amt = r.amount == null || r.amount === '' ? it.rel : +r.amount;
    const at = (r.date ? r.date + 'T12:00:00+05:30' : nowIso());
    const prior = d.pay.find(p => p.batch === b.id && p.emp === it.emp && ['Paid', 'Failed'].includes(p.status));
    if (prior) { if (!failedRow && prior.status === 'Paid') { out.dup++; psdTicket(d, b, it.emp, 'Duplicate payment', amt, `Bank reported the payment again (${r.ref}${r.utr ? ', ' + r.utr : ''}). Already credited ${INR(prior.amount)}.`); psdLog(d, 'Duplicate payment reported', `${it.name} · ${INR(amt)}`, { batch: b.id, emp: it.emp, ym: b.ym }); } return; }
    const e = d.pay.find(p => p.batch === b.id && p.emp === it.emp);
    const rec = e || { id: 'PAY' + (d.pay.length + 1), batch: b.id, ym: b.ym, emp: it.emp, ref: r.ref, amount: 0, status: 'Initiated', at, utr: '', reason: '' }; if (!e) d.pay.push(rec);
    if (failedRow) { rec.status = 'Failed'; rec.amount = 0; rec.reason = r.reason || 'Bank returned the payment'; rec.at = at; out.failed++; psdTicket(d, b, it.emp, /return/.test(st) ? 'Returned payment' : 'Failed payment', it.rel, rec.reason); psdLog(d, 'Payment failed', `${it.name} · ${rec.reason}`, { batch: b.id, emp: it.emp, ym: b.ym }); }
    else { rec.status = 'Paid'; rec.amount = Math.min(amt, it.rel); rec.utr = r.utr || o.utr || ''; rec.at = at; rec.reason = ''; if (amt > it.rel + 0.5) { out.excess++; rec.reason = 'Bank credited more than approved'; psdTicket(d, b, it.emp, 'Excess payment', amt - it.rel, `Bank credited ${INR(amt)} against ${INR(it.rel)} approved.`); psdLog(d, 'Excess payment', `${it.name} · ${INR(amt)} against ${INR(it.rel)}`, { batch: b.id, emp: it.emp, ym: b.ym }); } else if (amt < it.rel - 0.5) { out.partial++; rec.reason = r.reason || o.reason || 'Short credit'; psdTicket(d, b, it.emp, 'Short payment', it.rel - amt, `Credited ${INR(amt)} against ${INR(it.rel)} approved. ${rec.reason}`); psdLog(d, 'Partial payment', `${it.name} · ${INR(amt)} of ${INR(it.rel)} · ${rec.reason}`, { batch: b.id, emp: it.emp, ym: b.ym }); } else out.ok++; }
  });
  const open = psdRefs(b).filter(x => x.item.rel > 0 && !d.pay.some(p => p.batch === b.id && p.emp === x.item.emp && ['Paid', 'Failed'].includes(p.status)));
  b.paidAmt = d.pay.filter(p => p.batch === b.id && p.status === 'Paid').reduce((s, p) => s + p.amount, 0);
  if (!open.length) { const full = b.items.every(i => i.rel <= 0 || d.pay.some(p => p.batch === b.id && p.emp === i.emp && p.status === 'Paid' && p.amount >= i.rel - 0.5)); b.settled = true; b.status = b.paidAmt <= 0 ? 'Failed' : full ? 'Paid' : 'Partially Paid'; b.pstatus = b.status; b.settledAt = nowIso(); b.reconStatus = 'Pending'; psdLog(d, 'Bank result recorded – ' + b.status, `${b.no} · ${INR(b.paidAmt)} credited`, { batch: b.id, ym: b.ym }); }
  else { b.status = 'Under Bank Processing'; b.pstatus = 'Partly confirmed'; psdLog(d, 'Bank result received', `${b.no} · ${open.length} payment(s) still awaiting the bank`, { batch: b.id, ym: b.ym }); }
  return out;
}
const psdCsvLines = txt => String(txt || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean).map(s => s.split(/[,\t]/).map(x => x.trim().replace(/^"|"$/g, '')));
function psdParseConfirm(txt) { const L = psdCsvLines(txt); if (!L.length) return []; let H = L[0].map(x => x.toLowerCase()); let body = L; if (H.some(x => /^(ref(erence)?|payment ref(erence)?|customer ref(erence)?|status|amount|utr|bank ref(erence)?|date|reason)$/.test(x))) body = L.slice(1); else H = ['ref', 'status', 'amount', 'utr', 'date', 'reason']; const ix = n => H.findIndex(x => x.includes(n)); const c = { ref: ix('ref'), status: ix('status'), amount: ix('amount'), utr: ix('utr'), date: ix('date'), reason: ix('reason') }; return body.map(r => ({ ref: r[c.ref < 0 ? 0 : c.ref], status: c.status < 0 ? 'Success' : r[c.status], amount: c.amount < 0 ? '' : r[c.amount], utr: c.utr < 0 ? '' : r[c.utr], date: c.date < 0 ? '' : r[c.date], reason: c.reason < 0 ? '' : r[c.reason] })).filter(r => r.ref); }
/* automatic result from a bank API connection (enabled and keyed by System Admin) */
window.PSD_API = { confirm(batchNo, rows, key) { const D = PSD(); if (!D.cfg.apiOn || !D.cfg.apiKey || key !== D.cfg.apiKey) return { ok: false, error: 'Bank API confirmation is not enabled, or the key is wrong.' }; const b = D.batches.find(x => x.no === batchNo); if (!b || !PSD_BOPEN.includes(b.status)) return { ok: false, error: 'No batch with a bank file awaiting the bank result: ' + batchNo }; const d = Store.clone(D); const bb = d.batches.find(x => x.id === b.id); const res = psdApplyConfirm(d, bb, rows, {}); d.stamp = (d.stamp || 0) + 1; d.log.push({ at: nowIso(), by: 'Bank API', byId: '', role: 'System', action: 'Result received by API', remark: batchNo, batch: b.id, ym: b.ym }); Store.put('psd', d); PSD_CACHE = {}; return Object.assign({ ok: true }, res); } };

/* ---------- employee notices: controlled templates only ---------- */
const PSD_BAD = /fund|batch|₹|rs\.|\brs\b|balance|management|director|insufficient|hold|cfo|ceo|approval|group|reserve|finance|reconcil/i;
function psdTplOk(text) { if (!text || text.length < 10) return 'Enter the notice text.'; if (PSD_BAD.test(text)) return 'A notice must not mention funds, amounts, batches, holds, Finance, CFO, management decisions or other groups.'; const ph = (text.match(/\{[^}]*\}/g) || []).filter(p => !['{name}', '{month}'].includes(p)); if (ph.length) return 'Only {name} and {month} can be used in a notice.'; return ''; }
const psdTplText = (t, r, ym) => t.text.replace('{name}', r.name.split(' ')[0]).replace('{month}', psdMonth(ym));
/* payslips: released as the policy says (default: only after the bank has credited the salary) */
function psdPayslipOk(ym, emp) { const D = PSD(), c = D.cycles[ym]; if (!c) return true; const pol = D.cfg.payslipPolicy; if (pol === 'manual') return !!c.payslipsAt; if (pol === 'cfo') return PSD_APPR.includes(c.status); const r = psdBuild(ym).by[emp]; return !!r && r.paid > 0; }
function psdEnsureSeed() { const d = PSD(); if (!d) return; if (d.seedVer === PSD_SEED_VER) return; const n = Store.clone(d); n.seedVer = PSD_SEED_VER; const def = defaultPSD(); ['seq', 'funds', 'batches', 'pay', 'holds', 'defer', 'comms', 'log', 'cycles', 'tickets', 'prr'].forEach(k => { if (n[k] == null) n[k] = def[k]; }); n.cfg = Object.assign({}, def.cfg, n.cfg || {}); if (!n.cfg.rules || n.cfg.rules.some(r => r.chain && !r.chain.includes('CFO'))) n.cfg.rules = def.cfg.rules; n.batches.forEach(b => { b.status = ({ 'Pending approval': 'Submitted to CFO', Approved: 'CFO Approved', 'Bank file generated': 'Bank File Generated', 'Part-paid': 'Partially Paid', 'On hold': 'On Hold' })[b.status] || b.status; }); Store.put('psd', n); }
