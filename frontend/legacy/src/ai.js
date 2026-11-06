/* ===== AI Assistant: role-scoped data tools, question router, Claude connection, query log =====
   Security model
   - The AI never queries data itself. It can only call the tools below. Every tool runs inside the page as the signed-in user:
     the branch scope comes from scopeOf(App.user) (never from the question or the model), and the user's own module permission
     (can(module,'View')) must allow the underlying dashboard. A tool that is not permitted returns an error, not data.
   - Tools return aggregated figures (branch / zone / region level). No student names, parent contacts, bank or payslip details.
   - Every question, the tools run, the data accessed and every report generated are written to the append-only AI query log. */
const AI_MOD = 'ai_chat';
const AI_ROWS = 150;
const AI_T = {};
const AI_DOMAINS = { fees: 'Fee collection & outstanding', admissions: 'Admissions, enquiries & strength', finance: 'Budgets, expenses & P&L', payroll: 'Payroll', hr: 'HR, attendance & recruitment', purchase: 'Purchase & inventory', assets: 'Assets & maintenance', cash: 'Petty cash', utilities: 'Utilities & rent', summary: 'Management summaries', legal: 'Legal & compliance', bank: 'Bank reconciliation', admin: 'Users & system administration', academic: 'Academic assistant (lessons, worksheets, outcomes)' };
const aiDefaultCfg = () => ({ provider: 'builtin', engineV2: false, domains: Object.fromEntries(Object.keys(AI_DOMAINS).map(k => [k, true])), tools: {}, hiddenFields: '', sensitive: { studentLevel: true, staffLevel: true }, engines: {}, tiers: { chat: 'default', summary: 'complex' }, blockedUsers: [], templates: null, share: true, needApproval: true, approveSummaries: true, maxRows: 100, channels: { email: true, whatsapp: true }, chatgpt: { gatewayUrl: '', model: '', enc: null } });
const aiCfg = () => { const d = Store.get('ai'), D0 = aiDefaultCfg(); let c = (d && d.cfg) || {}; if (!c.engineV2) c = Object.assign({}, c, { provider: 'builtin' });
  return Object.assign(D0, c, { domains: Object.assign(D0.domains, c.domains || {}), sensitive: Object.assign(D0.sensitive, c.sensitive || {}), tiers: Object.assign(D0.tiers, c.tiers || {}), channels: Object.assign(D0.channels, c.channels || {}), chatgpt: Object.assign(D0.chatgpt, c.chatgpt || {}), tools: c.tools || {}, engines: c.engines || {}, blockedUsers: c.blockedUsers || [] }); };
const aiAllowed = () => !!App.user && can(AI_MOD, 'View') && !aiCfg().blockedUsers.includes(App.user.id);
const aiSaveCfg = async patch => { const d = Store.get('ai') || {}; await Store.put('ai', Object.assign({}, d, { cfg: Object.assign({}, d.cfg || {}, patch) })); };
const aiFilterProps = { branch: { type: 'string', description: 'Limit to one branch by name or part of its name (e.g. "Malakpet"). Matched only inside the caller\'s own scope.' }, zone: { type: 'string', description: 'Limit to one zone' }, region: { type: 'string', description: 'Limit to one region' }, all_matches: { type: 'boolean', description: 'When a branch name matches several branches, include all of them instead of asking' } };
function aiTool(name, o) { const t = Object.assign({ name, schema: { type: 'object', properties: {} } }, o); t.schema = Object.assign({ type: 'object' }, t.schema, { properties: Object.assign({}, t.schema.properties || {}, o.noFilter ? {} : aiFilterProps) }); AI_T[name] = t; }

/* ---------- context: the caller's own scope, never taken from the question ---------- */
function aiCtx() {
  const sc = scopeOf(App.user), live = DATA.branches.filter(b => !b.closed);
  const idx = [...sc].filter(i => DATA.branches[i] && !DATA.branches[i].closed).sort((a, b) => a - b);
  return { idx, ids: new Set(idx.map(i => DATA.branches[i].id)), all: idx.length >= live.length, n: idx.length, D: D_() };
}
const aiScopeLabel = c => c.all ? `Group consolidated · ${c.n} branches` : `${c.n} branch${c.n === 1 ? '' : 'es'} in your assigned scope`;
const aiBr = i => DATA.branches[i];
const aiLim = (a, d = 10) => Math.max(1, Math.min(100, Math.round(+a.limit || d)));
const aiPct = (a, b) => b > 0 ? a / b * 100 : 0;
const aiSum = (arr, f) => arr.reduce((s, x) => s + (+f(x) || 0), 0);
const aiYm = ym => { const [y, m] = ym.split('-'); return MON[+m - 1] + ' ' + y; };
const aiHead = (kind, b) => { try { const d = headOf(kind, b); return d && d.name ? d.name : 'Unassigned'; } catch (e) { return 'Unassigned'; } };
function aiGroupOf(b, level) { return level === 'region' ? b.region : level === 'zone' ? b.zone : level === 'type' ? b.type : level === 'rd' ? aiHead('rd', b) : level === 'zd' ? aiHead('zd', b) : b.name; }
const AI_LEVELS = ['branch', 'zone', 'region', 'rd', 'zd', 'type'];
const aiLevelName = l => ({ branch: 'Branch', zone: 'Zone', region: 'Region', rd: 'Regional director', zd: 'Zonal director', type: 'Branch type' })[l] || 'Branch';
const aiGroupSchema = { type: 'string', enum: AI_LEVELS, description: 'Group the result by branch, zone, region, regional director (rd), zonal director (zd) or branch type' };

