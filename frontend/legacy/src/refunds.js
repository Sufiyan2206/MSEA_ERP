/* ===== Refunds, concessions, learner categories and receipt verification ===== */
const RF_ACT = {};
Store.init({ rfc: { rf: [], cn: [], cat: {}, seq: { rf: 0, cn: 0 }, cfg: { limit: 25000, concPct: 25 }, log: [] } });
const rfD = () => Store.get('rfc');
const rfCan = k => can('rfc', k);
const rfSave = d => Store.put('rfc', d);
const rfAud = (a, o) => audit('Refunds & concessions', a, o || {});
const rfId = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const RF_TYPES = ['Excess payment', 'Admission cancelled', 'Transfer certificate', 'Receipt entered in error', 'Security deposit', 'Other'];
const RF_MODES = ['Bank transfer', 'Cheque', 'Cash', 'Adjust against next fee'];
const RF_CT = ['Staff child', 'Sibling', 'Merit scholarship', 'Need-based', 'Management', 'Sponsored', 'Other'];
const RF_CATS = ['Little Hearts', 'Heavenly Hearts', 'Sponsored', 'One-time payment'];
function rfLog(d, bid, action, o, reason) { const u = App.user || {}; d.log.unshift({ id: rfId('RG'), at: nowIso(), bid: bid || '', branch: (acBr(bid) || {}).name || '', user: u.name || '—', role: u.role || '', action, old: o && o.old != null ? String(o.old) : '', new: o && o.new != null ? String(o.new) : '', reason: reason || '' }); if (d.log.length > 3000) d.log.length = 3000; }
const rfStu = adm => DATA.students.find(s => s.adm === String(adm || '').trim());
const rfBid = s => DATA.branches[s.b].id;
/* receipt signature: the QR on a receipt carries it so a counter or auditor can check the paper against the register */
function rfSig(r) { let h = 5381; const t = [r.no, Math.round(r.total * 100), r.day, r.adm].join('|'); for (let i = 0; i < t.length; i++) h = ((h * 33) ^ t.charCodeAt(i)) >>> 0; return h.toString(36).toUpperCase().padStart(7, '0'); }
const rfPayload = r => `MSEA-RC|${r.no}|${Math.round(r.total * 100) / 100}|${r.day}|${rfSig(r)}`;
function rfQrMatrix(text) { if (typeof qrcode !== 'function') return null; const q = qrcode(0, 'M'); q.addData(text); q.make(); const n = q.getModuleCount(), m = []; for (let r = 0; r < n; r++) { m.push([]); for (let c = 0; c < n; c++) m[r].push(q.isDark(r, c)); } return m; }
function rfQrPdf(doc, text, x, y, size) { const m = rfQrMatrix(text); if (!m) return false; const k = size / m.length; doc.setFillColor(0, 0, 0); m.forEach((row, r) => row.forEach((on, c) => { if (on) doc.rect(x + c * k, y + r * k, k, k, 'F'); })); return true; }
/* money already paid for a learner, less refunds that are open or paid */
function rfRefundable(s, rcNo) {
  const x = E.studentsAt(DATA, A, E.dn(PROC_TODAY))[DATA.students.indexOf(s)], paid = x ? x.paid : 0, d = rfD();
  const taken = d.rf.filter(r => r.adm === s.adm && !['Rejected', 'Cancelled'].includes(r.st) && (!rcNo || r.rc === rcNo)).reduce((a, r) => a + r.amt, 0);
  let cap = Math.max(0, paid - d.rf.filter(r => r.adm === s.adm && !['Rejected', 'Cancelled'].includes(r.st)).reduce((a, r) => a + r.amt, 0));
  if (rcNo) { const rc = cdD().rc.find(r => r.no === rcNo && r.adm === s.adm); cap = rc ? Math.min(cap, Math.max(0, rc.total - taken)) : 0; }
  return cap;
}
PAGES.refunds = { title: 'Refunds & concessions', mod: 'rfc', sf: true, render() {
  const D = rfD(), { bid, list } = acBidSel(); if (!list.length) return empty('No branches in your scope for these filters.');
  const tab = pcTab('rf', 'dash'), mine = App.user.name;
  const RF = D.rf.filter(r => r.bid === bid), CN = D.cn.filter(c => c.bid === bid), open = RF.filter(r => ['Requested', 'Approved'].includes(r.st)), pc = CN.filter(c => c.st === 'Requested');
  const tabs = pcTabs('rf', [['dash', 'Overview'], ['rf', 'Refunds', RF.length], ['cn', 'Concessions', CN.length], ['cat', 'Learner categories'], ['vr', 'Verify receipt'], ...(rfCan('View audit logs') ? [['log', 'Audit trail']] : [])], 'dash');
  const bsel = `<label class="fld"><span>Branch</span><select data-act="uiSel" data-k="acBid">${list.map(b => `<option value="${esc(b.id)}" ${b.id === bid ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select></label>`;
  let body = '';
  const act = (id, a, l, cls) => `<button class="btn sm ${cls || ''}" data-act="${a}" data-k="${esc(id)}">${l}</button>`;
  if (tab === 'dash') {
    const sum = a => a.reduce((x, r) => x + r.amt, 0);
    body = `<div class="ctrls">${bsel}</div><div class="kpis k4"><div class="kpi"><span>Refunds waiting</span><b>${NUM(open.length)}</b></div><div class="kpi"><span>Waiting amount</span><b>${INR(sum(open))}</b></div><div class="kpi"><span>Refunded (paid)</span><b>${INR(sum(RF.filter(r => r.st === 'Paid')))}</b></div><div class="kpi"><span>Concessions to approve</span><b>${NUM(pc.length)}</b></div></div><div class="note">A refund is requested by one person, approved by another and paid out by an accounts user. Amounts above ${INR(D.cfg.limit)} need CFO-level approval. Concession records do not change the ERP fee schedule; use Approvals → Financial adjustment for that.</div>`;
  } else if (tab === 'rf') {
    const cols = [{ h: 'Ref', t: 'text', k: r => r.no }, { h: 'Learner', t: 'text', k: r => `${r.name} (${r.adm})` }, { h: 'Type', t: 'text', k: r => r.type }, { h: 'Amount', t: 'inr', k: r => r.amt }, { h: 'Mode', t: 'text', k: r => r.mode }, { h: 'Status', t: 'text', k: r => r.st }, { h: 'Requested by', t: 'text', k: r => r.by },
      { h: '', t: 'html', k: r => [r.st === 'Requested' && rfCan('Approve') && r.by !== mine ? act(r.id, 'rfOk', 'Approve') + act(r.id, 'rfNo', 'Reject') : '', r.st === 'Requested' && r.by === mine ? act(r.id, 'rfCx', 'Withdraw') : '', r.st === 'Approved' && rfCan('Verify') && r.by !== mine && r.apBy !== mine ? act(r.id, 'rfPay', 'Mark paid') : ''].join(' ') }];
    body = `<div class="ctrls">${bsel}${rfCan('Add') ? '<button class="btn pri" data-act="rfReqForm">New refund request</button>' : ''}</div>` + table('rf_t', cols, RF, { empty: 'No refund requests for this branch.', title: 'Refund register' });
  } else if (tab === 'cn') {
    const cols = [{ h: 'Ref', t: 'text', k: c => c.no }, { h: 'Learner', t: 'text', k: c => `${c.name} (${c.adm})` }, { h: 'Type', t: 'text', k: c => c.type }, { h: 'Value', t: 'text', k: c => c.basis === '%' ? c.val + '%' : INR(c.val) }, { h: 'Valid', t: 'text', k: c => `${c.from} to ${c.to}` }, { h: 'Document', t: 'text', k: c => c.doc }, { h: 'Status', t: 'text', k: c => c.st }, { h: 'Requested by', t: 'text', k: c => c.by },
      { h: '', t: 'html', k: c => [c.st === 'Requested' && rfCan('Approve') && c.by !== mine ? act(c.id, 'cnOk', 'Approve') + act(c.id, 'cnNo', 'Reject') : '', c.st === 'Active' && rfCan('Approve') ? act(c.id, 'cnRev', 'Revoke') : ''].join(' ') }];
    body = `<div class="ctrls">${bsel}${rfCan('Add') ? '<button class="btn pri" data-act="cnReqForm">New concession request</button>' : ''}</div>` + table('cn_t', cols, CN, { empty: 'No concessions recorded for this branch.', title: 'Concession register' });
  } else if (tab === 'cat') {
    const rows = Object.entries(D.cat).filter(([k]) => k.startsWith(bid + '|')).map(([k, c]) => Object.assign({ k }, c));
    body = `<div class="ctrls">${bsel}${rfCan('Edit') ? '<button class="btn pri" data-act="catForm">Tag a learner</button>' : ''}</div>` + table('cat_t', [{ h: 'Learner', t: 'text', k: c => `${c.name} (${c.adm})` }, { h: 'Category', t: 'text', k: c => c.cat }, { h: 'Sponsor / note', t: 'text', k: c => c.note || '' }, { h: 'Set by', t: 'text', k: c => c.by }, { h: '', t: 'html', k: c => rfCan('Edit') ? act(c.k, 'catDel', 'Remove') : '' }], rows, { empty: 'No learner has a special category in this branch.', title: 'Learner categories' }) + `<div class="note">Categories are tags for reporting. They do not change the fee schedule.</div>`;
  } else if (tab === 'vr') {
    const vr = App.ui.rfVr;
    body = `<div class="ctrls"><label class="fld"><span>Receipt number, or the text read from the receipt QR</span><input id="vr_in" value="${esc(App.ui.rfVrIn || '')}" placeholder="e.g. B06/CD/2610/0001"></label><button class="btn pri" data-act="rfVerify">Check</button></div>` + (vr ? `<div class="note" style="border-left:4px solid ${vr.ok ? '#15803d' : '#b91c1c'}"><b>${esc(vr.title)}</b><br>${esc(vr.msg)}</div>` : '');
  } else if (tab === 'log') {
    body = table('rf_log', [{ h: 'When', t: 'text', k: l => tsLabel(l.at) }, { h: 'User', t: 'text', k: l => l.user }, { h: 'Action', t: 'text', k: l => l.action }, { h: 'Detail', t: 'text', k: l => l.new }, { h: 'Reason', t: 'text', k: l => l.reason }], D.log.filter(l => l.bid === bid || !l.bid), { empty: 'Nothing recorded yet.' });
  }
  return card('Refunds & concessions', tabs + body, { sub: 'Refunds, concessions and learner categories are records. Nothing is paid or sent from here.' });
} };
/* ---- refunds ---- */
RF_ACT.rfReqForm = () => {
  if (!rfCan('Add')) return;
  modal('New refund request', `<div class="form-grid">${pcFld('Admission no.', `<input id="rf_a">`)}${pcFld('Type', `<select id="rf_ty">${RF_TYPES.map(t => `<option>${t}</option>`).join('')}</select>`)}${pcFld('Amount (₹)', `<input id="rf_m" type="number" min="1">`)}${pcFld('Pay back by', `<select id="rf_md">${RF_MODES.map(t => `<option>${t}</option>`).join('')}</select>`)}${pcFld('Receipt no. (optional)', `<input id="rf_rc">`)}${pcFld('Supporting document (file name)', `<input id="rf_pf">`)}</div>${pcFld('Reason', `<textarea id="rf_r" rows="3"></textarea>`)}`, `<button class="btn pri" data-act="rfReqOk">Submit for approval</button>`, true);
};
RF_ACT.rfReqOk = async () => {
  if (!rfCan('Add')) return; const s = rfStu(v('rf_a')); if (!s) return toast('No learner with that admission number.', 'bad');
  const { list } = acBidSel(), bid = rfBid(s); if (!list.some(b => b.id === bid)) return toast('This learner is outside your branch scope.', 'bad');
  const amt = Math.round((+v('rf_m') || 0) * 100) / 100, rcNo = (v('rf_rc') || '').trim(), why = (v('rf_r') || '').trim(), pf = (v('rf_pf') || '').trim();
  if (!(amt > 0)) return toast('Enter the amount.', 'bad'); if (why.length < 10) return toast('Give the reason (at least 10 characters).', 'bad'); if (pf.length < 3) return toast('Name the supporting document.', 'bad');
  if (rcNo && !cdD().rc.some(r => r.no === rcNo && r.adm === s.adm)) return toast('That receipt is not for this learner.', 'bad');
  const cap = rfRefundable(s, rcNo); if (amt > cap) return toast(`Only ${INR(cap)} can still be refunded${rcNo ? ' against that receipt' : ''}.`, 'bad');
  const d = Store.clone(rfD()); d.seq.rf++; const r = { id: rfId('RF'), no: `RF-${String(d.seq.rf).padStart(4, '0')}`, bid, adm: s.adm, name: s.name, type: v('rf_ty'), amt, mode: v('rf_md'), rc: rcNo, doc: pf, reason: why, st: 'Requested', by: App.user.name, byId: App.user.id, at: nowIso() };
  d.rf.unshift(r); rfLog(d, bid, 'Refund requested', { new: `${r.no} · ${s.adm} · ${INR(amt)}` }, why); await rfSave(d); rfAud('Refund requested', { new: `${r.no} ${amt}` }); closeModal(); toast(`Refund ${r.no} sent for approval.`); rerender();
};
const rfFind = t => rfD().rf.find(x => x.id === t.dataset.k);
RF_ACT.rfOk = t => {
  const r = rfFind(t); if (!r || r.st !== 'Requested' || !rfCan('Approve')) return; if (r.by === App.user.name) return toast('You raised this request, so someone else must approve it.', 'bad');
  if (r.amt > rfD().cfg.limit && !rfCan('Reverse')) return toast(`Amounts above ${INR(rfD().cfg.limit)} need CFO-level approval.`, 'bad');
  askReason('Approve ' + r.no, 'Note for the record (at least 5 characters).', async why => { if (why.length < 5) return toast('Give a note (at least 5 characters).', 'bad'); const d = Store.clone(rfD()), x = d.rf.find(y => y.id === r.id); if (!x || x.st !== 'Requested' || x.by === App.user.name) return toast('Already decided.', 'bad'); x.st = 'Approved'; x.apBy = App.user.name; x.apAt = nowIso(); rfLog(d, x.bid, 'Refund approved', { new: x.no }, why); await rfSave(d); rfAud('Refund approved', { new: x.no }); toast('Approved.'); rerender(); });
};
RF_ACT.rfNo = t => {
  const r = rfFind(t); if (!r || r.st !== 'Requested' || !rfCan('Approve')) return; if (r.by === App.user.name) return toast('You raised this request, so someone else must decide.', 'bad');
  askReason('Reject ' + r.no, 'Say why (at least 5 characters).', async why => { if (why.length < 5) return toast('Give a reason (at least 5 characters).', 'bad'); const d = Store.clone(rfD()), x = d.rf.find(y => y.id === r.id); if (!x || x.st !== 'Requested') return toast('Already decided.', 'bad'); x.st = 'Rejected'; x.apBy = App.user.name; x.note = why; rfLog(d, x.bid, 'Refund rejected', { new: x.no }, why); await rfSave(d); toast('Rejected.'); rerender(); });
};
RF_ACT.rfCx = t => {
  const r = rfFind(t); if (!r || r.st !== 'Requested' || r.by !== App.user.name) return;
  askReason('Withdraw ' + r.no, 'Say why (at least 5 characters).', async why => { if (why.length < 5) return toast('Give a reason (at least 5 characters).', 'bad'); const d = Store.clone(rfD()), x = d.rf.find(y => y.id === r.id); if (!x || x.st !== 'Requested') return toast('Already decided.', 'bad'); x.st = 'Cancelled'; x.note = why; rfLog(d, x.bid, 'Refund withdrawn', { new: x.no }, why); await rfSave(d); toast('Withdrawn.'); rerender(); });
};
RF_ACT.rfPay = t => {
  const r = rfFind(t); if (!r || r.st !== 'Approved' || !rfCan('Verify')) return; if (r.by === App.user.name || r.apBy === App.user.name) return toast('The person who raised or approved a refund cannot pay it out.', 'bad');
  modal('Mark ' + r.no + ' paid', `<div class="form-grid">${pcFld('Payment reference (UTR / cheque no.)', `<input id="rf_pr">`)}${pcFld('Paid on', `<input id="rf_pd" type="date" value="${PROC_TODAY}">`)}</div>`, `<button class="btn pri" data-act="rfPayOk" data-k="${r.id}">Confirm</button>`);
};
RF_ACT.rfPayOk = async t => {
  const r = rfFind(t); if (!r || r.st !== 'Approved' || !rfCan('Verify') || r.by === App.user.name || r.apBy === App.user.name) return; const ref = (v('rf_pr') || '').trim(), on = v('rf_pd');
  if (r.mode !== 'Adjust against next fee' && ref.length < 3) return toast('Enter the payment reference.', 'bad'); if (!on || on > PROC_TODAY) return toast('Choose a payment date that is not in the future.', 'bad');
  const d = Store.clone(rfD()), x = d.rf.find(y => y.id === r.id); x.st = 'Paid'; x.payRef = ref; x.paidOn = on; x.paidBy = App.user.name; rfLog(d, x.bid, 'Refund paid', { new: `${x.no} · ${INR(x.amt)} · ${ref}` }); await rfSave(d); rfAud('Refund paid', { new: x.no }); closeModal(); toast('Marked as paid.'); rerender();
};
/* ---- concessions ---- */
RF_ACT.cnReqForm = () => {
  if (!rfCan('Add')) return;
  modal('New concession request', `<div class="form-grid">${pcFld('Admission no.', `<input id="cn_a">`)}${pcFld('Type', `<select id="cn_ty">${RF_CT.map(t => `<option>${t}</option>`).join('')}</select>`)}${pcFld('Given as', `<select id="cn_b"><option value="%">Percent</option><option value="₹">Rupees</option></select>`)}${pcFld('Value', `<input id="cn_v" type="number" min="1">`)}${pcFld('Valid from', `<input id="cn_f" type="date" value="${PROC_TODAY}">`)}${pcFld('Valid to', `<input id="cn_t" type="date" value="${pcAddDays(PROC_TODAY, 365)}">`)}${pcFld('Supporting document (file name)', `<input id="cn_d">`)}</div>${pcFld('Reason', `<textarea id="cn_r" rows="3"></textarea>`)}`, `<button class="btn pri" data-act="cnReqOk">Submit for approval</button>`, true);
};
RF_ACT.cnReqOk = async () => {
  if (!rfCan('Add')) return; const s = rfStu(v('cn_a')); if (!s) return toast('No learner with that admission number.', 'bad');
  const { list } = acBidSel(), bid = rfBid(s); if (!list.some(b => b.id === bid)) return toast('This learner is outside your branch scope.', 'bad');
  const basis = v('cn_b'), val = +v('cn_v') || 0, from = v('cn_f'), to = v('cn_t'), doc = (v('cn_d') || '').trim(), why = (v('cn_r') || '').trim(), type = v('cn_ty');
  if (!(val > 0)) return toast('Enter the value.', 'bad'); if (basis === '%' && val > 100) return toast('A percentage cannot exceed 100.', 'bad'); if (!from || !to || to < from) return toast('Choose valid dates.', 'bad');
  if (doc.length < 3) return toast('Name the supporting document.', 'bad'); if (why.length < 10) return toast('Give the reason (at least 10 characters).', 'bad');
  const d = Store.clone(rfD()); if (d.cn.some(c => c.adm === s.adm && c.type === type && ['Requested', 'Active'].includes(c.st) && c.from <= to && c.to >= from)) return toast('This learner already has this concession for these dates.', 'bad');
  d.seq.cn++; const c = { id: rfId('CN'), no: `CN-${String(d.seq.cn).padStart(4, '0')}`, bid, adm: s.adm, name: s.name, type, basis, val, from, to, doc, reason: why, st: 'Requested', by: App.user.name, byId: App.user.id, at: nowIso() };
  d.cn.unshift(c); rfLog(d, bid, 'Concession requested', { new: `${c.no} · ${s.adm} · ${type} ${basis === '%' ? val + '%' : INR(val)}` }, why); await rfSave(d); rfAud('Concession requested', { new: c.no }); closeModal(); toast(`Concession ${c.no} sent for approval.`); rerender();
};
const cnFind = t => rfD().cn.find(x => x.id === t.dataset.k);
RF_ACT.cnOk = t => {
  const c = cnFind(t); if (!c || c.st !== 'Requested' || !rfCan('Approve')) return; if (c.by === App.user.name) return toast('You raised this request, so someone else must approve it.', 'bad');
  if (c.basis === '%' && c.val > rfD().cfg.concPct && !rfCan('Reverse')) return toast(`Concessions above ${rfD().cfg.concPct}% need CFO-level approval.`, 'bad');
  askReason('Approve ' + c.no, 'Note for the record (at least 5 characters).', async why => { if (why.length < 5) return toast('Give a note (at least 5 characters).', 'bad'); const d = Store.clone(rfD()), x = d.cn.find(y => y.id === c.id); if (!x || x.st !== 'Requested' || x.by === App.user.name) return toast('Already decided.', 'bad'); x.st = 'Active'; x.apBy = App.user.name; rfLog(d, x.bid, 'Concession approved', { new: x.no }, why); await rfSave(d); rfAud('Concession approved', { new: x.no }); toast('Approved.'); rerender(); });
};
RF_ACT.cnNo = t => {
  const c = cnFind(t); if (!c || c.st !== 'Requested' || !rfCan('Approve')) return; if (c.by === App.user.name) return toast('You raised this request, so someone else must decide.', 'bad');
  askReason('Reject ' + c.no, 'Say why (at least 5 characters).', async why => { if (why.length < 5) return toast('Give a reason (at least 5 characters).', 'bad'); const d = Store.clone(rfD()), x = d.cn.find(y => y.id === c.id); if (!x || x.st !== 'Requested') return toast('Already decided.', 'bad'); x.st = 'Rejected'; x.note = why; rfLog(d, x.bid, 'Concession rejected', { new: x.no }, why); await rfSave(d); toast('Rejected.'); rerender(); });
};
RF_ACT.cnRev = t => {
  const c = cnFind(t); if (!c || c.st !== 'Active' || !rfCan('Approve')) return;
  askReason('Revoke ' + c.no, 'Say why (at least 10 characters).', async why => { if (why.length < 10) return toast('Give a reason (at least 10 characters).', 'bad'); const d = Store.clone(rfD()), x = d.cn.find(y => y.id === c.id); if (!x || x.st !== 'Active') return toast('Already changed.', 'bad'); x.st = 'Revoked'; x.note = why; rfLog(d, x.bid, 'Concession revoked', { new: x.no }, why); await rfSave(d); rfAud('Concession revoked', { new: x.no }); toast('Revoked.'); rerender(); });
};
/* ---- learner categories ---- */
RF_ACT.catForm = () => {
  if (!rfCan('Edit')) return;
  modal('Tag a learner', `<div class="form-grid">${pcFld('Admission no.', `<input id="ct_a">`)}${pcFld('Category', `<select id="ct_c">${RF_CATS.map(t => `<option>${t}</option>`).join('')}</select>`)}${pcFld('Sponsor / note', `<input id="ct_n">`)}</div>`, `<button class="btn pri" data-act="catOk">Save</button>`);
};
RF_ACT.catOk = async () => {
  if (!rfCan('Edit')) return; const s = rfStu(v('ct_a')); if (!s) return toast('No learner with that admission number.', 'bad'); const { list } = acBidSel(), bid = rfBid(s); if (!list.some(b => b.id === bid)) return toast('This learner is outside your branch scope.', 'bad');
  const cat = v('ct_c'), note = (v('ct_n') || '').trim(); if (cat === 'Sponsored' && note.length < 3) return toast('Name the sponsor.', 'bad');
  const d = Store.clone(rfD()), k = bid + '|' + s.adm, old = d.cat[k]; d.cat[k] = { adm: s.adm, name: s.name, cat, note, by: App.user.name, at: nowIso() }; rfLog(d, bid, 'Learner category set', { old: old ? old.cat : '', new: `${s.adm} ${cat}` }, note); await rfSave(d); rfAud('Learner category set', { new: `${s.adm} ${cat}` }); closeModal(); toast('Saved.'); rerender();
};
RF_ACT.catDel = t => {
  if (!rfCan('Edit')) return; const k = t.dataset.k, c = rfD().cat[k]; if (!c) return;
  askReason('Remove category', 'Say why (at least 5 characters).', async why => { if (why.length < 5) return toast('Give a reason (at least 5 characters).', 'bad'); const d = Store.clone(rfD()); if (!d.cat[k]) return; delete d.cat[k]; rfLog(d, k.split('|')[0], 'Learner category removed', { old: `${c.adm} ${c.cat}` }, why); await rfSave(d); toast('Removed.'); rerender(); });
};
/* ---- receipt check ---- */
RF_ACT.rfVerify = () => {
  const raw = (v('vr_in') || '').trim(); App.ui.rfVrIn = raw; let no = raw, sig = '', amtP = null, dayP = '';
  if (raw.startsWith('MSEA-RC|')) { const p = raw.split('|'); no = p[1] || ''; amtP = +p[2]; dayP = p[3] || ''; sig = p[4] || ''; }
  const r = cdD().rc.find(x => x.no === no);
  if (!no) App.ui.rfVr = { ok: false, title: 'Nothing to check', msg: 'Type a receipt number or paste the QR text.' };
  else if (!r) App.ui.rfVr = { ok: false, title: 'Not found', msg: `No receipt ${no} exists in the collection desk. It may be forged or issued outside the system.` };
  else if (sig && (sig !== rfSig(r) || amtP !== Math.round(r.total * 100) / 100 || dayP !== r.day)) App.ui.rfVr = { ok: false, title: 'Does not match', msg: `Receipt ${no} exists, but the amount, date or learner on the paper differs from the register. Treat as altered.` };
  else App.ui.rfVr = { ok: r.st === 'Posted', title: r.st === 'Posted' ? 'Genuine receipt' : 'Receipt is ' + r.st, msg: `${r.no} · ${r.name} (${r.adm}) · ${INR(r.total)} on ${r.day} · ${r.mode}${r.st !== 'Posted' ? '. Do not accept it as proof of payment.' : ''}` };
  rerender();
};
