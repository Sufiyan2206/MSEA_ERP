/* ===== Layout, navigation, filters, actions, boot ===== */
const NAV = [
  ['My Day', [['myday', 'My Day']]],
  ['Strength & admissions', [['exec', 'Executive dashboard'], ['strength', 'Strength, target & capacity'], ['cancel', 'Cancellations & withdrawals'], ['targets', 'Target planning'], ['capacity', 'Capacity setup'], ['admplan', 'Admission plan'], ['students', 'Student Corner'], ['revenue', 'Revenue & collection'], ['compare', 'Multi-year comparison']]],
  ['Fee collection', [['corp', 'Corporate dashboard'], ['gaps', 'Gap Analysis Center'], ['tasks', 'Task & approval center'], ['automation', 'Automation center'], ['rbuild', 'Report builder'], ['dashboard', 'Collections dashboard'], ['daily', 'Daily collection'], ['target', 'Monthly collection target'], ['instalment', 'Instalment dues'], ['billing', 'Billing'], ['collections', 'Collections desk'], ['onlinepay', 'Online payments'], ['feestruct', 'Fee structure'], ['iplans', 'Instalment plans'], ['refunds', 'Refunds & concessions'], ['reminders', 'Fee reminders'], ['cashctl', 'Cash control'], ['zeropayer', 'Zero payers'], ['alerts', 'Alerts'], ['exceptions', 'Exceptions'], ['email', 'Email reports']]],
  ['Finance', [['fn_home', 'Finance control centre'], ['fn_gl', 'General ledger'], ['fn_ar', 'Accounts receivable'], ['fn_ap', 'Accounts payable'], ['fn_bank', 'Cash management'], ['fn_budget', 'Budget & cost control'], ['intercompany', 'Inter-company'], ['fn_reports', 'Financial reports'], ['settings', 'Targets & instalments'], ['approvals', 'Approvals'], ['import', 'Data import'], ['rm_home', 'Rent management'], ['rm_master', 'Rent master'], ['rm_entries', 'Monthly rent processing'], ['rm_ledger', 'Rent accounting & payments'], ['rm_import', 'Rent – Tally import'], ['rm_reports', 'Rent reports']]],
  ['SRF incentives', [['srf_dashboard', 'SRF dashboard'], ['srf_submission', 'SRF request'], ['srf_verification', 'Verification'], ['srf_payment', 'Payments'], ['srf_policy', 'Incentive policy'], ['srf_reports', 'SRF reports'], ['srf_spec', 'Help & specification']]],
  ['Store & purchase', [['pr_home', 'Store & purchase dashboard'], ['pr_inbox', 'Approvals inbox'], ['pr_mr', 'Material requests'], ['pr_pr', 'Purchase requests'], ['pr_store', 'Store & inventory'], ['pr_vendors', 'Vendors & quotations'], ['pr_po', 'Purchase orders'], ['pr_budget', 'Budget & finance'], ['pr_reports', 'Store & purchase reports']]],
  ['Asset management', [['as_home', 'Asset dashboard'], ['as_register', 'Asset register'], ['as_alloc', 'Allocation & returns'], ['as_transfer', 'Transfers'], ['as_maint', 'Maintenance, warranty & AMC'], ['as_verify', 'Verification & audit'], ['as_incidents', 'Missing, damaged & disposal'], ['as_finance', 'Fixed assets & depreciation'], ['as_requests', 'Asset requests'], ['as_reports', 'Asset reports']]],
  ['Petty cash', [['cb_home', 'Petty cash dashboard'], ['cb_day', 'Daily cash book'], ['cb_vouchers', 'Expense vouchers'], ['cb_advances', 'Advances & reimbursements'], ['cb_replenish', 'Replenishment'], ['cb_reports', 'Petty cash reports']]],
  ['Utilities', [['ut_home', 'Utilities dashboard'], ['ut_conns', 'Connections'], ['ut_bills', 'Bills & payments'], ['ut_meters', 'Meters, water & tankers'], ['ut_ptax', 'Property tax'], ['ut_rent', 'Rent & leases'], ['ut_tickets', 'Complaints & renewals'], ['ut_reports', 'Utilities reports']]],
  ['Bank reconciliation', [['br_home', 'Reconciliation dashboard'], ['br_recon', 'Direct reconciliation'], ['br_fees', 'Fee collection reconciliation'], ['br_bulk', 'Bulk payment reconciliation'], ['br_import', 'Statements & import'], ['br_accounts', 'Bank account master'], ['br_reports', 'BRS & reports']]],
  ['Human Resources', [['hr_home', 'HR dashboard'], ['hr_ess', 'Self-service'], ['hr_roster', 'Shift roster'], ['hr_emp', 'Employee master'], ['hr_prf', 'Staff requirement (PRF)'], ['hr_recruit', 'Recruitment & ATS'], ['hr_onboard', 'Onboarding & confirmation'], ['hr_att', 'Attendance & shifts'], ['hr_leave', 'Leave & holidays'], ['hr_pms', 'Performance'], ['hr_train', 'Training & CPT'], ['hr_exit', 'Separation & exit'], ['hr_comp', 'Grievance, discipline & compliance'], ['hr_reports', 'HR reports']]],
  ['Maintenance Management', [['mm_home', 'Maintenance Management'], ['tc_app', 'Technician App'], ['mm_app', 'Maintenance Manager App'], ['tcv_home', 'Technician Conveyance & Daily Work Report']]],
  ['Student information', [['sis', 'Student information system'], ['certs', 'Certificates & ID cards'], ['moves', 'Student moves'], ['helpdesk', 'Parent help desk']]],
  ['Academics', [['teach', 'Teach (smart classroom)'], ['content', 'Content library'], ['devices', 'Classroom devices & sync'], ['acdash', 'Academic dashboards'], ['acad', 'Academic management'], ['acplan', 'Academic planning'], ['attendance', 'Student attendance'], ['tapp', 'Teacher app'], ['portal', 'Parent & Student app'], ['lms', 'Learning management'], ['exam', 'Examinations'], ['house', 'House system'], ['meet', 'Meetings'], ['consent', 'Parent consents'], ['tac', 'Teacher academy & policies'], ['lrc', 'Outcomes & report cards'], ['qps', 'Question paper security'], ['lib', 'Library'], ['smk', 'Smart classroom & kits'], ['cur', 'Curriculum master'], ['fbp', 'Foundation & board prep'], ['hostel', 'Hostel & mess'], ['transport', 'Transport'], ['alumni', 'Alumni & placements'], ['rollover', 'Backup & year-end']]],
  ['Planner', [['cal', 'Calendar & planner']]],
  ['Franchise', [['franchise', 'Franchise management']]],
  ['Compliance', [['udise', 'UDISE+ & compliance']]],
  ['Communication', [['cmc', 'Communication centre'], ['ealerts', 'Emergency alerts'], ['surveys', 'Parent surveys']]],
  ['Admissions CRM', [['crm_home', 'CRM'], ['adp', 'Tests & seat offers']]],
  ['IT Management', [['it_home', 'IT Management'], ['it_mgr_app', 'IT Manager App'], ['it_tech_app', 'IT Technician App']]],
  ['Legal & Compliance', [['lc_home', 'Compliance dashboard'], ['lc_register', 'Document register'], ['lc_cal', 'Compliance calendar'], ['lc_renew', 'Renewals & filings'], ['lc_cases', 'Cases & notices'], ['lc_reports', 'Legal reports'], ['lc_setup', 'Setup'], ['lc_audit', 'Audit trail']]],
  ['Payroll', [['py_home', 'Payroll dashboard'], ['py_run', 'Payroll processing'], ['py_salary', 'Salary structures'], ['py_bank', 'Staff bank information'], ['py_reports', 'Payroll reports'], ['py_statutory', 'Statutory files'], ['gratuity', 'Gratuity'], ['psd_home', 'Salary release'], ['psd_me', 'My salary status']]],
  ['AI Assistant', [['ai_chat', 'AI Assistant'], ['ai_admin', 'AI Control Centre']]],
  ['Admin control centre', [['sa_home', 'Super Admin dashboard'], ['admin_home', 'Overview'], ['admin_users', 'Users'], ['admin_roles', 'Roles & permissions'], ['hierarchy', 'Organisation & directors'], ['admin_mapping', 'Data scope mapping'], ['sa_access', 'Access & sensitive data'], ['sa_rules', 'Data access rules'], ['sa_modules', 'Module control'], ['sa_workflows', 'Approval workflows'], ['sa_requests', 'Access requests'], ['masters', 'Category masters'], ['admin_email', 'Email distribution'], ['admin_sync', 'ERP sync'], ['srf_sysadmin', 'SRF settings & mapping'], ['pr_admin', 'Store & purchase settings'], ['as_admin', 'Asset control centre'], ['cb_admin', 'Petty cash control centre'], ['ut_admin', 'Utilities control centre'], ['rm_admin', 'Rent control centre'], ['fn_admin', 'Finance control centre'], ['br_admin', 'Bank reconciliation control centre'], ['hr_admin', 'HR control centre'], ['audit', 'Audit log'], ['sa_reports', 'Access & security reports']]]
];
const FILTER_PAGES = new Set(['exec', 'strength', 'cancel', 'targets', 'capacity', 'admplan', 'revenue', 'compare', 'dashboard', 'daily', 'target', 'instalment', 'billing', 'zeropayer', 'students', 'alerts', 'exceptions', 'email', 'srf_dashboard', 'srf_submission', 'srf_verification', 'srf_payment', 'srf_reports', 'pr_home', 'pr_mr', 'pr_pr', 'pr_inbox', 'pr_store', 'pr_vendors', 'pr_po', 'pr_budget', 'pr_reports', 'as_home', 'as_register', 'as_alloc', 'as_transfer', 'as_maint', 'as_verify', 'as_incidents', 'as_finance', 'as_requests', 'as_reports', 'cb_home', 'cb_vouchers', 'cb_advances', 'cb_day', 'cb_replenish', 'cb_reports', 'ut_home', 'ut_conns', 'ut_bills', 'ut_meters', 'ut_ptax', 'ut_rent', 'ut_tickets', 'ut_reports', 'rm_home', 'rm_master', 'rm_entries', 'rm_ledger', 'rm_reports']);
const F0 = () => ({ ay: App.f.ay || CUR_AY, date: SRC.today, region: '', zone: '', entity: '', director: '', rd: '', zd: '', branch: '', type: '', group: 'branch', cls: '', sec: '', stCat: '', feeCat: '', source: '', couns: '', from: '2026-01-01' });
const LS = { get(k) { try { return localStorage.getItem('msea.' + k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem('msea.' + k, v); } catch (e) { } } };

function pickUser() {
  const id = LS.get('user'); const u = (id && userById(id)) || users().find(x => x.role === 'CFO');
  App.user = u;
}
const pageOk = k => !!PAGES[k] && can(PAGES[k].mod) && (!PAGES[k].show || PAGES[k].show());
function firstAllowed() { for (const [, items] of NAV) for (const [k] of items) if (pageOk(k)) return k; return null; }

function renderShell() {
  const nav = NAV.map(([g, items]) => { const it = items.filter(([k]) => pageOk(k)); return it.length ? `<div class="navg"><div class="navh">${g}</div>${it.map(([k, l]) => `<a href="#${k}" class="${App.route === k ? 'on' : ''}" data-act="go" data-r="${k}" ${App.route === k ? 'aria-current="page"' : ''}>${l}${k === 'approvals' ? (n => n ? `<span class="badge">${n}</span>` : '')(Store.list('approvals').filter(a => a.status === 'Pending').length) : PAGES[k].badge ? (n => n ? `<span class="badge">${n}</span>` : '')(PAGES[k].badge()) : ''}</a>`).join('')}</div>` : ''; }).join('');
  $('#nav').innerHTML = nav;
  { const gl = $('#gsl'); if (gl) gl.innerHTML = NAV.flatMap(([g, items]) => items.filter(([k]) => pageOk(k)).map(([k, l]) => `<option value="${esc(l)}">${esc(g)}</option>`)).join(''); }
  const groups = ROLES.map(r => { const g = users().filter(u => u.role === r); return g.length ? `<optgroup label="${esc(r)}">${g.map(u => `<option value="${u.id}" ${u.id === App.user.id ? 'selected' : ''}>${esc(u.name.replace(' (demo)', ''))}${u.status !== 'Active' ? ' – ' + u.status : ''}</option>`).join('')}</optgroup>` : ''; }).join('');
  $('#who').innerHTML = `<label class="fld whosel"><span>Signed in as (demo)</span><select id="userSel" data-act="switchUser">${groups}</select></label>`;
  const s = Store.get('sync'), ok = s.runs[0].status === 'Success';
  $('#sync').innerHTML = `<span class="dot ${ok ? 'g' : 'r'}"></span><span><b>Last ERP sync</b> ${tsLabel(s.lastSuccess)}</span>`;
  $('#mode').textContent = Store.mode === 'shared' ? (Store.writable ? 'Shared workspace' : 'Shared workspace · view only') : 'Local preview – changes are not saved';
}

function renderFilters() {
  const el = $('#filters');
  const ft = $('#ftoggle');
  if (!FILTER_PAGES.has(App.route)) { el.hidden = true; if (ft) ft.hidden = true; return; }
  el.hidden = false; if (ft) { ft.hidden = false; const n = ['region', 'zone', 'director', 'rd', 'zd', 'branch', 'type', 'cls', 'sec', 'stCat', 'feeCat', 'source', 'couns'].filter(k => App.f[k]).length + (App.f.date !== SRC.today ? 1 : 0); ft.textContent = 'Filters' + (n ? ` (${n})` : ''); ft.setAttribute('aria-expanded', document.body.classList.contains('filtersopen')); }
  const sc = [...scopeOf(App.user)].map(i => DATA.branches[i]).filter(b => !b.closed); const f = App.f;
  const opt = (arr, val, all) => `<option value="">${all}</option>` + arr.map(([k, l]) => `<option value="${esc(k)}" ${k === val ? 'selected' : ''}>${esc(l)}</option>`).join('');
  const uniq = a => [...new Set(a)].sort();
  const regions = uniq(sc.map(b => b.region)), zones = uniq(sc.filter(b => !f.region || b.region === f.region).map(b => b.zone));
  const brs = sc.filter(b => (!f.region || b.region === f.region) && (!f.zone || b.zone === f.zone) && (!f.type || b.type === f.type)).map(b => [b.id, b.name + (b.inactive ? ' (inactive)' : '')]);
  const types = uniq(sc.map(b => b.type));
  const heads = kind => { const m = new Map(); sc.filter(b => kind === 'zd' ? (!f.region || b.region === f.region) : true).forEach(b => { const u = headOf(kind, b); if (u) m.set(u.id, `${pName(u)} · ${kind === 'rd' ? b.region : b.zone}`); }); return [...m.entries()].sort((a, c) => a[1].localeCompare(c[1])); };
  const rds = heads('rd'), zds = heads('zd');
  const views = Store.list('views').filter(x => x.owner === App.user.id);
  const pg = PAGES[App.route];
  el.innerHTML = `<label class="fld"><span>Academic year</span><select data-f="ay">${yearsList().map(y => `<option value="${y.code}" ${y.code === f.ay ? 'selected' : ''}>${y.code}${y.status === 'Current' ? ' (current)' : y.status === 'Upcoming' ? ' (upcoming)' : ''}</option>`).join('')}</select></label>
  <label class="fld"><span>As on date</span><input type="date" id="fDate" data-f="date" value="${f.date}" min="2026-04-01" max="${SRC.today}"></label>
  ${(typeof FM === 'function' && FM() && FM().entities && FM().entities.length > 1) ? `<label class="fld"><span>Entity</span><select data-f="entity">${opt(FM().entities.map(e => [e.id, e.name]), f.entity, 'All entities')}</select></label>` : ''}
  ${regions.length > 1 ? `<label class="fld"><span>Region / state</span><select data-f="region">${opt(regions.map(r => [r, r]), f.region, 'All regions')}</select></label>` : ''}
  ${rds.length > 1 ? `<label class="fld"><span>Regional Director</span><select data-f="rd">${opt(rds, f.rd, 'All regional directors')}</select></label>` : ''}
  ${zds.length > 1 ? `<label class="fld"><span>Zonal Director</span><select data-f="zd">${opt(zds, f.zd, 'All zonal directors')}</select></label>` : ''}
  ${zones.length > 1 ? `<label class="fld"><span>Zone</span><select data-f="zone">${opt(zones.map(r => [r, r]), f.zone, 'All zones')}</select></label>` : ''}
  ${brs.length > 1 ? `<label class="fld wide"><span>Branch</span><select data-f="branch">${opt(brs, f.branch, 'All branches')}</select></label>` : ''}
  ${types.length > 1 ? `<label class="fld"><span>School type</span><select data-f="type">${opt(types.map(r => [r, r]), f.type, 'All types')}</select></label>` : ''}
  ${pg.sf || App.route === 'compare' ? sfFilters(sc) : ''}
  ${pg.group ? `<label class="fld"><span>Show by</span><select data-f="group">${[['branch', 'Branch'], ['zd', 'Zonal Director'], ['rd', 'Regional Director'], ['region', 'Region'], ['zone', 'Zone'], ['type', 'School type'], ['group', 'Group total']].map(([k, l]) => `<option value="${k}" ${f.group === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>` : ''}
  <div class="fbtns"><button class="btn sm ghost" data-act="resetF">Reset</button><button class="btn sm ghost" data-act="saveView">Save view</button><button class="btn sm ghost" data-act="pinPage" title="Pin this page and its filters to your board">Pin</button>${views.length ? `<select class="views" data-act="loadView" aria-label="Saved views"><option value="">Saved views…</option>${views.map(x => `<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select>` : ''}</div>`;
}

function sfFilters(sc) {
  const f = App.f, opt = (arr, val, all) => `<option value="">${all}</option>` + arr.map(([k, l]) => `<option value="${esc(k)}" ${k === val ? 'selected' : ''}>${esc(l)}</option>`).join('');
  const bset = new Set(sc.filter(b => (!f.branch || b.id === f.branch) && (!f.region || b.region === f.region) && (!f.zone || b.zone === f.zone)).map(b => DATA.branches.indexOf(b)));
  const cls = [...new Set(DATA.students.filter(s => bset.has(s.b)).map(s => s.cls))].sort((a, c) => clsRank(a) - clsRank(c));
  const secs = f.cls ? [...new Set(DATA.students.filter(s => bset.has(s.b) && s.cls === f.cls).map(s => s.sec))].sort() : [];
  const C = Store.get('categories');
  const cou = users().filter(u => u.role === 'Admissions Counsellor' && [...bset].some(i => DATA.branches[i].zone === u.zone));
  const extra = App.route === 'compare' ? '' : `<label class="fld"><span>Student category</span><select data-f="stCat">${opt(C.student.filter(c => c.active).sort((a, b) => a.order - b.order).map(c => [c.id, c.name]), f.stCat, 'All')}</select></label>
  <label class="fld"><span>Fee category</span><select data-f="feeCat">${opt(C.fee.filter(c => c.active).sort((a, b) => a.order - b.order).map(c => [c.id, c.name]), f.feeCat, 'All')}</select></label>
  <label class="fld"><span>Admission source</span><select data-f="source">${opt(SOURCES.map(x => [x, x]), f.source, 'All')}</select></label>
  ${cou.length ? `<label class="fld"><span>Counsellor</span><select data-f="couns">${opt(cou.map(u => [u.id, u.name.replace(' (demo)', '').replace('Admissions Counsellor – ', '')]), f.couns, 'All')}</select></label>` : ''}
  <label class="fld"><span>Admissions from</span><input type="date" data-f="from" value="${f.from}" min="2025-10-01" max="${f.date}"></label>`;
  return `<label class="fld"><span>Class</span><select data-f="cls">${opt(cls.map(x => [x, x]), f.cls, 'All classes')}</select></label>${secs.length ? `<label class="fld"><span>Section</span><select data-f="sec">${opt(secs.map(x => [x, x]), f.sec, 'All')}</select></label>` : ''}${extra}`;
}

function render() {
  App.charts.forEach(c => { try { c.destroy(); } catch (e) { } }); App.charts = []; App.mounts = []; App.tables = {};
  if (!App.user) pickUser();
  saApplyRuleFilters();
  renderShell();
  const view = $('#view');
  if (App.user.status !== 'Active') { $('#filters').hidden = true; $('#title').textContent = 'Account ' + App.user.status.toLowerCase(); view.innerHTML = `<div class="noaccess"><h2>This account is ${esc(App.user.status.toLowerCase())}</h2><p>${esc(App.user.name)} cannot sign in. Choose another user, or ask a System Admin to activate the account.</p></div>`; return; }
  if (!PAGES[App.route] || !pageOk(App.route)) { const f = firstAllowed(); if (f && f !== App.route) { App.route = f; } else if (!f) { view.innerHTML = noAccess('any module'); return; } }
  const pg = PAGES[App.route];
  $('#title').textContent = App.route === 'dashboard' && scopeIdx().length === 1 ? 'Branch Collections Dashboard' : pg.title;
  $('#scope').textContent = FILTER_PAGES.has(App.route) ? `${scopeLabel()} · as on ${dLabel(D_())}` : App.route.startsWith('srf_') ? `Seat Reservation Fee incentives · ${scopeLabel()} · AY ${App.f.ay}` : App.route.startsWith('pr_') ? `Store & Purchase · ${scopeLabel()} · ${App.user.role}` : App.route.startsWith('as_') ? `Asset Management · ${scopeLabel()} · ${App.user.role}` : App.route.startsWith('cb_') ? `Petty Cash · ${scopeLabel()} · ${App.user.role}` : App.route.startsWith('ut_') ? `Utilities · ${scopeLabel()} · ${App.user.role}` : App.route.startsWith('rm_') ? `Rent Management · ${scopeLabel()} · ${App.user.role}` : App.route.startsWith('fn_') ? `Finance · ${scopeLabel()} · ${App.user.role}` : App.route.startsWith('br_') ? `Bank Reconciliation · ${App.user.role}` : App.route.startsWith('hr_') ? `Human Resources · ${App.user.role}` : App.route.startsWith('py_') ? `Payroll (restricted) · ${App.user.role}` : App.route.startsWith('lc_') ? `Legal Documents & Compliance · ${App.user.role}` : `${scopeLabel()} · ${App.user.role}`;
  renderFilters();
  let html = '';
  const ERP_PAGES = ['exec', 'strength', 'cancel', 'admplan', 'students', 'revenue', 'dashboard', 'daily', 'target', 'instalment', 'billing', 'zeropayer', 'alerts', 'exceptions', 'email'];
  try { html = !isCurYear() && ERP_PAGES.includes(App.route) ? yearNotice() : pg.render(); } catch (e) { console.error(e); html = `<div class="note bad"><b>This screen hit an error.</b> ${esc(e.message)}</div>`; }
  view.innerHTML = html;
  App.mounts.forEach(f => { try { f(); } catch (e) { console.error(e); } });
  if (App.ui._focus) { const el = document.getElementById(App.ui._focus); if (el) { el.focus(); try { const n = el.value.length; el.setSelectionRange(n, n); } catch (e) { } } App.ui._focus = null; }
  const key = App.user.id + App.route;
  if (!App.seen.has(key) && FILTER_PAGES.has(App.route)) { App.seen.add(key); audit(pg.title, 'Report viewed', { new: scopeLabel() + ' · ' + App.f.date }); }
}
let rq = 0; const rerender = () => { cancelAnimationFrame(rq); rq = requestAnimationFrame(render); };
function go(r) { if (PAGES[r] && App.user && !pageOk(r)) { const why = moduleBlock(PAGES[r].mod, App.user); toast(why || `Your role (${App.user.role}) has no access to ${PAGES[r].title}. Raise an access request under Admin control centre → Access requests.`, 'bad'); return; } App.route = r; try { if (location.hash !== '#' + r) history.replaceState(null, '', '#' + r); } catch (e) { } document.body.classList.remove('navopen'); render(); window.scrollTo(0, 0); }

/* ---------- actions ---------- */
const nowIso = () => new Date().toISOString();
const ACT = {
  go: t => go(t.dataset.r), closeModal: () => closeModal(),
  sort: t => { const id = t.dataset.t, i = +t.dataset.i, s = App.sort[id]; App.sort[id] = s && s.i === i ? { i, dir: -s.dir } : { i, dir: -1 }; rerender(); },
  more: t => { const id = t.dataset.t; App.ui['lim_' + id] = (App.ui['lim_' + id] || App.tables[id].o.limit) + 200; rerender(); },
  export: t => doExport(t.dataset.t, t.dataset.fmt, t.dataset.m),
  ui: t => { App.ui[t.dataset.k] = t.dataset.v; if (t.dataset.k === 'role') App.ui.permDraft = null; rerender(); },
  setDate: t => { App.f.date = t.dataset.v; rerender(); },
  openBranch: t => openBranch(t.dataset.k),
  toStudents: t => { closeModal(); App.f.branch = t.dataset.k; App.f.cls = ''; App.f.sec = ''; go('students'); },
  zpDrill: t => { App.ui.zpDrill = t.dataset.k; rerender(); setTimeout(() => { const c = document.querySelectorAll('.card'); c[c.length - 1].scrollIntoView({ behavior: 'smooth' }); }, 50); },
  clsGo: t => { const [bi, key] = t.dataset.k.split('~'); const [c, sc] = key.split('|'); App.f.branch = DATA.branches[+bi].id; App.f.cls = c; App.f.sec = sc || ''; go('students'); },
  pickCls: t => { App.ui.stCls = t.dataset.k; rerender(); },
  openStudent: t => openStudent(t.dataset.k),
  resetF: () => { App.f = F0(); App.ui.drill = []; rerender(); },
  saveView: () => { modal('Save this view', `<label class="fld"><span>View name</span><input id="vName" placeholder="e.g. Hyderabad South – daily"></label><p class="small muted">Saves the page and filters for ${esc(App.user.name)}.</p>`, `<button class="btn" data-act="closeModal">Cancel</button><button class="btn primary" data-act="saveViewOk">Save</button>`); },
  saveViewOk: () => { const n = v('vName'); if (!n) return; Store.add('views', { owner: App.user.id, name: n, route: App.route, f: Object.assign({}, App.f) }); closeModal(); toast('View saved.'); },
  reasonOk: () => { const r = (v('reasonTxt') || '').trim(); if (!r) { $('#reasonErr').hidden = false; return; } const ev = evRead(); if (ev === false) return; App.ui._evLast = ev || ''; const cb = App.ui._reasonCb; App.ui._reasonCb = null; closeModal(); cb && cb(r); },

  /* finance settings */
  saveTarget: () => {
    const c = Store.clone(Store.get('config')); const tp = +v('sTP'), fd = +v('sFD'), cut = v('sCut'), adv = v('sAdv'), fr = v('sFr');
    if (!(tp > 0 && tp <= 100)) return toast('Enter a target percentage between 1 and 100.', 'bad');
    askReason('Save target rule', tp !== +c.targetPct ? `The default target change from ${c.targetPct}% to ${tp}% will be sent for approval. Other changes apply now.` : 'Changes apply immediately.', async r => {
      const old = { freezeDay: c.targetFreezeDay, cutoff: c.cutoffTime, advanceCounts: c.advanceCounts, freshCounts: !!c.freshCounts };
      if (tp !== +c.targetPct) { await Store.add('approvals', { type: 'targetPct', payload: { from: +c.targetPct, to: tp }, reason: r, requester: App.user.name, requesterId: App.user.id, status: 'Pending' }); audit('Targets & Instalments', 'Target % change requested', { old: c.targetPct + '%', new: tp + '%', reason: r, approval: 'Pending' }); }
      c.targetFreezeDay = fd; c.cutoffTime = cut; c.advanceCounts = adv; c.freshCounts = fr; const nw = { freezeDay: fd, cutoff: cut, advanceCounts: adv, freshCounts: fr };
      if (JSON.stringify(old) !== JSON.stringify(nw)) { await Store.put('config', c); audit('Targets & Instalments', 'Target settings changed', { old: JSON.stringify(old), new: JSON.stringify(nw), reason: r }); }
      toast(tp !== +Store.get('config').targetPct ? 'Saved. Target % change sent for approval.' : 'Saved.'); rerender();
    });
  },
  branchPct: () => { modal('Request branch-specific target %', `<div class="form-grid"><label class="fld"><span>Branch</span><select id="bpB">${DATA.branches.map(b => `<option value="${b.id}">${esc(b.name)}</option>`).join('')}</select></label><label class="fld"><span>Target % of opening outstanding</span><input id="bpP" type="number" min="1" max="100" step="0.5" value="70"></label></div><label class="fld"><span>Reason</span><textarea id="bpR" rows="3"></textarea></label>`, `<button class="btn" data-act="closeModal">Cancel</button><button class="btn primary" data-act="branchPctOk">Submit for approval</button>`); },
  branchPctOk: async () => { const b = v('bpB'), p = +v('bpP'), r = (v('bpR') || '').trim(); if (!r || !(p > 0 && p <= 100)) return toast('Enter a percentage and a reason.', 'bad'); const c = Store.get('config'); await Store.add('approvals', { type: 'branchPct', payload: { branch: b, from: c.branchPct[b] != null ? c.branchPct[b] : c.targetPct, to: p }, reason: r, requester: App.user.name, requesterId: App.user.id, status: 'Pending' }); audit('Targets & Instalments', 'Branch target % requested', { new: brName(b) + ': ' + p + '%', reason: r, approval: 'Pending' }); closeModal(); toast('Sent for approval.'); },
  freeze: () => askReason('Freeze monthly targets', `Fixes each branch target for ${ymOf(D_())} at its current value.`, async r => {
    const c = Store.clone(Store.get('config')), D = D_(), ym = ymOf(D), t = {};
    DATA.branches.forEach((b, i) => { t[b.id] = Math.round(Calc.month(i, D).target); });
    c.frozen[ym] = { t, by: App.user.name, at: nowIso() }; await Store.put('config', c);
    audit('Targets & Instalments', 'Monthly targets frozen', { new: ym + ' · ' + INR(Object.values(t).reduce((a, x) => a + x, 0)), reason: r }); toast('Targets frozen.');
  }),
  unfreeze: () => askReason('Unfreeze monthly targets', 'Targets will be recalculated from opening outstanding.', async r => { const c = Store.clone(Store.get('config')), ym = ymOf(D_()); const old = c.frozen[ym]; delete c.frozen[ym]; await Store.put('config', c); audit('Targets & Instalments', 'Monthly targets unfrozen', { old: ym + ' frozen by ' + (old && old.by), reason: r }); toast('Targets unfrozen.'); }),
  editInst: t => instForm(t.dataset.k),
  saveInst: t => {
    const k = t.dataset.k, c = Store.clone(Store.get('config'));
    const ay = App.f.ay, cur = isCurYear(); if (!cur) { c.yearSchedules = c.yearSchedules || {}; c.yearSchedules[ay] = c.yearSchedules[ay] || []; }
    const S = cur ? c.schedule : c.yearSchedules[ay]; const old = k === 'new' ? null : S[+k];
    const it = Object.assign({}, old || { key: 'C' + Date.now().toString(36).slice(-5).toUpperCase() });
    it.name = (v('iN') || '').trim(); it.kind = old && old.kind === 'py' ? 'py' : v('iK'); it.pct = +v('iP') || 0; it.amount = +v('iA') || 0; it.due = v('iD'); it.grace = +v('iG') || 0; it.active = v('iX');
    const ty = [...document.getElementById('iT').selectedOptions].map(o => o.value); it.types = ty.length === 3 || !ty.length ? 'all' : ty;
    const br = [...document.getElementById('iB').selectedOptions].map(o => o.value); it.branches = br.length ? br : 'all';
    const cl = (v('iC') || '').split(',').map(x => x.trim()).filter(Boolean); it.classes = cl.length ? cl : 'all';
    if (!it.name || !it.due) return toast('Enter a name and a due date.', 'bad');
    if (it.kind === 'pct' && !(it.pct > 0 && it.pct <= 100)) return toast('Enter a percentage between 0 and 100.', 'bad');
    if (it.kind === 'fixed' && !(it.amount > 0)) return toast('Enter a fixed amount.', 'bad');
    const summ = x => x ? `${x.name}: ${x.kind === 'pct' ? x.pct + '%' : x.kind === 'fixed' ? INR(x.amount) : 'PY'} due ${x.due}, grace ${x.grace}, ${x.active ? 'active' : 'inactive'}` : '';
    askReason(k === 'new' ? 'Add fee head' : 'Change instalment', 'All reports recalculate with the new schedule.', async r => {
      if (k === 'new') S.push(it); else S[+k] = it;
      await Store.put('config', c); audit('Targets & Instalments', k === 'new' ? 'Instalment added' : 'Instalment changed', { old: summ(old), new: 'AY ' + ay + ' · ' + summ(it), reason: r }); toast('Instalment schedule saved.');
    });
  },
  rmHol: t => { const c = Store.get('config'); const d = App.ui.calDraft || (App.ui.calDraft = { weekOff: c.weekOff.slice(), holidays: c.holidays.slice() }); d.holidays = d.holidays.filter(h => h !== t.dataset.k); rerender(); },
  addHol: () => { const h = v('newHol'); if (!h) return; const c = Store.get('config'); const d = App.ui.calDraft || (App.ui.calDraft = { weekOff: c.weekOff.slice(), holidays: c.holidays.slice() }); if (!d.holidays.includes(h)) d.holidays.push(h); rerender(); },
  saveCal: () => { const c = Store.clone(Store.get('config')); const d = App.ui.calDraft || { holidays: c.holidays }; const wo = [0, 1, 2, 3, 4, 5, 6].filter(i => v('wo' + i)); askReason('Save working-days calendar', 'Daily required collection is recalculated.', async r => { const old = `off ${c.weekOff.join(',')} · ${c.holidays.length} holidays`; c.weekOff = wo; c.holidays = d.holidays.slice().sort(); await Store.put('config', c); App.ui.calDraft = null; audit('Targets & Instalments', 'Working-days calendar changed', { old, new: `off ${wo.join(',')} · ${c.holidays.join(', ')}`, reason: r }); toast('Calendar saved.'); }); },
  saveThr: () => {
    const c = Store.clone(Store.get('config')), old = JSON.stringify({ zp: c.zpLimitDefault, os: c.osLimitPct, rag: c.rag, alerts: c.alerts });
    c.zpLimitDefault = +v('tZP'); c.osLimitPct = +v('tOS'); c.rag = { achGreen: +v('rA1'), achAmber: +v('rA2'), osGreen: +v('rO1'), osAmber: +v('rO2'), zpGreen: +v('rZ1'), zpAmber: +v('rZ2') };
    Object.assign(c.alerts, { zpIncreasePct: +v('aZI'), overdueIncreasePct: +v('aOI'), dueApproachDays: +v('aDA'), noCollectionBy: v('aNC') });
    ['belowDaily', 'missTarget', 'osLimit', 'zpLimit', 'syncFail', 'recon'].forEach(k => c.alerts[k] = v('al_' + k));
    c.concessionTreatment = v('tCT'); c.refundTreatment = v('tRT'); Object.assign(c.strength, { cancelRatePct: +v('cR1'), cancelVsNewPct: +v('cR2'), classCancels: +v('cR3'), capAlertPct: +v('cR4') });
    askReason('Save thresholds', 'Risk indicators and alerts update immediately.', async r => { await Store.put('config', c); audit('Targets & Instalments', 'Thresholds and alerts changed', { old, new: JSON.stringify({ zp: c.zpLimitDefault, os: c.osLimitPct, rag: c.rag, alerts: c.alerts }), reason: r }); toast('Thresholds saved.'); });
  },
  addZpLim: () => { const b = v('zlB'), x = +v('zlV'); if (!(x > 0)) return; askReason('Set zero payer limit', `${brName(b)}: ${INR(x)}`, async r => { const c = Store.clone(Store.get('config')); const old = c.zpLimit[b]; c.zpLimit[b] = x; await Store.put('config', c); audit('Targets & Instalments', 'Zero payer limit set', { old: old != null ? INR(old) : 'default', new: brName(b) + ': ' + INR(x), reason: r }); }); },
  rmZpLim: t => askReason('Remove branch limit', brName(t.dataset.k) + ' will use the default limit.', async r => { const c = Store.clone(Store.get('config')); const old = c.zpLimit[t.dataset.k]; delete c.zpLimit[t.dataset.k]; await Store.put('config', c); audit('Targets & Instalments', 'Zero payer limit removed', { old: brName(t.dataset.k) + ': ' + INR(old), new: 'default', reason: r }); }),

  /* approvals */
  newAdj: t => adjForm(t.dataset.k),
  submitAdj: async () => {
    const adm = (v('aAdm') || '').trim().toUpperCase(), s = DATA.students.find(x => x.adm.toUpperCase() === adm), amt = +v('aAmt'), dir = +v('aDir'), date = v('aDate'), r = (v('aReason') || '').trim();
    const f = document.getElementById('aFile').files[0]; const err = m => { const e = $('#aErr'); e.textContent = m; e.hidden = false; };
    if (!s) return err('No student with that admission number.'); if (!scopeOf(App.user).has(s.b)) return err('That student is outside your data scope.');
    if (!(amt > 0)) return err('Enter an amount.'); if (!r) return err('Enter a reason.'); if (!f) return err('Attach the supporting document.');
    const x = E.studentsAt(DATA, A, E.dn(date))[s.id]; const orig = x ? x.os : 0;
    await Store.add('approvals', { type: 'adjustment', payload: { studentId: s.id, studentName: s.name, adm: s.adm, amount: dir * amt, date, original: orig, revised: Math.max(0, orig + dir * amt) }, reason: r, attachment: `${f.name} (${Math.ceil(f.size / 1024)} KB)`, requester: App.user.name, requesterId: App.user.id, status: 'Pending' });
    audit('Approvals & Adjustments', 'Financial adjustment requested', { old: INR(orig), new: INR(Math.max(0, orig + dir * amt)) + ' · ' + s.adm, reason: r, approval: 'Pending' });
    closeModal(); toast('Adjustment sent for approval.'); if (App.route !== 'approvals') go('approvals');
  },
  approve: async t => {
    const a = Store.list('approvals').find(x => x.id === t.dataset.k); if (!a || a.requesterId === App.user.id) return toast('A different user must approve this request.', 'bad');
    if (a.type === 'targetPct') { const c = Store.clone(Store.get('config')); c.targetPct = a.payload.to; await Store.put('config', c); }
    if (a.type === 'branchPct') { const c = Store.clone(Store.get('config')); c.branchPct[a.payload.branch] = a.payload.to; await Store.put('config', c); }
    if (a.type === 'exit') { const X = Store.clone(Store.get('exits') || { list: [] }); X.list.push({ id: a.id, studentId: a.payload.studentId, exitType: a.payload.exitType, date: a.payload.date, reason: a.payload.reason, refund: a.payload.refund, requester: a.requester, approver: App.user.name, at: nowIso() }); await Store.put('exits', X); }
    if (a.type === 'adjustment') { const adj = Store.clone(Store.get('adjustments')); adj.list.push({ id: a.id, studentId: a.payload.studentId, amount: a.payload.amount, date: a.payload.date, reason: a.reason, requester: a.requester, approver: App.user.name }); await Store.put('adjustments', adj); }
    await Store.patch('approvals', a.id, { status: 'Approved', approver: App.user.name, decidedAt: nowIso() });
    audit('Approvals & Adjustments', ({ adjustment: 'Financial adjustment', targetPct: 'Target % change', branchPct: 'Branch target %', exit: 'Cancellation / withdrawal' }[a.type]) + ' approved', { old: a.payload.original != null ? INR(a.payload.original) : a.payload.from + '%', new: a.payload.revised != null ? INR(a.payload.revised) : a.payload.to + '%', reason: a.reason, approval: 'Approved', approver: App.user.name });
    toast('Approved and applied.');
  },
  reject: t => askReason('Reject request', 'The requester will see your comment.', async r => { const a = Store.list('approvals').find(x => x.id === t.dataset.k); await Store.patch('approvals', a.id, { status: 'Rejected', approver: App.user.name, decidedAt: nowIso(), comment: r }); audit('Approvals & Adjustments', 'Request rejected', { new: a.type, reason: r, approval: 'Rejected', approver: App.user.name }); }),
  resolveEx: t => askReason('Resolve exception', 'Record what was done to resolve it.', async r => { const m = Store.clone(Store.get('resolved')); m[t.dataset.k] = { by: App.user.name, at: nowIso(), reason: r }; await Store.put('resolved', m); audit('Exceptions & Reconciliation', 'Exception resolved', { new: t.dataset.k, reason: r }); }),

  /* email */
  editTpl: t => { const k = t.dataset.k, x = Store.get('templates')[k]; modal(`${k} email template`, `<p class="small muted">Placeholders: {name} {date} {portfolio}. The figures list and tables are added automatically.</p><label class="fld"><span>Subject</span><input id="tS" value="${esc(x.subject)}"></label><label class="fld"><span>Greeting</span><input id="tG" value="${esc(x.greeting)}"></label><label class="fld"><span>Opening line</span><textarea id="tI" rows="2">${esc(x.intro)}</textarea></label><label class="fld"><span>Closing line</span><textarea id="tC" rows="2">${esc(x.closing)}</textarea></label><label class="fld"><span>Signature</span><textarea id="tSig" rows="2">${esc(x.signature)}</textarea></label>`, `<button class="btn" data-act="closeModal">Cancel</button><button class="btn primary" data-act="saveTpl" data-k="${k}">Save</button>`, true); },
  saveTpl: t => { const k = t.dataset.k, T = Store.clone(Store.get('templates')), old = JSON.stringify(T[k]); T[k] = { subject: v('tS'), greeting: v('tG'), intro: v('tI'), closing: v('tC'), signature: v('tSig') }; askReason('Save email template', `${k} template`, async r => { await Store.put('templates', T); audit('Email Reports', 'Email template changed', { old, new: JSON.stringify(T[k]), reason: r }); toast('Template saved.'); }); },
  sendMail: async t => { const u = userById(t.dataset.k), m = emailFor(u, D_(), t.dataset.v); if (!m) return; await Store.add('emaillog', { to: `${u.name} <${u.email}>`, subject: m.subject, trigger: 'Manual send', status: 'Simulated (not delivered)', reason: 'Microsoft 365 is not connected in this demo' }); audit('Email Reports', 'Report email sent', { new: m.subject + ' → ' + u.email }); toast('Recorded in sent history (simulated).'); },
  sendAll: async () => {
    const D = D_(), lists = Store.get('emaildist').lists.filter(l => l.active && l.freq === 'Daily');
    const RT = { Principal: ['Principal'], 'Regional Director': ['Regional Director'], 'Zonal Director': ['Zonal Director'], 'Corporate Finance': ['Corporate Finance', 'CFO'], Management: ['Chairman', 'Vice Chairman / VCP', 'CEO', 'CFO', 'Corporate Finance'], Accounts: ['Accounts Executive', 'Finance Executive', 'Branch Accountant', 'Finance Manager'], HR: ['HR Officer'], Admissions: ['Admissions Head'] };
    const pick = rt => users().filter(u => u.status === 'Active' && (RT[rt] || []).includes(u.role));
    const kindOf = l => /^SRF/.test(l.type) ? 'SRF' : /Strength/.test(l.type) ? 'Target' : 'Collection';
    let n = 0; const jobs = [];
    lists.forEach(l => pick(l.rtype).forEach(u => { const m = emailFor(u, D, kindOf(l)); if (m) jobs.push({ to: `${u.name} <${u.email}>`, subject: m.subject, trigger: l.name, status: 'Simulated (not delivered)', reason: 'Microsoft 365 is not connected in this demo' }); }));
    const al = alertsFor(D, DATA.branches.map((b, i) => i));
    lists.filter(l => l.escalation).forEach(l => { const hit = al.filter(a => a.rule.startsWith(l.escalation.split(' ')[0])).length; if (hit) jobs.push({ to: l.escTo, subject: `Escalation: ${l.escalation} – ${hit} branch alerts – ${dLabel(D)}`, trigger: 'Escalation · ' + l.name, status: 'Simulated (not delivered)', reason: 'Microsoft 365 is not connected in this demo' }); });
    toast(`Recording ${jobs.length} emails…`);
    for (let i = 0; i < jobs.length; i += 10) { await Promise.all(jobs.slice(i, i + 10).map(j => Store.add('emaillog', j))); n += Math.min(10, jobs.length - i); }
    audit('Email Reports', 'Daily distribution run', { new: `${n} emails for ${dLabel(D)}` }); toast(`${n} emails recorded in sent history (simulated).`);
  },
  resend: async t => { const x = Store.list('emaillog').find(e => e.id === t.dataset.k); if (!x) return; await Store.add('emaillog', { to: x.to, subject: x.subject, trigger: 'Manual resend', status: 'Simulated (not delivered)', reason: 'Microsoft 365 is not connected in this demo' }); audit('Email Reports', 'Email resent', { new: x.subject + ' → ' + x.to }); toast('Resend recorded.'); },
  mailAttach: t => { const u = userById(t.dataset.k), m = emailFor(u, D_(), t.dataset.v); if (!m) return; table('mailAtt', m.cols, m.rows, { total: m.T, title: `${m.kind} report – ${u.name.replace(' (demo)', '')}` }); doExport('mailAtt', t.dataset.fmt, 'email'); },

  /* users */
  editUser: t => userForm(t.dataset.k),
  saveUser: t => {
    const id = t.dataset.k, U = Store.clone(users()); const err = m => { const e = $('#uErr'); e.textContent = m; e.hidden = false; };
    const o = { empId: v('fEmp').trim(), name: v('fName').trim(), email: v('fEmail').trim(), mobile: v('fMob'), dept: v('fDept'), desig: v('fDesig'), region: v('fReg'), zone: v('fZone'), branch: v('fBr'), status: v('fSt'), role: v('fRole'), manager: v('fMgr'), doj: v('fDoj'), sessionTimeout: +v('fTo'), mfa: v('fMfa'), singleSession: v('fOne'), forceChange: v('fFc'),
      roles2: $('#fR2') ? [...$('#fR2').selectedOptions].map(x => x.value).filter(r => r !== v('fRole')) : [], acting: v('fAct') ? { user: v('fAct'), from: v('fActF') || ACCESS_DATE, to: v('fActT') || '' } : null, restrict: { ips: (v('fIp') || '').trim(), hours: (v('fHrs') || '').trim(), devices: (v('fDev') || '').trim(), locations: (v('fLoc') || '').trim(), branchNet: !!v('fBn') } };
    if (o.role === 'Super Admin' && App.user.role !== 'Super Admin') return err('Only a Super Admin can assign the Super Admin role.');
    if (!o.empId || !o.name || !/^\S+@\S+\.\S+$/.test(o.email)) return err('Employee ID, name and a valid email are required.');
    if (U.some(u => u.id !== id && (u.empId === o.empId || u.email.toLowerCase() === o.email.toLowerCase()))) return err('Another user has this employee ID or email.');
    if (o.role === 'Principal' && !o.branch) return err('Select the Principal\'s branch.');
    askReason(id === 'new' ? 'Add user' : 'Update user', o.name, async r => {
      let old = null;
      if (id === 'new') { const nid = 'U' + String(U.length + 1 + Math.floor(Math.random() * 900)).padStart(3, '0'); U.push(Object.assign({ id: nid, lastLogin: '' }, o)); if (o.role === 'Principal') { const M = Store.clone(Store.get('mappings')); M.push({ id: 'M' + Date.now().toString(36), user: nid, type: 'Own Branch Only', branches: [o.branch], from: ACCESS_DATE, to: '', status: 'Active', level: 'Read Only' }); await Store.put('mappings', M); } }
      else { const i = U.findIndex(u => u.id === id); old = U[i]; U[i] = Object.assign({}, U[i], o); }
      await Store.put('users', U);
      const diff = old ? Object.keys(o).filter(k => String(old[k]) !== String(o[k])).map(k => `${k}: ${old[k]} → ${o[k]}`).join('; ') : '';
      audit('User Management', id === 'new' ? 'User created' : (old && old.role !== o.role ? 'Role changed' : 'User updated'), { old: old ? old.empId + ' ' + diff.split(' → ')[0] : '', new: o.empId + ' · ' + (diff || o.role), reason: r }); toast('User saved.');
    });
  },
  userQuick: t => { const id = t.dataset.k, a = t.dataset.v, u = userById(id); const lab = { lock: 'Lock user', unlock: 'Unlock user', activate: 'Activate user', deactivate: 'Deactivate user', reset: 'Reset password', duplicate: 'Duplicate user', delete: 'Delete user' }[a];
    if (a === 'duplicate') return askReason('Duplicate user', `A new account is created with ${u.name}'s role, department and scope mapping; set the person's name, ID and email next.`, async r => { const U = Store.clone(users()), nid = 'U' + String(U.length + 1 + Math.floor(Math.random() * 900)).padStart(3, '0'); const c = Object.assign({}, u, { id: nid, name: u.name.replace(' (demo)', '') + ' (copy)', empId: u.empId + '-C', email: 'new.' + u.email, status: 'Pending Activation', lastLogin: '', forceChange: true }); U.push(c); await Store.put('users', U); const M = Store.clone(Store.get('mappings')); M.filter(x => x.user === u.id && activeOn(x, ACCESS_DATE)).forEach(x => M.push(Object.assign({}, x, { id: 'M' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), user: nid, from: ACCESS_DATE }))); await Store.put('mappings', M); audit('User Management', 'User duplicated', { old: u.empId, new: c.empId + ' · ' + c.name, reason: r }); closeModal(); toast('Copy created – open it to set the name, employee ID and email.'); userForm(nid); });
    if (a === 'delete') { if (App.user.role !== 'Super Admin') return toast('Only a Super Admin can delete user accounts.', 'bad'); return askReason('Delete user', `${u.name} (${u.empId}) is removed from every list and mapping. The audit trail keeps the record of the deletion and all earlier activity.`, async r => { const U = Store.clone(Store.get('users')), x = U.find(z => z.id === id); x.status = 'Deleted'; x.deletedBy = App.user.name; x.deletedAt = nowIso(); await Store.put('users', U); const M = Store.clone(Store.get('mappings')); const y = E.ds(E.dn(ACCESS_DATE) - 1); M.filter(z => z.user === id && activeOn(z, ACCESS_DATE)).forEach(z => z.to = y); await Store.put('mappings', M); audit('User Management', 'User deleted', { old: `${x.empId} · ${x.name} · ${x.role}`, new: 'Deleted', reason: r, approval: 'Super Admin override', approver: App.user.name }); closeModal(); toast('User deleted.'); }); }
    askReason(lab, `${u.name} (${u.empId})${a === 'reset' ? ' will get a reset link and must change the password at next sign-in.' : ''}`, async r => { const U = Store.clone(users()), x = U.find(z => z.id === id), old = x.status; if (a === 'lock') x.status = 'Locked'; if (a === 'unlock' || a === 'activate') x.status = 'Active'; if (a === 'deactivate') x.status = 'Inactive'; if (a === 'reset') x.forceChange = true; await Store.put('users', U); audit('User Management', lab, { old: x.empId + ' ' + old, new: x.empId + ' ' + (a === 'reset' ? 'reset link issued' : x.status), reason: r }); closeModal(); toast(lab + ' done.'); }); },
  hrmsSync: () => askReason('Apply HRMS status', 'Ends data access for users marked Resigned or Inactive by HRMS.', async r => { const M = Store.clone(Store.get('mappings')); const y = E.ds(E.dn(ACCESS_DATE) - 1); let n = 0; users().filter(u => ['Resigned', 'Inactive'].includes(u.status)).forEach(u => M.filter(m => m.user === u.id && activeOn(m, ACCESS_DATE)).forEach(m => { m.to = y; n++; })); await Store.put('mappings', M); audit('User Management', 'HRMS status applied', { new: `${n} mappings ended`, reason: r }); toast(`${n} access mappings ended.`); }),

  /* roles */
  perm: t => { const R = Store.get('roles'), role = App.ui.role && R[App.ui.role] ? App.ui.role : 'Principal'; if (!App.ui.permDraft || App.ui.permDraft.role !== role) App.ui.permDraft = { role, perms: Store.clone(R[role].perms) }; const p = App.ui.permDraft.perms, m = t.dataset.m, a = t.dataset.a; p[m] = p[m] || []; if (t.checked) { if (!p[m].includes(a)) p[m].push(a); } else p[m] = p[m].filter(x => x !== a); rerender(); },
  savePerms: () => { const d = App.ui.permDraft; if (!d) return; const R = Store.clone(Store.get('roles')); const before = R[d.role].perms; const ch = []; MODULES.forEach(([m]) => ACTIONS.forEach(a => { const x = (before[m] || []).includes(a), y = (d.perms[m] || []).includes(a); if (x !== y) ch.push(`${y ? '+' : '−'}${m}:${a}`); })); askReason('Save permissions', `${d.role}: ${ch.length} change(s).`, async r => { R[d.role].perms = d.perms; await Store.put('roles', R); App.ui.permDraft = null; audit('Roles & Permissions', 'Role permissions changed', { old: d.role, new: ch.join(', '), reason: r }); toast('Permissions saved.'); }); },
  newRole: () => { modal('Create role', `<label class="fld"><span>Role name</span><input id="rN"></label><label class="fld"><span>Copy permissions from</span><select id="rF"><option value="">None</option>${Object.keys(Store.get('roles')).map(r => `<option>${esc(r)}</option>`).join('')}</select></label>`, `<button class="btn" data-act="closeModal">Cancel</button><button class="btn primary" data-act="newRoleOk">Create</button>`); },
  cloneRole: t => { modal('Clone role', `<label class="fld"><span>New role name</span><input id="rN" value="${esc(t.dataset.k)} (copy)"></label><input type="hidden" id="rF" value="${esc(t.dataset.k)}">`, `<button class="btn" data-act="closeModal">Cancel</button><button class="btn primary" data-act="newRoleOk">Create</button>`); },
  newRoleOk: () => { const n = (v('rN') || '').trim(), from = v('rF'); const R = Store.clone(Store.get('roles')); if (!n || R[n]) return toast('Enter a new, unique role name.', 'bad'); R[n] = { active: true, perms: from ? Store.clone(R[from].perms) : {} }; askReason('Create role', n, async r => { await Store.put('roles', R); App.ui.role = n; audit('Roles & Permissions', 'Role created', { new: n + (from ? ' (from ' + from + ')' : ''), reason: r }); }); },
  toggleRole: t => { const k = t.dataset.k; askReason((Store.get('roles')[k].active === false ? 'Activate' : 'Deactivate') + ' role', `${users().filter(u => u.role === k).length} users have this role. Deactivated roles lose all access.`, async r => { const R = Store.clone(Store.get('roles')); R[k].active = R[k].active === false; await Store.put('roles', R); audit('Roles & Permissions', R[k].active ? 'Role activated' : 'Role deactivated', { new: k, reason: r }); }); },

  /* mapping */
  editMap: t => mapForm(t.dataset.k),
  saveMap: t => {
    const i = t.dataset.k, M = Store.clone(Store.get('mappings')); const err = m => { const e = $('#mErr'); e.textContent = m; e.hidden = false; };
    const o = { user: v('mU'), type: v('mT'), region: v('mR'), zone: v('mZ'), state: v('mSt') || '', entity: v('mEn') || '', branches: [...document.getElementById('mB').selectedOptions].map(x => x.value), level: v('mL'), status: v('mS'), from: v('mF'), to: v('mTo') };
    if (o.type === 'All Branches Under Region' && !o.region) return err('Select the region.'); if (o.type === 'All Branches Under Zone' && !o.zone) return err('Select the zone.'); if (o.type === 'All Branches Under State' && !o.state) return err('Select the state.'); if (o.type === 'All Branches Under Entity' && !o.entity) return err('Select the entity.');
    if (o.type === 'Selected Branches' && !o.branches.length) return err('Select at least one branch.'); if (o.to && o.to < o.from) return err('Effective to must be after effective from.');
    const u = userById(o.user); if (u.role === 'Principal' && o.type !== 'Own Branch Only') return err('A Principal can only be mapped to their own branch.');
    askReason('Save data scope', `${u.name}: ${o.type}`, async r => { const old = i === 'new' ? null : M[+i]; if (i === 'new') M.push(Object.assign({ id: 'M' + Date.now().toString(36) }, o)); else M[+i] = Object.assign({}, M[+i], o); await Store.put('mappings', M); audit('Data Scope Mapping', i === 'new' ? 'Access mapping added' : 'Access mapping changed', { old: old ? `${old.type} ${old.region || ''}${old.zone || ''} ${(old.branches || []).join(',')} ${old.from}→${old.to || 'open'}` : '', new: `${u.empId} ${o.type} ${o.region || ''}${o.zone || ''} ${o.branches.join(',')} ${o.from}→${o.to || 'open'}`, reason: r }); toast('Mapping saved.'); });
  },

  /* email distribution */
  editDist: t => distForm(t.dataset.k),
  saveDist: t => { const id = t.dataset.k, ED = Store.clone(Store.get('emaildist')); const o = { name: v('dN'), type: v('dT'), freq: v('dF'), time: v('dTi'), dateLogic: v('dL'), rtype: v('dR'), scope: v('dS'), cc: v('dCc'), bcc: v('dBcc'), escalation: v('dE'), escTo: v('dEt'), template: v('dTp'), excel: v('dX'), pdf: v('dP'), link: v('dK'), active: v('dA') }; if (!o.name) return toast('Enter a report name.', 'bad'); askReason('Save report distribution', o.name, async r => { let old = null; if (id === 'new') ED.lists.push(Object.assign({ id: 'E' + Date.now().toString(36) }, o)); else { const i = ED.lists.findIndex(l => l.id === id); old = ED.lists[i]; ED.lists[i] = Object.assign({}, old, o); } await Store.put('emaildist', ED); audit('Email Distribution', id === 'new' ? 'Email schedule added' : 'Email schedule changed', { old: old ? JSON.stringify(old) : '', new: JSON.stringify(o), reason: r }); toast('Saved.'); }); },
  saveM365: () => { const ED = Store.clone(Store.get('emaildist')); const old = JSON.stringify(ED.m365); ED.m365 = Object.assign(ED.m365, { tenantId: v('m1'), clientId: v('m2'), sender: v('m3') }); askReason('Save Microsoft 365 settings', 'The client secret is not stored here.', async r => { await Store.put('emaildist', ED); audit('Email Distribution', 'Microsoft 365 settings changed', { old, new: JSON.stringify(ED.m365), reason: r }); }); },
  testM365: () => { audit('Email Distribution', 'Microsoft 365 connection test', { new: 'Failed: no server connector' }); toast('Test failed: this page cannot reach Microsoft Graph. The production server sends the emails.', 'bad'); },

  /* sync */
  syncNow: () => runSync('All'), retrySync: () => runSync('Concessions (retry)'),
  errLog: async () => { const rows = [['Entity', 'Record', 'Error', 'Detected']]; for (let i = 0; i < 14; i++) rows.push(['Concessions', 'CON-' + (70100 + i * 7), 'ERP API timeout after 120 s (HTTP 504)', '2026-10-19 06:00 IST']); DATA.dups.forEach(r => rows.push(['Receipts', r.no, 'Duplicate receipt number', E.ds(r.d)])); DATA.orphans.forEach(r => rows.push(['Receipts', r.no, r.reason, E.ds(r.d)])); if (await saveFile('erp_sync_error_log.csv', rows.map(r => r.map(x => /[",]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x).join(',')).join('\n'))) audit('ERP Sync & Reconciliation', 'Error log downloaded'); },
  saveErp: () => { const S = Store.clone(Store.get('sync')); const old = JSON.stringify({ url: S.erp.baseUrl, sch: S.schedule }); S.erp.baseUrl = v('erpUrl'); S.schedule = v('erpSch').split(',').map(x => x.trim()).filter(Boolean); askReason('Save sync settings', 'ERP endpoint and schedule.', async r => { await Store.put('sync', S); audit('ERP Sync & Reconciliation', 'Sync schedule changed', { old, new: JSON.stringify({ url: S.erp.baseUrl, sch: S.schedule }), reason: r }); }); },
  /* strength, targets, capacity, admissions */
  drill: t => { const [lv, key, label] = t.dataset.k.split('~'); App.ui.drill = (App.ui.drill || []).concat([{ level: lv, key, label }]); rerender(); window.scrollTo(0, 0); },
  drillPop: t => { App.ui.drill = (App.ui.drill || []).slice(0, +t.dataset.k); rerender(); },
  drillBranch: t => { const b = DATA.branches.find(x => x.id === t.dataset.k); if (!b) return; App.ui.drill = [{ level: 'branch', key: b.id, label: b.name }]; go('strength'); },
  execPdf: () => execPdf(),
  tgtEdit: t => targetForm(t.dataset.k),
  tgtSave: t => {
    const bid = t.dataset.k, st = t.dataset.v, err = m => { const e = $('#gErr'); e.textContent = m; e.hidden = false; };
    const tg = +v('gT'), g = +v('gG'), c = +v('gC'), rem = (v('gRem') || '').trim(), cap = Str.branchCap(bid, D_());
    if (!(tg > 0)) return err('Enter the target strength.'); if (!rem) return err('Enter the reason or remarks.');
    if (cap && tg > cap && st === 'Submitted' && !v('gOv')) return err(`Target is above approved capacity (${NUM(cap)}). Tick the override to submit; remarks are mandatory.`);
    const classTargets = {}; (v('gCls') || '').split('\n').map(l => l.split(':')).forEach(([k, n]) => { if (k && n && +n >= 0) classTargets[k.trim()] = +n; });
    const net = Math.round(g * (1 - c / 100));
    const TG = Store.clone(Store.get('targets')); const PL = isCurYear() ? TG.plans : ((TG.byYear = TG.byYear || {})[App.f.ay] = (TG.byYear[App.f.ay] || {})); const p = PL[bid] || (PL[bid] = { approved: null, pending: null, status: 'Draft', classTargets: {} });
    const old = p.approved ? p.approved.target : null;
    p.pending = { target: tg, avgGross: g, concPct: c, avgNet: net, revTarget: +v('gR') || tg * net, completion: v('gD'), remarks: rem, by: App.user.name, byId: App.user.id, role: App.user.role, at: nowIso(), override: cap && tg > cap ? rem : '', classTargets };
    p.status = st;
    TG.history.push({ ay: App.f.ay, bid, old, new: tg, reason: rem, user: App.user.name, role: App.user.role, at: nowIso(), status: st + (cap && tg > cap ? ' (override above capacity)' : ''), approver: '' });
    Store.put('targets', TG); audit('Target Planning', st === 'Draft' ? 'Target draft saved' : 'Target submitted for approval', { old: old != null ? brName(bid) + ': ' + old : '', new: brName(bid) + ': ' + tg + (cap && tg > cap ? ' (override above capacity ' + cap + ')' : ''), reason: rem, approval: st });
    closeModal(); toast(st === 'Draft' ? 'Draft saved.' : 'Submitted for approval.');
  },
  tgtApprove: t => tgtDecide(t.dataset.k, 'Approved'), tgtReject: t => tgtDecide(t.dataset.k, 'Rejected'),
  capNew: () => capForm(),
  capEdit: t => { if (t.dataset.k) { const e = Store.get('capacity').entries.find(x => x.id === t.dataset.k); if (e) capForm({ entry: e, revise: t.dataset.v === 'revise' }); } else capForm({ bid: t.dataset.b, cls: t.dataset.c || '', sec: t.dataset.s || '' }); },
  clsTgt: t => classTargetForm(t.dataset.b, t.dataset.c),
  secAdd: t => secForm({ bid: t.dataset.b, cls: t.dataset.c, n: t.dataset.n }),
  branchNew: () => branchNewForm(), branchNewOk: () => branchNewOk(),
  branchStatus: t => branchStatusForm(t.dataset.k, t.dataset.v), branchStatusOk: t => branchStatusOk(t.dataset.k, t.dataset.v),
  secTog: t => { const { b: bid, c: cls, s: sec, v: on } = t.dataset, act = on === 'on';
    if (!(can('capacity', 'Edit') || can('capacity', 'Approve'))) return toast('Only System Admin or Corporate Finance can activate or deactivate sections.', 'bad');
    const isCls = sec === '*', what = isCls ? 'class' : 'section';
    askReason(`${act ? 'Activate' : 'Deactivate'} ${what} · ${brName(bid)} · ${cls}${isCls ? '' : ' ' + sec}`, act ? `The ${what} counts towards capacity and targets again from today.` : `The ${what} stays in the master with its students, but is left out of capacity, target split and alerts until it is activated again.`, r => {
      const C = Store.clone(Store.get('capacity')); C.inactive = (C.inactive || []).filter(x => !(x.bid === bid && x.cls === cls && x.sec === sec && (x.ay || CUR_AY) === App.f.ay));
      if (!act) C.inactive.push({ bid, cls, sec, ay: App.f.ay, from: ACCESS_DATE, by: App.user.name, at: nowIso(), reason: r });
      C.statusLog = (C.statusLog || []).concat([{ bid, cls, sec, ay: App.f.ay, status: act ? 'Active' : 'Inactive', by: App.user.name, role: App.user.role, at: nowIso(), reason: r }]);
      Store.put('capacity', C); MEMO.clear(); audit('Capacity Setup', (isCls ? 'Class ' : 'Section ') + (act ? 'activated' : 'deactivated'), { old: act ? 'Inactive' : 'Active', new: `${brName(bid)} ${cls}${isCls ? '' : ' ' + sec}: ${act ? 'Active' : 'Inactive'}`, reason: r, approval: '—' }); toast(`${isCls ? 'Class' : 'Section'} ${act ? 'activated' : 'deactivated'}.`); }); },
  capWithdraw: t => { const id = t.dataset.k; askReason('Withdraw request', 'The request is removed from the approval queue; the withdrawal is kept in the audit trail.', r => { const C = Store.clone(Store.get('capacity')), e = C.entries.find(x => x.id === id); if (!e || !['Draft', 'Submitted'].includes(e.status)) return toast('Only draft or submitted requests can be withdrawn.', 'bad'); e.status = 'Withdrawn'; e.log = (e.log || []).concat([{ st: 'Withdrawn', by: App.user.name, at: nowIso(), note: r }]); e.remarks = (e.remarks ? e.remarks + ' · ' : '') + 'Withdrawn: ' + r; Store.put('capacity', C); applySections(); audit('Capacity Setup', 'Capacity request withdrawn', { old: `${brName(e.bid)} ${e.cls || ''} ${e.sec || ''}: ${e.capacity}`, new: '', reason: r, approval: 'Withdrawn' }); toast('Request withdrawn.'); }); },
  secDel: t => { App.ui.secDel = { cls: t.dataset.c, sec: t.dataset.s || '' }; secForm({ bid: t.dataset.b, cls: t.dataset.c, sec: t.dataset.s || '', del: true }); },
  secSave: t => {
    const st = t.dataset.v, del = t.dataset.d === '1', cm = t.dataset.cm === '1', err = mm => { const e = $('#sErr'); e.textContent = mm; e.hidden = false; };
    const bid = v('sB'), bi = DATA.branches.findIndex(b => b.id === bid), D = D_(), reason = (v('sR') || '').trim(), rem = (v('sRm') || '').trim(), from = v('sF');
    let cls, sec, n = 0, prev = 0;
    if (del) { const d = App.ui.secDel || {}; cls = d.cls || ''; sec = d.sec || ''; }
    else { cls = (v('sC') || '').trim(); sec = (v('sS') || '').trim().toUpperCase(); n = +v('sN'); }
    const delCls = del && !sec;
    if (!cls) return err('Enter the class.'); if (!sec && !delCls) return err('Enter the section name.'); if (!reason) return err('Enter the reason.'); if (!from) return err('Enter the effective date.');
    if (!del && !(n > 0)) return err('Enter the section capacity.');
    const SK = Str.secKeys(bid, D), k = cls + '|' + sec, clsKeys = [...SK.keys()].filter(x => x.startsWith(cls + '|'));
    if (cm && !del && clsKeys.length) return err(`Class ${cls} already exists${clsKeys.every(x => SK.get(x).src === 'Proposed') ? ' (proposed, awaiting approval)' : ''}. Add a section to it instead.`);
    if (!del && SK.has(k)) return err(`${cls} ${sec} already exists${SK.get(k).src === 'Proposed' ? ' (proposed, awaiting approval)' : SK.get(k).inactive ? ' but is inactive: activate it instead' : ''}.`);
    let moveTo = '';
    if (delCls) { if (!clsKeys.length) return err('This class is not in the current master.'); const onRoll = Str.allActive(bi, D).filter(s => s.cls === cls).length; moveTo = (v('sMv') || '').trim(); if (onRoll && !moveTo) return err(`${onRoll} students are on roll: choose the class they move to.`); if (moveTo && (moveTo === cls || ![...SK.keys()].some(x => x.startsWith(moveTo + '|')))) return err('Choose a valid class to move the students to.'); prev = Str.classCap(bid, cls, D); }
    else if (del) { if (!SK.has(k)) return err('This section is not in the current master.'); const onRoll = Str.allActive(bi, D).filter(s => s.cls === cls && s.sec === sec).length; moveTo = (v('sMv') || '').trim(); if (onRoll && !moveTo) return err(`${onRoll} students are on roll: choose the section they move to.`); if (moveTo && !SK.has(cls + '|' + moveTo)) return err('Choose a valid section to move the students to.'); prev = Str.secCap(bid, cls, sec, D); }
    if (st === 'Approved' && !rem) return err('Approval remarks are mandatory.');
    const C = Store.clone(Store.get('capacity'));
    const e = { id: 'CAP' + Date.now().toString(36), ay: App.f.ay, bid, cls, sec, capacity: del ? 0 : n, prev, reason, remarks: rem, doc: '', from, to: '', status: st, by: App.user.name, byId: App.user.id, at: nowIso(), override: '', log: [{ st, by: App.user.name, at: nowIso(), note: reason }] };
    if (del) { e.closeSection = true; e.moveTo = moveTo; if (delCls) e.closeClass = true; } else { e.newSection = true; if (cm) e.newClass = true; }
    if (st === 'Approved') { e.apBy = App.user.name; e.approvedAt = nowIso(); }
    C.entries.push(e); Store.put('capacity', C); applySections();
    audit('Capacity Setup', (delCls ? 'Class closure ' : del ? 'Section closure ' : cm ? 'New class ' : 'New section ') + (st === 'Approved' ? 'approved' : st === 'Draft' ? 'draft saved' : 'submitted'), { old: del ? `${brName(bid)} ${cls} ${sec}: ${prev || 'not set'}` : '', new: `${brName(bid)} ${cls} ${sec}${del ? ' closed' + (moveTo ? ', students moved to ' + moveTo : '') : ': ' + n + ' seats'} from ${from}`, reason: reason + (rem ? ' · ' + rem : ''), approval: st, approver: e.apBy || '' });
    closeModal(); toast(st === 'Approved' ? (delCls ? 'Class closed.' : del ? 'Section closed.' : cm ? 'Class added and in force.' : 'Section added and in force.') : st === 'Draft' ? 'Draft saved.' : 'Submitted for approval.');
  },
  clsTgtSave: t => {
    const bid = t.dataset.b, cls = t.dataset.c, clear = t.dataset.v === 'clear', err = mm => { const e = $('#ctErr'); e.textContent = mm; e.hidden = false; };
    const n = +v('ctT'), rem = (v('ctRem') || '').trim(); if (!clear && !(n >= 0 && v('ctT') !== '')) return err('Enter the class target strength.'); if (!rem) return err('Enter the reason or remarks.');
    const TG = Store.clone(Store.get('targets')), PL = isCurYear() ? TG.plans : ((TG.byYear = TG.byYear || {})[App.f.ay] = (TG.byYear[App.f.ay] || {})), p = PL[bid]; if (!p || !p.approved) return err('No approved branch target.');
    p.classTargets = p.classTargets || {}; const old = p.classTargets[cls];
    if (clear) delete p.classTargets[cls]; else p.classTargets[cls] = n;
    const sum = Object.values(p.classTargets).reduce((a, x) => a + (+x || 0), 0); if (!clear && sum > p.approved.target && !v('ctOv')) { const w = $('#ctOvW'); if (w) w.hidden = false; return err(`Class targets now add up to ${NUM(sum)}, above the branch target ${NUM(p.approved.target)}. Reduce the target or tick the override.`); }
    TG.history.push({ ay: App.f.ay, bid, old: old != null ? old : null, new: clear ? null : n, reason: `${cls} class target: ${rem}`, user: App.user.name, role: App.user.role, at: nowIso(), status: 'Class target ' + (clear ? 'removed' : 'set'), approver: '' });
    Store.put('targets', TG); audit('Target Planning', 'Class target ' + (clear ? 'removed' : 'changed'), { old: old != null ? `${brName(bid)} ${cls}: ${old}` : '', new: clear ? '' : `${brName(bid)} ${cls}: ${n}`, reason: rem, approval: '—' });
    closeModal(); toast(clear ? 'Manual class target removed; the class target is derived again.' : 'Class target saved.');
  },
  capSave: t => {
    const st = t.dataset.v, err = m => { const e = $('#cErr'); e.textContent = m; e.hidden = false; };
    const bid = v('cB'), cls = v('cC'), sec = v('cS'), n = +v('cN'), reason = (v('cR') || '').trim(), rem = (v('cRm') || '').trim();
    if (!(n > 0)) return err('Enter the new capacity.'); if (!reason) return err('Enter the reason for the capacity change.');
    const bi = DATA.branches.findIndex(b => b.id === bid), D = D_(), tg = !cls ? (Str.branchTarget(bid) || {}).target : Str.classPlan(bi, cls, sec, D).target;
    const over = tg != null && tg > n; if (over && st !== 'Draft' && (!v('cOv') || !rem)) return err('Capacity is below the target strength. Tick the override and enter remarks to continue.');
    if (st === 'Approved' && !rem) return err('Approval remarks are mandatory.');
    const f = document.getElementById('cDoc').files[0];
    const prev = !cls ? Str.branchCap(bid, D) : !sec ? Str.classCap(bid, cls, D) : Str.secCap(bid, cls, sec, D);
    const C = Store.clone(Store.get('capacity')), ex = t.dataset.k ? C.entries.find(x => x.id === t.dataset.k) : null;
    if (ex && !['Draft', 'Submitted'].includes(ex.status)) return err('This request is already ' + ex.status.toLowerCase() + ' and cannot be edited. Raise a new request instead.');
    const e = ex || { id: 'CAP' + Date.now().toString(36), ay: App.f.ay, bid, cls, sec, by: App.user.name, byId: App.user.id, at: nowIso(), log: [] };
    const was = ex ? `${ex.capacity} (${ex.status})` : '';
    Object.assign(e, { capacity: n, prev, reason, remarks: rem, doc: f ? `${f.name} (${Math.ceil(f.size / 1024)} KB)` : (e.doc || ''), from: v('cF'), to: v('cT'), status: st, override: over ? rem : '', revisedFrom: t.dataset.r || e.revisedFrom || '' });
    e.log = (e.log || []).concat([{ st, by: App.user.name, at: nowIso(), note: ex ? 'Edited: ' + reason : reason }]);
    if (st === 'Approved') { e.apBy = App.user.name; e.approvedAt = nowIso(); }
    if (!ex) C.entries.push(e); Store.put('capacity', C);
    audit('Capacity Setup', ex ? 'Capacity request edited' : st === 'Approved' ? 'Capacity approved' : st === 'Draft' ? 'Capacity draft saved' : 'Capacity change submitted', { old: ex ? `${brName(bid)} ${cls} ${sec}: ${was}` : `${brName(bid)} ${cls} ${sec}: ${prev || 'not set'}`, new: `${n}${over ? ' (override below target ' + tg + ')' : ''} from ${e.from}${e.revisedFrom ? ' (revises ' + e.revisedFrom + ')' : ''}`, reason: reason + (rem ? ' · ' + rem : ''), approval: st, approver: e.apBy || '' });
    closeModal(); toast(ex ? 'Capacity request updated.' : st === 'Approved' ? 'Capacity approved and in force.' : st === 'Draft' ? 'Draft saved.' : 'Submitted.');
  },
  capStep: t => { const id = t.dataset.k, st = t.dataset.v; askReason(`${st === 'Recommended' ? 'Recommend' : st === 'Submitted' ? 'Submit' : st.slice(0, -2)} capacity change`, st === 'Approved' ? 'Approval remarks are mandatory and the capacity takes effect from its effective date.' : 'Your remarks are kept in the capacity history.', r => {
    const C = Store.clone(Store.get('capacity')), e = C.entries.find(x => x.id === id); if (!e) return;
    if (st === 'Approved' && e.override && !r) return;
    e.status = st; e.log = (e.log || []).concat([{ st, by: App.user.name, at: nowIso(), note: r }]);
    if (st === 'Recommended') e.recBy = App.user.name; if (st === 'Approved' || st === 'Rejected') { e.apBy = App.user.name; e.approvedAt = nowIso(); e.remarks = (e.remarks ? e.remarks + ' · ' : '') + r; }
    Store.put('capacity', C); applySections(); audit('Capacity Setup', (e.newSection ? 'New section ' : e.closeSection ? 'Section closure ' : 'Capacity ') + st.toLowerCase(), { old: `${brName(e.bid)} ${e.cls || ''} ${e.sec || ''}: ${e.prev || 'not set'}`, new: String(e.capacity), reason: r, approval: st, approver: st === 'Approved' || st === 'Rejected' ? App.user.name : '' }); toast('Capacity ' + st.toLowerCase() + '.'); }); },
  admEdit: t => admForm(t.dataset.k),
  admSave: t => { const bid = t.dataset.k, P = Store.clone(Store.get('admplans')), old = JSON.stringify(P[bid] || {}); P[bid] = { start: v('pS'), completion: v('pC'), workDays: v('pW'), walkins: v('pWi'), conv: v('pCv'), avgNet: v('pN'), monthlyTarget: v('pM'), principal: v('pPr'), head: v('pH'), counsellor: v('pCo'), bd: v('pBd'), catTargets: v('pCat') }; if (!P[bid].start || !P[bid].completion || P[bid].completion < P[bid].start) return toast('Enter a plan start date before the completion date.', 'bad'); Store.put('admplans', P); audit('Admission Plan', 'Admission plan changed', { old, new: brName(bid) + ' ' + JSON.stringify(P[bid]) }); closeModal(); toast('Admission plan saved.'); },
  /* masters */
  catMove: t => { const [kind, id] = t.dataset.k.split(':'); const C = Store.clone(Store.get('categories')); const L = C[kind].sort((a, b) => a.order - b.order); const i = L.findIndex(c => c.id === id), j = i + +t.dataset.v; if (j < 0 || j >= L.length) return; [L[i].order, L[j].order] = [L[j].order, L[i].order]; Store.put('categories', C); audit('Category Masters', 'Category reordered', { new: `${kind}: ${L[i].name}` }); },
  catEdit: t => { const [kind, id] = t.dataset.k.split(':'); const c = Store.get('categories')[kind].find(x => x.id === id); modal('Rename category', `<label class="fld"><span>Name</span><input id="catNm" value="${esc(c.name)}"></label>`, `<button class="btn" data-act="closeModal">Cancel</button><button class="btn primary" data-act="catEditOk" data-k="${t.dataset.k}">Save</button>`); },
  catEditOk: t => { const [kind, id] = t.dataset.k.split(':'); const n = (v('catNm') || '').trim(); if (!n) return; askReason('Rename category', n, async r => { const C = Store.clone(Store.get('categories')); const c = C[kind].find(x => x.id === id); const old = c.name; c.name = n; await Store.put('categories', C); audit('Category Masters', (kind === 'student' ? 'Student' : 'Fee') + ' category renamed', { old, new: n, reason: r }); }); },
  catToggle: t => { const [kind, id] = t.dataset.k.split(':'); askReason('Change category status', '', async r => { const C = Store.clone(Store.get('categories')); const c = C[kind].find(x => x.id === id); c.active = !c.active; await Store.put('categories', C); audit('Category Masters', (kind === 'student' ? 'Student' : 'Fee') + ' category ' + (c.active ? 'activated' : 'deactivated'), { new: c.name, reason: r }); }); },
  catAdd: t => { const kind = t.dataset.k, n = (v('newCat_' + kind) || '').trim(); if (!n) return; askReason('Add ' + (kind === 'cancel' ? 'reason' : 'category'), n, async r => { const C = Store.clone(Store.get('categories')); C[kind] = C[kind] || []; C[kind].push({ id: (kind === 'student' ? 'SC' : kind === 'cancel' ? 'CR' : 'FC') + 'X' + Date.now().toString(36), name: n, active: true, order: C[kind].length }); await Store.put('categories', C); audit('Category Masters', (kind === 'cancel' ? 'Cancellation reason' : kind === 'student' ? 'Student category' : 'Fee category') + ' added', { new: n, reason: r }); }); },
  /* import */
  impTemplate: async () => { if (!window.XLSX) return toast('The Excel library did not load.', 'bad'); const k = App.ui.impType || 'targets', I = IMPORTS[k]; const ws = XLSX.utils.aoa_to_sheet([I.cols, ...I.ex]); ws['!cols'] = I.cols.map(c => ({ wch: Math.max(14, c.length + 2) })); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, I.name.slice(0, 30)); await saveFile(`Import_template_${k}.xlsx`, new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })])); },
  impRun: () => impRun(), impClear: () => { App.ui.impPreview = null; rerender(); },
  /* hierarchy */
  hierReplace: t => hierForm(t.dataset.k, t.dataset.v), hierOk: t => hierOk(t.dataset.k, t.dataset.v),
  branchEdit: t => branchForm(t.dataset.k), branchOk: t => branchOk(t.dataset.k),
  setYear: t => { App.f.ay = t.dataset.v; App.ui.drill = []; MEMO.clear(); rerender(); },
  addYear: () => yearForm(''), editYear: t => yearForm(t.dataset.k),
  saveYear: t => {
    const code = t.dataset.k, err = m => { const e = $('#yErr'); e.textContent = m; e.hidden = false; };
    const c = Store.clone(Store.get('config')), nc = code || (v('yC') || '').trim(), st = v('yS'), a = v('yA'), b = v('yB');
    if (!/^\d{4}-\d{2}$/.test(nc)) return err('Use the form 2027-28.'); if (!a || !b || b <= a) return err('The end date must be after the start date.');
    if (!code && c.years.some(y => y.code === nc)) return err('That academic year already exists.');
    const copy = !code && v('yCopy');
    askReason(code ? 'Change academic year' : 'Add academic year', nc, async r => {
      if (code) { const y = c.years.find(x => x.code === code); const old = JSON.stringify(y); Object.assign(y, { start: a, end: b, status: st }); audit('Targets & Instalments', 'Academic year changed', { old, new: JSON.stringify(y), reason: r }); }
      else { c.years.push({ code: nc, start: a, end: b, status: st, source: 'App', addedBy: App.user.name, addedAt: nowIso() }); if (copy) { const shift = +nc.slice(0, 4) - +CUR_AY.slice(0, 4); c.yearSchedules = c.yearSchedules || {}; c.yearSchedules[nc] = shiftSchedule(c.schedule, shift); } audit('Targets & Instalments', 'Academic year added', { new: `${nc} ${a} → ${b} (${st})${copy ? ', schedule copied' : ''}`, reason: r }); }
      await Store.put('config', c); if (!code) App.f.ay = nc; toast(code ? 'Academic year updated.' : `AY ${nc} added.`);
    });
  },
  yearStatus: t => askReason((t.dataset.v === 'Closed' ? 'Close' : 'Reopen') + ' academic year ' + t.dataset.k, t.dataset.v === 'Closed' ? 'A closed year stays in Multi-year comparison; its targets and schedule are read-only.' : '', async r => { const c = Store.clone(Store.get('config')), y = c.years.find(x => x.code === t.dataset.k); const old = y.status; y.status = t.dataset.v; await Store.put('config', c); audit('Targets & Instalments', 'Academic year ' + t.dataset.v.toLowerCase(), { old: y.code + ' ' + old, new: y.code + ' ' + y.status, reason: r }); }),
  copySched: t => askReason('Copy instalment schedule', `${CUR_AY} fee heads with due dates moved to ${t.dataset.v}.`, async r => { const c = Store.clone(Store.get('config')), ay = t.dataset.v, shift = +ay.slice(0, 4) - +CUR_AY.slice(0, 4); c.yearSchedules = c.yearSchedules || {}; c.yearSchedules[ay] = shiftSchedule(c.schedule, shift); await Store.put('config', c); audit('Targets & Instalments', 'Instalment schedule copied', { new: `${CUR_AY} → ${ay}`, reason: r }); }),
  exitNew: t => exitForm(t.dataset.k), exitSubmit: () => exitSubmit(),
  dirAdd: t => dirForm(t.dataset.k, t.dataset.v), dirAddOk: t => dirAddOk(t.dataset.k, t.dataset.v),
  dirNew: t => dirPersonForm('', t.dataset.v), dirEdit: t => dirPersonForm(t.dataset.k, t.dataset.v), dirPersonOk: t => dirPersonOk(t.dataset.k, t.dataset.v),
  dirRemove: t => dirRemoveForm(t.dataset.k, t.dataset.v), dirRemoveOk: t => dirRemoveOk(t.dataset.k, t.dataset.v),
  switchUser: () => {}, loadView: () => {}, toggleNav: () => document.body.classList.toggle('navopen'), toggleFilters: () => { document.body.classList.toggle('filtersopen'); $('#ftoggle').setAttribute('aria-expanded', document.body.classList.contains('filtersopen')); }
};
function runSync(entity) {
  const steps = ['Branch masters', 'Employee / user masters', 'Students', 'Fee plans', 'Instalments', 'Invoices', 'Receipts', 'Concessions', 'Refunds', 'Validation & reconciliation'];
  let i = 0; App.ui.syncRun = { pct: 0, step: 'Connecting to ERP' }; rerender();
  const tick = async () => {
    if (i < steps.length) { App.ui.syncRun = { pct: Math.round((i + 1) / steps.length * 100), step: 'Syncing ' + steps[i] }; i++; if (App.route === 'admin_sync') rerender(); setTimeout(tick, 260); return; }
    const S = Store.clone(Store.get('sync')); const at = nowIso();
    if (entity !== 'All') S.runs.forEach(r => { if (r.entity === 'Concessions' && r.status !== 'Success') r.retried = true; });
    S.runs.unshift({ at, status: 'Success', by: App.user.name, ok: 0, failed: 0, dups: entity === 'All' ? DATA.dups.length : 0, entity }); S.runs = S.runs.slice(0, 30); S.lastSuccess = at;
    App.ui.syncRun = null; await Store.put('sync', S);
    audit('ERP Sync & Reconciliation', entity === 'All' ? 'Manual ERP sync' : 'Failed sync retried', { new: `Success · ${NUM(DATA.receipts.length)} receipts validated · ${DATA.dups.length} duplicates flagged` }); toast('Sync complete.');
  };
  setTimeout(tick, 300);
}

/* ---------- events ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return;
  if (t.tagName === 'SELECT' || (t.tagName === 'INPUT' && t.type !== 'button')) return;
  const f = ACT[t.dataset.act]; if (!f) return; e.preventDefault(); f(t, e);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !$('#modal').hidden) closeModal();
  if (e.key === 'Enter' && e.target.matches('tr[data-act]')) ACT[e.target.dataset.act](e.target);
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.f) { const k = t.dataset.f; if (k === 'ay') { App.f.ay = t.value; App.ui.drill = []; MEMO.clear(); rerender(); return; } if (k === 'cls') App.f.sec = ''; if (['region', 'zone', 'branch', 'director', 'rd', 'zd', 'type'].includes(k)) App.ui.drill = []; if (k === 'date') { if (!t.value) return; const d = t.value < '2026-04-01' ? '2026-04-01' : t.value > SRC.today ? SRC.today : t.value; App.f.date = d; } else { App.f[k] = t.value; if (k === 'region') { App.f.zone = ''; App.f.branch = ''; } if (k === 'zone') App.f.branch = ''; } rerender(); return; }
  const a = t.dataset.act;
  if (a === 'uiSel') { App.ui[t.dataset.k] = t.value; if (t.dataset.k === 'zpBy') App.ui.zpDrill = ''; rerender(); }
  else if (a === 'uiSelN') { App.ui[t.dataset.k] = +t.value; App.ui.stCls = ''; rerender(); }
  else if (a === 'toggleUi') { App.ui[t.dataset.k] = t.checked; rerender(); }
  else if (a === 'perm') ACT.perm(t);
  else if (a === 'capPick') capPick();
  else if (a === 'srfChange' || a === 'srfRole') SRF_ACT[a](t);
  else if (a === 'saSens') SA_ACT.saSens(t);
  else if (a === 'pcDate') { App.ui[t.dataset.k] = t.value; rerender(); }
  else if (a === 'curCrCls') CU_ACT.curCrCls(t);
  else if (a === 'hmlAlStu') HM_ACT.hmlAlStu(t);
  else if (a === 'tnpAlRt') TN_ACT.tnpAlRt(t);
  else if (a === 'rovFile') RV_ACT.rovFile(t);
  else if (a === 'bilQ') BIL_ACT.bilQ(t);
  else if (a === 'cdkQ') CD_ACT.cdkQ(t);
  else if (a === 'cdkRange') CD_ACT.cdkRange(t);
  else if (['chDay', 'chCol', 'chRp', 'chRange'].includes(a)) CH_ACT[a](t);
  else if (['atDate', 'atRange', 'atSecSel', 'atExamMin'].includes(a)) AT_ACT[a](t);
  else if (a === 'fsAllCards') FS_ACT[a](t);
  else if (a === 'fdDay') FD_ACT[a](t);
  else if (a === 'sisPhotoPick') SIS_ACT.sisPhotoPick(t);
  else if (a === 'ipQ') IP_ACT.ipQ(t);
  else if (['scF', 'scFq', 'scCtCls', 'scLsCls', 'tmSel'].includes(a)) SC_ACT[a](t);
  else if (a === 'axSel') AX_ACT.axSel(t);
  else if (['gpF', 'gpFq'].includes(a)) GP_ACT[a](t);
  else if (['tkDay', 'tkMon'].includes(a)) TK_ACT[a](t);
  else if (['rbSet', 'rbFilt'].includes(a)) RB_ACT[a](t);
  else if (a === 'sxPick' || a === 'sxPickB') SX_ACT[a](t);
  else if (['grAsOn', 'grQ', 'roWeek', 'stQ'].includes(a)) HX_ACT[a](t);
  else if (['qgDay', 'qgBpC', 'qgBpS'].includes(a)) QG_ACT[a](t);
  else if (a === 'cmcNtCls') CM_ACT.cmcNtCls(t);
  else if (a === 'asF' || a === 'asRF' || a === 'asFm' || a === 'asFchk') AS_ACT[a](t);
  else if (a === 'cbRF') CB_ACT.cbRF(t);
  else if (a === 'utRF') UT_ACT.utRF(t);
  else if (a === 'rmEF' || a === 'rmLF' || a === 'rmRF' || a === 'rmImpMap' || a === 'rmImpFile') RM_ACT[a](t);
  else if (a && a.startsWith('fn') && FN_ACT[a]) FN_ACT[a](t);
  else if (a && a.startsWith('bk') && BK_ACT[a]) BK_ACT[a](t);
  else if (a && a.startsWith('hr') && HR_ACT[a]) HR_ACT[a](t);
  else if (a && a.startsWith('py') && PY_ACT[a]) PY_ACT[a](t);
  else if (a && a.startsWith('lc') && LC_ACT[a]) LC_ACT[a](t);
  else if (a && a.startsWith('mm') && MM_ACT[a]) MM_ACT[a](t);
  else if (a && a.startsWith('tcv') && TC_ACT[a]) TC_ACT[a](t);
  else if (a && a.startsWith('crm') && CRM_ACT[a]) CRM_ACT[a](t);
  else if (a && a.startsWith('psd') && PSD_ACT[a]) PSD_ACT[a](t);
  else if (a && a.startsWith('ai') && AI_ACT[a]) AI_ACT[a](t);
  else if (a && a.startsWith('sis') && a !== 'sisPhotoPick' && SIS_ACT[a]) SIS_ACT[a](t);
  else if (a && a.startsWith('ac') && AC_ACT[a]) AC_ACT[a](t);
  else if (a && a.startsWith('lm') && LM_ACT[a]) LM_ACT[a](t);
  else if (a && a.startsWith('ex') && EX_ACT[a]) EX_ACT[a](t);
  else if (a && a.startsWith('ud') && UD_ACT[a]) UD_ACT[a](t);
  else if (a && a.startsWith('hs') && HS_ACT[a]) HS_ACT[a](t);
  else if (a && a.startsWith('mtg') && MG_ACT[a]) MG_ACT[a](t);
  else if (a && a.startsWith('cns') && CN_ACT[a]) CN_ACT[a](t);
  else if (a && a.startsWith('frn') && FZ_ACT[a]) FZ_ACT[a](t);
  else if (a && a.startsWith('cl') && CL_ACT[a]) CL_ACT[a](t);
  else if (a && a.startsWith('tac') && TA_ACT[a]) TA_ACT[a](t);
  else if (a && a.startsWith('lrc') && LR_ACT[a]) LR_ACT[a](t);
  else if (a && a.startsWith('qps') && QP_ACT[a]) QP_ACT[a](t);
  else if (a && a.startsWith('lib') && LB_ACT[a]) LB_ACT[a](t);
  else if (a && a.startsWith('smk') && SK_ACT[a]) SK_ACT[a](t);
  else if (a && a.startsWith('adp') && ADP_ACT[a]) ADP_ACT[a](t);
  else if (a && a.startsWith('cmc') && CM_ACT[a]) CM_ACT[a](t);
  else if (a && a.startsWith('cur') && CU_ACT[a]) CU_ACT[a](t);
  else if (a && a.startsWith('fbp') && FB_ACT[a]) FB_ACT[a](t);
  else if (a && a.startsWith('hml') && HM_ACT[a]) HM_ACT[a](t);
  else if (a && a.startsWith('tnp') && TN_ACT[a]) TN_ACT[a](t);
  else if (a && a.startsWith('aml') && AM_ACT[a]) AM_ACT[a](t);
  else if (a && a.startsWith('rov') && RV_ACT[a]) RV_ACT[a](t);
  else if (a && CH_ACT[a] && !['chDay', 'chCol', 'chRp', 'chRange'].includes(a)) CH_ACT[a](t);
  else if (a && PT_ACT[a]) PT_ACT[a](t);
  else if (a && RF_ACT[a]) RF_ACT[a](t);
  else if (a && FS_ACT[a] && a !== 'fsAllCards') FS_ACT[a](t);
  else if (a && FD_ACT[a] && a !== 'fdDay') FD_ACT[a](t);
  else if (a && CT_ACT[a]) CT_ACT[a](t);
  else if (a && OP_ACT[a]) OP_ACT[a](t);
  else if (a && HD_ACT[a]) HD_ACT[a](t);
  else if (a && LN_ACT[a]) LN_ACT[a](t);
  else if (a && EA_ACT[a]) EA_ACT[a](t);
  else if (a && CO_ACT[a]) CO_ACT[a](t);
  else if (a && IP_ACT[a] && a !== 'ipQ') IP_ACT[a](t);
  else if (a && SC_ACT[a] && !['scF', 'scFq', 'scCtCls', 'scLsCls', 'tmSel'].includes(a)) SC_ACT[a](t);
  else if (a && AX_ACT[a] && a !== 'axSel') AX_ACT[a](t);
  else if (a && TG_ACT[a]) TG_ACT[a](t);
  else if (a && GP_ACT[a] && !['gpF', 'gpFq'].includes(a)) GP_ACT[a](t);
  else if (a && TK_ACT[a] && !['tkDay', 'tkMon'].includes(a)) TK_ACT[a](t);
  else if (a && RB_ACT[a] && !['rbSet', 'rbFilt'].includes(a)) RB_ACT[a](t);
  else if (a && XD_ACT[a]) XD_ACT[a](t);
  else if (a && HX_ACT[a] && !['grAsOn', 'grQ', 'roWeek', 'stQ'].includes(a)) HX_ACT[a](t);
  else if (a && SV_ACT[a]) SV_ACT[a](t);
  else if (a && QG_ACT[a] && !['qgDay', 'qgBpC', 'qgBpS'].includes(a)) QG_ACT[a](t);
  else if (a && SX_ACT[a] && a !== 'sxPick' && a !== 'sxPickB') SX_ACT[a](t);
  else if (a && AT_ACT[a] && !['atDate', 'atRange', 'atSecSel'].includes(a)) AT_ACT[a](t);
  else if (a && a.startsWith('cdk') && a !== 'cdkQ' && a !== 'cdkRange' && CD_ACT[a]) CD_ACT[a](t);
  else if (a && a.startsWith('myd') && MY_ACT[a]) MY_ACT[a](t);
  else if (a === 'secPick') secForm({ bid: v('sB'), cls: v('sC') });
  else if (a === 'tgtCalc') { tgtCalc(t.closest('.dlg').querySelector('[data-act=tgtSave]').dataset.k); }
  else if (a === 'yearPick') { const L = [...document.querySelectorAll('[data-act=yearPick]:checked')].map(x => x.value); if (L.length < 2 || L.length > 5) { toast('Pick between 2 and 5 academic years.', 'bad'); t.checked = !t.checked; return; } App.ui.years = yearCodes().filter(y => L.includes(y)).join(','); rerender(); }
  else if (a === 'impFile') impParse(t.files[0]);
  else if (a === 'switchUser') { App.user = userById(t.value); LS.set('user', t.value); App.f.branch = ''; App.f.director = ''; App.f.region = ''; App.f.zone = ''; App.ui = {}; audit('Session', 'Signed in', { new: App.user.name + ' · ' + App.user.role }); saSession('Signed in'); render(); toast('Signed in as ' + App.user.name.replace(' (demo)', '')); }
  else if (a === 'loadView') { const x = Store.list('views').find(z => z.id === t.value); if (x) { App.f = Object.assign({}, App.f, x.f); go(x.route); } }
});
let inT = 0;
document.addEventListener('input', e => { const t = e.target; if (t.dataset.act === 'srfInput') { SRF_ACT.srfInput(t); return; } if (t.dataset.act === 'fnJvCalc') { FN_ACT.fnJvCalc(); return; } if (t.dataset.act === 'asPickQ') { App.ui.asPq = Object.assign({}, App.ui.asPq || {}, { [t.dataset.k]: t.value }); const q = t.value.toLowerCase(); document.querySelectorAll('#aspl_' + t.dataset.k + ' .chk').forEach(l => l.hidden = !!q && !l.textContent.toLowerCase().includes(q)); return; } if (t.dataset.act === 'tgtCalc') { if (t.id !== 'gR') { const r = document.getElementById('gR'); if (r && r.dataset.auto !== '0') r.dataset.auto = '1'; } tgtCalc(t.closest('.dlg').querySelector('[data-act=tgtSave]').dataset.k); return; } if (t.id === 'gR') t.dataset.auto = '0'; if (t.dataset.act === 'capPick' && t.id === 'cN') { capPick(); return; } if (t.dataset.act === 'dirFilter') { const q = t.value.toLowerCase(); document.querySelectorAll('#dirList .chk').forEach(l => l.hidden = !!q && !l.textContent.toLowerCase().includes(q)); document.querySelectorAll('#dirList .brgroup').forEach(g => g.hidden = ![...g.querySelectorAll('.chk')].some(l => !l.hidden)); return; } if (t.dataset.act === 'uiInput') { clearTimeout(inT); inT = setTimeout(() => { App.ui[t.dataset.k] = t.value; App.ui._focus = t.id; render(); }, 250); } });
window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (PAGES[h] && h !== App.route) go(h); });
try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', rerender); } catch (e) { }
new MutationObserver(rerender).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

/* ---------- helpers for the strength modules ---------- */
function tgtDecide(bid, st) {
  askReason(st === 'Approved' ? 'Approve target' : 'Reject target', brName(bid), async r => {
    const TG = Store.clone(Store.get('targets')), PL = isCurYear() ? TG.plans : ((TG.byYear || {})[App.f.ay] || {}), p = PL[bid]; if (!p || !p.pending) return;
    if (p.pending.byId === App.user.id) return toast('A different authorised user must approve this target.', 'bad');
    const old = p.approved ? p.approved.target : null, nv = p.pending.target;
    if (st === 'Approved') { p.approved = Object.assign({}, p.pending, { approvedBy: App.user.name, approvedAt: nowIso() }); p.classTargets = p.pending.classTargets || {}; }
    p.pending = null; p.status = st;
    TG.history.push({ ay: App.f.ay, bid, old, new: nv, reason: r, user: App.user.name, role: App.user.role, at: nowIso(), status: st, approver: App.user.name });
    await Store.put('targets', TG); audit('Target Planning', 'Target ' + st.toLowerCase(), { old: old != null ? String(old) : '', new: brName(bid) + ': ' + nv, reason: r, approval: st, approver: App.user.name }); toast('Target ' + st.toLowerCase() + '.');
  });
}
function impParse(file) {
  if (!file) return; if (!window.XLSX) return toast('The Excel library did not load.', 'bad');
  const k = App.ui.impType || 'targets', I = IMPORTS[k];
  const rd = new FileReader();
  rd.onload = () => {
    try {
      const wb = XLSX.read(new Uint8Array(rd.result), { type: 'array' }), ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });
      const bids = new Set(DATA.branches.map(b => b.id)), mine = scopeOf(App.user);
      const rows = raw.map((o, n) => { const vv = {}; I.cols.forEach(c => vv[c] = o[c] != null ? String(o[c]).trim() : ''); let err = '';
        const miss = I.cols.find(c => !/optional|Remarks|Effective To|Average|Revenue Target|Completion|Reason|Cancellations|Transfers Out/.test(c) && vv[c] === '');
        if (miss) err = `Missing ${miss}`; else if (!bids.has(vv['Branch ID'])) err = 'Unknown branch ID'; else if (!mine.has(DATA.branches.findIndex(b => b.id === vv['Branch ID']))) err = 'Branch outside your access';
        else if (!yearCodes().includes(vv['Academic Year'])) err = 'Unknown academic year';
        else if (k === 'targets' && !(+vv['Manual Target Strength'] > 0)) err = 'Target must be a positive number';
        else if (k === 'capacity' && !(+vv['Manual Approved Capacity'] > 0)) err = 'Capacity must be a positive number';
        else if (k === 'history' && vv['Academic Year'] === CUR_AY) err = 'Current year comes from the ERP';
        return { n: n + 2, v: vv, err }; });
      App.ui.impPreview = { type: k, rows, file: file.name }; rerender();
    } catch (e) { toast('Could not read that file: ' + e.message, 'bad'); }
  };
  rd.readAsArrayBuffer(file);
}
function impRun() {
  const P = App.ui.impPreview; if (!P) return; const ok = P.rows.filter(r => !r.err);
  askReason('Import data', `${ok.length} rows from ${P.file}`, async r => {
    if (P.type === 'targets') { const TG = Store.clone(Store.get('targets')); ok.forEach(x => { const v2 = x.v, bid = v2['Branch ID'], ayI = v2['Academic Year'], PL = ayI === CUR_AY ? TG.plans : ((TG.byYear = TG.byYear || {})[ayI] = TG.byYear[ayI] || {}), p = PL[bid] || (PL[bid] = { approved: null, pending: null, status: 'Draft', classTargets: {} }); const base = p.pending || Object.assign({}, p.approved || {}); if (v2['Class (optional)']) { base.classTargets = Object.assign({}, base.classTargets || p.classTargets || {}, { [v2['Class (optional)']]: +v2['Manual Target Strength'] }); } else { const g = +v2['Average Gross Fee'] || base.avgGross || 0, c = v2['Average Concession %'] !== '' ? +v2['Average Concession %'] : base.concPct || 0, net = Math.round(g * (1 - c / 100)); Object.assign(base, { target: +v2['Manual Target Strength'], avgGross: g, concPct: c, avgNet: net, revTarget: +v2['Revenue Target'] || +v2['Manual Target Strength'] * net, completion: v2['Target Completion Date'] || base.completion || '2026-12-31', remarks: v2['Remarks'] || 'Excel import' }); } base.by = App.user.name; base.byId = App.user.id; base.at = nowIso(); p.pending = base; p.status = 'Submitted'; TG.history.push({ ay: ayI, bid, old: p.approved ? p.approved.target : null, new: base.target, reason: 'Excel import: ' + P.file, user: App.user.name, role: App.user.role, at: nowIso(), status: 'Submitted', approver: '' }); }); await Store.put('targets', TG); }
    if (P.type === 'capacity') { const C = Store.clone(Store.get('capacity')); ok.forEach((x, i) => { const v2 = x.v; C.entries.push({ id: 'CAP' + Date.now().toString(36) + i, ay: v2['Academic Year'], bid: v2['Branch ID'], cls: v2['Class (optional)'], sec: v2['Section (optional)'], capacity: +v2['Manual Approved Capacity'], prev: null, reason: v2['Reason'] || 'Excel import', remarks: 'Imported from ' + P.file, doc: P.file, from: v2['Effective From'] || ACCESS_DATE, to: v2['Effective To'], status: 'Submitted', by: App.user.name, byId: App.user.id, at: nowIso(), log: [{ st: 'Submitted', by: App.user.name, at: nowIso(), note: 'Excel import' }] }); }); await Store.put('capacity', C); }
    if (P.type === 'history') { const H = Store.clone(Store.get('histimport')); const map = { 'Strength': 'strength', 'Target Strength': 'target', 'Capacity': 'capacity', 'New Admissions': 'newAdm', 'Renewals': 'renewals', 'Withdrawals': 'withdrawals', 'Cancellations': 'cancellations', 'Transfers Out': 'transfersOut', 'Gross Fee': 'gross', 'Concession': 'conc', 'Scholarship': 'schol', 'Net Revenue': 'net', 'Revenue Target': 'revTarget', 'Total Fee Demand': 'demand', 'Collected': 'collected', 'Outstanding': 'outstanding', 'Zero Payer Amount': 'zpAmt' }; ok.forEach(x => { const bid = x.v['Branch ID'], ay = x.v['Academic Year']; H[bid] = H[bid] || {}; H[bid][ay] = {}; Object.entries(map).forEach(([c, f]) => { if (x.v[c] !== '') H[bid][ay][f] = +String(x.v[c]).replace(/,/g, ''); }); }); await Store.put('histimport', H); }
    audit('Data Import', 'Data imported: ' + IMPORTS[P.type].name, { new: `${ok.length} rows from ${P.file}; ${P.rows.length - ok.length} rejected`, reason: r, approval: P.type === 'history' ? '—' : 'Submitted' });
    App.ui.impPreview = null; toast(`${ok.length} rows imported.`); rerender();
  });
}
function hierForm(bid, pos) {
  const b = DATA.branches.find(x => x.id === bid), h = hierOf(b, ACCESS_DATE), cur = { 'Principal': h.pr, 'Zonal Director': h.zd, 'Regional Director': h.rd }[pos];
  const scopeTxt = { 'Principal': b.name, 'Zonal Director': 'zone ' + b.zone + ' (all its branches)', 'Regional Director': 'region ' + b.region + ' (all its branches)' }[pos];
  modal(`Replace ${pos}`, `<p class="small">${esc(pos)} for ${esc(scopeTxt)}: currently <b>${esc(cur ? cur.name : 'vacant')}</b>.</p><div class="form-grid"><label class="fld"><span>New ${esc(pos)}</span><select id="hU">${users().filter(u => u.role === pos && u.status === 'Active' && (!cur || u.id !== cur.id)).map(u => `<option value="${u.id}">${esc(u.name)}</option>`).join('')}</select></label><label class="fld"><span>Effective from</span><input type="date" id="hF" value="${E.ds(E.dn(ACCESS_DATE) + 1)}"></label></div><label class="fld"><span>Reason (transfer, replacement, resignation…)</span><textarea id="hR" rows="2"></textarea></label><p class="small muted">To add a new person, create the user first in User Management.</p>`, `<button class="btn" data-act="closeModal">Cancel</button><button class="btn primary" data-act="hierOk" data-k="${bid}" data-v="${pos}">Replace</button>`);
}
async function hierOk(bid, pos) {
  const nu = v('hU'), f = v('hF'), r = (v('hR') || '').trim(); if (!nu || !f || !r) return toast('Choose the person, the date and a reason.', 'bad');
  const b = DATA.branches.find(x => x.id === bid), h = hierOf(b, ACCESS_DATE), y = E.ds(E.dn(f) - 1), cur = { 'Principal': h.pr, 'Zonal Director': h.zd, 'Regional Director': h.rd }[pos];
  {
    const M = Store.clone(Store.get('mappings'));
    const match = m => pos === 'Principal' ? m.type === 'Own Branch Only' && (m.branches || []).includes(bid) : pos === 'Zonal Director' ? m.type === 'All Branches Under Zone' && m.zone === b.zone : m.type === 'All Branches Under Region' && m.region === b.region;
    M.filter(m => match(m) && activeOn(m, ACCESS_DATE) && userById(m.user) && userById(m.user).role === pos).forEach(m => m.to = y);
    M.push(Object.assign({ id: 'M' + Date.now().toString(36), user: nu, from: f, to: '', status: 'Active', level: 'Read Only' }, pos === 'Principal' ? { type: 'Own Branch Only', branches: [bid] } : pos === 'Zonal Director' ? { type: 'All Branches Under Zone', zone: b.zone } : { type: 'All Branches Under Region', region: b.region }));
    await Store.put('mappings', M);
    if (pos === 'Principal') { const U = Store.clone(users()); const u = U.find(x => x.id === nu); if (u) { u.branch = bid; await Store.put('users', U); } }
  }
  audit('Hierarchy Setup', pos + ' replaced', { old: (cur ? cur.name : 'vacant') + ' · ' + brName(bid), new: (userById(nu) || {}).name + ' from ' + f, reason: r }); closeModal(); toast(pos + ' replaced from ' + isoLabel(f) + '.');
}
function branchForm(bid) {
  const b = DATA.branches.find(x => x.id === bid), regions = [...new Set(DATA.branches.map(x => x.region))], zones = [...new Set(DATA.branches.map(x => x.zone))];
  modal('Edit branch · ' + b.name, `<div class="form-grid"><label class="fld"><span>Region</span><select id="bR">${regions.map(x => `<option ${x === b.region ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></label><label class="fld"><span>Zone</span><input id="bZ" list="zl" value="${esc(b.zone)}"><datalist id="zl">${zones.map(z => `<option>${esc(z)}</option>`).join('')}</datalist></label><label class="fld"><span>School type</span><select id="bT">${['School', 'Junior College', 'Degree College'].map(x => `<option ${x === b.type ? 'selected' : ''}>${x}</option>`).join('')}</select></label><label class="fld"><span>Effective from</span><input type="date" id="bF" value="${ACCESS_DATE}"></label></div><label class="fld"><span>Reason</span><textarea id="bRs" rows="2"></textarea></label>`, `<button class="btn" data-act="closeModal">Cancel</button><button class="btn primary" data-act="branchOk" data-k="${bid}">Save</button>`);
}
async function branchOk(bid) {
  const b = DATA.branches.find(x => x.id === bid), r = (v('bRs') || '').trim(); if (!r) return toast('Enter a reason.', 'bad');
  const BM = Store.clone(Store.get('branchmeta')), L = BM[bid] || (BM[bid] = []), f = v('bF');
  [['region', v('bR')], ['zone', (v('bZ') || '').trim()], ['type', v('bT')]].forEach(([k, val]) => { if (val && val !== b[k]) L.push({ field: k, old: b[k], val, from: f, by: App.user.name, at: nowIso() }); });
  await Store.put('branchmeta', BM); audit('Hierarchy Setup', 'Branch master changed', { new: brName(bid) + ' ' + L.slice(-3).map(e => `${e.field}: ${e.old} → ${e.val}`).join('; '), reason: r }); closeModal(); toast('Branch updated.');
}
function applyBranchMeta() {
  const BM = Store.get('branchmeta') || {};
  // branches added in the app (until the ERP master carries them)
  let added = false;
  (BM._new || []).forEach(nb => { if (DATA.branches.some(b => b.id === nb.id)) return; DATA.branches.push({ id: nb.id, name: nb.name, region: nb.region, zone: nb.zone, type: nb.type, portfolio: -1, idx: DATA.branches.length, code: nb.id, addedInApp: nb });
    if (DATA.leads) { const t = DATA.leads[0]; DATA.leads.push(Object.assign(JSON.parse(JSON.stringify(t)), { conv: 0, months: t.months.map(x => Object.assign({}, x, Object.fromEntries(Object.keys(x).filter(k => typeof x[k] === 'number').map(k => [k, 0])))) })); }
    added = true; });
  if (added) { allocKey = ''; ensureAlloc(); }
  DATA.branches.forEach(b => { if (!b._orig) b._orig = { region: b.region, zone: b.zone, type: b.type }; Object.assign(b, b._orig); b.inactive = null; b.closed = null; (BM[b.id] || []).filter(e => e.from <= ACCESS_DATE).sort((a, c) => a.at.localeCompare(c.at)).forEach(e => b[e.field] = e.val); });
  // status: latest status entry in force
  (BM._status || []).filter(e => e.from <= ACCESS_DATE).sort((a, c) => a.at.localeCompare(c.at)).forEach(e => { const b = DATA.branches.find(x => x.id === e.bid); if (!b) return; b.inactive = e.status === 'Inactive' ? e : null; b.closed = e.status === 'Closed' ? e : null; });
  MEMO.clear();
}
function branchStatusForm(bid, mode) {
  const b = DATA.branches.find(x => x.id === bid), bi = DATA.branches.indexOf(b), n = Str.allActive(bi, D_()).length, close = mode === 'close';
  const title = { close: 'Close branch', off: 'Deactivate branch', on: 'Activate branch' }[mode] + ' · ' + b.name;
  modal(title, `<div class="form-grid"><label class="fld"><span>Branch</span><input value="${esc(b.name)}" disabled></label><label class="fld"><span>Students on roll</span><input value="${n}" disabled></label><label class="fld"><span>Approved capacity</span><input value="${Str.branchCap(bid, D_()) || 'Not set'}" disabled></label><label class="fld"><span>Effective from</span><input type="date" id="bsF" value="${ACCESS_DATE}"></label></div>
  ${close ? (n ? `<p class="err">${n} students are on roll. Transfer them out or record their exits in the ERP before closing the branch; until then it can only be deactivated.</p>` : '<div class="note">Closing removes the branch from every screen and filter from the effective date. Its history stays in the workspace and in the audit trail.</div>') : mode === 'off' ? '<div class="note">An inactive branch stays in reports and filters with an Inactive mark, but is left out of capacity, target planning, admission plans and alerts until it is activated again.</div>' : '<div class="note">The branch counts towards capacity, targets and alerts again from the effective date.</div>'}
  <label class="fld"><span>Reason (required)</span><textarea id="bsR" rows="2"></textarea></label><p class="err" id="bsErr" hidden></p>`,
  `<button class="btn" data-act="closeModal">Cancel</button>${close && n ? '' : `<button class="btn primary${close ? ' danger' : ''}" data-act="branchStatusOk" data-k="${bid}" data-v="${mode}">${{ close: 'Close branch', off: 'Deactivate', on: 'Activate' }[mode]}</button>`}`);
}
async function branchStatusOk(bid, mode) {
  const r = (v('bsR') || '').trim(), f = v('bsF'), err = mm => { const e = $('#bsErr'); e.textContent = mm; e.hidden = false; }; if (!r) return err('Enter the reason.'); if (!f) return err('Enter the effective date.');
  const b = DATA.branches.find(x => x.id === bid), bi = DATA.branches.indexOf(b); if (mode === 'close' && Str.allActive(bi, D_()).length) return err('Students are on roll: the branch cannot be closed yet.');
  const BM = Store.clone(Store.get('branchmeta') || {}); BM._status = (BM._status || []).concat([{ bid, status: { close: 'Closed', off: 'Inactive', on: 'Active' }[mode], from: f, by: App.user.name, role: App.user.role, at: nowIso(), reason: r }]);
  const old = b.closed ? 'Closed' : b.inactive ? 'Inactive' : 'Active';
  await Store.put('branchmeta', BM); applyBranchMeta(); audit('Hierarchy Setup', 'Branch ' + { close: 'closed', off: 'deactivated', on: 'activated' }[mode], { old, new: `${b.name}: ${{ close: 'Closed', off: 'Inactive', on: 'Active' }[mode]} from ${f}`, reason: r, approval: '—' });
  if (mode === 'close' && App.f.branch === bid) App.f.branch = '';
  closeModal(); toast('Branch ' + { close: 'closed', off: 'deactivated', on: 'activated' }[mode] + '.');
}
function branchNewForm() {
  const regions = [...new Set(DATA.branches.map(x => x.region))], zones = [...new Set(DATA.branches.map(x => x.zone))];
  const next = 'B' + String(Math.max(0, ...DATA.branches.map(b => +String(b.id).replace(/\D/g, '') || 0)) + 1).padStart(2, '0');
  modal('Add branch', `<div class="form-grid"><label class="fld"><span>Branch code</span><input id="nbId" value="${next}" maxlength="8"></label><label class="fld"><span>Branch name</span><input id="nbN" placeholder="e.g. MS Creative School Kondapur"></label><label class="fld"><span>Region</span><select id="nbR">${regions.map(x => `<option>${esc(x)}</option>`).join('')}</select></label><label class="fld"><span>Zone</span><input id="nbZ" list="nbzl" placeholder="Existing or new zone"><datalist id="nbzl">${zones.map(z => `<option>${esc(z)}</option>`).join('')}</datalist></label><label class="fld"><span>School type</span><select id="nbT">${['School', 'Junior College', 'Degree College'].map(x => `<option>${x}</option>`).join('')}</select></label><label class="fld"><span>Opens on</span><input type="date" id="nbF" value="${ACCESS_DATE}"></label></div>
  <div class="note">The branch is created in this workspace with no students, capacity or targets. Add its classes and sections on the Capacity screen, map its Principal and Director on the Hierarchy screen, and set its target on Target planning. ERP data for the branch flows in once the ERP master carries the same code.</div>
  <label class="fld"><span>Reason / approval reference (required)</span><textarea id="nbRs" rows="2"></textarea></label><p class="err" id="nbErr" hidden></p>`,
  `<button class="btn" data-act="closeModal">Cancel</button><button class="btn primary" data-act="branchNewOk">Add branch</button>`);
}
async function branchNewOk() {
  const err = mm => { const e = $('#nbErr'); e.textContent = mm; e.hidden = false; };
  const id = (v('nbId') || '').trim().toUpperCase(), name = (v('nbN') || '').trim(), region = v('nbR'), zone = (v('nbZ') || '').trim(), type = v('nbT'), from = v('nbF'), r = (v('nbRs') || '').trim();
  if (!/^[A-Z0-9]{2,8}$/.test(id)) return err('Enter a branch code of 2 to 8 letters or digits.'); if (DATA.branches.some(b => b.id === id)) return err('Branch code ' + id + ' is already in use.');
  if (name.length < 4) return err('Enter the branch name.'); if (DATA.branches.some(b => b.name.toLowerCase() === name.toLowerCase())) return err('A branch with this name already exists.');
  if (!zone) return err('Enter the zone.'); if (!from) return err('Enter the opening date.'); if (!r) return err('Enter the reason or approval reference.');
  const BM = Store.clone(Store.get('branchmeta') || {}); BM._new = (BM._new || []).concat([{ id, name, region, zone, type, from, by: App.user.name, at: nowIso(), reason: r }]);
  await Store.put('branchmeta', BM); applyBranchMeta(); audit('Hierarchy Setup', 'Branch added', { old: '', new: `${id} · ${name} · ${region} / ${zone} · ${type} · opens ${from}`, reason: r, approval: '—' });
  closeModal(); toast('Branch ' + name + ' added.');
}

/* ---------- boot ---------- */
/* rename migration: the Zone Director role is now called Zonal Director in saved users, role matrix, directory fields and email lists */
let renaming = false;
function migrateRoleNames() {
  if (renaming || !Store.writable) return; renaming = true;
  try {
    const U = Store.get('users'); if (U && U.some(u => u.role === 'Zone Director' || u.desig === 'Zone Director')) { const c = Store.clone(U); c.forEach(u => { if (u.role === 'Zone Director') u.role = 'Zonal Director'; if (u.desig === 'Zone Director') u.desig = 'Zonal Director'; }); Store.put('users', c); }
    const R = Store.get('roles'); if (R && R['Zone Director']) { const c = Store.clone(R); c['Zonal Director'] = c['Zonal Director'] || c['Zone Director']; delete c['Zone Director']; Store.put('roles', c); }
    const U2 = Store.get('users'); if (U2 && U2.some(u => u.branch && ['Principal', 'Branch Requester', 'Branch Accountant'].includes(u.role) && !/ – MS /.test(u.name) && brName(u.branch).startsWith('MS '))) { const c = Store.clone(U2); c.forEach(u => { if (u.branch && ['Principal', 'Branch Requester', 'Branch Accountant'].includes(u.role) && !/ – MS /.test(u.name) && brName(u.branch).startsWith('MS ')) u.name = u.name.replace(/ – .*?(\s\(demo\))?$/, ` – ${brName(u.branch)}$1`); }); Store.put('users', c); }
    const d = Store.get('emaildist'); if (d && d.lists && d.lists.some(l => l.rtype === 'Zone Director' || l.escTo === 'Zone Director')) { const c = Store.clone(d); c.lists.forEach(l => { if (l.rtype === 'Zone Director') l.rtype = 'Zonal Director'; if (l.escTo === 'Zone Director') l.escTo = 'Zonal Director'; }); Store.put('emaildist', c); }
  } finally { renaming = false; }
}

/* Director master: the Regional and Zonal Directors of the MSEA organisation (employee IDs 79001–79009) replace the placeholder directors.
   Applied once per workspace, in place, so user ids, mappings and every approval route stay intact. Hyderabad South and Central share the Old City zonal director. */
const DIR_MASTER = {
  rd: { 'Telangana': ['Mr. Mohammed Abdul Rahman', '79001'], 'Delhi': ['Dr. Shahid Siddiqui', '79002'], 'Uttar Pradesh': ['Mr. Faisal Ahmed Khan', '79003'], 'Maharashtra': ['Mrs. Nazia Shaikh', '79004'] },
  zd: { 'Hyderabad South': ['Mr. Syed Imtiaz Ali', '79005', ['Hyderabad Central']], 'Hyderabad West': ['Dr. Farhana Begum', '79006', []], 'Delhi': ['Mr. Arif Hussain', '79007', []], 'Kanpur': ['Mr. Zubair Qureshi', '79008', []], 'Mumbai': ['Mrs. Sabiha Ansari', '79009', []] }
};
let applyingDirs = false;
function dirMasterApply() {
  if (applyingDirs || !Store.writable) return; applyingDirs = true;
  try {
    const U0 = Store.get('users'); if (!U0 || U0.some(u => u.dirSrc)) return;
    const U = Store.clone(U0), M = Store.clone(Store.get('mappings') || []), log = [];
    Object.entries(DIR_MASTER.rd).forEach(([r, [name, no]]) => { const u = U.find(x => x.role === 'Regional Director' && x.region === r && x.status !== 'Deleted'); if (!u) return; log.push(`${u.name} → ${name}`); Object.assign(u, { name, empId: no, dirSrc: 'msea-2026' }); });
    Object.entries(DIR_MASTER.zd).forEach(([z, [name, no, extra]]) => {
      const u = U.find(x => x.role === 'Zonal Director' && x.zone === z && x.status !== 'Deleted'); if (!u) return;
      log.push(`${u.name} → ${name}`); Object.assign(u, { name, empId: no, dirSrc: 'msea-2026' });
      extra.forEach(z2 => { const o = U.find(x => x.role === 'Zonal Director' && x.zone === z2 && x.status !== 'Deleted' && x.id !== u.id); if (!o) return;
        M.forEach(m => { if (m.user === o.id) m.user = u.id; }); U.forEach(x => { if (x.manager === o.id) x.manager = u.id; });
        log.push(`${o.name} merged into ${name} (zone ${z2})`); o.status = 'Deleted'; o.dirSrc = 'msea-2026'; });
    });
    Store.put('users', U); Store.put('mappings', M);
    audit('Hierarchy Setup', 'Director master loaded', { new: log.join('; '), reason: 'Directors taken from the organisation master (employee IDs 79001–79009)' });
  } finally { applyingDirs = false; }
}
/* keep saved workspaces current: new roles, new modules and the Super Admin account appear without resetting the role matrix */
let migratingAccess = false;
function migrateAccess() {
  if (migratingAccess || !Store.writable) return; migratingAccess = true;
  try {
    const R = Store.get('roles'), D = defaultRoles(); if (R) { let ch = false; const c = Store.clone(R); Object.keys(D).forEach(role => { if (!c[role]) { c[role] = D[role]; ch = true; return; } Object.keys(D[role].perms).forEach(mod => { if (!c[role].perms[mod]) { c[role].perms[mod] = D[role].perms[mod]; ch = true; } }); if (c[role].sensitive == null && D[role].sensitive) { c[role].sensitive = D[role].sensitive; ch = true; } if (['Parent', 'Student'].includes(role)) Object.keys(c[role].perms).forEach(m => { if (m !== 'portal') { delete c[role].perms[m]; ch = true; } }); }); if (ch) Store.put('roles', c); }
    const U0 = Store.get('users'); if (U0 && (!U0.some(u => u.role === 'Corporate Purchase') || !U0.some(u => u.role === 'Central Asset Team') || !U0.some(u => u.role === 'Petty Cash Custodian') || !U0.some(u => u.role === 'Utility Coordinator') || !U0.some(u => u.role === 'Accounts Payable Executive') || !U0.some(u => u.role === 'HR Admin') || !U0.some(u => u.role === 'Payroll Executive') || !U0.some(u => u.role === 'Legal Admin'))) { const want = DIR0.users.filter(u => ['Branch Requester', 'Store In-Charge', 'Storekeeper', 'Corporate Purchase', 'Asset Coordinator', 'Central Asset Team', 'Maintenance Manager', 'Technician', 'Petty Cash Custodian', 'Utility Coordinator', 'Finance Admin', 'Accountant', 'Accounts Payable Executive', 'Accounts Receivable Executive', 'Cashier', 'Internal Auditor', 'External Auditor', 'HR Admin', 'Corporate HR', 'Branch HR', 'Recruitment Executive', 'Payroll Executive', 'HOD', 'Employee', 'Legal Admin', 'Legal Staff'].includes(u.role)); const c = Store.clone(U0), M = Store.clone(Store.get('mappings')); let n = c.length; want.forEach(w => { if (c.some(u => u.email === w.email)) return; const nid = 'U' + String(800 + (n++ % 99)).padStart(3, '0'); c.push(Object.assign({}, w, { id: nid })); DIR0.maps.filter(m => m.user === w.id).forEach(m => M.push(Object.assign({}, m, { id: 'M' + Date.now().toString(36) + n, user: nid }))); }); Store.put('users', c); Store.put('mappings', M); }
    const U = Store.get('users'); if (U && !U.some(u => u.role === 'Super Admin')) { const c = Store.clone(U), n = c.length; c.push({ id: 'U' + String(900 + n % 90).padStart(3, '0'), empId: 'MSEA0001', name: 'Super Admin (demo)', role: 'Super Admin', desig: 'Group CIO', email: 'superadmin@msea.example', mobile: '9XXXXX0001', dept: 'IT', region: '', zone: '', branch: '', status: 'Active', manager: '', doj: '2019-06-01', lastLogin: '', mfa: true, sessionTimeout: 30, singleSession: true, forceChange: false }); Store.put('users', c); const M = Store.clone(Store.get('mappings')); M.push({ id: 'M' + Date.now().toString(36), user: c.at(-1).id, type: 'All Branches', from: '2026-04-01', to: '', status: 'Active', level: 'Full Control' }); Store.put('mappings', M); }
  } finally { migratingAccess = false; }
}
function ensureDists() { migrateRoleNames(); migrateAccess(); const d = Store.get('emaildist'); if (!d || !d.lists) return; const def = defaultEmail().lists, miss = def.filter(x => !d.lists.some(y => y.id === x.id));
  const legacy = d.lists.filter(l => l.rtype === 'Branch Director' || l.template === 'Branch Director' || l.escTo === 'Assigned Director');
  if ((miss.length || legacy.length) && Store.writable) { const c = Store.clone(d); c.lists = c.lists.concat(miss); c.lists.forEach(l => { if (l.rtype === 'Branch Director') { l.rtype = 'Zonal Director'; l.scope = 'Zone'; l.name = l.name.replace('Portfolio Report – Branch Directors', 'Zone Report – Zonal Directors'); } if (l.template === 'Branch Director') l.template = 'Director'; if (l.escTo === 'Assigned Director') l.escTo = 'Zonal Director'; }); Store.put('emaildist', c); } const T = Store.get('templates'), dt = defaultTemplates(), tm = Object.keys(dt).filter(k => !T[k]); if (tm.length && Store.writable) { const c = Store.clone(T); tm.forEach(k => c[k] = dt[k]); Store.put('templates', c); } }
Store.on(k => { if (k === 'users' || k === 'roles' || k === 'mappings') { migrateRoleNames(); migrateAccess(); try { HR_SCOPE_CACHE = { key: '', set: null }; } catch (e) { } } if (k === 'emaildist' || k === 'templates') ensureDists(); if (['srf', 'srf_work', 'srf_audit', 'srfsubs'].includes(k)) { SRF_BRIDGE.applyStore(k); return; } if (['users', 'mappings'].includes(k)) SRF_BRIDGE.refreshUsers(); if (k === 'config' && SRF_BRIDGE.ready) SRF_BRIDGE.syncYears(SRF.S); if (k === 'exits') { applyExits(); allocKey = ''; ensureAlloc(); } if (k === 'capacity') applySections(); if (k === 'smv') { applyMoves(); allocKey = ''; ensureAlloc(); } if (['config', 'adjustments'].includes(k)) ensureAlloc(); if (k === 'branchmeta') applyBranchMeta(); if (['config', 'adjustments', 'sync', 'resolved', 'branchmap', 'mappings', 'users', 'roles', 'targets', 'capacity', 'admplans', 'categories', 'branchmeta', 'histimport', 'modules', 'workflows', 'datarules', 'grants'].includes(k)) MEMO.clear(); if (k === 'datarules') saApplySrfWindows(); if (k === 'workflows') saApplySrfWorkflow(); if (k === 'proc' || k === 'proc_tx') { pcEnsureSeed(); MEMO.clear(); } if (k === 'assets' || k === 'asset_tx' || k === 'proc_tx') { asEnsureSeed(); } if (k === 'pcash' || k === 'pcash_tx' || k === 'users') { cbEnsureSeed(); } if (k === 'util' || k === 'util_tx' || k === 'users') { utEnsureSeed(); } if (k === 'rent' || k === 'rent_tx' || k === 'util_tx') { rmEnsureSeed(); } if (k === 'fin' || k === 'fin_tx' || k === 'rent_tx' || k === 'users') { fnEnsureSeed(); } if (k === 'fin_tx' || k === 'bank' || k === 'bank_tx') { bkEnsureSeed(); } if (k === 'hr' || k === 'hr_tx' || k === 'users' || k === 'mappings') { HR_CACHE = { key: '', E: null }; hrEnsureSeed(); } if (k === 'payroll' || k === 'hr_tx') { if (typeof pyEnsureSeed === 'function') pyEnsureSeed(); } if (['legal', 'legal_tx', 'rent', 'assets', 'users'].includes(k)) { LC_UCACHE = { key: '', U: null }; LC_ICACHE = { key: '', I: null }; lcEnsureSeed(); } if (['proc_tx', 'asset_tx', 'pcash_tx', 'util_tx', 'rent_tx', 'fin', 'fin_tx', 'bank', 'bank_tx', 'config', 'adjustments', 'exits'].includes(k)) fnInvalidate(); if (k === 'users' && App.user) App.user = userById(App.user.id) || App.user; if (String(k).startsWith('error:')) toast(k === 'error:invalid_argument' ? 'You have view-only access to this shared workspace. The change was not saved.' : 'The change could not be saved: ' + k.slice(6), 'bad'); if (!$('#modal').hidden && !String(k).startsWith('error')) return; rerender(); });
Object.assign(ACT, RB_ACT, GP_ACT, TK_ACT, TG_ACT, XD_ACT, AX_ACT, SC_ACT, IP_ACT, HX_ACT, CO_ACT, EA_ACT, SV_ACT, QG_ACT, LN_ACT, HD_ACT, SX_ACT, OP_ACT, CT_ACT, FD_ACT, FS_ACT, RF_ACT, PT_ACT, SRF_ACT, SA_ACT, PROC_ACT, AS_ACT, CB_ACT, UT_ACT, RM_ACT, FN_ACT, BK_ACT, HR_ACT, PY_ACT, LC_ACT, MM_ACT, TC_ACT, CRM_ACT, PSD_ACT, AI_ACT, SIS_ACT, AC_ACT, LM_ACT, EX_ACT, UD_ACT, HS_ACT, MG_ACT, CN_ACT, FZ_ACT, CL_ACT, TA_ACT, LR_ACT, QP_ACT, LB_ACT, SK_ACT, ADP_ACT, CM_ACT, CU_ACT, FB_ACT, HM_ACT, TN_ACT, AM_ACT, RV_ACT, BIL_ACT, CD_ACT, CH_ACT, AT_ACT, MY_ACT);
(function boot() {
  applyExits(); applySections(); applyMoves(); if (typeof applyAdmissions === 'function') applyAdmissions(); applyBranchMeta(); ensureAlloc(); dirMasterApply(); pickUser(); pcEnsureSeed(); asEnsureSeed(); cbEnsureSeed(); utEnsureSeed(); rmEnsureSeed(); fnEnsureSeed(); bkEnsureSeed(); hrEnsureSeed(); lcEnsureSeed(); mmEnsureSeed(); tcvEnsureSeed(); crmEnsureSeed(); psdEnsureSeed(); try { tcvHrHeal(); } catch (e) { } saExpireGrants(); saApplySrfWindows(); saApplySrfWorkflow();
  const h = (location.hash || '').slice(1); if (PAGES[h]) App.route = h;
  render();
  Store.connect().then(ok => { if (ok) rerender(); if (!ok && window.claude && window.claude.use && typeof auSyncFail === 'function') auSyncFail('Shared workspace could not be opened; working from the local copy'); try { setTimeout(() => { if (typeof gpAutoScan === 'function') gpAutoScan(); if (typeof auBriefRecord === 'function') auBriefRecord(); if (typeof rbRunSchedules === 'function') rbRunSchedules(); }, 1500); } catch (e) { } });
})();

/* global search: jump to a screen by name */
document.addEventListener('change', e => {
  if (!e.target || e.target.id !== 'gsearch') return; const q = e.target.value.trim().toLowerCase(); if (!q) return;
  const all = NAV.flatMap(([, items]) => items.filter(([k]) => pageOk(k))), hit = all.find(([, l]) => l.toLowerCase() === q) || all.find(([, l]) => l.toLowerCase().startsWith(q)) || all.find(([, l]) => l.toLowerCase().includes(q));
  if (hit && q.length < 3) { go(hit[0]); e.target.value = ''; e.target.blur(); document.body.classList.remove('navopen'); return; }
  const recs = typeof tkSearchRecords === 'function' ? tkSearchRecords(q) : [];
  if (hit && !recs.length) { go(hit[0]); e.target.value = ''; e.target.blur(); document.body.classList.remove('navopen'); return; }
  if (recs.length) { if (hit) recs.unshift({ kind: 'Screen', label: hit[1], sub: '', page: hit[0], ui: {} }); tkSearchModal(e.target.value.trim(), recs); e.target.value = ''; e.target.blur(); document.body.classList.remove('navopen'); } else toast('No screen or record matches "' + e.target.value + '".', 'bad');
});
