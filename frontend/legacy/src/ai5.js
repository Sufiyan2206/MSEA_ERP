/* ===== AI Assistant, part 4: floating "Ask MSEA AI" button, scheduled summaries, AI Control Centre ===== */
const AI_ADM = 'ai_admin';
const AI_PERMS = ['View', 'Export Excel', 'Export PDF', 'Approve', 'Reject', 'Send Email', 'Send WhatsApp', 'View audit logs', 'Configure Settings'];
const aiCan = a => can(AI_ADM, a === 'View' ? 'View' : 'Edit');

/* ---------- floating button and drawer, present on every screen for users who may use the assistant ---------- */
const aiRender0 = render;
render = function () { aiRender0(); try { aiShell(); } catch (e) { console.error(e); } };
function aiShell() {
  let el = document.getElementById('aiShell'); if (!el) { el = document.createElement('div'); el.id = 'aiShell'; document.body.appendChild(el); }
  if (!App.user || App.user.status !== 'Active' || !PAGES.ai_chat || !aiAllowed()) { el.innerHTML = ''; return; }
  aiRunSchedules();
  if (App.route === 'ai_chat') { el.innerHTML = ''; return; }
  const open = !!App.ui.aiOpen, th0 = el.querySelector('.ai-thread'), foc = document.activeElement && document.activeElement.id === 'aiQd', n0 = (el.dataset.n | 0), M = App.ui.aiMsgs || [];
  const st = th0 ? th0.scrollTop : 0, pin = th0 ? th0.scrollHeight - th0.scrollTop - th0.clientHeight < 40 : true;
  if (!open) { el.dataset.n = M.length; el.innerHTML = `<button class="ai-fab" data-act="aiFab" aria-label="Ask MSEA AI"><span class="ai-fab-i">✦</span><span class="ai-fab-t">Ask MSEA AI</span></button>`; return; }
  const c = aiCtx(), cfg = aiCfg(), n = App.mounts.length, empty = !M.length, quick = AI_SUGGEST.filter(q => { const p = aiRoute(q)[0]; return p && p.tool && AI_T[p.tool] && can(AI_T[p.tool].mod, 'View') && cfg.domains[AI_T[p.tool].domain] !== false && cfg.tools[p.tool] !== false; }).slice(0, 5);
  el.innerHTML = `<div class="ai-scrim" data-act="aiFab"></div><aside class="ai-drawer" role="dialog" aria-label="Ask MSEA AI"><div class="ai-dh"><div><b>Ask MSEA AI</b><div class="small muted">${esc(aiScopeLabel(c))} · you are on ${esc((PAGES[App.route] || {}).title || 'the dashboard')}</div></div><div class="btnrow"><select data-act="aiLang" aria-label="Language">${AI_LANGS.map(([k, l]) => `<option value="${k}" ${(App.ui.aiLang || 'en-IN') === k ? 'selected' : ''}>${l}</option>`).join('')}</select><button class="btn sm ghost" data-act="aiFabFull" title="Open the full assistant">Full page</button><button class="btn sm" data-act="aiFab" aria-label="Close">✕</button></div></div>
    <div class="ai-db">${empty ? `<p class="small muted">Ask about fees, admissions, staff, payroll, purchase, assets and more. You will see only data your role allows.</p><div class="btnrow ai-chips">${quick.map(q => `<button class="btn sm ghost" data-act="aiSug" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>` : ''}${aiThread(M, App.ui.aiBusy, 'd')}</div><div class="ai-df">${aiInput(App.ui.aiBusy, 'd')}</div></aside>`;
  App.mounts.slice(n).forEach(f => { try { f(); } catch (e) { console.error(e); } });
  const th = el.querySelector('.ai-db'); if (th) th.scrollTop = pin || M.length !== n0 ? th.scrollHeight : st; el.dataset.n = M.length;
  if (foc || (App.ui.aiFocus && !App.ui.aiBusy)) { const t = document.getElementById('aiQd'); if (t) { t.focus(); const l = t.value.length; try { t.setSelectionRange(l, l); } catch (e) { } } App.ui.aiFocus = false; }
}
document.addEventListener('keydown', e => { if (e.key === 'Escape' && App.ui && App.ui.aiOpen && !document.querySelector('.modal')) { App.ui.aiOpen = false; render(); } });

/* ---------- scheduled summaries: run for the signed-in owner when the app is opened (there is no server to run them at a fixed time) ---------- */
const aiSchedList = () => (Store.list('ailog') || []).filter(x => x.event === 'Schedule');
function aiSchedDue(s, t) {
  if (!s.active || s.userId !== App.user.id) return false; const last = s.lastRun || '';
  if (last >= t) return false;
  if (s.freq === 'daily') return true;
  if (s.freq === 'weekly') { const d = E.dow ? E.dow(E.dn(t)) : new Date(t).getDay(); return !last || E.dn(t) - E.dn(last) >= 7 || (d === +s.day && last < t); }
  if (s.freq === 'monthly') return !last ? +t.slice(8) >= +s.day : last.slice(0, 7) < t.slice(0, 7) && +t.slice(8) >= +s.day;
  return false;
}
async function aiMakeReport(r, extra) {
  const cfg = aiCfg(), me = App.user, auto = !cfg.needApproval || !cfg.approveSummaries || can(AI_MOD, 'Approve'), id = aiNewId('AIR');
  await Store.setDoc('ailog', id, Object.assign({ event: 'Report', userId: me.id, user: me.name, role: me.role, title: r.title, scope: r.scope, asOn: r.asOn, headline: r.headline, kpis: r.kpis || null, cols: r.cols.map(c => c.h), colT: r.cols.map(c => c.t), rows: r.rows.slice(0, 30), files: [], status: auto ? 'Approved' : 'Pending approval', approvedBy: auto ? me.name + (can(AI_MOD, 'Approve') ? '' : ' (policy)') : '', approvedAt: auto ? new Date().toISOString() : '', shares: [], period: r.period, source: r.module, sync: r.sync }, extra || {}));
  return id;
}
let aiSchedBusy = false;
async function aiRunSchedules() {
  if (aiSchedBusy || !Store.writable || !App.user || !aiAllowed()) return; const t = E.ds(D_()), due = aiSchedList().filter(s => aiSchedDue(s, t)); if (!due.length) return;
  aiSchedBusy = true;
  try {
    for (const s of due) {
      const trace = [], plan = aiRoute(s.question).filter(p => p.tool), res = plan.map(p => aiRun(p.tool, p.args, trace)).filter(r => r && !r.error && !r.clarify);
      await Store.patch('ailog', s.id, { lastRun: t, lastStatus: res.length ? 'Delivered to dashboard' : 'No data (check permissions)' });
      await aiLogQ({ question: '(Scheduled: ' + s.name + ') ' + s.question, engine: 'Built-in analyst', input: 'Scheduled', scope: aiScopeLabel(aiCtx()), tools: trace.map(x => x.tool).join(', '), accessed: aiAccessed(trace), sources: [...new Set(res.map(r => r.module))].join(', '), sync: aiSyncLabel(), answer: res.map(r => r.headline).join(' ').slice(0, 600), status: res.length ? 'Answered' : 'No data matched', asOn: dLabel(D_()) });
      for (const r of res) await aiMakeReport(r, { scheduled: true, schedId: s.id, schedName: s.name, sendTo: { email: s.emails || [], wa: !!s.wa } });
      audit('AI Assistant', 'Scheduled AI summary generated', { new: s.name + ' · ' + res.length + ' report(s)' });
      if (res.length) toast(`Scheduled summary ready: ${s.name}. Open AI Assistant → Reports.`);
    }
  } catch (e) { console.error(e); } finally { aiSchedBusy = false; }
}
function aiViewSched() {
  const all = aiSchedList(), L = all.filter(s => s.userId === App.user.id || can(AI_MOD, 'Configure Settings')), cfg = aiCfg();
  const staff = users().filter(u => u.status === 'Active' && u.email), ext = can(AI_MOD, 'Send Email') || can(AI_MOD, 'Send WhatsApp');
  const qs = [...AI_SUGGEST, ...(cfg.templates || []).filter(t => t.on !== false).map(t => t.text)];
  const cols = [{ h: 'Name', t: 'text', k: s => s.name }, { h: 'Question', t: 'text', cls: 'wrap small', k: s => s.question }, { h: 'When', t: 'text', k: s => s.freq === 'daily' ? 'Every day' : s.freq === 'weekly' ? 'Every ' + ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][+s.day] : 'Day ' + s.day + ' of each month' }, { h: 'For', t: 'text', cls: 'small', k: s => s.user }, { h: 'Also prepare for', t: 'text', cls: 'small', k: s => [(s.emails || []).length ? 'Email: ' + s.emails.join(', ') : '', s.wa ? 'WhatsApp' : ''].filter(Boolean).join(' · ') || 'Dashboard only' }, { h: 'Last run', t: 'text', cls: 'small', k: s => (s.lastRun || '—') + (s.lastStatus ? ' · ' + s.lastStatus : '') }, { h: 'Status', t: 'html', k: s => pill(s.active ? 'Active' : 'Paused', s.active ? 'good' : 'warn') }, { h: '', t: 'html', noexp: true, k: s => (s.userId === App.user.id || can(AI_MOD, 'Configure Settings')) ? `<div class="btnrow"><button class="btn sm ghost" data-act="aiSchedTog" data-k="${esc(s.id)}">${s.active ? 'Pause' : 'Resume'}</button><button class="btn sm" data-act="aiSchedDel" data-k="${esc(s.id)}">Remove</button></div>` : '' }];
  const form = `<div class="form-grid"><label class="fld"><span>Name</span><input id="sc_name" placeholder="e.g. Morning management summary" value="${esc(App.ui.aiSchedN || '')}"></label>
    <label class="fld"><span>Question to answer</span><input id="sc_q" list="sc_ql" value="${esc(App.ui.aiSchedQ || 'Prepare a management summary for today.')}"><datalist id="sc_ql">${qs.map(q => `<option value="${esc(q)}">`).join('')}</datalist></label>
    <label class="fld"><span>Frequency</span><select id="sc_f"><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></label>
    <label class="fld"><span>Weekday (weekly) / day of month (monthly)</span><input id="sc_d" type="number" min="0" max="28" value="1"></label>
    ${ext && cfg.share ? `<label class="fld"><span>Also prepare for email (MSEA staff addresses, comma separated)</span><input id="sc_e" list="sc_el" placeholder="optional"><datalist id="sc_el">${staff.map(u => `<option value="${esc(u.email)}">${esc(u.name)}</option>`).join('')}</datalist></label><label class="chk"><input type="checkbox" id="sc_w"> Also prepare for WhatsApp</label>` : ''}</div><div class="btnrow"><button class="btn primary" data-act="aiSchedAdd">Add schedule</button></div><p class="small muted">Weekday 0 = Sunday … 6 = Saturday.</p>`;
  return card('Scheduled summaries', `<p class="small">Each schedule is answered from your own permitted data when you open the application on or after the due time, and delivered to <b>AI Assistant → Reports</b>. Emails and WhatsApp messages are never sent automatically: the report is prepared${cfg.needApproval ? ', approved by an approver where required,' : ''} and you press <b>Share</b> to send it.</p>${table('aiSch', cols, L, { title: 'AI schedules', empty: 'No schedules yet.' })}<h4 class="blk">New schedule</h4>${form}`);
}
Object.assign(AI_ACT, {
  aiFab: () => { App.ui.aiOpen = !App.ui.aiOpen; App.ui.aiFocus = true; render(); },
  aiFabFull: () => { App.ui.aiOpen = false; App.ui.aiTab = 'ask'; go('ai_chat'); },
  aiSchedAdd: async () => {
    if (!can(AI_MOD, 'View')) return; const g = id => { const e = document.getElementById(id); return e ? e.value : ''; }, name = g('sc_name').trim(), q = g('sc_q').trim(), f = g('sc_f'), d = Math.max(0, Math.min(28, +g('sc_d') || 0));
    if (!name || !q) return toast('Give the schedule a name and a question.', 'bad'); const plan = aiRoute(q); if (!plan.length || plan[0].clarify) return toast('I could not map that question to dashboard data. Pick one of the suggested questions.', 'bad');
    const staff = new Set(users().filter(u => u.status === 'Active').map(u => (u.email || '').toLowerCase())), emails = g('sc_e').split(/[,;\s]+/).filter(Boolean), bad = emails.filter(x => !staff.has(x.toLowerCase()));
    if (bad.length) return toast('Only active MSEA staff addresses are allowed: ' + bad.join(', '), 'bad');
    const wa = !!(document.getElementById('sc_w') || {}).checked;
    await Store.setDoc('ailog', aiNewId('AIS'), { event: 'Schedule', userId: App.user.id, user: App.user.name, role: App.user.role, name, question: q, freq: f, day: f === 'monthly' ? Math.max(1, d) : d, emails, wa, active: true, lastRun: '' });
    audit('AI Assistant', 'AI schedule created', { new: name + ' · ' + f }); toast('Schedule added. It will run when you next open the application.'); render();
  },
  aiSchedTog: async t => { const s = aiSchedList().find(x => x.id === t.dataset.k); if (!s || (s.userId !== App.user.id && !can(AI_MOD, 'Configure Settings'))) return; await Store.patch('ailog', s.id, { active: !s.active }); audit('AI Assistant', 'AI schedule ' + (s.active ? 'paused' : 'resumed'), { new: s.name }); render(); },
  aiSchedDel: async t => { const s = aiSchedList().find(x => x.id === t.dataset.k); if (!s || (s.userId !== App.user.id && !can(AI_MOD, 'Configure Settings'))) return; await Store.patch('ailog', s.id, { event: 'ScheduleRemoved', active: false }); audit('AI Assistant', 'AI schedule removed', { new: s.name }); render(); }
});

/* ---------- encryption for integration keys (AES-GCM, key derived from a passphrase with PBKDF2; the passphrase is never stored) ---------- */
const aiB64 = b => btoa(String.fromCharCode(...new Uint8Array(b))), aiUnB64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function aiKey(pass, salt) { const km = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']); return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' }, km, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']); }
async function aiEncrypt(plain, pass) { const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12)), k = await aiKey(pass, salt), ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, new TextEncoder().encode(plain)); return { v: 1, alg: 'AES-GCM/PBKDF2-SHA256', salt: aiB64(salt), iv: aiB64(iv), ct: aiB64(ct), hint: plain.slice(0, 3) + '…' + plain.slice(-2) }; }
async function aiDecrypt(enc, pass) { const k = await aiKey(pass, aiUnB64(enc.salt)); return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: aiUnB64(enc.iv) }, k, aiUnB64(enc.ct))); }

/* ---------- AI Control Centre (System Admin / Super Admin) ---------- */
const AI_ADM_TABS = [['ov', 'Overview'], ['data', 'Data access'], ['users', 'Users & roles'], ['tpl', 'Prompt templates'], ['models', 'Models & integrations'], ['audit', 'Usage & audit'], ['sync', 'Data sync & errors']];
PAGES.ai_admin = {
  title: 'AI Control Centre', mod: AI_ADM,
  render() {
    if (!can(AI_ADM, 'View')) return noAccess('the AI Control Centre');
    const tab = App.ui.aiAdTab || 'ov', head = `<div class="tabs">${AI_ADM_TABS.map(([k, l]) => `<button class="tab${tab === k ? ' on' : ''}" data-act="ui" data-k="aiAdTab" data-v="${k}">${l}</button>`).join('')}</div>`;
    const body = { ov: aiAdOv, data: aiAdData, users: aiAdUsers, tpl: aiAdTpl, models: aiAdModels, audit: aiAdAudit, sync: aiAdSync }[tab]();
    return `<div class="ai-wrap">${card('AI Control Centre', `<p class="card-sub" style="margin:0">Govern what the AI Assistant may read, who may use it, which models answer, and what leaves the application. Every change here is recorded in the audit log. Branch and zone scope and each user's module permissions always apply on top of these settings.</p>${head}${can(AI_ADM, 'Edit') ? '' : '<p class="note warn">You have read-only access to the AI Control Centre.</p>'}`)}${body}</div>`;
  }
};
const aiAllLog = () => (Store.list('ailog') || []);
const aiAdKpi = (l, v, s) => `<div class="kpi"><div class="kpi-l">${esc(l)}</div><div class="kpi-v" style="font-size:1.15rem">${esc(String(v))}</div>${s ? `<div class="kpi-s">${esc(s)}</div>` : ''}</div>`;
function aiAdOv() {
  const cfg = aiCfg(), Q = aiAllLog().filter(x => x.event === 'Question'), wk = new Date(Date.now() - 7 * 864e5).toISOString(), R = aiAllLog().filter(x => x.event === 'Report'), sync = Store.get('sync'), fail = (sync.runs || []).filter(r => r.status !== 'Success').length;
  const off = Object.keys(AI_DOMAINS).filter(k => cfg.domains[k] === false), offT = Object.keys(cfg.tools).filter(k => cfg.tools[k] === false);
  const k = `<div class="kpis k4">${aiAdKpi('Questions (7 days)', NUM(Q.filter(x => (x.ts || '') >= wk).length), NUM(Q.length) + ' in total')}${aiAdKpi('Blocked / partly blocked', NUM(Q.filter(x => /Blocked|Partly/.test(x.status)).length), 'by permissions or switches')}${aiAdKpi('Reports awaiting approval', NUM(R.filter(x => x.status === 'Pending approval').length), NUM(R.length) + ' reports in total')}${aiAdKpi('Active AI users (7 days)', NUM(new Set(Q.filter(x => (x.ts || '') >= wk).map(x => x.userId)).size))}${aiAdKpi('Default engine', cfg.provider === 'claude' ? 'Claude (optional)' : 'Application AI (built-in)', cfg.chatgpt.enabled ? 'ChatGPT gateway enabled' : 'ChatGPT gateway not connected')}${aiAdKpi('Data sources off', off.length ? off.map(x => AI_DOMAINS[x]).join(', ') : 'None', offT.length ? offT.length + ' report(s) switched off' : '')}${aiAdKpi('Users blocked from AI', NUM(cfg.blockedUsers.length))}${aiAdKpi('Last ERP sync', aiSyncLabel(), fail ? fail + ' failed run(s) in history' : 'No failed runs')}</div>`;
  const chk = [['Approval before external sharing', cfg.needApproval], ['Approval for scheduled summaries', cfg.approveSummaries], ['Sharing by email / WhatsApp allowed', cfg.share], ['Student-level lists allowed', cfg.sensitive.studentLevel], ['Staff-level lists allowed', cfg.sensitive.staffLevel]];
  return k + card('Current safeguards', `<ul class="small">${chk.map(([l, v]) => `<li>${esc(l)}: ${pill(v ? 'On' : 'Off', v ? 'good' : 'warn')}</li>`).join('')}</ul>`);
}
function aiAdData() {
  const cfg = aiCfg(), ed = can(AI_ADM, 'Edit'), dis = ed ? '' : 'disabled', tools = Object.values(AI_T), chk = (id, v) => `<input type="checkbox" id="${id}" ${v ? 'checked' : ''} ${dis}>`;
  return card('Module-wise data access for the AI', `<p class="small muted">A switched-off source or report is blocked for <b>every</b> user, whatever their role. A switched-on report is still limited by the user's own module permission and branch scope.</p>
  ${Object.entries(AI_DOMAINS).map(([d, l]) => `<div class="ai-dom"><label class="chk"><b>${chk('ad_d_' + d, cfg.domains[d] !== false)} ${esc(l)}</b></label><div class="form-grid">${tools.filter(t => t.domain === d).map(t => `<label class="chk">${chk('ad_t_' + t.name, cfg.tools[t.name] !== false)} ${esc(t.title || t.name)}${t.sens ? ' ' + pill('Sensitive', 'warn') : ''} <span class="small muted">· ${esc(MODLABEL(t.mod))}</span></label>`).join('')}</div></div>`).join('')}
  <h4 class="blk">Sensitive information</h4><div class="form-grid"><label class="chk">${chk('ad_s_stu', cfg.sensitive.studentLevel !== false)} Allow student-level lists (e.g. zero-payer students) for roles that have student-level access</label><label class="chk">${chk('ad_s_staff', cfg.sensitive.staffLevel !== false)} Allow staff-level lists</label></div>
  <label class="fld"><span>Hidden fields (column names, comma separated) – removed from every AI answer, table and download</span><input id="ad_hid" value="${esc(cfg.hiddenFields || '')}" placeholder="e.g. Annual fee value, Cost to restock to maximum" ${dis}></label>
  <label class="fld"><span>Maximum rows returned per answer</span><input type="number" id="ad_rows" min="10" max="150" value="${cfg.maxRows}" ${dis}></label>
  ${ed ? '<div class="btnrow"><button class="btn primary" data-act="aiAdSaveData">Save data access settings</button></div>' : ''}`);
}
function aiAdUsers() {
  const cfg = aiCfg(), ed = can(AI_ADM, 'Edit'), R = Store.get('roles'), names = Object.keys(R).filter(r => R[r].active !== false);
  const cols = [{ h: 'Role', t: 'text', k: r => r }].concat(AI_PERMS.map(a => ({ h: a, t: 'html', k: r => (R[r].perms[AI_MOD] || []).includes(a) ? '<span class="green">●</span>' : '<span class="muted">–</span>', x: r => (R[r].perms[AI_MOD] || []).includes(a) ? 'Yes' : 'No' }))).concat([{ h: 'Users', t: 'num', k: r => users().filter(u => u.role === r).length }]);
  const U = users().filter(u => u.status === 'Active'), blocked = new Set(cfg.blockedUsers);
  return card('Role-wise AI access', `<p class="small muted">What each role may do in the AI Assistant. Change a role's rights in <b>Roles &amp; Permissions</b> (module “AI Assistant”).</p>${table('aiRoles', cols, names, { title: 'AI access by role', compact: true })}${can('admin_roles', 'View') ? '<div class="btnrow"><button class="btn" data-act="goRoute" data-k="admin_roles">Open Roles &amp; Permissions</button></div>' : ''}`)
    + card('User-wise AI access', `<p class="small muted">Blocked users cannot use the AI Assistant or the floating button, even if their role allows it.</p><div class="ctrls"><label class="fld grow"><span>Block a user</span><select id="ad_bu" ${ed ? '' : 'disabled'}><option value="">Select a user…</option>${U.filter(u => !blocked.has(u.id)).map(u => `<option value="${esc(u.id)}">${esc(u.name)} · ${esc(u.role)}</option>`).join('')}</select></label>${ed ? '<button class="btn" data-act="aiAdBlock">Block</button>' : ''}</div>${table('aiBlk', [{ h: 'Blocked user', t: 'text', k: id => (userById(id) || {}).name || id }, { h: 'Role', t: 'text', k: id => (userById(id) || {}).role || '' }, { h: '', t: 'html', noexp: true, k: id => ed ? `<button class="btn sm" data-act="aiAdUnblock" data-k="${esc(id)}">Allow again</button>` : '' }], cfg.blockedUsers, { title: 'Blocked users', empty: 'No user is blocked.' })}`);
}
function aiAdTpl() {
  const cfg = aiCfg(), ed = can(AI_ADM, 'Edit'), T = cfg.templates || AI_SUGGEST.map((q, i) => ({ id: 'T' + (i + 1), text: q, on: true, roles: [], seed: true }));
  const roles = Object.keys(Store.get('roles'));
  return card('Prompt templates for management questions', `<p class="small muted">Templates appear as one-click suggestions for the roles selected (all roles when none are selected). The assistant still answers only from the asker's permitted data.</p>
    ${table('aiTpl', [{ h: 'Question', t: 'text', cls: 'wrap', k: t => t.text }, { h: 'Roles', t: 'text', cls: 'small wrap', k: t => (t.roles || []).length ? t.roles.join(', ') : 'All roles' }, { h: 'Status', t: 'html', k: t => pill(t.on === false ? 'Hidden' : 'Shown', t.on === false ? 'warn' : 'good') }, { h: '', t: 'html', noexp: true, k: t => ed ? `<div class="btnrow"><button class="btn sm ghost" data-act="aiTplTog" data-k="${esc(t.id)}">${t.on === false ? 'Show' : 'Hide'}</button><button class="btn sm" data-act="aiTplDel" data-k="${esc(t.id)}">Delete</button></div>` : '' }], T, { title: 'Prompt templates', empty: 'No templates.' })}
    ${ed ? `<h4 class="blk">Add a template</h4><div class="form-grid"><label class="fld"><span>Question</span><input id="tp_q" maxlength="200" placeholder="e.g. Which branches have more than 20 zero payers?"></label><label class="fld"><span>Only for roles (optional)</span><select id="tp_r" multiple size="5">${roles.map(r => `<option>${esc(r)}</option>`).join('')}</select></label></div><div class="btnrow"><button class="btn primary" data-act="aiTplAdd">Add template</button></div>` : ''}`);
}
function aiAdModels() {
  const cfg = aiCfg(), ed = can(AI_ADM, 'Edit'), dis = ed ? '' : 'disabled', eng = (id, v, all) => `<select id="${id}" ${dis}>${[['', all ? 'Use the default engine' : 'Application AI (built-in)'], ['builtin', 'Application AI (built-in, always available)'], ['claude', 'Claude – optional enhancement'], ['chatgpt', 'ChatGPT via gateway – optional enhancement']].filter(o => all || o[0]).map(o => `<option value="${o[0]}" ${(v || '') === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select>`;
  const tier = (id, v) => `<select id="${id}" ${dis}>${[['default', 'Standard'], ['complex', 'Deeper reasoning (slower)']].map(o => `<option value="${o[0]}" ${v === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select>`;
  const g = cfg.chatgpt;
  return card('Models and integrations', `<div class="form-grid"><label class="fld"><span>Default answer engine</span>${eng('am_def', cfg.provider, false)}</label>
    <label class="fld"><span>Model quality for questions (Claude)</span>${tier('am_t_chat', cfg.tiers.chat)}</label><label class="fld"><span>Model quality for summaries and reports (Claude)</span>${tier('am_t_sum', cfg.tiers.summary)}</label></div>
    <h4 class="blk">Engine per module / task</h4><div class="form-grid">${Object.entries(AI_DOMAINS).map(([d, l]) => `<label class="fld"><span>${esc(l)}</span>${eng('am_e_' + d, cfg.engines[d], true)}</label>`).join('')}</div>
    <h4 class="blk">ChatGPT (OpenAI) integration</h4><div class="note warn small">A web page cannot call OpenAI directly without exposing the key to every browser. ChatGPT therefore needs a server-side gateway that you host and that holds or relays the key. The settings below are stored, and the key is stored encrypted, but ChatGPT answers stay inactive until a gateway is connected and tested; until then the built-in analyst answers.</div>
    <div class="form-grid"><label class="fld"><span>Gateway URL (HTTPS)</span><input id="am_gw" value="${esc(g.gatewayUrl || '')}" placeholder="https://ai-gateway.example.org/v1" ${dis}></label><label class="fld"><span>Model name</span><input id="am_gm" value="${esc(g.model || '')}" placeholder="e.g. gpt-4.1" ${dis}></label>
    <label class="chk"><input type="checkbox" id="am_gen" ${g.enabled ? 'checked' : ''} ${dis}> Gateway is connected and tested (makes ChatGPT selectable)</label></div>
    <div class="form-grid"><label class="fld"><span>API key ${g.enc ? '(stored encrypted: ' + esc(g.enc.hint) + ')' : '(not stored)'}</span><input type="password" id="am_key" autocomplete="off" placeholder="${g.enc ? 'Leave blank to keep the stored key' : 'Paste the key'}" ${dis}></label><label class="fld"><span>Passphrase to encrypt the key (not stored; needed to use it)</span><input type="password" id="am_pass" autocomplete="off" minlength="8" ${dis}></label></div>
    <p class="small muted">The key is encrypted in the browser with AES-256-GCM using a key derived from your passphrase (PBKDF2, 250,000 rounds) before it is saved. Lose the passphrase and the key must be entered again. The passphrase is never saved.</p>
    <h4 class="blk">Human approval before anything leaves the application</h4><div class="form-grid"><label class="chk"><input type="checkbox" id="am_appr" ${cfg.needApproval ? 'checked' : ''} ${dis}> Reports must be approved by an approver before they can be emailed or sent on WhatsApp</label><label class="chk"><input type="checkbox" id="am_appr2" ${cfg.approveSummaries ? 'checked' : ''} ${dis}> Scheduled summaries also need approval before sharing</label><label class="chk"><input type="checkbox" id="am_share" ${cfg.share ? 'checked' : ''} ${dis}> Allow sharing by email / WhatsApp at all</label><label class="chk"><input type="checkbox" id="am_ch_e" ${cfg.channels.email ? 'checked' : ''} ${dis}> Email channel configured</label><label class="chk"><input type="checkbox" id="am_ch_w" ${cfg.channels.whatsapp ? 'checked' : ''} ${dis}> WhatsApp channel configured</label></div>
    ${ed ? '<div class="btnrow"><button class="btn primary" data-act="aiAdSaveModels">Save model and integration settings</button></div>' : ''}`);
}
function aiAdAudit() {
  const Q = aiAllLog().filter(x => x.event === 'Question'), by = {}; Q.forEach(x => { const o = by[x.userId] || (by[x.userId] = { u: x.user, role: x.role, n: 0, blk: 0, last: '' }); o.n++; if (/Blocked|Partly/.test(x.status)) o.blk++; if ((x.ts || '') > o.last) o.last = x.ts; });
  const use = Object.values(by).sort((a, b) => b.n - a.n), ex = aiAllLog().filter(x => x.event === 'Report'), sh = []; ex.forEach(r => (r.shares || []).forEach(s => sh.push(Object.assign({ title: r.title }, s))));
  const cols = [{ h: 'Date and time', t: 'text', k: x => tsLabel(x.ts), x: x => x.ts }, { h: 'User', t: 'text', k: x => x.user }, { h: 'Role', t: 'text', cls: 'small', k: x => x.role }, { h: 'Question', t: 'text', cls: 'wrap', k: x => x.question }, { h: 'Answer', t: 'text', cls: 'wrap small', k: x => x.answer || '' }, { h: 'Data sources and scope', t: 'text', cls: 'wrap small', k: x => x.accessed }, { h: 'Tools run', t: 'text', cls: 'wrap small', k: x => x.tools }, { h: 'Data sync', t: 'text', cls: 'small', k: x => x.sync || '' }, { h: 'Input', t: 'text', cls: 'small', k: x => (x.input || 'Text') + ' · ' + (x.lang || 'en-IN') }, { h: 'Exports', t: 'text', cls: 'wrap small', k: x => x.report || '—' }, { h: 'Engine', t: 'text', cls: 'small', k: x => x.engine }, { h: 'Status', t: 'text', cls: 'small', k: x => x.status }];
  return card(`Usage by user (${NUM(use.length)})`, table('aiUse', [{ h: 'User', t: 'text', k: o => o.u }, { h: 'Role', t: 'text', k: o => o.role }, { h: 'Questions', t: 'num', k: o => o.n }, { h: 'Blocked', t: 'num', k: o => o.blk }, { h: 'Last used', t: 'text', k: o => tsLabel(o.last), x: o => o.last }], use, { title: 'AI usage by user', empty: 'No usage yet.' }))
    + card(`Every query, response and export (${NUM(Q.length)})`, exportBtns('aiAudit', AI_ADM) + table('aiAudit', cols, Q, { title: 'AI audit log', limit: 50, empty: 'No questions have been asked yet.' }), { sub: 'Append-only: entries cannot be edited or deleted from the application.' })
    + card(`External shares (${NUM(sh.length)})`, table('aiShr', [{ h: 'When', t: 'text', k: s => tsLabel(s.at), x: s => s.at }, { h: 'Report', t: 'text', k: s => s.title }, { h: 'Channel', t: 'text', k: s => s.ch }, { h: 'To', t: 'text', cls: 'small', k: s => s.to }, { h: 'By', t: 'text', k: s => s.by }], sh, { title: 'AI external shares', empty: 'Nothing has been shared outside the application.' }));
}
function aiAdSync() {
  const S = Store.get('sync'), runs = S.runs || [], cfg = aiCfg(), probe = App.ui.aiProbe;
  const ok = runs.filter(r => r.status === 'Success').length;
  const res = probe ? table('aiPr', [{ h: 'Data tool', t: 'text', k: r => r.tool }, { h: 'Source', t: 'text', k: r => r.src }, { h: 'Result', t: 'html', k: r => pill(r.ok ? 'OK' : 'Check', r.ok ? 'good' : 'bad') }, { h: 'Detail', t: 'text', cls: 'small wrap', k: r => r.msg }], probe.rows, { title: 'Tool health', limit: 60 }) : '<p class="small muted">Run the check to confirm that every AI data tool can read its source right now.</p>';
  return `<div class="kpis k4">${aiAdKpi('Last successful ERP sync', aiSyncLabel())}${aiAdKpi('Recent sync runs', NUM(runs.length), NUM(ok) + ' successful')}${aiAdKpi('Failed runs', NUM(runs.length - ok))}${aiAdKpi('Data as on', dLabel(D_()))}</div>`
    + card('Sync history', table('aiSy', [{ h: 'When', t: 'text', k: r => tsLabel(r.at), x: r => r.at }, { h: 'Entity', t: 'text', k: r => r.entity || '' }, { h: 'Status', t: 'html', k: r => pill(r.status, r.status === 'Success' ? 'good' : 'bad') }, { h: 'Records OK', t: 'num', k: r => r.ok || 0 }, { h: 'Failed', t: 'num', k: r => r.failed || 0 }, { h: 'Duplicates', t: 'num', k: r => r.dups || 0 }, { h: 'By', t: 'text', k: r => r.by || '' }], runs, { title: 'ERP sync history', limit: 15, empty: 'No sync runs.' }))
    + card('AI data tool health check', `<div class="btnrow"><button class="btn primary" data-act="aiAdProbe">Run health check</button>${probe ? `<span class="small muted">Last run ${esc(tsLabel(probe.at))}</span>` : ''}</div>${res}`, { sub: 'Runs every tool with your own permissions and reports tools that error. Tools your role cannot read are shown as skipped.' });
}
async function aiAdAudit_(action, detail) { audit('AI Control Centre', action, { new: detail }); }
const aiGv = id => { const e = document.getElementById(id); return e ? e.value : ''; }, aiGc = id => { const e = document.getElementById(id); return !!(e && e.checked); };
Object.assign(AI_ACT, {
  goRoute: t => go(t.dataset.k),
  aiAdSaveData: async () => {
    if (!can(AI_ADM, 'Edit')) return toast('You have read-only access.', 'bad');
    const domains = Object.fromEntries(Object.keys(AI_DOMAINS).map(k => [k, aiGc('ad_d_' + k)])), tools = {}; Object.keys(AI_T).forEach(k => { if (!aiGc('ad_t_' + k)) tools[k] = false; });
    const patch = { domains, tools, sensitive: { studentLevel: aiGc('ad_s_stu'), staffLevel: aiGc('ad_s_staff') }, hiddenFields: aiGv('ad_hid').trim().slice(0, 300), maxRows: Math.max(10, Math.min(150, +aiGv('ad_rows') || 100)) };
    await aiSaveCfg(patch); aiAdAudit_('AI data access changed', JSON.stringify({ off: Object.keys(domains).filter(k => !domains[k]), toolsOff: Object.keys(tools), sensitive: patch.sensitive, hidden: patch.hiddenFields })); toast('Data access settings saved.'); render();
  },
  aiAdBlock: async () => { if (!can(AI_ADM, 'Edit')) return; const id = aiGv('ad_bu'); if (!id) return toast('Select a user first.', 'bad'); const cfg = aiCfg(); await aiSaveCfg({ blockedUsers: cfg.blockedUsers.concat(id) }); aiAdAudit_('User blocked from AI', ((userById(id) || {}).name || id)); toast('User blocked from the AI Assistant.'); render(); },
  aiAdUnblock: async t => { if (!can(AI_ADM, 'Edit')) return; const cfg = aiCfg(); await aiSaveCfg({ blockedUsers: cfg.blockedUsers.filter(x => x !== t.dataset.k) }); aiAdAudit_('User AI access restored', ((userById(t.dataset.k) || {}).name || t.dataset.k)); render(); },
  aiTplAdd: async () => {
    if (!can(AI_ADM, 'Edit')) return; const q = aiGv('tp_q').trim(); if (q.length < 8) return toast('Enter the question (at least 8 characters).', 'bad');
    const cfg = aiCfg(), cur = cfg.templates || AI_SUGGEST.map((x, i) => ({ id: 'T' + (i + 1), text: x, on: true, roles: [] })), sel = [...document.getElementById('tp_r').selectedOptions].map(o => o.value);
    await aiSaveCfg({ templates: cur.concat({ id: 'T' + Date.now().toString(36), text: q, on: true, roles: sel }) }); aiAdAudit_('AI prompt template added', q); render();
  },
  aiTplTog: async t => { if (!can(AI_ADM, 'Edit')) return; const cfg = aiCfg(), cur = cfg.templates || AI_SUGGEST.map((x, i) => ({ id: 'T' + (i + 1), text: x, on: true, roles: [] })); await aiSaveCfg({ templates: cur.map(x => x.id === t.dataset.k ? Object.assign({}, x, { on: x.on === false }) : x) }); aiAdAudit_('AI prompt template toggled', t.dataset.k); render(); },
  aiTplDel: async t => { if (!can(AI_ADM, 'Edit')) return; const cfg = aiCfg(), cur = cfg.templates || AI_SUGGEST.map((x, i) => ({ id: 'T' + (i + 1), text: x, on: true, roles: [] })); await aiSaveCfg({ templates: cur.filter(x => x.id !== t.dataset.k) }); aiAdAudit_('AI prompt template deleted', t.dataset.k); render(); },
  aiAdSaveModels: async () => {
    if (!can(AI_ADM, 'Edit')) return toast('You have read-only access.', 'bad');
    const cfg = aiCfg(), key = aiGv('am_key').trim(), pass = aiGv('am_pass'), chatgpt = Object.assign({}, cfg.chatgpt, { gatewayUrl: aiGv('am_gw').trim(), model: aiGv('am_gm').trim(), enabled: aiGc('am_gen') });
    if (chatgpt.gatewayUrl && !/^https:\/\//i.test(chatgpt.gatewayUrl)) return toast('The gateway URL must start with https://', 'bad');
    if (key) { if (pass.length < 8) return toast('Enter a passphrase of at least 8 characters to encrypt the key.', 'bad'); try { chatgpt.enc = await aiEncrypt(key, pass); } catch (e) { return toast('This browser cannot encrypt the key, so it was not saved.', 'bad'); } }
    if (chatgpt.enabled && (!chatgpt.gatewayUrl || !chatgpt.model)) return toast('Enter the gateway URL and model before marking the gateway as connected.', 'bad');
    const engines = {}; Object.keys(AI_DOMAINS).forEach(d => { const v = aiGv('am_e_' + d); if (v) engines[d] = v; });
    const patch = { provider: aiGv('am_def') || 'builtin', engineV2: true, tiers: { chat: aiGv('am_t_chat') || 'default', summary: aiGv('am_t_sum') || 'default' }, engines, chatgpt, needApproval: aiGc('am_appr'), approveSummaries: aiGc('am_appr2'), share: aiGc('am_share'), channels: { email: aiGc('am_ch_e'), whatsapp: aiGc('am_ch_w') } };
    await aiSaveCfg(patch); aiAdAudit_('AI models and integrations changed', JSON.stringify({ provider: patch.provider, engines, tiers: patch.tiers, gateway: chatgpt.gatewayUrl, model: chatgpt.model, keyChanged: !!key, needApproval: patch.needApproval, share: patch.share })); toast('Model and integration settings saved.'); render();
  },
  aiAdProbe: () => {
    const rows = []; Object.values(AI_T).forEach(t => {
      if (!can(t.mod, 'View') || (t.needs && t.needs.some(m => !can(m, 'View')))) return rows.push({ tool: t.title || t.name, src: MODLABEL(t.mod), ok: true, msg: 'Skipped: your role cannot read this source.' });
      const tr = [], r = (() => { try { const c = aiCtx(), x = t.run({}, c); return x; } catch (e) { return { error: e.message }; } })();
      rows.push(r && r.error && !r.blocked ? { tool: t.title || t.name, src: MODLABEL(t.mod), ok: false, msg: r.error } : r && r.clarify ? { tool: t.title || t.name, src: MODLABEL(t.mod), ok: true, msg: 'Needs a branch to run (by design).' } : { tool: t.title || t.name, src: MODLABEL(t.mod), ok: !!r, msg: r ? (r.error || NUM((r.rows || []).length) + ' rows read') : 'No result' });
    });
    App.ui.aiProbe = { at: new Date().toISOString(), rows }; aiAdAudit_('AI data tool health check', rows.filter(r => !r.ok).length + ' issue(s)'); render();
  }
});
