/* ===== Admissions CRM: campaign -> enquiry -> counselling -> application -> SRF -> admission -> enrolment ===== */
const CRM_SEED_VER = 3;
const CRM_STAGES = ['New', 'Contacted', 'Interested', 'Counselling', 'Visit Scheduled', 'Visited', 'Application', 'Documents', 'SRF Pending', 'SRF Paid', 'Admitted', 'Enrolled', 'Lost', 'Cancelled'];
const CRM_OPEN = ['New', 'Contacted', 'Interested', 'Counselling', 'Visit Scheduled', 'Visited', 'Application', 'Documents', 'SRF Pending', 'SRF Paid'];
const CRM_PRE = ['New', 'Contacted', 'Interested', 'Counselling', 'Visit Scheduled', 'Visited'];
const CRM_FLOW = [...CRM_OPEN, 'Admitted', 'Enrolled'];
const CRM_ADM = ['Admitted', 'Enrolled'];
const CRM_STAGE_NOTE = { New: 'New lead', Contacted: 'Contacted', Interested: 'Interested', Counselling: 'Counselling / test scheduled', 'Visit Scheduled': 'Campus visit scheduled', Visited: 'Campus visit completed', Application: 'Application submitted', Documents: 'Document verification', 'SRF Pending': 'SRF payment pending', 'SRF Paid': 'SRF paid', Admitted: 'Admission confirmed', Enrolled: 'Enrolled (ERP student ID)', Lost: 'Closed – lost', Cancelled: 'Admission cancelled' };
const CRM_MODES = ['Call', 'WhatsApp', 'SMS', 'Email', 'Campus visit', 'Meeting'];
const CRM_OUTCOMES = ['Interested', 'Needs time', 'Call back later', 'Not reachable', 'Visit booked', 'Application given', 'Applied', 'Not interested', 'Wrong number'];
const CRM_LOST = ['Not interested', 'Lost to competitor', 'Fee affordability', 'Distance / transport', 'Relocating', 'Class not available', 'Not reachable', 'Not eligible', 'Invalid lead', 'Follow-up later', 'Duplicate', 'Other'];
const CRM_CAMP_TYPES = ['Digital ads', 'Social media', 'Newspaper / print', 'Hoarding / outdoor', 'Open house / event', 'Referral drive', 'School visit', 'Website / landing page'];
const CRM_STAGE_KIND = { New: 'warn', Contacted: '', Interested: '', Counselling: '', 'Visit Scheduled': '', Visited: '', Application: 'ok', Documents: 'ok', 'SRF Pending': 'warn', 'SRF Paid': 'ok', Admitted: 'ok', Enrolled: 'ok', Lost: 'bad', Cancelled: 'bad' };
const CRM_MEET = ['Counselling', 'Interview', 'Entrance test', 'Scholarship test', 'Open house'];
const CRM_SOURCES_X = ['WhatsApp Business', 'Phone call / call centre', 'Google Ads', 'Meta (Facebook / Instagram) Ads', 'YouTube', 'LinkedIn', 'Education portal', 'Event / seminar', 'Staff referral', 'Student referral', 'Print / pamphlet', 'QR code', 'Excel upload'];
const CRM_REFERRAL = ['Parent referral', 'Sibling', 'Staff referral', 'Student referral'];
const CRM_DOCS = ['Birth certificate', 'Aadhaar card (student)', 'Aadhaar / ID card (parent)', 'Previous marksheet / report card', 'Transfer certificate', 'Passport-size photographs', 'Address proof'];
const CRM_PRIORITY = ['Normal', 'High', 'VIP'];
const CRM_INTEREST = ['Hot', 'Warm', 'Cold'];
const CRM_JOIN = ['This month', 'Within 3 months', 'Next academic year', 'Not decided'];
const CRM_LANG = ['English', 'Urdu', 'Hindi', 'Telugu', 'Marathi'];
const CRM_ESC = ['Counsellor', 'Branch Admissions Head / Principal', 'Zonal Director', 'Regional Director', 'Corporate Admissions / Marketing Head'];
const CRM_INTEG = [
  { id: 'billing', name: 'Billing / fee collection', dir: 'Two-way', url: '', key: '', enabled: false, what: 'Sends SRF, admission-fee and refund requests; receives receipts so SRF and fees are confirmed by the billing system.', last: '' },
  { id: 'lms', name: 'LMS / student record', dir: 'Two-way', url: '', key: '', enabled: false, what: 'Sends a confirmed admission so the student record is created; receives the student ID.', last: '' },
  { id: 'finance', name: 'Finance / accounts', dir: 'Outbound', url: '', key: '', enabled: false, what: 'Sends SRF receipts and refunds so they are booked as receipts and liabilities, never as expenses.', last: '' },
  { id: 'leads', name: 'Website, ads and call-centre leads', dir: 'Two-way', url: '', key: '', enabled: false, what: 'Sends new-lead and stage events back to ad platforms / call-centre; receives leads from forms, Google Ads, Meta Ads and portals.', last: '' },
  { id: 'comms', name: 'WhatsApp / SMS / email gateway', dir: 'Outbound', url: '', key: '', enabled: false, what: 'Sends each recorded message to the gateway for delivery.', last: '' }
];
const CRM_EVENTS = { 'lead.created': ['leads'], 'srf.requested': ['billing'], 'srf.paid': ['finance'], 'admission.confirmed': ['lms', 'billing'], 'fee.received': ['finance'], 'admission.cancelled': ['billing', 'lms'], 'refund.requested': ['billing'], 'refund.approved': ['billing', 'finance'], 'refund.paid': ['finance'], 'message.sent': ['comms'], 'docs.checklist': ['comms'], 'admission.welcome': ['comms'] };
const CRM_TPL_VARS = ['{student}', '{parent}', '{branch}', '{class}', '{counsellor}', '{link}', '{payLink}', '{due}'];
const CRM_TEMPLATES = [
  ['T1', 'Instant enquiry acknowledgement', 'WhatsApp', 'Dear {parent}, thank you for your enquiry for {student} ({class}) at {branch}. {counsellor} will call you shortly. – MS Education Academy'],
  ['T2', 'Counsellor introduction', 'WhatsApp', 'Hello {parent}, I am {counsellor} from {branch}. I will guide you through admission for {student}. Please tell me a convenient time to talk.'],
  ['T3', 'Follow-up reminder', 'SMS', 'Dear {parent}, a gentle reminder about admission for {student} ({class}) at {branch}. Call us on your convenience. – {counsellor}'],
  ['T4', 'Campus visit confirmation', 'WhatsApp', 'Dear {parent}, your campus visit for {student} at {branch} is confirmed for {due}. We look forward to meeting you.'],
  ['T5', 'Application link', 'WhatsApp', 'Dear {parent}, please complete the application for {student} ({class}) here: {link}'],
  ['T6', 'Document pending reminder', 'WhatsApp', 'Dear {parent}, documents for {student} are still pending. Please share them by {due} to continue the admission. – {counsellor}'],
  ['T7', 'SRF payment reminder', 'SMS', 'Dear {parent}, to reserve a seat for {student} ({class}) at {branch}, please pay the Seat Reservation Fee by {due}: {payLink}'],
  ['T8', 'Admission confirmation', 'Email', 'Dear {parent}, we are pleased to confirm the admission of {student} to {class} at {branch}. Welcome to MS Education Academy!'],
  ['T9', 'Fee payment reminder', 'SMS', 'Dear {parent}, the admission fee for {student} is due on {due}. Pay here: {payLink}'],
  ['T10', 'Event / open-house invitation', 'WhatsApp', 'Dear {parent}, you are invited to our open house at {branch} on {due}. Meet teachers and see the campus. RSVP to {counsellor}.'],
  ['T11', 'Lost-lead reactivation', 'WhatsApp', 'Dear {parent}, admissions for {class} are still open at {branch}. Can we help with {student}? – {counsellor}'],
  ['T12', 'Re-admission / renewal', 'Email', 'Dear {parent}, re-admission for the next academic year is now open for {student}. Please confirm your seat at {branch} by {due}.']
].map(([id, name, ch, body]) => ({ id, name, channel: ch, body, active: true }));
const CRM_DRIPS = [
  { id: 'D1', name: 'Acknowledge a new lead', stage: 'New', afterDays: 0, tpl: 'T1' },
  { id: 'D2', name: 'Re-engage a quiet lead', stage: 'Contacted', afterDays: 4, tpl: 'T3' },
  { id: 'D3', name: 'Chase pending documents', stage: 'Documents', afterDays: 3, tpl: 'T6' },
  { id: 'D4', name: 'Remind SRF payment', stage: 'SRF Pending', afterDays: 2, tpl: 'T7' },
  { id: 'D5', name: 'Confirm campus visit', stage: 'Visit Scheduled', afterDays: 0, tpl: 'T4' }
];
function defaultCRM() {
  return {
    seedVer: 0, seq: { lead: 0, camp: 0, app: 0, adm: 0, exp: 0, qr: 0, evt: 0 },
    cfg: { sources: [...SOURCES, ...CRM_SOURCES_X].map(n => ({ name: n, active: true })), perStudent: 100, minYear: 10000, firstResponseDays: 1, noActivityDays: 7, esc: [1, 3, 5, 7], assign: 'zone', appFee: 500, srf: { School: 5000, College: 10000 }, ay: CUR_AY, docs: CRM_DOCS.slice(), targets: {}, publicBase: 'https://admissions.mseducationacademy.example', payBase: 'https://pay.mseducationacademy.example', langMap: {}, apiKey: '', apiOrigins: [], integ: CRM_INTEG.map(x => ({ ...x })) },
    outbox: [],
    templates: CRM_TEMPLATES.map(t => ({ ...t })), drips: CRM_DRIPS.map(d => ({ ...d })), qr: [], campaigns: [], leads: [], log: []
  };
}
Store.init({ crm: defaultCRM() });
const CRMX = () => Store.get('crm');
function crmEdit(fn, msg) { const c = Store.clone(CRMX()); const r = fn(c); Store.put('crm', c); if (msg) toast(msg, 'ok'); return r; }
const crmPad = n => String(n).padStart(4, '0');
const crmWho = () => App.user ? App.user.name.replace(' (demo)', '') : 'System';
const crmLog = (c, action, ref, detail) => { c.log.unshift({ t: nowIso().slice(0, 16).replace('T', ' '), by: crmWho(), role: App.user ? App.user.role : '', action, ref: ref || '', detail: detail || '' }); if (c.log.length > 1200) c.log.length = 1200; try { audit('CRM', action, { new: ref + (detail ? ' · ' + detail : '') }); } catch (e) { } };
const crmBr = id => DATA.branches.find(b => b.id === id) || {};
const crmBrName = id => crmBr(id).name || id || '—';
const crmCan = a => !!App.user && can('crm_home', a);
const crmScope = () => hrScope(App.user);
const crmIsCounsellor = () => App.user && App.user.role === 'Admissions Counsellor';
const crmLeadVisible = l => crmScope().has(l.ent) && (!crmIsCounsellor() || !l.counsellor || l.counsellor === App.user.id);
const crmLeads = () => CRMX().leads.filter(crmLeadVisible);
function crmUnits() { try { return lcUnits().filter(u => u.type === 'Branch' && crmScope().has(u.bid)); } catch (e) { return DATA.branches.filter(b => !b.closed && crmScope().has(b.id)).map(b => ({ bid: b.id, name: b.name, society: 'MSES' })); } }
function crmEntCur() { const U = crmUnits(), c = App.ui.crmEnt; if (c === 'ALL' || !c) return U.length > 1 || !U.length ? 'ALL' : U[0].bid; return U.some(u => u.bid === c) ? c : 'ALL'; }
const crmInEnt = e => { const c = crmEntCur(); return c === 'ALL' ? crmScope().has(e) : e === c; };
const crmRows = () => crmLeads().filter(l => crmInEnt(l.ent));
const crmDays = (a, b) => Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 864e5);
const crmLevelOf = bid => /College|IOE|SRC|MSEC/.test((crmBr(bid).name || '') + (crmBr(bid).type || '')) ? 'College' : 'School';
const crmSrfAmt = bid => (CRMX().cfg.srf || {})[crmLevelOf(bid)] || 5000;
const crmUserName = id => { const u = id && userById(id); return u ? u.name.replace(' (demo)', '').replace('Admissions Counsellor – ', 'Counsellor · ') : 'Unassigned'; };
const crmNextNo = (c, k, p) => { c.seq[k]++; return `${p}-${PROC_TODAY.slice(2, 4)}${PROC_TODAY.slice(5, 7)}-${crmPad(c.seq[k])}`; };
const crmInDays = (iso, n) => pcAddDays(iso, n);
/* date a lead first reached a stage (null if never) */
function crmReached(l, st) { if (st === 'New') return l.created; const h = (l.hist || []).find(x => x.a && x.a.endsWith('→ ' + st)); return h ? h.t : null; }
const crmAdmDate = l => crmReached(l, 'Admitted') || (l.admission ? l.updated : null);
const crmPaidIn = l => (l.app && l.app.paid ? +l.app.fee || 0 : 0) + (l.srf && ['Paid', 'Refund requested', 'Refunded', 'Forfeited'].includes(l.srf.status) ? +l.srf.amount || 0 : 0) + (l.fee ? +l.fee.amount || 0 : 0);
const crmRefunded = l => l.cancel && l.cancel.refund && l.cancel.refund.status === 'Paid' ? +l.cancel.refund.amount || 0 : 0;
const crmNetColl = l => Math.max(0, crmPaidIn(l) - crmRefunded(l));
const crmEverAdmitted = l => !!l.admission;
/* ---------- seats, siblings, events ---------- */
function crmSeats(bid, cls, c) {
  c = c || CRMX(); let cap = 0; try { cap = Str.classCap(bid, cls, D_()) || 0; } catch (e) { cap = 0; }
  let used = 0; DATA.students.forEach(s => { if (s.cls === cls && DATA.branches[s.b].id === bid && !/Cancelled|Withdrawn|Transferred Out/.test(s.status)) used++; });
  const reserved = c.leads.filter(l => l.ent === bid && l.cls === cls && l.ay === c.cfg.ay && !l.inErp && ['SRF Paid', 'Admitted', 'Enrolled'].includes(l.stage)).length;
  return { cap, used, reserved, free: cap - used - reserved, known: cap > 0 };
}
function crmSibling(parent, ent) { const p = crmNorm(parent); if (!p) return null; const s = DATA.students.find(x => crmNorm(x.parent) === p && !/Cancelled|Withdrawn|Transferred Out/.test(x.status)); return s ? { name: s.name, adm: s.adm, branch: DATA.branches[s.b].id, counsellor: s.counsellor || '' } : null; }
function crmEvent(c, type, l, extra) {
  (CRM_EVENTS[type] || []).forEach(route => {
    c.seq.evt++; const b = crmBr(l.ent);
    c.outbox.unshift({ id: 'E' + c.seq.evt, t: nowIso().slice(0, 19), type, route, lead: l.no, status: 'Pending', tries: 0, error: '', payload: Object.assign({ event: type, enquiryNo: l.no, admissionNo: l.admission || '', studentId: l.erpId || '', student: l.name, dob: l.dob || '', gender: l.gender || '', parent: l.parent, mobile: l.mobile, email: l.email || '', institution: { id: l.ent, name: b.name || '' }, zone: b.zone || '', region: b.region || '', class: l.cls, academicYear: l.ay, source: l.source, campaign: l.campaign || '', counsellor: crmUserName(l.counsellor) }, extra || {}) });
  }); if (c.outbox.length > 600) c.outbox.length = 600;
}
/* ---------- assignment ---------- */
function crmOpenLoad(c, id) { return c.leads.filter(l => l.counsellor === id && CRM_OPEN.includes(l.stage)).length; }
function crmPickCounsellor(c, bid, o) {
  o = o || {}; const act = users().filter(u => u.status === 'Active');
  if (o.priority === 'VIP') { const h = act.find(u => u.role === 'Admissions Head'); if (h) return h.id; }
  if (o.siblingCounsellor && act.some(u => u.id === o.siblingCounsellor && u.role === 'Admissions Counsellor')) return o.siblingCounsellor;
  const cs = act.filter(u => u.role === 'Admissions Counsellor'); if (!cs.length) return ''; const b = crmBr(bid), rule = c.cfg.assign || 'zone';
  const inZone = cs.filter(u => u.zone === b.zone), inReg = cs.filter(u => u.region === b.region);
  let pool = rule === 'roundrobin' ? cs : rule === 'workload' ? (inReg.length ? inReg : cs) : (inZone.length ? inZone : (inReg.length ? inReg : cs));
  if (o.lang && o.lang !== 'English') { const sp = cs.filter(u => ((c.cfg.langMap || {})[u.id] || []).includes(o.lang)); const inP = sp.filter(u => pool.includes(u)); if (inP.length) pool = inP; else if (sp.length) pool = sp; }
  if (rule === 'roundrobin') return pool[(c.seq.lead || 0) % pool.length].id;
  return pool.slice().sort((a, z) => crmOpenLoad(c, a.id) - crmOpenLoad(c, z.id))[0].id;
}
const crmCounsellorFor = bid => { const b = crmBr(bid); return (users().find(u => u.role === 'Admissions Counsellor' && u.status === 'Active' && u.zone === b.zone) || {}).id || ''; };
/* ---------- duplicates and lead operations ---------- */
function crmMobileOk(m) { return /^[6-9]\d{9}$/.test(String(m || '').replace(/\s/g, '')); }
const crmNorm = s => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
function crmDupFind(c, o, exceptId) {
  const nm = crmNorm(o.name), mb = String(o.mobile || '').replace(/\s/g, ''), em = crmNorm(o.email), dob = o.dob || '';
  return c.leads.find(l => l.id !== exceptId && !l.mergedInto && l.ay === c.cfg.ay && l.stage !== 'Cancelled' && (crmNorm(l.name) === nm && (l.mobile === mb || (em && crmNorm(l.email) === em) || (dob && l.dob === dob)) || (dob && l.dob === dob && l.mobile === mb)));
}
function crmAddLead(c, o) {
  const name = (o.name || '').trim(), mobile = (o.mobile || '').replace(/\s/g, '');
  if (name.length < 3) throw new Error('Enter the student name.'); if (!o.ent || !crmBr(o.ent).id) throw new Error('Choose the institution.'); if (!o.cls) throw new Error('Choose the class / course applied for.');
  if (!(o.parent || '').trim()) throw new Error('Enter the parent / guardian name.'); if (!crmMobileOk(mobile)) throw new Error('Enter a valid 10-digit parent mobile number.');
  if (o.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(o.email.trim())) throw new Error('Enter a valid email address or leave it blank.');
  if (o.dob && (o.dob > PROC_TODAY || o.dob < '2000-01-01')) throw new Error('Check the date of birth.');
  if (!c.cfg.sources.some(s => s.name === o.source && s.active)) throw new Error('Choose the enquiry source.');
  const dup = crmDupFind(c, { name, mobile, email: o.email, dob: o.dob }); if (dup) throw new Error('Possible duplicate of ' + dup.no + ' (' + dup.name + ', ' + dup.stage + ' · ' + crmBrName(dup.ent) + '). Open it instead, or ask a CRM manager to merge.');
  const cr = o.created || PROC_TODAY, sib = crmSibling(o.parent, o.ent), by = o.by || crmWho(), pri = o.priority || (sib ? 'High' : 'Normal'), cou = o.counsellor || crmPickCounsellor(c, o.ent, { priority: pri, lang: o.lang, siblingCounsellor: sib && sib.counsellor });
  const l = { userMade: true, id: 'L' + (c.seq.lead + 1), no: crmNextNo(c, 'lead', 'ENQ'), ent: o.ent, ay: c.cfg.ay, name, dob: o.dob || '', gender: o.gender || '', parent: o.parent.trim(), parentOcc: (o.parentOcc || '').trim(), mobile, email: (o.email || '').trim(), curSchool: (o.curSchool || '').trim(), cls: o.cls, source: o.source, campaign: o.campaign || '', qr: o.qr || '', utm: (o.utm || '').trim(), lang: o.lang || 'English', priority: pri, interest: o.interest || 'Warm', joining: o.joining || '', counsellor: cou, stage: 'New', created: cr, updated: cr, next: o.next || pcAddDays(PROC_TODAY, 1), notes: (o.notes || '').trim(), fu: [], comm: [], hist: [{ t: cr, by, a: 'Enquiry created', r: o.source }], sibling: sib, waitlist: null, consent: null, erpId: '', inErp: false, app: null, docs: [], srf: null, fee: null, conc: null, cancel: null, meeting: null, admission: '', lost: '', lostNote: '', competitor: '', mergedInto: '' };
  if (cou) l.hist.push({ t: cr, by: 'System', a: 'Assigned', r: crmUserName(cou) + (pri === 'VIP' ? ' (VIP lead)' : sib ? ' (sibling of ' + sib.name + ')' : '') });
  if (sib) l.hist.push({ t: cr, by: 'System', a: 'Sibling found', r: sib.name + ' · ' + sib.adm });
  c.leads.push(l); crmLog(c, 'Enquiry created', l.no, name + ' · ' + crmBrName(o.ent)); crmEvent(c, 'lead.created', l, { utm: l.utm, qr: l.qr, priority: l.priority }); if (l.counsellor && l.counsellor !== (App.user || {}).id) { try { fnNotify([l.counsellor], `New enquiry assigned: ${l.name} (${l.cls}) · ${crmBrName(l.ent)}`, l.no, 'crm_home'); } catch (e) { } } return l;
}
function crmStage(c, l, st, why) {
  const old = l.stage; l.stage = st; l.updated = PROC_TODAY; l.hist.push({ t: PROC_TODAY, by: crmWho(), a: old + ' → ' + st, r: why || '' }); crmLog(c, 'Stage changed', l.no, old + ' → ' + st);
}
function crmFollow(c, l, o) {
  if (!CRM_OPEN.includes(l.stage)) throw new Error('This enquiry is ' + l.stage.toLowerCase() + ' — reopen it to log more follow-ups.');
  if (!CRM_MODES.includes(o.mode)) throw new Error('Choose how you contacted the parent.'); if (!CRM_OUTCOMES.includes(o.outcome)) throw new Error('Choose the outcome.'); if ((o.note || '').trim().length < 3) throw new Error('Add a short note of the conversation.');
  const closing = ['Not interested', 'Wrong number'].includes(o.outcome); if (!closing && !o.next) throw new Error('Set the next follow-up date.'); if (o.next && o.next < PROC_TODAY) throw new Error('The next follow-up cannot be in the past.');
  l.fu.push({ t: PROC_TODAY, by: crmWho(), mode: o.mode, outcome: o.outcome, note: o.note.trim(), next: o.next || '' }); l.next = closing ? '' : o.next; l.updated = PROC_TODAY;
  if (l.stage === 'New') crmStage(c, l, 'Contacted', o.outcome);
  if (o.outcome === 'Interested' && l.stage === 'Contacted') crmStage(c, l, 'Interested', 'Interested');
  if (o.outcome === 'Visit booked' && CRM_PRE.slice(0, 3).includes(l.stage)) crmStage(c, l, 'Visit Scheduled', 'Visit booked');
  if (o.outcome === 'Not interested') { l.lost = 'Not interested'; crmStage(c, l, 'Lost', 'Not interested'); l.next = ''; } else if (o.outcome === 'Wrong number') { l.lost = 'Invalid lead'; crmStage(c, l, 'Lost', 'Wrong number'); l.next = ''; }
  crmLog(c, 'Follow-up logged', l.no, o.mode + ' · ' + o.outcome);
}
/* allowed forward moves from a stage */
function crmNextStages(l) {
  const s = l.stage; if (CRM_PRE.includes(s)) { const i = CRM_PRE.indexOf(s); return [...CRM_PRE.slice(i + 1), 'Application']; }
  return { Application: ['Documents'], Documents: ['SRF Pending'], 'SRF Pending': ['SRF Paid'], 'SRF Paid': ['Admitted'], Admitted: ['Enrolled'] }[s] || [];
}
/* move a lead forward; every move needs remarks, and a next-action date while the lead is still open */
function crmMove(c, l, to, o) {
  o = o || {}; if (!crmNextStages(l).includes(to)) throw new Error(`Cannot move from ${l.stage} to ${to}.`);
  const rem = (o.remarks || '').trim(); if (rem.length < 3) throw new Error('Add remarks for this stage.');
  if (['Counselling', 'Visit Scheduled'].includes(to) && o.date) o.next = o.date;
  const openTo = CRM_OPEN.includes(to); if (openTo && !o.next) throw new Error('Set the next action date.'); if (o.next && o.next < PROC_TODAY) throw new Error('The next action date cannot be in the past.');
  if (to === 'Counselling') { if (!CRM_MEET.includes(o.kind)) throw new Error('Choose the type of session.'); if (!o.date || o.date < PROC_TODAY) throw new Error('Choose the session date.'); l.meeting = { kind: o.kind, date: o.date, counsellor: l.counsellor, reco: (o.reco || '').trim() }; o.next = o.date; }
  if (to === 'Visit Scheduled') { if (!o.date || o.date < PROC_TODAY) throw new Error('Choose the visit date.'); o.next = o.date; }
  if (to === 'Application') { const fee = +o.fee; if (!(fee >= 0) || o.fee === '' || o.fee == null) throw new Error('Enter the application fee (0 if waived).'); l.app = { no: crmNextNo(c, 'app', 'APP'), date: PROC_TODAY, fee, paid: !!o.paid && fee > 0, mode: o.paid ? (o.mode || 'Cash') : '', by: crmWho(), channel: o.channel || 'Offline' }; }
  if (to === 'Documents') { if (!l.app) throw new Error('Create the application first.'); l.docs = c.cfg.docs.map(n => ({ name: n, status: 'Pending', note: '' })); }
  if (to === 'SRF Pending') { if (!l.consent) throw new Error('The parent declaration is not recorded yet (portal, or record the signed form).'); if (l.waitlist) throw new Error('On the waitlist — offer a seat first.'); const st = crmSeats(l.ent, l.cls, c); if (!st.known) throw new Error('No approved capacity for ' + l.cls + ' at this institution (Capacity Setup). Change the class or ask for capacity.'); if (st.free <= 0) throw new Error('No seat free in ' + l.cls + ' (' + st.cap + ' capacity, ' + (st.used + st.reserved) + ' filled). Add to the waitlist.'); if (!l.docs.length || l.docs.some(d => d.status !== 'Verified')) throw new Error('Verify every document first.'); const amt = +o.amount; if (!(amt > 0)) throw new Error('Enter the Seat Reservation Fee amount.'); l.srf = { amount: amt, status: 'Pending', due: o.next, mode: '', ref: '', paidOn: '' }; }
  if (to === 'SRF Paid') { if (!l.srf) throw new Error('Raise the SRF first.'); if (!o.mode) throw new Error('Choose the payment mode.'); if ((o.ref || '').trim().length < 3) throw new Error('Enter the receipt / transaction reference.'); if (l.conc && l.conc.status === 'Pending') throw new Error('The concession request is still waiting for approval.'); l.srf.status = 'Paid'; l.srf.mode = o.mode; l.srf.ref = o.ref.trim(); l.srf.paidOn = PROC_TODAY; }
  if (to === 'Admitted') { if (!l.srf || l.srf.status !== 'Paid') throw new Error('The SRF must be paid before confirming admission.'); if (typeof auDupStudent === 'function') { const dup = auDupStudent(l.ent, l.name, l.mobile, l.cls); if (dup) throw new Error(`Duplicate student: ${dup.name} (${dup.adm}) already exists with the same name and mobile. Merge or cancel this enquiry.`); } l.admission = crmGenAdm(c, l); l.erpId = ''; o.next = ''; }
  if (to === 'Enrolled') { const fee = +o.fee; if (!(fee >= 0) || o.fee === '' || o.fee == null) throw new Error('Enter the admission fee received (0 if none yet).'); l.fee = { amount: fee, mode: o.mode || '', paidOn: PROC_TODAY, ref: (o.ref || '').trim() }; o.next = ''; }
  crmStage(c, l, to, rem); l.next = openTo ? o.next : ''; if (to === 'Admitted') { crmLog(c, 'Admission confirmed', l.no, l.admission); if (typeof auOnboard === 'function') { const r = auOnboard(l); if (r && r.ok) { l.erpId = r.adm; l.inErp = true; l.section = r.sec; crmLog(c, 'Student onboarded automatically', l.no, `${r.adm} · ${l.cls} ${r.sec}`); crmEvent(c, 'admission.welcome', l, { section: r.sec, plan: (r.rec.steps || {}).plan || '', parentLogin: 'P-' + r.adm, studentLogin: 'S-' + r.adm }); } else if (r && r.error) crmLog(c, 'Onboarding not completed', l.no, r.error); } }
  if (to === 'Documents') crmEvent(c, 'docs.checklist', l, { documents: l.docs.map(x => x.name) });
  if (to === 'SRF Pending') crmEvent(c, 'srf.requested', l, { srfAmount: l.srf.amount, due: l.srf.due }); if (to === 'SRF Paid') crmEvent(c, 'srf.paid', l, { srfAmount: l.srf.amount, receipt: l.srf.ref, mode: l.srf.mode, paidOn: l.srf.paidOn, accountingNote: 'Seat Reservation Fee — receipt from family, not an expense' }); if (to === 'Admitted') crmEvent(c, 'admission.confirmed', l, { admissionNo: l.admission, srfAmount: l.srf.amount, concession: l.conc && l.conc.status === 'Approved' ? { amount: l.conc.amount, type: l.conc.type } : null }); if (to === 'Enrolled') crmEvent(c, 'fee.received', l, { feeAmount: l.fee.amount, mode: l.fee.mode, receipt: l.fee.ref });
}
function crmGenAdm(c, l) { c.seq.adm++; const b = crmBr(l.ent); return `${(b.code || l.ent)}-${c.cfg.ay.slice(2, 4)}-${String(c.seq.adm).padStart(4, '0')}`; }
function crmLose(c, l, why, o) {
  o = o || {}; if (!CRM_OPEN.includes(l.stage)) throw new Error('Already ' + l.stage.toLowerCase() + '.'); if (!CRM_LOST.includes(why)) throw new Error('Choose the reason.');
  if (why === 'Lost to competitor' && (o.competitor || '').trim().length < 2) throw new Error('Name the competitor school / college.'); if (why === 'Other' && (o.note || '').trim().length < 10) throw new Error('Explain the reason (at least 10 characters).'); if (why === 'Follow-up later' && (!o.next || o.next < PROC_TODAY)) throw new Error('Choose the date to follow up again.');
  l.lost = why; l.lostNote = (o.note || '').trim(); l.competitor = (o.competitor || '').trim(); crmStage(c, l, 'Lost', why + (l.competitor ? ' – ' + l.competitor : '')); l.next = why === 'Follow-up later' ? o.next : ''; crmLog(c, 'Marked lost', l.no, why);
}
function crmReopen(c, l) { if (l.stage !== 'Lost') throw new Error('Only a lost enquiry can be reopened.'); if (l.mergedInto) throw new Error('This record was merged into another enquiry.'); l.lost = ''; l.lostNote = ''; crmStage(c, l, 'Contacted', 'Reopened'); l.next = pcAddDays(PROC_TODAY, 1); crmLog(c, 'Reopened', l.no, ''); }
/* ---------- documents, concession, cancellation, refund, merge, messages ---------- */
function crmDocSet(c, l, i, st, note) { const d = l.docs[i]; if (!d) throw new Error('Document not found.'); if (st === 'Rejected' && (note || '').trim().length < 3) throw new Error('Say why the document is rejected.'); d.status = st; d.note = (note || '').trim(); d.by = crmWho(); d.on = PROC_TODAY; l.updated = PROC_TODAY; crmLog(c, 'Document ' + st.toLowerCase(), l.no, d.name); }
function crmConcReq(c, l, o) { if (!CRM_OPEN.includes(l.stage) && !CRM_ADM.includes(l.stage)) throw new Error('Concessions can be requested only on a live enquiry.'); const amt = +o.amount; if (!(amt > 0)) throw new Error('Enter the concession amount or percentage.'); if ((o.reason || '').trim().length < 5) throw new Error('Give the reason for the concession.'); l.conc = { type: o.type === '%' ? '%' : '₹', amount: amt, reason: o.reason.trim(), status: 'Pending', by: crmWho(), on: PROC_TODAY }; crmLog(c, 'Concession requested', l.no, amt + l.conc.type); try { fnNotify(users().filter(u => ['Admissions Head', 'Principal'].includes(u.role) && (u.role === 'Admissions Head' || u.branch === l.ent)).map(u => u.id), `Concession requested for ${l.name} (${l.no})`, l.no, 'crm_home'); } catch (e) { } }
function crmConcDecide(c, l, ok, note) { if (!l.conc || l.conc.status !== 'Pending') throw new Error('No pending concession request.'); if (!ok && (note || '').trim().length < 3) throw new Error('Say why it is rejected.'); l.conc.status = ok ? 'Approved' : 'Rejected'; l.conc.decidedBy = crmWho(); l.conc.decidedOn = PROC_TODAY; l.conc.note = (note || '').trim(); crmLog(c, 'Concession ' + l.conc.status.toLowerCase(), l.no, l.conc.amount + l.conc.type); }
function crmCancel(c, l, o) {
  if (!['SRF Paid', 'Admitted', 'Enrolled'].includes(l.stage)) throw new Error('Only a confirmed or SRF-paid admission can be cancelled; use "Mark lost" before that.'); if ((o.reason || '').trim().length < 5) throw new Error('Give the cancellation reason.');
  const paid = crmPaidIn(l), amt = +o.refund || 0; if (amt < 0 || amt > paid) throw new Error('The refund cannot be more than the ' + INR(paid) + ' received.');
  l.cancel = { date: PROC_TODAY, reason: o.reason.trim(), by: crmWho(), from: l.stage, refund: { amount: amt, status: amt > 0 ? 'Requested' : 'None', ref: '' } }; if (l.srf) l.srf.status = amt > 0 ? 'Refund requested' : 'Forfeited';
  crmStage(c, l, 'Cancelled', o.reason.trim()); l.next = ''; crmEvent(c, 'admission.cancelled', l, { reason: l.cancel.reason, received: paid, refundRequested: amt }); if (amt > 0) crmEvent(c, 'refund.requested', l, { refundAmount: amt }); crmLog(c, 'Admission cancelled', l.no, o.reason.trim() + (amt ? ' · refund ' + INR(amt) : ''));
}
function crmRefundStep(c, l, step, ref) {
  const r = l.cancel && l.cancel.refund; if (!r || r.status === 'None') throw new Error('No refund on this record.');
  if (step === 'approve') { if (r.status !== 'Requested') throw new Error('Not waiting for approval.'); r.status = 'Approved'; r.approvedBy = crmWho(); r.approvedOn = PROC_TODAY; }
  else if (step === 'reject') { if (r.status !== 'Requested') throw new Error('Not waiting for approval.'); r.status = 'Rejected'; if (l.srf) l.srf.status = 'Forfeited'; }
  else { if (r.status !== 'Approved') throw new Error('Approve the refund first.'); if ((ref || '').trim().length < 3) throw new Error('Enter the payment reference.'); r.status = 'Paid'; r.ref = ref.trim(); r.paidOn = PROC_TODAY; if (l.srf) l.srf.status = 'Refunded'; }
  crmLog(c, 'Refund ' + step, l.no, INR(r.amount)); if (step === 'approve') crmEvent(c, 'refund.approved', l, { refundAmount: r.amount }); if (step === 'pay') crmEvent(c, 'refund.paid', l, { refundAmount: r.amount, reference: r.ref });
}
function crmMerge(c, keepId, dupId) {
  const k = c.leads.find(l => l.id === keepId), d = c.leads.find(l => l.id === dupId); if (!k || !d || k.id === d.id) throw new Error('Choose two different enquiries.'); if (d.mergedInto) throw new Error(d.no + ' is already merged.'); if (CRM_ADM.includes(d.stage) || d.stage === 'Cancelled') throw new Error('An admitted or cancelled record cannot be merged away.');
  d.fu.forEach(f => k.fu.push({ ...f, note: `[from ${d.no}] ${f.note}` })); (d.comm || []).forEach(m => k.comm.push({ ...m, text: `[from ${d.no}] ${m.text}` })); d.hist.forEach(h => k.hist.push({ ...h, r: `[from ${d.no}] ${h.r || ''}` }));
  k.hist.push({ t: PROC_TODAY, by: crmWho(), a: 'Merged', r: d.no + ' merged into ' + k.no }); if (!k.email && d.email) k.email = d.email; if (!k.dob && d.dob) k.dob = d.dob; k.fu.sort((a, b) => a.t.localeCompare(b.t));
  d.mergedInto = k.id; d.lost = 'Duplicate'; d.stage = 'Lost'; d.next = ''; d.updated = PROC_TODAY; d.hist.push({ t: PROC_TODAY, by: crmWho(), a: 'Merged into ' + k.no, r: 'Duplicate' }); crmLog(c, 'Leads merged', k.no, d.no + ' → ' + k.no);
}
function crmRender(txt, l) { const b = crmBr(l.ent); return String(txt).replace(/\{student\}/g, l.name).replace(/\{parent\}/g, l.parent).replace(/\{branch\}/g, b.name || '').replace(/\{class\}/g, l.cls).replace(/\{counsellor\}/g, crmUserName(l.counsellor).replace('Counsellor · ', '')).replace(/\{link\}/g, 'https://admissions.mseducationacademy.example/apply/' + l.no).replace(/\{payLink\}/g, 'https://pay.mseducationacademy.example/' + l.no).replace(/\{due\}/g, isoLabel(l.next || pcAddDays(PROC_TODAY, 3))); }
function crmComm(c, l, o) { if (!['WhatsApp', 'SMS', 'Email'].includes(o.ch)) throw new Error('Choose the channel.'); if ((o.text || '').trim().length < 5) throw new Error('The message is empty.'); l.comm.push({ t: PROC_TODAY, by: crmWho(), ch: o.ch, tpl: o.tpl || '', text: o.text.trim(), dir: 'Out' }); l.updated = PROC_TODAY; crmLog(c, 'Message recorded', l.no, o.ch + (o.tpl ? ' · ' + o.tpl : '')); crmEvent(c, 'message.sent', l, { channel: o.ch, template: o.tpl || '', text: o.text.trim() }); }
/* ---------- SLA, escalation and alerts ---------- */
function crmEscLevel(days, esc) { let lv = 0; (esc || [1, 3, 5, 7]).forEach(t => { if (days >= t) lv++; }); return days > 0 ? Math.max(1, lv + 1) : 0; }
function crmAlerts(rows) {
  const C = CRMX(), sla = C.cfg.firstResponseDays, idle = C.cfg.noActivityDays, out = [];
  rows.forEach(l => {
    const add = (type, days, note) => out.push({ l, type, days, lv: Math.min(5, crmEscLevel(days, C.cfg.esc)), note });
    if (CRM_OPEN.includes(l.stage)) {
      if (!l.counsellor) add('Unassigned', Math.max(1, crmDays(l.created, PROC_TODAY)), 'No counsellor');
      if (l.stage === 'New' && !l.fu.length && crmDays(l.created, PROC_TODAY) > sla) add('No first response', crmDays(l.created, PROC_TODAY) - sla, 'First contact due within ' + sla + ' day(s)');
      if (l.next && l.next < PROC_TODAY) add('Missed follow-up', crmDays(l.next, PROC_TODAY), 'Was due ' + l.next);
      else if (!l.next) add('Missed follow-up', 1, 'No next action date');
      const last = l.updated || l.created; if (crmDays(last, PROC_TODAY) >= idle) add('No activity', crmDays(last, PROC_TODAY) - idle + 1, 'Idle ' + crmDays(last, PROC_TODAY) + ' days');
      if (l.interest === 'Hot' && crmDays(l.created, PROC_TODAY) >= 14 && CRM_PRE.includes(l.stage)) add('High-intent not converted', crmDays(l.created, PROC_TODAY) - 13, 'Hot lead still at ' + l.stage);
    }
    if (l.waitlist && CRM_OPEN.includes(l.stage)) { const st = crmSeats(l.ent, l.cls, C), q = crmWlQueue(C, l.ent, l.cls); if (st.known && st.free > 0 && q[0] && q[0].id === l.id) add('Seat free for waitlisted lead', crmDays(l.waitlist.since, PROC_TODAY) || 1, 'Offer the seat in ' + l.cls); }
    if (l.stage === 'Lost' && !l.mergedInto && (!l.lost || (l.lost === 'Other' && (l.lostNote || '').length < 10))) add('Lost without valid reason', 1, l.lost || 'No reason recorded');
  });
  return out;
}
function crmEscUsers(l, lv) {
  const b = crmBr(l.ent), U = users().filter(u => u.status === 'Active');
  if (lv <= 1) return U.filter(u => u.id === l.counsellor).map(u => u.id);
  if (lv === 2) return U.filter(u => (u.role === 'Principal' && u.branch === l.ent) || u.role === 'Admissions Head').map(u => u.id);
  if (lv === 3) return U.filter(u => u.role === 'Zonal Director' && u.zone === b.zone).map(u => u.id);
  if (lv === 4) return U.filter(u => u.role === 'Regional Director' && u.region === b.region).map(u => u.id);
  return U.filter(u => u.role === 'Admissions Head').map(u => u.id);
}
/* ---------- targets ---------- */
const CRM_METRICS = [['leads', 'Enquiries'], ['counselling', 'Counselling'], ['visits', 'Campus visits'], ['apps', 'Applications'], ['srf', 'SRF'], ['adm', 'Admissions'], ['coll', 'Collection']];
function crmActuals(rows, month) {
  const m = d => d && d.startsWith(month), a = { leads: 0, counselling: 0, visits: 0, apps: 0, srf: 0, adm: 0, canc: 0, coll: 0, calls: 0 };
  rows.forEach(l => {
    if (m(l.created)) a.leads++; if (m(crmReached(l, 'Counselling'))) a.counselling++; if (m(crmReached(l, 'Visited'))) a.visits++; if (l.app && m(l.app.date)) a.apps++; if (l.srf && m(l.srf.paidOn)) a.srf++; if (l.admission && m(crmAdmDate(l))) a.adm++; if (l.cancel && m(l.cancel.date)) a.canc++;
    if (l.app && l.app.paid && m(l.app.date)) a.coll += +l.app.fee || 0; if (l.srf && m(l.srf.paidOn)) a.coll += +l.srf.amount || 0; if (l.fee && m(l.fee.paidOn)) a.coll += +l.fee.amount || 0; l.fu.forEach(f => { if (m(f.t) && ['Call', 'WhatsApp'].includes(f.mode)) a.calls++; });
  });
  return a;
}
const crmMonthShift = (m, n) => { const d = new Date(m + '-01T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 7); };
function crmRag(actual, target, elapsed) { if (!target) return actual > 0 ? 'g' : 'n'; const ach = actual / target; if (ach >= 1) return 'g'; const exp = target * elapsed; if (actual === 0 && elapsed > 0.25) return 'r'; if (actual >= exp * 0.85) return 'a2'; return actual >= exp * 0.5 ? 'a' : 'r'; }
/* ---------- CSV import with duplicate validation ---------- */
function crmCsvParse(txt) { const rows = []; let r = [], f = '', q = false; for (let i = 0; i < txt.length; i++) { const ch = txt[i]; if (q) { if (ch === '"') { if (txt[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch; } else if (ch === '"') q = true; else if (ch === ',') { r.push(f); f = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && txt[i + 1] === '\n') i++; r.push(f); f = ''; if (r.some(x => x.trim())) rows.push(r); r = []; } else f += ch; } r.push(f); if (r.some(x => x.trim())) rows.push(r); return rows; }
function crmImportCheck(c, txt) {
  const R = crmCsvParse(txt || ''); if (R.length < 2) throw new Error('Paste or upload a CSV with a header row and at least one enquiry.');
  const H = R[0].map(h => crmNorm(h)), ix = n => H.findIndex(h => h.includes(n)), col = { name: ix('student'), cls: ix('class'), parent: ix('parent'), mobile: ix('mobile'), email: ix('email'), source: ix('source'), inst: ix('institution'), dob: ix('birth') };
  if ([col.name, col.cls, col.parent, col.mobile].some(i => i < 0)) throw new Error('The header must include Student, Class, Parent and Mobile columns.');
  const units = DATA.branches.filter(b => !b.closed && crmScope().has(b.id)), seen = [], res = [];
  R.slice(1).forEach((r, k) => {
    const g = i => i >= 0 ? (r[i] || '').trim() : '', o = { name: g(col.name), cls: g(col.cls), parent: g(col.parent), mobile: g(col.mobile).replace(/\D/g, '').slice(-10), email: g(col.email), source: g(col.source) || 'Excel upload', dob: g(col.dob) }, inst = g(col.inst);
    const b = inst ? units.find(u => crmNorm(u.name) === crmNorm(inst) || u.id === inst) : (units.length === 1 ? units[0] : null); o.ent = b ? b.id : ''; let err = '';
    if (!inst && units.length > 1) err = 'Institution column is required'; else if (!o.ent) err = 'Unknown institution "' + inst + '"'; else if (o.name.length < 3) err = 'Student name missing'; else if (!o.cls) err = 'Class missing'; else if (!o.parent) err = 'Parent missing'; else if (!crmMobileOk(o.mobile)) err = 'Invalid mobile'; else if (!c.cfg.sources.some(s => s.name === o.source && s.active)) err = 'Unknown source "' + o.source + '"';
    if (!err) { const d = crmDupFind(c, o); if (d) err = 'Duplicate of ' + d.no; else if (seen.some(s => crmNorm(s.name) === crmNorm(o.name) && s.mobile === o.mobile)) err = 'Duplicate inside this file'; }
    if (!err) seen.push(o); res.push({ row: k + 2, o, err });
  });
  return res;
}
/* ---------- waitlist, parent uploads ---------- */
function crmWlAdd(c, l, note) { if (!['Application', 'Documents', 'SRF Pending'].includes(l.stage)) throw new Error('A lead can join the waitlist after the application is submitted.'); if (l.waitlist) throw new Error('Already on the waitlist.'); if ((note || '').trim().length < 3) throw new Error('Add a short note.'); l.waitlist = { since: PROC_TODAY, note: note.trim() }; if (l.stage === 'SRF Pending') { l.stage = 'Documents'; l.srf = null; } l.hist.push({ t: PROC_TODAY, by: crmWho(), a: 'Waitlisted', r: note.trim() }); crmLog(c, 'Waitlisted', l.no, l.cls + ' · ' + crmBrName(l.ent)); }
function crmWlQueue(c, bid, cls) { return c.leads.filter(l => l.waitlist && l.ent === bid && l.cls === cls && CRM_OPEN.includes(l.stage)).sort((a, b) => a.waitlist.since.localeCompare(b.waitlist.since) || a.no.localeCompare(b.no)); }
function crmWlOffer(c, l) { if (!l.waitlist) throw new Error('Not on the waitlist.'); const st = crmSeats(l.ent, l.cls, c); if (!(st.free > 0)) throw new Error('No seat is free in ' + l.cls + ' yet.'); const q = crmWlQueue(c, l.ent, l.cls); if (q[0] && q[0].id !== l.id) throw new Error('Offer the seat to ' + q[0].name + ' first — they joined the waitlist earlier.'); l.waitlist = null; l.hist.push({ t: PROC_TODAY, by: crmWho(), a: 'Seat offered', r: 'Taken off the waitlist' }); l.next = PROC_TODAY; crmLog(c, 'Waitlist seat offered', l.no, l.cls); }
function crmDocUpload(c, l, i, f) { const d = l.docs[i]; if (!d) throw new Error('Document not found.'); if (!f || !f.data) throw new Error('Choose a file.'); d.file = { name: f.name, type: f.type, data: f.data }; d.status = 'Uploaded'; d.by = 'Parent (portal)'; d.on = PROC_TODAY; l.updated = PROC_TODAY; l.hist.push({ t: PROC_TODAY, by: 'Parent (portal)', a: 'Document uploaded', r: d.name }); crmLog(c, 'Document uploaded', l.no, d.name); }
/* ---------- inbound sync: receipts, student IDs, leads ---------- */
function crmFindLead(c, o) { const l = c.leads.find(x => (o.enquiryNo && x.no === o.enquiryNo) || (o.admissionNo && x.admission === o.admissionNo)); if (!l) throw new Error('No enquiry ' + (o.enquiryNo || o.admissionNo || '(missing number)') + '.'); return l; }
function crmApplyPayment(c, o) {
  const l = crmFindLead(c, o), kind = o.kind, ref = String(o.receipt || o.reference || '').trim(); if (ref.length < 3) throw new Error('The receipt / reference is missing.');
  if (kind === 'srf') { if (l.srf && l.srf.status === 'Paid' && l.srf.ref === ref) return 'already recorded'; if (l.stage !== 'SRF Pending') throw new Error(l.no + ' is at ' + l.stage + ', not waiting for SRF.'); if (+o.amount !== +l.srf.amount) throw new Error('Amount ' + o.amount + ' does not match the SRF of ' + l.srf.amount + '.'); crmMove(c, l, 'SRF Paid', { remarks: 'Confirmed by billing · ' + ref, next: pcAddDays(PROC_TODAY, 2), mode: o.mode || 'Billing system', ref }); return 'SRF paid'; }
  if (kind === 'fee') { if (l.fee && l.fee.ref === ref) return 'already recorded'; if (l.stage !== 'Admitted') throw new Error(l.no + ' is at ' + l.stage + ', not waiting for the admission fee.'); crmMove(c, l, 'Enrolled', { remarks: 'Fee confirmed by billing · ' + ref, fee: +o.amount || 0, mode: o.mode || 'Billing system', ref }); return 'enrolled'; }
  if (kind === 'refund') { const r = l.cancel && l.cancel.refund; if (r && r.status === 'Paid' && r.ref === ref) return 'already recorded'; crmRefundStep(c, l, 'pay', ref); return 'refund paid'; }
  throw new Error('Unknown payment kind "' + kind + '" (use srf, fee or refund).');
}
function crmApplyStudent(c, o) { const l = crmFindLead(c, o), id = String(o.studentId || '').trim(); if (id.length < 3) throw new Error('The student ID is missing.'); if (!l.admission) throw new Error(l.no + ' has no confirmed admission yet.'); if (l.erpId === id) return 'already recorded'; l.erpId = id; l.hist.push({ t: PROC_TODAY, by: 'LMS sync', a: 'Student ID received', r: id }); crmLog(c, 'Student ID received', l.no, id); return 'student ID saved'; }
function crmIngest(c, arr) {
  const out = []; (Array.isArray(arr) ? arr : [arr]).forEach((x, i) => { try { const b = DATA.branches.find(y => !y.closed && (y.id === x.institution || crmNorm(y.name) === crmNorm(x.institution))); if (!b) throw new Error('Unknown institution "' + x.institution + '"'); const o = { name: x.studentName || x.student, parent: x.parentName || x.parent, mobile: String(x.mobile || '').replace(/\D/g, '').slice(-10), email: x.email, cls: x.class, ent: b.id, source: x.source || 'Website / online enquiry', campaign: x.campaign || '', qr: x.qr || '', utm: x.utm || '', dob: x.dob || '', gender: x.gender || '', lang: x.language || 'English', by: 'Lead API', notes: x.notes || '' }; if (!c.cfg.sources.some(s => s.name === o.source && s.active)) throw new Error('Unknown source "' + o.source + '"'); const l = crmAddLead(c, o); out.push({ i, ok: true, enquiryNo: l.no }); } catch (e) { out.push({ i, ok: false, error: e.message }); } }); return out;
}
/* ---------- demo seed from the MSEA branches and admissions ---------- */
const CRM_FN = ['Aarav', 'Vihaan', 'Ayaan', 'Ishaan', 'Reyansh', 'Arjun', 'Sai', 'Advik', 'Zaid', 'Mohammed', 'Aditya', 'Krish', 'Ananya', 'Diya', 'Aisha', 'Fatima', 'Myra', 'Saanvi', 'Kiara', 'Zoya', 'Riya', 'Navya', 'Sara', 'Ira', 'Meera', 'Pranav', 'Rohan', 'Kabir', 'Anvi', 'Tanvi'];
const CRM_LN = ['Sharma', 'Verma', 'Khan', 'Reddy', 'Naidu', 'Rao', 'Gupta', 'Singh', 'Yadav', 'Ahmed', 'Siddiqui', 'Patil', 'Shaikh', 'Mishra', 'Pillai', 'Kumar', 'Hussain', 'Begum', 'Joshi', 'Qureshi'];
const CRM_COMPETE = ['Delhi Public School', 'Oakridge International', 'Narayana', 'Sri Chaitanya', 'Little Flower', 'St. Mary\'s', 'Hope Public School'];
function crmSeedBuild(c) {
  let sd = 20261019; const rnd = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296, pick = a => a[Math.floor(rnd() * a.length)], between = (a, b) => a + Math.floor(rnd() * (b - a + 1)), day = n => pcAddDays(PROC_TODAY, n);
  const cmpDefs = [['Summer Admission Drive 2026', 'Digital ads', 'Google Ads', 'ALL', -75, 60, 250000], ['Instagram & Reels Campaign', 'Social media', 'Meta (Facebook / Instagram) Ads', 'ALL', -60, 30, 120000], ['Open House Weekend', 'Open house / event', 'School event / open house', 'ALL', -40, -33, 90000], ['Newspaper Insert – Telugu & Urdu dailies', 'Newspaper / print', 'Newspaper / hoarding', 'Hyderabad', -55, -20, 180000], ['Hoarding – Kanpur & Delhi', 'Hoarding / outdoor', 'Newspaper / hoarding', 'Delhi', -70, 20, 150000], ['Parent Referral Rewards', 'Referral drive', 'Parent referral', 'ALL', -90, 90, 60000], ['Landing Page – Admissions 2027-28', 'Website / landing page', 'Website / online enquiry', 'ALL', -30, 90, 80000], ['Nearby Schools Visit Drive', 'School visit', 'Walk-in', 'ALL', -45, -10, 40000]];
  cmpDefs.forEach(([name, type, source, scope, s, e, budget]) => {
    c.seq.camp++; const id = 'C' + c.seq.camp, spend = Math.round(budget * (0.35 + rnd() * 0.55) / 100) * 100, heads = ['Creative & design', 'Media / placement', 'Printing & material'], parts = [0.2, 0.6, 0.2];
    const exp = heads.map((h, i) => { c.seq.exp++; let dt = day(s + 3 + i * 4); const hi = day(e) < PROC_TODAY ? day(e) : PROC_TODAY; if (dt > hi) dt = hi; if (dt < day(s)) dt = day(s); return { id: 'X' + c.seq.exp, date: dt, head: h, amount: Math.round(spend * parts[i] / 100) * 100, note: '', emergency: '' }; });
    c.campaigns.push({ id, no: 'CMP-' + crmPad(c.seq.camp), name, type, source, scope, start: day(s), end: day(e), budget, spend: exp.reduce((a, x) => a + x.amount, 0), expenses: exp, status: day(e) < PROC_TODAY ? 'Completed' : 'Active', owner: 'U098' });
    c.seq.qr++; c.qr.push({ code: 'QR' + String(c.seq.qr).padStart(3, '0'), label: name, kind: 'Campaign', ref: id, lang: 'English', scans: 0, starts: 0, created: day(s), active: day(e) >= PROC_TODAY });
  });
  const zoneNames = [...new Set(DATA.branches.map(b => b.zone))]; zoneNames.forEach(z => { c.seq.qr++; c.qr.push({ code: 'QR' + String(c.seq.qr).padStart(3, '0'), label: 'Campus banner – ' + z, kind: 'Branch', ref: z, lang: 'English', scans: 0, starts: 0, created: day(-60), active: true }); });
  users().filter(u => u.role === 'Admissions Counsellor').forEach(u => { c.seq.qr++; c.qr.push({ code: 'QR' + String(c.seq.qr).padStart(3, '0'), label: 'Visiting card – ' + crmUserName(u.id), kind: 'Counsellor', ref: u.id, lang: 'English', scans: 0, starts: 0, created: day(-50), active: true }); });
  const clsFor = b => /College|IOE|SRC|MSEC/.test(b.name + b.type) ? ['B.Com Year 1', 'B.Sc Year 1', 'BBA Year 1', 'Inter 1st Year'] : /Kids/.test(b.name) ? ['Nursery', 'LKG', 'UKG', 'I'] : ['Nursery', 'LKG', 'UKG', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
  const adm = {}; DATA.students.forEach(s => { if (s.status === 'New Admission' && s.parent) (adm[s.b] = adm[s.b] || []).push(s); });
  const camFor = (src, b) => { const l = c.campaigns.filter(x => x.source === src && (x.scope === 'ALL' || b.zone.startsWith(x.scope) || b.region.startsWith(x.scope))); return l.length && rnd() < 0.6 ? pick(l).id : ''; };
  const qrFor = (l, b) => { if (l.campaign && rnd() < 0.75) return (c.qr.find(q => q.ref === l.campaign) || {}).code || ''; if (['Walk-in', 'Parent referral', 'Phone call / call centre'].includes(l.source) && rnd() < 0.3) { const q = c.qr.find(x => x.kind === 'Counsellor' && x.ref === l.counsellor); return q ? q.code : ''; } if (rnd() < 0.12) { const q = c.qr.find(x => x.kind === 'Branch' && x.ref === b.zone); return q ? q.code : ''; } return ''; };
  const mkNo = () => '9' + between(100000000, 999999999);
  const mkLead = (b, cr, src, o) => {
    const fn = o.fn || pick(CRM_FN), ln = o.ln || pick(CRM_LN), cou = o.cou || crmCounsellorFor(b.id), cls = o.cls;
    const l = { id: 'L' + (c.seq.lead + 1), no: crmNextNo(c, 'lead', 'ENQ'), ent: b.id, ay: CUR_AY, name: o.name || fn + ' ' + ln, dob: '', gender: o.gender || (/a$|i$/.test(fn) && rnd() < 0.8 ? 'Female' : 'Male'), parent: o.parent || pick(CRM_FN.slice(0, 12)) + ' ' + ln, parentOcc: pick(['Business', 'Government service', 'Private service', 'Doctor', 'Teacher', 'Engineer', 'Self-employed']), mobile: mkNo(), email: rnd() < 0.4 ? `${fn.toLowerCase()}.${ln.toLowerCase()}@example.com` : '', curSchool: rnd() < 0.7 ? pick(['Little Angels School', 'City Public School', 'Sunrise Play School', 'Govt. High School', 'Anwar-ul-Uloom', 'Not applicable']) : '', cls, source: src, campaign: '', qr: '', utm: '', lang: pick(['English', 'English', 'Urdu', 'Hindi', 'Telugu']), priority: rnd() < 0.06 ? 'VIP' : rnd() < 0.2 ? 'High' : 'Normal', interest: pick(['Hot', 'Warm', 'Warm', 'Cold']), joining: pick(CRM_JOIN), counsellor: cou, stage: 'New', created: cr, updated: cr, next: '', notes: '', fu: [], comm: [], hist: [{ t: cr, by: 'Counsellor', a: 'Enquiry created', r: src }, { t: cr, by: 'System', a: 'Assigned', r: crmUserName(cou) }], app: null, docs: [], srf: null, fee: null, conc: null, cancel: null, meeting: null, admission: '', lost: '', lostNote: '', competitor: '', mergedInto: '', sibling: null, waitlist: null, consent: null, erpId: '', inErp: false };
    l.campaign = camFor(src, b); l.qr = qrFor(l, b); if (l.qr && !l.source.match(/Walk|referral|call/i)) l.utm = 'utm_source=' + src.split(' ')[0].toLowerCase() + '&utm_campaign=' + l.campaign; return l;
  };
  /* walk a lead through the stages up to `target`, giving each step a believable date */
  const walk = (l, target, b) => {
    let path = CRM_FLOW.slice(0, CRM_FLOW.indexOf(target) + 1).filter(s => !(['Interested', 'Counselling', 'Visit Scheduled', 'Visited'].includes(s) && s !== target && rnd() < 0.3)); let prev = 'New', d = l.created;
    path.slice(1).forEach(s => {
      d = pcAddDays(d, between(1, 3)); if (d > PROC_TODAY) d = PROC_TODAY; l.hist.push({ t: d, by: 'Counsellor', a: prev + ' → ' + s, r: '' }); prev = s; l.stage = s; l.updated = d;
      if (s === 'Contacted') l.fu.push({ t: d, by: 'Counsellor', mode: pick(['Call', 'WhatsApp', 'Call']), outcome: 'Interested', note: pick(['Spoke to the father, asked about fees', 'Mother enquired about transport and timings', 'Shared the brochure on WhatsApp', 'Asked for a campus visit on the weekend']), next: pcAddDays(d, 3) });
      if (s === 'Counselling') l.meeting = { kind: pick(CRM_MEET.slice(0, 4)), date: d, counsellor: l.counsellor, reco: 'Recommended ' + l.cls };
      if (s === 'Application') l.app = { no: crmNextNo(c, 'app', 'APP'), date: d, fee: 500, paid: rnd() < 0.75, mode: pick(['Cash', 'UPI']), by: 'Counsellor', channel: rnd() < 0.5 ? 'Online' : 'Offline' };
      if (s === 'Application') l.consent = rnd() < 0.8 ? { on: d, by: 'Parent (portal)', text: '' } : null;
      if (s === 'Documents') l.docs = c.cfg.docs.map((n, i) => ({ name: n, status: rnd() < 0.5 ? 'Verified' : rnd() < 0.2 ? 'Rejected' : 'Pending', note: '' }));
      if (s === 'SRF Pending') { if (!l.consent) l.consent = { on: d, by: 'Counsellor (signed form)', text: '' }; l.docs.forEach(x => { x.status = 'Verified'; }); l.srf = { amount: crmSrfAmt(b.id), status: 'Pending', due: pcAddDays(d, 5), mode: '', ref: '', paidOn: '' }; }
      if (s === 'SRF Paid') { l.srf.status = 'Paid'; l.srf.mode = pick(['UPI', 'Cash', 'Card']); l.srf.ref = 'RCT' + between(10000, 99999); l.srf.paidOn = d; }
      if (s === 'Admitted') { l.admission = crmGenAdm(c, l); }
      if (s === 'Enrolled') l.fee = { amount: between(8, 25) * 1000, mode: pick(['UPI', 'Cash', 'Bank transfer']), paidOn: d, ref: '' };
    });
    if (path.length > 2) { l.fu.push({ t: pcAddDays(l.created, 5) > PROC_TODAY ? PROC_TODAY : pcAddDays(l.created, 5), by: 'Counsellor', mode: 'Campus visit', outcome: 'Applied', note: 'Visited the campus and discussed the fee structure', next: pcAddDays(l.created, 8) }); }
    if (CRM_OPEN.includes(l.stage)) { l.next = day(between(-3, 9)); if (rnd() < 0.8) l.updated = day(-between(0, 5)); if (l.next < l.updated && l.stage !== 'New') l.next = pcAddDays(l.updated, 1); if (l.next < l.created) l.next = pcAddDays(l.created, 1); }
    if (l.stage === 'Counselling' && l.meeting) l.next = l.meeting.date >= PROC_TODAY ? l.meeting.date : l.next;
  };
  const needDays = t => CRM_FLOW.indexOf(t) * 2 + 2;
  DATA.branches.forEach((b, bi) => {
    if (b.closed) return; const cls = clsFor(b), cou = crmCounsellorFor(b.id), tgt = between(4, 7);
    c.cfg.targets[b.id] = { leads: tgt, counselling: Math.ceil(tgt * 0.6), visits: Math.ceil(tgt * 0.5), apps: Math.ceil(tgt * 0.35), srf: Math.ceil(tgt * 0.25), adm: Math.ceil(tgt * 0.2), coll: Math.ceil(tgt * 0.25) * crmSrfAmt(b.id) + Math.ceil(tgt * 0.35) * 500 };
    (adm[bi] || []).slice(0, 3).forEach(s => {
      const target = rnd() < 0.5 ? 'Enrolled' : 'Admitted', cr = day(-between(Math.max(needDays(target), 35), 90)), l = mkLead(b, cr, s.source, { name: s.name, parent: s.parent, cls: s.cls, cou: s.counsellor || cou });
      walk(l, target, b); l.inErp = true; if (s.adm) { l.admission = s.adm; l.erpId = s.adm; }
      if (rnd() < 0.1) { const paid = crmPaidIn(l), amt = rnd() < 0.5 ? Math.round(paid * 0.8) : 0, st = pick(['Requested', 'Approved', 'Paid']); l.cancel = { date: PROC_TODAY, reason: pick(['Shifted to another city', 'Fee not affordable', 'Got seat in another school']), by: 'Admissions Head', from: l.stage, refund: { amount: amt, status: amt ? st : 'None', ref: st === 'Paid' ? 'NEFT' + between(1e5, 9e5) : '' } }; l.hist.push({ t: PROC_TODAY, by: 'Admissions Head', a: l.stage + ' → Cancelled', r: l.cancel.reason }); l.stage = 'Cancelled'; l.srf.status = amt ? (st === 'Paid' ? 'Refunded' : 'Refund requested') : 'Forfeited'; l.next = ''; }
      c.leads.push(l);
    });
    const n = between(3, 7); for (let i = 0; i < n; i++) {
      const r = rnd(), cum = [['New', .2], ['Contacted', .38], ['Interested', .5], ['Counselling', .58], ['Visit Scheduled', .66], ['Visited', .73], ['Application', .79], ['Documents', .83], ['SRF Pending', .86], ['SRF Paid', .88], ['Lost', .98], ['Admitted', 1]], st = cum.find(x => r < x[1])[0], src = pick(c.cfg.sources.map(x => x.name)), cr = st === 'New' ? day(-between(0, 3)) : day(-between(needDays(st === 'Lost' ? 'Contacted' : st) > 40 ? 40 : needDays(st === 'Lost' ? 'Contacted' : st), 55));
      const l = mkLead(b, cr, src, { cls: pick(cls), cou }); if (st === 'Lost') { walk(l, 'Contacted', b); const why = pick(['Not interested', 'Lost to competitor', 'Fee affordability', 'Distance / transport', 'Relocating', 'Not reachable', 'Follow-up later', 'Not eligible']); l.lost = why; l.hist.push({ t: l.updated, by: 'Counsellor', a: l.stage + ' → Lost', r: why }); l.stage = 'Lost'; if (why === 'Lost to competitor') l.competitor = pick(CRM_COMPETE); l.next = why === 'Follow-up later' ? day(between(5, 30)) : ''; }
      else walk(l, st, b); c.leads.push(l);
    }
  });
  c.seq.lead = Math.max(0, ...c.leads.map(l => +l.id.slice(1) || 0));
  /* a few leads with deliberate issues so the alerts have something to show */
  c.leads.filter(l => l.stage === 'New').slice(0, 4).forEach((l, i) => { if (i === 0) l.counsellor = ''; if (i === 1) l.created = day(-6); });
  c.leads.filter(l => l.stage === 'Lost' && l.lost === 'Not reachable').slice(0, 2).forEach(l => { l.lost = 'Other'; l.lostNote = ''; });
  /* a few leads already carry a concession request, and some messages are in the sent log */
  c.leads.filter(l => ['Counselling', 'Application', 'Documents'].includes(l.stage)).slice(0, 6).forEach((l, i) => { l.conc = { type: '%', amount: [10, 25, 15][i % 3], reason: 'Sibling studying in the group / merit scholarship', status: i % 3 === 0 ? 'Pending' : i % 3 === 1 ? 'Approved' : 'Rejected', by: 'Counsellor', on: PROC_TODAY }; });
  c.leads.forEach(l => { if (l.stage === 'New' && rnd() < 0.5) return; const t = c.templates[0]; l.comm.push({ t: l.created, by: 'System', ch: 'WhatsApp', tpl: t.id, text: crmRender(t.body, l), dir: 'Out' }); if (l.srf && l.srf.status === 'Pending') { const t7 = c.templates[6]; l.comm.push({ t: l.updated, by: 'Counsellor', ch: 'SMS', tpl: 'T7', text: crmRender(t7.body, l), dir: 'Out' }); } });
  /* QR statistics follow the leads that carry each code */
  c.qr.forEach(q => { const n = c.leads.filter(l => l.qr === q.code).length; q.starts = n + between(1, 4) + Math.round(n * 0.6); q.scans = q.starts + Math.round(q.starts * (1.2 + rnd())); });
}
function crmEnsureSeed() {
  const cur = Store.get('crm'); if (!cur || cur.seedVer === CRM_SEED_VER) return; if (!users().length || !DATA.branches.length || !DATA.students.length) return;
  const keep = (cur.leads || []).filter(l => l.userMade).map(l => Object.assign({ dob: '', gender: '', parentOcc: '', curSchool: '', qr: '', utm: '', lang: 'English', priority: 'Normal', interest: 'Warm', joining: '', comm: [], docs: [], srf: null, fee: null, conc: null, cancel: null, meeting: null, lostNote: '', competitor: '', mergedInto: '', sibling: null, waitlist: null, consent: null, erpId: '', inErp: false }, l)), c = defaultCRM(); try { crmSeedBuild(c); } catch (e) { console.error('CRM seed failed', e); return; }
  c.seedVer = CRM_SEED_VER; keep.forEach(l => c.leads.push(l)); c.seq.lead = Math.max(c.seq.lead, ...c.leads.map(l => +l.id.slice(1) || 0)); c.log = []; Store.put('crm', c);
}
