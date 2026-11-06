/* ===== Maintenance Management: requests, work orders, preventive maintenance, technicians, vendors, costs =====
   Ported from the MS Education Academy workspace. Records live in the shared 'mm' document; the institution picker is grouped by society. */
const MM_SEED_VER = 1;
const MM_ACTS = ['view', 'add', 'edit', 'approve', 'assign', 'export'];
const MM_STAGES = ['New', 'Assigned', 'In Progress', 'On Hold', 'Waiting for Parts', 'Vendor Assigned', 'Completed', 'Verified', 'Closed', 'Rejected', 'Cancelled', 'Reopened'];
const MM_PROB0 = ['Hardware fault', 'Software issue', 'Network issue', 'Electrical fault', 'Physical damage', 'Not working', 'Preventive maintenance', 'Other'];
const MM_PRI = ['Low', 'Medium', 'High', 'Critical'];
const MM_PMFREQ = { Daily: 1, Weekly: 7, Monthly: 30, Quarterly: 91, Annual: 365 };
/* domain: IT work (IT assets) belongs to IT Management; everything else to Maintenance Management. Decided by the open module. */
const mmDom = () => App.route === 'it_home' ? 'IT' : App.route === 'mm_home' ? 'NONIT' : '';
const mmAssetIT = id => { const a = id && (AT().assets || []).find(x => x.id === id); return !!a && IT_CATS.includes(a.cat); };
const mmIsITwo = w => w.dom ? w.dom === 'IT' : (/hardware|software|network/i.test(w.problemCat || w.cat || '') || mmAssetIT(w.asset) || ((Store.get('mm').techs || []).find(t => t.name === w.tech) || {}).trade === 'IT & Networking');
const mmDomOk = (k, x) => { const d = mmDom(); if (!d) return true; const it = k === 'wos' || k === 'reqs' ? mmIsITwo(x) : k === 'techs' || k === 'vendors' ? x.trade === 'IT & Networking' : k === 'pms' ? mmAssetIT(x.asset) : true; return d === 'IT' ? it : !it; };
const mmCats = () => { const d = mmDom(), L = MMX().cats, itc = c => /hardware|software|network/i.test(c); return d === 'IT' ? L.filter(c => itc(c) || /not working|other/i.test(c)) : d === 'NONIT' ? L.filter(c => !itc(c)) : L; };
const MM_TRADES = ['Electrical', 'Plumbing', 'Carpentry', 'AC & HVAC', 'IT & Networking', 'CCTV & Security', 'General maintenance', 'Housekeeping equipment', 'Other'];
const MM_SLA_H = { Critical: 4, High: 24, Medium: 72, Low: 168 }, MM_DUE_D = { Critical: 1, High: 2, Medium: 5, Low: 10 };
const MM_DONE = ['Completed', 'Closed', 'Verified'], MM_DEAD = ['Rejected', 'Cancelled'];
const MM_BLDGS = ['Main Block', 'Annexe'];
const MM_MSGS = {
  submitted: ['Maintenance request received', 'Your request {no} has been received and is being reviewed.'],
  approved: ['Maintenance request approved', 'Request {no} has been approved and converted to work order {wo}.'],
  rejected: ['Maintenance request rejected', 'Request {no} was not approved. {reason}'],
  assigned: ['Work order assigned', 'Work order {no} has been assigned to {tech}.'],
  updated: ['Work order updated', 'Work order {no} has an update: {note}'],
  delayed: ['Work order overdue', 'Work order {no} is past its due date and needs attention.'],
  completed: ['Work order completed', 'Work order {no} has been completed and confirmed.']
};
/* what each role may do inside the module (the Setup tab edits this grid; Super Admin always has everything) */
const MM_P0 = {
  'Super Admin': 'view,add,edit,approve,assign,export', 'System Admin': 'view,add,edit,approve,assign,export', 'Maintenance Manager': 'view,add,edit,approve,assign,export',
  'Technician': 'view,edit', 'Principal': 'view,approve,export', 'Zonal Director': 'view,approve,export', 'Regional Director': 'view,approve,export',
  'Branch Requester': 'view,add', 'Employee': 'view,add', 'Teacher': 'view,add',
  'Asset Coordinator': 'view,add,edit,assign,export', 'Central Asset Team': 'view,add,edit,assign,export', 'IT Support': 'view,add,edit,assign',
  'CEO': 'view,export', 'Chairman': 'view,export', 'Vice Chairman / VCP': 'view,export', 'Read-Only Management User': 'view,export', 'CFO': 'view,export',
  'Auditor': 'view,export', 'Internal Auditor': 'view,export', 'External Auditor': 'view,export'
};
const mmDefP = role => { const s = (MM_P0[role] || 'view,add').split(','); const o = {}; MM_ACTS.forEach(a => o[a] = s.includes(a)); return o; };
function defaultMM() {
  const perms = {}; (typeof ROLES !== 'undefined' ? ROLES : []).forEach(r => perms[r] = mmDefP(r));
  return {
    seedVer: 0, seq: { req: 0, wo: 0, tech: 0, vend: 0, pm: 0 }, cats: MM_PROB0.slice(), budget: 100000, escDay: '',
    appr: [{ type: 'Any request', branch: 'All', priority: 'Any', minCost: 0, levels: ['Maintenance Manager'] }, { type: 'High-cost repair', branch: 'All', priority: 'Any', minCost: 20000, levels: ['Maintenance Manager', 'Branch Manager'] }],
    perms, reqs: [], wos: [], pms: [], techs: [], vendors: [], log: []
  };
}
Store.init({ mm: defaultMM() });
const MMX = () => Store.get('mm');
const mmPad = n => String(n).padStart(4, '0');
const mmToday = () => PROC_TODAY;
const mmStamp = () => PROC_TODAY + 'T' + new Date().toISOString().slice(11, 19);
const mmNowCmp = () => PROC_TODAY + 'T23:59:59'; /* "now" for SLA tests is the end of the application date */
const mmAddH = (iso, h) => { const d = new Date(iso.length === 10 ? iso + 'T00:00:00Z' : iso + 'Z'); d.setUTCHours(d.getUTCHours() + h); return d.toISOString().slice(0, 19); };
const mmWho = () => App.user ? App.user.name.replace(' (demo)', '') : 'System';
const mmRole = () => App.user ? App.user.role : 'System';
function mmPerm(role, a) { const M = MMX(); const P = M && M.perms && M.perms[role]; return P ? !!P[a] : mmDefP(role)[a]; }
const mmp = a => !!App.user && (App.user.role === 'Super Admin' || mmPerm(App.user.role, a));
const mmGate = a => mmp(a) ? true : (toast(`Your role does not have ${a} permission in Maintenance Management.`, 'bad'), false);
const mmIsManager = () => ['Super Admin', 'System Admin', 'Maintenance Manager', 'Principal', 'Zonal Director', 'Regional Director'].includes(mmRole());
/* ---------- institutions: head office plus every branch, grouped by society ---------- */
const mmScope = () => hrScope(App.user);
const mmCentral = () => mmScope().has('');
const mmBranch = id => DATA.branches.find(b => b.id === id) || null;
const mmEntName = id => id === 'HO' ? 'MS Education Academy · Head Office' : ((mmBranch(id) || {}).name || id);
function mmEnts() {
  const sc = mmScope(), out = [];
  if (sc.has('')) out.push({ id: 'HO', name: mmEntName('HO'), soc: '', tag: 'Head Office', zone: '' });
  let units = []; try { units = lcUnits().filter(u => u.type === 'Branch'); } catch (e) { }
  const byB = {}; units.forEach(u => byB[u.bid] = u);
  DATA.branches.filter(b => !b.closed && sc.has(b.id)).forEach(b => { const u = byB[b.id] || {}; out.push({ id: b.id, name: b.name, soc: u.society || 'MSES', tag: u.instType || 'School', zone: b.zone, region: b.region }); });
  return out;
}
function mmEntCur() { const E = mmEnts(), c = App.ui.mmEnt; if (c === 'ALL' && E.length > 1) return 'ALL'; if (c && E.some(e => e.id === c)) return c; return E.length ? E[0].id : ''; }
function mmInEnt(ent) { const cur = mmEntCur(); if (cur === 'ALL') { const sc = mmScope(); return ent === 'HO' ? sc.has('') : sc.has(ent); } return ent === cur; }
const mmCodeOf = ent => ent === 'HO' ? 'HO' : ent;
function mmEntSel() {
  const E = mmEnts(), cur = mmEntCur(); let h = '';
  if (E.length > 1) h += `<option value="ALL" ${cur === 'ALL' ? 'selected' : ''}>All institutions (${mmCentral() ? 'group' : 'my branches'})</option>`;
  const ho = E.find(e => e.id === 'HO'); if (ho) h += `<option value="HO" ${cur === 'HO' ? 'selected' : ''}>${esc(ho.name)}</option>`;
  const socs = [...new Set(E.filter(e => e.id !== 'HO').map(e => e.soc))];
  socs.forEach(s => { const L = E.filter(e => e.id !== 'HO' && e.soc === s); h += `<optgroup label="${esc(lcSocName(s))} (${L.length} institutions)">${L.map(e => `<option value="${e.id}" ${cur === e.id ? 'selected' : ''}>${esc(e.name)} · ${esc(e.tag)}</option>`).join('')}</optgroup>`; });
  return `<label class="fld grow"><span>Institution (grouped by society)</span><select data-act="uiSel" data-k="mmEnt">${h}</select></label>`;
}
/* ---------- numbering, logging, saving ---------- */
function mmLog(mm, e, ref, remark = '') {
  mm.log = mm.log || []; mm.log.push({ t: nowIso(), by: mmWho(), role: mmRole(), e, ref: ref || '', remark: remark || '' }); if (mm.log.length > 2500) mm.log = mm.log.slice(-2500);
  try { if (App.user && !mmBatch) audit('Maintenance Management', e, { new: ref || '', reason: remark || '' }); } catch (x) { }
}
function mmSave(mm, msg) { Store.put('mm', mm); if (msg) toast(msg, 'ok'); }
/* ---------- asset link: a work order on an asset puts it under maintenance, completion puts it back ---------- */
let mmBatch = null; /* while seeding, asset status changes and notifications are collected and applied once */
function mmAssetSet(id, status, note) {
  if (!id) return '';
  if (mmBatch) { const a0 = mmAsset(id); if (!a0) return ''; const prev0 = mmBatch.st[id] !== undefined ? mmBatch.st[id] : a0.status; mmBatch.st[id] = status; mmBatch.note[id] = note; return prev0; }
  const tx = Store.clone(AT()), a = (tx.assets || []).find(x => x.id === id); if (!a) return '';
  const prev = a.status; if (prev === status) return prev; a.status = status; a.condition = status === 'Under Maintenance' ? 'Under Repair' : (a.condition === 'Under Repair' ? 'Good' : a.condition); asHist(a, status === 'Under Maintenance' ? 'Maintenance work order' : 'Maintenance completed', note); Store.put('asset_tx', tx); return prev;
}
const mmAsset = id => id ? ((AT().assets || []).find(a => a.id === id) || null) : null;
const mmAssetLbl = id => { const a = mmAsset(id); return a ? `${a.tag} — ${a.name}` : '—'; };
/* ---------- notifications and escalation ---------- */
function mmRecipients(rec) {
  const ids = new Set(); pcUsersByRole('Maintenance Manager').forEach(u => ids.add(u.id));
  if (rec.ent && rec.ent !== 'HO') { const p = pcPrincipal(rec.ent); if (p) ids.add(p.id); }
  if (rec.requesterId) ids.add(rec.requesterId);
  return [...ids];
}
function mmNotify(kind, rec, mm) {
  const m = MM_MSGS[kind]; if (!m || mmBatch) return;
  const wo = rec.workOrder ? (mm.wos.find(x => x.id === rec.workOrder) || {}) : {};
  const text = m[0] + ': ' + m[1].replace('{no}', rec.no || '').replace('{wo}', wo.no || '').replace('{tech}', rec.tech || '').replace('{note}', ((rec.repairNotes || [])[(rec.repairNotes || []).length - 1] || {}).note || '').replace('{reason}', rec.rejectReason || '');
  try { fnNotify(mmRecipients(rec), text, rec.no || '', 'mm_home'); } catch (e) { }
}
function mmEscalate(mm) {
  const over = mm.wos.filter(t => !MM_DONE.includes(t.status) && !MM_DEAD.includes(t.status) && t.sla < mmNowCmp() && !t.escalated);
  over.forEach(t => { t.escalated = true; t.log.push({ d: mmToday(), e: 'Escalated to Maintenance Manager (overdue)', by: 'System' }); mmLog(mm, 'Work order escalated', t.no, 'SLA ' + t.sla.replace('T', ' ')); mmNotify('delayed', t, mm); });
  return over.length;
}
function mmRunEscalation() {
  const M = MMX(); if (!M || !Store.writable) return;
  if (M.escDay === mmToday()) return; const c = Store.clone(M); const n = mmEscalate(c); c.escDay = mmToday(); Store.put('mm', c);
}
/* ---------- creation helpers ---------- */
function mmMkWO(mm, o) {
  mm.seq.wo++; const code = mmCodeOf(o.ent), opened = o.opened || mmStamp(), pri = o.priority || 'Medium';
  const a = mmAsset(o.asset);
  const t = {
    id: 'WO' + mm.seq.wo, no: `WO-${code}-${mmPad(mm.seq.wo)}`, ent: o.ent, asset: o.asset || '', building: o.building || '', room: o.room || '', problemCat: o.cat, dom: o.dom || mmDom() || (/hardware|software|network/i.test(o.cat || '') || mmAssetIT(o.asset) ? 'IT' : 'NONIT'), desc: o.desc, priority: pri, photo: o.photo || '',
    location: o.room || (a ? a.location : '') || '', requestedBy: o.requestedBy || mmRole(), requesterId: o.requesterId || '', status: 'New', opened, due: o.due || pcAddDays(mmToday(), MM_DUE_D[pri] || 5), sla: mmAddH(opened.slice(0, 19), MM_SLA_H[pri] || 72),
    tech: '', vendor: '', estCost: o.estCost || 0, materials: o.materials || '', instructions: o.instructions || '', parts: [], cost: 0, timeSpent: 0, repairNotes: [], comments: [], closed: '', confirmed: false, mreq: o.mreq || '', assetPrev: '', log: [{ d: mmToday(), e: 'Work order created', by: o.by || mmWho() }]
  };
  if (typeof auCategorise === 'function') { const c2 = auCategorise(t.desc, t.problemCat); if (c2 !== t.problemCat) { t.autoCat = t.problemCat || ''; t.problemCat = c2; } }
  mm.wos.push(t);
  if (typeof auAutoAssignWo === 'function') auAutoAssignWo(mm, t);
  if (t.asset) { const prev = mmAssetSet(t.asset, 'Under Maintenance', 'Work order ' + t.no + ' raised'); t.assetPrev = prev && prev !== 'Under Maintenance' ? prev : ''; }
  mmLog(mm, 'Work order created', t.no + (a ? ' ' + a.tag : ''), o.cat); mmNotify('submitted', t, mm);
  return t;
}
function mmRestoreAsset(t) { if (!t.asset) return; const a = mmAsset(t.asset); if (a && a.status === 'Under Maintenance') mmAssetSet(t.asset, t.assetPrev || (a.custodian ? 'Allocated' : 'Available'), 'Work order ' + t.no + ' completed'); }
function mmMkReq(mm, o) {
  mm.seq.req++; const r = {
    id: 'RQ' + mm.seq.req, no: `REQ-${mmCodeOf(o.ent)}-${mmPad(mm.seq.req)}`, ent: o.ent, building: o.building || '', room: o.room || '', asset: o.asset || '', cat: o.cat, dom: o.dom || mmDom() || (/hardware|software|network/i.test(o.cat || '') || mmAssetIT(o.asset) ? 'IT' : 'NONIT'), priority: o.priority, preferred: o.preferred || '', desc: o.desc, photo: o.photo || '',
    requestedBy: o.requestedBy, raisedBy: o.raisedBy || mmRole(), requesterId: o.requesterId || '', status: 'New', created: o.created || (mmToday() + ' ' + new Date().toISOString().slice(11, 16)), workOrder: '', comments: o.comments || [], log: [{ d: o.d || mmToday(), e: 'Request submitted', by: o.raisedBy || mmWho() }]
  };
  mm.reqs.push(r); mmLog(mm, 'Maintenance request submitted', r.no, (o.desc || '').slice(0, 60)); mmNotify('submitted', r, mm); return r;
}
function mmApproveReq(mm, r, byName) {
  const t = mmMkWO(mm, { ent: r.ent, asset: r.asset, cat: r.cat, desc: r.desc, priority: r.priority, photo: r.photo, room: r.room, building: r.building, requestedBy: r.requestedBy, requesterId: r.requesterId, mreq: r.id, dom: r.dom });
  r.status = 'Converted'; r.workOrder = t.id; r.log.push({ d: mmToday(), e: 'Approved, work order ' + t.no + ' created', by: byName || mmWho() });
  mmLog(mm, 'Maintenance request approved', r.no, 'Work order ' + t.no); mmNotify('approved', r, mm); return t;
}
/* technicians and vendors: a head-office technician / vendor is a group resource that can be assigned in any institution */
const mmTechsFor = (mm, ent) => mm.techs.filter(x => x.active !== false && (x.branch === ent || x.branch === 'HO') && mmDomOk('techs', x));
const mmVendsFor = (mm, ent) => mm.vendors.filter(x => x.active !== false && (x.school === ent || x.school === 'HO') && mmDomOk('vendors', x));
function mmVendStats(mm, name) { const t = mm.wos.filter(x => x.vendor === name && MM_DONE.includes(x.status)); const avgH = t.length ? Math.round(t.reduce((a, x) => a + (new Date(x.closed || x.opened) - new Date(x.opened)) / 36e5, 0) / t.length) : 0; return { jobs: t.length, avgH, cost: t.reduce((a, x) => a + x.cost, 0) }; }
const mmPmDue = (mm, ents) => mm.pms.filter(p => ents(p.ent) && p.active && mmDomOk('pms', p) && p.nextDue <= pcAddDays(mmToday(), 7));
const mmPmOver = (mm, ents) => mm.pms.filter(p => ents(p.ent) && p.active && mmDomOk('pms', p) && p.nextDue < mmToday());
const mmPmState = p => p.nextDue < mmToday() ? 'Overdue' : p.nextDue <= pcAddDays(mmToday(), 7) ? 'Upcoming' : 'Scheduled';
/* ---------- seed: vendors, technicians, PM schedules and a spread of requests / work orders across institutions ---------- */
function mmSeed() {
  mmBatch = { st: {}, note: {} };
  const mm = defaultMM(); mm.seedVer = MM_SEED_VER; const T = mmToday(), D = n => pcAddDays(T, n);
  const aBy = (bid, rx) => (AT().assets || []).find(a => a.branch === bid && a.status !== 'Disposed' && rx.test(a.sub + ' ' + a.name)) || null;
  const anyA = bid => (AT().assets || []).find(a => a.branch === bid && a.status !== 'Disposed') || null;
  const vend = (name, category, contact, mobile, email) => { mm.seq.vend++; mm.vendors.push({ id: 'MV' + mm.seq.vend, school: 'HO', name, category, contact, mobile, email, address: '', gst: '', active: true, quotes: [], invoices: [], createdBy: 'System (seed)', createdAt: T }); };
  vend('CoolCare Services', 'AC & HVAC', 'Ramesh Kadam', '9820011122', 'coolcare@example.com'); vend('ElectroFix', 'Electrical', 'Suresh Patil', '9820033344', 'electrofix@example.com'); vend('NetSecure IT', 'IT & Networking', 'Anita Rao', '9820055566', 'netsecure@example.com');
  [['Ramesh Kadam', 'Electrical', '9820011001'], ['Suresh Naik', 'AC & HVAC', '9820011002'], ['Anita Pawar', 'IT & Networking', '9820011003']].forEach(([name, trade, mobile]) => { mm.seq.tech++; mm.techs.push({ id: 'MT' + mm.seq.tech, name, techId: 'TEC-HO-' + String(mm.seq.tech + 1).padStart(3, '0'), mobile, email: '', trade, branch: 'HO', active: true, createdBy: 'System (seed)', createdAt: T }); });
  const zones = [...new Set(DATA.branches.filter(b => !b.closed).map(b => b.zone))];
  const seeded = zones.map(z => DATA.branches.find(b => !b.closed && b.zone === z && b.id !== 'B21')).filter(Boolean);
  const b21 = DATA.branches.find(b => b.id === 'B21'); if (b21 && !seeded.some(b => b.zone === b21.zone)) seeded.push(b21);
  /* head office: facility-wide schedules only */
  const pm = (ent, asset, building, freq, cat, nextDue, lastRun, hist, priority = 'Medium') => { mm.seq.pm++; mm.pms.push({ id: 'PM' + mm.seq.pm, ent, asset: asset ? asset.id : '', building, freq, cat, nextDue, priority, desc: 'Standard ' + cat.toLowerCase() + ' checklist', active: true, lastRun, history: hist || [] }); };
  pm('HO', null, 'Main Block', 'Quarterly', 'Fire extinguisher check', D(20), '', []); pm('HO', null, 'Main Block', 'Monthly', 'Server room AC filter clean', D(-2), '', []); pm('HO', null, 'Main Block', 'Weekly', 'CCTV system check', D(3), '', []);
  seeded.forEach((b, bi) => {
    const id = b.id, bl = MM_BLDGS[0];
    [['AC servicing', /Air conditioner/i, 'Quarterly'], ['Fire extinguisher check', null, 'Annual'], ['Generator service', /Generator|UPS/i, 'Monthly'], ['Server room AC filter clean', /Air conditioner/i, 'Monthly'], ['CCTV system check', /CCTV/i, 'Weekly']].forEach(([cat, rx, freq], i) => {
      const a = rx ? aBy(id, rx) : null; pm(id, a, bl, freq, cat, i % 3 === 0 ? D(-3) : D(4 + i * 2), i === 2 ? D(-30) : '', i === 2 ? [{ d: D(-30), wo: '' }] : []);
    });
    /* two new requests */
    const a1 = aBy(id, /Air conditioner/i) || anyA(id);
    const q1 = mmMkReq(mm, { ent: id, building: bl, room: a1 ? a1.location : 'Office', asset: a1 ? a1.id : '', cat: 'Not working', priority: 'High', desc: (a1 ? a1.name : 'AC') + ' blowing warm air, needs inspection', requestedBy: 'Class Teacher', raisedBy: 'Class Teacher', created: D(-4) + ' 09:00', d: D(-4), comments: [{ d: D(-4) + ' 09:10', by: 'Principal', text: 'Noted, will review today' }] });
    mmMkReq(mm, { ent: id, building: bl, room: 'Room 102', cat: 'Electrical fault', priority: 'Medium', desc: 'Flickering tube light in Room 102', requestedBy: 'Front Office Executive', raisedBy: 'Front Office Executive', created: D(-1) + ' 14:00', d: D(-1) });
    /* one request taken through the full lifecycle: approved → vendor assigned → completed → confirmed */
    const a2 = aBy(id, /CCTV/i) || anyA(id);
    const q3 = mmMkReq(mm, { ent: id, building: bl, room: a2 ? a2.location : 'Main office', asset: a2 ? a2.id : '', cat: 'Not working', priority: 'Medium', desc: 'Main gate camera not recording', requestedBy: 'Front Office Executive', raisedBy: 'Front Office Executive', created: D(-15) + ' 10:00', d: D(-15) });
    const w = mmApproveReq(mm, q3, 'Maintenance Manager'); w.opened = D(-15) + 'T10:05:00'; w.due = D(-10); w.sla = mmAddH(w.opened, MM_SLA_H.Medium);
    w.vendor = 'NetSecure IT'; w.status = 'Vendor Assigned'; w.log.push({ d: D(-14), e: 'Assigned to NetSecure IT', by: 'Maintenance Manager' });
    w.parts.push({ name: 'Camera power adapter', qty: 1, cost: 850 }); w.cost += 850 + 1200; w.timeSpent = 90; w.repairNotes.push({ d: D(-13), note: 'Replaced faulty power adapter, tested recording · 90 min', by: 'NetSecure IT' });
    w.status = 'Verified'; w.closed = D(-13) + 'T16:00:00'; w.confirmed = true; w.log.push({ d: D(-13), e: 'Marked completed by NetSecure IT', by: 'NetSecure IT' }, { d: D(-13), e: 'Completion confirmed by Principal', by: 'Principal' }); w.escalated = true;
    if (w.asset) mmRestoreAsset(w);
    /* a work order raised directly, technician assigned */
    const a3 = aBy(id, /Access point|Switch|Firewall/i) || anyA(id);
    const t3 = mmMkWO(mm, { ent: id, asset: a3 ? a3.id : '', cat: 'Network issue', desc: 'Wi-Fi coverage weak in the staff room', priority: 'Low', room: a3 ? a3.location : '', building: bl, requestedBy: 'IT Support', by: 'IT Support', opened: D(-2) + 'T09:00:00' }); t3.tech = 'Anita Pawar'; t3.status = 'Assigned'; t3.log.push({ d: D(-1), e: 'Assigned to Anita Pawar', by: 'IT Support' });
    /* one overdue critical work order to exercise escalation */
    const a4 = aBy(id, /Generator|UPS/i) || anyA(id);
    const t4 = mmMkWO(mm, { ent: id, asset: a4 ? a4.id : '', cat: 'Preventive maintenance', desc: 'Generator did not start during the weekly test', priority: 'Critical', room: a4 ? a4.location : '', building: bl, requestedBy: 'Maintenance Manager', by: 'Maintenance Manager', opened: D(-3) + 'T08:00:00' }); t4.sla = D(-2) + 'T00:00:00'; t4.due = D(-2); t4.status = 'In Progress'; t4.tech = 'Suresh Naik'; t4.log.push({ d: D(-3), e: 'Assigned to Suresh Naik', by: 'Maintenance Manager' });
    if (bi === 0) { /* a PM run that already produced a work order */ const p = mm.pms.find(x => x.ent === id && x.cat === 'Generator service'); if (p) { const tw = mmMkWO(mm, { ent: id, asset: p.asset, cat: p.cat, desc: 'Preventive maintenance: ' + p.desc, priority: p.priority, room: p.building, building: p.building, requestedBy: 'System (PM schedule)', by: 'System', opened: D(-30) + 'T09:00:00' }); tw.status = 'Closed'; tw.closed = D(-29) + 'T12:00:00'; tw.confirmed = true; tw.cost = 3500; tw.timeSpent = 120; tw.tech = 'Suresh Naik'; tw.escalated = true; p.history = [{ d: D(-30), wo: tw.id }]; mmRestoreAsset(tw); } }
    void q1;
  });
  mm.log = (mm.log || []).slice(-2000);
  const B = mmBatch; mmBatch = null;
  const ids = Object.keys(B.st); if (ids.length) { const tx = Store.clone(AT()); ids.forEach(id => { const a = (tx.assets || []).find(x => x.id === id); if (!a || a.status === B.st[id]) return; a.status = B.st[id]; if (B.st[id] === 'Under Maintenance') a.condition = 'Under Repair'; asHist(a, B.st[id] === 'Under Maintenance' ? 'Maintenance work order' : 'Maintenance completed', B.note[id] || ''); }); Store.put('asset_tx', tx); }
  return mm;
}
let mmSeeding = false;
function mmEnsureSeed() {
  if (mmSeeding) return; const M = MMX(); if (!M) return;
  if (M.seedVer === MM_SEED_VER) { mmPermSync(); mmRunEscalation(); return; }
  if (!AT() || !AT().assets || !AT().assets.length || !Store.get('users') || !Store.writable) return;
  mmSeeding = true;
  try { const fresh = mmSeed(); ['reqs', 'wos', 'pms', 'techs', 'vendors'].forEach(k => (M[k] || []).filter(x => x.userMade).forEach(x => fresh[k].push(x))); Store.put('mm', fresh); }
  catch (e) { mmBatch = null; console.error('Maintenance seed failed', e); } finally { mmSeeding = false; }
  mmRunEscalation();
}
/* roles added later appear in the permission grid with their default rights */
function mmPermSync() { const M = MMX(); if (!M || !Store.writable) return; const miss = ROLES.filter(r => !M.perms[r]); if (!miss.length) return; const c = Store.clone(M); miss.forEach(r => c.perms[r] = mmDefP(r)); Store.put('mm', c); }

const mmTrades = () => { const d = mmDom(); return d === 'IT' ? ['IT & Networking'] : d === 'NONIT' ? MM_TRADES.filter(t => t !== 'IT & Networking') : MM_TRADES; };
