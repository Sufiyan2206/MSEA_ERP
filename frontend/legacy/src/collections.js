/* ===== Collections desk: take a payment at the counter, print the receipt, cancel with a second person, close the day.
   Receipts taken here are held here until they are entered in the school fee system; that system's outstanding figures do not change by themselves. ===== */
const CD_ACT = {};
const CD_MODES = ['Cash', 'UPI', 'Card', 'Bank transfer', 'Cheque', 'Online gateway', 'Adjustment'];
const CD_DEN = [500, 200, 100, 50, 20, 10, 5, 2, 1];
const CD_HEADS = ['Admission fee', 'Registration fee', 'Hostel fee', 'Transport fee', 'Books', 'Uniform', 'Activities fee', 'Examination fee', 'Library fine', 'Advance payment', 'Previous outstanding recovery', 'Cash sale / service', 'Other authorised income', 'Other'];
const CD_CUST_HEADS = ['Cash sale / service', 'Other authorised income', 'Advance payment', 'Admission fee', 'Registration fee', 'Books', 'Uniform', 'Activities fee', 'Examination fee', 'Other'];
Store.init({ cdk: { rc: [], dc: [], seq: {}, log: [] } });
const cdD = () => Store.get('cdk');
const cdCan = k => can('cdk', k);
const cdSave = d => Store.put('cdk', d);
const cdAud = (a, o) => audit('Collections desk', a, o || {});
const cdId = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const cdR2 = x => Math.round((+x || 0) * 100) / 100;
function cdLog(d, bid, action, o, reason) { const u = App.user || {}; d.log.unshift({ id: cdId('CG'), at: nowIso(), bid: bid || '', branch: bid ? (acBr(bid) || {}).name || '' : 'All', user: u.name || '—', role: u.role || '', action, old: o && o.old != null ? String(o.old) : '', new: o && o.new != null ? String(o.new) : '', reason: reason || '' }); if (d.log.length > 2000) d.log.length = 2000; }
const cdClosedDay = (d, bid, day) => d.dc.some(c => c.bid === bid && c.day === day && c.state !== 'Reopened');
/* fee balance of a student from the fee system as on the business date, less what the desk has taken that is not yet in the fee system */
function cdBal(s, d) {
  const D = E.dn(PROC_TODAY), i = DATA.students.indexOf(s), x = E.studentsAt(DATA, A, D)[i]; if (!x) return [];
  const desk = {}; d.rc.filter(r => r.adm === s.adm && r.bid === DATA.branches[s.b].id && ['Posted', 'Cancel requested'].includes(r.st) && !r.erpNo).forEach(r => r.lines.forEach(l => { if (l.k != null) desk[l.k] = (desk[l.k] || 0) + l.amt; }));
  const out = []; const its = (s._py ? [s._py] : []).concat(s._items);
  its.forEach(it => { const r = x.inst[it.k]; if (!r || r.upcoming != null || !(r.bal > 0.005)) return; const t = desk[it.k] || 0; out.push({ k: it.k, name: it.k >= 0 ? A.sched[it.k].name : 'Adjustment', due: E.ds(it.due), bal: r.bal, desk: t, left: Math.max(0, cdR2(r.bal - t)) }); });
  return out.filter(r => r.left > 0.005 || r.desk > 0);
}
function cdTotals(rows) { const m = {}; CD_MODES.forEach(k => m[k] = 0); let t = 0; rows.forEach(r => { m[r.mode] += r.total; t += r.total; }); return { m, t }; }
PAGES.collections = { title: 'Collections desk', mod: 'cdk', sf: true, render() {
  const D = cdD(), { bid, list } = acBidSel(); if (!list.length) return empty('No branches in your scope for these filters.');
  const tab = pcTab('cdk', 'desk'), mine = App.user.name;
  const RC = D.rc.filter(r => r.bid === bid), today = RC.filter(r => r.day === PROC_TODAY && r.st !== 'Cancelled'), pendC = RC.filter(r => r.st === 'Cancel requested'), DC = D.dc.filter(c => c.bid === bid);
  const closed = cdClosedDay(D, bid, PROC_TODAY), unver = DC.filter(c => c.state === 'Closed');
  const tabs = pcTabs('cdk', [['desk', 'Take payment'], ['rc', 'Receipts', pendC.length || ''], ['day', 'Counter closing', unver.length || ''], ['rep', 'Collection summary'], ['log', 'Audit trail']], 'desk');
  const bsel = `<label class="fld"><span>Branch</span><select data-act="uiSel" data-k="acBid">${list.map(b => `<option value="${esc(b.id)}" ${b.id === bid ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select></label>`;
  let body = '', right = '', sub = '';
  if (tab === 'desk') {
    const T = cdTotals(today), q = (App.ui.cdkQ || '').trim().toLowerCase();
    const hits = q.length >= 2 ? hsStuAll(bid).filter(s => (s.adm + ' ' + s.name).toLowerCase().includes(q)).slice(0, 8) : [];
    body = `<div class="kpis k4"><div class="kpi"><span>Receipts today</span><b>${NUM(today.length)}</b></div><div class="kpi"><span>Taken today</span><b>${INR(T.t)}</b></div><div class="kpi"><span>Cash in hand</span><b>${INR(T.m.Cash)}</b></div><div class="kpi"><span>Today’s desk</span><b>${closed ? 'Closed' : 'Open'}</b></div></div>`
      + (closed ? '<div class="note">Today is closed for this branch. A person with approval rights has to reopen it before another payment is taken.</div>' : '')
      + (cdCan('Add') && !D.rc.some(r => r.bid === bid && r.sample) ? '<div class="ctrls"><button class="btn" data-act="cdkSample">Load sample data for this branch</button></div>' : '') + (cdCan('Approve') && D.rc.some(r => r.sample) ? '<div class="ctrls"><button class="btn" data-act="cdkSampleOff">Remove all sample data</button></div>' : '')
      + (cdCan('Add') && !closed ? '<div class="ctrls"><button class="btn" data-act="cdkCustForm">Other collection (not a student)</button></div>' : '') + (cdCan('Add') ? `<div class="ctrls">${bsel}<label class="fld"><span>Find a student (name or admission no.)</span><input id="cdkQ" data-act="cdkQ" value="${esc(App.ui.cdkQ || '')}" placeholder="Type and press Enter"></label></div>` : `<div class="ctrls">${bsel}</div><div class="note">You can view collections but not take a payment.</div>`)
      + (q.length >= 2 ? table('cdSt', [{ h: 'Adm. no.', k: s => s.adm, t: 'text' }, { h: 'Student', k: s => s.name, t: 'text' }, { h: 'Class', k: s => s.cls + ' ' + (s.sec || ''), t: 'text' }, { h: 'Fee still to collect', k: s => cdBal(s, D).reduce((a, r) => a + r.left, 0), t: 'inr' }, { h: '', k: s => cdCan('Add') && !closed ? `<button class="btn sm primary" data-act="cdkPayForm" data-k="${esc(s.adm)}">Take payment</button>` : '', t: 'html', noexp: true }], hits, { empty: 'No student matches.' }) : '<p class="muted">Search for the student paying. You can then receive fees, and other payments such as hostel, transport or library fines.</p>');
    sub = 'Payments taken here are kept in this application until they are entered in the school fee system. Mark each receipt once it is entered there, so it is not counted twice.';
  } else if (tab === 'rc') {
    body = `<div class="ctrls">${bsel}</div>` + table('cdRc', [{ h: 'Receipt', k: r => `<b>${esc(r.no)}</b><br><span class="muted small">${esc(r.day)}</span>`, t: 'html', x: r => r.no }, { h: 'Student', k: r => `${esc(r.name)}<br><span class="muted small">${esc(r.adm)} · ${esc(r.cls)}</span>`, t: 'html', x: r => r.name }, { h: 'Paid for', k: r => r.lines.map(l => l.head).join(', '), t: 'text', cls: 'wrap' }, { h: 'Mode', k: r => r.mode + (r.ref ? ' · ' + r.ref : ''), t: 'text' }, { h: 'Amount', k: r => r.total, t: 'inr' }, { h: 'Taken by', k: r => r.by, t: 'text' }, { h: 'In fee system', k: r => r.erpNo || '—', t: 'text' }, { h: 'Status', k: r => pill(r.st, r.st === 'Posted' ? 'g' : r.st === 'Cancelled' ? 'n' : 'a'), t: 'html', x: r => r.st }, { h: '', k: r => `<button class="btn sm" data-act="cdkView" data-k="${r.id}">Open</button>`, t: 'html', noexp: true }], RC, { limit: 60, title: 'Collections desk receipts' });
    right = exportBtns('cdRc', 'cdk', { label: false }); sub = 'A receipt is cancelled only on the request of one person and the approval of another, and only before the day is closed.';
  } else if (tab === 'day') {
    const exp = today.filter(r => r.mode === 'Cash' && !r.closed).reduce((a, r) => a + r.total, 0), open = RC.filter(r => r.day === PROC_TODAY && r.st === 'Posted' && !r.closed);
    body = `<div class="ctrls">${bsel}${cdCan('Add') && !closed ? `<button class="btn primary" data-act="cdkCloseForm">Close today’s desk</button>` : ''}</div><div class="kpis k4"><div class="kpi"><span>Receipts not yet closed</span><b>${NUM(open.length)}</b></div><div class="kpi"><span>Cash expected in the till</span><b>${INR(exp)}</b></div><div class="kpi"><span>Other modes</span><b>${INR(open.filter(r => r.mode !== 'Cash').reduce((a, r) => a + r.total, 0))}</b></div><div class="kpi"><span>Days waiting for check</span><b>${NUM(unver.length)}</b></div></div>`
      + table('cdDc', [{ h: 'Day', k: c => c.day, t: 'text', x: c => c.day }, { h: 'Receipts', k: c => c.n, t: 'num' }, { h: 'Total', k: c => c.total, t: 'inr' }, { h: 'Cash expected', k: c => c.expected, t: 'inr' }, { h: 'Cash counted', k: c => c.counted, t: 'inr' }, { h: 'Difference', k: c => c.diff, t: 'inr', rc: c => c.diff ? 'red' : '' }, { h: 'Closed by', k: c => c.by, t: 'text' }, { h: 'Checked by', k: c => c.verBy || '—', t: 'text' }, { h: 'Reason', k: c => c.reason || '', t: 'text', cls: 'wrap' }, { h: 'Status', k: c => pill(c.state === 'Closed' ? 'Waiting for check' : c.state, c.state === 'Verified' ? 'g' : c.state === 'Closed' ? 'a' : 'n'), t: 'html', x: c => c.state }, { h: '', k: c => (c.state === 'Closed' && cdCan('Verify') && c.by !== mine ? `<button class="btn sm primary" data-act="cdkVerify" data-k="${c.id}">Confirm</button>` : '') + (c.state === 'Closed' && cdCan('Verify') ? ` <button class="btn sm" data-act="cdkReopen" data-k="${c.id}">Reopen</button>` : ''), t: 'html', noexp: true }], DC, { title: 'Collections desk day closing' });
    right = exportBtns('cdDc', 'cdk', { label: false }); sub = 'Count the cash, enter the figure and close the day. A different person confirms the count. If the count differs from the receipts, a reason is needed.';
  } else if (tab === 'rep') {
    const from = App.ui.cdkFrom || PROC_TODAY.slice(0, 8) + '01', to = App.ui.cdkTo || PROC_TODAY;
    const R = RC.filter(r => r.st !== 'Cancelled' && r.day >= from && r.day <= to), heads = {}; R.forEach(r => r.lines.forEach(l => { heads[l.head] = (heads[l.head] || 0) + l.amt; }));
    const T = cdTotals(R);
    body = `<div class="ctrls">${bsel}<label class="fld"><span>From</span><input type="date" id="cdkFrom" data-act="cdkRange" value="${from}"></label><label class="fld"><span>To</span><input type="date" id="cdkTo" data-act="cdkRange" value="${to}"></label></div><div class="kpis k4"><div class="kpi"><span>Receipts</span><b>${NUM(R.length)}</b></div><div class="kpi"><span>Total taken</span><b>${INR(T.t)}</b></div><div class="kpi"><span>Cash</span><b>${INR(T.m.Cash)}</b></div><div class="kpi"><span>Not yet in fee system</span><b>${INR(R.filter(r => !r.erpNo).reduce((a, r) => a + r.total, 0))}</b></div></div>`
      + '<h4>By mode</h4>' + table('cdMode', [{ h: 'Mode', k: r => r.k, t: 'text' }, { h: 'Amount', k: r => r.v, t: 'inr' }], CD_MODES.map(k => ({ k, v: T.m[k] })), { total: { k: 'Total', v: T.t }, title: 'Desk collection by mode' })
      + '<h4>By head</h4>' + table('cdHead', [{ h: 'Head', k: r => r.k, t: 'text' }, { h: 'Amount', k: r => r.v, t: 'inr' }], Object.keys(heads).map(k => ({ k, v: heads[k] })), { total: { k: 'Total', v: T.t }, title: 'Desk collection by head' });
    right = exportBtns('cdHead', 'cdk', { label: false });
  } else {
    body = cdCan('View audit logs') || cdCan('Add') ? table('cdLog', [{ h: 'When', k: e => tsLabel(e.at), t: 'text', x: e => e.at }, { h: 'User', k: e => `${esc(e.user)}<br><span class="muted small">${esc(e.role)}</span>`, t: 'html', x: e => e.user }, { h: 'Branch', k: e => e.branch || '—', t: 'text' }, { h: 'Action', k: e => e.action, t: 'text', cls: 'wrap' }, { h: 'Before', k: e => e.old, t: 'text' }, { h: 'After', k: e => e.new, t: 'text', cls: 'wrap' }, { h: 'Reason', k: e => e.reason, t: 'text', cls: 'wrap' }], D.log, { limit: 80, title: 'Collections desk audit trail' }) : noAccess();
    right = exportBtns('cdLog', 'cdk', { label: false });
  }
  return card('Collections desk', tabs + body, { right, sub });
} };
/* ===== actions ===== */
CD_ACT.cdkQ = t => { App.ui.cdkQ = t.value.trim(); rerender(); };
CD_ACT.cdkRange = t => { App.ui[t.id] = t.value; rerender(); };
const cdDenGrid = () => `<details open><summary class="small"><b>Cash denominations</b> (notes and coins received; the total must equal the cash amount)</summary><div class="form-grid">${CD_DEN.map(x => pcFld('₹' + x + ' × count', `<input id="cd_d${x}" type="number" min="0" step="1" inputmode="numeric">`)).join('')}</div></details>`;
const cdDenRead = () => { const o = {}; let t = 0; CD_DEN.forEach(x => { const n = Math.floor(+v('cd_d' + x) || 0); if (n > 0) { o[x] = n; t += n * x; } }); return { o, t }; };
const cdCommonFields = () => `<div class="form-grid">${pcFld('Mode', pcSel('cd_m', CD_MODES, 'Cash'))}${pcFld('Cheque no. / UPI, card, bank or gateway reference (not needed for cash)', '<input id="cd_r">')}${pcFld('Collection counter / route', '<input id="cd_ctr" placeholder="e.g. Counter 1">')}${pcFld('Paid by (parent / person)', '<input id="cd_p">')}${pcFld('Mobile', '<input id="cd_mob" inputmode="tel">')}${pcFld('Discount / concession (₹), if any', '<input id="cd_dc" type="number" min="0" step="0.01">')}${pcFld('Approval reference for discount or adjustment', '<input id="cd_dr">')}${pcFld('Proof (optional) – file name is recorded', '<input id="cd_pf" type="file">')}${pcFld('Remarks', '<input id="cd_rm">')}</div>` + cdDenGrid();
/* validates the mode-related fields shared by student and non-student receipts; returns { err } or the values */
function cdCommon(total) {
  const mode = v('cd_m'), ref = (v('cd_r') || '').trim(); if (!CD_MODES.includes(mode)) return { err: 'Choose the mode of payment.' };
  if (!['Cash', 'Adjustment'].includes(mode) && ref.length < 4) return { err: 'Enter the cheque number or transaction reference.' };
  const dc = cdR2(v('cd_dc')), dr = (v('cd_dr') || '').trim(); if (dc < 0) return { err: 'Discount cannot be negative.' }; if (dc > 0 && dr.length < 3) return { err: 'A discount or concession needs an approval reference.' };
  if (mode === 'Adjustment') { if (!cdCan('Approve')) return { err: 'Only an authorised approver can record an adjustment.' }; if (dr.length < 3) return { err: 'An adjustment needs an approval reference.' }; }
  const den = cdDenRead(); let dn = {};
  if (mode === 'Cash') { if (Math.abs(den.t - total) > 0.005) return { err: `The denominations add up to ${INR(den.t)} but the cash amount is ${INR(total)}.` }; dn = den.o; } else if (den.t > 0) return { err: 'Denominations are only for cash.' };
  const pf = document.getElementById('cd_pf'); const proof = pf && pf.files && pf.files[0] ? pf.files[0].name : '';
  return { mode, ref, disc: dc > 0 ? { amt: dc, ref: dr } : null, adjRef: mode === 'Adjustment' ? dr : '', den: dn, counter: (v('cd_ctr') || '').trim(), payer: (v('cd_p') || '').trim(), mobile: (v('cd_mob') || '').trim(), proof, remarks: (v('cd_rm') || '').trim() };
}
function cdIssue(bid, who, lines, C, d) {
  const br = acBr(bid), n = (d.seq[bid] = (d.seq[bid] || 0) + 1), total = cdR2(lines.reduce((a, l) => a + l.amt, 0)), u = App.user;
  const rc = Object.assign({ id: cdId('CD'), no: `${br.code}/CD/${PROC_TODAY.slice(2, 4)}${PROC_TODAY.slice(5, 7)}/${String(n).padStart(4, '0')}`, bid, day: PROC_TODAY, at: nowIso(), by: u.name, byId: u.id, lines, total, mode: C.mode, ref: C.ref, payer: C.payer, mobile: C.mobile, counter: C.counter, den: C.den, disc: C.disc, adjRef: C.adjRef, proof: C.proof, remarks: C.remarks, st: 'Posted', closed: '', erpNo: '' }, who);
  d.rc.unshift(rc); return rc;
}
CD_ACT.cdkPayForm = t => {
  if (!cdCan('Add')) return; const { bid } = acBidSel(), s = hsStu(bid, t.dataset.k); if (!s) return toast('Student not found in this branch.', 'bad');
  const d = cdD(); if (cdClosedDay(d, bid, PROC_TODAY)) return toast('Today is closed for this branch.', 'bad');
  const B = cdBal(s, d);
  const fee = B.length ? table('cdFee', [{ h: 'Fee', k: r => r.name, t: 'text' }, { h: 'Due on', k: r => r.due, t: 'text' }, { h: 'Fee system balance', k: r => r.bal, t: 'inr' }, { h: 'Taken at desk, not yet entered', k: r => r.desk, t: 'inr' }, { h: 'Pay now (₹)', k: r => r.left > 0 ? `<input id="cd_f${r.k}" type="number" min="0" max="${r.left}" step="0.01" placeholder="up to ${Math.round(r.left)}" style="width:110px">` : '—', t: 'html', noexp: true }], B, { compact: true }) : '<p class="muted">No fee is outstanding for this student.</p>';
  const oth = [0, 1].map(i => `<div class="form-grid">${pcFld('Other payment ' + (i + 1), pcSel('cd_h' + i, CD_HEADS, '', 'None'))}${pcFld('Amount (₹)', `<input id="cd_a${i}" type="number" min="0" step="0.01">`)}${pcFld('Note', `<input id="cd_n${i}">`)}</div>`).join('');
  modal(`Take payment · ${s.name} (${s.adm}, ${s.cls})`, `<p class="small muted">Collector: ${esc(App.user.name)} (${esc(App.user.id)}) · ${esc(acBr(bid).name)} · ${isoLabel(PROC_TODAY)} · Student mobile ${esc(s.mobile || '—')}</p>` + fee + '<h4>Other payments</h4>' + oth + cdCommonFields(), `<button class="btn primary" data-act="cdkPostOk" data-k="${esc(s.adm)}">Receive and issue receipt</button><button class="btn" data-act="closeModal">Cancel</button>`, true);
};
CD_ACT.cdkPostOk = async t => {
  if (!cdCan('Add')) return; const { bid } = acBidSel(), s = hsStu(bid, t.dataset.k); if (!s) return toast('Student not found in this branch.', 'bad');
  const d0 = cdD(); if (cdClosedDay(d0, bid, PROC_TODAY)) return toast('Today is closed for this branch.', 'bad');
  const B = cdBal(s, d0), lines = []; for (const r of B) { const raw = v('cd_f' + r.k); if (raw === '' || raw == null) continue; const a = cdR2(raw); if (!(a > 0)) return toast('Enter a positive amount for ' + r.name + '.', 'bad'); if (a > r.left + 0.005) return toast(`${r.name}: at most ${INR(r.left)} can be received.`, 'bad'); lines.push({ head: r.name, k: r.k, amt: a }); }
  for (let i = 0; i < 2; i++) { const h = v('cd_h' + i), raw = v('cd_a' + i); if (!h && !raw) continue; if (!h || !CD_HEADS.includes(h)) return toast('Choose what other payment ' + (i + 1) + ' is for.', 'bad'); const a = cdR2(raw); if (!(a > 0)) return toast('Enter the amount for ' + h + '.', 'bad'); if (['Other', 'Advance payment', 'Other authorised income'].includes(h) && (v('cd_n' + i) || '').trim().length < 3) return toast('Say what “' + h + '” is for.', 'bad'); lines.push({ head: h, k: null, amt: a, note: (v('cd_n' + i) || '').trim() }); }
  if (!lines.length) return toast('Enter at least one amount.', 'bad');
  const C = cdCommon(cdR2(lines.reduce((a, l) => a + l.amt, 0))); if (C.err) return toast(C.err, 'bad');
  const d = Store.clone(cdD()); if (cdClosedDay(d, bid, PROC_TODAY)) return toast('Today is closed for this branch.', 'bad');
  const rc = cdIssue(bid, { adm: s.adm, name: s.name, cls: s.cls + ' ' + (s.sec || ''), mobile: C.mobile || s.mobile || '' }, lines, C, d);
  cdLog(d, bid, 'Receipt issued', { new: `${rc.no} · ${INR(rc.total)} · ${rc.mode}` }); await cdSave(d); cdAud('Receipt issued', { new: `${rc.no} ${rc.total}` }); closeModal(); toast(`Receipt ${rc.no} issued.`, 'ok'); rerender(); CD_ACT.cdkView({ dataset: { k: rc.id } });
};
CD_ACT.cdkCustForm = () => {
  if (!cdCan('Add')) return; const { bid } = acBidSel(); const d = cdD(); if (cdClosedDay(d, bid, PROC_TODAY)) return toast('Today is closed for this branch.', 'bad');
  modal('Other collection (not a student fee)', `<p class="small muted">Collector: ${esc(App.user.name)} (${esc(App.user.id)}) · ${esc(acBr(bid).name)} · ${isoLabel(PROC_TODAY)}</p><div class="form-grid">${pcFld('Customer / payer name', '<input id="cd_cn">')}${pcFld('Customer ID (optional)', '<input id="cd_ci">')}${pcFld('Category', pcSel('cd_h0', CD_CUST_HEADS, ''))}${pcFld('Amount (₹)', '<input id="cd_a0" type="number" min="0" step="0.01">')}${pcFld('What is it for (required)', '<input id="cd_n0">')}</div>` + cdCommonFields(), `<button class="btn primary" data-act="cdkCustOk">Receive and issue receipt</button><button class="btn" data-act="closeModal">Cancel</button>`, true);
};
CD_ACT.cdkCustOk = async () => {
  if (!cdCan('Add')) return; const { bid } = acBidSel(), name = (v('cd_cn') || '').trim(), h = v('cd_h0'), a = cdR2(v('cd_a0')), note = (v('cd_n0') || '').trim();
  if (name.length < 2) return toast('Enter the customer or payer name.', 'bad'); if (!CD_CUST_HEADS.includes(h)) return toast('Choose the category.', 'bad'); if (!(a > 0)) return toast('Enter the amount.', 'bad'); if (note.length < 3) return toast('Say what the payment is for.', 'bad');
  const C = cdCommon(a); if (C.err) return toast(C.err, 'bad'); const d = Store.clone(cdD()); if (cdClosedDay(d, bid, PROC_TODAY)) return toast('Today is closed for this branch.', 'bad');
  const rc = cdIssue(bid, { adm: (v('cd_ci') || '').trim() || 'CUSTOMER', name, cls: 'Customer', cust: true, mobile: C.mobile }, [{ head: h, k: null, amt: a, note }], C, d);
  cdLog(d, bid, 'Receipt issued', { new: `${rc.no} · ${INR(rc.total)} · ${rc.mode} · non-student` }); await cdSave(d); cdAud('Receipt issued', { new: `${rc.no} ${rc.total}` }); closeModal(); toast(`Receipt ${rc.no} issued.`, 'ok'); rerender(); CD_ACT.cdkView({ dataset: { k: rc.id } });
};
CD_ACT.cdkView = t => {
  const r = cdD().rc.find(x => x.id === t.dataset.k); if (!r) return; const mine = App.user.name, d = cdD(), locked = !!r.closed || cdClosedDay(d, r.bid, r.day);
  const btns = [`<button class="btn" data-act="cdkPdf" data-k="${r.id}">Download receipt (PDF)</button>`];
  if (r.st === 'Posted' && cdCan('Add') && !locked) btns.push(`<button class="btn" data-act="cdkCxlReq" data-k="${r.id}">Request cancellation</button>`);
  if (r.st === 'Cancel requested' && cdCan('Approve') && r.cx.by !== mine) btns.push(`<button class="btn danger" data-act="cdkCxlOk" data-k="${r.id}">Approve cancellation</button><button class="btn" data-act="cdkCxlNo" data-k="${r.id}">Reject</button>`);
  if (r.st === 'Posted' && cdCan('Add') && !r.erpNo) btns.push(`<button class="btn" data-act="cdkErpForm" data-k="${r.id}">Entered in fee system</button>`);
  btns.push('<button class="btn" data-act="closeModal">Close</button>');
  modal(`${r.no} · ${r.st}`, `<div class="kv4"><div><span>Student</span><b>${esc(r.name)}</b><br>${esc(r.adm)} · ${esc(r.cls)}</div><div><span>Date</span><b>${esc(r.day)}</b></div><div><span>Mode</span><b>${esc(r.mode)}</b>${r.ref ? '<br>' + esc(r.ref) : ''}</div><div><span>Total</span><b>${INR(r.total)}</b></div></div>` + table('cdRl', [{ h: 'Paid for', k: l => l.head + (l.note ? ' – ' + l.note : ''), t: 'text' }, { h: 'Amount', k: l => l.amt, t: 'inr' }], r.lines, { total: { head: 'Total', amt: r.total }, compact: true, noexp: true }) + `<p class="small muted">Taken by ${esc(r.by)}${r.payer ? ' from ' + esc(r.payer) : ''}.${r.erpNo ? ' Entered in the fee system as ' + esc(r.erpNo) + '.' : ' Not yet entered in the fee system.'}${r.cx ? ` Cancellation ${r.st === 'Cancelled' ? 'approved' : 'requested'} by ${esc(r.cx.by)}: ${esc(r.cx.reason)}` : ''}</p>`, btns.join(''), true);
};
CD_ACT.cdkPdf = t => {
  const r = cdD().rc.find(x => x.id === t.dataset.k); if (!r) return; if (!window.jspdf) return toast('The PDF library did not load. Check your connection and reload.', 'bad');
  const br = acBr(r.bid) || {}, doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'a5' }); let y = 50;
  const L = (s, o = {}) => { doc.setFontSize(o.sz || 10); doc.setFont('helvetica', o.b ? 'bold' : 'normal'); doc.text(String(s), o.x || 40, y); y += o.dy || 16; };
  L('MS Education Academy', { sz: 14, b: 1, dy: 18 }); L(br.name || '', { dy: 22 }); L('FEE / PAYMENT RECEIPT' + (r.st === 'Cancelled' ? ' – CANCELLED' : ''), { sz: 11, b: 1, dy: 22 });
  L('Receipt no.: ' + r.no); L('Date: ' + r.day); L(`Student: ${r.name} (${r.adm}), ${r.cls}`); if (r.payer) L('Received from: ' + r.payer); y += 6;
  r.lines.forEach(l => { L(l.head + (l.note ? ' – ' + l.note : ''), { dy: 0 }); doc.text('Rs. ' + l.amt.toFixed(2), 360, y, { align: 'right' }); y += 16; });
  y += 4; L('Total', { b: 1, dy: 0 }); doc.text('Rs. ' + r.total.toFixed(2), 360, y, { align: 'right' }); y += 22; L('Mode: ' + r.mode + (r.ref ? ' (' + r.ref + ')' : '')); L('Received by: ' + r.by); y += 10; L('This is a computer generated receipt.', { sz: 8 }); try { rfQrPdf(doc, rfPayload(r), 300, y - 70, 70); } catch (e) {}
  saveFile(`receipt-${r.no.replace(/\//g, '-')}.pdf`, doc.output('blob'));
};
CD_ACT.cdkCxlReq = t => {
  const r = cdD().rc.find(x => x.id === t.dataset.k); if (!r || r.st !== 'Posted' || !cdCan('Add')) return; if (r.closed || cdClosedDay(cdD(), r.bid, r.day)) return toast('The day is closed, so this receipt can no longer be cancelled.', 'bad');
  askEvidence('Request cancellation of ' + r.no, 'Say why (at least 10 characters) and name the evidence (the parent\'s request, the wrong-entry note or the approval mail). Another person has to approve.', async (why, ev) => { if (why.length < 10) return toast('Give a reason (at least 10 characters).', 'bad'); const d = Store.clone(cdD()), x = d.rc.find(y => y.id === r.id); if (!x || x.st !== 'Posted' || x.closed || cdClosedDay(d, x.bid, x.day)) return toast('This receipt can no longer be cancelled.', 'bad'); x.st = 'Cancel requested'; x.cx = { by: App.user.name, at: nowIso(), reason: why, evidence: ev }; cdLog(d, x.bid, 'Cancellation requested', { old: x.no, new: INR(x.total) + ' · evidence: ' + ev }, why); await cdSave(d); toast('Sent for approval.', 'ok'); rerender(); });
};
CD_ACT.cdkCxlOk = t => {
  const r = cdD().rc.find(x => x.id === t.dataset.k); if (!r || r.st !== 'Cancel requested' || !cdCan('Approve')) return; if (r.cx.by === App.user.name) return toast('You requested this cancellation, so someone else must approve it.', 'bad');
  askReason('Approve cancellation of ' + r.no, 'Note for the record (at least 5 characters).', async why => { if (why.length < 5) return toast('Give a note (at least 5 characters).', 'bad'); const d = Store.clone(cdD()), x = d.rc.find(y => y.id === r.id); if (!x || x.st !== 'Cancel requested' || x.cx.by === App.user.name) return toast('Already decided.', 'bad'); if (x.closed || cdClosedDay(d, x.bid, x.day)) return toast('The day has been closed, so the receipt stays.', 'bad'); x.st = 'Cancelled'; x.cx.apprBy = App.user.name; x.cx.apprAt = nowIso(); cdLog(d, x.bid, 'Receipt cancelled', { old: x.no, new: 'Cancelled' }, why); await cdSave(d); cdAud('Receipt cancelled', { new: x.no, reason: why }); closeModal(); toast('Receipt cancelled.', 'ok'); rerender(); });
};
CD_ACT.cdkCxlNo = t => {
  const r = cdD().rc.find(x => x.id === t.dataset.k); if (!r || r.st !== 'Cancel requested' || !cdCan('Approve')) return; if (r.cx.by === App.user.name) return toast('You requested this cancellation, so someone else must decide.', 'bad');
  askReason('Reject cancellation of ' + r.no, 'Say why (at least 5 characters).', async why => { if (why.length < 5) return toast('Give a reason (at least 5 characters).', 'bad'); const d = Store.clone(cdD()), x = d.rc.find(y => y.id === r.id); if (!x || x.st !== 'Cancel requested') return toast('Already decided.', 'bad'); x.st = 'Posted'; cdLog(d, x.bid, 'Cancellation rejected', { old: x.no, new: 'Posted' }, why); delete x.cx; await cdSave(d); closeModal(); toast('Cancellation rejected. The receipt stands.', 'ok'); rerender(); });
};
CD_ACT.cdkErpForm = t => { const r = cdD().rc.find(x => x.id === t.dataset.k); if (!r || r.st !== 'Posted' || !cdCan('Add')) return; modal('Entered in the fee system · ' + r.no, pcFld('Receipt number in the fee system', '<input id="cd_erp">') + '<p class="small muted">Once marked, this payment is no longer subtracted from the fee balance shown at the desk, because the fee system now carries it.</p>', `<button class="btn primary" data-act="cdkErpOk" data-k="${r.id}">Save</button><button class="btn" data-act="closeModal">Cancel</button>`); };
CD_ACT.cdkErpOk = async t => { if (!cdCan('Add')) return; const no = (v('cd_erp') || '').trim(); if (no.length < 3) return toast('Enter the receipt number from the fee system.', 'bad'); const d = Store.clone(cdD()), x = d.rc.find(y => y.id === t.dataset.k); if (!x || x.st !== 'Posted' || x.erpNo) return toast('Cannot mark this receipt.', 'bad'); if (d.rc.some(y => y.erpNo === no)) return toast('That fee-system receipt number is already linked to another receipt.', 'bad'); x.erpNo = no; cdLog(d, x.bid, 'Marked as entered in fee system', { old: x.no, new: no }); await cdSave(d); closeModal(); toast('Saved.', 'ok'); rerender(); };
CD_ACT.cdkCloseForm = () => {
  if (!cdCan('Add')) return; const { bid } = acBidSel(), d = cdD(); if (cdClosedDay(d, bid, PROC_TODAY)) return toast('Already closed.', 'bad');
  const open = d.rc.filter(r => r.bid === bid && r.day === PROC_TODAY && r.st !== 'Cancelled'); if (open.some(r => r.st === 'Cancel requested')) return toast('Decide the pending cancellation request first.', 'bad');
  const exp = open.filter(r => r.mode === 'Cash').reduce((a, r) => a + r.total, 0);
  modal('Close today’s desk', `<p class="small">${open.length} receipts, total ${INR(open.reduce((a, r) => a + r.total, 0))}. Cash expected in the till: <b>${INR(exp)}</b>.</p>${cdDenGrid()}${pcFld('Cash counted (₹) — equals the denominations when they are filled', '<input id="cd_c" type="number" min="0" step="0.01">')}${pcFld('Reason, if the count differs', '<textarea id="cd_cr" rows="2"></textarea>')}<p class="small muted">After closing, receipts of the day cannot be cancelled. The handover to the collection executive is created automatically from this count.</p>`, `<button class="btn primary" data-act="cdkCloseOk">Close the day</button><button class="btn" data-act="closeModal">Cancel</button>`);
};
CD_ACT.cdkCloseOk = async () => {
  if (!cdCan('Add')) return; const { bid } = acBidSel(), raw = v('cd_c'); if (raw === '' || raw == null || !(+raw >= 0)) return toast('Enter the cash counted.', 'bad');
  const d = Store.clone(cdD()); if (cdClosedDay(d, bid, PROC_TODAY)) return toast('Already closed.', 'bad');
  const R = d.rc.filter(r => r.bid === bid && r.day === PROC_TODAY && r.st !== 'Cancelled'); if (R.some(r => r.st === 'Cancel requested')) return toast('Decide the pending cancellation request first.', 'bad');
  const den = cdDenRead(); if (den.t > 0 && Math.abs(den.t - cdR2(raw)) > 0.005) return toast(`The denominations add up to ${INR(den.t)} but the cash counted is ${INR(cdR2(raw))}.`, 'bad');
  const exp = cdR2(R.filter(r => r.mode === 'Cash').reduce((a, r) => a + r.total, 0)), counted = cdR2(raw), diff = cdR2(counted - exp), reason = (v('cd_cr') || '').trim();
  if (Math.abs(diff) > 0.005 && reason.length < 5) return toast('The count differs by ' + INR(diff) + '. Give a reason (at least 5 characters).', 'bad');
  const id = cdId('DC'); R.forEach(r => { r.closed = id; }); d.dc.unshift({ id, bid, day: PROC_TODAY, at: nowIso(), by: App.user.name, n: R.length, total: cdR2(R.reduce((a, r) => a + r.total, 0)), expected: exp, counted, diff, reason, state: 'Closed', verBy: '', den: den.o });
  cdLog(d, bid, 'Day closed', { old: `expected ${INR(exp)}`, new: `counted ${INR(counted)}` }, reason); await cdSave(d); cdAud('Day closed', { new: `${PROC_TODAY} ${counted}` }); const hv = typeof auAutoHandover === 'function' ? auAutoHandover(bid, counted, den.o) : null; closeModal(); toast(hv ? `Day closed. Handover ${hv.no} for ${INR(hv.amount)} created automatically; give the cash to the collection executive.` : 'Day closed. A different person confirms the count.', 'ok'); rerender();
};
CD_ACT.cdkVerify = async t => {
  if (!cdCan('Verify')) return; const d = Store.clone(cdD()), c = d.dc.find(x => x.id === t.dataset.k); if (!c || c.state !== 'Closed') return toast('Not waiting for a check.', 'bad'); if (c.by === App.user.name) return toast('You closed this day, so someone else must confirm it.', 'bad');
  c.state = 'Verified'; c.verBy = App.user.name; c.verAt = nowIso(); cdLog(d, c.bid, 'Day count confirmed', { new: `${c.day} ${INR(c.counted)}` }); await cdSave(d); toast('Confirmed.', 'ok'); rerender();
};
CD_ACT.cdkReopen = t => {
  if (!cdCan('Verify')) return; const c = cdD().dc.find(x => x.id === t.dataset.k); if (!c || c.state !== 'Closed') return;
  askReason('Reopen ' + c.day, 'Say why (at least 10 characters). The day can then be closed again.', async why => { if (why.length < 10) return toast('Give a reason (at least 10 characters).', 'bad'); const d = Store.clone(cdD()), x = d.dc.find(y => y.id === c.id); if (!x || x.state !== 'Closed') return toast('Cannot reopen.', 'bad'); x.state = 'Reopened'; x.reopenBy = App.user.name; d.rc.forEach(r => { if (r.closed === x.id) r.closed = ''; }); cdLog(d, x.bid, 'Day reopened', { old: x.day, new: 'Reopened' }, why); await cdSave(d); toast('Reopened.', 'ok'); rerender(); });
};

/* ===== sample data (only on request; every sample record is flagged and can be removed without touching real ones) ===== */
CD_ACT.cdkSample = async () => {
  if (!cdCan('Add')) return; const { bid } = acBidSel(), br = acBr(bid), d = Store.clone(cdD());
  if (d.rc.some(r => r.bid === bid && r.sample)) return toast('Sample data is already loaded for this branch.', 'bad');
  const stu = hsStuAll(bid).filter(s => cdBal(s, d).some(r => r.left > 1000)).slice(0, 14); if (stu.length < 4) return toast('This branch has too few students with fees due to build sample data.', 'bad');
  const modes = ['Cash', 'UPI', 'Cheque', 'Cash', 'Card', 'Bank transfer', 'Cash'], others = [null, null, { head: 'Transport fee', amt: 1500 }, { head: 'Library fine', amt: 60, note: 'late return' }, null, { head: 'Hostel fee', amt: 3000 }, { head: 'Uniform / books', amt: 2200 }];
  const mk = (s, day, i, by) => {
    const B = cdBal(s, d); const lines = []; const b0 = B.find(r => r.left > 100);
    if (b0 && i % 5 !== 4) { const a = Math.min(b0.left, [2500, 5000, 1200, 7500, 3000][i % 5]); lines.push({ head: b0.name, k: b0.k, amt: cdR2(a) }); }
    const o = others[i % others.length]; if (o && (lines.length === 0 || i % 2 === 0)) lines.push(Object.assign({ k: null }, o));
    if (!lines.length) return null;
    const n = (d.seq[bid] = (d.seq[bid] || 0) + 1), mode = modes[i % modes.length], total = cdR2(lines.reduce((a, l) => a + l.amt, 0));
    const rc = { id: cdId('CD'), no: `${br.code}/CD/${day.slice(2, 4)}${day.slice(5, 7)}/${String(n).padStart(4, '0')}`, bid, adm: s.adm, name: s.name, cls: s.cls + ' ' + (s.sec || ''), day, at: day + 'T11:' + String(10 + i).padStart(2, '0') + ':00+05:30', by, lines, total, mode, ref: mode === 'Cash' ? '' : mode === 'Cheque' ? '50' + String(1000 + n) : 'TXN' + (700000 + n * 37), payer: 'Parent of ' + s.name, st: 'Posted', closed: '', erpNo: '', sample: true };
    d.rc.unshift(rc); return rc;
  };
  const by = 'Sample Cashier', ver = 'Sample Principal'; let si = 0, ei = 0;
  for (let back = 5; back >= 1; back--) {
    const day = pcAddDays(PROC_TODAY, -back), R = []; for (let j = 0; j < 4; j++) { const r = mk(stu[(si++) % stu.length], day, si + back, by); if (r) R.push(r); }
    if (back === 4 && R[1]) { R[1].st = 'Cancelled'; R[1].cx = { by, at: R[1].at, reason: 'Sample: wrong student, re-issued', apprBy: ver, apprAt: R[1].at }; }
    if (back >= 3) R.filter(r => r.st === 'Posted').forEach(r => { r.erpNo = 'ERP-S-' + String(++ei).padStart(4, '0'); });
    const live = R.filter(r => r.st !== 'Cancelled'), exp = cdR2(live.filter(r => r.mode === 'Cash').reduce((a, r) => a + r.total, 0)), id = cdId('DC'), diff = back === 2 ? -100 : 0;
    live.forEach(r => { r.closed = id; }); R.forEach(r => { if (r.st === 'Cancelled') r.closed = id; });
    d.dc.unshift({ id, bid, day, at: day + 'T17:30:00+05:30', by, n: live.length, total: cdR2(live.reduce((a, r) => a + r.total, 0)), expected: exp, counted: cdR2(exp + diff), diff, reason: diff ? 'Sample: change given short at the counter' : '', state: back === 1 ? 'Closed' : 'Verified', verBy: back === 1 ? '' : ver, sample: true });
  }
  const T = []; for (let j = 0; j < 3; j++) { const r = mk(stu[(si++) % stu.length], PROC_TODAY, si, by); if (r) T.push(r); }
  if (T[1]) { T[1].st = 'Cancel requested'; T[1].cx = { by, at: nowIso(), reason: 'Sample: parent paid the wrong amount' }; }
  cdLog(d, bid, 'Sample data loaded', { new: `${d.rc.filter(r => r.sample && r.bid === bid).length} receipts` }); await cdSave(d); toast('Sample data loaded for this branch.', 'ok'); rerender();
};
CD_ACT.cdkSampleOff = () => {
  if (!cdCan('Approve')) return; const n = cdD().rc.filter(r => r.sample).length; if (!n) return;
  askReason('Remove all sample data', `This removes ${n} sample receipts and their day closings in every branch. Real receipts are not touched. Give a reason (at least 5 characters).`, async why => { if (why.length < 5) return toast('Give a reason (at least 5 characters).', 'bad'); const d = Store.clone(cdD()), m = d.rc.length; d.rc = d.rc.filter(r => !r.sample); d.dc = d.dc.filter(c => !c.sample); cdLog(d, '', 'Sample data removed', { old: `${m - d.rc.length} receipts`, new: 'Removed' }, why); await cdSave(d); toast('Sample data removed.', 'ok'); rerender(); });
};
