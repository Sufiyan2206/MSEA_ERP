/* ===== Store & Purchase Management: masters, configuration, workflow engine, stock engine, notifications, demo seed ===== */
const PROC_SEED_VER = 1;
const PROC_TODAY = SRC.today;
const PROC_CATS = [['STA', 'Stationery and printing'], ['BKS', 'Books and academic material'], ['CLS', 'Classroom supplies'], ['UNI', 'Uniforms'], ['ITH', 'IT hardware and accessories'], ['FUR', 'Furniture and fixtures'], ['ELP', 'Electrical and plumbing'], ['MNT', 'Maintenance materials'], ['HKP', 'Housekeeping and cleaning'], ['LAB', 'Lab material'], ['SPT', 'Sports material'], ['EVM', 'Event and marketing material'], ['OTH', 'Other approved categories']];
const PROC_SUBCATS = { STA: ['Paper', 'Printing', 'Writing', 'Filing'], BKS: ['Textbooks', 'Library', 'Workbooks'], CLS: ['Boards', 'Teaching aids', 'Consumables'], UNI: ['Students', 'Staff', 'Sports kit'], ITH: ['Computers', 'Printers', 'Networking', 'Accessories'], FUR: ['Classroom', 'Office', 'Lab'], ELP: ['Electrical', 'Plumbing', 'Lighting'], MNT: ['Civil', 'Paint', 'Hardware'], HKP: ['Cleaning', 'Hygiene', 'Pest control'], LAB: ['Chemicals', 'Glassware', 'Equipment'], SPT: ['Equipment', 'Kits'], EVM: ['Printing', 'Decor', 'Gifts'], OTH: ['Other'] };
const PROC_UNITS = ['Nos', 'Box', 'Ream', 'Pack', 'Set', 'Kg', 'Litre', 'Metre', 'Pair', 'Dozen', 'Roll'];
const PROC_DEPTS = ['Academics', 'Administration', 'Accounts', 'Library', 'Laboratory', 'Sports', 'IT', 'Maintenance', 'Housekeeping', 'Transport', 'Admissions', 'Hostel'];
const PROC_PRIORITY = ['Normal', 'Urgent', 'Emergency'];
const PROC_REQ_ROLES = ['Branch Requester', 'Principal', 'Admissions Head', 'Branch Accountant', 'HR Officer'];
const PROC_FIN_ROLES = ['Finance Manager', 'Corporate Finance'];
const PROC_PAGE_MODS = ['pr_home', 'pr_mr', 'pr_pr', 'pr_inbox', 'pr_store', 'pr_vendors', 'pr_po', 'pr_budget', 'pr_reports', 'pr_admin'];
const PROC_ACTIVE_MR = ['Submitted', 'Approved', 'Partially issued', 'Under purchase', 'Dispatched', 'On hold', 'Clarification'];
const PROC_ACTIVE_PR = ['Submitted', 'Approved', 'Quotations', 'Vendor selected', 'PO issued', 'Partially received', 'On hold', 'Clarification'];

/* ---------- masters ---------- */
function defaultProcMaster() {
  const I = []; let n = 0;
  const it = (cat, sub, name, uom, rate, reorder, max, o = {}) => I.push(Object.assign({ id: 'IT' + String(++n).padStart(3, '0'), code: cat + '-' + String(n).padStart(3, '0'), name, cat, sub, uom, rate, reorder, min: Math.round(reorder / 2), max, capital: false, track: '', active: true }, o));
  it('STA', 'Paper', 'A4 copier paper 75 gsm', 'Ream', 285, 200, 1200); it('STA', 'Writing', 'Whiteboard marker (blue)', 'Box', 240, 60, 400); it('STA', 'Writing', 'Ball pen (blue)', 'Box', 180, 40, 300); it('STA', 'Filing', 'Box file (foolscap)', 'Nos', 95, 100, 600); it('STA', 'Printing', 'Toner cartridge 85A compatible', 'Nos', 1450, 20, 120); it('STA', 'Paper', 'Chart paper (assorted)', 'Pack', 160, 50, 300);
  it('BKS', 'Workbooks', 'Practice workbook – Mathematics', 'Nos', 120, 300, 2000); it('BKS', 'Library', 'Library register', 'Nos', 210, 10, 60); it('BKS', 'Textbooks', 'Lab manual – Physics (Inter)', 'Nos', 150, 100, 800);
  it('CLS', 'Boards', 'Whiteboard 6×4 ft', 'Nos', 4200, 4, 30, { capital: true, track: 'serial' }); it('CLS', 'Teaching aids', 'Geometry box set (teacher)', 'Set', 350, 20, 100); it('CLS', 'Consumables', 'Duster (felt)', 'Nos', 45, 100, 500);
  it('UNI', 'Students', 'School uniform shirt (sizes 24–40)', 'Nos', 320, 300, 2500); it('UNI', 'Staff', 'Staff blazer', 'Nos', 1850, 10, 80); it('UNI', 'Sports kit', 'Sports T-shirt', 'Nos', 210, 200, 1500);
  it('ITH', 'Computers', 'Desktop computer i5 / 16 GB', 'Nos', 46500, 2, 20, { capital: true, track: 'serial' }); it('ITH', 'Printers', 'Laser printer (mono, duplex)', 'Nos', 18900, 2, 12, { capital: true, track: 'serial' }); it('ITH', 'Accessories', 'Keyboard and mouse combo', 'Set', 850, 15, 80); it('ITH', 'Networking', 'Network switch 24-port', 'Nos', 12400, 1, 8, { capital: true, track: 'serial' }); it('ITH', 'Accessories', 'HDMI cable 3 m', 'Nos', 260, 20, 100);
  it('FUR', 'Classroom', 'Student dual desk', 'Nos', 3900, 20, 200, { capital: true }); it('FUR', 'Office', 'Office chair (mid back)', 'Nos', 4600, 4, 40, { capital: true }); it('FUR', 'Classroom', 'Teacher table', 'Nos', 5200, 4, 40, { capital: true }); it('FUR', 'Lab', 'Lab stool', 'Nos', 1150, 10, 120, { capital: true });
  it('ELP', 'Lighting', 'LED tube light 20 W', 'Nos', 320, 60, 400); it('ELP', 'Electrical', 'Ceiling fan 1200 mm', 'Nos', 2250, 10, 60, { capital: true }); it('ELP', 'Plumbing', 'PVC pipe 1 inch', 'Metre', 95, 100, 600); it('ELP', 'Electrical', 'MCB 32 A', 'Nos', 410, 20, 100);
  it('MNT', 'Paint', 'Emulsion paint (white) 20 L', 'Nos', 3600, 6, 40); it('MNT', 'Hardware', 'Door lock set', 'Set', 780, 10, 60); it('MNT', 'Civil', 'Cement 50 kg', 'Nos', 420, 20, 200);
  it('HKP', 'Cleaning', 'Floor cleaner 5 L', 'Nos', 480, 40, 300); it('HKP', 'Hygiene', 'Liquid hand wash 5 L', 'Nos', 520, 40, 250); it('HKP', 'Cleaning', 'Garbage bags (large)', 'Pack', 210, 60, 400); it('HKP', 'Hygiene', 'Sanitary napkin dispenser refill', 'Pack', 650, 30, 200);
  it('LAB', 'Chemicals', 'Sodium hydroxide 500 g', 'Nos', 260, 20, 120, { track: 'batch' }); it('LAB', 'Glassware', 'Beaker 250 ml (borosil)', 'Nos', 140, 60, 400); it('LAB', 'Equipment', 'Digital balance 0.01 g', 'Nos', 8900, 1, 10, { capital: true, track: 'serial' });
  it('SPT', 'Equipment', 'Football (size 5)', 'Nos', 950, 20, 100); it('SPT', 'Equipment', 'Cricket kit (school)', 'Set', 7800, 2, 20, { capital: true }); it('SPT', 'Kits', 'Badminton racket', 'Nos', 620, 20, 100);
  it('EVM', 'Printing', 'Flex banner 10×4 ft', 'Nos', 1200, 10, 60); it('EVM', 'Decor', 'Event backdrop set', 'Set', 9500, 1, 8); it('EVM', 'Gifts', 'Trophy (medium)', 'Nos', 480, 30, 200);
  const V = [
    { id: 'V01', name: 'Deccan Paper Mart', contact: 'Sameer Khan', mobile: '98480 11223', email: 'sales@deccanpaper.example', address: 'Begum Bazaar, Hyderabad', gst: '36AABCD1234E1Z5', bank: 'HDFC Bank · A/c ····4521 · IFSC HDFC0000123', cats: ['STA', 'BKS', 'EVM'], regions: ['Telangana'], credit: 30, rating: 4.4, status: 'Active', docs: 'GST certificate, PAN, cancelled cheque' },
    { id: 'V02', name: 'Nizam Office Automation', contact: 'Ravi Teja', mobile: '99490 55667', email: 'info@nizamoa.example', address: 'Abids, Hyderabad', gst: '36AACCN5678F1Z2', bank: 'SBI · A/c ····8830 · IFSC SBIN0004567', cats: ['ITH', 'STA'], regions: ['Telangana', 'Maharashtra'], credit: 45, rating: 4.1, status: 'Active', docs: 'GST certificate, PAN, MSME' },
    { id: 'V03', name: 'Classroom Furnishers India', contact: 'Imtiaz Ahmed', mobile: '90000 33445', email: 'orders@classroomfurn.example', address: 'Balanagar, Hyderabad', gst: '36AADCC9012G1Z9', bank: 'ICICI · A/c ····2290 · IFSC ICIC0001122', cats: ['FUR', 'CLS'], regions: ['Telangana', 'Maharashtra', 'Delhi', 'Uttar Pradesh'], credit: 30, rating: 4.6, status: 'Active', docs: 'GST certificate, PAN, ISO 9001' },
    { id: 'V04', name: 'Bright Electricals & Plumbing', contact: 'Suresh Babu', mobile: '98660 77889', email: 'bright.ep@example.com', address: 'Malakpet, Hyderabad', gst: '36AAECB3456H1Z7', bank: 'Axis Bank · A/c ····6612 · IFSC UTIB0000221', cats: ['ELP', 'MNT'], regions: ['Telangana'], credit: 15, rating: 3.9, status: 'Active', docs: 'GST certificate, PAN' },
    { id: 'V05', name: 'CleanCare Supplies', contact: 'Farida Begum', mobile: '96180 22334', email: 'cleancare@example.com', address: 'Tolichowki, Hyderabad', gst: '36AAFCC7890J1Z1', bank: 'Kotak · A/c ····9981 · IFSC KKBK0000551', cats: ['HKP'], regions: ['Telangana', 'Maharashtra'], credit: 30, rating: 4.2, status: 'Active', docs: 'GST certificate, PAN' },
    { id: 'V06', name: 'SciLab Instruments', contact: 'Dr. P. Raghavan', mobile: '94400 66778', email: 'sales@scilab.example', address: 'Ameerpet, Hyderabad', gst: '36AAGCS2345K1Z4', bank: 'HDFC Bank · A/c ····7714 · IFSC HDFC0000456', cats: ['LAB'], regions: ['Telangana', 'Maharashtra', 'Delhi', 'Uttar Pradesh'], credit: 45, rating: 4.5, status: 'Active', docs: 'GST certificate, PAN, calibration certificates' },
    { id: 'V07', name: 'Mumbai Uniform House', contact: 'Zubair Shaikh', mobile: '98200 44556', email: 'muh@example.com', address: 'Kurla West, Mumbai', gst: '27AAHCM6789L1Z6', bank: 'Bank of Baroda · A/c ····3302 · IFSC BARB0KURLAX', cats: ['UNI', 'SPT'], regions: ['Maharashtra', 'Telangana'], credit: 30, rating: 4.0, status: 'Active', docs: 'GST certificate, PAN' },
    { id: 'V08', name: 'TechPoint Systems', contact: 'Anjali Mehra', mobile: '98110 99887', email: 'anjali@techpoint.example', address: 'Nehru Place, New Delhi', gst: '07AAICT1234M1Z8', bank: 'ICICI · A/c ····5570 · IFSC ICIC0000998', cats: ['ITH'], regions: ['Delhi', 'Uttar Pradesh', 'Telangana'], credit: 30, rating: 4.3, status: 'Active', docs: 'GST certificate, PAN, OEM authorisation' },
    { id: 'V09', name: 'Sportsline Traders', contact: 'Mohd. Arif', mobile: '93900 11200', email: 'sportsline@example.com', address: 'Secunderabad', gst: '36AAJCS4567N1Z3', bank: 'Canara Bank · A/c ····1189 · IFSC CNRB0000334', cats: ['SPT', 'EVM'], regions: ['Telangana'], credit: 15, rating: 3.7, status: 'Active', docs: 'GST certificate' },
    { id: 'V10', name: 'Kanpur Stationers', contact: 'Rizwan Ali', mobile: '94150 33221', email: 'kanpurstationers@example.com', address: 'Naveen Market, Kanpur', gst: '09AAKCK8901P1Z0', bank: 'PNB · A/c ····7823 · IFSC PUNB0123400', cats: ['STA', 'BKS', 'CLS'], regions: ['Uttar Pradesh', 'Delhi'], credit: 30, rating: 3.8, status: 'Active', docs: 'GST certificate, PAN' },
    { id: 'V11', name: 'Legacy Prints (inactive)', contact: 'R. Gupta', mobile: '98000 00000', email: 'legacy@example.com', address: 'Hyderabad', gst: '36AALCL1111Q1Z2', bank: '—', cats: ['STA', 'EVM'], regions: ['Telangana'], credit: 0, rating: 2.6, status: 'Inactive', docs: 'GST certificate (expired)' }
  ];
  const stores = [{ id: 'CS', name: 'Central Store – Hyderabad', kind: 'Central', branch: '', address: 'MSEA Corporate Office, Hyderabad', active: true }];
  const cfg = {
    mr: { principal: true, zd: 'above', zdAbove: 10000, zdEmergency: true, storeIncharge: true },
    pr: { zd: 'always', zdAbove: 0, rdAbove: 50000, finance: 'always', financeAbove: 0, cfoAbove: 200000, capexFinance: true, emergencySkip: ['Zonal Director', 'Regional Director'] },
    limits: { 'Principal': 25000, 'Zonal Director': 100000, 'Regional Director': 300000, 'Store In-Charge': 100000, 'Corporate Purchase': 500000, 'Finance Manager': 1000000, 'Corporate Finance': 1000000, 'CFO': 100000000 },
    byType: { 'School': {}, 'Junior College': {}, 'Degree College': { rdAbove: 100000 } },
    escalateHours: 48, allowSelf: false, adminOverride: true, minQuotes: 3, quoteExceptionApprover: 'Finance Manager', poExpiryDays: 45, poAmendApprover: 'Finance Manager', allowNegative: false, monthlyCatLimitPct: 15, dupWarnDays: 7, deliveryReminderDays: 3, showStockToBranch: true, deptRestrict: true,
    numbering: { MR: 'MR', PR: 'PR', PO: 'PO', GRN: 'GRN', IN: 'IN', MV: 'MV', ADJ: 'ADJ', QT: 'QT' },
    delegates: [], emergencyReasonRequired: true, notifyEmail: true
  };
  return { items: I, cats: PROC_CATS.map(([id, name]) => ({ id, name, subs: PROC_SUBCATS[id] || [], active: true })), units: PROC_UNITS.slice(), depts: PROC_DEPTS.slice(), vendors: V, stores, budgets: [], cfg, seedVer: PROC_SEED_VER };
}
function defaultProcTx() { return { seedVer: 0, seq: {}, mr: [], pr: [], quotes: [], po: [], grn: [], issues: [], moves: [], adjs: [], ledger: [], stock: {}, notes: [], payments: [] }; }
Store.init({ proc: defaultProcMaster(), proc_tx: defaultProcTx() });

