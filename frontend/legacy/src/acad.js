/* ===== Academic Management: subject-teacher allocation, timetable, syllabus tracker, lesson plans, substitutions ===== */
const AC_ACT = {};
const AC_BANDS = { 'Pre-primary': ['English', 'Second language', 'Numeracy', 'Environmental studies', 'Art & craft', 'Rhymes & stories', 'Physical activity'], 'Primary': ['English', 'Hindi', 'Urdu / Telugu', 'Mathematics', 'Environmental science', 'Social studies', 'Computer', 'Deeniyat', 'Art', 'Physical education'], 'Secondary': ['English', 'Hindi', 'Urdu / Telugu', 'Mathematics', 'Science', 'Social studies', 'Computer science', 'Deeniyat', 'Art', 'Physical education'], 'Inter': ['English', 'Physics', 'Chemistry', 'Mathematics', 'Botany', 'Zoology', 'Second language'], 'Degree': ['English', 'Accounting', 'Business economics', 'Computer applications', 'Statistics', 'Management'] };
const AC_CLASS_ORDER = ['Nursery', 'LKG', 'UKG', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'Inter 1st Year', 'Inter 2nd Year', 'B.Com Year 1', 'B.Com Year 2', 'B.Com Year 3', 'B.Sc Year 1', 'B.Sc Year 2', 'BBA Year 1'];
Store.init({ acad: { cfg: { periods: 8, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], maxLoad: 30, delayPts: 20, subjects: AC_BANDS }, alloc: [], tt: {}, units: [], plans: [], subs: [], log: [] } });
const acD = () => Store.get('acad');
const acBand = c => /^(Nursery|LKG|UKG)$/.test(c) ? 'Pre-primary' : /^(I|II|III|IV|V)$/.test(c) ? 'Primary' : /^(VI|VII|VIII|IX|X)$/.test(c) ? 'Secondary' : /Inter/.test(c) ? 'Inter' : 'Degree';
const acBr = bid => DATA.branches.find(b => b.id === bid);
const acDay = d => hrDow(d);
const acActive = e => ['Active', 'Probation', 'Notice'].includes(e.status);
const acTeachers = bid => hrEmps().filter(e => e.bid === bid && e.cat === 'Teaching' && acActive(e));
const acEmpName = id => (hrEmp(id) || {}).name || id || '—';
const acMe = () => { try { return hrEmpOfUser(); } catch (e) { return null; } };
function acSections(bid) { const out = []; try { [...Str.secKeys(bid, D_()).keys()].forEach(k => { const [c, s] = k.split('|'); out.push({ cls: c, sec: s }); }); } catch (e) { } return out.sort((a, b) => (AC_CLASS_ORDER.indexOf(a.cls) - AC_CLASS_ORDER.indexOf(b.cls)) || a.sec.localeCompare(b.sec)); }
const acSecKey = (c, s) => c + '|' + s;
function acBidSel() { const idx = scopeIdx(), L = idx.map(i => DATA.branches[i]); let b = App.ui.acBid; if (!L.some(x => x.id === b)) b = (App.f.branch && L.some(x => x.id === App.f.branch) ? App.f.branch : (L[0] || {}).id); return { bid: b, list: L }; }
function acLog(d, bid, action, o, reason) { const u = App.user || {}; d.log.unshift({ id: 'AL' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), at: nowIso(), bid, branch: (acBr(bid) || {}).name || '', user: u.name || '—', role: u.role || '', action, old: o && o.old != null ? String(o.old) : '', new: o && o.new != null ? String(o.new) : '', reason: reason || '' }); d.log = d.log.slice(0, 3000); }
async function acSave(d) { await Store.put('acad', d); }
const acAuditIt = (action, o) => audit('Academic Management', action, o || {});
const acLoad = (d, empId) => d.alloc.filter(a => a.teacher === empId).reduce((s, a) => s + (+a.periods || 0), 0);
const acCan = k => can('acad', k);
/* a teacher user may act only on their own allocations; Principals / HODs / admins on every section in scope */
const acManager = () => acCan('Approve') || acCan('Edit');
const acMine = a => { const me = acMe(); return !!(me && a.teacher === me.id); };
function acUnitState(u) {
  const today = PROC_TODAY, span = Math.max(1, (new Date(u.to) - new Date(u.from)) / 864e5), exp = Math.max(0, Math.min(100, Math.round((new Date(today) - new Date(u.from)) / 864e5 / span * 100))), pct = +u.pct || 0;
  const late = pct < 100 && (today > u.to || exp - pct >= (acD().cfg.delayPts || 20)); return { exp, pct, late, state: pct >= 100 ? 'Completed' : pct > 0 ? 'In progress' : 'Not started' };
}
PAGES.acad = { title: 'Academic Management', mod: 'acad', sf: true, render() {
  const D = acD(), { bid, list } = acBidSel(); if (!list.length) return empty('No branches in your scope for these filters.');
  const tab = pcTab('ac', 'dash'), tabs = pcTabs('ac', [['dash', 'Overview'], ['alloc', 'Subject-teacher allocation'], ['tt', 'Timetable'], ['syl', 'Syllabus tracker'], ['plan', 'Lesson plans', D.plans.filter(p => p.state === 'Submitted' && list.some(b => b.id === p.bid)).length], ['sub', 'Substitutions'], ['cfg', 'Setup'], ['log', 'Change log']], 'dash');
  const bsel = `<label class="fld"><span>Branch</span><select data-act="uiSel" data-k="acBid">${list.map(b => `<option value="${esc(b.id)}" ${b.id === bid ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select></label>`;
  let body = '';
  if (tab === 'dash') {
    const ids = new Set(list.map(b => b.id)), rows = list.map(b => { const T = acTeachers(b.id), S = acSections(b.id), al = D.alloc.filter(a => a.bid === b.id), U = D.units.filter(u => u.bid === b.id).map(u => Object.assign({ u }, acUnitState(u))), slots = Object.values(D.tt[b.id] || {}).reduce((n, g) => n + Object.keys(g).length, 0), need = S.length * D.cfg.days.length * D.cfg.periods, pl = D.plans.filter(p => p.bid === b.id); const over = T.filter(e => acLoad(D, e.id) > D.cfg.maxLoad).length; const secsAl = new Set(al.map(a => acSecKey(a.cls, a.sec))).size; return { b: b.name, bid: b.id, t: T.length, sec: S.length, secAl: secsAl, load: T.length ? Math.round(al.reduce((s, a) => s + (+a.periods || 0), 0) / T.length) : 0, over, tt: need ? Math.round(slots / need * 100) : 0, units: U.length, done: U.filter(x => x.state === 'Completed').length, late: U.filter(x => x.late).length, pend: pl.filter(p => p.state === 'Submitted').length }; });
    const T = rows.reduce((a, r) => (['t', 'sec', 'secAl', 'over', 'units', 'done', 'late', 'pend'].forEach(k => a[k] += r[k]), a), { t: 0, sec: 0, secAl: 0, over: 0, units: 0, done: 0, late: 0, pend: 0 });
    body = `<div class="kpis k4"><div class="kpi"><span>Teachers</span><b>${NUM(T.t)}</b></div><div class="kpi"><span>Sections with allocation</span><b>${NUM(T.secAl)} / ${NUM(T.sec)}</b></div><div class="kpi"><span>Teachers over the workload limit</span><b>${NUM(T.over)}</b></div><div class="kpi"><span>Syllabus units delayed</span><b>${NUM(T.late)}</b></div></div>` + table('acOv', [{ h: 'Branch', k: r => r.b, t: 'text', cls: 'wrap' }, { h: 'Teachers', k: r => r.t, t: 'num' }, { h: 'Sections', k: r => r.sec, t: 'num' }, { h: 'Allocated sections', k: r => r.secAl, t: 'num' }, { h: 'Avg periods / teacher', k: r => r.load, t: 'num' }, { h: 'Over limit', k: r => r.over, t: 'num' }, { h: 'Timetable filled %', k: r => r.tt, t: 'num' }, { h: 'Syllabus units', k: r => r.units, t: 'num' }, { h: 'Completed', k: r => r.done, t: 'num' }, { h: 'Delayed', k: r => r.late, t: 'num' }, { h: 'Plans awaiting approval', k: r => r.pend, t: 'num' }], rows, { limit: 40 });
    return card('Academic overview', tabs + body, { right: exportBtns('acOv', 'acad', { label: false }), sub: `Academic year ${CUR_AY}. Teachers come from the HR employee master; sections come from the branch section master.` });
  }
  if (tab === 'alloc') {
    const al = D.alloc.filter(a => a.bid === bid), T = acTeachers(bid);
    const wl = T.map(e => ({ e, n: acLoad(D, e.id), secs: new Set(al.filter(a => a.teacher === e.id).map(a => acSecKey(a.cls, a.sec))).size })).sort((a, b) => b.n - a.n);
    body = `<div class="ctrls">${bsel}${acCan('Add') ? '<button class="btn primary" data-act="acAllocForm">Add allocation</button>' : ''}</div>` +
      table('acAl', [{ h: 'Class', k: a => a.cls, t: 'text' }, { h: 'Section', k: a => a.sec, t: 'text' }, { h: 'Subject', k: a => a.subject, t: 'text' }, { h: 'Teacher', k: a => acEmpName(a.teacher), t: 'text' }, { h: 'Periods / week', k: a => a.periods, t: 'num' }, { h: 'In timetable', k: a => acPlaced(bid, a), t: 'num' }, { h: '', k: a => acCan('Edit') ? `<button class="btn sm" data-act="acAllocDel" data-k="${a.id}">Remove</button>` : '', t: 'html' }], al.sort((a, b) => (AC_CLASS_ORDER.indexOf(a.cls) - AC_CLASS_ORDER.indexOf(b.cls)) || a.sec.localeCompare(b.sec)), { limit: 60, title: 'Allocations' }) +
      card('Teacher workload', table('acWl', [{ h: 'Teacher', k: r => r.e.name, t: 'text' }, { h: 'Designation', k: r => r.e.desig, t: 'text' }, { h: 'Subject (HR)', k: r => r.e.subject || '—', t: 'text' }, { h: 'Sections', k: r => r.secs, t: 'num' }, { h: 'Periods / week', k: r => r.n, t: 'num' }, { h: 'Limit', k: r => r.n > D.cfg.maxLoad ? 'Over limit' : r.n === 0 ? 'Unallocated' : 'OK', t: 'text' }], wl, { limit: 40 }), { sub: `Maximum ${D.cfg.maxLoad} periods a week per teacher (Setup).` });
    return card('Subject-teacher allocation', tabs + body);
  }
  if (tab === 'tt') {
    const S = acSections(bid), key = App.ui.acSec && S.some(s => acSecKey(s.cls, s.sec) === App.ui.acSec) ? App.ui.acSec : (S[0] ? acSecKey(S[0].cls, S[0].sec) : ''), view = App.ui.acTv || 'class', teachers = acTeachers(bid), tid = App.ui.acTeach && teachers.some(e => e.id === App.ui.acTeach) ? App.ui.acTeach : (teachers[0] || {}).id;
    const grid = (cell) => `<div class="tblwrap"><table class="tbl"><thead><tr><th>Day</th>${Array.from({ length: D.cfg.periods }, (_, i) => `<th>P${i + 1}</th>`).join('')}</tr></thead><tbody>${D.cfg.days.map(d => `<tr><th>${d}</th>${Array.from({ length: D.cfg.periods }, (_, i) => `<td>${cell(d, i + 1)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    const sel = `<div class="ctrls">${bsel}<label class="fld"><span>View</span><select data-act="uiSel" data-k="acTv"><option value="class" ${view === 'class' ? 'selected' : ''}>Class timetable</option><option value="teacher" ${view === 'teacher' ? 'selected' : ''}>Teacher timetable</option></select></label>${view === 'class' ? `<label class="fld"><span>Class and section</span><select data-act="uiSel" data-k="acSec">${S.map(s => `<option value="${esc(acSecKey(s.cls, s.sec))}" ${acSecKey(s.cls, s.sec) === key ? 'selected' : ''}>${esc(s.cls)} ${esc(s.sec)}</option>`).join('')}</select></label>` : `<label class="fld"><span>Teacher</span><select data-act="uiSel" data-k="acTeach">${teachers.map(e => `<option value="${e.id}" ${e.id === tid ? 'selected' : ''}>${esc(e.name)}</option>`).join('')}</select></label>`}</div>`;
    if (view === 'class') {
      const T = (D.tt[bid] || {})[key] || {}, cell = (d, p) => { const c = T[d + '-' + p], a = c && D.alloc.find(x => x.id === c.aid); const lbl = a ? `<b>${esc(a.subject)}</b><br><span class="muted small">${esc(acEmpName(a.teacher))}${c.room ? ' · ' + esc(c.room) : ''}</span>` : '<span class="muted">—</span>'; return acCan('Edit') ? `<button class="btn sm" data-act="acSlot" data-k="${esc(key)}|${d}|${p}">${lbl}</button>` : lbl; };
      body = sel + (acCan('Edit') ? `<div class="btns" style="margin:6px 0"><button class="btn primary" data-act="tgForm">Generate timetable</button><button class="btn" data-act="tgCheck">Check clashes</button></div>` : '') + (key ? grid(cell) : empty('This branch has no sections yet.')) + `<p class="small">Each subject can use only as many periods as its allocation allows, and a teacher cannot be in two sections in the same period.</p>`;
    } else {
      const cell = (d, p) => { for (const [k, g] of Object.entries(D.tt[bid] || {})) { const c = g[d + '-' + p], a = c && D.alloc.find(x => x.id === c.aid); if (a && a.teacher === tid) return `<b>${esc(a.cls)} ${esc(a.sec)}</b><br><span class="muted small">${esc(a.subject)}${c.room ? ' · ' + esc(c.room) : ''}</span>`; } return '<span class="muted">free</span>'; };
      body = sel + grid(cell);
    }
    return card('Timetable', tabs + body);
  }
  if (tab === 'syl') {
    const U = D.units.filter(u => u.bid === bid).map(u => Object.assign({ u }, acUnitState(u))).sort((a, b) => (b.late - a.late) || a.u.from.localeCompare(b.u.from));
    const K = { n: U.length, done: U.filter(x => x.state === 'Completed').length, late: U.filter(x => x.late).length };
    body = `<div class="ctrls">${bsel}${acCan('Add') ? '<button class="btn primary" data-act="acUnitForm">Add syllabus unit</button>' : ''}</div><div class="kpis k4"><div class="kpi"><span>Units planned</span><b>${NUM(K.n)}</b></div><div class="kpi"><span>Completed</span><b>${NUM(K.done)}</b></div><div class="kpi"><span>Delayed</span><b>${NUM(K.late)}</b></div><div class="kpi"><span>Average completion</span><b>${K.n ? Math.round(U.reduce((s, x) => s + x.pct, 0) / K.n) : 0}%</b></div></div>` +
      table('acU', [{ h: 'Class', k: x => x.u.cls, t: 'text' }, { h: 'Subject', k: x => x.u.subject, t: 'text' }, { h: 'Term', k: x => x.u.term, t: 'text' }, { h: 'Unit / chapter', k: x => x.u.title, t: 'text', cls: 'wrap' }, { h: 'Planned', k: x => `${x.u.from} → ${x.u.to}`, t: 'text' }, { h: 'Periods', k: x => x.u.periods, t: 'num' }, { h: 'Expected %', k: x => x.exp, t: 'num' }, { h: 'Done %', k: x => x.pct, t: 'num' }, { h: 'Status', k: x => x.late ? pill('Delayed', 'r') : pill(x.state, x.state === 'Completed' ? 'g' : 'a'), t: 'html', x: x => (x.late ? 'Delayed' : x.state) }, { h: '', k: x => acUnitCan(x.u) ? `<button class="btn sm" data-act="acUnitUpd" data-k="${x.u.id}">Update</button>` : '', t: 'html' }], U, { limit: 60, title: 'Syllabus units' });
    return card('Syllabus completion tracker', tabs + body, { right: exportBtns('acU', 'acad', { label: false }), sub: 'A unit is delayed when its completion is 20 points (Setup) behind the planned timeline, or the planned end date has passed.' });
  }
  if (tab === 'plan') {
    const P = D.plans.filter(p => p.bid === bid).sort((a, b) => b.week.localeCompare(a.week)), me = acMe();
    body = `<div class="ctrls">${bsel}${acCan('Submit') || acCan('Add') ? '<button class="btn primary" data-act="acPlanForm">New lesson plan</button>' : ''}</div>` + table('acP', [{ h: 'Week of', k: p => p.week, t: 'text' }, { h: 'Class', k: p => `${p.cls} ${p.sec}`, t: 'text' }, { h: 'Subject', k: p => p.subject, t: 'text' }, { h: 'Teacher', k: p => acEmpName(p.teacher), t: 'text' }, { h: 'Topic', k: p => p.topic, t: 'text', cls: 'wrap' }, { h: 'Status', k: p => pill(p.state, p.state === 'Approved' ? 'g' : p.state === 'Returned' ? 'r' : 'a'), t: 'html', x: p => p.state }, { h: '', k: p => acPlanBtns(p), t: 'html' }], P, { limit: 60, title: 'Lesson plans', rowAct: 'acPlanOpen', rowKey: p => p.id });
    return card('Lesson plans', tabs + body, { sub: 'Teachers draft and submit; the Principal or HOD approves or returns with a comment. Nobody approves their own plan.' });
  }
  if (tab === 'sub') {
    const date = App.ui.acDate || PROC_TODAY, day = acDay(date), T = acTeachers(bid), gone = T.filter(e => { const a = hrAtt(e, date); return a && ['Absent', 'On leave'].includes(a.status); }), rows = [];
    gone.forEach(e => Object.entries(D.tt[bid] || {}).forEach(([key, g]) => { for (let p = 1; p <= D.cfg.periods; p++) { const c = g[day + '-' + p], a = c && D.alloc.find(x => x.id === c.aid); if (a && a.teacher === e.id) { const s = D.subs.find(x => x.bid === bid && x.date === date && x.key === key && x.period === p); rows.push({ e, key, p, a, s }); } } }));
    body = `<div class="ctrls">${bsel}<label class="fld"><span>Date</span><input type="date" value="${date}" data-act="pcDate" data-k="acDate"></label></div><p class="small">${gone.length} teacher${gone.length === 1 ? ' is' : 's are'} absent or on leave on ${date} (${day}) according to HR attendance. ${day === 'Sun' ? 'It is a Sunday, so the timetable has no periods.' : ''}</p>` + (rows.length ? table('acSub', [{ h: 'Period', k: r => 'P' + r.p, t: 'text' }, { h: 'Class', k: r => r.key.replace('|', ' '), t: 'text' }, { h: 'Subject', k: r => r.a.subject, t: 'text' }, { h: 'Absent teacher', k: r => r.e.name, t: 'text' }, { h: 'Substitute', k: r => r.s ? `${esc(acEmpName(r.s.sub))} ${pill(r.s.state, r.s.state === 'Approved' ? 'g' : 'a')}` : '<span class="muted">Not arranged</span>', t: 'html', x: r => r.s ? acEmpName(r.s.sub) : '' }, { h: '', k: r => acCan('Approve') && !r.s ? `<button class="btn sm primary" data-act="acSubForm" data-k="${esc(r.key)}|${r.p}|${r.e.id}">Arrange</button>` : '', t: 'html' }], rows, { limit: 80 }) : empty('No periods need a substitute.'));
    return card('Substitution arrangements', tabs + body);
  }
  if (tab === 'cfg') {
    const c = D.cfg;
    body = `<div class="form-grid">${pcFld('Periods per day', `<input id="ac_per" type="number" min="4" max="12" value="${c.periods}">`)}${pcFld('Maximum periods per teacher per week', `<input id="ac_max" type="number" min="10" max="48" value="${c.maxLoad}">`)}${pcFld('Syllabus delay threshold (points behind plan)', `<input id="ac_dl" type="number" min="5" max="60" value="${c.delayPts}">`)}${pcFld('Working days', `<input id="ac_days" value="${esc(c.days.join(','))}">`)}</div>${acCan('Edit') ? '<button class="btn primary" data-act="acCfgOk">Save setup</button>' : ''}<h4>Subjects by stage</h4><p class="small">Edit the subject list for each stage; separate subjects with commas.</p>${Object.entries(c.subjects).map(([k, v]) => pcFld(k, `<input id="acs_${k.replace(/\W/g, '')}" value="${esc(v.join(', '))}" ${acCan('Edit') ? '' : 'disabled'}>`)).join('')}`;
    return card('Academic setup', tabs + body);
  }
  const L = D.log.filter(e => list.some(b => b.id === e.bid) || !e.bid);
  body = acCan('View audit logs') || acCan('Edit') ? table('acLog', [{ h: 'When', k: e => tsLabel(e.at), t: 'text', x: e => e.at }, { h: 'User', k: e => `${esc(e.user)}<br><span class="muted small">${esc(e.role)}</span>`, t: 'html', x: e => e.user }, { h: 'Branch', k: e => e.branch || 'All', t: 'text' }, { h: 'Action', k: e => e.action, t: 'text', cls: 'wrap' }, { h: 'Old', k: e => e.old || '—', t: 'text', cls: 'wrap' }, { h: 'New', k: e => e.new || '—', t: 'text', cls: 'wrap' }, { h: 'Reason', k: e => e.reason || '—', t: 'text', cls: 'wrap' }], L, { limit: 100 }) : noAccess('the change log');
  return card('Change log', tabs + body, { right: exportBtns('acLog', 'acad', { label: false }) });
} };
const acPlaced = (bid, a) => Object.entries((acD().tt[bid] || {})[acSecKey(a.cls, a.sec)] || {}).filter(([, c]) => c.aid === a.id).length;
const acUnitCan = u => acManager() || acD().alloc.some(a => a.bid === u.bid && a.cls === u.cls && a.subject === u.subject && acMine(a));
function acPlanBtns(p) {
  const me = acMe(); let b = '';
  if (p.state === 'Draft' || p.state === 'Returned') { if ((acCan('Submit') || acCan('Add')) && (acManager() || (me && p.teacher === me.id))) b += `<button class="btn sm primary" data-act="acPlanSubmit" data-k="${p.id}">Submit</button>`; }
  if (p.state === 'Submitted' && acCan('Approve') && p.by !== (App.user || {}).name) b += `<button class="btn sm primary" data-act="acPlanDecide" data-k="${p.id}" data-v="Approved">Approve</button> <button class="btn sm" data-act="acPlanDecide" data-k="${p.id}" data-v="Returned">Return</button>`;
  return b;
}
/* ---------- allocation ---------- */
AC_ACT.acAllocForm = () => {
  const { bid } = acBidSel(), D = acD(), S = acSections(bid), T = acTeachers(bid); if (!acCan('Add')) return;
  modal('Add subject-teacher allocation', `<p class="small">${esc((acBr(bid) || {}).name)}</p><div class="form-grid">${pcFld('Class and section', `<select id="al_sec" data-act="acAlSec">${S.map(s => `<option value="${esc(acSecKey(s.cls, s.sec))}">${esc(s.cls)} ${esc(s.sec)}</option>`).join('')}</select>`)}${pcFld('Subject', `<select id="al_sub">${(D.cfg.subjects[acBand(S[0] ? S[0].cls : '')] || []).map(x => `<option>${esc(x)}</option>`).join('')}</select>`)}${pcFld('Teacher', `<select id="al_t">${T.map(e => `<option value="${e.id}">${esc(e.name)} · ${esc(e.subject || e.desig)} · ${acLoad(D, e.id)}/${D.cfg.maxLoad} periods</option>`).join('')}</select>`)}${pcFld('Periods per week', '<input id="al_n" type="number" min="1" max="12" value="5">')}</div>`, `<button class="btn primary" data-act="acAllocOk">Save</button><button class="btn" data-act="closeModal">Cancel</button>`);
};
AC_ACT.acAlSec = t => { const D = acD(), c = String(t.value).split('|')[0], sel = document.getElementById('al_sub'); if (sel) sel.innerHTML = (D.cfg.subjects[acBand(c)] || []).map(x => `<option>${esc(x)}</option>`).join(''); };
AC_ACT.acAllocOk = () => {
  const { bid } = acBidSel(), D = acD(), [cls, sec] = (v('al_sec') || '').split('|'), subject = v('al_sub'), teacher = v('al_t'), n = +v('al_n'); if (!cls || !subject || !teacher) return toast('Choose section, subject and teacher.', 'bad'); if (!(n >= 1)) return toast('Enter periods per week.', 'bad');
  if (D.alloc.some(a => a.bid === bid && a.cls === cls && a.sec === sec && a.subject === subject)) return toast('This subject is already allocated to that section. Remove it first to change the teacher.', 'bad');
  if (acLoad(D, teacher) + n > D.cfg.maxLoad) return toast(`${acEmpName(teacher)} would have ${acLoad(D, teacher) + n} periods a week; the limit is ${D.cfg.maxLoad}.`, 'bad');
  const secTotal = D.alloc.filter(a => a.bid === bid && a.cls === cls && a.sec === sec).reduce((s, a) => s + (+a.periods), 0) + n, cap = D.cfg.days.length * D.cfg.periods; if (secTotal > cap) return toast(`The section would need ${secTotal} periods a week but the timetable has only ${cap}.`, 'bad');
  askReason('Save allocation', `${cls} ${sec} · ${subject} · ${acEmpName(teacher)} · ${n} periods a week`, async reason => { const d = Store.clone(acD()); d.alloc.push({ id: 'AA' + Date.now().toString(36), bid, cls, sec, subject, teacher, periods: n }); acLog(d, bid, `Allocation added: ${cls} ${sec} ${subject}`, { new: `${acEmpName(teacher)}, ${n} periods` }, reason); await acSave(d); acAuditIt(`Allocation added ${bid} ${cls} ${sec} ${subject}`, { new: `${teacher}, ${n}`, reason }); toast('Allocation saved.', 'ok'); });
};
AC_ACT.acAllocDel = t => {
  const D = acD(), a = D.alloc.find(x => x.id === t.dataset.k); if (!a || !acCan('Edit')) return; if (acPlaced(a.bid, a)) return toast('Remove this subject from the timetable first.', 'bad');
  askReason('Remove allocation', `${a.cls} ${a.sec} · ${a.subject} · ${acEmpName(a.teacher)}`, async reason => { const d = Store.clone(acD()); d.alloc = d.alloc.filter(x => x.id !== a.id); acLog(d, a.bid, `Allocation removed: ${a.cls} ${a.sec} ${a.subject}`, { old: `${acEmpName(a.teacher)}, ${a.periods} periods` }, reason); await acSave(d); acAuditIt(`Allocation removed ${a.id}`, { old: a.teacher, reason }); rerender(); });
};
/* ---------- timetable ---------- */
AC_ACT.acSlot = t => {
  const [c0, s0, day, p] = t.dataset.k.split('|'), key = c0 + '|' + s0, { bid } = acBidSel(), D = acD(), [cls, sec] = key.split('|'), al = D.alloc.filter(a => a.bid === bid && a.cls === cls && a.sec === sec), cur = (((D.tt[bid] || {})[key]) || {})[day + '-' + p];
  if (!al.length) return toast('Allocate subjects and teachers to this section first.', 'bad');
  modal(`${cls} ${sec} · ${day} period ${p}`, pcFld('Subject (teacher)', pcSel('sl_a', al.map(a => [a.id, `${a.subject} – ${acEmpName(a.teacher)} (${acPlaced(bid, a)}/${a.periods} used)`]), cur ? cur.aid : '', '— free period —')) + pcFld('Room', `<input id="sl_room" value="${esc(cur ? cur.room || '' : '')}" placeholder="e.g. Room 12 / Lab 2">`), `<button class="btn primary" data-act="acSlotOk" data-k="${esc(t.dataset.k)}">Save</button><button class="btn" data-act="closeModal">Cancel</button>`);
};
AC_ACT.acSlotOk = async t => {
  const [c1, s1, day, p] = t.dataset.k.split('|'), key = c1 + '|' + s1, { bid } = acBidSel(), D = acD(), aid = v('sl_a'), room = (v('sl_room') || '').trim(), slot = day + '-' + p, cur = (((D.tt[bid] || {})[key]) || {})[slot];
  if (aid) {
    const a = D.alloc.find(x => x.id === aid); if (!a) return;
    for (const [k2, g] of Object.entries(D.tt[bid] || {})) { if (k2 === key) continue; const c = g[slot], b = c && D.alloc.find(x => x.id === c.aid); if (b && b.teacher === a.teacher) return toast(`${acEmpName(a.teacher)} is already teaching ${k2.replace('|', ' ')} in this period.`, 'bad'); }
    if ((!cur || cur.aid !== aid) && acPlaced(bid, a) >= a.periods) return toast(`${a.subject} already uses all ${a.periods} periods a week for this section.`, 'bad');
    if (room) for (const [k2, g] of Object.entries(D.tt[bid] || {})) { if (k2 === key) continue; const c = g[slot]; if (c && c.room && c.room.toLowerCase() === room.toLowerCase()) return toast(`Room ${room} is already used by ${k2.replace('|', ' ')} in this period.`, 'bad'); }
  }
  const d = Store.clone(acD()); d.tt[bid] = d.tt[bid] || {}; const g = d.tt[bid][key] = d.tt[bid][key] || {}; const old = cur ? `${(D.alloc.find(x => x.id === cur.aid) || {}).subject || ''}${cur.room ? ' / ' + cur.room : ''}` : '';
  if (aid) g[slot] = { aid, room }; else delete g[slot]; const nw = aid ? `${d.alloc.find(x => x.id === aid).subject}${room ? ' / ' + room : ''}` : '';
  if (old === nw) return closeModal(); acLog(d, bid, `Timetable ${key.replace('|', ' ')} ${day} P${p}`, { old, new: nw }, ''); await acSave(d); acAuditIt(`Timetable ${bid} ${key} ${slot}`, { old, new: nw }); closeModal();
};
/* ---------- setup ---------- */
AC_ACT.acCfgOk = () => {
  if (!acCan('Edit')) return; const per = +v('ac_per'), mx = +v('ac_max'), dl = +v('ac_dl'), days = (v('ac_days') || '').split(',').map(x => x.trim()).filter(Boolean);
  if (!(per >= 4 && per <= 12) || !(mx >= 10) || !(dl >= 5) || !days.length || days.some(x => !['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].includes(x))) return toast('Check the values: periods 4–12, a workload limit of at least 10, a delay threshold of at least 5, and working days such as Mon,Tue,Wed.', 'bad');
  const subj = {}; Object.keys(acD().cfg.subjects).forEach(k => { const val = (v('acs_' + k.replace(/\W/g, '')) || '').split(',').map(x => x.trim()).filter(Boolean); subj[k] = val.length ? val : acD().cfg.subjects[k]; });
  const D0 = acD().cfg; if (per < D0.periods && Object.values(acD().tt).some(b => Object.values(b).some(g => Object.keys(g).some(s => +s.split('-')[1] > per)))) return toast('Some timetable periods fall beyond the new number of periods. Clear them first.', 'bad');
  askReason('Save academic setup', 'Changes apply to every branch.', async reason => { const d = Store.clone(acD()), old = JSON.stringify({ periods: d.cfg.periods, maxLoad: d.cfg.maxLoad, delayPts: d.cfg.delayPts, days: d.cfg.days }); d.cfg = { periods: per, maxLoad: mx, delayPts: dl, days, subjects: subj }; acLog(d, '', 'Setup changed', { old, new: JSON.stringify({ periods: per, maxLoad: mx, delayPts: dl, days }) }, reason); await acSave(d); acAuditIt('Academic setup changed', { old, new: `${per}/${mx}/${dl}/${days.join(',')}`, reason }); toast('Setup saved.', 'ok'); });
};
/* ---------- syllabus ---------- */
AC_ACT.acUnitForm = () => {
  const { bid } = acBidSel(), D = acD(), cls = [...new Set(acSections(bid).map(s => s.cls))]; if (!acCan('Add')) return; if (!cls.length) return toast('This branch has no classes.', 'bad');
  modal('Add syllabus unit', `<div class="form-grid">${pcFld('Class', `<select id="un_c" data-act="acUnC">${cls.map(c => `<option>${esc(c)}</option>`).join('')}</select>`)}${pcFld('Subject', `<select id="un_s">${(D.cfg.subjects[acBand(cls[0])] || []).map(x => `<option>${esc(x)}</option>`).join('')}</select>`)}${pcFld('Term', pcSel('un_t', ['Term 1', 'Term 2', 'Term 3', 'Annual'], 'Term 1'))}${pcFld('Unit / chapter', '<input id="un_n">')}${pcFld('Planned start', `<input id="un_f" type="date" value="${PROC_TODAY}">`)}${pcFld('Planned end', `<input id="un_e" type="date">`)}${pcFld('Periods planned', '<input id="un_p" type="number" min="1" value="8">')}</div>`, `<button class="btn primary" data-act="acUnitOk">Save</button><button class="btn" data-act="closeModal">Cancel</button>`);
};
AC_ACT.acUnC = t => { const sel = document.getElementById('un_s'); if (sel) sel.innerHTML = (acD().cfg.subjects[acBand(t.value)] || []).map(x => `<option>${esc(x)}</option>`).join(''); };
AC_ACT.acUnitOk = async () => {
  const { bid } = acBidSel(), title = (v('un_n') || '').trim(), from = v('un_f'), to = v('un_e'); if (!title || !from || !to) return toast('Enter the unit name and both dates.', 'bad'); if (to < from) return toast('The planned end is before the start.', 'bad');
  const d = Store.clone(acD()); d.units.push({ id: 'UN' + Date.now().toString(36), bid, cls: v('un_c'), subject: v('un_s'), term: v('un_t'), title, from, to, periods: +v('un_p') || 0, pct: 0, hist: [] }); acLog(d, bid, `Syllabus unit added: ${v('un_c')} ${v('un_s')} – ${title}`, { new: `${from} → ${to}` }, ''); await acSave(d); acAuditIt('Syllabus unit added', { new: title }); closeModal();
};
AC_ACT.acUnitUpd = t => { const u = acD().units.find(x => x.id === t.dataset.k); if (!u || !acUnitCan(u)) return; modal(`Update progress · ${u.subject} ${u.cls}`, `<p class="small">${esc(u.title)} · planned ${u.from} → ${u.to}</p>${pcFld('Completion % (0–100)', `<input id="up_p" type="number" min="0" max="100" value="${u.pct}">`)}${pcFld('Remark', '<input id="up_r" placeholder="optional">')}`, `<button class="btn primary" data-act="acUnitUpdOk" data-k="${u.id}">Save</button><button class="btn" data-act="closeModal">Cancel</button>`); };
AC_ACT.acUnitUpdOk = async t => {
  const D = acD(), u = D.units.find(x => x.id === t.dataset.k), p = Math.round(+v('up_p')); if (!u || !acUnitCan(u)) return; if (!(p >= 0 && p <= 100)) return toast('Enter a percentage from 0 to 100.', 'bad'); if (p < u.pct && !(v('up_r') || '').trim()) return toast('Give a remark when reducing completion.', 'bad');
  const d = Store.clone(acD()), x = d.units.find(y => y.id === u.id), old = x.pct; x.pct = p; x.hist = [{ at: nowIso(), by: App.user.name, from: old, to: p, remark: (v('up_r') || '').trim() }, ...(x.hist || [])].slice(0, 30); if (p >= 100) x.doneOn = PROC_TODAY; acLog(d, u.bid, `Syllabus progress: ${u.cls} ${u.subject} – ${u.title}`, { old: old + '%', new: p + '%' }, (v('up_r') || '').trim()); await acSave(d); closeModal();
};
/* ---------- lesson plans ---------- */
AC_ACT.acPlanForm = () => {
  const { bid } = acBidSel(), D = acD(), me = acMe(), al = D.alloc.filter(a => a.bid === bid && (acManager() || acMine(a)));
  if (!al.length) return toast(acManager() ? 'Allocate subjects to teachers first.' : 'You have no subject allocation in this branch.', 'bad');
  const mon = (() => { const d = new Date(PROC_TODAY + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10); })();
  modal('New weekly lesson plan', `<div class="form-grid">${pcFld('Class, subject and teacher', pcSel('pl_a', al.map(a => [a.id, `${a.cls} ${a.sec} · ${a.subject} · ${acEmpName(a.teacher)}`]), ''))}${pcFld('Week starting (Monday)', `<input id="pl_w" type="date" value="${mon}">`)}${pcFld('Topic', '<input id="pl_t">')}</div>${pcFld('Learning outcomes', '<textarea id="pl_o" rows="2"></textarea>')}<p class="small">Bloom levels: ${['Remember', 'Understand', 'Apply', 'Analyse', 'Evaluate', 'Create'].map(b => `<label class="chk"><input type="checkbox" class="pl_b" value="${b}"> ${b}</label>`).join(' ')}</p>${pcFld('Teaching activities', '<textarea id="pl_ac" rows="2"></textarea>')}${pcFld('Homework / assessment', '<textarea id="pl_h" rows="2"></textarea>')}`, `<button class="btn primary" data-act="acPlanOk">Save draft</button><button class="btn" data-act="closeModal">Cancel</button>`, true);
};
AC_ACT.acPlanOk = async () => {
  const D = acD(), a = D.alloc.find(x => x.id === v('pl_a')), topic = (v('pl_t') || '').trim(), out = (v('pl_o') || '').trim(), w = v('pl_w'); if (!a) return; if (!topic || !out) return toast('Enter the topic and learning outcomes.', 'bad'); if (!w || acDay(w) !== 'Mon') return toast('The week must start on a Monday.', 'bad');
  if (D.plans.some(p => p.aid === a.id && p.week === w && p.state !== 'Returned')) return toast('A plan already exists for this class, subject and week.', 'bad');
  const d = Store.clone(acD()); d.plans.push({ id: 'LP' + Date.now().toString(36), aid: a.id, bid: a.bid, cls: a.cls, sec: a.sec, subject: a.subject, teacher: a.teacher, week: w, topic, outcomes: out, bloom: [...document.querySelectorAll('.pl_b:checked')].map(i => i.value), activities: (v('pl_ac') || '').trim(), homework: (v('pl_h') || '').trim(), state: 'Draft', by: App.user.name, at: nowIso(), log: [] }); acLog(d, a.bid, `Lesson plan drafted: ${a.cls} ${a.sec} ${a.subject} week ${w}`, { new: topic }, ''); await acSave(d); closeModal();
};
AC_ACT.acPlanOpen = t => {
  const p = acD().plans.find(x => x.id === t.dataset.k); if (!p) return;
  modal(`${p.cls} ${p.sec} · ${p.subject} · week of ${p.week}`, `<div class="kv4"><div><span>Teacher</span><b style="font-size:14px">${esc(acEmpName(p.teacher))}</b></div><div><span>Status</span><b style="font-size:14px">${esc(p.state)}</b></div><div><span>Prepared by</span><b style="font-size:14px">${esc(p.by)}</b></div><div><span>Topic</span><b style="font-size:14px">${esc(p.topic)}</b></div></div><h4>Learning outcomes</h4><p>${esc(p.outcomes)}</p>${(p.bloom || []).length ? `<p class="small"><b>Bloom levels:</b> ${p.bloom.map(esc).join(', ')}</p>` : ''}<h4>Teaching activities</h4><p>${esc(p.activities || '—')}</p><h4>Homework / assessment</h4><p>${esc(p.homework || '—')}</p>${(p.log || []).length ? `<h4>History</h4><p class="small">${p.log.map(l => `${esc(tsLabel(l.at))} · ${esc(l.by)} · ${esc(l.action)}${l.comment ? ' – ' + esc(l.comment) : ''}`).join('<br>')}</p>` : ''}`, `${acPlanBtns(p)}<button class="btn" data-act="closeModal">Close</button>`, true);
};
AC_ACT.acPlanSubmit = async t => { const d = Store.clone(acD()), p = d.plans.find(x => x.id === t.dataset.k); if (!p) return; p.state = 'Submitted'; p.by = App.user.name; p.log = [...(p.log || []), { at: nowIso(), by: App.user.name, action: 'Submitted' }]; acLog(d, p.bid, `Lesson plan submitted: ${p.cls} ${p.sec} ${p.subject} week ${p.week}`, { old: 'Draft', new: 'Submitted' }, ''); await acSave(d); closeModal(); };
AC_ACT.acPlanDecide = t => {
  const id = t.dataset.k, a = t.dataset.v, p0 = acD().plans.find(x => x.id === id); if (!p0 || !acCan('Approve')) return; if (p0.by === App.user.name) return toast('You cannot approve a plan you prepared.', 'bad');
  const run = async comment => { const d = Store.clone(acD()), p = d.plans.find(x => x.id === id); p.state = a; p.log = [...(p.log || []), { at: nowIso(), by: App.user.name, action: a, comment }]; acLog(d, p.bid, `Lesson plan ${a.toLowerCase()}: ${p.cls} ${p.sec} ${p.subject} week ${p.week}`, { old: 'Submitted', new: a }, comment); await acSave(d); acAuditIt(`Lesson plan ${a} ${id}`, { old: 'Submitted', new: a, reason: comment }); closeModal(); };
  if (a === 'Returned') askReason('Return lesson plan', `${p0.cls} ${p0.sec} · ${p0.subject}`, run); else run('');
};
/* ---------- substitution ---------- */
AC_ACT.acSubForm = t => {
  const [cls, sec, p, abs] = t.dataset.k.split('|'), { bid } = acBidSel(), D = acD(), date = App.ui.acDate || PROC_TODAY, day = acDay(date), key = cls + '|' + sec, period = +p;
  const busy = new Set(); Object.values(D.tt[bid] || {}).forEach(g => { const c = g[day + '-' + period], a = c && D.alloc.find(x => x.id === c.aid); if (a) busy.add(a.teacher); }); D.subs.filter(s => s.bid === bid && s.date === date && s.period === period).forEach(s => busy.add(s.sub));
  const free = acTeachers(bid).filter(e => e.id !== abs && !busy.has(e.id) && !(hrAtt(e, date) && ['Absent', 'On leave'].includes(hrAtt(e, date).status))).sort((a, b) => acLoad(D, a.id) - acLoad(D, b.id));
  const al = D.alloc.find(a => { const c = ((D.tt[bid] || {})[key] || {})[day + '-' + period]; return c && c.aid === a.id; });
  modal(`Substitute · ${cls} ${sec} · period ${period}`, `<p class="small">${esc(al ? al.subject : '')} · ${esc(acEmpName(abs))} is absent on ${date}.</p>${free.length ? pcFld('Substitute teacher (free this period, lightest load first)', pcSel('sb_t', free.map(e => [e.id, `${e.name} · ${e.subject || e.desig} · ${acLoad(D, e.id)} periods`]), '')) : '<div class="note">No teacher is free in this period.</div>'}`, free.length ? `<button class="btn primary" data-act="acSubOk" data-k="${esc(t.dataset.k)}">Assign</button><button class="btn" data-act="closeModal">Cancel</button>` : `<button class="btn" data-act="closeModal">Close</button>`);
};
AC_ACT.acSubOk = async t => {
  const [cls, sec, p, abs] = t.dataset.k.split('|'), { bid } = acBidSel(), date = App.ui.acDate || PROC_TODAY, sub = v('sb_t'); if (!sub || !acCan('Approve')) return;
  if (sub === abs) return toast('The substitute cannot be the absent teacher.', 'bad'); if (acD().subs.some(s => s.bid === bid && s.date === date && s.period === +p && s.sub === sub)) return toast('That teacher is already substituting in this period.', 'bad');
  const d = Store.clone(acD()); d.subs.push({ id: 'SB' + Date.now().toString(36), bid, date, key: cls + '|' + sec, period: +p, absent: abs, sub, by: App.user.name, at: nowIso(), state: 'Approved' }); acLog(d, bid, `Substitute arranged: ${cls} ${sec} P${p} on ${date}`, { old: acEmpName(abs), new: acEmpName(sub) }, ''); await acSave(d); acAuditIt(`Substitute arranged ${bid} ${cls} ${sec} P${p} ${date}`, { old: abs, new: sub }); closeModal();
};
