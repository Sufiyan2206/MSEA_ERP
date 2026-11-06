/* ===== Student certificates: ID cards, transfer certificates and bonafide certificates, each with a serial number and a QR that the Verify tab checks ===== */
const CT_ACT = {};
Store.init({ crt: { card: [], tc: [], bf: [], seq: { card: 0, tc: 0, bf: 0 }, log: [] } });
const ctD = () => Store.get('crt');
const ctCan = k => can('crt', k);
const ctSave = d => Store.put('crt', d);
const ctAud = (a, o) => audit('Certificates', a, o || {});
const ctId = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const CT_BF_PURPOSES = ['Bank account', 'Passport / visa', 'Scholarship', 'Bus / rail pass', 'Sports / competition', 'Address proof', 'Other'];
function ctLog(d, bid, action, o, reason) { const u = App.user || {}; d.log.unshift({ id: ctId('CL'), at: nowIso(), bid: bid || '', branch: (acBr(bid) || {}).name || '', user: u.name || '—', role: u.role || '', action, old: o && o.old != null ? String(o.old) : '', new: o && o.new != null ? String(o.new) : '', reason: reason || '' }); if (d.log.length > 3000) d.log.length = 3000; }
const ctStu = adm => DATA.students.find(s => s.adm === String(adm || '').trim());
const ctBid = s => DATA.branches[s.b].id;
function ctSig(kind, no, adm, day) { let h = 5381; const t = [kind, no, adm, day].join('|'); for (let i = 0; i < t.length; i++) h = ((h * 33) ^ t.charCodeAt(i)) >>> 0; return h.toString(36).toUpperCase().padStart(7, '0'); }
const ctPayload = (kind, r) => `MSEA-${kind}|${r.no}|${r.adm}|${r.day}|${ctSig(kind, r.no, r.adm, r.day)}`;
const ctYearEnd = () => CUR_AY.slice(0, 2) + CUR_AY.slice(5, 7) + '-03-31';
const ctLiveCard = (d, bid, adm) => d.card.find(c => c.bid === bid && c.adm === adm && c.st === 'Active');
/* no-dues clearance for a TC: fees, library, hostel, transport */
function ctClearance(s) {
  const bid = ctBid(s), out = [];
  const x = E.studentsAt(DATA, A, E.dn(PROC_TODAY))[DATA.students.indexOf(s)]; out.push({ k: 'Fees', ok: !x || x.os < 0.5, note: x && x.os >= 0.5 ? `Outstanding ${INR(x.os)}` : 'No fee balance' });
  try { const L = lbD(), m = { mtype: 'Student', id: s.adm }, du = lbDues(L, bid, m); out.push({ k: 'Library', ok: du.n === 0 && !(du.owed > 0), note: du.n ? `${du.n} book(s) not returned` : du.owed > 0 ? `Fine ${INR(du.owed)} due` : 'Clear' }); } catch (e) { out.push({ k: 'Library', ok: true, note: 'Clear' }); }
  try { const h = hmD().al.some(a => a.bid === bid && a.adm === s.adm && hmLiveAl(a)); out.push({ k: 'Hostel', ok: !h, note: h ? 'Hostel bed still allotted' : 'Clear' }); } catch (e) { out.push({ k: 'Hostel', ok: true, note: 'Clear' }); }
  try { const t = tnD().al.some(a => a.bid === bid && a.adm === s.adm && tnLiveAl(a)); out.push({ k: 'Transport', ok: !t, note: t ? 'Transport seat still allotted' : 'Clear' }); } catch (e) { out.push({ k: 'Transport', ok: true, note: 'Clear' }); }
  return out;
}
PAGES.certs = { title: 'Certificates & ID cards', mod: 'crt', sf: true, render() {
  const d = ctD(), { bid, list } = acBidSel(); if (!list.length) return empty('No branches in your scope for these filters.');
  const tab = pcTab('ct', 'id'), mine = App.user.name, TC = d.tc.filter(t => t.bid === bid), BF = d.bf.filter(b => b.bid === bid), CD = d.card.filter(c => c.bid === bid);
  const tabs = pcTabs('ct', [['id', 'ID cards', CD.filter(c => c.st === 'Active').length || ''], ['tc', 'Transfer certificates', TC.filter(t => ['Requested', 'Cleared'].includes(t.st)).length || ''], ['bf', 'Bonafide certificates', BF.filter(b => b.st === 'Requested').length || ''], ['vr', 'Verify'], ...(ctCan('View audit logs') ? [['log', 'Audit trail']] : [])], 'id');
  const bsel = `<label class="fld"><span>Branch</span><select data-act="uiSel" data-k="acBid">${list.map(b => `<option value="${esc(b.id)}" ${b.id === bid ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select></label>`;
  const act = (id, a, l, cls) => `<button class="btn sm ${cls || ''}" data-act="${a}" data-k="${esc(id)}">${l}</button>`;
  let body = '';
  if (tab === 'id') {
    const secs = acSections(bid), key = App.ui.ctSec || (secs[0] ? secs[0].cls + '|' + secs[0].sec : ''), [cls, sec] = key.split('|');
    const R = hsStuAll(bid).filter(s => s.cls === cls && (s.sec || '') === (sec || '')).sort((a, b) => a.name.localeCompare(b.name)).map(s => ({ s, c: ctLiveCard(d, bid, s.adm) })), missing = R.filter(r => !r.c).length;
    body = `<div class="ctrls">${bsel}<label class="fld"><span>Class / section</span><select data-act="uiSel" data-k="ctSec">${secs.map(x => `<option value="${esc(x.cls + '|' + x.sec)}" ${x.cls + '|' + x.sec === key ? 'selected' : ''}>${esc(x.cls + ' ' + x.sec)}</option>`).join('')}</select></label>${ctCan('Add') && missing ? `<button class="btn pri" data-act="ctCardBatch" data-k="${esc(key)}">Issue ${missing} missing card(s)</button>` : ''}</div>` +
      table('ct_cards', [{ h: 'Student', t: 'text', k: r => `${r.s.name} (${r.s.adm})` }, { h: 'Card no.', t: 'text', k: r => r.c ? r.c.no : '' }, { h: 'Issued', t: 'text', k: r => r.c ? r.c.day : '' }, { h: 'Valid to', t: 'text', k: r => r.c ? r.c.to : '' }, { h: 'Status', t: 'text', k: r => r.c ? r.c.st : 'No card' }, { h: '', t: 'html', k: r => r.c ? act(r.c.id, 'ctCardPdf', 'Card (PDF)') + (ctCan('Add') ? act(r.c.id, 'ctCardLost', 'Lost / damaged', 'danger') : '') : '' }], R, { empty: 'No active students in this section.', noexp: true, title: `ID cards · ${cls} ${sec || ''}` }) +
      (CD.some(c => c.st !== 'Active') ? `<details><summary class="small">Cards cancelled or replaced (${CD.filter(c => c.st !== 'Active').length})</summary>${table('ct_old', [{ h: 'Card no.', t: 'text', k: c => c.no }, { h: 'Student', t: 'text', k: c => `${c.name} (${c.adm})` }, { h: 'Status', t: 'text', k: c => c.st }, { h: 'Reason', t: 'text', k: c => c.note || '' }], CD.filter(c => c.st !== 'Active'), { noexp: true })}</details>` : '');
  } else if (tab === 'tc') {
    const cols = [{ h: 'TC no.', t: 'text', k: t => t.no || '—' }, { h: 'Student', t: 'text', k: t => `${t.name} (${t.adm})` }, { h: 'Class', t: 'text', k: t => t.cls }, { h: 'Leaving on', t: 'text', k: t => t.leave }, { h: 'Reason', t: 'text', k: t => t.reason }, { h: 'Clearance', t: 'html', k: t => t.clr.map(c => pill(c.k, c.ok ? 'g' : t.ov && t.ov[c.k] ? 'a' : 'r')).join(' ') }, { h: 'Status', t: 'text', k: t => t.st },
      { h: '', t: 'html', k: t => [t.st === 'Requested' && ctCan('Approve') && t.by !== mine ? act(t.id, 'ctTcClear', 'Clear & approve') + act(t.id, 'ctTcNo', 'Reject') : '', t.st === 'Cleared' && ctCan('Add') ? act(t.id, 'ctTcIssue', 'Issue TC') : '', t.st === 'Issued' ? act(t.id, 'ctTcPdf', 'TC (PDF)') : ''].join(' ') }];
    body = `<div class="ctrls">${bsel}${ctCan('Add') ? '<button class="btn pri" data-act="ctTcForm">Request a TC</button>' : ''}</div>` + table('ct_tc', cols, TC.sort((a, b) => b.at.localeCompare(a.at)), { empty: 'No transfer certificates requested.', noexp: true, title: 'Transfer certificates' }) + `<div class="note">A TC is requested only for a student whose cancellation or withdrawal has been approved under Approvals. All four clearances (fees, library, hostel, transport) must be clear; a Principal can override one with a reason, which is printed on the TC. The serial number is given at issue and never reused.</div>`;
  } else if (tab === 'bf') {
    const cols = [{ h: 'Cert. no.', t: 'text', k: b => b.no || '—' }, { h: 'Student', t: 'text', k: b => `${b.name} (${b.adm})` }, { h: 'Purpose', t: 'text', k: b => b.purpose + (b.note ? ' – ' + b.note : '') }, { h: 'Requested by', t: 'text', k: b => b.by }, { h: 'Status', t: 'text', k: b => b.st }, { h: '', t: 'html', k: b => [b.st === 'Requested' && ctCan('Add') ? act(b.id, 'ctBfIssue', 'Issue') + act(b.id, 'ctBfNo', 'Decline') : '', b.st === 'Issued' ? act(b.id, 'ctBfPdf', 'Certificate (PDF)') : ''].join(' ') }];
    body = `<div class="ctrls">${bsel}${ctCan('Add') ? '<button class="btn pri" data-act="ctBfForm">New bonafide request</button>' : ''}</div>` + table('ct_bf', cols, BF.sort((a, b) => b.at.localeCompare(a.at)), { empty: 'No bonafide certificates requested. Families can also request one from the Parent & Student app.', noexp: true, title: 'Bonafide certificates' });
  } else if (tab === 'vr') {
    const vr = App.ui.ctVr;
    body = `<div class="ctrls"><label class="fld"><span>Serial number, or the text read from the QR on the card or certificate</span><input id="ct_in" value="${esc(App.ui.ctVrIn || '')}" placeholder="e.g. B06/TC/2026/0001"></label><button class="btn pri" data-act="ctVerify">Check</button></div>` + (vr ? `<div class="note" style="border-left:4px solid ${vr.ok ? '#15803d' : '#b91c1c'}"><b>${esc(vr.title)}</b><br>${esc(vr.msg)}</div>` : '');
  } else if (tab === 'log') {
    body = table('ct_log', [{ h: 'When', t: 'text', k: l => tsLabel(l.at) }, { h: 'User', t: 'text', k: l => l.user }, { h: 'Action', t: 'text', k: l => l.action }, { h: 'Detail', t: 'text', k: l => l.new }, { h: 'Reason', t: 'text', k: l => l.reason }], d.log.filter(l => l.bid === bid), { empty: 'Nothing recorded yet.' });
  }
  return card('Certificates & ID cards', tabs + body, { sub: 'Every card and certificate carries a serial number and a QR code. The Verify tab checks them against the register.' });
} };
/* ---- ID cards ---- */
function ctNewCard(d, s) { const bid = ctBid(s), br = acBr(bid); d.seq.card++; const c = { id: ctId('IC'), no: `${br.code}/ID/${CUR_AY.slice(2, 4)}/${String(d.seq.card).padStart(5, '0')}`, bid, adm: s.adm, name: s.name, cls: s.cls + ' ' + (s.sec || ''), day: PROC_TODAY, to: ctYearEnd(), st: 'Active', by: App.user.name, at: nowIso() }; d.card.unshift(c); return c; }
CT_ACT.ctCardBatch = t => {
  if (!ctCan('Add')) return; const { bid } = acBidSel(), [cls, sec] = t.dataset.k.split('|'), d0 = ctD(), S = hsStuAll(bid).filter(s => s.cls === cls && (s.sec || '') === (sec || '') && !ctLiveCard(d0, bid, s.adm)); if (!S.length) return toast('Every student here has a card.', 'bad');
  askReason(`Issue ${S.length} ID cards for ${cls} ${sec || ''}`, 'Note for the record (at least 3 characters).', async why => { if (why.length < 3) return toast('Give a note.', 'bad'); const d = Store.clone(ctD()); let n = 0; S.forEach(s => { if (!ctLiveCard(d, bid, s.adm)) { ctNewCard(d, s); n++; } }); ctLog(d, bid, 'ID cards issued', { new: `${cls} ${sec || ''} · ${n}` }, why); await ctSave(d); ctAud('ID cards issued', { new: `${bid} ${n}` }); toast(`${n} cards issued.`); rerender(); });
};
CT_ACT.ctCardLost = t => {
  const c = ctD().card.find(x => x.id === t.dataset.k); if (!c || c.st !== 'Active' || !ctCan('Add')) return;
  askReason('Cancel card ' + c.no, 'Lost, stolen or damaged? Say what happened (at least 5 characters). A replacement card is issued with a new number and the old number stops verifying.', async why => { if (why.length < 5) return toast('Say what happened.', 'bad'); const d = Store.clone(ctD()), x = d.card.find(y => y.id === c.id); if (!x || x.st !== 'Active') return; x.st = 'Replaced'; x.note = why; x.endAt = nowIso(); const s = ctStu(x.adm); const nc = ctNewCard(d, s); nc.replaces = x.no; ctLog(d, x.bid, 'ID card replaced', { old: x.no, new: nc.no }, why); await ctSave(d); ctAud('ID card replaced', { old: x.no, new: nc.no }); toast(`Replacement ${nc.no} issued.`); rerender(); });
};
CT_ACT.ctCardPdf = t => {
  const c = ctD().card.find(x => x.id === t.dataset.k); if (!c) return; if (!window.jspdf) return toast('The PDF library did not load.', 'bad');
  const br = acBr(c.bid) || {}, p = sisP(c.adm), doc = new window.jspdf.jsPDF({ unit: 'pt', format: [243, 153], orientation: 'landscape' });
  doc.setFillColor(31, 27, 77); doc.rect(0, 0, 243, 34, 'F'); doc.setTextColor(255); doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.text('MS Education Academy', 10, 14); doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.text(String(br.name || ''), 10, 25);
  doc.setTextColor(0); doc.setDrawColor(180); doc.rect(10, 44, 48, 58); if (p.photo) { try { doc.addImage(p.photo, 'JPEG', 10.5, 44.5, 47, 57); } catch (e) { doc.setFontSize(6); doc.text('PHOTO', 26, 76); } } else { doc.setFontSize(6); doc.text('PHOTO', 26, 76); }
  doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.text(String(c.name), 66, 54, { maxWidth: 116 }); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
  [['Class', c.cls], ['Adm. no.', c.adm], ['DOB', p.dob || '—'], ['Blood group', p.bloodGroup || '—'], ['Parent', (p.fatherName || p.motherName || '') || '—'], ['Emergency', p.emMobile || '—']].forEach(([k, v2], i) => { doc.text(k + ':', 66, 66 + i * 9); doc.text(String(v2), 108, 66 + i * 9); });
  try { rfQrPdf(doc, ctPayload('ID', c), 188, 44, 46); } catch (e) { }
  doc.setFontSize(6); doc.text(`${c.no} · valid to ${c.to}`, 10, 142); doc.text('If found, please return to the school office.', 10, 149);
  saveFile(`id-card-${c.adm}.pdf`, doc.output('blob'));
};
/* ---- transfer certificates ---- */
CT_ACT.ctTcForm = () => { if (!ctCan('Add')) return; modal('Request a transfer certificate', `<div class="form-grid"><label class="fld"><span>Admission no.</span><input id="tc_a"></label><label class="fld"><span>Last day at school</span><input id="tc_d" type="date" value="${PROC_TODAY}"></label></div><label class="fld"><span>Reason for leaving (as it will print)</span><input id="tc_r"></label><label class="fld"><span>Conduct remark</span><select id="tc_c"><option>Good</option><option>Satisfactory</option><option>Excellent</option></select></label>`, `<button class="btn pri" data-act="ctTcReq">Check clearance and request</button>`, true); };
CT_ACT.ctTcReq = async () => {
  if (!ctCan('Add')) return; const s = ctStu(v('tc_a')); if (!s) return toast('No learner with that admission number.', 'bad'); const bid = ctBid(s), { list } = acBidSel(); if (!list.some(b => b.id === bid)) return toast('This learner is outside your branch scope.', 'bad');
  if (!s.exit) return toast('No approved cancellation or withdrawal for this student. Raise it under Approvals first.', 'bad');
  const reason = (v('tc_r') || '').trim(), leave = v('tc_d'); if (reason.length < 5) return toast('Give the reason for leaving.', 'bad'); if (!leave) return toast('Choose the last day.', 'bad');
  const d = Store.clone(ctD()); if (d.tc.some(t => t.adm === s.adm && !['Rejected'].includes(t.st))) return toast('A TC already exists for this student.', 'bad');
  const clr = ctClearance(s); d.tc.unshift({ id: ctId('TC'), no: '', bid, adm: s.adm, name: s.name, cls: s.cls + ' ' + (s.sec || ''), leave, reason, conduct: v('tc_c'), clr, ov: {}, st: 'Requested', by: App.user.name, at: nowIso() });
  ctLog(d, bid, 'TC requested', { new: `${s.adm} · ${clr.filter(c => !c.ok).length} clearance(s) pending` }, reason); await ctSave(d); closeModal(); toast(clr.every(c => c.ok) ? 'All clearances are clear. Waiting for approval.' : `Requested. ${clr.filter(c => !c.ok).map(c => c.k).join(', ')} not clear.`); rerender();
};
const ctTc = t => ctD().tc.find(x => x.id === t.dataset.k);
CT_ACT.ctTcClear = t => {
  const x = ctTc(t); if (!x || x.st !== 'Requested' || !ctCan('Approve')) return; if (x.by === App.user.name) return toast('You requested this TC, so someone else must approve it.', 'bad');
  const s = ctStu(x.adm), clr = ctClearance(s), bad = clr.filter(c => !c.ok);
  const body = `<p class="small">${esc(x.name)} (${esc(x.adm)}) · leaving ${esc(x.leave)}</p>` + table('tc_clr', [{ h: 'Clearance', t: 'text', k: c => c.k }, { h: 'State', t: 'html', k: c => pill(c.ok ? 'Clear' : 'Not clear', c.ok ? 'g' : 'r') }, { h: 'Detail', t: 'text', k: c => c.note }], clr, { noexp: true }) + (bad.length ? `<label class="chk big"><input type="checkbox" id="tc_ov"> Override the pending clearance(s) – printed on the TC</label><label class="fld"><span>Override reason (at least 10 characters)</span><input id="tc_ovr"></label>` : '');
  modal('Clear and approve TC', body, `<button class="btn pri" data-act="ctTcClearOk" data-k="${x.id}">Approve</button>`, true);
};
CT_ACT.ctTcClearOk = async t => {
  const x = ctTc(t); if (!x || x.st !== 'Requested' || !ctCan('Approve') || x.by === App.user.name) return; const clr = ctClearance(ctStu(x.adm)), bad = clr.filter(c => !c.ok); let ov = {};
  if (bad.length) { const on = document.getElementById('tc_ov'), r = (v('tc_ovr') || '').trim(); if (!on || !on.checked) return toast(`${bad.map(c => c.k).join(', ')} not clear. Settle them or tick the override.`, 'bad'); if (r.length < 10) return toast('Give the override reason (at least 10 characters).', 'bad'); bad.forEach(c => { ov[c.k] = r; }); }
  const d = Store.clone(ctD()), y = d.tc.find(z => z.id === x.id); y.clr = clr; y.ov = ov; y.st = 'Cleared'; y.apBy = App.user.name; y.apAt = nowIso(); ctLog(d, y.bid, 'TC cleared and approved', { new: `${y.adm}${bad.length ? ' · override: ' + bad.map(c => c.k).join(', ') : ''}` }, Object.values(ov)[0] || ''); await ctSave(d); ctAud('TC approved', { new: y.adm }); closeModal(); toast('Approved. The counter can now issue the TC.'); rerender();
};
CT_ACT.ctTcNo = t => { const x = ctTc(t); if (!x || x.st !== 'Requested' || !ctCan('Approve') || x.by === App.user.name) return; askReason('Reject TC request', 'Say why (at least 5 characters).', async why => { if (why.length < 5) return toast('Give a reason.', 'bad'); const d = Store.clone(ctD()), y = d.tc.find(z => z.id === x.id); if (!y || y.st !== 'Requested') return; y.st = 'Rejected'; y.note = why; ctLog(d, y.bid, 'TC rejected', { new: y.adm }, why); await ctSave(d); toast('Rejected.'); rerender(); }); };
CT_ACT.ctTcIssue = t => {
  const x = ctTc(t); if (!x || x.st !== 'Cleared' || !ctCan('Add')) return;
  askReason('Issue TC for ' + x.name, 'Confirm the certificate is being handed over (at least 3 characters). A serial number is assigned now.', async why => { if (why.length < 3) return toast('Give a note.', 'bad'); const d = Store.clone(ctD()), y = d.tc.find(z => z.id === x.id); if (!y || y.st !== 'Cleared') return toast('Already issued.', 'bad'); const br = acBr(y.bid); d.seq.tc++; y.no = `${br.code}/TC/${PROC_TODAY.slice(0, 4)}/${String(d.seq.tc).padStart(4, '0')}`; y.day = PROC_TODAY; y.st = 'Issued'; y.issBy = App.user.name; const c = ctLiveCard(d, y.bid, y.adm); if (c) { c.st = 'Cancelled'; c.note = 'Student left: ' + y.no; } ctLog(d, y.bid, 'TC issued', { new: y.no }, why); await ctSave(d); ctAud('TC issued', { new: y.no }); toast(`${y.no} issued.`); rerender(); CT_ACT.ctTcPdf({ dataset: { k: y.id } }); });
};
CT_ACT.ctTcPdf = t => {
  const x = ctTc(t); if (!x || x.st !== 'Issued') return; if (!window.jspdf) return toast('The PDF library did not load.', 'bad');
  const br = acBr(x.bid) || {}, p = sisP(x.adm), s = ctStu(x.adm) || {}, doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'a4' }); let y = 60;
  const L = (txt, o = {}) => { doc.setFontSize(o.sz || 11); doc.setFont('helvetica', o.b ? 'bold' : 'normal'); doc.text(String(txt), o.x || 60, y, o.align ? { align: o.align } : undefined); y += o.dy || 20; };
  L('MS Education Academy', { sz: 16, b: 1, x: 297, align: 'center', dy: 18 }); L(br.name || '', { x: 297, align: 'center', dy: 30 }); L('TRANSFER CERTIFICATE', { sz: 14, b: 1, x: 297, align: 'center', dy: 30 });
  L('TC no.: ' + x.no, { dy: 0 }); doc.text('Date: ' + x.day, 400, y); y += 28;
  const rows = [['Name of the student', x.name], ['Admission number', x.adm], ['Father / mother', [p.fatherName, p.motherName].filter(Boolean).join(' / ') || '—'], ['Date of birth', p.dob || '—'], ['Class at the time of leaving', x.cls], ['Date of admission', s.join ? E.ds(s.join) : '—'], ['Last day at school', x.leave], ['Reason for leaving', x.reason], ['Conduct', x.conduct], ['Dues', Object.keys(x.ov).length ? 'Pending, released by ' + x.apBy + ': ' + Object.values(x.ov)[0] : 'All dues cleared']];
  rows.forEach(([k, v2], i) => { doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.text(`${i + 1}. ${k}`, 60, y); doc.setFont('helvetica', 'bold'); doc.text(String(v2), 300, y, { maxWidth: 240 }); y += 24; });
  y += 20; L('Certified that the above particulars are correct as per the school records.', { sz: 10, dy: 50 }); L('Principal', { b: 1, x: 420 });
  try { rfQrPdf(doc, ctPayload('TC', x), 60, y + 10, 70); } catch (e) { } doc.setFontSize(8); doc.text('Scan or enter the TC number on the school verification screen.', 140, y + 45);
  saveFile(`tc-${x.adm}.pdf`, doc.output('blob'));
};
/* ---- bonafide certificates ---- */
function ctBfNew(s, purpose, note, by) {
  if (!CT_BF_PURPOSES.includes(purpose)) return 'Choose the purpose.'; if (purpose === 'Other' && (note || '').trim().length < 5) return 'Say what the certificate is for.';
  const d = Store.clone(ctD()), bid = ctBid(s); if (d.bf.some(b => b.adm === s.adm && b.st === 'Requested')) return 'A request is already waiting for this student.';
  d.bf.unshift({ id: ctId('BF'), no: '', bid, adm: s.adm, name: s.name, cls: s.cls + ' ' + (s.sec || ''), purpose, note: (note || '').trim(), st: 'Requested', by: by || App.user.name, byId: App.user.id, at: nowIso() }); ctLog(d, bid, 'Bonafide requested', { new: `${s.adm} · ${purpose}` }, note); ctSave(d); return '';
}
CT_ACT.ctBfForm = () => { if (!ctCan('Add')) return; modal('New bonafide request', `<div class="form-grid"><label class="fld"><span>Admission no.</span><input id="bf_a"></label><label class="fld"><span>Purpose</span><select id="bf_p">${CT_BF_PURPOSES.map(x => `<option>${x}</option>`).join('')}</select></label></div><label class="fld"><span>Note (for Other, or an addressee)</span><input id="bf_n"></label>`, `<button class="btn pri" data-act="ctBfReq">Request</button>`); };
CT_ACT.ctBfReq = () => { if (!ctCan('Add')) return; const s = ctStu(v('bf_a')); if (!s) return toast('No learner with that admission number.', 'bad'); const { list } = acBidSel(); if (!list.some(b => b.id === ctBid(s))) return toast('This learner is outside your branch scope.', 'bad'); const e = ctBfNew(s, v('bf_p'), v('bf_n')); if (e) return toast(e, 'bad'); closeModal(); toast('Requested.'); rerender(); };
const ctBf = t => ctD().bf.find(x => x.id === t.dataset.k);
CT_ACT.ctBfIssue = t => {
  const x = ctBf(t); if (!x || x.st !== 'Requested' || !ctCan('Add')) return; const s = ctStu(x.adm); if (!s || s.exit) return toast('Only a current student gets a bonafide certificate.', 'bad');
  askReason('Issue bonafide certificate', 'Note for the record (at least 3 characters). A serial number is assigned now.', async why => { if (why.length < 3) return toast('Give a note.', 'bad'); const d = Store.clone(ctD()), y = d.bf.find(z => z.id === x.id); if (!y || y.st !== 'Requested') return toast('Already decided.', 'bad'); const br = acBr(y.bid); d.seq.bf++; y.no = `${br.code}/BF/${PROC_TODAY.slice(0, 4)}/${String(d.seq.bf).padStart(4, '0')}`; y.day = PROC_TODAY; y.st = 'Issued'; y.issBy = App.user.name; ctLog(d, y.bid, 'Bonafide issued', { new: y.no }, why); await ctSave(d); ctAud('Bonafide issued', { new: y.no }); toast(`${y.no} issued.`); rerender(); CT_ACT.ctBfPdf({ dataset: { k: y.id } }); });
};
CT_ACT.ctBfNo = t => { const x = ctBf(t); if (!x || x.st !== 'Requested' || !ctCan('Add')) return; askReason('Decline request', 'Say why (at least 5 characters).', async why => { if (why.length < 5) return toast('Give a reason.', 'bad'); const d = Store.clone(ctD()), y = d.bf.find(z => z.id === x.id); if (!y || y.st !== 'Requested') return; y.st = 'Declined'; y.note2 = why; ctLog(d, y.bid, 'Bonafide declined', { new: y.adm }, why); await ctSave(d); toast('Declined.'); rerender(); }); };
CT_ACT.ctBfPdf = t => {
  const x = ctBf(t); if (!x || x.st !== 'Issued') return; if (!window.jspdf) return toast('The PDF library did not load.', 'bad');
  const br = acBr(x.bid) || {}, p = sisP(x.adm), doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'a4' }); let y = 60;
  const L = (txt, o = {}) => { doc.setFontSize(o.sz || 11); doc.setFont('helvetica', o.b ? 'bold' : 'normal'); doc.text(String(txt), o.x || 60, y, Object.assign({ maxWidth: 475 }, o.align ? { align: o.align } : {})); y += o.dy || 20; };
  L('MS Education Academy', { sz: 16, b: 1, x: 297, align: 'center', dy: 18 }); L(br.name || '', { x: 297, align: 'center', dy: 30 }); L('BONAFIDE CERTIFICATE', { sz: 14, b: 1, x: 297, align: 'center', dy: 30 });
  L('Certificate no.: ' + x.no, { dy: 0 }); doc.text('Date: ' + x.day, 400, y); y += 36;
  L(`This is to certify that ${x.name}, ${p.fatherName ? 'son/daughter of ' + p.fatherName + ', ' : ''}admission number ${x.adm}, is a bonafide student of this school studying in Class ${x.cls} during the academic year ${CUR_AY}.${p.dob ? ' The date of birth as per school records is ' + p.dob + '.' : ''}`, { dy: 60 });
  L(`This certificate is issued on the request of the parent for the purpose of ${x.purpose.toLowerCase()}${x.note ? ' (' + x.note + ')' : ''}.`, { dy: 70 });
  L('Principal', { b: 1, x: 420 }); try { rfQrPdf(doc, ctPayload('BF', x), 60, y + 10, 70); } catch (e) { } doc.setFontSize(8); doc.text('Scan or enter the certificate number on the school verification screen.', 140, y + 45);
  saveFile(`bonafide-${x.adm}.pdf`, doc.output('blob'));
};
/* ---- verify ---- */
CT_ACT.ctVerify = () => {
  const raw = (v('ct_in') || '').trim(); App.ui.ctVrIn = raw; const d = ctD(); let kind = '', no = raw, sig = '', admP = '', dayP = '';
  if (/^MSEA-(ID|TC|BF)\|/.test(raw)) { const q = raw.split('|'); kind = q[0].slice(5); no = q[1]; admP = q[2] || ''; dayP = q[3] || ''; sig = q[4] || ''; }
  const find = (arr, k) => { const r = arr.find(x => x.no === no); return r ? { r, k } : null; };
  const hit = (kind === 'ID' || !kind) && find(d.card, 'ID') || (kind === 'TC' || !kind) && find(d.tc.filter(x => x.no), 'TC') || (kind === 'BF' || !kind) && find(d.bf.filter(x => x.no), 'BF');
  if (!no) App.ui.ctVr = { ok: false, title: 'Nothing to check', msg: 'Type a serial number or paste the QR text.' };
  else if (!hit) App.ui.ctVr = { ok: false, title: 'Not found', msg: `No card or certificate ${no} exists in the register. Treat it as not genuine.` };
  else if (sig && (sig !== ctSig(hit.k, hit.r.no, hit.r.adm, hit.r.day) || admP !== hit.r.adm || dayP !== hit.r.day)) App.ui.ctVr = { ok: false, title: 'Does not match', msg: `${no} exists, but the details on the document differ from the register. Treat as altered.` };
  else { const r = hit.r, lbl = { ID: 'ID card', TC: 'Transfer certificate', BF: 'Bonafide certificate' }[hit.k], live = hit.k === 'ID' ? r.st === 'Active' && r.to >= PROC_TODAY : r.st === 'Issued'; App.ui.ctVr = { ok: live, title: live ? `Genuine ${lbl}` : `${lbl} is ${hit.k === 'ID' && r.st === 'Active' ? 'expired' : r.st.toLowerCase()}`, msg: `${r.no} · ${r.name} (${r.adm}) · ${r.cls} · issued ${r.day}${hit.k === 'ID' ? ' · valid to ' + r.to : ''}${r.replaces ? ' · replaces ' + r.replaces : ''}` }; }
  rerender();
};