/* ---------- accessors ---------- */
const PM = () => Store.get('proc'), PT = () => Store.get('proc_tx');
const pcItem = id => PM().items.find(i => i.id === id) || { id, code: id, name: id + ' (removed item)', cat: 'OTH', sub: '', uom: 'Nos', rate: 0, reorder: 0, min: 0, max: 0, active: false };
const pcCat = id => (PM().cats.find(c => c.id === id) || { id, name: id }).name;
const pcVendor = id => PM().vendors.find(x => x.id === id) || { id, name: id, status: 'Unknown', cats: [], regions: [], rating: 0, credit: 0 };
const pcStore = id => PM().stores.find(s => s.id === id) || (String(id).startsWith('S-') ? { id, name: brName(id.slice(2)) + ' store', kind: 'Branch', branch: id.slice(2), active: true } : { id, name: id, kind: 'Branch', branch: '', active: true });
const pcBranch = id => DATA.branches.find(b => b.id === id) || null;
const pcBtype = id => (pcBranch(id) || {}).type || 'Corporate';
const pcBranchStore = bid => 'S-' + bid;
const pcAllStores = () => PM().stores.concat(DATA.branches.filter(b => !b.closed).map(b => ({ id: pcBranchStore(b.id), name: b.name + ' – branch store', kind: 'Branch', branch: b.id, active: !b.inactive })));
const pcNo = (tx, kind) => { const c = PM().cfg.numbering || {}; tx.seq = tx.seq || {}; tx.seq[kind] = (tx.seq[kind] || 0) + 1; return `${c[kind] || kind}-2627-${String(tx.seq[kind]).padStart(4, '0')}`; };
const pcVal = items => items.reduce((a, x) => a + (+x.qty || 0) * (+x.rate || 0), 0);
const pcLineTotal = x => { const g = (+x.qty || 0) * (+x.rate || 0), d = g * (+x.disc || 0) / 100; return Math.round((g - d) * (1 + (+x.tax || 0) / 100)); };
const pcHours = iso => iso ? Math.max(0, (new Date(PROC_TODAY + 'T18:00:00+05:30') - new Date(iso)) / 36e5) : 0;
const pcDays = iso => Math.round(pcHours(iso) / 24);
const pcAddDays = (iso, n) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const pcStatusPill = s => pill(s, /Approved|Received|Closed|Posted|Issued|Paid|Acknowledged|Matched|Active|Selected|Dispatched/.test(s) ? 'ok' : /Rejected|Cancelled|Expired|Overdue|Delayed|Inactive|above|Blocked/.test(s) ? 'bad' : /Submitted|Pending|hold|Clarification|Returned|Partially|Under|Quotations|Draft|Requested|Escalated|Awaiting/.test(s) ? 'warn' : '');
const pcPrio = p => pill(p, p === 'Emergency' ? 'bad' : p === 'Urgent' ? 'warn' : '');

/* ---------- people: who sits at each level for a request ---------- */
function pcUsersByRole(role) { return users().filter(u => u.status === 'Active' && userRoles(u).includes(role)); }
function pcPrincipal(bid) { const M = Store.get('mappings'); const u = users().find(x => x.role === 'Principal' && x.status === 'Active' && M.some(m => m.user === x.id && m.type === 'Own Branch Only' && (m.branches || []).includes(bid) && activeOn(m, ACCESS_DATE))); return u || users().find(x => x.role === 'Principal' && x.status === 'Active' && x.branch === bid) || null; }
function pcLevelUsers(level, req) {
  const b = pcBranch(req.branch);
  if (level.role === 'Principal') { const p = b && pcPrincipal(b.id); return p ? [p] : []; }
  if (level.role === 'Zonal Director') { const d = b && headOf('zd', b); return d ? [d] : []; }
  if (level.role === 'Regional Director') { const d = b && headOf('rd', b); return d ? [d] : []; }
  if (level.role === 'Finance') return PROC_FIN_ROLES.flatMap(r => pcUsersByRole(r));
  return pcUsersByRole(level.role);
}
function pcDelegateOf(u) { if (!u) return []; const d = ACCESS_DATE; return (PM().cfg.delegates || []).filter(x => x.to === u.id && x.active !== false && (!x.from || x.from <= d) && (!x.until || x.until >= d)).map(x => userById(x.user)).filter(Boolean); }
function pcCanAct(req, u = App.user) {
  if (!u || u.status !== 'Active' || !['Submitted', 'On hold', 'Clarification'].includes(req.status)) return false;
  const L = req.chain && req.chain[req.level]; if (!L) return false;
  const cfg = PM().cfg;
  if (!cfg.allowSelf && (u.id === req.createdBy)) return false;
  if (u.role === 'Super Admin' || (cfg.adminOverride && u.role === 'System Admin')) return true;
  const elig = pcLevelUsers(L, req);
  const me = [u, actingFor(u), ...pcDelegateOf(u)].filter(Boolean);
  if (elig.some(e => me.some(m => m.id === e.id))) return true;
  // role match without a named head (e.g. a vacant Zonal Director seat covered by any Zonal Director in the region)
  if (!elig.length) { const roles = L.role === 'Finance' ? PROC_FIN_ROLES : [L.role]; return me.some(m => userRoles(m).some(r => roles.includes(r))); }
  return false;
}
function pcAwaiting(req) { const L = req.chain && req.chain[req.level]; if (!L || !['Submitted', 'On hold', 'Clarification'].includes(req.status)) return ''; const us = pcLevelUsers(L, req); return us.length ? us.map(pName).join(' / ') : L.label + ' (vacant)'; }

