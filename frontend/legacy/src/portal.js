/* ===== Parent and Student app: one page showing only the signed-in family's own child/children ===== */
const PT_ACT = {};
const PT_TABS = [['home', 'Home'], ['att', 'Attendance'], ['hw', 'Learning'], ['tt', 'Timetable'], ['fee', 'Fees'], ['nt', 'Notices'], ['ex', 'Exams'], ['ptm', 'PTM'], ['help', 'Help desk'], ['lv', 'Leave'], ['id', 'Digital ID']];
const ptKey = s => DATA.branches[s.b].id + '|' + s.adm;
const ptIsLearner = () => ['Parent', 'Student'].includes((App.user || {}).role);
const ptStaff = () => !ptIsLearner() && can('portal', 'Configure Settings');
/* learners the signed-in person may see: a Parent or Student sees only the learners linked to the account; a staff preview needs the Configure Settings right */
function ptKids() {
  const u = App.user || {};
  if (ptIsLearner()) return (u.kids || []).map(k => DATA.students.find(s => ptKey(s) === k)).filter(Boolean);
  if (!ptStaff()) return [];
  const k = App.ui.ptPrev; const s = k && DATA.students.find(x => ptKey(x) === k); return s ? [s] : [];
}
const ptKid = () => { const K = ptKids(); return K.find(s => ptKey(s) === App.ui.ptKid) || K[0] || null; };
function ptFee(s) { const x = E.studentsAt(DATA, A, E.dn(PROC_TODAY))[DATA.students.indexOf(s)]; return x || null; }
function ptNotices(s) {
  const bid = DATA.branches[s.b].id; return cmD().nt.filter(n => n.bid === bid && n.state === 'Published' && cmIsParent(n.aud) && cmEff(n) === 'Published' && (n.aud === 'Parents: whole branch' || (n.aud === 'Parents: one student' ? n.adm === s.adm : (n.cls === s.cls && (n.aud === 'Parents: one class' || n.sec === (s.sec || '')))))).sort((a, b) => (b.at || '').localeCompare(a.at || ''));
}
PAGES.portal = { title: 'Parent & Student app', mod: 'portal', sf: false, render() {
  const staff = ptStaff();
  if (!ptIsLearner() && !staff) return noAccess();
  const prev = staff ? `<div class="ctrls"><label class="fld"><span>Preview a learner (admission no. as BranchID|AdmNo)</span><input id="pt_prev" value="${esc(App.ui.ptPrev || '')}"></label><button class="btn" data-act="ptPrevGo">Show</button></div>` : '';
  const accts = staff ? ptAcctCard() : '';
  const s = ptKid();
  if (!s) return prev + accts + card('Parent & Student app', empty(staff ? 'Enter a learner above to preview what the family sees.' : 'No learner is linked to this account. Ask the school office to link your child.'));
  const K = ptKids(), bid = DATA.branches[s.b].id, br = DATA.branches[s.b], tab = pcTab('pt', 'home');
  const pick = K.length > 1 ? `<div class="ctrls"><label class="fld"><span>Child</span><select data-act="uiSel" data-k="ptKid">${K.map(k => `<option value="${esc(ptKey(k))}" ${k === s ? 'selected' : ''}>${esc(k.name)} · ${esc(k.cls)} ${esc(k.sec || '')}</option>`).join('')}</select></label></div>` : '';
  const tabs = pcTabs('pt', PT_TABS, 'home');
  const to = PROC_TODAY, from = pcAddDays(to, -29), rec = atOfStudent(s.adm, bid, from, to), st = atStats(rec.map(r => r.st));
  const f = ptFee(s); let body = '';
  if (tab === 'home') {
    const hw = lmD().hw.filter(h => h.bid === bid && h.cls === s.cls && h.sec === (s.sec || '') && h.due >= to && h.status !== 'Closed');
    body = `<div class="kpis k4"><div class="kpi"><span>Attendance (30 days)</span><b>${st.pct == null ? '—' : st.pct + '%'}</b></div><div class="kpi"><span>Homework due</span><b>${NUM(hw.length)}</b></div><div class="kpi"><span>Fee balance</span><b style="color:${f && f.os > 0 ? '#b91c1c' : 'inherit'}">${f ? INR(f.os) : '—'}</b></div><div class="kpi"><span>Notices</span><b>${NUM(ptNotices(s).length)}</b></div></div><p class="small muted">${esc(s.name)} · Class ${esc(s.cls)} ${esc(s.sec || '')} · ${esc(br.name)} · Admission no. ${esc(s.adm)}</p>`;
  } else if (tab === 'att') {
    const el = atExamEligible(s.adm, bid); const warn = el.known && !el.ok ? `<div class="note" style="border-color:#b91c1c"><b>Attendance below the examination minimum.</b> ${s.name} has attended ${el.pct}% of ${el.days} recorded days since 1 April; the school requires ${el.min}%. Please meet the class teacher.</div>` : el.known && el.pct < (atD().cfg.minPct || 75) ? `<div class="note"><b>Attendance is low:</b> ${el.pct}% since 1 April (school minimum ${atD().cfg.minPct || 75}%).</div>` : '';
    body = warn + `<div class="kpis k4"><div class="kpi"><span>Present</span><b>${st.P}</b></div><div class="kpi"><span>Late</span><b>${st.L}</b></div><div class="kpi"><span>Absent</span><b>${st.A}</b></div><div class="kpi"><span>Leave (incl. medical)</span><b>${st.leave}</b></div></div>` + table('pt_att', [{ h: 'Date', t: 'text', k: r => r.date }, { h: 'Status', t: 'text', k: r => AT_ST[r.st] || r.st }, { h: 'Note', t: 'text', k: r => r.note || '' }], rec.sort((a, b) => b.date.localeCompare(a.date)), { empty: 'No attendance has been marked in the last 30 days.', noexp: true });
  } else if (tab === 'hw') {
    body = typeof ptLearnTab === 'function' ? ptLearnTab(s, bid) : ''; const H = [];
    if (!body) body = table('pt_hw', [{ h: 'Subject', t: 'text', k: h => h.subject }, { h: 'Title', t: 'text', k: h => h.title }, { h: 'Due', t: 'text', k: h => h.due }, { h: 'Status', t: 'text', k: h => ((h.subs || {})[s.adm] || {}).state || 'Not submitted' }], H, { empty: 'No homework has been set for this class.', noexp: true });
  } else if (tab === 'tt') {
    const D = acD(), T = (D.tt[bid] || {})[acSecKey(s.cls, s.sec || '')] || {}, days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], P = Array.from({ length: D.cfg.periods || 8 }, (_, i) => i + 1);
    const cell = (d, p) => { const c = T[d + '-' + p], a = c && D.alloc.find(x => x.id === c.aid); return a ? esc(a.subject) : '—'; };
    body = `<div class="tablewrap"><table class="tbl"><thead><tr><th>Period</th>${days.map(d => `<th>${d}</th>`).join('')}</tr></thead><tbody>${P.map(p => `<tr><td>${p}</td>${days.map(d => `<td>${cell(d, p)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  } else if (tab === 'fee') {
    const its = f ? (s._py ? [s._py] : []).concat(s._items.filter(i => i.k >= 0)) : [], R = cdD().rc.filter(r => r.adm === s.adm && r.bid === bid).sort((a, b) => b.day.localeCompare(a.day));
    body = (f ? `<div class="kpis k4"><div class="kpi"><span>Billed to date</span><b>${INR(f.due)}</b></div><div class="kpi"><span>Paid</span><b>${INR(f.paid)}</b></div><div class="kpi"><span>Balance</span><b>${INR(f.os)}</b></div><div class="kpi"><span>Status</span><b>${esc(f.status)}</b></div></div>` : '') +
      table('pt_inst', [{ h: 'Instalment', t: 'text', k: i => (i === s._py ? 'Previous year' : (A.sched[i.k] || {}).name || 'Instalment ' + (i.k + 1)) }, { h: 'Due on', t: 'text', k: i => E.ds(i.due) }, { h: 'Amount', t: 'inr', k: i => i.amt }, { h: 'Balance', t: 'inr', k: i => ((f.inst[i.k] || {}).bal) || 0 }], its, { empty: 'No fee schedule found.', noexp: true, title: 'Instalments' }) +
      table('pt_rc', [{ h: 'Receipt', t: 'text', k: r => r.no }, { h: 'Date', t: 'text', k: r => r.day }, { h: 'Amount', t: 'inr', k: r => r.total }, { h: 'Status', t: 'text', k: r => r.st }, { h: '', t: 'html', k: r => `<button class="btn sm" data-act="cdkPdf" data-k="${esc(r.id)}">Receipt (PDF)</button>` }], R, { empty: 'No receipts issued through the collection desk yet.', noexp: true, title: 'Receipts' }) +
      (typeof fdD === 'function' ? (R2 => R2.length ? table('pt_rm', [{ h: 'Date', t: 'text', k: q => q.day }, { h: 'Reminder', t: 'text', k: q => q.stage }, { h: 'Instalment', t: 'text', k: q => q.head }, { h: 'Amount', t: 'inr', k: q => q.bal }], R2, { noexp: true, title: 'Reminders sent to you' }) : '')(fdD().q.filter(q => q.adm === s.adm && q.bid === bid && q.st === 'Sent (recorded)').sort((a, b) => b.day.localeCompare(a.day))) : '') + (typeof fsCard === 'function' && fsCard(s) ? `<details open><summary><b>Fee card for ${esc(s.cls)}</b></summary>${fsCardHtml(s, fsCard(s), { family: true })}</details>` : '') + (typeof opD === 'function' ? ptPayBlock(s, bid) : '');
  } else if (tab === 'nt') {
    body = (typeof svOpenFor === 'function' ? ptSurveyBlock(s) : '') + (ptNotices(s).map(n => `<div class="card"><b>${esc(n.title)}</b> <span class="pill">${esc(n.cat)}</span><p class="small">${esc(n.body || '')}</p></div>`).join('') || empty('No notices for this class.'));
  } else if (tab === 'lv') {
    const L = atD().lv.filter(l => l.adm === s.adm && l.bid === bid).sort((a, b) => b.from.localeCompare(a.from));
    body = (can('portal', 'Add') ? `<button class="btn pri" data-act="ptLeaveForm">Request leave</button>` : '') + table('pt_lv', [{ h: 'From', t: 'text', k: l => l.from }, { h: 'To', t: 'text', k: l => l.to }, { h: 'Reason', t: 'text', k: l => l.reason }, { h: 'Status', t: 'text', k: l => l.state }], L, { empty: 'No leave requests yet.', noexp: true });
  } else if (tab === 'ex') {
    body = ptExamsTab(s, bid);
  } else if (tab === 'ptm') {
    body = ptPtmTab(s, bid);
  } else if (tab === 'help') {
    body = ptHelpTab(s, bid);
  } else if (tab === 'id') {
    const cd = typeof ctD === 'function' ? ctLiveCard(ctD(), bid, s.adm) : null, payload = cd ? ctPayload('ID', cd) : `MSEA|${bid}|${s.adm}`;
    const BFm = typeof ctD === 'function' ? ctD().bf.filter(b => b.adm === s.adm && b.bid === bid).sort((a, b) => b.at.localeCompare(a.at)) : [];
    body = `<div class="card" style="max-width:320px"><b>${esc(br.name)}</b><div style="margin:8px 0;display:flex;gap:12px;align-items:center">${(sisP(s.adm) || {}).photo ? `<img src="${(sisP(s.adm) || {}).photo}" alt="photo" style="height:120px;border:1px solid #ccc">` : ''}${hrQrSvg(payload, 140)}</div><div><b>${esc(s.name)}</b></div><div class="small">Class ${esc(s.cls)} ${esc(s.sec || '')} · Admission no. ${esc(s.adm)}</div>${cd ? `<div class="small muted">Card ${esc(cd.no)} · valid to ${esc(cd.to)}</div><div style="margin-top:8px"><button class="btn sm" data-act="ctCardPdf" data-k="${esc(cd.id)}">Download ID card (PDF)</button></div>` : '<div class="small muted">The school has not issued an ID card yet.</div>'}</div>` +
      card('Bonafide certificate', (can('portal', 'Add') && ptIsLearner() ? `<button class="btn" data-act="ptBfForm">Request a bonafide certificate</button>` : '') + table('pt_bf', [{ h: 'Requested', t: 'text', k: b => tsLabel(b.at) }, { h: 'Purpose', t: 'text', k: b => b.purpose }, { h: 'Status', t: 'text', k: b => b.st + (b.no ? ' · ' + b.no : '') }, { h: '', t: 'html', k: b => b.st === 'Issued' ? `<button class="btn sm" data-act="ctBfPdf" data-k="${esc(b.id)}">Download (PDF)</button>` : '' }], BFm, { empty: 'No requests yet. The school office issues the certificate; collect it or download it here once issued.', noexp: true }));
  }
  const alerts = typeof eaD === 'function' ? eaD().al.filter(a => eaLive(a) && eaForStudent(a, s)).map(a => `<div class="note" style="border-left:6px solid #b91c1c;background:#fee2e2"><b>${a.drill ? 'DRILL · ' : ''}EMERGENCY · ${esc(a.type)}</b> · ${tsLabel(a.at)}<br>${esc(a.msg)}</div>`).join('') : '';
  return prev + accts + pick + alerts + card('Parent & Student app', tabs + body, { sub: `${esc(s.name)} · ${esc(br.name)}` });
} };
function ptPayBlock(s, bid) {
  const c = opCfg(bid), B = cdBal(s, cdD()), O = opD().o.filter(o => o.adm === s.adm && o.bid === bid).map(o => Object.assign({}, o, { st: opEff(o) })).sort((a, b) => b.at.localeCompare(a.at)), open = new Set(O.filter(o => o.st === 'Created').map(o => o.k));
  const due = B.filter(r => r.left > 0.005 && !open.has(r.k));
  return (c.on && can('portal', 'Add') && ptIsLearner() && due.length ? `<div class="btns">${due.map(r => `<button class="btn pri sm" data-act="ptPay" data-k="${r.k}">Pay ${esc(r.name)} online · ${INR(r.left)}</button>`).join(' ')}</div>` : '') +
    table('pt_op', [{ h: 'Order', t: 'text', k: o => o.no }, { h: 'Instalment', t: 'text', k: o => o.head }, { h: 'Amount', t: 'inr', k: o => o.total }, { h: 'Status', t: 'text', k: o => o.st }, { h: '', t: 'html', k: o => `<button class="btn sm" data-act="opView" data-k="${esc(o.id)}">Open</button>` }], O, { empty: '', noexp: true, title: O.length ? 'Your online payment orders' : '' }) +
    `<div class="note">${c.prov === 'Not connected' ? 'No payment gateway is connected yet, so an online order creates a reference only. Show the order number at the fee counter, or pay by UPI to the school account; the office records the result and the receipt appears here.' : 'Online payment runs through ' + esc(c.prov) + ' once connected; until then the office records results against your order.'}</div>`;
}
/* ---- exams: timetable of scheduled exams, published marks, released report cards ---- */
function ptExamsTab(s, bid) {
  const D = exD(), EX = D.exams.filter(e => e.bid === bid && e.state !== 'Draft' && e.classes.includes(s.cls)).sort((a, b) => b.from.localeCompare(a.from));
  let out = '';
  EX.forEach(e => {
    const P = D.papers.filter(p => p.eid === e.id && p.cls === s.cls && p.state !== 'Requested').sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
    const rows = P.map(p => { const r = exPaperMark(D, p, s); return { p, r }; });
    const pub = rows.filter(x => x.r.state === 'Published'), tot = pub.reduce((a, x) => a + x.r.eff, 0), max = pub.reduce((a, x) => a + x.p.max, 0);
    out += card(`${esc(e.name)} · ${esc(e.term)} · ${esc(e.from)} to ${esc(e.to)}`, table('pt_ex_' + e.id, [{ h: 'Date', t: 'text', k: x => x.p.date }, { h: 'Time', t: 'text', k: x => `${x.p.start}–${x.p.end}` }, { h: 'Subject', t: 'text', k: x => x.p.subject }, { h: 'Max', t: 'num', k: x => x.p.max }, { h: 'Marks', t: 'text', k: x => x.r.state === 'Published' ? (x.r.ab ? 'Absent' : String(x.r.eff)) + (x.r.grace ? ' (incl. grace)' : '') : (x.p.date < PROC_TODAY ? 'Awaiting result' : '') }, { h: 'Result', t: 'html', k: x => x.r.state === 'Published' ? pill(x.r.pass ? 'Pass' : 'Fail', x.r.pass ? 'g' : 'r') : '' }], rows, { noexp: true, empty: 'The timetable for this class is not out yet.' }) + (pub.length ? `<p class="small"><b>Published so far:</b> ${tot} / ${max}${pub.length < rows.length ? ' · results for the other papers will appear once published' : ' · ' + (max ? Math.round(tot / max * 1000) / 10 : 0) + '%'}</p>` : ''));
  });
  const R = lrD().rc || {}, cards = LR_TERMS.map(term => ({ term, r: R[lrCKey(bid, term, s.adm)] })).filter(x => x.r && x.r.state === 'Released' && x.r.snap);
  out += card('Report cards', cards.length ? cards.map(x => { const c = x.r.snap, m = c.m || {}; return `<details><summary><b>${esc(x.term)}</b> · released ${tsLabel(x.r.relAt || x.r.apprAt || '')} ${m.pct != null ? '· ' + m.pct + '%' : ''}</summary>` + table('pt_rc_' + x.term, [{ h: 'Subject', t: 'text', k: r => r.sub }, { h: 'Marks', t: 'text', k: r => `${r.q.eff} / ${r.q.max}` }, { h: 'Result', t: 'html', k: r => pill(r.q.ab ? 'Absent' : r.q.pass ? 'Pass' : 'Fail', r.q.pass ? 'g' : 'r') }], Object.entries(m.rows || {}).map(([sub, q]) => ({ sub, q })), { noexp: true, empty: 'No scholastic marks on this card.' }) + ((c.outs || []).length ? `<p class="small"><b>Learning outcomes:</b> ${c.outs.map(o => esc(o.subject) + ' (' + o.items.filter(i => i.lvl >= 3).length + '/' + o.items.length + ' secure)').join(', ')}</p>` : '') + (c.co && c.co.remark ? `<p class="small"><b>Class teacher:</b> ${esc(c.co.remark)}</p>` : '') + `<button class="btn sm" data-act="ptRcPdf" data-k="${esc(x.term)}">Download (PDF)</button></details>`; }).join('') : empty('No report card has been released yet. It appears here once the Principal releases it.'));
  return out || empty('No examinations are scheduled for this class.');
}
PT_ACT.ptRcPdf = t => {
  const s = ptKid(); if (!s) return; const bid = DATA.branches[s.b].id, term = t.dataset.k, r = (lrD().rc || {})[lrCKey(bid, term, s.adm)]; if (!r || r.state !== 'Released' || !r.snap) return toast('Not released.', 'bad'); if (!window.jspdf) return toast('The PDF library did not load.', 'bad');
  const c = r.snap, m = c.m || {}, doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'a4' }); let y = 60; const L = (txt, o = {}) => { doc.setFontSize(o.sz || 11); doc.setFont('helvetica', o.b ? 'bold' : 'normal'); doc.text(String(txt), o.x || 60, y, o.align ? { align: o.align } : { maxWidth: 475 }); y += o.dy || 18; };
  L('MS Education Academy', { sz: 16, b: 1, x: 297, align: 'center' }); L((acBr(bid) || {}).name || '', { x: 297, align: 'center', dy: 26 }); L('PROGRESS REPORT · ' + term, { sz: 13, b: 1, x: 297, align: 'center', dy: 28 });
  L(`${s.name} · ${s.adm} · Class ${s.cls} ${s.sec || ''} · ${CUR_AY}`, { dy: 26 });
  L('Subject', { b: 1, dy: 0 }); doc.text('Marks', 330, y); doc.text('Result', 430, y); y += 16; Object.entries(m.rows || {}).forEach(([sub, q]) => { L(sub, { dy: 0 }); doc.text(`${q.eff} / ${q.max}`, 330, y); doc.text(q.ab ? 'Absent' : q.pass ? 'Pass' : 'Fail', 430, y); y += 16; });
  if (m.pct != null) { y += 6; L(`Total ${m.tot} / ${m.max} · ${m.pct}%`, { b: 1, dy: 24 }); }
  (c.outs || []).forEach(o => { L(o.subject + ': ' + o.items.filter(i => i.lvl >= 3).length + ' of ' + o.items.length + ' learning outcomes secure', { sz: 10, dy: 15 }); });
  if (c.co) { y += 6; if (c.co.traits) L('Co-scholastic: ' + Object.entries(c.co.traits).map(([k, v2]) => k + ' ' + v2).join(', '), { sz: 10, dy: 15 }); if (c.co.total) L(`Attendance: ${c.co.present} of ${c.co.total} days`, { sz: 10, dy: 15 }); if (c.co.remark) L('Class teacher: ' + c.co.remark, { sz: 10, dy: 24 }); }
  L('Released by ' + (r.relBy || r.apprBy || 'Principal') + ' on ' + (r.relAt || '').slice(0, 10), { sz: 9 });
  saveFile(`report-card-${s.adm}-${term.replace(/\s/g, '')}.pdf`, doc.output('blob'));
};
/* ---- PTM self-booking on the slots the school created in Meetings ---- */
function ptPtmTab(s, bid) {
  const D = mgD(), M = D.m.filter(m => m.bid === bid && m.type === 'Parent-teacher meeting (PTM)' && m.date >= PROC_TODAY && !['Cancelled'].includes(m.state)).sort((a, b) => a.date.localeCompare(b.date));
  const teachers = new Set(acD().alloc.filter(a => a.bid === bid && a.cls === s.cls && a.sec === (s.sec || '')).map(a => a.teacher));
  const mineAll = D.slots.filter(x => x.adm === s.adm);
  let out = '';
  M.forEach(m => {
    const S = D.slots.filter(x => x.mid === m.id), mine = S.find(x => x.adm === s.adm), free = S.filter(x => !x.adm && (teachers.size === 0 || teachers.has(x.teacher)));
    out += card(`${esc(m.title)} · ${esc(m.date)} ${esc(m.start)}–${esc(m.end)}`, mine ? `<div class="note">Your slot: <b>${esc(mine.time)}</b> with ${esc(acEmpName(mine.teacher))} · confirmation <b>${esc(mine.conf)}</b>${m.date > PROC_TODAY && can('portal', 'Add') && ptIsLearner() ? ` <button class="btn sm" data-act="ptPtmCancel" data-k="${esc(mine.id)}">Cancel booking</button>` : ''}</div>` : !S.length ? '<p class="small muted">Slots are not open yet.</p>' : !free.length ? '<p class="small muted">All slots with your child\'s teachers are taken. Contact the office.</p>' : (can('portal', 'Add') && ptIsLearner() ? `<p class="small">Pick a time with one of ${esc(s.name)}\'s teachers:</p><div class="btns">${free.slice(0, 40).map(x => `<button class="btn sm" data-act="ptPtmBook" data-k="${esc(x.id)}">${esc(x.time)} · ${esc(acEmpName(x.teacher))}</button>`).join(' ')}</div>` : '<p class="small muted">Booking is done by the family from their app.</p>'));
  });
  return (out || empty('No parent-teacher meeting is scheduled at the moment.')) + (mineAll.length ? table('pt_ptm_h', [{ h: 'Meeting', t: 'text', k: x => (D.m.find(m => m.id === x.mid) || {}).title || '' }, { h: 'Date', t: 'text', k: x => (D.m.find(m => m.id === x.mid) || {}).date || '' }, { h: 'Time', t: 'text', k: x => x.time }, { h: 'Teacher', t: 'text', k: x => acEmpName(x.teacher) }, { h: 'Confirmation', t: 'text', k: x => x.conf }], mineAll, { noexp: true, title: 'Your bookings' }) : '');
}
PT_ACT.ptPtmBook = async t => {
  if (!can('portal', 'Add') || !ptIsLearner()) return; const s = ptKid(); if (!s) return; const d = Store.clone(mgD()), x = d.slots.find(z => z.id === t.dataset.k), m = x && d.m.find(z => z.id === x.mid); if (!x || !m) return; if (x.adm) return toast('That slot was just taken. Pick another.', 'bad'); if (m.bid !== DATA.branches[s.b].id || m.date < PROC_TODAY) return toast('This meeting is not open for booking.', 'bad');
  if (d.slots.some(z => z.mid === m.id && z.adm === s.adm)) return toast('You already have a slot in this meeting. Cancel it first to change.', 'bad');
  const teachers = new Set(acD().alloc.filter(a => a.bid === m.bid && a.cls === s.cls && a.sec === (s.sec || '')).map(a => a.teacher)); if (teachers.size && !teachers.has(x.teacher)) return toast('That teacher does not teach your child.', 'bad');
  x.adm = s.adm; x.parent = App.user.name; x.mobile = s.mobile || ''; x.conf = 'PTM-' + m.id.slice(-4).toUpperCase() + '-' + x.id.slice(-3).toUpperCase(); x.bookedBy = App.user.name + ' (family app)'; x.bookedAt = nowIso(); mgLog(d, m.bid, `PTM slot booked by family: ${s.adm}`, { new: `${x.time} with ${acEmpName(x.teacher)}, confirmation ${x.conf}` }, ''); await mgSave(d); audit('Parent & Student app', 'PTM slot booked', { new: x.conf }); toast(`Booked: ${x.conf}`); rerender();
};
PT_ACT.ptPtmCancel = t => { if (!can('portal', 'Add') || !ptIsLearner()) return; const s = ptKid(); if (!s) return; const x0 = mgD().slots.find(z => z.id === t.dataset.k); if (!x0 || x0.adm !== s.adm) return; askReason('Cancel PTM booking', 'Say why (at least 5 characters). The slot is freed for another family.', async why => { if (why.length < 5) return toast('Give a reason.', 'bad'); const d = Store.clone(mgD()), x = d.slots.find(z => z.id === x0.id), m = d.m.find(z => z.id === x.mid); if (!x || x.adm !== s.adm) return; if (m.date <= PROC_TODAY) return toast('Too late to cancel online; contact the office.', 'bad'); mgLog(d, m.bid, `PTM slot cancelled by family: ${s.adm}`, { old: x.conf }, why); x.adm = ''; x.parent = ''; x.mobile = ''; x.conf = ''; x.bookedBy = ''; await mgSave(d); toast('Booking cancelled.'); rerender(); }); };
/* ---- help desk: tickets raised by the family ---- */
function ptHelpTab(s, bid) {
  const T = hdD().t.filter(t => t.adm === s.adm && t.bid === bid).sort((a, b) => b.at.localeCompare(a.at));
  return (can('portal', 'Add') && ptIsLearner() ? `<div class="btns"><button class="btn pri" data-act="ptTkForm">Raise a complaint, feedback or request</button></div>` : '') + table('pt_tk', [{ h: 'Ticket', t: 'text', k: t => t.no }, { h: 'Type', t: 'text', k: t => `${t.kind} · ${t.cat}` }, { h: 'Subject', t: 'text', k: t => t.subj }, { h: 'Raised', t: 'text', k: t => tsLabel(t.at) }, { h: 'Status', t: 'html', k: t => pill(t.st, ['Resolved', 'Closed'].includes(t.st) ? 'g' : 'a') }, { h: 'Replies', t: 'num', k: t => t.msgs.filter(m => m.who === 'office').length }, { h: '', t: 'html', k: t => `<button class="btn sm" data-act="ptTkOpen" data-k="${esc(t.id)}">Open</button>` }], T, { empty: 'No tickets yet. The school replies here; you will not get an SMS or email.', noexp: true });
}
PT_ACT.ptTkForm = () => { if (!can('portal', 'Add') || !ptIsLearner() || !ptKid()) return; modal('Raise a ticket', `<div class="form-grid">${pcFld('Type', `<select id="pk_k">${HD_KIND.map(x => `<option>${x}</option>`).join('')}</select>`)}${pcFld('About', `<select id="pk_c">${HD_CATS.map(x => `<option>${x}</option>`).join('')}</select>`)}</div>${pcFld('Subject', `<input id="pk_s">`)}${pcFld('Details', `<textarea id="pk_b" rows="4"></textarea>`)}`, `<button class="btn pri" data-act="ptTkOk">Send</button>`, true); };
PT_ACT.ptTkOk = () => { if (!can('portal', 'Add') || !ptIsLearner()) return; const s = ptKid(); if (!s) return; const r = hdNew(s, { kind: v('pk_k'), cat: v('pk_c'), subj: v('pk_s'), body: v('pk_b') }, 'Parent app'); if (r.err) return toast(r.err, 'bad'); closeModal(); toast(`${r.t.no} sent to the school office.`); rerender(); };
PT_ACT.ptTkOpen = t => { const s = ptKid(); const x = hdD().t.find(z => z.id === t.dataset.k); if (!s || !x || x.adm !== s.adm) return; const live = !['Closed'].includes(x.st), fam = can('portal', 'Add') && ptIsLearner(); modal(`${x.no} · ${esc(x.subj)}`, `<p class="small">${esc(x.kind)} · ${esc(x.cat)} · <b>${esc(x.st)}</b>${x.resolution ? '<br><b>Resolution:</b> ' + esc(x.resolution) : ''}</p>${hdThread(x)}${live && fam ? `<label class="fld"><span>Add to the conversation</span><textarea id="pk_r" rows="2"></textarea></label>` : ''}`, [live && fam && x.st !== 'Resolved' ? `<button class="btn pri" data-act="ptTkReply" data-k="${x.id}">Send</button>` : '', x.st === 'Resolved' && fam ? `<button class="btn pri" data-act="ptTkClose" data-k="${x.id}">Close – resolved</button><button class="btn" data-act="ptTkReopen" data-k="${x.id}">Not resolved – reopen</button>` : '', '<button class="btn" data-act="closeModal">Close</button>'].join(' '), true); };
PT_ACT.ptTkReply = async t => { const s = ptKid(); const d = Store.clone(hdD()), x = d.t.find(z => z.id === t.dataset.k); if (!s || !x || x.adm !== s.adm || !ptIsLearner()) return; const tx = (v('pk_r') || '').trim(); if (tx.length < 3) return toast('Write a message.', 'bad'); x.msgs.push({ at: nowIso(), by: App.user.name, who: 'family', text: tx }); if (x.st === 'Resolved') x.st = 'Reopened'; hdLog(d, x.bid, 'Family replied', { new: x.no }); await hdSave(d); closeModal(); toast('Sent.'); rerender(); };
PT_ACT.ptTkClose = async t => { const s = ptKid(); const d = Store.clone(hdD()), x = d.t.find(z => z.id === t.dataset.k); if (!s || !x || x.adm !== s.adm || x.st !== 'Resolved' || !ptIsLearner()) return; x.st = 'Closed'; x.closedAt = nowIso(); hdLog(d, x.bid, 'Ticket closed by family', { new: x.no }); await hdSave(d); closeModal(); toast('Thank you. Ticket closed.'); rerender(); };
PT_ACT.ptTkReopen = async t => { const s = ptKid(); const d = Store.clone(hdD()), x = d.t.find(z => z.id === t.dataset.k); if (!s || !x || x.adm !== s.adm || x.st !== 'Resolved' || !ptIsLearner()) return; const tx = (v('pk_r') || '').trim(); if (tx.length < 10) return toast('Say what is still wrong (at least 10 characters).', 'bad'); x.msgs.push({ at: nowIso(), by: App.user.name, who: 'family', text: 'Reopened: ' + tx }); x.st = 'Reopened'; x.reopened = (x.reopened || 0) + 1; hdLog(d, x.bid, 'Ticket reopened by family', { new: x.no }, tx); await hdSave(d); closeModal(); toast('Reopened.'); rerender(); };
function ptSurveyBlock(s) {
  const L = svOpenFor(s), past = typeof eaD === 'function' ? eaD().al.filter(a => !eaLive(a) && eaForStudent(a, s) && a.standAt && a.standAt >= pcAddDays(PROC_TODAY, -7) + 'T00:00:00').slice(0, 3) : [];
  return (L.length ? card('Surveys', L.map(x => `<div class="card" style="margin:6px 0"><b>${esc(x.title)}</b> <span class="small muted">until ${esc(x.to)}${x.anon ? ' · anonymous' : ''}</span>${x.intro ? `<p class="small">${esc(x.intro)}</p>` : ''}${svAnswered(x, s) ? '<p class="small">Thank you, answered.</p>' : (can('portal', 'Add') && ptIsLearner() ? `<button class="btn sm pri" data-act="ptSvForm" data-k="${esc(x.id)}">Answer</button>` : '')}</div>`).join('')) : '') + (past.length ? past.map(a => `<div class="note"><b>All clear · ${esc(a.type)}</b> ${tsLabel(a.standAt)}: ${esc(a.stand)}</div>`).join('') : '');
}
PT_ACT.ptSvForm = t => { if (!can('portal', 'Add') || !ptIsLearner()) return; const s = ptKid(); const x = svD().s.find(y => y.id === t.dataset.k); if (!s || !x) return; modal(esc(x.title), (x.intro ? `<p class="small">${esc(x.intro)}</p>` : '') + x.q.map((q, i) => `<div class="card" style="margin:6px 0"><b>Q${i + 1}.</b> ${esc(q.text)}<div style="margin-top:4px">${q.t === 'Rating 1-5' ? [1, 2, 3, 4, 5].map(k => `<label class="chk"><input type="radio" name="sq_${i}" value="${k}"> ${k}</label>`).join(' ') : q.t === 'Yes / No' ? ['Yes', 'No'].map(o => `<label class="chk"><input type="radio" name="sq_${i}" value="${o}"> ${o}</label>`).join(' ') : q.t === 'Choice' ? q.opts.map(o => `<label class="chk"><input type="radio" name="sq_${i}" value="${esc(o)}"> ${esc(o)}</label>`).join(' ') : `<textarea id="sq_${i}" rows="2" style="width:100%"></textarea>`}</div></div>`).join(''), `<button class="btn pri" data-act="ptSvOk" data-k="${esc(x.id)}">Submit</button>`, true); };
PT_ACT.ptSvOk = t => { if (!can('portal', 'Add') || !ptIsLearner()) return; const s = ptKid(); const x = svD().s.find(y => y.id === t.dataset.k); if (!s || !x) return; const ans = x.q.map((q, i) => { if (q.t === 'Text') return v('sq_' + i); const r = document.querySelector(`input[name="sq_${i}"]:checked`); return r ? r.value : null; }); const e = svRespond(s, x.id, ans); if (e) return toast(e, 'bad'); closeModal(); toast('Thank you for your feedback.'); rerender(); };
function ptAcctCard() {
  const U = users().filter(u => ['Parent', 'Student'].includes(u.role));
  return card('Family accounts', `<button class="btn" data-act="ptAcctForm">Add family account</button>` + table('pt_acct', [{ h: 'Name', t: 'text', k: u => u.name }, { h: 'Role', t: 'text', k: u => u.role }, { h: 'Linked learners', t: 'text', k: u => (u.kids || []).join(', ') }, { h: 'Status', t: 'text', k: u => u.status }], U, { empty: 'No family accounts yet.', noexp: true }), { sub: 'A parent sees only the learners linked here. Nothing is sent: there is no SMS, WhatsApp or email.' });
}
PT_ACT.ptPrevGo = () => { const k = (v('pt_prev') || '').trim(); if (!ptStaff()) return; if (!DATA.students.some(s => ptKey(s) === k)) return toast('No learner found for that key. Use BranchID|AdmNo.', 'bad'); App.ui.ptPrev = k; App.ui.ptKid = k; rerender(); };
PT_ACT.ptAcctForm = () => {
  if (!ptStaff()) return;
  modal('Add family account', `<div class="form-grid">${pcFld('Role', `<select id="pa_r"><option>Parent</option><option>Student</option></select>`)}${pcFld('Name', `<input id="pa_n">`)}${pcFld('Learner keys (BranchID|AdmNo, comma separated)', `<input id="pa_k">`)}</div>`, `<button class="btn pri" data-act="ptAcctOk">Create</button>`);
};
PT_ACT.ptAcctOk = async () => {
  if (!ptStaff()) return; const role = v('pa_r'), name = (v('pa_n') || '').trim(), keys = (v('pa_k') || '').split(',').map(x => x.trim()).filter(Boolean);
  if (!name) return toast('Enter a name.', 'bad'); if (!keys.length) return toast('Link at least one learner.', 'bad');
  const bad = keys.filter(k => !DATA.students.some(s => ptKey(s) === k)); if (bad.length) return toast('Unknown learner: ' + bad[0], 'bad');
  if (role === 'Student' && keys.length > 1) return toast('A student account links to one learner only.', 'bad');
  const U = Store.clone(Store.get('users')), id = 'PT' + Date.now().toString(36).toUpperCase(), bid = keys[0].split('|')[0];
  U.push({ id, name, role, status: 'Active', branch: bid, kids: keys }); await Store.put('users', U);
  audit('Parent & Student app', 'Family account created', { name, role, kids: keys.join(',') }); closeModal(); toast('Account created.'); rerender();
};
PT_ACT.ptPay = t => { if (!can('portal', 'Add') || !ptIsLearner()) return; const s = ptKid(); if (!s) return; const r = opNew(s, +t.dataset.k, null, App.user.name, 'Parent app'); if (r.err) return toast(r.err, 'bad'); opAud('Order created', { new: r.o.no }); toast(`Order ${r.o.no} created.`); rerender(); OP_ACT.opView({ dataset: { k: r.o.id } }); };
PT_ACT.ptBfForm = () => { if (!can('portal', 'Add') || !ptIsLearner() || !ptKid()) return; modal('Request a bonafide certificate', `<div class="form-grid">${pcFld('Purpose', `<select id="pb_p">${CT_BF_PURPOSES.map(x => `<option>${x}</option>`).join('')}</select>`)}${pcFld('Note (for Other, or whom it is addressed to)', `<input id="pb_n">`)}</div>`, `<button class="btn pri" data-act="ptBfOk">Send request</button>`); };
PT_ACT.ptBfOk = () => { if (!can('portal', 'Add') || !ptIsLearner()) return; const s = ptKid(); if (!s) return; const e = ctBfNew(s, v('pb_p'), v('pb_n')); if (e) return toast(e, 'bad'); closeModal(); toast('Request sent to the school office.'); rerender(); };
PT_ACT.ptLeaveForm = () => {
  if (!can('portal', 'Add') || !ptKid()) return;
  modal('Request leave', `<div class="form-grid">${pcFld('From', `<input id="pl_f" type="date" value="${PROC_TODAY}">`)}${pcFld('To', `<input id="pl_t" type="date" value="${PROC_TODAY}">`)}${pcFld('Reason', `<input id="pl_r">`)}</div>`, `<button class="btn pri" data-act="ptLeaveOk">Send request</button>`);
};
PT_ACT.ptLeaveOk = () => {
  if (!can('portal', 'Add')) return; const s = ptKid(); if (!s) return;
  if (!ptIsLearner()) return toast('Leave is requested by the family, not in preview.', 'bad');
  const e = atLeaveNew({ adm: s.adm, from: v('pl_f'), to: v('pl_t'), reason: v('pl_r') }); if (e) return toast(e, 'bad');
  closeModal(); toast('Leave request sent to the class teacher.'); rerender();
};
