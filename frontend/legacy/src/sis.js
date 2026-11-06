/* ===== Student Information System: profile overlay on the ERP student record, documents, lifecycle, completeness, Excel import, change log ===== */
const SIS_ACT = {};
Store.init({ sis: { p: {}, log: [] } });
const sisD = () => Store.get('sis') || { p: {}, log: [] };
const sisP = adm => (sisD().p || {})[adm] || {};
const SIS_DOCS = [['birth', 'Birth certificate'], ['aadhaar', 'Aadhaar card (masked copy)'], ['tc', 'Transfer certificate'], ['photo', 'Photograph'], ['report', 'Previous report card'], ['address', 'Address proof'], ['medical', 'Medical certificate (special needs)']];
const SIS_DOC_REQ = ['birth', 'photo', 'aadhaar'];
const SIS_LIFE = ['Active', 'Promoted', 'Transferred out', 'Cancelled', 'Alumni'];
const SIS_SENS = ['aadhaar4', 'bloodGroup', 'allergies', 'special', 'medNotes'];
/* key, label, section, kind, counts toward completeness */
const SIS_FIELDS = [
  ['gender', 'Gender', 'Personal', 'sel:Male|Female|Other', 1], ['dob', 'Date of birth', 'Personal', 'date', 1], ['religion', 'Religion', 'Personal', 'text', 0], ['category', 'Social category', 'Personal', 'sel:General|OBC|SC|ST|EWS|Minority', 0], ['nationality', 'Nationality', 'Personal', 'text', 0], ['motherTongue', 'Mother tongue', 'Personal', 'text', 0],
  ['pen', 'PEN / UDISE student ID (11 digits)', 'Identity', 'digits:11', 1], ['apaar', 'APAAR ID (12 digits)', 'Identity', 'digits:12', 1], ['aadhaar4', 'Aadhaar – last 4 digits only', 'Identity', 'digits:4', 1],
  ['fatherName', 'Father name', 'Parents & guardian', 'text', 0], ['motherName', 'Mother name', 'Parents & guardian', 'text', 0], ['guardian', 'Guardian name (if different)', 'Parents & guardian', 'text', 0], ['guardianMobile', 'Alternate parent / guardian mobile', 'Parents & guardian', 'mobile', 0], ['email', 'Parent email', 'Parents & guardian', 'email', 0], ['address', 'Residential address', 'Parents & guardian', 'area', 1],
  ['emName', 'Emergency contact name', 'Emergency', 'text', 1], ['emMobile', 'Emergency contact mobile', 'Emergency', 'mobile', 1], ['emRel', 'Relationship', 'Emergency', 'text', 0],
  ['prevSchool', 'Previous school', 'Previous school', 'text', 0], ['prevClass', 'Last class completed', 'Previous school', 'text', 0],
  ['bloodGroup', 'Blood group', 'Health (restricted)', 'sel:A+|A-|B+|B-|AB+|AB-|O+|O-', 1], ['allergies', 'Allergies', 'Health (restricted)', 'text', 0], ['special', 'Special needs', 'Health (restricted)', 'text', 0], ['medNotes', 'Medical notes', 'Health (restricted)', 'area', 0],
  ['transport', 'Transport required', 'Transport, hostel & class', 'sel:No|Yes', 0], ['route', 'Route / stop', 'Transport, hostel & class', 'text', 0], ['hostel', 'Hostel required', 'Transport, hostel & class', 'sel:No|Yes', 0], ['house', 'House', 'Transport, hostel & class', 'text', 0], ['roll', 'Roll number', 'Transport, hostel & class', 'text', 0], ['scholarship', 'Scholarship / concession category', 'Transport, hostel & class', 'text', 0]
];
const sisCanSens = () => can('sis', 'View Sensitive Data');
const sisMaskA = n => n ? 'XXXX XXXX ' + String(n).slice(-4) : '';
const sisMobile = s => /^[6-9]\d{9}$/.test(String(s || ''));
function sisCheck(k, kind, val) {
  val = String(val == null ? '' : val).trim(); if (!val) return '';
  if (kind === 'date') { const d = new Date(val); if (isNaN(d) || !/^\d{4}-\d{2}-\d{2}$/.test(val)) return 'enter a valid date (YYYY-MM-DD)'; const age = (Date.now() - d) / 31557600000; if (age < 2 || age > 25) return 'date of birth gives an unlikely student age'; }
  if (kind.startsWith('digits:')) { const n = +kind.slice(7); if (!new RegExp('^\\d{' + n + '}$').test(val)) return `must be exactly ${n} digits`; }
  if (kind === 'mobile' && !sisMobile(val)) return 'must be a 10-digit Indian mobile number';
  if (kind === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val)) return 'enter a valid email';
  return '';
}
const sisBr = s => DATA.branches[s.b];
const sisDocOk = (p, k) => p.docs && p.docs[k] && p.docs[k].state === 'Verified';
/* completeness of one student: required profile fields, parent mobile on the ERP record, and verified required documents */
function sisScore(s) {
  const p = sisP(s.adm), miss = [];
  SIS_FIELDS.filter(f => f[4]).forEach(f => { if (!String(p[f[0]] || '').trim()) miss.push(f[1]); });
  if (!sisMobile(String(s.mobile || '').replace(/X/g, '0')) && !s.mobile) miss.push('Parent mobile');
  SIS_DOC_REQ.forEach(k => { if (!sisDocOk(p, k)) miss.push('Document: ' + SIS_DOCS.find(d => d[0] === k)[1]); });
  const total = SIS_FIELDS.filter(f => f[4]).length + 1 + SIS_DOC_REQ.length;
  return { pct: Math.round((total - miss.length) / total * 100), miss, total };
}
async function sisSave(d) { await Store.put('sis', d); }
function sisLogEntry(d, s, action, changes, reason) {
  const u = App.user || {}; d.log.unshift({ id: 'SL' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), at: nowIso(), adm: s ? s.adm : '', name: s ? s.name : '', branch: s ? sisBr(s).name : '', user: u.name || '—', role: u.role || '', action, changes: changes || [], reason: reason || '' });
  d.log = d.log.slice(0, 3000);
}
const sisShow = (k, v) => SIS_SENS.includes(k) && !sisCanSens() ? '<span class="muted">Restricted</span>' : (k === 'aadhaar4' ? esc(sisMaskA(v)) || '<span class="muted">Not recorded</span>' : (String(v || '').trim() ? esc(v) : '<span class="muted">Not recorded</span>'));
async function sisApply(s, patch, action, reason) {
  const d = Store.clone(sisD()), cur = d.p[s.adm] || (d.p[s.adm] = {}), ch = [];
  Object.entries(patch).forEach(([k, val]) => { const o = cur[k] == null ? '' : cur[k]; if (String(o) !== String(val)) { ch.push({ k, old: SIS_SENS.includes(k) ? '(restricted)' : k === 'photo' ? (o ? '(photo)' : '') : o, new: SIS_SENS.includes(k) ? '(restricted)' : k === 'photo' ? (val ? '(photo)' : '') : val }); cur[k] = val; } });
  if (!ch.length) { toast('Nothing was changed.'); return false; }
  cur.hist = [{ at: nowIso(), by: (App.user || {}).name, action, reason, changes: ch }, ...(cur.hist || [])].slice(0, 40);
  sisLogEntry(d, s, action, ch, reason); await sisSave(d);
  audit('Student Information', `${action}: ${s.adm}`, { old: ch.map(c => `${c.k}=${c.old}`).join('; '), new: ch.map(c => `${c.k}=${c.new}`).join('; '), reason });
  return true;
}
/* ---------- directory ---------- */
function sisRows(D, idx) {
  const q = (App.ui.sisQ || '').toLowerCase().trim(), st = App.ui.sisSt || '', cl = App.ui.sisCls || '', cp = App.ui.sisCp || '';
  return Str.list(D, idx, { all: !!st }).filter(x => {
    const s = x.s, p = sisP(s.adm);
    if (st && (s.status !== st)) return false; if (cl && s.cls !== cl) return false;
    if (q) { const hay = [s.name, s.adm, s.parent, s.mobile, s.cls, sisBr(s).name, p.pen, p.apaar, p.fatherName, p.motherName, p.guardianMobile, p.emMobile].join(' ').toLowerCase(); if (!q.split(/\s+/).every(w => hay.includes(w))) return false; }
    if (cp) { const sc = sisScore(s).pct; if (cp === 'low' ? sc >= 60 : cp === 'mid' ? (sc < 60 || sc >= 100) : sc < 100) return false; }
    return true;
  });
}
PAGES.sis = { title: 'Student Information System', mod: 'sis', sf: true, render() {
  const D = D_(), idx = scopeIdx(); if (!idx.length) return empty('No branches in your scope for these filters.');
  const tab = pcTab('sis', 'dir'), tabs = pcTabs('sis', [['dir', 'Student directory'], ['dash', 'Data completeness'], ['imp', 'Excel import'], ['life', 'Status requests', sisPending(idx).length], ['log', 'Change log']], 'dir');
  let body = '';
  if (tab === 'dir') {
    const L = sisRows(D, idx), classes = [...new Set(DATA.students.filter(s => idx.includes(s.b)).map(s => s.cls))];
    const ctl = `<div class="ctrls"><label class="fld grow"><span>Search name, admission no., parent, mobile, class, branch, PEN / UDISE or APAAR ID</span><input id="sisQ" type="search" value="${esc(App.ui.sisQ || '')}" data-act="uiInput" data-k="sisQ" placeholder="e.g. Ayesha, B21-26014, 98, 123456789012"></label>
      <label class="fld"><span>Class</span><select data-act="uiSel" data-k="sisCls"><option value="">All</option>${classes.map(c => `<option ${App.ui.sisCls === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label>
      <label class="fld"><span>ERP status</span><select data-act="uiSel" data-k="sisSt"><option value="">Active students</option>${['Continuing', 'New Admission', 'Transferred', 'Withdrawn', 'Transferred Out', 'Cancelled'].map(c => `<option ${App.ui.sisSt === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
      <label class="fld"><span>Profile</span><select data-act="uiSel" data-k="sisCp"><option value="">All</option><option value="low" ${App.ui.sisCp === 'low' ? 'selected' : ''}>Below 60% complete</option><option value="mid" ${App.ui.sisCp === 'mid' ? 'selected' : ''}>60–99% complete</option><option value="full" ${App.ui.sisCp === 'full' ? 'selected' : ''}>100% complete</option></select></label></div>`;
    const cols = [{ h: 'Student', k: x => `${esc(x.s.name)}<br><span class="muted small">${esc(x.s.adm)}</span>`, t: 'html', x: x => x.s.name }, { h: 'Branch', k: x => sisBr(x.s).name, t: 'text', cls: 'wrap' }, { h: 'Class', k: x => x.s.cls + ' ' + (x.s.sec || ''), t: 'text' }, { h: 'Parent', k: x => x.s.parent || '—', t: 'text' }, { h: 'Parent mobile', k: x => x.s.mobile || '—', t: 'text' }, { h: 'PEN / UDISE ID', k: x => sisP(x.s.adm).pen || '—', t: 'text' }, { h: 'APAAR ID', k: x => sisP(x.s.adm).apaar || '—', t: 'text' }, { h: 'ERP status', k: x => x.s.status, t: 'text' }, { h: 'Profile %', k: x => sisScore(x.s).pct, t: 'num' }, { h: 'Fee status', k: x => Str.payStatus(x), t: 'text' }];
    body = ctl + table('sisDir', cols, L, { limit: 50, rowAct: 'sisOpen', rowKey: x => x.s.adm, title: 'Student directory' });
    return `${card(`${NUM(L.length)} students`, tabs + body, { right: exportBtns('sisDir', 'sis', { label: false }), sub: 'Profile details are held in the Student Information System; admission, class, fees and status come from the ERP record and are not edited here.' })}`;
  }
  if (tab === 'dash') {
    const L = Str.list(D, idx), by = {};
    L.forEach(x => { const s = x.s, b = sisBr(s).name, o = by[b] || (by[b] = { n: 0, sum: 0, full: 0, gaps: {} }); const sc = sisScore(s); o.n++; o.sum += sc.pct; if (sc.pct === 100) o.full++; sc.miss.forEach(m => o.gaps[m] = (o.gaps[m] || 0) + 1); });
    const R = Object.entries(by).map(([b, o]) => ({ b, n: o.n, avg: Math.round(o.sum / o.n), full: o.full, top: Object.entries(o.gaps).sort((a, c) => c[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} (${NUM(v)})`).join(', ') })).sort((a, c) => a.avg - c.avg);
    const tot = R.reduce((a, r) => (a.n += r.n, a.full += r.full, a.w += r.avg * r.n, a), { n: 0, full: 0, w: 0 }), gaps = {}; L.forEach(x => sisScore(x.s).miss.forEach(m => gaps[m] = (gaps[m] || 0) + 1));
    const kp = `<div class="kpis k4"><div class="kpi"><span>Active students</span><b>${NUM(tot.n)}</b></div><div class="kpi"><span>Average profile completeness</span><b>${tot.n ? Math.round(tot.w / tot.n) : 0}%</b></div><div class="kpi"><span>Fully complete profiles</span><b>${NUM(tot.full)}</b></div><div class="kpi"><span>Branches below 60%</span><b>${R.filter(r => r.avg < 60).length}</b></div></div>`;
    const gl = Object.entries(gaps).sort((a, c) => c[1] - a[1]);
    body = kp + card('Most common gaps', table('sisGap', [{ h: 'Missing item', k: r => r[0], t: 'text' }, { h: 'Students', k: r => r[1], t: 'num' }, { h: '% of students', k: r => tot.n ? r[1] / tot.n * 100 : 0, t: 'pct' }], gl, { limit: 15 }), { sub: 'Required: gender, date of birth, PEN, APAAR, Aadhaar last 4, address, emergency contact, blood group, parent mobile, and verified birth certificate, photograph and Aadhaar copy.' }) + card('Branch-wise completeness', table('sisBr', [{ h: 'Branch', k: r => r.b, t: 'text' }, { h: 'Students', k: r => r.n, t: 'num' }, { h: 'Average complete %', k: r => r.avg, t: 'num' }, { h: 'Fully complete', k: r => r.full, t: 'num' }, { h: 'Biggest gaps', k: r => r.top, t: 'text', cls: 'wrap' }], R, { limit: 40 }), { right: exportBtns('sisBr', 'sis', { label: false }) });
    return card('', tabs + body);
  }
  if (tab === 'imp') {
    body = `<p class="small">Upload an Excel file to fill profile fields in bulk. Rows are matched on <b>Admission No</b>; only students inside your branch scope are updated. Blank cells are left unchanged. Every accepted row is checked (date of birth, mobile numbers, PEN 11 digits, APAAR 12 digits, Aadhaar last 4 digits) and rejected rows are listed with the reason.</p>
      <div class="ctrls"><button class="btn" data-act="sisTemplate">Download template</button>${can('sis', 'Edit') ? '<label class="fld"><span>Choose Excel file (.xlsx)</span><input type="file" accept=".xlsx,.xls,.csv" data-act="sisImport"></label>' : '<span class="muted">Your role cannot import.</span>'}</div>${App.ui.sisImp ? sisImpResult(App.ui.sisImp) : ''}`;
    return card('', tabs + body);
  }
  if (tab === 'life') {
    const P = sisPending(idx);
    body = P.length ? table('sisLife', [{ h: 'Student', k: r => `${esc(r.s.name)}<br><span class="muted small">${esc(r.s.adm)}</span>`, t: 'html', x: r => r.s.name }, { h: 'Branch', k: r => sisBr(r.s).name, t: 'text' }, { h: 'From → to', k: r => `${r.e.from} → ${r.e.to}`, t: 'text' }, { h: 'Effective', k: r => r.e.date, t: 'text' }, { h: 'Requested by', k: r => r.e.by, t: 'text' }, { h: 'Reason', k: r => r.e.reason, t: 'text', cls: 'wrap' }, { h: '', k: r => can('sis', 'Approve') && r.e.by !== (App.user || {}).name ? `<button class="btn sm primary" data-act="sisLifeDecide" data-k="${esc(r.s.adm)}|${r.e.id}" data-v="Applied">Approve</button> <button class="btn sm" data-act="sisLifeDecide" data-k="${esc(r.s.adm)}|${r.e.id}" data-v="Rejected">Reject</button>` : '<span class="muted small">Awaiting approver</span>', t: 'html' }], P, { limit: 100 }) : empty('No status change requests are waiting.');
    return card('', tabs + body);
  }
  const set = new Set(idx.map(i => DATA.branches[i].name)), Lg = (sisD().log || []).filter(e => !e.branch || set.has(e.branch));
  body = can('sis', 'View audit logs') || can('sis', 'Edit') ? table('sisLog', [{ h: 'When', k: e => tsLabel(e.at), t: 'text', x: e => e.at }, { h: 'User', k: e => `${esc(e.user)}<br><span class="muted small">${esc(e.role)}</span>`, t: 'html', x: e => e.user }, { h: 'Student', k: e => e.adm ? `${esc(e.name)}<br><span class="muted small">${esc(e.adm)}</span>` : '—', t: 'html', x: e => e.name || '' }, { h: 'Branch', k: e => e.branch || '—', t: 'text' }, { h: 'Action', k: e => e.action, t: 'text', cls: 'wrap' }, { h: 'Old → new', k: e => (e.changes || []).slice(0, 4).map(c => `${c.k}: ${c.old === '' ? '∅' : c.old} → ${c.new}`).join('; ') + ((e.changes || []).length > 4 ? ` (+${e.changes.length - 4} more)` : ''), t: 'text', cls: 'wrap' }, { h: 'Reason', k: e => e.reason || '—', t: 'text', cls: 'wrap' }], Lg, { limit: 100 }) : noAccess('the change log');
  return card('', tabs + body, { right: exportBtns('sisLog', 'sis', { label: false }) });
} };
function sisPending(idx) {
  const out = [], set = new Set(idx), d = sisD().p || {};
  DATA.students.forEach(s => { if (!set.has(s.b)) return; const p = d[s.adm]; if (p && p.life) p.life.filter(e => e.state === 'Pending').forEach(e => out.push({ s, e })); });
  return out;
}
/* ---------- profile ---------- */
function sisOpen(adm) {
  const s = DATA.students.find(x => x.adm === adm); if (!s) return; if (!scopeOf(App.user).has(s.b)) return toast('This student is outside your branch scope.', 'bad');
  const p = sisP(adm), sc = sisScore(s), br = sisBr(s), D = D_(), x = (E.studentsAt(DATA, A, D) || [])[s.id];
  const kv = (l, v) => `<div><span>${l}</span><b style="font-size:14px">${v}</b></div>`;
  const sect = name => SIS_FIELDS.filter(f => f[2] === name).map(f => kv(f[1], sisShow(f[0], p[f[0]]))).join('');
  const sib = (p.siblings || []).map(a => DATA.students.find(y => y.adm === a)).filter(Boolean);
  const life = (p.life || []).filter(e => e.state !== 'Rejected');
  const cur = life.filter(e => e.state === 'Applied').slice(-1)[0];
  const docs = SIS_DOCS.map(([k, l]) => { const dd = (p.docs || {})[k]; const req = SIS_DOC_REQ.includes(k); return `<tr><td>${l}${req ? ' <span class="muted small">(required)</span>' : ''}</td><td>${dd ? pill(dd.state, dd.state === 'Verified' ? 'g' : dd.state === 'Rejected' ? 'r' : 'a') : '<span class="muted">Not received</span>'}</td><td class="small">${dd ? `${esc(dd.file || '—')} · ${esc(dd.by)} · ${esc(String(dd.at || '').slice(0, 10))}${dd.vby ? `<br>Checked by ${esc(dd.vby)}` : ''}${dd.note ? `<br>${esc(dd.note)}` : ''}` : ''}</td><td>${can('sis', 'Upload') ? `<button class="btn sm" data-act="sisDocForm" data-k="${esc(adm)}|${k}">${dd ? 'Replace' : 'Record'}</button>` : ''}${dd && dd.state === 'Received' && can('sis', 'Verify') && dd.by !== (App.user || {}).name ? ` <button class="btn sm primary" data-act="sisDocDecide" data-k="${esc(adm)}|${k}" data-v="Verified">Verify</button> <button class="btn sm" data-act="sisDocDecide" data-k="${esc(adm)}|${k}" data-v="Rejected">Reject</button>` : ''}</td></tr>`; }).join('');
  const comm = (p.comm || []).slice(0, 8).map(c => `<tr><td class="small">${esc(String(c.at).slice(0, 16).replace('T', ' '))}</td><td>${esc(c.ch)}</td><td>${esc(c.note)}</td><td class="small">${esc(c.by)}</td></tr>`).join('');
  const hist = (p.hist || []).slice(0, 6).map(h => `<tr><td class="small">${esc(tsLabel(h.at))}</td><td class="small">${esc(h.by)}</td><td class="small">${esc(h.action)}${h.reason ? ' · ' + esc(h.reason) : ''}<br>${h.changes.slice(0, 5).map(c => `${esc(c.k)}: ${esc(c.old === '' ? '∅' : c.old)} → ${esc(c.new)}`).join('; ')}</td></tr>`).join('');
  modal(`${s.name} · ${s.adm}`, `${p.photo ? `<img src="${p.photo}" alt="photo" style="float:right;height:120px;border:1px solid #ccc;margin:0 0 8px 12px">` : ''}
    <div class="kv4">${kv('Branch', esc(br.name))}${kv('Class / section', esc(s.cls + ' ' + (s.sec || '')))}${kv('Academic year', CUR_AY)}${kv('ERP status', esc(s.status))}${kv('Parent', esc(s.parent || '—'))}${kv('Parent mobile', esc(s.mobile || '—'))}${kv('Lifecycle', esc(cur ? cur.to : 'Active'))}${kv('Profile complete', sc.pct + '%')}</div>
    ${x ? `<p class="small">Fee snapshot: ${esc(Str.payStatus(x))} · net fee ${INRS(s.annual)} · outstanding ${INRS(x.os)}${x.od > 0 ? ` · overdue ${INRS(x.od)}` : ''}. Fees are managed in the fee module.</p>${typeof fsCard === 'function' && can('fst') ? `<details><summary class="small">Expected fee card</summary>${fsCardHtml(s, fsCard(s))}</details>` : ''}` : ''}
    ${sc.miss.length ? `<p class="small"><b>Missing:</b> ${sc.miss.map(esc).join(', ')}</p>` : ''}
    ${['Personal', 'Identity', 'Parents & guardian', 'Emergency', 'Previous school', 'Health (restricted)', 'Transport, hostel & class'].map(n => `<h4>${n}</h4><div class="kv4">${sect(n)}</div>`).join('')}
    <h4>Siblings</h4><p class="small">${sib.length ? sib.map(y => `${esc(y.name)} (${esc(y.adm)}, ${esc(y.cls)}, ${esc(sisBr(y).name)})`).join('; ') : 'None linked.'} ${can('sis', 'Edit') ? `<button class="btn sm" data-act="sisSibForm" data-k="${esc(adm)}">Link sibling</button>` : ''}</p>
    <h4>Documents</h4><table class="tbl"><thead><tr><th>Document</th><th>Status</th><th>Detail</th><th></th></tr></thead><tbody>${docs}</tbody></table>
    <h4>Communication trail</h4>${comm ? `<table class="tbl"><thead><tr><th>When</th><th>Channel</th><th>Note</th><th>By</th></tr></thead><tbody>${comm}</tbody></table>` : '<p class="small muted">No entries yet.</p>'}${can('sis', 'Add') ? `<p><button class="btn sm" data-act="sisCommForm" data-k="${esc(adm)}">Add entry</button></p>` : ''}
    <h4>Status history</h4><p class="small">${life.length ? life.map(e => `${esc(e.date)}: ${esc(e.from)} → ${esc(e.to)}${e.state === 'Pending' ? ' (awaiting approval)' : ''} – ${esc(e.reason)}`).join('<br>') : 'No lifecycle changes recorded here. ERP status: ' + esc(s.status) + '.'}</p>
    ${hist ? `<h4>Recent profile changes</h4><table class="tbl"><tbody>${hist}</tbody></table>` : ''}`,
    `${can('sis', 'Edit') ? `<button class="btn primary" data-act="sisEdit" data-k="${esc(adm)}">Edit profile</button>` : ''}${can('sis', 'Add') ? `<button class="btn" data-act="sisLifeForm" data-k="${esc(adm)}">Change status</button>` : ''}<button class="btn" data-act="closeModal">Close</button>`, true);
}
function sisFieldInput(f, val) {
  const [k, l, , kind] = f, id = 'sf_' + k;
  if (SIS_SENS.includes(k) && !sisCanSens()) return '';
  if (kind.startsWith('sel:')) return pcFld(l, pcSel(id, kind.slice(4).split('|'), val || '', '—'));
  if (kind === 'area') return pcFld(l, `<textarea id="${id}" rows="2">${esc(val || '')}</textarea>`);
  if (kind === 'date') return pcFld(l, `<input id="${id}" type="date" value="${esc(val || '')}">`);
  return pcFld(l, `<input id="${id}" value="${esc(val || '')}" ${kind.startsWith('digits') ? 'inputmode="numeric"' : ''}>`);
}
SIS_ACT.sisOpen = t => sisOpen(t.dataset.k);
SIS_ACT.sisPhotoPick = t => { const f = t.files && t.files[0]; if (!f) return; if (!/^image\//.test(f.type)) return toast('Choose an image file.', 'bad'); const img = new Image(); img.onload = () => { const W = 160, H = 200, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); const r = Math.max(W / img.width, H / img.height), w = img.width * r, h = img.height * r; g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.drawImage(img, (W - w) / 2, (H - h) / 2, w, h); const url = c.toDataURL('image/jpeg', 0.7); App.ui._sisPhoto = url; const box = document.getElementById('sf_photoBox'); if (box) box.innerHTML = `<img src="${url}" alt="photo" style="height:100px;border:1px solid #ccc"> <span class="small muted">Saved with the profile</span>`; URL.revokeObjectURL(img.src); }; img.onerror = () => toast('Could not read the image.', 'bad'); img.src = URL.createObjectURL(f); };
SIS_ACT.sisPhotoClear = () => { App.ui._sisPhoto = ''; const box = document.getElementById('sf_photoBox'); if (box) box.innerHTML = '<span class="small muted">Photo will be removed on save</span>'; };
SIS_ACT.sisEdit = t => {
  const adm = t.dataset.k, s = DATA.students.find(x => x.adm === adm), p = sisP(adm); if (!s || !can('sis', 'Edit')) return; App.ui._sisPhoto = undefined;
  const secs = [...new Set(SIS_FIELDS.map(f => f[2]))];
  modal(`Edit profile · ${s.name} (${adm})`, secs.map(n => { const L = SIS_FIELDS.filter(f => f[2] === n).map(f => sisFieldInput(f, p[f[0]])).join(''); return L ? `<h4>${n}</h4><div class="form-grid">${L}</div>` : ''; }).join('') + `<h4>Photo</h4><div class="form-grid"><label class="fld"><span>Student photo (jpg/png; resized to 160×200 and kept in the record)</span><input type="file" id="sf_photoFile" accept="image/*" data-act="sisPhotoPick"></label><div id="sf_photoBox">${p.photo ? `<img src="${p.photo}" alt="photo" style="height:100px;border:1px solid #ccc"> <button class="btn sm" data-act="sisPhotoClear">Remove</button>` : '<span class="small muted">No photo</span>'}</div></div><p class="small">Aadhaar: only the last 4 digits are stored. The full number is never held in this application.</p>`, `<button class="btn primary" data-act="sisEditOk" data-k="${esc(adm)}">Save</button><button class="btn" data-act="sisOpen" data-k="${esc(adm)}">Cancel</button>`, true);
};
SIS_ACT.sisEditOk = t => {
  const adm = t.dataset.k, s = DATA.students.find(x => x.adm === adm); if (!s || !can('sis', 'Edit')) return; const patch = {}, errs = [];
  SIS_FIELDS.forEach(f => { if (SIS_SENS.includes(f[0]) && !sisCanSens()) return; const val = (v('sf_' + f[0]) || '').trim(); const e = sisCheck(f[0], f[3], val); if (e) errs.push(`${f[1]}: ${e}`); patch[f[0]] = val; });
  if (errs.length) return toast(errs[0], 'bad'); if (App.ui._sisPhoto !== undefined) { patch.photo = App.ui._sisPhoto || ''; }
  if (patch.pen && DATA.students.some(y => y.adm !== adm && sisP(y.adm).pen === patch.pen)) return toast('This PEN / UDISE student ID is already used by another student.', 'bad');
  if (patch.apaar && DATA.students.some(y => y.adm !== adm && sisP(y.adm).apaar === patch.apaar)) return toast('This APAAR ID is already used by another student.', 'bad');
  askReason('Save student profile', `${s.name} (${adm})`, async reason => { if (await sisApply(s, patch, 'Profile updated', reason)) toast('Profile saved.', 'ok'); sisOpen(adm); });
};
/* documents */
SIS_ACT.sisDocForm = t => {
  const [adm, k] = t.dataset.k.split('|'), s = DATA.students.find(x => x.adm === adm); if (!s || !can('sis', 'Upload')) return; App.ui._sisFile = null;
  modal(`Record document · ${SIS_DOCS.find(d => d[0] === k)[1]}`, `<p class="small">${esc(s.name)} (${adm}). The file name, size and who received it are recorded here for checking. The document itself is not stored in this application yet.</p>${pcFld('File (optional)', '<input type="file" data-act="sisDocFile">')}${pcFld('Note', '<input id="sd_note" placeholder="e.g. original seen, copy kept in file">')}`, `<button class="btn primary" data-act="sisDocOk" data-k="${esc(adm)}|${k}">Record as received</button><button class="btn" data-act="sisOpen" data-k="${esc(adm)}">Cancel</button>`);
};
SIS_ACT.sisDocFile = t => { const f = t.files[0]; App.ui._sisFile = f ? { name: f.name, size: f.size } : null; };
SIS_ACT.sisDocOk = async t => {
  const [adm, k] = t.dataset.k.split('|'), s = DATA.students.find(x => x.adm === adm); if (!s) return; const f = App.ui._sisFile;
  const d = Store.clone(sisD()), p = d.p[adm] || (d.p[adm] = {}); p.docs = p.docs || {}; const old = (p.docs[k] || {}).state || 'None';
  p.docs[k] = { state: 'Received', file: f ? `${f.name} (${Math.round(f.size / 1024)} KB)` : '', note: (v('sd_note') || '').trim(), by: App.user.name, at: nowIso() };
  sisLogEntry(d, s, `Document received: ${SIS_DOCS.find(x => x[0] === k)[1]}`, [{ k: 'doc:' + k, old, new: 'Received' }], ''); await sisSave(d);
  audit('Student Information', `Document received: ${k} for ${adm}`, { old, new: 'Received' }); toast('Recorded. A second person must verify it.', 'ok'); sisOpen(adm);
};
SIS_ACT.sisDocDecide = t => {
  const [adm, k] = t.dataset.k.split('|'), a = t.dataset.v, s = DATA.students.find(x => x.adm === adm); if (!s || !can('sis', 'Verify')) return;
  const run = async reason => { const d = Store.clone(sisD()), dd = ((d.p[adm] || {}).docs || {})[k]; if (!dd) return; if (dd.by === App.user.name) return toast('The person who received a document cannot verify it.', 'bad'); const old = dd.state; dd.state = a; dd.vby = App.user.name; dd.vat = nowIso(); if (reason) dd.note = ((dd.note ? dd.note + ' · ' : '') + reason); sisLogEntry(d, s, `Document ${a.toLowerCase()}: ${SIS_DOCS.find(x => x[0] === k)[1]}`, [{ k: 'doc:' + k, old, new: a }], reason); await sisSave(d); audit('Student Information', `Document ${a}: ${k} for ${adm}`, { old, new: a, reason }); toast(`Document ${a.toLowerCase()}.`, 'ok'); sisOpen(adm); };
  if (a === 'Rejected') askReason('Reject document', `${s.name} · ${SIS_DOCS.find(x => x[0] === k)[1]}`, run); else run('');
};
/* communication trail */
SIS_ACT.sisCommForm = t => { const adm = t.dataset.k; modal('Add communication entry', pcFld('Channel', pcSel('sc_ch', ['Phone call', 'WhatsApp', 'Email', 'Visit', 'Letter', 'Meeting'], 'Phone call')) + pcFld('Note', '<textarea id="sc_note" rows="3"></textarea>'), `<button class="btn primary" data-act="sisCommOk" data-k="${esc(adm)}">Save</button><button class="btn" data-act="sisOpen" data-k="${esc(adm)}">Cancel</button>`); };
SIS_ACT.sisCommOk = async t => {
  const adm = t.dataset.k, s = DATA.students.find(x => x.adm === adm), note = (v('sc_note') || '').trim(); if (!s) return; if (!note) return toast('Enter a note.', 'bad');
  const d = Store.clone(sisD()), p = d.p[adm] || (d.p[adm] = {}); p.comm = [{ at: nowIso(), ch: v('sc_ch'), note, by: App.user.name }, ...(p.comm || [])].slice(0, 100);
  sisLogEntry(d, s, 'Communication recorded (' + v('sc_ch') + ')', [], ''); await sisSave(d); sisOpen(adm);
};
/* siblings */
SIS_ACT.sisSibForm = t => {
  const adm = t.dataset.k, s = DATA.students.find(x => x.adm === adm), p = sisP(adm); if (!s) return;
  const sug = s.parent ? DATA.students.filter(y => y.adm !== adm && y.parent && y.parent.toLowerCase() === s.parent.toLowerCase() && scopeOf(App.user).has(y.b) && !(p.siblings || []).includes(y.adm)).slice(0, 8) : [];
  modal('Link sibling', `<p class="small">Siblings share parent details across branches. Link by admission number${sug.length ? ' or choose a suggestion with the same parent name' : ''}.</p>${sug.length ? `<p class="small">${sug.map(y => `<button class="btn sm" data-act="sisSibOk" data-k="${esc(adm)}|${esc(y.adm)}">${esc(y.name)} · ${esc(y.adm)} · ${esc(y.cls)}</button>`).join(' ')}</p>` : ''}${pcFld('Sibling admission number', '<input id="sb_adm" placeholder="e.g. B21-26014">')}`, `<button class="btn primary" data-act="sisSibOk" data-k="${esc(adm)}|">Link</button><button class="btn" data-act="sisOpen" data-k="${esc(adm)}">Cancel</button>`);
};
SIS_ACT.sisSibOk = async t => {
  const [adm, other0] = t.dataset.k.split('|'), other = (other0 || v('sb_adm') || '').trim(), s = DATA.students.find(x => x.adm === adm), o = DATA.students.find(x => x.adm === other);
  if (!o) return toast('No student has that admission number.', 'bad'); if (o.adm === adm) return toast('A student cannot be their own sibling.', 'bad'); if (!scopeOf(App.user).has(o.b)) return toast('That student is outside your branch scope.', 'bad');
  const d = Store.clone(sisD()); [[s, o], [o, s]].forEach(([a, b]) => { const p = d.p[a.adm] || (d.p[a.adm] = {}); p.siblings = Array.from(new Set([...(p.siblings || []), b.adm])); });
  sisLogEntry(d, s, 'Sibling linked: ' + o.adm, [{ k: 'sibling', old: '', new: o.adm }], ''); await sisSave(d); audit('Student Information', `Sibling linked ${adm} ↔ ${other}`, {}); toast('Sibling linked.', 'ok'); sisOpen(adm);
};
/* lifecycle: promotion, transfer, cancellation, alumni. Requests by a user without approval rights wait for an approver. */
SIS_ACT.sisLifeForm = t => {
  const adm = t.dataset.k, s = DATA.students.find(x => x.adm === adm); if (!s) return; const cur = ((sisP(adm).life || []).filter(e => e.state === 'Applied').slice(-1)[0] || {}).to || 'Active';
  modal(`Change status · ${s.name}`, `<p class="small">Current: <b>${esc(cur)}</b>. ${can('sis', 'Approve') ? 'Your change is applied at once.' : 'Your request goes to an approver.'} Fee and strength figures continue to follow the ERP record.</p>${pcFld('New status', pcSel('sl_to', SIS_LIFE.filter(x => x !== cur), ''))}${pcFld('Effective date', `<input id="sl_date" type="date" value="${PROC_TODAY}">`)}`, `<button class="btn primary" data-act="sisLifeOk" data-k="${esc(adm)}|${esc(cur)}">Continue</button><button class="btn" data-act="sisOpen" data-k="${esc(adm)}">Cancel</button>`);
};
SIS_ACT.sisLifeOk = t => {
  const [adm, from] = t.dataset.k.split('|'), s = DATA.students.find(x => x.adm === adm), to = v('sl_to'), date = v('sl_date'); if (!s) return; if (!to) return toast('Choose the new status.', 'bad'); if (!date) return toast('Enter the effective date.', 'bad');
  askReason('Change student status', `${s.name} (${adm}): ${from} → ${to} from ${date}`, async reason => {
    const d = Store.clone(sisD()), p = d.p[adm] || (d.p[adm] = {}), ap = can('sis', 'Approve'); p.life = [...(p.life || []), { id: 'LF' + Date.now().toString(36), from, to, date, reason, by: App.user.name, at: nowIso(), state: ap ? 'Applied' : 'Pending', approver: ap ? App.user.name : '' }];
    sisLogEntry(d, s, ap ? `Status changed: ${from} → ${to}` : `Status change requested: ${from} → ${to}`, [{ k: 'lifecycle', old: from, new: to }], reason); await sisSave(d); audit('Student Information', `Status ${ap ? 'changed' : 'requested'} ${from} → ${to}: ${adm}`, { old: from, new: to, reason }); toast(ap ? 'Status updated.' : 'Sent for approval.', 'ok'); sisOpen(adm);
  });
};
SIS_ACT.sisLifeDecide = t => {
  const [adm, id] = t.dataset.k.split('|'), a = t.dataset.v, s = DATA.students.find(x => x.adm === adm); if (!s || !can('sis', 'Approve')) return;
  askReason(`${a === 'Applied' ? 'Approve' : 'Reject'} status change`, `${s.name} (${adm})`, async reason => {
    const d = Store.clone(sisD()), e = ((d.p[adm] || {}).life || []).find(y => y.id === id); if (!e) return; if (e.by === App.user.name) return toast('You cannot approve your own request.', 'bad');
    e.state = a; e.approver = App.user.name; e.decidedAt = nowIso(); e.decideReason = reason; sisLogEntry(d, s, `Status change ${a === 'Applied' ? 'approved' : 'rejected'}: ${e.from} → ${e.to}`, [{ k: 'lifecycle', old: e.from, new: a === 'Applied' ? e.to : e.from }], reason); await sisSave(d); audit('Student Information', `Status change ${a}: ${adm}`, { old: e.from, new: e.to, reason }); rerender();
  });
};
/* ---------- Excel import ---------- */
const SIS_COLS = [['Admission No', 'adm'], ['Gender', 'gender'], ['Date of birth (YYYY-MM-DD)', 'dob'], ['Blood group', 'bloodGroup'], ['Aadhaar last 4 digits', 'aadhaar4'], ['PEN / UDISE student ID', 'pen'], ['APAAR ID', 'apaar'], ['Father name', 'fatherName'], ['Mother name', 'motherName'], ['Alternate mobile', 'guardianMobile'], ['Parent email', 'email'], ['Address', 'address'], ['Emergency contact name', 'emName'], ['Emergency contact mobile', 'emMobile'], ['House', 'house'], ['Roll number', 'roll']];
function sisImpResult(r) { return `<div class="note"><b>${NUM(r.ok)}</b> student${r.ok === 1 ? '' : 's'} updated, <b>${NUM(r.same)}</b> unchanged, <b>${NUM(r.bad.length)}</b> row${r.bad.length === 1 ? '' : 's'} rejected (${esc(r.file)}).</div>${r.bad.length ? table('sisBad', [{ h: 'Row', k: x => x[0], t: 'num' }, { h: 'Admission No', k: x => x[1] || '—', t: 'text' }, { h: 'Reason', k: x => x[2], t: 'text', cls: 'wrap' }], r.bad, { limit: 50 }) : ''}`; }
SIS_ACT.sisTemplate = async () => { const ws = XLSX.utils.aoa_to_sheet([SIS_COLS.map(c => c[0]), ['B21-26001', 'Female', '2016-04-12', 'O+', '1234', '12345678901', '123456789012', 'Father name', 'Mother name', '9876543210', 'parent@example.com', 'Full address', 'Emergency name', '9876543211', 'Green', '12']]), wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Students'); await saveFile('student-profile-template.xlsx', new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })])); };
SIS_ACT.sisImport = t => {
  const f = t.files[0]; if (!f || !can('sis', 'Edit')) return; const rd = new FileReader();
  rd.onload = async () => {
    try {
      const wb = XLSX.read(new Uint8Array(rd.result), { type: 'array' }), R = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '', raw: false }), sc = scopeOf(App.user), bad = [], d = Store.clone(sisD()); let ok = 0, same = 0; const pens = new Map(), aps = new Map();
      DATA.students.forEach(y => { const q = d.p[y.adm]; if (q && q.pen) pens.set(q.pen, y.adm); if (q && q.apaar) aps.set(q.apaar, y.adm); });
      R.forEach((row, i) => {
        const get = key => { const c = SIS_COLS.find(x => x[1] === key); return String(row[c[0]] == null ? '' : row[c[0]]).trim(); }, adm = get('adm'), n = i + 2;
        if (!adm) return bad.push([n, '', 'Admission No is blank.']); const s = DATA.students.find(y => y.adm === adm); if (!s) return bad.push([n, adm, 'No student has this admission number.']); if (!sc.has(s.b)) return bad.push([n, adm, 'Student is outside your branch scope.']);
        const patch = {}; let err = '';
        SIS_COLS.slice(1).forEach(([, key]) => { const val = get(key); if (!val) return; const f = SIS_FIELDS.find(x => x[0] === key); if (!f) { patch[key] = val; return; } if (SIS_SENS.includes(key) && !sisCanSens()) return; const e = sisCheck(key, f[3], val); if (e) err = err || `${f[1]}: ${e}`; patch[key] = val; });
        if (!err && patch.pen && pens.has(patch.pen) && pens.get(patch.pen) !== adm) err = 'PEN / UDISE ID already used by ' + pens.get(patch.pen);
        if (!err && patch.apaar && aps.has(patch.apaar) && aps.get(patch.apaar) !== adm) err = 'APAAR ID already used by ' + aps.get(patch.apaar);
        if (err) return bad.push([n, adm, err]);
        const cur = d.p[adm] || (d.p[adm] = {}), ch = []; Object.entries(patch).forEach(([k, val]) => { if (String(cur[k] == null ? '' : cur[k]) !== val) { ch.push({ k, old: SIS_SENS.includes(k) ? '(restricted)' : (cur[k] == null ? '' : cur[k]), new: SIS_SENS.includes(k) ? '(restricted)' : val }); cur[k] = val; } });
        if (!ch.length) return same++; if (patch.pen) pens.set(patch.pen, adm); if (patch.apaar) aps.set(patch.apaar, adm);
        cur.hist = [{ at: nowIso(), by: App.user.name, action: 'Excel import', reason: f.name, changes: ch }, ...(cur.hist || [])].slice(0, 40); ok++;
      });
      sisLogEntry(d, null, `Excel import ${f.name}: ${ok} updated, ${same} unchanged, ${bad.length} rejected`, [], ''); await sisSave(d);
      audit('Student Information', `Excel import ${f.name}`, { new: `${ok} updated, ${bad.length} rejected` }); App.ui.sisImp = { ok, same, bad, file: f.name }; rerender();
    } catch (e) { toast('Could not read that file: ' + e.message, 'bad'); }
  }; rd.readAsArrayBuffer(f);
};