/* ---------- approval chains ---------- */
function pcCfgFor(req) { const c = PM().cfg, t = c.byType && c.byType[pcBtype(req.branch)] || {}; return { mr: Object.assign({}, c.mr, t.mr || {}), pr: Object.assign({}, c.pr, Object.fromEntries(Object.entries(t).filter(([k]) => k !== 'mr'))) }; }
function pcChain(req) {
  const c = pcCfgFor(req), cfg = PM().cfg, val = pcVal(req.items), em = req.priority === 'Emergency', L = [];
  const add = (role, label) => L.push({ role, label: label || role, status: 'Pending', by: '', at: '', remark: '' });
  if (req.type === 'MR') {
    if (c.mr.principal) add('Principal', 'Principal / Branch authorised user');
    if (c.mr.zd === 'always' || (c.mr.zd === 'above' && val >= (+c.mr.zdAbove || 0)) || (em && c.mr.zdEmergency)) add('Zonal Director');
    if (c.mr.storeIncharge !== false) add('Store In-Charge');
  } else {
    const branchReq = !!req.branch && req.origin !== 'Replenishment' && req.origin !== 'Corporate';
    const skip = em ? (c.pr.emergencySkip || []) : [];
    if (branchReq) add('Principal', 'Principal / Branch authorised user');
    if (branchReq && !skip.includes('Zonal Director') && (c.pr.zd === 'always' || val >= (+c.pr.zdAbove || 0))) add('Zonal Director');
    if (branchReq && !skip.includes('Regional Director') && val >= (+c.pr.rdAbove || 0)) add('Regional Director');
    add('Corporate Purchase', 'Corporate Purchase Department');
    if (c.pr.finance === 'always' || val >= (+c.pr.financeAbove || 0) || (req.capex && c.pr.capexFinance)) add('Finance', 'Finance approval');
    if (val >= (+c.pr.cfoAbove || 0)) add('CFO', 'CFO / Final approver');
    // approval authority: the last approver must hold a limit covering the value
    const lim = r => r === 'Finance' ? Math.max(...PROC_FIN_ROLES.map(x => +cfg.limits[x] || 0)) : (+cfg.limits[r] || 0);
    if (L.length && lim(L[L.length - 1].role) < val && !L.some(l => l.role === 'CFO')) add('CFO', 'CFO / Final approver (above approval authority)');
  }
  return L;
}
function pcEscalated(req) { if (!['Submitted'].includes(req.status)) return false; const last = req.log && req.log.length ? req.log[req.log.length - 1].at : req.submittedAt; return pcHours(last) > (+PM().cfg.escalateHours || 48); }
function pcAge(req) { return pcDays(req.submittedAt || req.createdAt); }
function pcStage(req) {
  if (req.status === 'Submitted') { const L = req.chain[req.level]; return L ? `Awaiting ${L.label}` : 'Submitted'; }
  return req.status;
}
function pcLog(req, action, remark = '', extra = {}) { req.log = req.log || []; req.log.push(Object.assign({ at: nowIso(), by: App.user ? App.user.name : 'System', byId: App.user ? App.user.id : '', role: App.user ? App.user.role : 'System', action, remark }, extra)); }

/* ---------- duplicates and budgets ---------- */
function pcDupOf(req) {
  const tx = PT(), days = +PM().cfg.dupWarnDays || 7, L = req.type === 'MR' ? tx.mr : tx.pr, act = req.type === 'MR' ? PROC_ACTIVE_MR : PROC_ACTIVE_PR;
  return L.filter(o => o.id !== req.id && o.branch === req.branch && act.includes(o.status) && o.items.some(x => req.items.some(y => y.item === x.item)) && Math.abs((new Date(o.needBy) - new Date(req.needBy)) / 864e5) <= days);
}
function pcBudgetRows(filterFn) {
  const M = PM(), tx = PT(), rows = [];
  const key = (b, cat) => b + '|' + cat;
  const byKey = new Map();
  M.budgets.forEach(x => byKey.set(key(x.branch, x.cat), Object.assign({ committed: 0, ordered: 0, actual: 0 }, x)));
  const bump = (b, cat, f, v) => { const k = key(b || 'CORP', cat); if (!byKey.has(k)) byKey.set(k, { id: 'auto' + k, branch: b || 'CORP', cat, cc: 'CC-' + (b || 'CORP') + '-' + cat, amount: 0, committed: 0, ordered: 0, actual: 0 }); byKey.get(k)[f] += v; };
  tx.pr.forEach(p => { if (['Approved', 'Quotations', 'Vendor selected'].includes(p.status)) p.items.forEach(x => bump(p.branch, pcItem(x.item).cat, 'committed', (+x.qty || 0) * (+x.rate || 0))); });
  tx.po.forEach(po => { if (!['Cancelled', 'Draft'].includes(po.status)) { const pr = tx.pr.find(p => p.id === po.prId) || {}; po.items.forEach(x => bump(pr.branch, pcItem(x.item).cat, 'ordered', pcLineTotal(x))); } });
  tx.grn.forEach(g => { const po = tx.po.find(p => p.id === g.poId); if (!po) return; const pr = tx.pr.find(p => p.id === po.prId) || {}; g.items.forEach(x => { const l = po.items.find(y => y.item === x.item) || {}; bump(pr.branch, pcItem(x.item).cat, 'actual', (+x.accepted || 0) * (+l.rate || 0) * (1 - (+l.disc || 0) / 100) * (1 + (+l.tax || 0) / 100)); }); });
  if (typeof CT === 'function') { try { CT().vouchers.forEach(x => { if (x.status === 'Paid') bump(x.bid, cbCat(x.cat).bud, 'actual', x.amount); }); } catch (e) { } }
  byKey.forEach(r => { r.used = r.committed + r.ordered; r.available = r.amount - r.used; r.pct = r.amount ? r.used / r.amount * 100 : (r.used ? 999 : 0); rows.push(r); });
  return filterFn ? rows.filter(filterFn) : rows;
}
function pcBudgetFor(bid, cat) { return pcBudgetRows(r => r.branch === (bid || 'CORP') && r.cat === cat)[0] || { amount: 0, committed: 0, ordered: 0, actual: 0, used: 0, available: 0, pct: 0 }; }
function pcAlerts(req) {
  const A = [], cfg = PM().cfg, val = pcVal(req.items);
  if (req.type === 'PR') { const cats = [...new Set(req.items.map(x => pcItem(x.item).cat))]; cats.forEach(c => { const b = pcBudgetFor(req.branch, c), need = req.items.filter(x => pcItem(x.item).cat === c).reduce((a, x) => a + x.qty * x.rate, 0); if (b.amount && need > b.available + (['Approved', 'Quotations', 'Vendor selected'].includes(req.status) ? need : 0)) A.push(`Exceeds available ${pcCat(c)} budget (${INRS(b.available)} left of ${INRS(b.amount)})`); if (!b.amount && req.branch) A.push(`No budget allocated for ${pcCat(c)} at this branch`); }); }
  if (req.priority === 'Emergency') A.push('Emergency request – shortened approval route, reason recorded');
  const L = req.chain && req.chain[req.level]; if (L && req.status === 'Submitted') { const lim = L.role === 'Finance' ? Math.max(...PROC_FIN_ROLES.map(x => +cfg.limits[x] || 0)) : +cfg.limits[L.role] || 0; if (lim && val > lim && L.role !== 'CFO') A.push(`${L.label}: value above approval authority (${INRS(lim)}) – a higher level follows`); }
  if (pcEscalated(req)) A.push(`Pending beyond ${cfg.escalateHours} h – escalated to the next level`);
  const d = pcDupOf(req); if (d.length) A.push(`Possible duplicate of ${d.map(x => x.no).join(', ')}`);
  return A;
}

/* ---------- stock engine ---------- */
function pcStock(store, item, tx = PT()) { return (tx.stock[store] || {})[item] || 0; }
function pcPost(tx, store, item, qty, type, ref, extra = {}) {
  const cur = pcStock(store, item, tx), bal = cur + qty;
  if (bal < -1e-9 && !PM().cfg.allowNegative) throw new Error(`${pcItem(item).name}: only ${NUM(cur)} in ${pcStore(store).name}; negative stock is not allowed.`);
  tx.stock[store] = tx.stock[store] || {}; tx.stock[store][item] = Math.round(bal * 1000) / 1000;
  tx.ledger.unshift(Object.assign({ at: nowIso(), date: extra.date || PROC_TODAY, store, item, qty, bal: tx.stock[store][item], type, ref, by: App.user ? App.user.name : 'System' }, extra));
  if (tx.ledger.length > 3000) tx.ledger.length = 3000;
}
function pcValuation(store) { const tx = PT(); return Object.entries(tx.stock[store] || {}).reduce((a, [it, q]) => a + q * pcItem(it).rate, 0); }
function pcLowStock(store = 'CS') { const tx = PT(); return PM().items.filter(i => i.active).map(i => ({ item: i, qty: pcStock(store, i.id, tx) })).filter(r => r.item.reorder && r.qty <= r.item.reorder); }

