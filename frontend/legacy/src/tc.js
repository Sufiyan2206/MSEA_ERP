/* ===== Technician Conveyance & Daily Work Report: technician master, daily visits, kilometre-based allowance, approvals, payments, statements =====
   Ported from the MS Education Academy workspace. Records live in the shared 'tcv' document. */
const TCV_SEED_VER = 1;
const TCV_ST = ['Draft', 'Submitted', 'Returned', 'Rejected', 'Manager Verified', 'Finance Approved', 'Payment Created', 'Paid', 'Reversed'];
const TCV_MODES = ['Two-wheeler', 'Four-wheeler', 'Public transport', 'Auto / cab', 'Company vehicle', 'Walking'];
const TCV_TRADES = ['Electrician', 'AC Technician', 'Carpenter', 'Plumber', 'Helper', 'Telephone Technician', 'Civil', 'IT Support', 'General Maintenance'];
const TCV_WORK = ['Electrical', 'AC', 'Carpentry', 'Plumbing', 'Civil', 'IT support', 'Telephone', 'General maintenance', 'Other'];
const TCV_OKST = ['Manager Verified', 'Finance Approved', 'Payment Created', 'Paid'];
const TCV_PERM_LABEL = { tech: 'Technician (own reports)', manager: 'Maintenance Manager (verify)', head: 'Facilities Head (second approval)', finance: 'Finance (approve, pay)', rate: 'Revise rates and policy', admin: 'Administrator (master, settings, migration)', view: 'View all (read only)' };
function TCV_DEF() {
  return {
    rate: 5.5, cutoff: '20:00', maxKmDay: 120, secondApproval: false, dutyStart: '08:00', dutyEnd: '19:00',
    perm: {
      tech: ['Technician'], manager: ['Maintenance Manager'], head: ['CEO', 'Chairman', 'Central Asset Team'],
      finance: ['Finance Manager', 'Finance Admin', 'Corporate Finance', 'Payroll Executive', 'CFO'],
      rate: ['HR Admin', 'Corporate HR', 'Finance Manager', 'Finance Admin', 'CFO'], admin: ['System Admin'],
      view: ['System Admin', 'CEO', 'Chairman', 'Vice Chairman / VCP', 'Maintenance Manager', 'Finance Manager', 'Finance Admin', 'Corporate Finance', 'Payroll Executive', 'CFO', 'Auditor', 'Internal Auditor', 'External Auditor', 'HR Admin', 'Corporate HR', 'Read-Only Management User', 'Regional Director', 'Zonal Director', 'Principal']
    },
    reminders: { techAt: '17:30', managerAfterCutoff: true, escalateMissed: 3 }, budgetMonthly: 40000,
    policy: { modes: [{ mode: 'Two-wheeler', type: 'perKm', rate: 5.5, techRate: true }, { mode: 'Four-wheeler', type: 'perKm', rate: 9 }, { mode: 'Public transport', type: 'actual', cap: 300 }, { mode: 'Auto / cab', type: 'actual', cap: 500 }, { mode: 'Company vehicle', type: 'fixed', amount: 0 }, { mode: 'Walking', type: 'fixed', amount: 0 }], slabs: [], defaultMode: 'Two-wheeler', effFrom: '2026-08-01', hist: [] }
  };
}
function defaultTCV() {
  return {
    seedVer: 0, id: 0, seq: {}, cfg: TCV_DEF(), techs: [], claims: [], pay: [], log: [], migr: [], miss: [],
    cats: [{ code: 'D_C', name: 'Degree Colleges', types: ['Degree College'], kw: '', active: true }, { code: 'J_C', name: 'Junior Colleges', types: ['Junior College'], kw: '', active: true }, { code: 'K_S', name: 'Kids & Schools', types: ['School'], kw: '', active: true }]
  };
}
Store.init({ tcv: defaultTCV() });
let TC_W = null; const TCV_FX = []; let tcvBatch = false;
const TCX = () => TC_W || Store.get('tcv');
function tcvEdit(fn, msg) {
  const c = Store.clone(Store.get('tcv')), prev = TC_W; TC_W = c; let r;
  try { r = fn(c); } catch (e) { TCV_FX.length = 0; throw e; } finally { TC_W = prev; }
  Store.put('tcv', c); if (msg) toast(msg, 'ok');
  TCV_FX.splice(0).forEach(f => { try { f(); } catch (e) { console.error(e); } });
  return r;
}
/* ---------- small helpers ---------- */
const tcvTD = () => PROC_TODAY;
const tcvTime = () => new Date().toTimeString().slice(0, 5);
const tcvNow = () => PROC_TODAY + ' ' + tcvTime();
const tcvIso = () => PROC_TODAY + 'T' + new Date().toISOString().slice(11, 19);
const tcvWho = () => App.user ? App.user.name.replace(' (demo)', '') : 'System';
const tcvRole = () => App.user ? App.user.role : 'System';
const tcvId = () => ++TCX().id;
const tcvInr = n => '₹' + (Math.round((+n || 0) * 100) / 100).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const tcvRealDate = d => /^\d{4}-\d{2}-\d{2}$/.test(d || '') && !isNaN(Date.parse(d));
const tcvCfg = () => { const X = TCX(), d = TCV_DEF(), c = X.cfg; Object.keys(d).forEach(k => { if (c[k] === undefined) c[k] = d[k]; }); Object.keys(d.perm).forEach(k => { if (!c.perm[k]) c.perm[k] = d.perm[k]; }); return c; };
const tcvCan = a => !!App.user && (App.user.role === 'Super Admin' || (tcvCfg().perm[a] || []).includes(App.user.role));
const tcvCentral = () => hrScope(App.user).has('');
const tcvBr = id => DATA.branches.find(b => b.id === id) || null;
const tcvBrName = id => id === 'HO' || id === '' ? 'MS Education Academy · Head Office' : ((tcvBr(id) || {}).name || id || '—');
const tcvBrCode = id => id === 'HO' || id === '' ? 'HO' : ((tcvBr(id) || {}).code || id);
function tcvLog(action, ref, detail, old, nw) {
  const X = TCX(); X.log.unshift({ id: tcvId(), t: tcvNow(), iso: tcvIso(), by: tcvWho(), role: tcvRole(), action, ref: ref || '', detail: detail || '', old: old == null ? '' : String(old), nw: nw == null ? '' : String(nw) });
  if (X.log.length > 8000) X.log.length = 8000;
  if (!tcvBatch) try { audit('Technician Conveyance', action, { old: old == null ? '' : String(old), new: ((ref ? ref + ' · ' : '') + (detail || '')).slice(0, 140) }); } catch (e) { }
}
function tcvNo(p) { const X = TCX(), k = p + PROC_TODAY.slice(0, 4); X.seq[k] = (X.seq[k] || 0) + 1; return p + '/' + PROC_TODAY.slice(0, 4) + '/' + String(X.seq[k]).padStart(4, '0'); }
const tcvWords = n => { n = Math.round(n); const o = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'], t = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']; const w = x => x < 20 ? o[x] : t[Math.floor(x / 10)] + (x % 10 ? ' ' + o[x % 10] : ''); const h = x => (x >= 100 ? o[Math.floor(x / 100)] + ' Hundred' + (x % 100 ? ' ' : '') : '') + (x % 100 ? w(x % 100) : ''); if (!n) return 'Zero Rupees Only'; let s = '', c = Math.floor(n / 1e7), l = Math.floor(n % 1e7 / 1e5), th = Math.floor(n % 1e5 / 1e3), r = n % 1e3; if (c) s += h(c) + ' Crore '; if (l) s += h(l) + ' Lakh '; if (th) s += h(th) + ' Thousand '; if (r) s += h(r); return s.trim() + ' Rupees Only'; };
const tcvDaysIn = ym => new Date(+ym.slice(0, 4), +ym.slice(5, 7), 0).getDate();
const tcvSunday = (ym, d) => new Date(ym + '-' + String(d).padStart(2, '0') + 'T00:00:00Z').getUTCDay() === 0;
/* ---------- categories: a branch belongs to one category by its institution type ---------- */
function tcvCatOf(b) {
  const s = typeof b === 'object' ? b : tcvBr(b); if (!s) return ''; const cats = TCX().cats.filter(c => c.active);
  const c = cats.find(c => (c.kw || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean).some(k => (s.name || '').toLowerCase().includes(k))) || cats.find(c => (c.types || []).includes(s.type));
  return c ? c.code : (cats[0] || {}).code || '';
}
const tcvCatName = code => (TCX().cats.find(c => c.code === code) || { name: code }).name;
function tcvCatSave(o, code) {
  if (!tcvCan('admin')) throw new Error('Only the administrator adds categories.');
  if (!/^[A-Z]_[A-Z]$|^[A-Z0-9_]{2,6}$/.test((o.code || '').trim())) throw new Error('Use a code like D_C, J_C or K_S.');
  if ((o.name || '').trim().length < 3) throw new Error('Name the category.');
  const X = TCX(); let c = code ? X.cats.find(x => x.code === code) : null;
  if (!c) { if (X.cats.some(x => x.code === o.code.trim())) throw new Error('This code is already used.'); c = { code: o.code.trim(), active: true }; X.cats.push(c); }
  Object.assign(c, { name: o.name.trim(), types: o.types || [], kw: (o.kw || '').trim(), active: o.active !== false }); tcvLog('Category saved', c.code, c.name);
}
const tcvCatBranch = code => { const bs = DATA.branches.filter(b => !b.closed); return bs.find(b => tcvCatOf(b) === code) || DATA.branches.find(b => tcvCatOf(b) === code) || bs[0]; };
/* ---------- technician master (linked to HR) ---------- */
const tcvTech = id => TCX().techs.find(t => t.id === id);
const tcvTechOfUser = uid => TCX().techs.find(t => t.userId && t.userId === uid) || null;
const tcvMe = () => App.user ? tcvTechOfUser(App.user.id) : null;
const tcvEmpRec = t => t && t.emp ? hrEmp(t.emp) : null;
function tcvMgrFor(t) { const u = t.managerUser ? userById(t.managerUser) : null; return u && u.status === 'Active' ? u : (pcUsersByRole('Maintenance Manager')[0] || null); }
function tcvHrHeal() {
  const X = Store.get('tcv'); if (!X || !HRT() || !(HRT().seedVer > 0)) return; const miss = X.techs.filter(t => t.emp && !hrEmp(t.emp)); if (!miss.length) return;
  const tx = Store.clone(HRT()), tpl = hrEmps().find(e => e.bid === '' && e.dept === 'Administration') || hrEmps().find(e => e.bid === '') || hrEmps()[0]; if (!tpl) return; let mx = 0;
  miss.forEach(t => { const e = Object.assign(JSON.parse(JSON.stringify(tpl)), { id: t.emp, login: '', name: t.name, dept: 'Administration', desig: t.desig || t.trade, cat: 'Non-teaching', grade: 'G2', bid: '', mobile: t.mobile || '', email: '', officialEmail: '', manager: '', managerUser: '', doj: '2024-04-01', confirmDate: '2024-10-01', status: 'Active', uan: '', pf: '', esi: '', pan: '', aadhaar: '', ctc: 0, payrollEligible: false, docsVerified: false, photo: '', userMade: true, tcvDemo: true, log: [{ at: nowIso(), by: 'System', role: 'System', action: 'Employee restored', remark: 'Conveyance technician record re-created after an HR reseed' }] }); tx.newEmps = (tx.newEmps || []).concat([e]); const n = parseInt(String(t.emp).replace(/\D/g, ''), 10) - 2000; if (n > mx) mx = n; });
  tx.seq = tx.seq || {}; tx.seq.EMP = Math.max(tx.seq.EMP || 0, mx); Store.put('hr_tx', tx);
}
function tcvHrCreate(name, trade, mobile) {
  const tx = Store.clone(HRT()); const tpl = hrEmps().find(e => e.bid === '' && e.dept === 'Administration') || hrEmps().find(e => e.bid === '') || hrEmps()[0]; if (!tpl) return '';
  const e = Object.assign(JSON.parse(JSON.stringify(tpl)), { id: hrNo(tx, 'EMP'), login: '', name, dept: 'Administration', desig: trade, cat: 'Non-teaching', grade: 'G2', bid: '', mobile: mobile || '', email: '', officialEmail: '', manager: '', managerUser: '', doj: '2024-04-01', confirmDate: '2024-10-01', status: 'Active', uan: '', pf: '', esi: '', pan: '', aadhaar: '', ctc: 0, payrollEligible: false, docsVerified: false, photo: '', userMade: true, tcvDemo: true, log: [{ at: tcvIso(), by: tcvWho(), role: tcvRole(), action: 'Employee created', remark: 'Enrolled as a conveyance technician' }] });
  tx.newEmps = (tx.newEmps || []).concat([e]); Store.put('hr_tx', tx); return e.id;
}
function tcvTechSave(o, id) {
  if (!tcvCan('admin') && !tcvCan('manager')) throw new Error('Only the Maintenance Manager or the administrator maintains the technician master.');
  const X = TCX(), name = (o.name || '').trim(); if (name.length < 3) throw new Error('Enter the technician name.');
  if (!TCV_TRADES.includes(o.trade)) throw new Error('Choose the trade.'); const mobile = (o.mobile || '').trim(); if (!/^\d{10}$/.test(mobile.replace(/\s/g, ''))) throw new Error('Enter a 10-digit mobile number.');
  let t = id ? tcvTech(id) : null; const neu = !t;
  if (X.techs.some(x => x.id !== (t && t.id) && x.mobile === mobile)) throw new Error('This mobile number is already registered to another technician.');
  if (neu && X.techs.some(x => tcvNorm(x.name) === tcvNorm(name) && x.trade === o.trade)) throw new Error('A technician with this name and trade is already enrolled.');
  let emp = (o.emp || '').trim(); if (emp && !hrEmp(emp)) throw new Error('HR employee ' + emp + ' was not found. Leave it blank to create the HR record.');
  if (neu) { if (!emp) emp = tcvHrCreate(name, o.trade, mobile); t = { id: tcvId(), emp, created: tcvNow(), by: tcvWho(), rateHist: [] }; X.techs.push(t); } else if (emp) t.emp = emp;
  Object.assign(t, { name, desig: o.desig || o.trade, photo: o.photo || t.photo || '', mobile, trade: o.trade, managerUser: o.managerUser || '', userId: o.userId || '', loc: o.loc || 'HO', vehicle: o.vehicle || '', active: o.active !== false, eligible: o.eligible !== false, maxKm: +o.maxKm || tcvCfg().maxKmDay });
  if (neu) { t.rate = tcvCfg().rate; t.rateFrom = tcvTD(); t.rateHist.push({ t: tcvNow(), by: tcvWho(), from: tcvTD(), old: null, nw: t.rate, reason: 'Default rate on enrolment', ref: 'DEFAULT' }); }
  tcvLog(neu ? 'Technician enrolled' : 'Technician updated', t.name, t.trade + ' · ' + tcvBrCode(t.loc)); return t;
}
function tcvRate(t, o) {
  if (!tcvCan('rate')) throw new Error('Only Corporate HR, Finance or the administrator can revise a rate.'); const nw = +o.rate;
  if (!(nw > 0 && nw < 100)) throw new Error('Enter a rate per km between 0 and 100.'); if (!tcvRealDate(o.from)) throw new Error('Enter the effective date.');
  if ((o.reason || '').trim().length < 5) throw new Error('Give the reason.'); if (!(o.ref || '').trim()) throw new Error('Enter the approval reference.');
  t.rateHist.push({ t: tcvNow(), by: tcvWho(), from: o.from, old: t.rate, nw, reason: o.reason.trim(), ref: o.ref.trim() });
  if (o.from <= tcvTD()) { t.rate = nw; t.rateFrom = o.from; } tcvLog('Rate revised', t.name, tcvInr(t.rateHist[t.rateHist.length - 2] ? t.rateHist[t.rateHist.length - 2].nw : 0) + ' → ' + tcvInr(nw) + ' from ' + o.from + ' · ' + o.ref);
}
const tcvRateOn = (t, d) => { const h = (t.rateHist || []).filter(x => x.from <= d).sort((a, b) => b.from > a.from ? 1 : -1)[0]; return h ? h.nw : (t.rate || tcvCfg().rate); };
function tcvDefaultRate(o) {
  if (!tcvCan('rate')) throw new Error('Only Corporate HR, Finance or the administrator can change the default rate.'); const nw = +o.rate;
  if (!(nw > 0 && nw < 100)) throw new Error('Enter a rate between 0 and 100.'); if ((o.reason || '').trim().length < 5) throw new Error('Give the reason.');
  const old = tcvCfg().rate; tcvCfg().rate = nw; tcvLog('Default rate changed', '', tcvInr(old) + ' → ' + tcvInr(nw) + ' · ' + (o.ref || '') + ' · ' + o.reason, old, nw);
}
/* ---------- daily claim, eligibility, flags, policy amounts ---------- */
function tcvClaimFor(t, d, create) {
  const X = TCX(); let c = X.claims.find(x => x.tech === t.id && x.date === d && x.status !== 'Reversed');
  if (!c && create) { c = { id: tcvId(), no: tcvNo('DWR'), tech: t.id, emp: t.emp, name: t.name, desig: t.desig, trade: t.trade, date: d, type: 'Regular', status: 'Draft', visits: [], km: 0, kmApproved: 0, rate: tcvRateOn(t, d), amount: 0, amountApproved: 0, flags: [], hist: [{ t: tcvNow(), by: tcvWho(), a: 'Created', r: '' }], appr: [], created: tcvNow(), iso: tcvIso() }; X.claims.unshift(c); }
  return c;
}
function tcvEligibility(t, d, type) {
  const out = []; if (!t.active) out.push('Technician is inactive.'); if (!t.eligible) out.push('Technician is not eligible for conveyance.');
  const e = tcvEmpRec(t); if (e) {
    if (e.status !== 'Active') out.push('Employee is not active.');
    const lv = hrLeaveOn(e.id, d); if (lv && type === 'Regular') out.push('On approved leave — no regular claim.');
    if (hrIsOff(d, '') && type === 'Regular') out.push('Weekly off / public holiday — record it as an Emergency / After-hours claim.');
  } else if (type === 'Regular' && new Date(d + 'T00:00:00Z').getUTCDay() === 0) out.push('Sunday — record it as an Emergency / After-hours claim.');
  return out;
}
function tcvFlags(c) {
  if (c.migrated) return ['Migrated from a monthly statement — day-level evidence not available.'];
  const t = tcvTech(c.tech), C = tcvCfg(), f = [], e = tcvEmpRec(t);
  if (e) { const a = hrAtt(e, c.date); if (a && ['Absent', 'Weekly off', 'Holiday', 'On leave'].includes(a.status) && c.type === 'Regular') f.push('No attendance punch on this date (' + a.status + ').'); }
  c.visits.forEach(v => {
    if (!v.gpsIn || !v.gpsOut) f.push('Visit ' + v.no + ': GPS check-in/out missing.'); if (v.manualKm) f.push('Visit ' + v.no + ': manual kilometres (' + (v.manualReason || 'no reason') + ').');
    if (!v.wo) f.push('Visit ' + v.no + ': no work order (' + (v.noWoReason || 'no reason') + ').'); if ((v.start && v.start < C.dutyStart) || (v.end && v.end > C.dutyEnd)) f.push('Visit ' + v.no + ': outside duty hours ' + C.dutyStart + '–' + C.dutyEnd + '.');
  });
  if (c.km > (t ? t.maxKm : C.maxKmDay)) f.push('Kilometres exceed the daily maximum of ' + (t ? t.maxKm : C.maxKmDay) + '.'); if (c.type !== 'Regular') f.push(c.type + ' claim — manager approval required.');
  return f;
}
function tcvPolicyAmount(t, date, v) {
  const P = tcvCfg().policy, b = tcvBr(v.branch) || {};
  const slab = P.slabs.find(s => s.active !== false && (s.branch ? s.branch === v.branch : s.cat === v.cat) && (!s.mode || s.mode === v.mode));
  if (slab) return { amount: Math.round(+slab.amount * 100) / 100, rate: 0, policy: 'Fixed slab ' + (slab.branch ? tcvBrCode(slab.branch) : slab.cat) + (slab.mode ? ' / ' + slab.mode : '') + ' ₹' + slab.amount };
  const m = P.modes.find(x => x.mode === (v.mode || P.defaultMode)) || P.modes[0]; if (!m) return { amount: 0, rate: 0, policy: 'No policy' };
  if (m.type === 'perKm') { const rate = m.techRate && t ? tcvRateOn(t, date) : +m.rate; return { amount: Math.round((+v.km || 0) * rate * 100) / 100, rate, policy: m.mode + ' ₹' + rate + '/km' }; }
  if (m.type === 'actual') { const fare = Math.min(+v.fare || 0, +m.cap || Infinity); return { amount: Math.round(fare * 100) / 100, rate: 0, policy: m.mode + ' actual fare' + (m.cap ? ' (cap ₹' + m.cap + ')' : '') + (v.fare > m.cap ? ' — capped' : '') }; }
  return { amount: Math.round(+m.amount * 100) / 100, rate: 0, policy: m.mode + ' fixed ₹' + m.amount };
}
function tcvRecalc(c) {
  const t = tcvTech(c.tech); c.km = Math.round(c.visits.reduce((a, v) => a + (+v.km || 0), 0) * 10) / 10; c.rate = tcvRateOn(t, c.date);
  c.visits.forEach(v => { const r = tcvPolicyAmount(t, c.date, v); v.amount = r.amount; v.rateApplied = r.rate; v.policy = r.policy; v.mode = v.mode || tcvCfg().policy.defaultMode; });
  c.amount = Math.round(c.visits.reduce((a, v) => a + (+v.amount || 0), 0) * 100) / 100;
  if (!TCV_OKST.includes(c.status)) { c.kmApproved = c.km; c.amountApproved = c.amount; }
  c.flags = tcvFlags(c); c.byCat = {};
  c.visits.forEach(v => { c.byCat[v.cat] = c.byCat[v.cat] || { km: 0, amt: 0 }; c.byCat[v.cat].km = Math.round((c.byCat[v.cat].km + (+v.km || 0)) * 10) / 10; c.byCat[v.cat].amt = Math.round((c.byCat[v.cat].amt + (+v.amount || 0)) * 100) / 100; });
  c.policyNote = [...new Set(c.visits.map(v => v.policy).filter(Boolean))].join('; '); return c;
}
const tcvAmountFor = (c, kmApproved) => { const t = tcvTech(c.tech), f = c.km > 0 ? kmApproved / c.km : 1; return Math.round(c.visits.reduce((a, v) => { const r = tcvPolicyAmount(t, c.date, v); return a + (r.rate > 0 ? r.amount * f : r.amount); }, 0) * 100) / 100; };
function tcvPolicySave(o) {
  if (!tcvCan('rate')) throw new Error('Only authorised HR / Finance users revise the transport allowance policy.'); const P = tcvCfg().policy;
  const modes = String(o.modes || '').split('\n').map(l => l.trim()).filter(Boolean).map(l => { const [mode, type, val, cap] = l.split('|').map(x => (x || '').trim()); if (!mode || !['perKm', 'actual', 'fixed'].includes(type)) throw new Error('Each mode line: mode | perKm/actual/fixed | rate or amount | tech.'); return type === 'perKm' ? { mode, type, rate: +val || 0, techRate: /tech/i.test(cap) } : type === 'actual' ? { mode, type, cap: +val || 0 } : { mode, type, amount: +val || 0 }; });
  if (!modes.length) throw new Error('Define at least one travel mode.');
  const slabs = String(o.slabs || '').split('\n').map(l => l.trim()).filter(Boolean).map(l => { const [k, amount, mode] = l.split('|').map(x => (x || '').trim()); const b = DATA.branches.find(x => x.id === k || x.code === k); return b ? { branch: b.id, amount: +amount || 0, mode: mode || '', active: true } : { cat: k, amount: +amount || 0, mode: mode || '', active: true }; });
  if ((o.reason || '').trim().length < 5) throw new Error('Give the reason / approval reference.');
  const old = JSON.stringify({ modes: P.modes, slabs: P.slabs, defaultMode: P.defaultMode });
  Object.assign(P, { modes, slabs, defaultMode: modes.some(m => m.mode === o.defaultMode) ? o.defaultMode : modes[0].mode, effFrom: o.effFrom || tcvTD(), ref: (o.ref || '').trim() });
  P.hist.unshift({ t: tcvNow(), by: tcvWho(), role: tcvRole(), old, nw: JSON.stringify({ modes, slabs, defaultMode: P.defaultMode }), effFrom: P.effFrom, ref: P.ref, reason: o.reason.trim() });
  tcvLog('Transport allowance policy revised', 'policy', modes.map(m => m.mode + (m.type === 'perKm' ? ' ₹' + m.rate + '/km' : m.type === 'actual' ? ' actual≤' + m.cap : ' fixed ' + m.amount)).join(', ') + (slabs.length ? ' · ' + slabs.length + ' slab(s)' : ''), old, JSON.stringify({ modes, slabs }));
}
/* ---------- notifications (sent after the change is saved) ---------- */
function tcvNoteU(userIds, text, ref) { if (tcvBatch) return; const ids = (userIds || []).filter(Boolean); if (!ids.length) return; TCV_FX.push(() => fnNotify(ids, text, ref || '', 'tcv_home')); }
const tcvNoteTech = (t, text, ref) => tcvNoteU([t && t.userId], text, ref);
const tcvNoteMgr = (t, text, ref) => tcvNoteU([...new Set([(tcvMgrFor(t) || {}).id, ...pcUsersByRole('Maintenance Manager').map(u => u.id)])], text, ref);
function tcvMail(c, subject, body) { if (tcvBatch) return; TCV_FX.push(() => { try { const t = tcvTech(c.tech), e = tcvEmpRec(t); Store.add('emaillog', { to: ((e && (e.officialEmail || e.email)) || t.name), subject, trigger: 'Conveyance workflow', status: 'Simulated (not delivered)', reason: 'Gateway not connected in this demo', priority: 'Normal', body: body + '\n\nReference: ' + c.no }); } catch (e) { } }); }
/* ---------- visits ---------- */
function tcvMoSideEffects(c, v, t) {
  if (!v.wo || tcvBatch) return;
  TCV_FX.push(() => { const mm = Store.clone(MMX()), w = mm.wos.find(x => x.no === v.wo); if (!w) return; w.log = w.log || []; w.repairNotes = w.repairNotes || [];
    w.log.push({ d: c.date, e: 'Technician visit: ' + t.name + ' · ' + v.km + ' km · ' + (v.pending ? 'work pending' : 'work completed'), by: t.name });
    w.repairNotes.push({ d: c.date, by: t.name, note: v.done + (v.used ? ' · Materials: ' + v.used : '') });
    if (!v.pending && ['New', 'Assigned', 'In Progress', 'Reopened'].includes(w.status)) { w.log.push({ d: c.date, e: w.status + ' → Completed (from the daily work report, awaiting verification)', by: t.name }); w.status = 'Completed'; if (!w.closed) w.closed = mmStamp(); }
    else if (v.pending && ['New', 'Assigned'].includes(w.status)) { w.log.push({ d: c.date, e: w.status + ' → In Progress', by: t.name }); w.status = 'In Progress'; }
    if (!w.tech && !w.vendor) w.tech = t.name; Store.put('mm', mm); });
}
function tcvVisitAdd(t, o, files) {
  const d = o.date || tcvTD(); if (!tcvRealDate(d)) throw new Error('Enter the date.'); if (d > tcvTD()) throw new Error('The date cannot be in the future.');
  const me = tcvMe(); if (me && me.id !== t.id && !tcvCan('manager') && !tcvCan('admin')) throw new Error('You can only report your own work.');
  const type = o.type || 'Regular', el = tcvEligibility(t, d, type); if (el.length) throw new Error(el.join(' '));
  const b = tcvBr(o.branch); if (!b) throw new Error('Choose the institution / branch.'); const cat = o.cat || tcvCatOf(b);
  if (!TCX().cats.some(c => c.code === cat && c.active)) throw new Error('Choose the category (D_C / J_C / K_S).'); if (!TCV_WORK.includes(o.work)) throw new Error('Choose the work type.');
  const P = tcvCfg().policy, mode = o.mode || P.defaultMode, pm = P.modes.find(m => m.mode === mode); if (!pm) throw new Error('Choose the travel mode.');
  if (pm.type === 'actual') { if (!(+o.fare > 0)) throw new Error('Enter the fare paid for ' + mode + ' (the policy cap applies).'); if (!(files || []).some(f => f && f.name)) throw new Error('Attach the ticket / bill for ' + mode + '.'); }
  const km = +o.km; if (!(km >= 0 && km <= 500)) throw new Error('Enter kilometres between 0 and 500.'); if (!o.gpsKm && !o.manualReason && km > 0) throw new Error('GPS distance is not available — give the reason for a manual kilometre entry.');
  if ((o.done || '').trim().length < 5) throw new Error('Describe the work completed (or the reason it is pending).'); if (o.start && o.end && o.end <= o.start) throw new Error('Completion time must be after the start time.');
  if (!o.wo && !(o.noWoReason || '').trim()) throw new Error('No work order selected — give the reason, so the manager can create one.'); if (o.wo && !MMX().wos.some(x => x.no === o.wo)) throw new Error('Work order ' + o.wo + ' does not exist.');
  const c = tcvClaimFor(t, d, true); if (c.type !== type && c.visits.length) throw new Error('This day already has a ' + c.type + ' claim; a day carries one claim type.'); c.type = type;
  if (!['Draft', 'Returned'].includes(c.status)) throw new Error('The daily report for ' + d + ' is ' + c.status.toLowerCase() + ' — ask the manager to return it for correction.');
  if (c.visits.some(v => v.branch === b.id && (v.wo || '') === (o.wo || '') && Math.abs((+v.km || 0) - km) < 0.01)) throw new Error('This travel claim is already entered for the same branch and work order today.');
  const v = { no: c.visits.length + 1, branch: b.id, branchName: b.name, cat, mode, fare: pm.type === 'actual' ? Math.round(+o.fare * 100) / 100 : 0, purpose: (o.purpose || '').trim(), where: (o.where || '').trim(), wo: o.wo || '', noWoReason: (o.noWoReason || '').trim(), work: o.work, start: o.start || '', end: o.end || '', gpsIn: o.gpsIn || '', gpsOut: o.gpsOut || '', from: (o.from || '').trim(), to: (o.to || '').trim(), km, gpsKm: +o.gpsKm || 0, manualKm: !o.gpsKm, manualReason: (o.manualReason || '').trim(), done: o.done.trim(), pending: (o.pending || '').trim(), pendingReason: (o.pendingReason || '').trim(), needMaterial: (o.needMaterial || '').trim(), used: (o.used || '').trim(), photos: (files || []).filter(f => f && f.name).map(f => ({ name: f.name, size: f.size, type: f.type || '', data: f.data || '', kind: /after/i.test(f.name) ? 'after' : /before/i.test(f.name) ? 'before' : /bill|ticket|receipt/i.test(f.name) ? 'bill' : 'attachment' })), remarks: (o.remarks || '').trim(), rep: (o.rep || '').trim(), repConfirmed: !!o.repConfirmed, t: tcvNow() };
  c.visits.push(v); tcvRecalc(c); c.hist.push({ t: tcvNow(), by: tcvWho(), a: 'Visit added', r: v.no + ' · ' + tcvBrCode(b.id) + ' · ' + km + ' km · ' + v.mode + ' · ' + v.policy + ' = ' + tcvInr(v.amount) });
  tcvMoSideEffects(c, v, t);
  if (v.needMaterial) { c.material = c.material || []; c.material.push({ visit: v.no, wo: v.wo, item: v.needMaterial, status: 'Requested', t: tcvNow() }); }
  tcvLog('Visit recorded', c.no, t.name + ' · ' + d + ' · ' + tcvBrCode(b.id) + ' · ' + km + ' km'); return v;
}
function tcvVisitRemove(c, no) {
  if (!['Draft', 'Returned'].includes(c.status)) throw new Error('The report is ' + c.status.toLowerCase() + ' and cannot be changed.');
  const i = c.visits.findIndex(v => v.no === no); if (i < 0) throw new Error('Visit not found.'); const v = c.visits.splice(i, 1)[0]; c.visits.forEach((x, k) => x.no = k + 1);
  tcvRecalc(c); c.hist.push({ t: tcvNow(), by: tcvWho(), a: 'Visit removed', r: v.branchName + ' · ' + v.km + ' km' }); tcvLog('Visit removed', c.no, v.branchName);
}
function tcvSubmit(c) {
  const t = tcvTech(c.tech), me = tcvMe(); if (me && me.id !== c.tech && !tcvCan('manager') && !tcvCan('admin')) throw new Error('You can submit only your own report.');
  if (!['Draft', 'Returned'].includes(c.status)) throw new Error('Already ' + c.status.toLowerCase() + '.'); if (!c.visits.length) throw new Error('Add at least one visit.');
  if (c.date === tcvTD() && tcvTime() > tcvCfg().cutoff) c.late = true; tcvRecalc(c); c.status = 'Submitted'; c.submitted = tcvNow();
  c.hist.push({ t: tcvNow(), by: tcvWho(), a: 'Submitted', r: c.km + ' km · ' + tcvInr(c.amount) + (c.late ? ' · after the cut-off' : '') }); tcvLog('Report submitted', c.no, t.name + ' · ' + c.date + ' · ' + c.km + ' km');
  tcvNoteMgr(t, 'Daily work report to verify: ' + c.no + ' · ' + t.name + ' · ' + c.date + ' · ' + c.km + ' km', c.no); return c;
}
/* ---------- manager and head approval ---------- */
function tcvMeIsClaimOwner(c) { const me = tcvMe(); return !!me && me.id === c.tech; }
function tcvCanAct(c, lvl) {
  if (tcvMeIsClaimOwner(c) && !(App.user && App.user.role === 'Super Admin')) return false; const can = k => tcvCan(k), C = tcvCfg();
  if (lvl === 'manager') return can('manager') && c.status === 'Submitted';
  if (lvl === 'head') return can('head') && c.status === 'Manager Verified' && C.secondApproval && !c.headOk;
  if (lvl === 'finance') return can('finance') && c.status === 'Manager Verified' && (!C.secondApproval || !!c.headOk);
  if (lvl === 'pay') return can('finance') && c.status === 'Finance Approved'; return false;
}
function tcvDecide(c, act, o) {
  o = o || {}; const C = tcvCfg(), lvl = c.status === 'Submitted' ? 'manager' : c.status === 'Manager Verified' && C.secondApproval && !c.headOk ? 'head' : '';
  if (!lvl || !tcvCanAct(c, lvl)) throw new Error('This report is not waiting for your approval.'); if (['Return', 'Reject'].includes(act) && (o.remarks || '').trim().length < 5) throw new Error('Give the reason for the technician.');
  const t = tcvTech(c.tech), rec = { t: tcvNow(), by: tcvWho(), lvl, a: act, r: (o.remarks || '').trim() };
  if (act === 'Approve' || act === 'Revise') {
    if (act === 'Revise') { const km = +o.km; if (!(km >= 0 && km <= c.km)) throw new Error('Revised kilometres must be between 0 and the claimed ' + c.km + '.'); if ((o.remarks || '').trim().length < 5) throw new Error('Give the reason for revising the kilometres.'); rec.oldKm = c.kmApproved; rec.newKm = km; c.kmApproved = km; c.amountApproved = tcvAmountFor(c, km); c.revised = { from: c.km, to: km, by: tcvWho(), t: tcvNow(), reason: o.remarks.trim() }; }
    else if (lvl === 'manager') { c.kmApproved = c.kmApproved || c.km; c.amountApproved = tcvAmountFor(c, c.kmApproved); }
    c.appr.push(rec); if (lvl === 'manager') { c.status = 'Manager Verified'; c.verifiedAt = tcvNow(); } else c.headOk = { by: tcvWho(), t: tcvNow() };
    c.hist.push({ t: tcvNow(), by: tcvWho(), a: (act === 'Revise' ? 'Approved with revised kilometres (' + c.km + ' → ' + c.kmApproved + ')' : 'Approved') + ' at ' + lvl, r: rec.r });
    tcvLog(act === 'Revise' ? 'Approved with revised km' : 'Approved', c.no, lvl + ' · ' + c.kmApproved + ' km · ' + tcvInr(c.amountApproved) + (act === 'Revise' ? ' · claimed ' + c.km + ' km → approved ' + c.kmApproved + ' km · reason: ' + rec.r : ''), act === 'Revise' ? rec.oldKm : '', act === 'Revise' ? rec.newKm : '');
    if (c.status === 'Manager Verified' && lvl === 'manager') { tcvNoteTech(t, 'Transport allowance verified by the Maintenance Manager: ' + c.no + ' · ' + c.date + ' · ' + c.kmApproved + ' km · ' + tcvInr(c.amountApproved), c.no); tcvNoteU(pcUsersByRole('Finance Manager').map(u => u.id), 'Conveyance claim to approve: ' + c.no + ' · ' + tcvInr(c.amountApproved), c.no); tcvMail(c, 'Conveyance approved — ' + c.date, 'Your daily work report for ' + c.date + ' is approved: ' + c.kmApproved + ' km · ' + tcvInr(c.amountApproved) + '.'); }
    else tcvNoteTech(t, 'Report verified by manager: ' + c.no + ' awaits the Facilities Head', c.no);
  } else if (act === 'Return') { c.status = 'Returned'; c.appr.push(rec); c.hist.push({ t: tcvNow(), by: tcvWho(), a: 'Returned for correction', r: rec.r }); tcvLog('Returned', c.no, rec.r); tcvNoteTech(t, 'Report returned for correction: ' + c.no + ' · ' + rec.r, c.no); tcvMail(c, 'Daily work report returned — ' + c.date, 'Your report was returned: ' + rec.r); }
  else if (act === 'Reject') { c.status = 'Rejected'; c.appr.push(rec); c.hist.push({ t: tcvNow(), by: tcvWho(), a: 'Rejected', r: rec.r }); tcvLog('Rejected', c.no, rec.r); tcvNoteTech(t, 'Report rejected: ' + c.no + ' · ' + rec.r, c.no); tcvMail(c, 'Daily work report rejected — ' + c.date, 'Your report was rejected: ' + rec.r); }
  else throw new Error('Unknown action.'); return c;
}
function tcvMgrLinkWo(c, no, o) {
  if (!tcvCan('manager') && !tcvCan('admin')) throw new Error('Only the Maintenance Manager links or creates work orders.'); const v = c.visits.find(x => x.no === no); if (!v) throw new Error('Visit not found.');
  if (o.wo) { if (!MMX().wos.some(t => t.no === o.wo)) throw new Error('Work order not found.'); v.wo = o.wo; v.noWoReason = ''; }
  else { const mm = Store.clone(MMX()), w = mmMkWO(mm, { ent: v.branch, cat: 'Other', desc: v.done, priority: 'Medium', opened: c.date + 'T09:00:00', room: v.where, by: tcvWho() }); w.tech = c.name; w.status = v.pending ? 'In Progress' : 'Completed'; if (!v.pending) w.closed = mmStamp(); w.repairNotes = [{ d: c.date, by: c.name, note: v.done }]; w.log.push({ d: c.date, e: 'Created by the Maintenance Manager from daily work report ' + c.no, by: tcvWho() }); Store.put('mm', mm); v.wo = w.no; v.noWoReason = ''; }
  c.hist.push({ t: tcvNow(), by: tcvWho(), a: 'Work order ' + (o.wo ? 'linked' : 'created') + ' for visit ' + no, r: v.wo }); tcvRecalc(c); tcvLog('Work order ' + (o.wo ? 'linked' : 'created'), c.no, v.wo);
}
function tcvFollowUp(c, no, o) {
  if (!tcvCan('manager')) throw new Error('Only the Maintenance Manager assigns follow-up visits.'); const v = c.visits.find(x => x.no === no); if (!v) throw new Error('Visit not found.');
  if (!tcvRealDate(o.date) || o.date < tcvTD()) throw new Error('Choose a follow-up date from today.'); const t = tcvTech(+o.tech) || tcvTech(c.tech);
  c.follow = c.follow || []; c.follow.push({ visit: no, date: o.date, tech: t.id, note: (o.note || '').trim(), by: tcvWho(), t: tcvNow() }); tcvNoteTech(t, 'Follow-up visit assigned: ' + tcvBrName(v.branch) + ' on ' + o.date + (o.note ? ' · ' + o.note : ''), c.no); tcvLog('Follow-up assigned', c.no, t.name + ' · ' + o.date);
}
/* ---------- finance: verify, pay, reverse ---------- */
function tcvFinVerify(c, o) {
  if (!tcvCanAct(c, 'finance')) throw new Error('Only Finance approves a manager-verified claim.'); const t = tcvTech(c.tech);
  if (o && o.reject) { if ((o.note || '').trim().length < 5) throw new Error('Give the reason for rejection.'); c.status = 'Rejected'; c.appr.push({ t: tcvNow(), by: tcvWho(), lvl: 'finance', a: 'Reject', r: o.note.trim() }); c.hist.push({ t: tcvNow(), by: tcvWho(), a: 'Rejected by Finance', r: o.note.trim() }); tcvLog('Rejected by Finance', c.no, o.note.trim()); tcvNoteTech(t, 'Transport allowance rejected by Finance: ' + c.no + ' · ' + o.note.trim(), c.no); return; }
  c.status = 'Finance Approved'; c.finalAt = tcvNow(); c.fin = { approvedBy: tcvWho(), approvedAt: tcvNow(), note: (o && o.note || '').trim() }; c.appr.push({ t: tcvNow(), by: tcvWho(), lvl: 'finance', a: 'Approve', r: (o && o.note || '').trim() });
  c.hist.push({ t: tcvNow(), by: tcvWho(), a: 'Finance approved', r: tcvInr(c.amountApproved) }); tcvLog('Finance approved', c.no, tcvInr(c.amountApproved)); tcvNoteTech(t, 'Transport allowance approved by Finance: ' + c.no + ' · ' + c.date + ' · ' + tcvInr(c.amountApproved), c.no); tcvMail(c, 'Transport allowance approved — ' + c.date, 'Your transport allowance of ' + tcvInr(c.amountApproved) + ' for ' + c.date + ' has been approved by Finance and will be paid shortly.');
}
function tcvPay(ids, o) {
  if (!tcvCan('finance')) throw new Error('Only Finance records payments.'); const X = TCX(), cs = ids.map(i => X.claims.find(c => c.id === i)).filter(Boolean);
  if (!cs.length) throw new Error('Choose at least one verified claim.'); if (cs.some(c => c.status !== 'Finance Approved')) throw new Error('Only finance-approved claims can be put into a payment.');
  if (!['Payroll', 'Bank transfer', 'Cash', 'Reimbursement voucher'].includes(o.mode)) throw new Error('Choose the payment mode.'); if (!tcvRealDate(o.date)) throw new Error('Enter the payment date.'); if (cs.some(c => c.pay)) throw new Error('A claim in the batch is already paid.');
  const total = Math.round(cs.reduce((a, c) => a + c.amountApproved, 0) * 100) / 100;
  const p = { id: tcvId(), no: tcvNo('CPV'), finRef: 'FIN/' + PROC_TODAY.slice(0, 4) + '/' + String(X.pay.length + 1).padStart(5, '0'), claims: cs.map(c => c.id), techs: [...new Set(cs.map(c => c.tech))], mode: o.mode, date: o.date, bankRef: (o.bankRef || '').trim(), total, by: tcvWho(), t: tcvNow(), byCat: {}, status: 'Created' };
  cs.forEach(c => { Object.entries(c.byCat || {}).forEach(([k, v]) => { p.byCat[k] = p.byCat[k] || { km: 0, amt: 0 }; const f = c.km ? c.kmApproved / c.km : 1; p.byCat[k].km = Math.round((p.byCat[k].km + v.km * f) * 10) / 10; p.byCat[k].amt = Math.round((p.byCat[k].amt + v.amt * f) * 100) / 100; }); c.status = 'Payment Created'; c.pay = { no: p.no, finRef: p.finRef, mode: o.mode, date: o.date, id: p.id }; c.hist.push({ t: tcvNow(), by: tcvWho(), a: 'Payment created', r: p.no + ' · ' + o.mode + ' · ' + tcvInr(c.amountApproved) }); });
  X.pay.push(p); tcvLog('Payment created', p.no, cs.length + ' claim(s) · ' + tcvInr(total) + ' · ' + o.mode + ' · ' + p.finRef); if (o.ref && o.ref.trim()) tcvPayConfirm(p.id, { ref: o.ref, date: o.date }); return p;
}
function tcvPayConfirm(payId, o) {
  if (!tcvCan('finance')) throw new Error('Only Finance confirms payments.'); const X = TCX(), p = X.pay.find(x => x.id === payId); if (!p) throw new Error('Payment not found.'); if (p.status === 'Paid') throw new Error('Already confirmed as paid.');
  if (!(o.ref || '').trim()) throw new Error('Enter the bank / UTR / payment reference.'); if (!tcvRealDate(o.date)) throw new Error('Enter the payment date.');
  p.status = 'Paid'; p.bankRef = o.ref.trim(); p.paidDate = o.date; p.paidBy = tcvWho(); p.paidAt = tcvNow();
  X.claims.filter(c => p.claims.includes(c.id) && c.status === 'Payment Created').forEach(c => { c.status = 'Paid'; c.paidAt = tcvNow(); c.pay = Object.assign(c.pay || {}, { ref: p.bankRef, paidDate: o.date }); c.hist.push({ t: tcvNow(), by: tcvWho(), a: 'Paid', r: p.no + ' · ' + p.bankRef + ' · ' + tcvInr(c.amountApproved) }); const t = tcvTech(c.tech); tcvNoteTech(t, 'Transport allowance paid: ' + c.no + ' · ' + tcvInr(c.amountApproved) + ' · ' + p.mode + ' · ref ' + p.bankRef, c.no); tcvMail(c, 'Transport allowance paid — ' + c.date, 'Transport allowance of ' + tcvInr(c.amountApproved) + ' for ' + c.date + ' was paid by ' + p.mode + ' on ' + o.date + '. Reference ' + p.bankRef + ' · ' + p.finRef + '.'); });
  tcvLog('Payment confirmed', p.no, p.bankRef + ' · ' + tcvInr(p.total)); return p;
}
function tcvReverse(c, reason) {
  if (!tcvCan('finance') && !tcvCan('head')) throw new Error('Reversal needs Finance or the Facilities Head.'); if (!TCV_OKST.includes(c.status)) throw new Error('Only a verified, approved or paid claim is reversed.'); if ((reason || '').trim().length < 5) throw new Error('Give the reason.');
  const was = c.status; if (c.pay) { const p = TCX().pay.find(x => x.no === c.pay.no); if (p) { p.reversed = p.reversed || []; p.reversed.push({ claim: c.id, amount: c.amountApproved, t: tcvNow(), by: tcvWho(), reason }); p.total = Math.round((p.total - c.amountApproved) * 100) / 100; } }
  c.status = 'Reversed'; c.reversal = { was, by: tcvWho(), t: tcvNow(), reason: reason.trim() }; c.hist.push({ t: tcvNow(), by: tcvWho(), a: 'Reversed (was ' + was + ')', r: reason }); tcvLog('Reversed', c.no, was + ' · ' + tcvInr(c.amountApproved) + ' · ' + reason); tcvNoteTech(tcvTech(c.tech), 'Conveyance reversed: ' + c.no + ' · ' + reason, c.no);
}
/* ---------- reminders and missed reports ---------- */
function tcvMissed(d) {
  const X = TCX(); return X.techs.filter(t => t.active).filter(t => { const e = tcvEmpRec(t); if (!e) return false; const a = hrAtt(e, d), att = a && ['Present', 'Late', 'Half-day', 'Early logout', 'Regularised'].includes(a.status); const c = X.claims.find(x => x.tech === t.id && x.date === d && !['Draft', 'Rejected', 'Reversed'].includes(x.status)); return att && !c; });
}
function tcvRemindRun(force) {
  const X = TCX(), C = tcvCfg(), out = { tech: 0, mgr: 0, esc: 0 }, key = 'rem' + tcvTD(); if (X.seq[key] && !force) return out; if (tcvTime() < C.reminders.techAt && !force) return out;
  X.seq[key] = 1; const miss = tcvMissed(tcvTD());
  miss.forEach(t => { tcvNoteTech(t, 'Daily work report pending: please submit today’s report before ' + C.cutoff, ''); out.tech++; X.miss.push({ tech: t.id, date: tcvTD(), t: tcvNow() }); });
  if (tcvTime() > C.cutoff || force) { const names = miss.map(t => t.name); if (names.length) { tcvNoteU(pcUsersByRole('Maintenance Manager').map(u => u.id), 'Technicians without a daily report: ' + names.join(', ') + ' — ' + tcvTD(), ''); out.mgr++; } miss.forEach(t => { const n = X.miss.filter(x => x.tech === t.id && x.date >= pcAddDays(tcvTD(), -30)).length; if (n >= C.reminders.escalateMissed) { tcvTech(t.id).escalated = tcvTD(); tcvNoteU(C.perm.head.flatMap(r => pcUsersByRole(r)).map(u => u.id), 'Repeated missed daily reports: ' + t.name + ' · ' + n + ' missed in 30 days', ''); out.esc++; } }); }
  if (out.tech || out.mgr) tcvLog('Reminders', tcvTD(), out.tech + ' technician(s), ' + out.mgr + ' manager(s), ' + out.esc + ' escalation(s)'); return out;
}
/* ---------- monthly figures (the August 2026 statement format) ---------- */
function tcvMonth(ym, filter) {
  filter = filter || {}; const X = TCX(), cs = X.claims.filter(c => c.date.slice(0, 7) === ym && c.status !== 'Reversed' && c.status !== 'Rejected' && (!filter.status || c.status === filter.status) && (!filter.tech || c.tech === filter.tech)), approvedOnly = filter.approvedOnly;
  const techs = X.techs.filter(t => !filter.trade || t.trade === filter.trade).map(t => {
    const mine = cs.filter(c => c.tech === t.id), cat = {}; X.cats.filter(x => x.active).forEach(x => cat[x.code] = { km: 0, amt: 0 }); const days = {}; let km = 0, amt = 0;
    mine.forEach(c => { const factor = approvedOnly || TCV_OKST.includes(c.status) ? (c.km ? c.kmApproved / c.km : 0) : 1; c.visits.forEach(v => { const vk = Math.round(v.km * factor * 10) / 10; cat[v.cat] = cat[v.cat] || { km: 0, amt: 0 }; cat[v.cat].km += vk; cat[v.cat].amt += vk * c.rate; days[v.cat] = days[v.cat] || {}; const dd = +c.date.slice(8, 10); days[v.cat][dd] = (days[v.cat][dd] || 0) + vk; km += vk; amt += vk * c.rate; }); });
    Object.values(cat).forEach(x => { x.km = Math.round(x.km * 10) / 10; x.amt = Math.round(x.amt * 100) / 100; });
    const st = mine.length ? (mine.every(c => c.status === 'Paid') ? 'Paid' : mine.every(c => ['Payment Created', 'Paid', 'Finance Approved'].includes(c.status)) ? 'Finance Approved' : mine.some(c => ['Submitted', 'Returned', 'Draft'].includes(c.status)) ? 'Pending approval' : 'Manager Verified') : '—';
    const pay = mine.length ? (mine.every(c => c.status === 'Paid') ? 'Paid' : mine.some(c => c.status === 'Paid') ? 'Partly paid' : 'Unpaid') : '—';
    return { t, id: t.id, name: t.name, desig: t.desig, trade: t.trade, cat, days, km: Math.round(km * 10) / 10, rate: tcvRateOn(t, ym + '-28'), amt: Math.round(amt * 100) / 100, appr: st, pay, claims: mine.length, paid: Math.round(mine.filter(c => c.status === 'Paid').reduce((a, c) => a + c.amountApproved, 0) * 100) / 100, pending: Math.round(mine.filter(c => !['Paid', 'Rejected', 'Reversed'].includes(c.status)).reduce((a, c) => a + c.amountApproved, 0) * 100) / 100 };
  });
  return techs.filter(r => r.claims || filter.all).map((r, i) => (r.sno = i + 1, r));
}
/* visibility: central roles see everything; branch roles see claims that visited their institutions; a technician sees their own */
function tcvScopeOK(c) { if (tcvCentral()) return true; const me = tcvMe(); if (me && c.tech === me.id) return true; if (me || (App.user && App.user.role === 'Technician')) return false; const sc = hrScope(App.user); return c.visits.some(v => sc.has(v.branch)); }
const tcvClaims = () => TCX().claims.filter(tcvScopeOK);
