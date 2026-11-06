/* ===== Calendar and Planner: one calendar per branch combining holidays, exams, meetings, house events and compliance dates with events created here; approval for major events and changes; clash checks; reminders ===== */
const CL_ACT = {};
const CL_TYPES = ['Sports day', 'Annual day', 'Tarbiyah Show', 'Activity / competition', 'Field trip', 'Admission campaign', 'Teacher training', 'Orientation', 'Fee due date', 'Circular deadline', 'Compliance submission', 'Staff event', 'Other'];
const CL_MAJOR = ['Sports day', 'Annual day', 'Tarbiyah Show', 'Field trip', 'Admission campaign'];
const CL_HOLIDAY_OK = ['Sports day', 'Annual day', 'Tarbiyah Show', 'Field trip', 'Admission campaign'];
const CL_AUD = ['Staff', 'Parents', 'Students'];
const CL_SRC = { Event: '#2e7d4f', Holiday: '#c0392b', Exam: '#8e44ad', Meeting: '#2980b9', House: '#e67e22', Compliance: '#7f8c8d', Maintenance: '#b7791f' };
const CL_AY = ['2026-06-01', '2027-05-31'];
Store.init({ cal: { ev: [], log: [] } });
const clD = () => Store.get('cal');
const clCan = k => can('cal', k);
const clSave = d => Store.put('cal', d);
const clAud = (a, o) => audit('Calendar', a, o || {});
function clLog(d, bid, action, o, reason) { const u = App.user || {}; d.log.unshift({ id: 'KL' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), at: nowIso(), bid, branch: (acBr(bid) || {}).name || '', user: u.name || '—', role: u.role || '', action, old: o && o.old != null ? String(o.old) : '', new: o && o.new != null ? String(o.new) : '', reason: reason || '' }); d.log = d.log.slice(0, 5000); }
const clDates = (a, b) => { const o = []; for (let d = a; d <= b && o.length < 400; d = pcAddDays(d, 1)) o.push(d); return o; };
const clSun = d => hrDow(d) === 'Sun';
const clMonthStart = ym => ym + '-01';
const clMonthEnd = ym => { const d = new Date(ym + '-01T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() + 1); d.setUTCDate(0); return d.toISOString().slice(0, 10); };
const clShiftMonth = (ym, n) => { const d = new Date(ym + '-01T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 7); };
const clEvLive = e => ['Approved', 'Pending'].includes(e.state);
/* everything that falls in [from,to] for a branch */
function clItems(bid, from, to) {
  const out = [], push = (date, end, title, src, aud, extra) => { if (end < from || date > to) return; out.push(Object.assign({ date, end: end || date, title, src, aud, state: 'Approved' }, extra || {})); };
  const D = clD();
  clDates(from, to).forEach(d => { const h = hrHoliday(d, bid); if (h) push(d, d, h.name, 'Holiday', CL_AUD); });
  try { exD().exams.filter(e => e.bid === bid && e.state !== 'Draft').forEach(e => { const byDay = {}; exD().papers.filter(p => p.eid === e.id).forEach(p => { (byDay[p.date] = byDay[p.date] || []).push(p); }); Object.entries(byDay).forEach(([d, P]) => push(d, d, `Exam: ${e.name} (${P.length} paper${P.length === 1 ? '' : 's'})`, 'Exam', CL_AUD)); if (!Object.keys(byDay).length) push(e.from, e.to, `Exam window: ${e.name}`, 'Exam', CL_AUD); }); } catch (e) { }
  try { mgD().m.filter(m => m.bid === bid && m.state !== 'Cancelled' && !MG_PRIVATE.includes(m.type)).forEach(m => push(m.date, m.date, `${m.type === MG_TYPES[4] ? 'PTM' : 'Meeting'}: ${m.title}`, 'Meeting', m.type === MG_TYPES[4] ? ['Staff', 'Parents'] : ['Staff'], { time: m.start })); } catch (e) { }
  try { hsD().ev.filter(e => e.bid === bid).forEach(e => push(e.date, e.date, `House event: ${e.name}`, 'House', CL_AUD)); } catch (e) { }
  try { udD().comp.filter(c => c.bid === bid && c.expiry).forEach(c => push(c.expiry, c.expiry, `${c.type} expires`, 'Compliance', ['Staff'])); } catch (e) { }
  try { MMX().pms.filter(p => p.ent === bid && p.active && p.nextDue).forEach(p => { const a = mmAsset(p.asset); push(p.nextDue, p.nextDue, `Preventive maintenance: ${p.cat}${a ? ' · ' + a.name : p.building ? ' · ' + p.building : ''}${p.nextDue < PROC_TODAY ? ' (overdue)' : ''}`, 'Maintenance', ['Staff'], { kind: 'PM', id: p.id }); }); } catch (e) { }
  D.ev.filter(e => e.bid === bid && clEvLive(e)).forEach(e => push(e.from, e.to, e.title + (e.state === 'Pending' ? ' (awaiting approval)' : ''), 'Event', e.aud, { id: e.id, state: e.state, kind: e.type, time: e.start, venue: e.venue }));
  return out.sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));
}
/* validation for a proposed event; returns an error text or '' */
function clValidate(d, bid, o, skipId) {
  if (!o.title || o.title.length < 3) return 'Enter the event title.'; if (!o.from || !o.to) return 'Enter the dates.'; if (o.to < o.from) return 'The end date is before the start date.'; if (o.from < CL_AY[0] || o.to > CL_AY[1]) return `Dates must fall within the academic year (${CL_AY[0]} to ${CL_AY[1]}).`;
  if (!o.aud.length) return 'Choose who the event is for.'; if (o.start && o.end && o.end <= o.start) return 'The end time must be after the start time.';
  if (!CL_HOLIDAY_OK.includes(o.type)) { const bad = clDates(o.from, o.to).find(x => clSun(x) || hrHoliday(x, bid)); if (bad) { const h = hrHoliday(bad, bid); return `${bad} is ${h ? 'a holiday (' + h.name + ')' : 'a Sunday'}. Only sports day, annual day, Tarbiyah show, field trips and admission campaigns can be held on holidays.`; } }
  if (o.aud.includes('Students') && !['Sports day', 'Annual day', 'Tarbiyah Show', 'Field trip', 'Fee due date', 'Circular deadline', 'Compliance submission'].includes(o.type)) { try { const ex = exD().exams.find(e => e.bid === bid && e.state !== 'Draft' && e.from <= o.to && e.to >= o.from); if (ex) return `This overlaps the examination "${ex.name}" (${ex.from} to ${ex.to}). Student events cannot be held during examinations.`; } catch (e) { } }
  if (CL_MAJOR.includes(o.type) || o.major) { const c = d.ev.find(e => e.id !== skipId && e.bid === bid && clEvLive(e) && e.major && e.from <= o.to && e.to >= o.from); if (c) return `This clashes with the major event "${c.title}" (${c.from} to ${c.to}).`; }
  if (d.ev.some(e => e.id !== skipId && e.bid === bid && clEvLive(e) && e.title.toLowerCase() === o.title.toLowerCase() && e.from === o.from)) return 'This event is already on the calendar for that date.';
  return '';
}
const clIsMajor = o => CL_MAJOR.includes(o.type) || o.from !== o.to || (o.aud.includes('Parents') && o.aud.includes('Students') && o.type === 'Other');
PAGES.cal = { title: 'Calendar', mod: 'cal', sf: true, render() {
  const D = clD(), { bid, list } = acBidSel(); if (!list.length) return empty('No branches in your scope for these filters.');
  const tab = pcTab('cld', 'mon'), ym = App.ui.clYm || PROC_TODAY.slice(0, 7), view = App.ui.clAud || '', srcF = App.ui.clSrc || '', me = (App.user || {}).name;
  const pend = D.ev.filter(e => list.some(b => b.id === e.bid) && (e.state === 'Pending' || (e.chg && e.chg.state === 'Pending'))).length;
  const tabs = pcTabs('cld', [['mon', 'Month view'], ['agd', 'Agenda'], ['ev', 'Events'], ['app', 'Approvals', pend], ['rem', 'Reminders'], ['log', 'Audit trail']], 'mon');
  const bsel = `<label class="fld"><span>Branch</span><select data-act="uiSel" data-k="acBid">${list.map(b => `<option value="${esc(b.id)}" ${b.id === bid ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select></label>`;
  const asel = `<label class="fld"><span>View as</span><select data-act="uiSel" data-k="clAud"><option value="">Branch (everything)</option>${CL_AUD.map(a => `<option value="${a}" ${a === view ? 'selected' : ''}>${a === 'Parents' ? 'Parent view' : a === 'Students' ? 'Student view' : 'Teacher / staff view'}</option>`).join('')}</select></label>`;
  const ssel = `<label class="fld"><span>Show</span><select data-act="uiSel" data-k="clSrc"><option value="">All sources</option>${Object.keys(CL_SRC).map(s => `<option ${s === srcF ? 'selected' : ''}>${s}</option>`).join('')}</select></label>`;
  const flt = it => (!view || it.aud.includes(view)) && (!srcF || it.src === srcF) && (!view || view === 'Staff' || it.state === 'Approved') && !(view && view !== 'Staff' && /awaiting approval/.test(it.title));
  let body = '';
  if (tab === 'mon') {
    const from = clMonthStart(ym), to = clMonthEnd(ym), I = clItems(bid, from, to).filter(flt), first = new Date(from + 'T00:00:00Z').getUTCDay(), cells = [];
    for (let i = 0; i < first; i++) cells.push(null); clDates(from, to).forEach(d => cells.push(d)); while (cells.length % 7) cells.push(null);
    const day = App.ui.clDay, rows = []; for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    const head = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(x => `<th style="text-align:center">${x}</th>`).join('');
    const cell = d => { if (!d) return '<td style="background:#f6f8f7"></td>'; const its = I.filter(x => x.date <= d && x.end >= d), hol = its.find(x => x.src === 'Holiday'), off = clSun(d) || hol; return `<td class="click" data-act="clDay" data-k="${d}" style="vertical-align:top;min-width:92px;height:84px;cursor:pointer;${d === PROC_TODAY ? 'outline:2px solid #2e7d4f;' : ''}${off ? 'background:#fdf1ef;' : ''}${day === d ? 'box-shadow:inset 0 0 0 2px #1b5e3a;' : ''}"><b>${+d.slice(8)}</b>${its.slice(0, 3).map(x => `<div style="font-size:11px;line-height:1.2;margin-top:2px;border-left:3px solid ${CL_SRC[x.src]};padding-left:3px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis" title="${esc(x.title)}">${esc(x.title)}</div>`).join('')}${its.length > 3 ? `<div class="muted small">+${its.length - 3} more</div>` : ''}</td>`; };
    const dayList = day ? clItems(bid, day, day).filter(flt) : [];
    body = `<div class="ctrls">${bsel}${asel}${ssel}<button class="btn" data-act="clMonth" data-k="-1">‹ Previous</button><b style="align-self:center">${new Date(from + 'T00:00:00Z').toLocaleString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</b><button class="btn" data-act="clMonth" data-k="1">Next ›</button>${clCan('Add') ? '<button class="btn primary" data-act="clEvForm">Add event</button>' : ''}</div><div class="chips" style="margin:6px 0">${Object.entries(CL_SRC).map(([k, c]) => `<span style="border-left:4px solid ${c};padding-left:5px;margin-right:10px;font-size:12px">${k}</span>`).join('')}<span style="font-size:12px;background:#fdf1ef;padding:0 5px">Sunday or holiday</span></div><div class="tbl-wrap"><table class="tbl" style="table-layout:fixed"><thead><tr>${head}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(cell).join('')}</tr>`).join('')}</tbody></table></div>` + (day ? `<h4>${day} · ${hrDow(day)}</h4>` + (dayList.length ? `<ul>${dayList.map(x => `<li><b style="color:${CL_SRC[x.src]}">${x.src}</b> · ${esc(x.title)}${x.time ? ' · ' + x.time : ''}${x.venue ? ' · ' + esc(x.venue) : ''}${x.end !== x.date ? ` (${x.date} to ${x.end})` : ''}</li>`).join('')}</ul>` : '<p class="muted">Nothing scheduled.</p>') : '');
    return card(`Calendar · ${esc((acBr(bid) || {}).name)}`, tabs + body, { sub: 'Holidays, examinations, meetings, house events and certificate expiries appear automatically from their own modules; events added here show alongside them. Private meetings are not shown.' });
  }
  if (tab === 'agd') {
    const from = App.ui.clFrom || PROC_TODAY, to = App.ui.clTo || pcAddDays(PROC_TODAY, 30), I = clItems(bid, from, to).filter(flt);
    body = `<div class="ctrls">${bsel}${asel}${ssel}<label class="fld"><span>From</span><input type="date" data-act="uiInput" data-k="clFrom" value="${from}"></label><label class="fld"><span>To</span><input type="date" data-act="uiInput" data-k="clTo" value="${to}"></label></div>` + table('clAgd', [{ h: 'Date', k: x => x.end !== x.date ? `${x.date} to ${x.end}` : x.date, t: 'text', x: x => x.date }, { h: 'Day', k: x => hrDow(x.date), t: 'text' }, { h: 'Time', k: x => x.time || '—', t: 'text' }, { h: 'Source', k: x => x.src, t: 'text' }, { h: 'Item', k: x => x.title, t: 'text', cls: 'wrap' }, { h: 'For', k: x => x.aud.length === 3 ? 'Everyone' : x.aud.join(', '), t: 'text' }, { h: 'Venue', k: x => x.venue || '—', t: 'text' }], I, { limit: 200, title: 'Agenda' });
    return card('Agenda', tabs + body, { right: exportBtns('clAgd', 'cal', { label: false }), sub: 'A list of everything between the two dates, ready to export.' });
  }
  if (tab === 'ev') {
    const E = D.ev.filter(e => e.bid === bid).sort((a, b) => b.from.localeCompare(a.from));
    body = `<div class="ctrls">${bsel}${clCan('Add') ? '<button class="btn primary" data-act="clEvForm">Add event</button>' : ''}</div>` + table('clEv', [{ h: 'Event', k: e => e.title, t: 'text', cls: 'wrap' }, { h: 'Type', k: e => e.type + (e.major ? ' · major' : ''), t: 'text' }, { h: 'Dates', k: e => e.from === e.to ? e.from : `${e.from} to ${e.to}`, t: 'text', x: e => e.from }, { h: 'For', k: e => e.aud.join(', '), t: 'text' }, { h: 'Venue', k: e => e.venue || '—', t: 'text' }, { h: 'Status', k: e => pill(e.state + (e.chg && e.chg.state === 'Pending' ? ' · change pending' : ''), e.state === 'Approved' ? 'g' : e.state === 'Pending' ? 'a' : 'r'), t: 'html', x: e => e.state }, { h: '', k: e => clCan('Edit') && clEvLive(e) && !(e.chg && e.chg.state === 'Pending') ? `<button class="btn sm" data-act="clMoveForm" data-k="${e.id}">Change dates</button> <button class="btn sm" data-act="clCancelForm" data-k="${e.id}">Cancel</button>` : '', t: 'html' }], E, { limit: 80, title: 'Events' });
    return card('Events', tabs + body, { right: exportBtns('clEv', 'cal', { label: false }), sub: 'Sports day, annual day, Tarbiyah show, field trips, admission campaigns and anything spanning several days are major events and need approval by someone else before parents and students see them.' });
  }
  if (tab === 'app') {
    const P = D.ev.filter(e => list.some(b => b.id === e.bid) && (e.state === 'Pending' || (e.chg && e.chg.state === 'Pending')));
    body = table('clApp', [{ h: 'Branch', k: e => (acBr(e.bid) || {}).name, t: 'text' }, { h: 'Event', k: e => e.title, t: 'text', cls: 'wrap' }, { h: 'Request', k: e => e.state === 'Pending' ? `New major event, ${e.from === e.to ? e.from : e.from + ' to ' + e.to}` : e.chg.kind === 'cancel' ? `Cancel (${e.chg.reason})` : `Move to ${e.chg.from} – ${e.chg.to} (${e.chg.reason})`, t: 'text', cls: 'wrap' }, { h: 'Raised by', k: e => e.state === 'Pending' ? e.by : e.chg.by, t: 'text' }, { h: '', k: e => { const by = e.state === 'Pending' ? e.by : e.chg.by; return clCan('Approve') && by !== me ? `<button class="btn sm primary" data-act="clDecide" data-k="${e.id}|Approved">Approve</button> <button class="btn sm" data-act="clDecide" data-k="${e.id}|Rejected">Reject</button>` : '<span class="muted">Awaiting another approver</span>'; }, t: 'html' }], P, { limit: 60, title: 'Pending' });
    return card('Calendar approvals', tabs + body, { sub: 'You cannot approve a request you raised yourself.' });
  }
  if (tab === 'rem') {
    const R = D.ev.filter(e => e.bid === bid && e.state === 'Approved' && e.to >= PROC_TODAY && e.from <= pcAddDays(PROC_TODAY, 7)).map(e => ({ e, days: Math.round((new Date(e.from + 'T00:00:00Z') - new Date(PROC_TODAY + 'T00:00:00Z')) / 86400000) }));
    body = `<div class="ctrls">${bsel}</div>` + table('clRem', [{ h: 'Event', k: r => r.e.title, t: 'text', cls: 'wrap' }, { h: 'Starts', k: r => r.e.from, t: 'text' }, { h: 'In (days)', k: r => Math.max(0, r.days), t: 'num' }, { h: 'For', k: r => r.e.aud.join(', '), t: 'text' }, { h: 'Reminders recorded', k: r => (r.e.rem || []).length ? (r.e.rem || []).map(x => tsLabel(x.at)).join('; ') : 'None', t: 'text', cls: 'wrap' }, { h: '', k: r => clCan('Edit') ? `<button class="btn sm primary" data-act="clRemind" data-k="${r.e.id}">Record reminder sent</button>` : '', t: 'html' }], R, { limit: 40, title: 'Starting within 7 days' });
    return card('Reminders', tabs + body, { sub: 'Lists events starting in the next 7 days. This application records that a reminder was sent; the app, email, SMS or WhatsApp message itself is sent outside it.' });
  }
  const L = D.log.filter(e => list.some(b => b.id === e.bid));
  body = clCan('View audit logs') || clCan('Edit') ? table('clLog', [{ h: 'When', k: e => tsLabel(e.at), t: 'text', x: e => e.at }, { h: 'User', k: e => `${esc(e.user)}<br><span class="muted small">${esc(e.role)}</span>`, t: 'html', x: e => e.user }, { h: 'Branch', k: e => e.branch, t: 'text' }, { h: 'Action', k: e => e.action, t: 'text', cls: 'wrap' }, { h: 'Old', k: e => e.old || '—', t: 'text', cls: 'wrap' }, { h: 'New', k: e => e.new || '—', t: 'text', cls: 'wrap' }, { h: 'Reason', k: e => e.reason || '—', t: 'text', cls: 'wrap' }], L, { limit: 100 }) : noAccess('the audit trail');
  return card('Audit trail', tabs + body, { right: exportBtns('clLog', 'cal', { label: false }) });
} };
CL_ACT.clMonth = t => { App.ui.clYm = clShiftMonth(App.ui.clYm || PROC_TODAY.slice(0, 7), +t.dataset.k); App.ui.clDay = ''; rerender(); };
CL_ACT.clDay = t => { App.ui.clDay = t.dataset.k; rerender(); };
CL_ACT.clEvForm = () => {
  if (!clCan('Add')) return; modal('Add calendar event', `<div class="form-grid">${pcFld('Title', '<input id="ce_t">')}${pcFld('Type', pcSel('ce_ty', CL_TYPES, CL_TYPES[0]))}${pcFld('From', `<input id="ce_f" type="date" min="${PROC_TODAY}" value="${App.ui.clDay && App.ui.clDay >= PROC_TODAY ? App.ui.clDay : PROC_TODAY}">`)}${pcFld('To', `<input id="ce_e" type="date" min="${PROC_TODAY}">`)}${pcFld('Start time (optional)', '<input id="ce_a" type="time">')}${pcFld('End time (optional)', '<input id="ce_b" type="time">')}${pcFld('Venue', '<input id="ce_v">')}</div><h4>Who is it for</h4><div class="chips">${CL_AUD.map(a => `<label class="chk"><input type="checkbox" name="ce_au" value="${a}" ${a === 'Staff' ? 'checked' : ''}> ${a}</label>`).join(' ')}</div>${pcFld('Details', '<textarea id="ce_d" rows="2"></textarea>')}`, `<button class="btn primary" data-act="clEvOk">Add</button><button class="btn" data-act="closeModal">Cancel</button>`, true);
};
CL_ACT.clEvOk = async () => {
  const { bid } = acBidSel(), D = clD(), o = { title: (v('ce_t') || '').trim(), type: v('ce_ty'), from: v('ce_f'), to: v('ce_e') || v('ce_f'), start: v('ce_a'), end: v('ce_b'), venue: (v('ce_v') || '').trim(), aud: [...document.querySelectorAll('input[name=ce_au]:checked')].map(x => x.value), desc: (v('ce_d') || '').trim() };
  if (!clCan('Add')) return; if (o.from < PROC_TODAY) return toast('The event cannot start in the past.', 'bad'); o.major = clIsMajor(o); const err = clValidate(D, bid, o); if (err) return toast(err, 'bad');
  const d = Store.clone(D), e = Object.assign(o, { id: 'CE' + Date.now().toString(36), bid, state: o.major ? 'Pending' : 'Approved', by: App.user.name, at: nowIso(), rem: [] }); d.ev.push(e); clLog(d, bid, `Event ${o.major ? 'requested' : 'added'}: ${o.title}`, { new: `${o.type}, ${o.from}${o.to !== o.from ? ' to ' + o.to : ''}, for ${o.aud.join('/')}` }, ''); await clSave(d); closeModal(); toast(o.major ? 'Major event sent for approval.' : 'Event added.', 'ok');
};
CL_ACT.clDecide = t => {
  const [id, st] = t.dataset.k.split('|'), e = clD().ev.find(x => x.id === id); if (!e || !clCan('Approve')) return; const chg = e.state !== 'Pending'; if (chg ? !(e.chg && e.chg.state === 'Pending') : false) return toast('Nothing is waiting for a decision on this event.', 'bad'); const by = chg ? e.chg.by : e.by; if (by === App.user.name) return toast('You raised this, so someone else must decide.', 'bad');
  askReason(st === 'Approved' ? 'Approve' : 'Reject', e.title, async reason => { if (st === 'Rejected' && !reason.trim()) return toast('Say why it is rejected.', 'bad'); const d = Store.clone(clD()), x = d.ev.find(y => y.id === id); if (!x || (chg ? !(x.chg && x.chg.state === 'Pending') : x.state !== 'Pending')) return toast('This was already decided.', 'bad');
    if (!chg) { if (st === 'Approved') { const err = clValidate(d, x.bid, x, x.id); if (err) return toast('Cannot approve: ' + err, 'bad'); } x.state = st === 'Approved' ? 'Approved' : 'Rejected'; x.apprBy = App.user.name; x.apprAt = nowIso(); clLog(d, x.bid, `Event ${st.toLowerCase()}: ${x.title}`, { old: 'Pending', new: x.state }, reason); }
    else { const c = x.chg; if (st === 'Approved') { if (c.kind === 'cancel') { x.state = 'Cancelled'; } else { const err = clValidate(d, x.bid, Object.assign({}, x, { from: c.from, to: c.to }), x.id); if (err) return toast('Cannot approve: ' + err, 'bad'); x.from = c.from; x.to = c.to; } } clLog(d, x.bid, `Change ${st.toLowerCase()}: ${x.title}`, { old: `${c.oldFrom} to ${c.oldTo}`, new: c.kind === 'cancel' ? 'Cancelled' : `${c.from} to ${c.to}` }, reason || c.reason); x.chg = Object.assign({}, c, { state: st, decBy: App.user.name, decAt: nowIso() }); }
    await clSave(d); clAud(`Calendar ${st} ${id}`, { reason }); rerender(); });
};
const clChange = (t, kind) => {
  const e = clD().ev.find(x => x.id === t.dataset.k); if (!e || !clCan('Edit')) return;
  modal(kind === 'cancel' ? 'Cancel event' : 'Change event dates', `<p><b>${esc(e.title)}</b> · ${e.from}${e.to !== e.from ? ' to ' + e.to : ''}${e.major ? '<br><span class="small">This is a major event, so the change needs approval by someone else.</span>' : ''}</p>${kind === 'cancel' ? '' : `<div class="form-grid">${pcFld('New start', `<input id="cm_f" type="date" min="${PROC_TODAY}" value="${e.from}">`)}${pcFld('New end', `<input id="cm_e" type="date" min="${PROC_TODAY}" value="${e.to}">`)}</div>`}${pcFld('Reason', '<input id="cm_r">')}`, `<button class="btn primary" data-act="clChangeOk" data-k="${e.id}|${kind}">Submit</button><button class="btn" data-act="closeModal">Cancel</button>`);
};
CL_ACT.clMoveForm = t => clChange(t, 'move'); CL_ACT.clCancelForm = t => clChange(t, 'cancel');
CL_ACT.clChangeOk = async t => {
  const [id, kind] = t.dataset.k.split('|'), D = clD(), e = D.ev.find(x => x.id === id), reason = (v('cm_r') || '').trim(); if (!e || !clCan('Edit')) return; if (!clEvLive(e) || (e.chg && e.chg.state === 'Pending')) return toast('This event cannot be changed now (cancelled, or a change is already waiting).', 'bad'); if (reason.length < 5) return toast('Give a reason (at least 5 characters).', 'bad');
  const c = { kind, reason, by: App.user.name, at: nowIso(), oldFrom: e.from, oldTo: e.to, state: 'Pending' };
  if (kind === 'move') { c.from = v('cm_f'); c.to = v('cm_e') || c.from; if (c.from < PROC_TODAY) return toast('The new date cannot be in the past.', 'bad'); if (c.from === e.from && c.to === e.to) return toast('The dates are unchanged.', 'bad'); const err = clValidate(D, e.bid, Object.assign({}, e, { from: c.from, to: c.to }), e.id); if (err) return toast(err, 'bad'); }
  const d = Store.clone(D), x = d.ev.find(y => y.id === id);
  if (e.major && e.state === 'Approved' && !clCan('Approve')) { x.chg = c; clLog(d, x.bid, `Change requested: ${x.title}`, { old: `${c.oldFrom} to ${c.oldTo}`, new: kind === 'cancel' ? 'Cancel' : `${c.from} to ${c.to}` }, reason); }
  else if (e.major && e.state === 'Approved') { x.chg = c; clLog(d, x.bid, `Change requested: ${x.title}`, { old: `${c.oldFrom} to ${c.oldTo}`, new: kind === 'cancel' ? 'Cancel' : `${c.from} to ${c.to}` }, reason); }
  else { if (kind === 'cancel') x.state = 'Cancelled'; else { x.from = c.from; x.to = c.to; x.major = clIsMajor(x); } x.chg = Object.assign(c, { state: 'Approved', decBy: App.user.name, decAt: nowIso() }); clLog(d, x.bid, `Event ${kind === 'cancel' ? 'cancelled' : 'moved'}: ${x.title}`, { old: `${c.oldFrom} to ${c.oldTo}`, new: kind === 'cancel' ? 'Cancelled' : `${c.from} to ${c.to}` }, reason); }
  await clSave(d); closeModal(); toast(x.chg.state === 'Pending' ? 'Change sent for approval.' : 'Done.', 'ok');
};
CL_ACT.clRemind = async t => { const d = Store.clone(clD()), e = d.ev.find(x => x.id === t.dataset.k); if (!e || !clCan('Edit')) return; e.rem = (e.rem || []).concat([{ at: nowIso(), by: App.user.name }]); clLog(d, e.bid, `Reminder recorded: ${e.title}`, { new: `to ${e.aud.join(', ')}` }, ''); await clSave(d); toast('Recorded.', 'ok'); };