/* ---------- notifications (in-app + simulated email) ---------- */
function pcNotify(tx, o) {
  const to = [...new Set((o.users || []).map(u => typeof u === 'string' ? u : u.id).filter(Boolean))];
  if (!to.length) return;
  tx.notes.unshift({ id: 'N' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), at: nowIso(), to, text: o.text, ref: o.ref || '', route: o.route || 'pr_inbox', read: [] });
  if (tx.notes.length > 400) tx.notes.length = 400;
  if (PM().cfg.notifyEmail && !o.quiet) { const names = to.map(id => (userById(id) || {}).email).filter(Boolean).slice(0, 6); if (names.length) Store.add('emaillog', { to: names.join(', '), subject: 'Store & Purchase: ' + o.text.slice(0, 110), trigger: 'Store & Purchase notification', status: 'Simulated (not delivered)', reason: 'Microsoft 365 is not connected in this demo' }); }
}
function pcMyNotes() { const u = App.user; return PT().notes.filter(n => n.to.includes(u.id)); }
function pcUnread() { const u = App.user; return pcMyNotes().filter(n => !(n.read || []).includes(u.id)).length; }
function pcRequesterUsers(req) { const L = [req.createdBy]; const p = req.branch && pcPrincipal(req.branch); if (p) L.push(p.id); return L; }

/* ---------- workflow operations (all return a promise after saving) ---------- */
async function pcSave(tx) { await Store.put('proc_tx', tx); }
function pcFind(tx, id) { return tx.mr.find(x => x.id === id) || tx.pr.find(x => x.id === id) || null; }
async function pcSubmit(id, remark = '') {
  const tx = Store.clone(PT()), r = pcFind(tx, id); if (!r) return;
  r.chain = pcChain(r); r.level = 0; r.status = 'Submitted'; r.submittedAt = nowIso(); r.value = pcVal(r.items);
  pcLog(r, 'Submitted', remark);
  // a Principal submitting a request of their own branch satisfies the Principal level
  while (r.chain[r.level] && r.chain[r.level].role === 'Principal' && App.user && (App.user.role === 'Principal' && App.user.branch === r.branch || App.user.role === 'Super Admin')) { Object.assign(r.chain[r.level], { status: 'Approved', by: App.user.name, at: nowIso(), remark: 'Submitted by the Principal' }); r.level++; }
  if (r.level >= r.chain.length) pcFinalApprove(tx, r);
  else pcNotify(tx, { users: pcLevelUsers(r.chain[r.level], r), text: `${r.no} (${r.type === 'MR' ? 'material' : 'purchase'} request, ${brName(r.branch) || 'Corporate'}, ${INRS(r.value)}) awaits your approval`, ref: r.id });
  audit('Store & Purchase', `${r.type} submitted`, { new: `${r.no} · ${brName(r.branch) || 'Corporate'} · ${INR(r.value)} · ${r.items.length} items`, reason: remark || r.purpose, approval: 'Pending' });
  await pcSave(tx);
}
function pcFinalApprove(tx, r) {
  r.status = 'Approved'; r.approvedAt = nowIso(); pcLog(r, 'Final approval complete');
  if (r.type === 'MR') pcNotify(tx, { users: [...pcUsersByRole('Store In-Charge'), ...pcUsersByRole('Storekeeper')], text: `${r.no} approved – verify stock and issue material to ${brName(r.branch)}`, ref: r.id, route: 'pr_store' });
  else pcNotify(tx, { users: pcUsersByRole('Corporate Purchase'), text: `${r.no} fully approved (${INRS(r.value)}) – obtain quotations`, ref: r.id, route: 'pr_vendors' });
  pcNotify(tx, { users: pcRequesterUsers(r), text: `${r.no} has been approved`, ref: r.id, route: r.type === 'MR' ? 'pr_mr' : 'pr_pr', quiet: true });
}
async function pcDecide(id, action, remark) {
  const tx = Store.clone(PT()), r = pcFind(tx, id); if (!r) return toast('Request not found.', 'bad');
  if (!pcCanAct(r)) return toast('You are not the approver for this level, or it is your own request.', 'bad');
  const L = r.chain[r.level], me = App.user.name, lvl = L.label;
  if (action === 'Approve') {
    Object.assign(L, { status: 'Approved', by: me, at: nowIso(), remark }); pcLog(r, `Approved at ${lvl}`, remark);
    if (r.type === 'PR' && L.role === 'Finance') { const over = pcAlerts(r).filter(a => /budget/.test(a)); if (over.length) pcLog(r, 'Finance approved above budget', over.join('; ')); }
    r.level++; r.status = 'Submitted';
    if (r.level >= r.chain.length) pcFinalApprove(tx, r); else pcNotify(tx, { users: pcLevelUsers(r.chain[r.level], r), text: `${r.no} (${INRS(r.value)}) awaits your approval after ${lvl}`, ref: r.id });
  } else if (action === 'Reject') { Object.assign(L, { status: 'Rejected', by: me, at: nowIso(), remark }); r.status = 'Rejected'; pcLog(r, `Rejected at ${lvl}`, remark); pcNotify(tx, { users: pcRequesterUsers(r), text: `${r.no} was rejected at ${lvl}: ${remark}`, ref: r.id, route: r.type === 'MR' ? 'pr_mr' : 'pr_pr' }); }
  else if (action === 'Return') { Object.assign(L, { status: 'Returned', by: me, at: nowIso(), remark }); r.status = 'Returned'; pcLog(r, `Returned for correction at ${lvl}`, remark); pcNotify(tx, { users: pcRequesterUsers(r), text: `${r.no} returned for correction: ${remark}`, ref: r.id, route: r.type === 'MR' ? 'pr_mr' : 'pr_pr' }); }
  else if (action === 'Hold') { r.status = 'On hold'; pcLog(r, `Put on hold at ${lvl}`, remark); pcNotify(tx, { users: pcRequesterUsers(r), text: `${r.no} is on hold at ${lvl}: ${remark}`, ref: r.id, quiet: true }); }
  else if (action === 'Clarify') { r.status = 'Clarification'; pcLog(r, `Clarification requested at ${lvl}`, remark); pcNotify(tx, { users: pcRequesterUsers(r), text: `${r.no}: clarification requested – ${remark}`, ref: r.id, route: r.type === 'MR' ? 'pr_mr' : 'pr_pr' }); }
  else if (action === 'Release') { r.status = 'Submitted'; pcLog(r, `Released from hold at ${lvl}`, remark); }
  audit('Store & Purchase', `${r.type} ${action === 'Approve' ? 'approved' : action === 'Reject' ? 'rejected' : action === 'Return' ? 'returned' : action === 'Hold' ? 'put on hold' : action === 'Clarify' ? 'clarification requested' : 'released'} · ${lvl}`, { old: r.no, new: `${brName(r.branch) || 'Corporate'} · ${INR(r.value)}`, reason: remark, approval: action === 'Approve' ? (r.status === 'Approved' ? 'Approved' : 'Pending next level') : action, approver: me });
  await pcSave(tx);
}
async function pcClarified(id, remark) { const tx = Store.clone(PT()), r = pcFind(tx, id); if (!r) return; r.status = 'Submitted'; pcLog(r, 'Clarification provided', remark); pcNotify(tx, { users: pcLevelUsers(r.chain[r.level], r), text: `${r.no}: clarification provided – ${remark}`, ref: r.id }); audit('Store & Purchase', `${r.type} clarification provided`, { new: r.no, reason: remark }); await pcSave(tx); }
async function pcCancel(id, remark) {
  const tx = Store.clone(PT()), r = pcFind(tx, id); if (!r) return;
  if (['Closed', 'Cancelled', 'Rejected'].includes(r.status)) return toast('This request is already closed.', 'bad');
  const was = r.status; r.status = 'Cancelled'; pcLog(r, 'Cancelled', remark, { was });
  if (r.type === 'MR' && r.prId) { const pr = tx.pr.find(p => p.id === r.prId); if (pr && ['Draft', 'Submitted', 'Returned', 'Approved', 'Quotations'].includes(pr.status)) { pr.status = 'Cancelled'; pcLog(pr, 'Cancelled with linked material request ' + r.no, remark); } }
  audit('Store & Purchase', `${r.type} cancelled`, { old: `${r.no} · ${was}`, new: 'Cancelled', reason: remark });
  await pcSave(tx);
}

