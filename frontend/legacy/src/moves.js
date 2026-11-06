/* ===== Student moves: section change, class change and inter-branch transfer with maker-checker. Approved moves are applied on top of the ERP data from their effective date; the ERP record itself is not edited. ===== */
const SX_ACT = {};
Store.init({ smv: { mv: [], seq: 0, log: [] } });
const sxD = () => Store.get('smv');
const sxCan = k => can('smv', k);
const sxSave = d => Store.put('smv', d);
const sxAud = (a, o) => audit('Student moves', a, o || {});
const sxId = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const SX_TYPES = ['Section change', 'Class change', 'Branch transfer'];
function sxLog(d, bid, action, o, reason) { const u = App.user || {}; d.log.unshift({ id: sxId('XL'), at: nowIso(), bid: bid || '', branch: (acBr(bid) || {}).name || '', user: u.name || '—', role: u.role || '', action, old: o && o.old != null ? String(o.old) : '', new: o && o.new != null ? String(o.new) : '', reason: reason || '' }); if (d.log.length > 3000) d.log.length = 3000; }
const sxStu = adm => DATA.students.find(s => s.adm === String(adm || '').trim());
const sxBid = s => DATA.branches[s.b].id;
const sxOpen = m => m.st === 'Requested' || (m.st === 'Approved' && m.eff > PROC_TODAY);
const sxInScope = bid => { try { return scopeOf(App.user).has(DATA.branches.findIndex(b => b.id === bid)); } catch (e) { return false; } };
/* who may decide: section and class changes by an approver of the student's branch; a branch transfer by an approver of the receiving branch; never the requester */
const sxMayDecide = m => sxCan('Approve') && m.by !== (App.user || {}).name && sxInScope(m.type === 'Branch transfer' ? m.toBid : m.bid);
/* apply approved moves whose effective date has come, in date order, on top of the ERP data */
function applyMoves() {
  DATA.students.forEach(s => { if (s._mv0) { s.b = s._mv0.b; s.cls = s._mv0.cls; s.sec = s._mv0.sec; delete s._mv0; } });
  const today = E.ds(DATA.TODAY), L = (Store.get('smv') || { mv: [] }).mv.filter(m => m.st === 'Approved' && m.eff <= today).sort((a, b) => a.eff.localeCompare(b.eff) || a.at.localeCompare(b.at));
  L.forEach(m => { const s = DATA.students.find(x => x.adm === m.adm); if (!s) return; if (!s._mv0) s._mv0 = { b: s.b, cls: s.cls, sec: s.sec }; if (m.type === 'Branch transfer') { const bi = DATA.branches.findIndex(b => b.id === m.toBid); if (bi < 0) return; s.b = bi; } s.cls = m.toCls; s.sec = m.toSec; });
  try { MEMO.clear(); } catch (e) { }
}
PAGES.moves = { title: 'Student moves', mod: 'smv', sf: true, render() {
  const d = sxD(), { bid, list } = acBidSel(); if (!list.length) return empty('No branches in your scope for these filters.');
  const tab = pcTab('sx', 'pend'), mine = App.user.name, M = d.mv.filter(m => m.bid === bid || m.toBid === bid).sort((a, b) => b.at.localeCompare(a.at)), pend = M.filter(m => m.st === 'Requested'), waiting = pend.filter(sxMayDecide);
  const tabs = pcTabs('sx', [['pend', 'Waiting', pend.length || ''], ['all', 'All moves', M.length], ...(sxCan('View audit logs') ? [['log', 'Audit trail']] : [])], 'pend');
  const bsel = `<div class="ctrls"><label class="fld"><span>Branch</span><select data-act="uiSel" data-k="acBid">${list.map(b => `<option value="${esc(b.id)}" ${b.id === bid ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select></label>${sxCan('Add') ? '<button class="btn pri" data-act="sxForm">Request a move</button>' : ''}</div>`;
  const act = (id, a, l, cls) => `<button class="btn sm ${cls || ''}" data-act="${a}" data-k="${esc(id)}">${l}</button>`;
  const cols = [{ h: 'Student', t: 'text', k: m => `${m.name} (${m.adm})` }, { h: 'Type', t: 'text', k: m => m.type }, { h: 'From', t: 'text', k: m => `${m.type === 'Branch transfer' ? (acBr(m.bid) || {}).name + ' · ' : ''}${m.fromCls} ${m.fromSec}` }, { h: 'To', t: 'text', k: m => `${m.type === 'Branch transfer' ? (acBr(m.toBid) || {}).name + ' · ' : ''}${m.toCls} ${m.toSec}` }, { h: 'Effective', t: 'text', k: m => m.eff }, { h: 'Reason', t: 'text', k: m => m.reason }, { h: 'Requested by', t: 'text', k: m => m.by }, { h: 'Status', t: 'text', k: m => m.st + (m.st === 'Approved' && m.eff > PROC_TODAY ? ' (from ' + m.eff + ')' : '') + (m.apBy ? ' · ' + m.apBy : '') },
    { h: '', t: 'html', k: m => [m.st === 'Requested' && sxMayDecide(m) ? act(m.id, 'sxOk', m.type === 'Branch transfer' ? 'Accept transfer' : 'Approve') + act(m.id, 'sxNo', 'Reject') : '', m.st === 'Requested' && m.by === mine ? act(m.id, 'sxCx', 'Withdraw') : '', m.st === 'Approved' && m.eff > PROC_TODAY && sxCan('Approve') ? act(m.id, 'sxCx', 'Cancel before effect') : ''].join(' ') }];
  let body = '';
  if (tab === 'pend') body = bsel + (waiting.length ? `<div class="note">${waiting.length} move(s) waiting for your decision.</div>` : '') + table('sx_p', cols, pend, { empty: 'Nothing is waiting.', noexp: true, title: 'Waiting for decision' }) + `<div class="note">A section or class change is approved by the Principal of the student's branch. A branch transfer is requested by the sending branch and accepted by the Principal of the receiving branch, who takes the student's fee ledger as it stands. The person who raised a move cannot decide it. Attendance already marked stays with the old section; new marks go to the new one.</div>`;
  else if (tab === 'all') body = bsel + table('sx_a', cols, M, { empty: 'No moves recorded for this branch.', title: 'All moves' });
  else if (tab === 'log') body = table('sx_log', [{ h: 'When', t: 'text', k: l => tsLabel(l.at) }, { h: 'User', t: 'text', k: l => l.user }, { h: 'Action', t: 'text', k: l => l.action }, { h: 'Detail', t: 'text', k: l => l.new }, { h: 'Reason', t: 'text', k: l => l.reason }], d.log.filter(l => l.bid === bid), { empty: 'Nothing recorded yet.' });
  return card('Student moves', tabs + body, { sub: 'Section change, class change and branch transfer, each needing a second person. The ERP record is not edited; the move is applied on top from its effective date.' });
} };
SX_ACT.sxForm = () => {
  if (!sxCan('Add')) return; const { list } = acBidSel();
  modal('Request a move', `<div class="form-grid"><label class="fld"><span>Admission no.</span><input id="sx_a" data-act="sxPick"></label><label class="fld"><span>Type</span><select id="sx_t" data-act="sxPick">${SX_TYPES.map(t => `<option>${t}</option>`).join('')}</select></label><label class="fld"><span>Effective from</span><input id="sx_e" type="date" value="${PROC_TODAY}"></label></div><div id="sx_tgt"><p class="small muted">Enter the admission number to see the current class and the targets.</p></div><label class="fld"><span>Reason (at least 10 characters)</span><input id="sx_r"></label>`, `<button class="btn" data-act="sxPick">Refresh targets</button><button class="btn pri" data-act="sxOk0">Submit for approval</button>`, true);
};
SX_ACT.sxPick = () => {
  const box = document.getElementById('sx_tgt'); if (!box) return; const s = sxStu(v('sx_a')), type = v('sx_t'); if (!s) { box.innerHTML = '<p class="small muted">Enter the admission number to see the current class and the targets.</p>'; return; }
  const bid = sxBid(s), { list } = acBidSel(), cur = `<p class="small">${esc(s.name)} · now in <b>${esc((acBr(bid) || {}).name)}</b>, class <b>${esc(s.cls)} ${esc(s.sec || '')}</b></p>`;
  if (type === 'Branch transfer') { const others = DATA.branches.filter(b => b.id !== bid && !b.closed); box.innerHTML = cur + `<div class="form-grid"><label class="fld"><span>Receiving branch</span><select id="sx_b" data-act="sxPickB">${others.map(b => `<option value="${esc(b.id)}">${esc(b.name)}</option>`).join('')}</select></label><label class="fld"><span>Section at the new branch</span><select id="sx_s"></select></label></div>`; SX_ACT.sxPickB(); }
  else { const secs = acSections(bid).filter(x => type === 'Section change' ? x.cls === s.cls && x.sec !== (s.sec || '') : x.cls !== s.cls); box.innerHTML = cur + (secs.length ? `<label class="fld"><span>${type === 'Section change' ? 'New section' : 'New class and section'}</span><select id="sx_s">${secs.map(x => `<option value="${esc(x.cls + '|' + x.sec)}">${esc(x.cls + ' ' + x.sec)}</option>`).join('')}</select></label>` : '<p class="err">No other section is open for this student.</p>'); }
};
SX_ACT.sxPickB = () => { const b = v('sx_b'), sel = document.getElementById('sx_s'); if (!sel) return; const secs = acSections(b); sel.innerHTML = secs.length ? secs.map(x => `<option value="${esc(x.cls + '|' + x.sec)}">${esc(x.cls + ' ' + x.sec)}</option>`).join('') : '<option value="">No sections at that branch</option>'; };
SX_ACT.sxOk0 = async () => {
  if (!sxCan('Add')) return; const s = sxStu(v('sx_a')); if (!s) return toast('No learner with that admission number.', 'bad'); const bid = sxBid(s), { list } = acBidSel(); if (!list.some(b => b.id === bid)) return toast('This learner is outside your branch scope.', 'bad');
  if (s.exit) return toast('This student has left; a move is not possible.', 'bad'); const type = v('sx_t'), eff = v('sx_e'), why = (v('sx_r') || '').trim(), tgt = v('sx_s') || ''; if (!eff || eff < PROC_TODAY) return toast('The effective date cannot be in the past.', 'bad'); if (why.length < 10) return toast('Give the reason (at least 10 characters).', 'bad'); if (!tgt) return toast('Choose the target.', 'bad');
  const [toCls, toSec] = tgt.split('|'), toBid = type === 'Branch transfer' ? v('sx_b') : bid; if (!acSections(toBid).some(x => x.cls === toCls && x.sec === toSec)) return toast('That section does not exist.', 'bad');
  if (toBid === bid && toCls === s.cls && toSec === (s.sec || '')) return toast('The student is already there.', 'bad'); if (type === 'Section change' && toCls !== s.cls) return toast('A section change keeps the class; use Class change.', 'bad');
  const d = Store.clone(sxD()); if (d.mv.some(m => m.adm === s.adm && sxOpen(m))) return toast('A move is already open for this student.', 'bad');
  d.seq++; const m = { id: sxId('MV'), no: `MV-${String(d.seq).padStart(5, '0')}`, type, bid, toBid, adm: s.adm, name: s.name, fromCls: s.cls, fromSec: s.sec || '', toCls, toSec, eff, reason: why, st: 'Requested', by: App.user.name, byId: App.user.id, at: nowIso() };
  if (type === 'Branch transfer') { const x = E.studentsAt(DATA, A, E.dn(PROC_TODAY))[DATA.students.indexOf(s)]; m.ledger = x ? { due: x.due, paid: x.paid, os: x.os } : null; }
  d.mv.unshift(m); sxLog(d, bid, `${type} requested`, { new: `${s.adm} · ${m.fromCls} ${m.fromSec} → ${(type === 'Branch transfer' ? (acBr(toBid) || {}).name + ' ' : '')}${toCls} ${toSec} from ${eff}` }, why); if (toBid !== bid) sxLog(d, toBid, 'Branch transfer requested (incoming)', { new: `${s.adm} from ${(acBr(bid) || {}).name}` }, why); await sxSave(d); sxAud(type + ' requested', { new: s.adm }); closeModal(); toast('Sent for approval.'); rerender();
};
const sxFind = t => sxD().mv.find(m => m.id === t.dataset.k);
SX_ACT.sxOk = t => {
  const m = sxFind(t); if (!m || m.st !== 'Requested' || !sxMayDecide(m)) return;
  const led = m.type === 'Branch transfer' && m.ledger ? ` The fee ledger moves with the student: billed ${INR(m.ledger.due)}, paid ${INR(m.ledger.paid)}, balance ${INR(m.ledger.os)}.` : '';
  askReason((m.type === 'Branch transfer' ? 'Accept transfer of ' : 'Approve move of ') + m.name, `Note for the record (at least 5 characters).${led}`, async why => { if (why.length < 5) return toast('Give a note (at least 5 characters).', 'bad'); const d = Store.clone(sxD()), x = d.mv.find(y => y.id === m.id); if (!x || x.st !== 'Requested' || x.by === App.user.name) return toast('Already decided.', 'bad'); x.st = 'Approved'; x.apBy = App.user.name; x.apAt = nowIso(); sxLog(d, x.type === 'Branch transfer' ? x.toBid : x.bid, x.type + ' approved', { new: `${x.adm} → ${x.toCls} ${x.toSec} from ${x.eff}` }, why); await sxSave(d); sxAud(x.type + ' approved', { new: x.adm }); toast(x.eff <= PROC_TODAY ? 'Approved and applied.' : `Approved; applies from ${x.eff}.`); rerender(); });
};
SX_ACT.sxNo = t => { const m = sxFind(t); if (!m || m.st !== 'Requested' || !sxMayDecide(m)) return; askReason('Reject move', 'Say why (at least 5 characters).', async why => { if (why.length < 5) return toast('Give a reason.', 'bad'); const d = Store.clone(sxD()), x = d.mv.find(y => y.id === m.id); if (!x || x.st !== 'Requested') return; x.st = 'Rejected'; x.note = why; x.apBy = App.user.name; sxLog(d, x.bid, x.type + ' rejected', { new: x.adm }, why); await sxSave(d); toast('Rejected.'); rerender(); }); };
SX_ACT.sxCx = t => { const m = sxFind(t); if (!m) return; const own = m.st === 'Requested' && m.by === App.user.name, pre = m.st === 'Approved' && m.eff > PROC_TODAY && sxCan('Approve'); if (!own && !pre) return; askReason(own ? 'Withdraw request' : 'Cancel before it takes effect', 'Say why (at least 5 characters).', async why => { if (why.length < 5) return toast('Give a reason.', 'bad'); const d = Store.clone(sxD()), x = d.mv.find(y => y.id === m.id); if (!x || !sxOpen(x) || (x.st === 'Approved' && x.eff <= PROC_TODAY)) return toast('This move can no longer be cancelled.', 'bad'); x.st = 'Cancelled'; x.note = why; x.cxBy = App.user.name; sxLog(d, x.bid, x.type + ' cancelled', { new: x.adm }, why); await sxSave(d); toast('Cancelled.'); rerender(); }); };