/* ---------- narrowing a question to a branch / zone / region: only ever inside the caller's own scope ---------- */
const aiNorm = x => String(x || '').toLowerCase().replace(/^ms\s+/, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
function aiMatchBranches(text, idx) {
  const q = aiNorm(text); if (!q) return [];
  const all = idx.map(i => ({ i, n: aiNorm(DATA.branches[i].name), id: DATA.branches[i].id.toLowerCase() })), ex = all.filter(x => x.n === q || x.id === q || ('ms ' + x.n) === q);
  if (ex.length) return ex.map(x => x.i);
  const w = q.split(' ').filter(x => x.length > 1); return all.filter(x => w.length && w.every(t => x.n.includes(t))).map(x => x.i);
}
function aiNarrow(a, c) {
  let idx = c.idx; const lab = [];
  const place = (key, v) => { const q = aiNorm(v), m = idx.filter(i => { const z = aiNorm(aiBr(i)[key]); return z === q || z.includes(q) || (q.includes(z) && z.length > 3); }); return m; };
  if (a.region) { const m = place('region', a.region); if (!m.length) return { error: `No region matching "${a.region}" is in your assigned scope.` }; idx = m; lab.push(aiBr(m[0]).region + ' region'); }
  if (a.zone) { const m = place('zone', a.zone); if (!m.length) return { error: `No zone matching "${a.zone}" is in your assigned scope.` }; idx = m; lab.push(aiBr(m[0]).zone + ' zone'); }
  if (a.branch) {
    const m = aiMatchBranches(a.branch, idx); if (!m.length) return { error: `No branch matching "${a.branch}" is in your assigned scope.` };
    if (m.length > 1 && !a.all_matches) return { clarify: { question: `"${a.branch}" matches ${m.length} branches in your scope. Which one do you mean?`, options: m.slice(0, 8).map(i => ({ label: aiBr(i).name, branch: aiBr(i).name })).concat([{ label: `All ${m.length} branches matching "${a.branch}"`, branch: a.branch, all: true }]) } };
    idx = m; lab.push(m.length === 1 ? aiBr(m[0]).name : `${m.length} branches matching "${a.branch}"`);
  }
  if (!lab.length) return { c };
  return { c: Object.assign({}, c, { idx, ids: new Set(idx.map(i => aiBr(i).id)), n: idx.length, all: false, narrow: lab.join(' · ') }) };
}
function aiSyncWarn(c) {
  try { const s = Store.get('sync'), w = [], last = s.runs && s.runs[0]; if (last && last.status && last.status !== 'Success') w.push(`The latest ERP sync run (${tsLabel(last.at)}) did not succeed (${last.status}); figures may be behind the ERP.`); const ls = s.lastSuccess ? new Date(s.lastSuccess).getTime() : 0; if (!ls) w.push('No successful ERP sync is recorded, so these figures cannot be confirmed as current.'); else if (Date.now() - ls > 48 * 3600e3) w.push(`The last successful ERP sync was ${tsLabel(s.lastSuccess)}, more than 2 days ago; figures may be out of date.`); const dd = E.ds(c.D); if (dd < E.ds(D_()) ) w.push(`You are viewing an earlier date (${dLabel(c.D)}).`); return w; } catch (e) { return []; }
}
const aiSyncLabel = () => { try { return tsLabel(Store.get('sync').lastSuccess); } catch (e) { return '—'; } };

/* ---------- tool runner: permission, scope, switches, hidden fields, row cap, trace ---------- */
function aiRun(name, args, trace) {
  const t = AI_T[name]; if (!t) return { error: 'Unknown data tool: ' + name };
  const note = o => { if (trace) trace.push(o); }, cfg = aiCfg();
  if (!aiAllowed()) { note({ tool: name, blocked: true }); return { error: 'Your account does not have access to the AI Assistant.', blocked: true }; }
  if (cfg.domains[t.domain] === false) { note({ tool: name, blocked: true }); return { error: `The ${AI_DOMAINS[t.domain]} data source is switched off for the AI Assistant by the System Admin.`, blocked: true }; }
  if (cfg.tools[name] === false) { note({ tool: name, blocked: true }); return { error: `The "${t.title || name}" report is switched off for the AI Assistant by the System Admin.`, blocked: true }; }
  if (t.sens && cfg.sensitive[t.sens] === false) { note({ tool: name, blocked: true }); return { error: 'Student-level and staff-level lists are switched off for the AI Assistant by the System Admin.', blocked: true }; }
  if (!can(t.mod, 'View') && !(t.alt || []).some(m => can(m, 'View'))) { note({ tool: name, blocked: true, module: MODLABEL(t.mod) }); return { error: `Not permitted: your role (${App.user.role}) does not include access to ${MODLABEL(t.mod)}, so this data cannot be shown to you.`, blocked: true }; }
  if (t.needs && t.needs.some(m => !can(m, 'View'))) { note({ tool: name, blocked: true, module: MODLABEL(t.mod) }); return { error: `Not permitted: this answer also needs ${t.needs.map(MODLABEL).join(', ')}, which your role does not include.`, blocked: true }; }
  let c = aiCtx(); if (!c.n) { note({ tool: name, blocked: true }); return { error: 'There are no branches in your assigned data scope.', blocked: true }; }
  const nr = aiNarrow(args || {}, c); if (nr.error) { note({ tool: name, error: nr.error }); return { error: nr.error }; } if (nr.clarify) { note({ tool: name, clarify: true }); return { clarify: nr.clarify, tool: name }; } c = nr.c;
  try {
    const r = t.run(args || {}, c); if (!r) return { error: 'No data.' }; if (r.error || r.clarify) { note({ tool: name, blocked: !!r.blocked, error: r.error, clarify: !!r.clarify }); return r; }
    r.tool = name; r.module = MODLABEL(t.mod); r.domain = t.domain; r.scope = aiScopeLabel(c) + (c.narrow ? ' · limited to ' + c.narrow : ''); r.asOn = dLabel(c.D); r.period = r.period || ('as on ' + dLabel(c.D)); r.sync = aiSyncLabel(); r.sourceMod = t.mod; r.drill = t.drill || null; r.narrowed = c.narrow || ''; r.calc = r.calc || t.calc || ''; r.generated = tsLabel(new Date().toISOString()); r.ay = CUR_AY; r.warnings = (r.warnings || []).concat(aiSyncWarn(c));
    const hid = String(cfg.hiddenFields || '').toLowerCase().split(/[,;\n]+/).map(x => x.trim()).filter(Boolean);
    if (hid.length && r.cols) { const keep = r.cols.map((col, i) => !hid.some(h => col.h.toLowerCase() === h)); if (keep.some(k => !k)) { r.cols = r.cols.filter((_, i) => keep[i]); r.rows = r.rows.map(row => row.filter((_, i) => keep[i])); if (r.chart) r.chart = null; r.hidden = true; } }
    const cap = Math.min(AI_ROWS, cfg.maxRows || AI_ROWS); if (r.rows && r.rows.length > cap) { r.total = r.rows.length; r.rows = r.rows.slice(0, cap); }
    note({ tool: name, args: args || {}, rows: (r.rows || []).length, module: r.module, scope: r.scope, sens: !!t.sens });
    return r;
  } catch (e) { note({ tool: name, error: e.message }); return { error: 'Could not compute this: ' + e.message }; }
}
/* what the model sees: figures only, compact */
function aiForModel(r) {
  if (r.error) return { error: r.error };
  if (r.clarify) return { needs_clarification: true, question: r.clarify.question, options: r.clarify.options.map(o => o.label) };
  if (r.noModelRows) return { title: r.title, scope: r.scope, as_on: r.asOn, headline: r.headline, kpis: r.kpis, note: 'Individual rows are shown to the user in the application only and are not shared with the model.' };
  return { title: r.title, scope: r.scope, as_on: r.asOn, headline: r.headline, kpis: r.kpis, columns: (r.cols || []).map(c => c.h), rows: (r.rows || []).slice(0, 40), rows_total: r.total || (r.rows || []).length, notes: r.bullets };
}

/* ===================== Tier 1 tools: fees, admissions, strength, comparisons ===================== */
aiTool('collection_vs_target', {
  domain: 'fees', mod: 'revenue',
  desc: 'Fee collection achieved against the monthly collection target, by branch, with the expected pace for today. Use for "which branches are below target", collection achievement and shortfall.',
  drill: ['target', 'Monthly collection target'], schema: { type: 'object', properties: { below_pct: { type: 'number', description: 'Only branches whose collection achievement is below this % of their monthly target (e.g. 80)' }, below_only: { type: 'boolean', description: 'Only branches behind the expected pace' }, sort: { type: 'string', enum: ['achievement', 'shortfall'] }, order: { type: 'string', enum: ['highest', 'lowest'], description: 'highest = best achievers first' }, limit: { type: 'integer' } } },
  run(a, c) {
    const R = c.idx.map(i => { const m = Calc.month(i, c.D), d = Calc.day(i, c.D); return { i, b: aiBr(i), m, today: d.net, exp: m.target * m.pace / 100 }; });
    const behind = R.filter(r => r.m.achieved < r.exp - 0.5), tT = aiSum(R, r => r.m.target), tA = aiSum(R, r => r.m.achieved), pace = R[0].m.pace;
    const bp = +a.below_pct > 0 ? +a.below_pct : 0, under = bp ? R.filter(r => r.m.achPct < bp) : []; let L = bp ? under : a.below_only ? behind : R.slice(); L.sort(a.sort === 'shortfall' ? (x, y) => (y.m.target - y.m.achieved) - (x.m.target - x.m.achieved) : (x, y) => x.m.achPct - y.m.achPct); if (a.order === 'highest' && a.sort !== 'shortfall') L.reverse();
    return {
      title: `Collection against monthly target · ${aiYm(ymOf(c.D))}`,
      kpis: { 'Monthly target': INRS(tT), 'Collected towards target': INRS(tA), 'Achievement': PCT(aiPct(tA, tT)), 'Expected by today': PCT(pace), 'Branches behind pace': `${behind.length} of ${R.length}` },
      cols: [{ h: 'Branch', t: 'text' }, { h: 'Zone', t: 'text' }, { h: 'Monthly target', t: 'inr' }, { h: 'Collected (counts to target)', t: 'inr' }, { h: 'Achievement %', t: 'pct' }, { h: 'Expected by today %', t: 'pct' }, { h: 'Shortfall to target', t: 'inr' }, { h: 'Collected today', t: 'inr' }, { h: 'Required per working day', t: 'inr' }],
      rows: L.slice(0, aiLim(a, a.below_only ? 100 : 15)).map(r => [r.b.name, r.b.zone, r.m.target, r.m.achieved, r.m.achPct, r.m.pace, Math.max(0, r.m.target - r.m.achieved), r.today, r.m.dailyReq]),
      chart: { label: 0, value: 4, title: 'Achievement % of monthly target', fmt: 'pct', refValue: 5 },
      headline: (bp ? `${under.length} of ${R.length} branches have not reached ${bp}% of their monthly collection target. ` : '') + `${behind.length} of ${R.length} branches are behind the expected pace (${PCT(pace, 0)} of the month's working days are over). Group achievement is ${PCT(aiPct(tA, tT))} of ${INRS(tT)}.`,
      bullets: behind.length ? [`Largest shortfall: ${R.slice().sort((x, y) => (y.m.target - y.m.achieved) - (x.m.target - x.m.achieved))[0].b.name}.`, 'Suggested action: ask the zonal directors of the lowest branches for a recovery plan with a daily collection requirement.'] : ['All branches are on or ahead of pace.']
    };
  }
});

aiTool('daily_collection', {
  domain: 'fees', mod: 'revenue', drill: ['daily', 'Daily collection'],
  desc: "Fees collected on the dashboard date (today): net collection, receipts, refunds, payment-mode split and month-to-date, by branch. Use for \"today's collection\", daily collection, collection on a day.",
  schema: { type: 'object', properties: { sort: { type: 'string', enum: ['highest', 'lowest'] }, limit: { type: 'integer' } } },
  run(a, c) {
    const R = c.idx.map(i => ({ b: aiBr(i), d: Calc.day(i, c.D) })), T = f => aiSum(R, r => f(r.d)), net = T(d => d.net), modeT = E.MODES.map((m, k) => [m, T(d => d.modes[k])]).filter(x => x[1] > 0).sort((x, y) => y[1] - x[1]);
    R.sort((x, y) => a.sort === 'lowest' ? x.d.net - y.d.net : y.d.net - x.d.net);
    const zero = R.filter(r => r.d.net <= 0).length;
    return {
      chart: { label: 0, value: 2, title: 'Net collected on the day', fmt: 'inr' }, period: dLabel(c.D) + ' (day)', title: `Collection on ${dLabel(c.D)}`,
      kpis: { 'Net collected today': INRS(net), 'Receipts': NUM(T(d => d.cnt)), 'Refunds': INRS(T(d => d.ref)), 'Advance received': INRS(T(d => d.adv)), 'Month to date': INRS(T(d => d.mtd)), 'Branches with no collection': `${zero} of ${R.length}` },
      cols: [{ h: 'Branch', t: 'text' }, { h: 'Zone', t: 'text' }, { h: 'Net collected today', t: 'inr' }, { h: 'Receipts', t: 'num' }, { h: 'Refunds', t: 'inr' }, { h: 'Month to date', t: 'inr' }, { h: 'Year to date', t: 'inr' }],
      rows: R.slice(0, aiLim(a, 15)).map(r => [r.b.name, r.b.zone, r.d.net, r.d.cnt, r.d.ref, r.d.mtd, r.d.ytd]),
      headline: `${INRS(net)} was collected on ${dLabel(c.D)} across ${NUM(T(d => d.cnt))} receipts${R.length && net > 0 ? '; highest: ' + R.slice(0, 3).map(r => `${r.b.name} (${INRS(r.d.net)})`).join(', ') : ''}. ${zero} of ${R.length} branches collected nothing that day.`,
      bullets: modeT.length ? ['Payment modes: ' + modeT.map(([m, v]) => `${m} ${INRS(v)}`).join(', ') + '.'] : []
    };
  }
});

aiTool('outstanding_fees', {
  domain: 'fees', mod: 'revenue',
  desc: 'Outstanding fees, overdue fees, zero payers and defaulters by branch (ranked). Use for outstanding fees, dues, zero payers, defaulter counts.',
  drill: ['zeropayer', 'Zero payer analysis'], schema: { type: 'object', properties: { level: aiGroupSchema, metric: { type: 'string', enum: ['outstanding', 'overdue', 'zero_payer_amount', 'zero_payers', 'defaulters'], description: 'What to rank by' }, order: { type: 'string', enum: ['highest', 'lowest'] }, limit: { type: 'integer' } } },
  run(a, c) {
    const lvl = AI_LEVELS.includes(a.level) && a.level !== 'branch' ? a.level : '';
    if (lvl) {
      const AGg = Calc.agg(c.D), G = {}; c.idx.forEach(i => { const g = AGg[i], k = aiGroupOf(aiBr(i), lvl), o = G[k] || (G[k] = { n: 0, st: 0, due: 0, paid: 0, os: 0, od: 0, zp: 0, zpa: 0, df: 0 }); o.n++; o.st += g.n; o.due += g.due; o.paid += g.paid; o.os += g.os; o.od += g.od; o.zp += g.zpN; o.zpa += g.zpAmt; o.df += g.defN; });
      const GR = Object.entries(G).map(([k, o]) => Object.assign({ k }, o)).sort((x, y) => y.os - x.os), tot = f => aiSum(GR, r => r[f]);
      return { title: `Outstanding fees by ${aiLevelName(lvl).toLowerCase()}`, kpis: { 'Total outstanding': INRS(tot('os')), 'Overdue': INRS(tot('od')), 'Zero payers': NUM(tot('zp')) + ' (' + INRS(tot('zpa')) + ')', 'Defaulters': NUM(tot('df')) }, chart: { label: 0, value: 5, title: 'Outstanding fees', fmt: 'inr' },
        cols: [{ h: aiLevelName(lvl), t: 'text' }, { h: 'Branches', t: 'num' }, { h: 'Students', t: 'num' }, { h: 'Fee due to date', t: 'inr' }, { h: 'Collected', t: 'inr' }, { h: 'Outstanding', t: 'inr' }, { h: 'Overdue', t: 'inr' }, { h: 'Zero payers', t: 'num' }, { h: 'Zero-payer amount', t: 'inr' }, { h: 'Defaulters', t: 'num' }],
        rows: GR.map(r => [r.k, r.n, r.st, r.due, r.paid, r.os, r.od, r.zp, r.zpa, r.df]),
        headline: `Total outstanding is ${INRS(tot('os'))} (overdue ${INRS(tot('od'))}). Highest ${aiLevelName(lvl).toLowerCase()}s: ${GR.slice(0, 3).map(r => `${r.k} (${INRS(r.os)})`).join(', ')}.`, bullets: [] };
    }
    const AG = Calc.agg(c.D), key = { outstanding: 'os', overdue: 'od', zero_payer_amount: 'zpAmt', zero_payers: 'zpN', defaulters: 'defN' }[a.metric] || 'os', lab = { os: 'outstanding fees', od: 'overdue fees', zpAmt: 'zero-payer amount', zpN: 'zero payers', defN: 'defaulters' }[key];
    const R = c.idx.map(i => AG[i]), tot = k => aiSum(R, r => r[k]);
    R.sort((x, y) => a.order === 'lowest' ? x[key] - y[key] : y[key] - x[key]);
    return {
      chart: { label: 0, value: key === 'os' ? 5 : key === 'od' ? 6 : key === 'zpAmt' ? 8 : key === 'zpN' ? 7 : 9, title: lab, fmt: key === 'zpN' || key === 'defN' ? 'num' : 'inr' }, title: `${a.order === 'lowest' ? 'Lowest' : 'Highest'} ${lab} by branch`,
      kpis: { 'Total outstanding': INRS(tot('os')), 'Overdue': INRS(tot('od')), 'Zero payers': NUM(tot('zpN')) + ' (' + INRS(tot('zpAmt')) + ')', 'Defaulters (overdue students)': NUM(tot('defN')) },
      cols: [{ h: 'Branch', t: 'text' }, { h: 'Zone', t: 'text' }, { h: 'Students', t: 'num' }, { h: 'Fee due to date', t: 'inr' }, { h: 'Collected', t: 'inr' }, { h: 'Outstanding', t: 'inr' }, { h: 'Overdue', t: 'inr' }, { h: 'Zero payers', t: 'num' }, { h: 'Zero-payer amount', t: 'inr' }, { h: 'Defaulters', t: 'num' }],
      rows: R.slice(0, aiLim(a)).map(r => [r.b.name, r.b.zone, r.n, r.due, r.paid, r.os, r.od, r.zpN, r.zpAmt, r.defN]),
      headline: `Top ${Math.min(aiLim(a), R.length)} branches by ${lab}: ${R.slice(0, 3).map(r => `${r.b.name} (${key === 'zpN' || key === 'defN' ? NUM(r[key]) : INRS(r[key])})`).join(', ')}. Group total outstanding is ${INRS(tot('os'))}, of which ${INRS(tot('od'))} is overdue.`,
      bullets: ['Suggested action: prioritise overdue recovery calls and instalment reminders at the top branches; escalate zero payers older than one term to the zonal director.']
    };
  }
});

aiTool('student_strength', {
  domain: 'admissions', mod: 'strength', drill: ['strength', 'Strength, target & capacity'],
  desc: 'Student strength against target and capacity, new admissions and exits by branch. Use for strength, seats, capacity, admissions achievement.',
  schema: { type: 'object', properties: { sort: { type: 'string', enum: ['strength', 'gap', 'new_admissions', 'utilisation'] }, order: { type: 'string', enum: ['highest', 'lowest'] }, limit: { type: 'integer' } } },
  run(a, c) {
    const R = Str.rows(c.D, 'branch', c.idx), T = Str.sum(R), key = { strength: 'netStrength', gap: 'gap', new_admissions: 'newAdm', utilisation: 'utilPct' }[a.sort] || 'netStrength';
    R.sort((x, y) => a.order === 'lowest' ? x[key] - y[key] : y[key] - x[key]);
    return {
      chart: { label: 0, value: 5, title: 'Strength achievement % of target', fmt: 'pct' }, title: 'Student strength, target and admissions',
      kpis: { 'Net strength': NUM(T.netStrength), 'Target': NUM(T.target), 'Achievement': PCT(aiPct(T.netStrength, T.target)), 'New admissions': NUM(T.newAdm), 'Cancellations + withdrawals': NUM(T.canc + T.wd), 'Capacity utilisation': PCT(aiPct(T.netStrength, T.capacity)) },
      cols: [{ h: 'Branch', t: 'text' }, { h: 'Zone', t: 'text' }, { h: 'Strength', t: 'num' }, { h: 'Target', t: 'num' }, { h: 'Gap to target', t: 'num' }, { h: 'Achievement %', t: 'pct' }, { h: 'New admissions', t: 'num' }, { h: 'Cancellations', t: 'num' }, { h: 'Withdrawals', t: 'num' }, { h: 'Capacity', t: 'num' }, { h: 'Utilisation %', t: 'pct' }],
      rows: R.slice(0, aiLim(a, 15)).map(r => [r.branch, r.zone, r.netStrength, r.target, r.gap, r.achPct, r.newAdm, r.canc, r.wd, r.capacity, r.utilPct]),
      headline: `Net strength ${NUM(T.netStrength)} against a target of ${NUM(T.target)} (${PCT(aiPct(T.netStrength, T.target))}); ${NUM(T.newAdm)} new admissions this academic year; ${NUM(T.canc + T.wd)} cancellations and withdrawals.`,
      bullets: []
    };
  }
});

aiTool('cancellations', {
  domain: 'admissions', mod: 'cancel', drill: ['cancel', 'Cancellations & withdrawals'],
  desc: 'Cancellations, withdrawals and transfers out by branch with the main reasons. Use for "highest cancellations this month".',
  schema: { type: 'object', properties: { period: { type: 'string', enum: ['month', 'year'], description: 'This month, or the whole academic year to date' }, limit: { type: 'integer' } } },
  run(a, c) {
    const F = a.period === 'year' ? AYS : monthStart(c.D), L = exitList(c.D, c.idx).filter(e => e.s.exit >= F && e.s.exit <= c.D);
    const by = {}; L.forEach(e => { const k = e.s.b, o = by[k] || (by[k] = { canc: 0, wd: 0, out: 0, loss: 0 }); o[e.kind === 'canc' ? 'canc' : e.kind === 'wd' ? 'wd' : 'out']++; o.loss += e.loss || 0; });
    const R = Object.keys(by).map(k => Object.assign({ b: aiBr(+k) }, by[k], { all: by[k].canc + by[k].wd })).sort((x, y) => y.all - x.all || y.loss - x.loss);
    const reasons = {}; L.forEach(e => { const r = e.s.exitReason || 'Other'; reasons[r] = (reasons[r] || 0) + 1; });
    const top = Object.entries(reasons).sort((x, y) => y[1] - x[1]).slice(0, 4), SR = Str.sum(Str.rows(c.D, 'branch', c.idx));
    const per = a.period === 'year' ? 'this academic year' : `this month (${aiYm(ymOf(c.D))})`;
    return {
      chart: { label: 0, value: 5, title: 'Total exits', fmt: 'num' }, title: `Cancellations and withdrawals ${per}`,
      kpis: { 'Cancellations': NUM(L.filter(e => e.kind === 'canc').length), 'Withdrawals': NUM(L.filter(e => e.kind === 'wd').length), 'Transfers out': NUM(L.filter(e => e.kind === 'out').length), 'Revenue loss': INRS(aiSum(L, e => e.loss)), 'Cancellation % (year)': PCT(SR.cancPct || 0) },
      cols: [{ h: 'Branch', t: 'text' }, { h: 'Zone', t: 'text' }, { h: 'Cancellations', t: 'num' }, { h: 'Withdrawals', t: 'num' }, { h: 'Transfers out', t: 'num' }, { h: 'Total exits', t: 'num' }, { h: 'Revenue loss', t: 'inr' }],
      rows: R.slice(0, aiLim(a)).map(r => [r.b.name, r.b.zone, r.canc, r.wd, r.out, r.all, r.loss]),
      headline: R.length ? `${NUM(L.length)} exits ${per}. Highest: ${R.slice(0, 3).map(r => `${r.b.name} (${r.all})`).join(', ')}. Main reasons: ${top.map(t => `${t[0]} (${t[1]})`).join(', ') || 'none recorded'}.` : `No cancellations or withdrawals ${per} in your scope.`,
      bullets: top.length ? [`Most common reason: ${top[0][0]}. Suggested action: have the principals of the top branches call the parents and record the outcome in the CRM.`] : []
    };
  }
});

aiTool('yoy_comparison', {
  domain: 'admissions', mod: 'compare', drill: ['compare', 'Multi-year comparison'],
  desc: 'Compare a measure between two academic years (default: this year vs the previous year), in total or by branch/zone/region. Measures: new admissions, strength, withdrawals, cancellations, fees collected, outstanding.',
  schema: { type: 'object', properties: { metric: { type: 'string', enum: ['new_admissions', 'strength', 'withdrawals', 'cancellations', 'collected', 'outstanding', 'demand'] }, year_a: { type: 'string', description: 'e.g. 2026-27' }, year_b: { type: 'string', description: 'comparison year, e.g. 2025-26' }, level: aiGroupSchema, limit: { type: 'integer' } } },
  run(a, c) {
    const yrs = yearsList().filter(y => y.status !== 'Upcoming').map(y => y.code), ya = yrs.includes(a.year_a) ? a.year_a : CUR_AY, ib = yrs.indexOf(ya);
    const yb = yrs.includes(a.year_b) ? a.year_b : yrs[Math.max(0, ib - 1)];
    if (ya === yb) return { error: 'Two different academic years are needed to compare.' };
    const m = { new_admissions: ['newAdm', 'New admissions', 'num'], strength: ['strength', 'Strength', 'num'], withdrawals: ['withdrawals', 'Withdrawals', 'num'], cancellations: ['cancellations', 'Cancellations', 'num'], collected: ['collected', 'Fees collected', 'inr'], outstanding: ['outstanding', 'Outstanding fees', 'inr'], demand: ['demand', 'Fee demand', 'inr'] }[a.metric || 'new_admissions'] || ['newAdm', 'New admissions', 'num'];
    const lvl = AI_LEVELS.includes(a.level) ? a.level : 'branch', G = {};
    c.idx.forEach(i => { const ra = yearRow(i, ya, c.D), rb = yearRow(i, yb, c.D), k = aiGroupOf(aiBr(i), lvl), o = G[k] || (G[k] = { a: 0, b: 0, n: 0 }); o.a += ra ? +ra[m[0]] || 0 : 0; o.b += rb ? +rb[m[0]] || 0 : 0; o.n++; });
    const R = Object.entries(G).map(([k, o]) => ({ k, a: o.a, b: o.b, d: o.a - o.b, p: o.b ? (o.a - o.b) / o.b * 100 : 0 })).sort((x, y) => x.d - y.d);
    const TA = aiSum(R, r => r.a), TB = aiSum(R, r => r.b), up = R.filter(r => r.d > 0).length, dn = R.filter(r => r.d < 0).length;
    const worst = R.slice(0, 3).filter(r => r.d < 0), best = R.slice().reverse().slice(0, 3).filter(r => r.d > 0);
    return {
      title: `${m[1]}: ${ya} compared with ${yb}`,
      kpis: { [ya]: m[2] === 'inr' ? INRS(TA) : NUM(TA), [yb]: m[2] === 'inr' ? INRS(TB) : NUM(TB), 'Change': (TA - TB >= 0 ? '+' : '') + (m[2] === 'inr' ? INRS(TA - TB) : NUM(TA - TB)) + ' (' + PCT(aiPct(TA - TB, TB)) + ')', 'Up / down': `${up} up · ${dn} down` },
      cols: [{ h: aiLevelName(lvl), t: 'text' }, { h: ya, t: m[2] }, { h: yb, t: m[2] }, { h: 'Change', t: m[2] }, { h: 'Change %', t: 'pct' }],
      rows: R.slice(0, aiLim(a, 100)).map(r => [r.k, r.a, r.b, r.d, r.p]),
      headline: `${m[1]} are ${m[2] === 'inr' ? INRS(TA) : NUM(TA)} in ${ya} against ${m[2] === 'inr' ? INRS(TB) : NUM(TB)} in ${yb} (${PCT(aiPct(TA - TB, TB))}). ${up} ${lvl === 'branch' ? 'branches' : 'groups'} are up and ${dn} are down.`,
      bullets: [`Note: ${ya} is the running year to ${dLabel(c.D)}, ${yb} is a closed full year, so volume measures are not like-for-like until the year ends.`].concat(worst.length ? [`Largest fall: ${worst.map(r => r.k + ' (' + (m[2] === 'inr' ? INRS(r.d) : NUM(r.d)) + ')').join(', ')}.`] : [], best.length ? [`Largest rise: ${best.map(r => r.k + ' (+' + (m[2] === 'inr' ? INRS(r.d) : NUM(r.d)) + ')').join(', ')}.`] : [])
    };
  }
});

aiTool('enquiries_conversions', {
  domain: 'admissions', mod: 'crm_home', drill: ['crm_home', 'Admissions CRM'],
  desc: 'Admissions CRM funnel: enquiries, applications, seat-reservation payments, admissions, lost leads and conversion % by branch.',
  schema: { type: 'object', properties: { sort: { type: 'string', enum: ['enquiries', 'conversion'] }, order: { type: 'string', enum: ['highest', 'lowest'] }, limit: { type: 'integer' } } },
  run(a, c) {
    const leads = (Store.get('crm').leads || []).filter(l => c.ids.has(l.ent)), by = {};
    leads.forEach(l => { const o = by[l.ent] || (by[l.ent] = { e: 0, app: 0, srf: 0, adm: 0, lost: 0, canc: 0 }); o.e++; if (['Application', 'Documents', 'SRF Pending', 'SRF Paid', 'Admitted', 'Enrolled'].includes(l.stage)) o.app++; if (['SRF Paid', 'Admitted', 'Enrolled'].includes(l.stage)) o.srf++; if (['Admitted', 'Enrolled'].includes(l.stage)) o.adm++; if (l.stage === 'Lost') o.lost++; if (l.stage === 'Cancelled') o.canc++; });
    const R = Object.entries(by).map(([id, o]) => Object.assign({ b: DATA.branches.find(b => b.id === id) }, o, { conv: aiPct(o.adm, o.e) })).filter(r => r.b);
    const key = a.sort === 'conversion' ? 'conv' : 'e'; R.sort((x, y) => a.order === 'lowest' ? x[key] - y[key] : y[key] - x[key]);
    const T = k => aiSum(R, r => r[k]);
    return {
      title: 'Admissions enquiries and conversion',
      kpis: { 'Enquiries': NUM(T('e')), 'Applications': NUM(T('app')), 'SRF paid': NUM(T('srf')), 'Admitted': NUM(T('adm')), 'Conversion': PCT(aiPct(T('adm'), T('e'))), 'Lost': NUM(T('lost')) },
      cols: [{ h: 'Branch', t: 'text' }, { h: 'Zone', t: 'text' }, { h: 'Enquiries', t: 'num' }, { h: 'Applications', t: 'num' }, { h: 'SRF paid', t: 'num' }, { h: 'Admitted', t: 'num' }, { h: 'Conversion %', t: 'pct' }, { h: 'Lost', t: 'num' }, { h: 'Cancelled', t: 'num' }],
      rows: R.slice(0, aiLim(a, 15)).map(r => [r.b.name, r.b.zone, r.e, r.app, r.srf, r.adm, r.conv, r.lost, r.canc]),
      headline: `${NUM(T('e'))} enquiries have produced ${NUM(T('adm'))} admissions (${PCT(aiPct(T('adm'), T('e')))} conversion); ${NUM(T('lost'))} leads were lost.`, bullets: []
    };
  }
});

aiTool('group_performance', {
  domain: 'fees', mod: 'exec', drill: ['exec', 'Executive dashboard'],
  desc: 'Performance summary grouped by zone, region, regional director, zonal director or branch type: strength vs target, month collection vs target, outstanding, zero payers and cancellations.',
  schema: { type: 'object', properties: { level: aiGroupSchema, sort: { type: 'string', enum: ['strength_achievement', 'collection_achievement', 'outstanding'] }, limit: { type: 'integer' } } },
  run(a, c) {
    const lvl = AI_LEVELS.includes(a.level) && a.level !== 'branch' ? a.level : 'zone', AG = Calc.agg(c.D), SR = {}; Str.rows(c.D, 'branch', c.idx).forEach(r => SR[r.bid] = r);
    const G = {}; c.idx.forEach(i => { const b = aiBr(i), k = aiGroupOf(b, lvl), o = G[k] || (G[k] = { n: 0, str: 0, tg: 0, ct: 0, ca: 0, os: 0, od: 0, zp: 0, ex: 0 }), m = Calc.month(i, c.D), s = SR[b.id] || {}; o.n++; o.str += s.netStrength || 0; o.tg += s.target || 0; o.ct += m.target; o.ca += m.achieved; o.os += AG[i].os; o.od += AG[i].od; o.zp += AG[i].zpN; o.ex += (s.canc || 0) + (s.wd || 0); });
    const R = Object.entries(G).map(([k, o]) => Object.assign({ k }, o, { sa: aiPct(o.str, o.tg), ca2: aiPct(o.ca, o.ct) }));
    R.sort(a.sort === 'outstanding' ? (x, y) => y.os - x.os : a.sort === 'strength_achievement' ? (x, y) => x.sa - y.sa : (x, y) => x.ca2 - y.ca2);
    return {
      chart: { label: 0, value: 7, title: 'Collection achievement %', fmt: 'pct' }, title: `Performance by ${aiLevelName(lvl).toLowerCase()}`,
      cols: [{ h: aiLevelName(lvl), t: 'text' }, { h: 'Branches', t: 'num' }, { h: 'Strength', t: 'num' }, { h: 'Target', t: 'num' }, { h: 'Strength achievement %', t: 'pct' }, { h: 'Month target', t: 'inr' }, { h: 'Collected', t: 'inr' }, { h: 'Collection achievement %', t: 'pct' }, { h: 'Outstanding', t: 'inr' }, { h: 'Overdue', t: 'inr' }, { h: 'Zero payers', t: 'num' }, { h: 'Cancellations + withdrawals', t: 'num' }],
      rows: R.slice(0, aiLim(a, 50)).map(r => [r.k, r.n, r.str, r.tg, r.sa, r.ct, r.ca, r.ca2, r.os, r.od, r.zp, r.ex]),
      headline: R.length ? `Lowest collection achievement: ${R.slice().sort((x, y) => x.ca2 - y.ca2).slice(0, 3).map(r => `${r.k} (${PCT(r.ca2)})`).join(', ')}. Highest outstanding: ${R.slice().sort((x, y) => y.os - x.os).slice(0, 3).map(r => `${r.k} (${INRS(r.os)})`).join(', ')}.` : 'No data in scope.', bullets: []
    };
  }
});

/* branches that need attention: scored from collection pace, outstanding, zero payers, cancellations and strength */
function aiAttention(c) {
  const AG = Calc.agg(c.D), SR = {}; Str.rows(c.D, 'branch', c.idx).forEach(r => SR[r.bid] = r);
  const cfg = Store.get('config'), cancLim = (cfg.strength && cfg.strength.cancelRatePct) || 3;
  const osR = c.idx.map(i => aiPct(AG[i].os, AG[i].due)).sort((x, y) => x - y), osMed = osR[Math.floor(osR.length / 2)] || 0;
  return c.idx.map(i => {
    const b = aiBr(i), m = Calc.month(i, c.D), g = AG[i], s = SR[b.id] || {}, why = []; let sc = 0;
    if (m.achPct < m.pace * 0.7) { sc += 3; why.push(`collection ${PCT(m.achPct, 0)} of target vs ${PCT(m.pace, 0)} expected`); } else if (m.achPct < m.pace) { sc += 1; why.push(`collection ${PCT(m.achPct, 0)} behind pace ${PCT(m.pace, 0)}`); }
    const osP = aiPct(g.os, g.due); if (osP > osMed * 1.4 && osP > 15) { sc += 2; why.push(`outstanding ${PCT(osP, 0)} of fees due (group median ${PCT(osMed, 0)})`); }
    if (g.n && g.zpN / g.n > 0.03) { sc += 2; why.push(`${g.zpN} zero payers (${PCT(g.zpN / g.n * 100)})`); }
    if ((s.cancPct || 0) > cancLim) { sc += 2; why.push(`cancellation rate ${PCT(s.cancPct)} (limit ${cancLim}%)`); }
    if (s.target && s.achPct < 85) { sc += 2; why.push(`strength ${PCT(s.achPct, 0)} of target`); } else if (s.target && s.achPct < 95) { sc += 1; why.push(`strength ${PCT(s.achPct, 0)} of target`); }
    return { b, sc, why, m, g, s };
  }).filter(r => r.sc > 0).sort((x, y) => y.sc - x.sc);
}
aiTool('attention_branches', {
  domain: 'summary', mod: 'exec', drill: ['alerts', 'Alerts & escalations'],
  desc: 'Branches that need immediate management attention, scored from collection pace, outstanding fees, zero payers, cancellations and strength shortfall, with the reasons.',
  schema: { type: 'object', properties: { limit: { type: 'integer' } } },
  run(a, c) {
    const R = aiAttention(c);
    return {
      title: 'Branches requiring management attention',
      cols: [{ h: 'Branch', t: 'text' }, { h: 'Zone', t: 'text' }, { h: 'Risk score', t: 'num' }, { h: 'Why', t: 'text' }, { h: 'Collection achievement %', t: 'pct' }, { h: 'Outstanding', t: 'inr' }, { h: 'Zero payers', t: 'num' }],
      rows: R.slice(0, aiLim(a)).map(r => [r.b.name, r.b.zone, r.sc, r.why.join('; '), r.m.achPct, r.g.os, r.g.zpN]),
      headline: R.length ? `${R.length} of ${c.n} branches show at least one warning. Highest risk: ${R.slice(0, 3).map(r => `${r.b.name} (score ${r.sc})`).join(', ')}.` : 'No branch shows a warning.',
      bullets: R.length ? ['Risk score adds points for collection behind pace (1-3), high outstanding share (2), zero payers above 3% of students (2), cancellation rate above the limit (2) and strength below 95% of target (1-2).', 'Suggested action: review the top five with their zonal directors this week; ask for a recovery and retention plan.'] : []
    };
  }
});

aiTool('management_summary', {
  domain: 'summary', mod: 'exec', drill: ['exec', 'Executive dashboard'],
  desc: 'One-page management summary for today: strength, admissions, collection, outstanding, zero payers, cancellations and the branches needing attention.',
  run(a, c) {
    const AG = Calc.agg(c.D), SR = Str.rows(c.D, 'branch', c.idx), T = Str.sum(SR), M = c.idx.map(i => Calc.month(i, c.D)), tgt = aiSum(M, m => m.target), ach = aiSum(M, m => m.achieved), pace = M[0].pace;
    const today = aiSum(c.idx, i => Calc.day(i, c.D).net), os = aiSum(c.idx, i => AG[i].os), od = aiSum(c.idx, i => AG[i].od), zpN = aiSum(c.idx, i => AG[i].zpN), zpA = aiSum(c.idx, i => AG[i].zpAmt);
    const R = aiAttention(c), behind = M.filter(m => m.achieved < m.target * m.pace / 100 - 0.5).length;
    return {
      title: `Management summary · ${dLabel(c.D)}`,
      kpis: { 'Net strength': `${NUM(T.netStrength)} (${PCT(aiPct(T.netStrength, T.target))} of target ${NUM(T.target)})`, 'New admissions': NUM(T.newAdm), 'Collected today': INRS(today), 'Month collection': `${INRS(ach)} of ${INRS(tgt)} (${PCT(aiPct(ach, tgt))}; expected ${PCT(pace, 0)})`, 'Outstanding': `${INRS(os)} (overdue ${INRS(od)})`, 'Zero payers': `${NUM(zpN)} · ${INRS(zpA)}`, 'Cancellations + withdrawals': NUM(T.canc + T.wd), 'Branches behind pace': `${behind} of ${c.n}` },
      cols: [{ h: 'Branch needing attention', t: 'text' }, { h: 'Zone', t: 'text' }, { h: 'Risk score', t: 'num' }, { h: 'Why', t: 'text' }],
      rows: R.slice(0, 8).map(r => [r.b.name, r.b.zone, r.sc, r.why.join('; ')]),
      headline: `Strength is ${PCT(aiPct(T.netStrength, T.target))} of target. Month collection is ${PCT(aiPct(ach, tgt))} of target against ${PCT(pace, 0)} expected; ${behind} of ${c.n} branches are behind pace. ${INRS(os)} is outstanding.`,
      bullets: R.length ? [`Immediate attention: ${R.slice(0, 5).map(r => r.b.name).join(', ')}.`, 'Suggested actions: recovery plans from the behind-pace branches, retention calls on the cancellations, and a zero-payer follow-up list for the zonal directors.'] : []
    };
  }
});