/* material issue against an approved MR: full or partial, generates an Issue Note, reduces central stock */
async function pcIssue(mrId, lines, o) {
  const tx = Store.clone(PT()), r = tx.mr.find(x => x.id === mrId); if (!r) return;
  const store = o.store || 'CS', out = [];
  for (const l of lines) { const it = r.items.find(x => x.item === l.item); if (!it) continue; const pend = it.qty - (it.issued || 0) - (it.converted || 0) - (it.cancelled || 0); const q = Math.min(+l.qty || 0, pend); if (q <= 0) continue; pcPost(tx, store, it.item, -q, 'Issue', '', { branch: r.branch }); it.issued = (it.issued || 0) + q; out.push({ item: it.item, name: it.name, uom: it.uom, qty: q }); }
  if (!out.length) throw new Error('Nothing to issue: enter a quantity within the pending balance.');
  const note = { id: 'IS' + Date.now().toString(36), no: pcNo(tx, 'IN'), mrId: r.id, mrNo: r.no, branch: r.branch, date: PROC_TODAY, at: nowIso(), store, items: out, issuedBy: App.user.name, transport: o.transport || '', vehicle: o.vehicle || '', status: 'Dispatched', ack: null, remark: o.remark || '' };
  tx.ledger.filter(e => e.type === 'Issue' && !e.ref).forEach(e => e.ref = note.no);
  tx.issues.unshift(note); r.issueIds = (r.issueIds || []).concat(note.id);
  pcRollMr(r); pcLog(r, `Material issued · ${note.no}`, out.map(x => `${x.name} × ${x.qty}`).join(', '));
  pcNotify(tx, { users: pcRequesterUsers(r), text: `${note.no}: material dispatched against ${r.no} – acknowledge receipt on arrival`, ref: r.id, route: 'pr_mr' });
  audit('Store & Purchase', 'Material issued', { new: `${note.no} · ${r.no} · ${brName(r.branch)} · ${out.length} lines`, reason: o.remark || '' });
  await pcSave(tx); return note;
}
function pcRollMr(r) {
  const pend = r.items.reduce((a, it) => a + Math.max(0, it.qty - (it.issued || 0) - (it.converted || 0) - (it.cancelled || 0)), 0);
  const conv = r.items.reduce((a, it) => a + Math.max(0, (it.converted || 0) - (it.received || 0)), 0);
  if (pend > 0 && r.items.some(it => it.issued)) r.status = 'Partially issued';
  else if (pend > 0) r.status = 'Approved';
  else if (conv > 0) r.status = 'Under purchase';
  else r.status = 'Closed';
  if (r.status === 'Closed' && !r.closedAt) r.closedAt = nowIso();
}
async function pcAck(issueId, who, desig, otp) {
  const tx = Store.clone(PT()), n = tx.issues.find(x => x.id === issueId); if (!n) return;
  n.status = 'Received'; n.ack = { name: who, desig, at: nowIso(), otp: otp ? 'OTP verified' : 'Digital confirmation', by: App.user.name };
  const r = tx.mr.find(x => x.id === n.mrId); if (r) { pcLog(r, `Receipt acknowledged · ${n.no}`, `${who}, ${desig}`); }
  // branch store receives the material
  n.items.forEach(x => pcPost(tx, pcBranchStore(n.branch), x.item, x.qty, 'Receipt from central', n.no, { branch: n.branch }));
  pcNotify(tx, { users: [...pcUsersByRole('Store In-Charge')], text: `${n.no} received at ${brName(n.branch)} by ${who}`, ref: n.mrId, route: 'pr_store', quiet: true });
  audit('Store & Purchase', 'Material receipt acknowledged', { new: `${n.no} · ${brName(n.branch)} · ${who} (${desig})`, approval: n.ack.otp });
  await pcSave(tx);
}
/* unavailable quantity → linked purchase request (one PR per MR; no second PR for the same pending quantity) */
async function pcConvert(mrId, lines, reason) {
  const tx = Store.clone(PT()), r = tx.mr.find(x => x.id === mrId); if (!r) return;
  let pr = r.prId ? tx.pr.find(p => p.id === r.prId) : null;
  const add = [];
  for (const l of lines) { const it = r.items.find(x => x.item === l.item); if (!it) continue; const pend = it.qty - (it.issued || 0) - (it.converted || 0) - (it.cancelled || 0); const q = Math.min(+l.qty || 0, pend); if (q <= 0) continue; it.converted = (it.converted || 0) + q; it.unavailReason = l.reason || reason; add.push({ item: it.item, name: it.name, spec: it.spec, uom: it.uom, qty: q, rate: it.rate, brand: '', ordered: 0, received: 0 }); }
  if (!add.length) throw new Error('Nothing to convert: enter a quantity within the pending balance.');
  if (pr && !['Draft', 'Returned', 'Submitted'].includes(pr.status)) pr = null; // the earlier PR has moved on: open a new linked PR for the newly unavailable quantity
  if (!pr) { pr = { id: 'PR' + Date.now().toString(36), no: pcNo(tx, 'PR'), type: 'PR', origin: 'MR', mrId: r.id, mrNo: r.no, branch: r.branch, dept: r.dept, cc: 'CC-' + r.branch + '-' + r.cat, cat: r.cat, items: [], needBy: r.needBy, priority: r.priority, purpose: r.purpose, justification: `Converted from ${r.no}: ${reason}`, vendorPref: '', attach: r.attach || '', emergencyReason: r.priority === 'Emergency' ? (r.emergencyReason || r.purpose) : '', capex: false, status: 'Draft', level: 0, chain: [], createdBy: App.user.id, createdByName: App.user.name, createdAt: nowIso(), log: [], poIds: [] }; tx.pr.unshift(pr); r.prId = pr.id; r.prNo = pr.no; }
  add.forEach(a => { const ex = pr.items.find(x => x.item === a.item); if (ex && pr.status === 'Draft') { ex.qty += a.qty; } else pr.items.push(a); });
  pr.value = pcVal(pr.items); pr.capex = pr.items.some(x => pcItem(x.item).capital);
  pcLog(pr, `Quantity added from ${r.no}`, add.map(x => `${x.name} × ${x.qty}`).join(', '));
  pcRollMr(r); pcLog(r, `Marked unavailable → ${pr.no}`, add.map(x => `${x.name} × ${x.qty}`).join(', ') + ' · ' + reason);
  pcNotify(tx, { users: pcRequesterUsers(r), text: `${r.no}: ${add.length} line(s) not available in the Central Store – purchase request ${pr.no} created`, ref: pr.id, route: 'pr_pr' });
  pcNotify(tx, { users: pcUsersByRole('Corporate Purchase'), text: `${pr.no} created from ${r.no} for unavailable stock (${INRS(pr.value)})`, ref: pr.id, route: 'pr_pr', quiet: true });
  audit('Store & Purchase', 'MR quantity converted to PR', { old: r.no, new: `${pr.no} · ${INR(pr.value)}`, reason });
  await pcSave(tx); return pr;
}

/* ---------- demo seed (deterministic; regenerated when PROC_SEED_VER changes, user records are kept) ---------- */
function pcRng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function pcSeedTx(M) {
  const tx = defaultProcTx(); tx.seedVer = PROC_SEED_VER;
  const rnd = pcRng(20261019), pick = a => a[Math.floor(rnd() * a.length)], between = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const iso = (m, d) => `2026-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, ts = (dt, h = 10) => `${dt}T${String(h).padStart(2, '0')}:${String(between(0, 59)).padStart(2, '0')}:00+05:30`;
  const sys = { name: 'Seed', id: '' };
  const savedUser = App.user;
  const withUser = (u, f) => { App.user = u || savedUser || { name: 'System', id: '', role: 'System' }; try { return f(); } finally { App.user = savedUser; } };
  // opening stock in the Central Store
  M.items.forEach(i => { const q = i.capital ? between(0, Math.max(2, i.max / 4)) : between(Math.round(i.reorder * 0.6), i.max); if (q > 0) { tx.stock.CS = tx.stock.CS || {}; tx.stock.CS[i.id] = q; tx.ledger.push({ at: ts(iso(4, 1), 9), date: iso(4, 1), store: 'CS', item: i.id, qty: q, bal: q, type: 'Opening', ref: 'Opening stock 2026-27', by: 'Store In-Charge (demo)' }); } });
  // a few items deliberately low or out of stock
  ['IT001', 'IT013', 'IT016', 'IT029', 'IT036'].forEach((id, k) => { const i = M.items.find(x => x.id === id); if (!i) return; const q = k % 2 ? 0 : Math.max(0, Math.round(i.reorder * 0.4)); tx.stock.CS[id] = q; tx.ledger.push({ at: ts(iso(9, 20 + k), 15), date: iso(9, 20 + k), store: 'CS', item: id, qty: -(tx.ledger.find(e => e.item === id).qty - q), bal: q, type: 'Issue', ref: 'Issues Apr–Sep (summary)', by: 'Storekeeper (demo)' }); });
  // budgets: annual allocation per branch and category by business type
  const base = { 'School': 1, 'Junior College': 1.3, 'Degree College': 1.6 }, catBase = { STA: 240000, BKS: 180000, CLS: 90000, UNI: 150000, ITH: 420000, FUR: 380000, ELP: 140000, MNT: 220000, HKP: 160000, LAB: 200000, SPT: 110000, EVM: 120000, OTH: 60000 };
  M.budgets = []; DATA.branches.filter(b => !b.closed).forEach(b => PROC_CATS.forEach(([c]) => { if (c === 'LAB' && b.type === 'School') return; M.budgets.push({ id: 'BG-' + b.id + '-' + c, ay: '2026-27', branch: b.id, dept: '', cat: c, cc: 'CC-' + b.id + '-' + c, amount: Math.round(catBase[c] * base[b.type] * (0.8 + rnd() * 0.5) / 5000) * 5000 }); }));
  PROC_CATS.forEach(([c]) => M.budgets.push({ id: 'BG-CORP-' + c, ay: '2026-27', branch: 'CORP', dept: 'Corporate', cat: c, cc: 'CC-CORP-' + c, amount: Math.round(catBase[c] * 2.2 / 10000) * 10000 }));
  const branches = DATA.branches.filter(b => !b.closed && !b.inactive);
  const reqUser = b => { const r = users().find(u => u.role === 'Branch Requester' && u.branch === b.id && u.status === 'Active'); return r || pcPrincipal(b.id) || { id: 'U000', name: 'Branch user' }; };
  const mkItems = (n, cats) => { const pool = M.items.filter(i => (!cats || cats.includes(i.cat)) && !i.capital); const out = []; while (out.length < n && pool.length) { const i = pool.splice(Math.floor(rnd() * pool.length), 1)[0]; out.push({ item: i.id, code: i.code, name: i.name, spec: i.sub, uom: i.uom, qty: between(2, Math.max(3, Math.round(i.reorder / 4))), rate: i.rate, issued: 0, converted: 0, cancelled: 0, received: 0 }); } return out; };
  const approveChain = (r, upto, dt) => { r.chain = pcChain(r); r.level = 0; r.status = 'Submitted'; r.submittedAt = ts(dt, 10); r.log = [{ at: r.submittedAt, by: r.createdByName, byId: r.createdBy, role: 'Requester', action: 'Submitted', remark: '' }]; let d = dt; for (let i = 0; i < upto && i < r.chain.length; i++) { d = pcAddDays(d, between(0, 2)); const us = pcLevelUsers(r.chain[i], r); const by = us.length ? pName(us[0]) : r.chain[i].label; Object.assign(r.chain[i], { status: 'Approved', by, at: ts(d, between(9, 18)), remark: pick(['Approved', 'Approved – within budget', 'Verified requirement', 'OK to proceed']) }); r.log.push({ at: r.chain[i].at, by, byId: us.length ? us[0].id : '', role: r.chain[i].role, action: `Approved at ${r.chain[i].label}`, remark: r.chain[i].remark }); r.level = i + 1; } if (r.level >= r.chain.length) { r.status = 'Approved'; r.approvedAt = ts(pcAddDays(d, 0), 18); r.log.push({ at: r.approvedAt, by: 'System', role: 'System', action: 'Final approval complete', remark: '' }); } return d; };
  let k = 0;
  const mkMR = (b, dt, cats, o = {}) => { const u = reqUser(b); const items = mkItems(between(1, 4), cats); const cat = pcItem(items[0].item).cat; const r = Object.assign({ id: 'MR' + String(++k).padStart(3, '0'), no: pcNo(tx, 'MR'), type: 'MR', branch: b.id, bt: b.type, dept: pick(PROC_DEPTS.slice(0, 9)), date: dt, needBy: pcAddDays(dt, between(7, 21)), cat, priority: rnd() < 0.12 ? 'Urgent' : rnd() < 0.05 ? 'Emergency' : 'Normal', purpose: pick(['Term 2 classroom requirement', 'Replacement of worn-out stock', 'New section opened', 'Annual day preparation', 'Lab practicals – Inter II', 'Monthly housekeeping consumption', 'Office consumables', 'Sports day']), remarks: '', attach: rnd() < 0.3 ? 'requirement_list.pdf' : '', items, value: 0, status: 'Draft', level: 0, chain: [], createdBy: u.id, createdByName: pName(u), createdAt: ts(dt, 9), log: [], issueIds: [], seed: true }, o); r.value = pcVal(items); if (r.priority === 'Emergency') r.emergencyReason = 'Water line burst – immediate repair'; tx.mr.push(r); return r; };
  const issueFrom = (r, dt, partial) => withUser({ name: 'Storekeeper (demo)', id: 'SEEDSK', role: 'Storekeeper' }, () => { const out = []; r.items.forEach((it, i) => { const pend = it.qty - it.issued - it.converted; if (pend <= 0) return; const avail = pcStock('CS', it.item, tx); let q = partial && i === 0 ? Math.max(1, Math.floor(pend / 2)) : pend; q = Math.min(q, avail); if (q <= 0) return; pcPost(tx, 'CS', it.item, -q, 'Issue', 'pending', { branch: r.branch, date: dt }); it.issued += q; out.push({ item: it.item, name: it.name, uom: it.uom, qty: q }); }); if (!out.length) return null; const note = { id: 'IS' + String(tx.issues.length + 1).padStart(3, '0'), no: pcNo(tx, 'IN'), mrId: r.id, mrNo: r.no, branch: r.branch, date: dt, at: ts(dt, 11), store: 'CS', items: out, issuedBy: 'Storekeeper (demo)', transport: pick(['MSEA van TS09 UB 4521', 'Courier – Safexpress', 'Collected by branch', 'MSEA van TS09 UB 7730']), status: 'Dispatched', ack: null, remark: '', seed: true }; tx.ledger.filter(e => e.ref === 'pending').forEach(e => { e.ref = note.no; e.at = ts(dt, 11); e.by = 'Storekeeper (demo)'; }); tx.issues.push(note); r.issueIds.push(note.id); r.log.push({ at: note.at, by: 'Storekeeper (demo)', role: 'Storekeeper', action: `Material issued · ${note.no}`, remark: out.map(x => `${x.name} × ${x.qty}`).join(', ') }); return note; });
  const ackNote = (n, dt) => { const r = tx.mr.find(x => x.id === n.mrId); n.status = 'Received'; n.ack = { name: pName(pcPrincipal(n.branch)) === 'Vacant' ? 'Office Superintendent' : 'Office Superintendent – ' + brName(n.branch), desig: 'Office Superintendent', at: ts(dt, 12), otp: 'OTP verified', by: pName(reqUser(pcBranch(n.branch))) }; n.items.forEach(x => { const st = pcBranchStore(n.branch); tx.stock[st] = tx.stock[st] || {}; tx.stock[st][x.item] = (tx.stock[st][x.item] || 0) + x.qty; tx.ledger.push({ at: n.ack.at, date: dt, store: st, item: x.item, qty: x.qty, bal: tx.stock[st][x.item], type: 'Receipt from central', ref: n.no, by: n.ack.by, branch: n.branch }); }); r.log.push({ at: n.ack.at, by: n.ack.by, role: 'Requester', action: `Receipt acknowledged · ${n.no}`, remark: n.ack.name }); };
  const convert = (r, dt, reason) => { const it = r.items[r.items.length - 1]; const pend = it.qty - it.issued - it.converted; if (pend <= 0) return null; it.converted += pend; it.unavailReason = reason; const pr = { id: 'PR' + String(tx.pr.length + 1).padStart(3, '0'), no: pcNo(tx, 'PR'), type: 'PR', origin: 'MR', mrId: r.id, mrNo: r.no, branch: r.branch, bt: r.bt, dept: r.dept, cc: 'CC-' + r.branch + '-' + pcItem(it.item).cat, cat: pcItem(it.item).cat, items: [{ item: it.item, name: it.name, spec: it.spec, uom: it.uom, qty: pend, rate: it.rate, brand: '', ordered: 0, received: 0 }], needBy: r.needBy, priority: r.priority, purpose: r.purpose, justification: `Converted from ${r.no}: ${reason}`, vendorPref: '', attach: '', emergencyReason: '', capex: pcItem(it.item).capital, status: 'Draft', level: 0, chain: [], createdBy: 'SEEDSK', createdByName: 'Store In-Charge (demo)', createdAt: ts(dt, 12), log: [{ at: ts(dt, 12), by: 'Store In-Charge (demo)', role: 'Store In-Charge', action: `Created from ${r.no} (stock unavailable)`, remark: reason }], poIds: [], seed: true }; pr.value = pcVal(pr.items); tx.pr.push(pr); r.prId = pr.id; r.prNo = pr.no; r.log.push({ at: ts(dt, 12), by: 'Store In-Charge (demo)', role: 'Store In-Charge', action: `Marked unavailable → ${pr.no}`, remark: `${it.name} × ${pend} · ${reason}` }); return pr; };
  // material requests across months and branches
  const months = [[4, 8], [4, 22], [5, 6], [5, 19], [6, 10], [6, 24], [7, 7], [7, 21], [8, 4], [8, 18], [9, 1], [9, 15], [9, 29], [10, 6], [10, 13], [10, 16], [10, 17], [10, 19]];
  const pickBranches = n => { const L = branches.slice(); const out = []; while (out.length < n && L.length) out.push(L.splice(Math.floor(rnd() * L.length), 1)[0]); return out; };
  months.forEach(([m, d], mi) => {
    pickBranches(mi < 12 ? 2 : 3).forEach((b, bi) => {
      const dt0 = iso(m, d + bi), dt = dt0 > PROC_TODAY ? PROC_TODAY : dt0, cats = pick([['STA', 'CLS'], ['HKP'], ['STA'], ['SPT', 'EVM'], ['ELP', 'MNT'], ['LAB'], ['BKS', 'STA'], ['UNI']]);
      if (b.type === 'School' && cats[0] === 'LAB') cats[0] = 'CLS';
      const r = mkMR(b, dt, cats);
      const age = (new Date(PROC_TODAY) - new Date(dt)) / 864e5;
      if (age > 20) { approveChain(r, 9, dt); const d2 = pcAddDays(dt, between(2, 5)); const n = issueFrom(r, d2, rnd() < 0.3); if (n) { if (rnd() < 0.85) ackNote(n, pcAddDays(d2, between(1, 4))); } if (r.items.some(it => it.qty - it.issued - it.converted > 0)) { if (rnd() < 0.6) { const rest = issueFrom(r, pcAddDays(d2, between(3, 9)), false); if (rest) ackNote(rest, pcAddDays(d2, between(5, 12))); } else convert(r, pcAddDays(d2, 1), pick(['Stock exhausted', 'Not a stocked item', 'Below reorder – replenishment pending'])); } pcRollMr(r); }
      else if (age > 8) { approveChain(r, 9, dt); if (rnd() < 0.5) { const n = issueFrom(r, pcAddDays(dt, 3), true); if (n && rnd() < 0.5) ackNote(n, pcAddDays(dt, 5)); if (rnd() < 0.5) convert(r, pcAddDays(dt, 3), 'Stock exhausted'); } pcRollMr(r); }
      else if (age > 3) { approveChain(r, between(0, 2), dt); }
      else if (bi === 0) { approveChain(r, 0, dt); } else { /* draft */ }
    });
  });
  // purchase requests: direct, replenishment, corporate, plus the MR conversions above
  const mkPR = (b, dt, items, o) => { const u = b ? reqUser(b) : (pcUsersByRole('Corporate Purchase')[0] || { id: '', name: 'Corporate Purchase' }); const pr = Object.assign({ id: 'PR' + String(tx.pr.length + 1).padStart(3, '0'), no: pcNo(tx, 'PR'), type: 'PR', origin: 'Direct', mrId: '', mrNo: '', branch: b ? b.id : '', bt: b ? b.type : 'Corporate', dept: b ? pick(PROC_DEPTS.slice(0, 9)) : 'Corporate', cc: 'CC-' + (b ? b.id : 'CORP') + '-' + pcItem(items[0].item).cat, cat: pcItem(items[0].item).cat, items, needBy: pcAddDays(dt, between(15, 45)), priority: 'Normal', purpose: pick(['Replacement of old equipment', 'New computer lab', 'Furniture for additional section', 'Annual uniform stock', 'Campus lighting upgrade', 'Science lab upgrade']), justification: 'Approved in branch requirement review', vendorPref: '', attach: 'quotation_indicative.pdf', emergencyReason: '', capex: items.some(x => pcItem(x.item).capital), status: 'Draft', level: 0, chain: [], createdBy: u.id, createdByName: pName(u), createdAt: ts(dt, 9), log: [], poIds: [], seed: true }, o); pr.value = pcVal(pr.items); tx.pr.push(pr); return pr; };
  const capItems = (ids, qs) => ids.map((id, i) => { const it = pcItem(id); return { item: id, name: it.name, spec: it.sub, uom: it.uom, qty: qs[i], rate: it.rate, brand: '', ordered: 0, received: 0 }; });
  const B = pickBranches(8);
  const prA = mkPR(B[0], iso(5, 12), capItems(['IT016', 'IT018', 'IT019'], [12, 12, 1]), { purpose: 'New computer lab – 12 systems' });
  const prB = mkPR(B[1], iso(6, 3), capItems(['IT021', 'IT023'], [40, 2]), { purpose: 'Furniture for two additional sections' });
  const prC = mkPR(B[2], iso(7, 15), capItems(['IT013', 'IT015'], [400, 300]), { purpose: 'Annual uniform stock' });
  const prD = mkPR(null, iso(8, 5), capItems(['IT001', 'IT002', 'IT005'], [600, 120, 40]), { origin: 'Replenishment', purpose: 'Central Store replenishment – stationery below reorder level', createdBy: 'SEEDSK', createdByName: 'Store In-Charge (demo)' });
  const prE = mkPR(B[3], iso(9, 2), capItems(['IT026', 'IT025'], [20, 60]), { purpose: 'Campus lighting and fans – summer readiness' });
  const prF = mkPR(B[4], iso(9, 22), capItems(['IT038', 'IT037', 'IT036'], [2, 60, 20]), { purpose: 'Science lab upgrade' });
  const prG = mkPR(null, iso(10, 1), capItems(['IT043', 'IT044'], [12, 2]), { origin: 'Corporate', purpose: 'Annual day – group event branding', createdBy: (pcUsersByRole('Corporate Purchase')[0] || {}).id || '' });
  const prH = mkPR(B[5], iso(10, 12), capItems(['IT017', 'IT018'], [3, 6]), { purpose: 'Printers for admin office' });
  const prI = mkPR(B[6], iso(10, 15), capItems(['IT029', 'IT030'], [8, 12]), { priority: 'Emergency', emergencyReason: 'Rain damage to ground-floor classrooms – repainting before inspection on 25 Oct', purpose: 'Emergency repair after rain damage' });
  const prJ = mkPR(B[7], iso(10, 18), capItems(['IT040', 'IT042'], [20, 30]), { purpose: 'Inter-branch sports meet kit' });
  // move conversions and direct PRs through approvals
  tx.pr.forEach(pr => { const age = (new Date(PROC_TODAY) - new Date(pr.createdAt.slice(0, 10))) / 864e5; if (pr === prJ) return; if (pr === prI) { approveChain(pr, 1, pr.createdAt.slice(0, 10)); return; } if (pr === prH) { approveChain(pr, 2, pr.createdAt.slice(0, 10)); return; } if (age > 25) approveChain(pr, 9, pr.createdAt.slice(0, 10)); else approveChain(pr, between(1, 3), pr.createdAt.slice(0, 10)); });
  // quotations, vendor selection, purchase orders, GRNs for the older approved PRs
  const vendorsFor = cat => M.vendors.filter(v => v.status === 'Active' && v.cats.includes(cat));
  const mkQuotes = (pr, dt, n) => { const vs = vendorsFor(pr.cat).slice(0, n); const out = vs.map((vd, i) => { const items = pr.items.map(x => ({ item: x.item, qty: x.qty, rate: Math.round(x.rate * (0.92 + i * 0.045 + rnd() * 0.04)), disc: pick([0, 2, 5]), tax: pcItem(x.item).cat === 'BKS' ? 5 : 18 })); const q = { id: 'QT' + String(tx.quotes.length + 1).padStart(3, '0'), no: pcNo(tx, 'QT'), prId: pr.id, vendor: vd.id, date: pcAddDays(dt, between(1, 6)), items, deliveryDays: between(7, 30), payTerms: pick(['30 days credit', '50% advance, balance on delivery', '45 days credit']), warranty: pr.capex ? pick(['1 year', '2 years', '3 years onsite']) : 'NA', total: 0, selected: false, justification: '', doc: 'quote_' + vd.id.toLowerCase() + '.pdf', seed: true }; q.total = items.reduce((a, x) => a + pcLineTotal(x), 0); tx.quotes.push(q); return q; }); pr.status = 'Quotations'; pr.log.push({ at: ts(pcAddDays(dt, 1), 10), by: 'Corporate Purchase (demo)', role: 'Corporate Purchase', action: 'Quotation enquiries sent', remark: out.map(q => pcVendor(q.vendor).name).join(', ') }); return out; };
  const selectQuote = (pr, qs, dt) => { const best = qs.slice().sort((a, b) => a.total - b.total)[0]; best.selected = true; best.justification = qs.length >= 3 ? 'Lowest landed cost with acceptable delivery and warranty' : 'Only two approved vendors supply this category – exception approved by Finance Manager'; pr.status = 'Vendor selected'; pr.selectedVendor = best.vendor; pr.log.push({ at: ts(dt, 15), by: 'Corporate Purchase (demo)', role: 'Corporate Purchase', action: 'Vendor selected', remark: `${pcVendor(best.vendor).name} · ${INR(best.total)} · ${best.justification}` }); if (qs.length < 3) { pr.quoteException = { reason: 'Fewer than three quotations available', approver: 'Finance Manager (demo)', at: ts(dt, 16) }; } return best; };
  const mkPO = (pr, q, dt, o = {}) => { const po = Object.assign({ id: 'PO' + String(tx.po.length + 1).padStart(3, '0'), no: pcNo(tx, 'PO'), prId: pr.id, prNo: pr.no, mrNo: pr.mrNo || '', vendor: q.vendor, branch: pr.branch, items: q.items.map(x => { const l = pr.items.find(y => y.item === x.item); return { item: x.item, name: l.name, spec: l.spec, uom: l.uom, qty: x.qty, rate: x.rate, disc: x.disc, tax: x.tax, total: pcLineTotal(x), received: 0, accepted: 0 }; }), value: q.total, deliverTo: pr.branch ? pcBranchStore(pr.branch) : 'CS', billTo: 'MS Educational and Welfare Trust, Corporate Office, Hyderabad', deliveryDate: pcAddDays(dt, q.deliveryDays), payTerms: q.payTerms, warranty: q.warranty, terms: 'Delivery to the address above; invoice to quote PO number; goods subject to inspection; payment after GRN acceptance.', status: 'Issued', expiry: pcAddDays(dt, 45), ack: null, amendments: [], cancel: null, approvedBy: pr.chain.filter(l => l.status === 'Approved').map(l => `${l.label}: ${l.by}`), createdBy: 'Corporate Purchase (demo)', createdAt: ts(dt, 11), log: [{ at: ts(dt, 11), by: 'Corporate Purchase (demo)', role: 'Corporate Purchase', action: 'Purchase order issued', remark: pcVendor(q.vendor).name }], seed: true }, o); pr.items.forEach(l => { const x = po.items.find(y => y.item === l.item); if (x) l.ordered = (l.ordered || 0) + x.qty; }); tx.po.push(po); pr.poIds.push(po.id); pr.status = 'PO issued'; pr.log.push({ at: po.createdAt, by: 'Corporate Purchase (demo)', role: 'Corporate Purchase', action: `Purchase order ${po.no} issued`, remark: pcVendor(q.vendor).name + ' · ' + INR(po.value) }); return po; };
  const mkGRN = (po, dt, frac, o = {}) => { const pr = tx.pr.find(p => p.id === po.prId); const items = po.items.map((x, i) => { const pend = x.qty - x.received; const rec = Math.max(0, Math.min(pend, Math.ceil(x.qty * frac))); const rej = o.reject && i === 0 ? Math.min(rec, Math.max(1, Math.round(rec * 0.08))) : 0; const dam = o.damage && i === 0 ? Math.min(rec - rej, 1) : 0; return { item: x.item, name: x.name, received: rec, accepted: rec - rej - dam, rejected: rej, damaged: dam, note: rej ? 'Wrong specification' : dam ? 'Transit damage' : '' }; }).filter(x => x.received > 0); if (!items.length) return null; const g = { id: 'GR' + String(tx.grn.length + 1).padStart(3, '0'), no: pcNo(tx, 'GRN'), poId: po.id, poNo: po.no, vendor: po.vendor, date: dt, at: ts(dt, 14), store: po.deliverTo, items, invoiceNo: `INV/${pcVendor(po.vendor).id}/${between(1000, 9999)}`, invoiceValue: 0, challan: `DC-${between(100, 999)}`, docs: 'invoice.pdf, challan.pdf', qc: items.some(x => x.rejected || x.damaged) ? 'Checked – exceptions noted' : 'Checked – OK', status: 'Posted', by: po.deliverTo === 'CS' ? 'Storekeeper (demo)' : 'Branch receiver', seed: true }; g.invoiceValue = Math.round(items.reduce((a, x) => { const l = po.items.find(y => y.item === x.item); return a + x.received * l.rate * (1 - l.disc / 100) * (1 + l.tax / 100); }, 0) * (o.overbill ? 1.06 : 1)); items.forEach(x => { const l = po.items.find(y => y.item === x.item); l.received += x.received; l.accepted += x.accepted; if (x.accepted) { tx.stock[g.store] = tx.stock[g.store] || {}; tx.stock[g.store][x.item] = (tx.stock[g.store][x.item] || 0) + x.accepted; tx.ledger.push({ at: g.at, date: dt, store: g.store, item: x.item, qty: x.accepted, bal: tx.stock[g.store][x.item], type: 'GRN', ref: g.no, by: g.by, branch: pr.branch }); } if (x.rejected || x.damaged) tx.ledger.push({ at: g.at, date: dt, store: g.store, item: x.item, qty: 0, bal: (tx.stock[g.store] || {})[x.item] || 0, type: x.rejected ? 'Rejected (not stocked)' : 'Damaged (not stocked)', ref: g.no, by: g.by, branch: pr.branch, note: x.note, n: x.rejected + x.damaged }); const pl = pr.items.find(y => y.item === x.item); if (pl) pl.received = (pl.received || 0) + x.accepted; }); const done = po.items.every(x => x.received >= x.qty); po.status = done ? 'Received' : 'Partially received'; po.log.push({ at: g.at, by: g.by, role: 'Store', action: `GRN ${g.no} posted`, remark: items.map(x => `${x.name} ${x.accepted}/${x.received}`).join(', ') }); pr.status = pr.poIds.map(id => tx.po.find(p => p.id === id)).every(p => p.status === 'Received') ? 'Received' : 'Partially received'; pr.log.push({ at: g.at, by: g.by, role: 'Store', action: `Goods received · ${g.no}`, remark: '' }); if (pr.mrId) { const mr = tx.mr.find(m => m.id === pr.mrId); if (mr && g.store === pcBranchStore(mr.branch)) { items.forEach(x => { const ml = mr.items.find(y => y.item === x.item); if (ml) ml.received = (ml.received || 0) + x.accepted; }); pcRollMr(mr); mr.log.push({ at: g.at, by: g.by, role: 'Store', action: `Purchased quantity delivered · ${g.no}`, remark: '' }); } } tx.grn.push(g); return g; };
  const flow = (pr, nQ, opts = {}) => { if (pr.status !== 'Approved') return; const d0 = pr.approvedAt.slice(0, 10); const qs = mkQuotes(pr, d0, nQ); if (opts.stopAt === 'quotes') return; const best = selectQuote(pr, qs, pcAddDays(d0, 7)); if (opts.stopAt === 'selected') return; const po = mkPO(pr, best, pcAddDays(d0, 9)); if (opts.ack !== false) { po.ack = { at: ts(pcAddDays(d0, 10), 10), by: pcVendor(po.vendor).contact, mode: 'Email' }; po.status = 'Acknowledged'; } if (opts.stopAt === 'po') return; mkGRN(po, pcAddDays(d0, 9 + (opts.late ? 40 : between(8, 20))), opts.frac || 1, opts); if (opts.second) mkGRN(po, pcAddDays(d0, 45), 1); };
  flow(prA, 3, { frac: 0.5, second: true, reject: true }); flow(prB, 3, { frac: 1, damage: true }); flow(prC, 2, { frac: 0.6, overbill: true }); flow(prD, 3, { frac: 1 }); flow(prE, 3, { stopAt: 'po', ack: false }); flow(prF, 3, { stopAt: 'selected' }); flow(prG, 2, { stopAt: 'quotes' });
  tx.pr.filter(p => p.origin === 'MR' && p.status === 'Approved').forEach((p, i) => flow(p, 3, i % 3 === 0 ? { frac: 1 } : i % 3 === 1 ? { stopAt: 'po' } : { stopAt: 'quotes' }));
  // PO amendment and cancellation examples
  const poB = tx.po.find(p => p.prId === prB.id); if (poB) poB.amendments.push({ at: ts(iso(7, 2), 11), by: 'Corporate Purchase (demo)', change: 'Delivery date extended by 10 days at vendor request', approved: true, approver: 'Finance Manager (demo)', approvedAt: ts(iso(7, 2), 16) });
  const poE = tx.po.find(p => p.prId === prE.id); if (poE) { poE.deliveryDate = iso(10, 10); poE.expiry = iso(10, 30); }
  // returns, transfers, repair, adjustments
  const rb = tx.issues.filter(n => n.status === 'Received').slice(0, 3);
  rb.forEach((n, i) => { const x = n.items[0]; const kind = ['Return', 'Transfer', 'Repair'][i]; const to = kind === 'Return' ? 'CS' : kind === 'Transfer' ? pcBranchStore(pickBranches(1).filter(b => b.id !== n.branch)[0]?.id || 'B01') : 'CS'; const q = Math.max(1, Math.floor(x.qty / 3)); const mv = { id: 'MV' + String(tx.moves.length + 1).padStart(3, '0'), no: pcNo(tx, 'MV'), kind, from: pcBranchStore(n.branch), to, branch: n.branch, items: [{ item: x.item, name: x.name, uom: x.uom, qty: q }], reason: ['Excess stock after section merger', 'Sister branch short of stock for exams', 'Equipment not working – send for repair'][i], status: ['Received', 'Dispatched', 'Requested'][i], createdBy: reqUser(pcBranch(n.branch)).id, createdByName: pName(reqUser(pcBranch(n.branch))), createdAt: ts(iso(10, 2 + i), 10), log: [{ at: ts(iso(10, 2 + i), 10), by: pName(reqUser(pcBranch(n.branch))), role: 'Requester', action: 'Requested', remark: '' }], seed: true }; if (i < 2) { mv.log.push({ at: ts(iso(10, 3 + i), 11), by: 'Store In-Charge (demo)', role: 'Store In-Charge', action: 'Approved', remark: 'OK' }, { at: ts(iso(10, 4 + i), 9), by: mv.createdByName, role: 'Requester', action: 'Dispatched', remark: 'MSEA van' }); const fs = tx.stock[mv.from] || {}; if ((fs[x.item] || 0) >= q) { fs[x.item] -= q; tx.ledger.push({ at: ts(iso(10, 4 + i), 9), date: iso(10, 4 + i), store: mv.from, item: x.item, qty: -q, bal: fs[x.item], type: kind + ' out', ref: mv.no, by: mv.createdByName, branch: n.branch }); mv.stockOut = true; } } if (i === 0) { mv.log.push({ at: ts(iso(10, 6), 15), by: 'Storekeeper (demo)', role: 'Storekeeper', action: 'Received', remark: 'Counted and shelved' }); tx.stock.CS[x.item] = (tx.stock.CS[x.item] || 0) + q; tx.ledger.push({ at: ts(iso(10, 6), 15), date: iso(10, 6), store: 'CS', item: x.item, qty: q, bal: tx.stock.CS[x.item], type: 'Return in', ref: mv.no, by: 'Storekeeper (demo)' }); } tx.moves.push(mv); });
  tx.adjs.push({ id: 'AJ001', no: pcNo(tx, 'ADJ'), store: 'CS', item: 'IT003', counted: Math.max(0, (tx.stock.CS.IT003 || 0) - 2), system: tx.stock.CS.IT003 || 0, diff: -2, reason: 'Physical verification 30 Sep – two boxes short', status: 'Approved', by: 'Storekeeper (demo)', approver: 'Store In-Charge (demo)', at: ts(iso(9, 30), 17), decidedAt: ts(iso(10, 1), 10), seed: true });
  if (tx.stock.CS.IT003 >= 2) { tx.stock.CS.IT003 -= 2; tx.ledger.push({ at: ts(iso(10, 1), 10), date: iso(10, 1), store: 'CS', item: 'IT003', qty: -2, bal: tx.stock.CS.IT003, type: 'Adjustment', ref: 'ADJ-2627-0001', by: 'Store In-Charge (demo)', note: 'Physical verification variance' }); }
  tx.adjs.push({ id: 'AJ002', no: pcNo(tx, 'ADJ'), store: 'CS', item: 'IT032', counted: (tx.stock.CS.IT032 || 0) + 3, system: tx.stock.CS.IT032 || 0, diff: 3, reason: 'Physical verification 15 Oct – three tins found unrecorded (supplier free issue)', status: 'Requested', by: 'Storekeeper (demo)', approver: '', at: ts(iso(10, 15), 17), seed: true });
  // scrap record
  tx.ledger.push({ at: ts(iso(9, 12), 12), date: iso(9, 12), store: 'CS', item: 'IT012', qty: -(Math.min(10, tx.stock.CS.IT012 || 0)), bal: (tx.stock.CS.IT012 || 0) - Math.min(10, tx.stock.CS.IT012 || 0), type: 'Scrap', ref: 'Scrap note Sep', by: 'Store In-Charge (demo)', note: 'Moth damage' }); tx.stock.CS.IT012 = Math.max(0, (tx.stock.CS.IT012 || 0) - 10);
  // payments released for matched GRNs
  tx.grn.filter(g => g.invoiceValue && tx.po.find(p => p.id === g.poId).status === 'Received').slice(0, 2).forEach(g => tx.payments.push({ id: 'PY' + g.id, grnId: g.id, poId: g.poId, vendor: g.vendor, amount: g.invoiceValue, at: ts(pcAddDays(g.date, 12), 11), by: 'Finance Manager (demo)', mode: 'NEFT', ref: 'UTR' + between(100000, 999999), seed: true }));
  // notifications for the signed-in demo roles
  tx.mr.filter(r => r.status === 'Submitted').forEach(r => { const L = r.chain[r.level]; if (L) pcNotify(tx, { users: pcLevelUsers(L, r), text: `${r.no} (material request, ${brName(r.branch)}, ${INRS(r.value)}) awaits your approval`, ref: r.id, quiet: true }); });
  tx.pr.filter(r => r.status === 'Submitted').forEach(r => { const L = r.chain[r.level]; if (L) pcNotify(tx, { users: pcLevelUsers(L, r), text: `${r.no} (purchase request, ${brName(r.branch) || 'Corporate'}, ${INRS(r.value)}) awaits your approval`, ref: r.id, quiet: true }); });
  tx.ledger.sort((a, b) => b.at.localeCompare(a.at)); tx.mr.reverse(); tx.pr.reverse(); tx.po.reverse(); tx.grn.reverse(); tx.issues.reverse();
  return tx;
}
let pcSeeding = false;
function pcEnsureSeed() {
  if (pcSeeding) return; const tx = PT(), M = PM(); if (!tx || !M) return;
  if (tx.seedVer === PROC_SEED_VER && (M.budgets || []).length) return;
  pcSeeding = true;
  try {
    const M2 = Store.clone(M); const fresh = pcSeedTx(M2);
    // keep anything users created in this workspace (records without the seed flag)
    ['mr', 'pr', 'quotes', 'po', 'grn', 'issues', 'moves', 'adjs', 'payments'].forEach(k => (tx[k] || []).filter(x => !x.seed).forEach(x => fresh[k].unshift(x)));
    M2.seedVer = PROC_SEED_VER;
    Store.put('proc', M2); Store.put('proc_tx', fresh);
  } catch (e) { console.error('Store & Purchase seed failed', e); } finally { pcSeeding = false; }
}
