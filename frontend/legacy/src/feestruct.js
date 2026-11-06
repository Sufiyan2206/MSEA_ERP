/* ===== Fee structure master: per branch, class and fee head for an academic year; versioned, approved by a second person; category rates and concession rules ===== */
const FS_ACT = {};
Store.init({ fst: { v: [], seq: 0, log: [] } });
const fsD = () => Store.get('fst');
const fsCan = k => can('fst', k);
const fsSave = d => Store.put('fst', d);
const fsAud = (a, o) => audit('Fee structure', a, o || {});
const fsId = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const FS_HEADS = ['Tuition fee', 'Admission fee', 'Registration fee', 'Transport fee', 'Hostel fee', 'Books', 'Uniform', 'Activities fee', 'Examination fee', 'Lab fee', 'Smart class fee', 'Other'];
const FS_CATS = ['Little Hearts', 'Heavenly Hearts', 'Sponsored', 'One-time payment'];
const FS_CAT_DEF = { 'Little Hearts': { kind: 'pct', val: 100, note: 'Fully free; sponsored by the trust' }, 'Heavenly Hearts': { kind: 'pct', val: 50, note: 'Half fee' }, 'Sponsored': { kind: 'pct', val: 100, note: 'Paid by the sponsor, not the family' }, 'One-time payment': { kind: 'pct', val: 5, note: 'Discount for paying the full year at once' } };
function fsLog(d, bid, action, o, reason) { const u = App.user || {}; d.log.unshift({ id: fsId('FL'), at: nowIso(), bid: bid || '', branch: (acBr(bid) || {}).name || '', user: u.name || '—', role: u.role || '', action, old: o && o.old != null ? String(o.old) : '', new: o && o.new != null ? String(o.new) : '', reason: reason || '' }); if (d.log.length > 3000) d.log.length = 3000; }
const fsClasses = bid => { const set = new Set(acSections(bid).map(s => s.cls)); return [...set].sort((a, b) => AC_CLASS_ORDER.indexOf(a) - AC_CLASS_ORDER.indexOf(b)); };
const fsVers = (bid, ay) => fsD().v.filter(x => x.bid === bid && x.ay === ay).sort((a, b) => b.n - a.n);
const fsLive = (bid, ay) => fsVers(bid, ay).find(x => x.st === 'Approved') || null;
const fsDraft = (bid, ay) => fsVers(bid, ay).find(x => ['Draft', 'Submitted'].includes(x.st)) || null;
const fsTotal = (ver, cls) => FS_HEADS.reduce((a, h) => a + (((ver.rates[cls] || {})[h]) || 0), 0);
const fsCatAmt = (ver, cls, cat) => { const t = fsTotal(ver, cls), c = ver.cats[cat]; if (!c) return t; return c.kind === 'pct' ? Math.round(t * (1 - c.val / 100)) : Math.max(0, t - c.val); };
const fsSel = () => App.ui.fsAy || CUR_AY;
const fsYears = () => { const ys = yearCodes(); const n = nextYearCode(); return ys.includes(n) ? ys : ys.concat(n); };
PAGES.feestruct = { title: 'Fee structure', mod: 'fst', sf: true, render() {
  const { bid, list } = acBidSel(); if (!list.length) return empty('No branches in your scope for these filters.');
  const ay = fsSel(), tab = pcTab('fs', 'cur'), live = fsLive(bid, ay), draft = fsDraft(bid, ay), V = fsVers(bid, ay), cls = fsClasses(bid), mine = App.user.name;
  const tabs = pcTabs('fs', [['cur', 'Current structure'], ['dr', 'Draft / approval', draft ? 1 : ''], ['cat', 'Category rates'], ['cards', 'Fee cards'], ['hist', 'Versions', V.length], ...(fsCan('View audit logs') ? [['log', 'Audit trail']] : [])], 'cur');
  const sel = `<div class="ctrls"><label class="fld"><span>Branch</span><select data-act="uiSel" data-k="acBid">${list.map(b => `<option value="${esc(b.id)}" ${b.id === bid ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select></label><label class="fld"><span>Academic year</span><select data-act="uiSel" data-k="fsAy">${fsYears().map(y => `<option ${y === ay ? 'selected' : ''}>${y}</option>`).join('')}</select></label></div>`;
  const grid = (ver, edit) => `<div class="tbl-wrap"><table class="tbl compact"><thead><tr><th>Class</th>${FS_HEADS.map(h => `<th class="n">${esc(h)}</th>`).join('')}<th class="n">Annual total</th></tr></thead><tbody>${cls.map(c => `<tr><td><b>${esc(c)}</b></td>${FS_HEADS.map(h => `<td class="n">${edit ? `<input class="fsin" data-cls="${esc(c)}" data-h="${esc(h)}" type="number" min="0" step="100" value="${((ver.rates[c] || {})[h]) || ''}" style="width:88px;text-align:right">` : INR(((ver.rates[c] || {})[h]) || 0)}</td>`).join('')}<td class="n"><b>${INR(fsTotal(ver, c))}</b></td></tr>`).join('')}</tbody></table></div>`;
  let body = '';
  if (tab === 'cur') {
    body = sel + (live ? `<p class="small muted">Version ${live.n} · approved by ${esc(live.apBy)} on ${tsLabel(live.apAt)} · effective ${esc(live.from)}</p>` + grid(live, false) : empty(`No approved fee structure for ${esc(ay)} in this branch.` + (draft ? ' A draft is waiting under Draft / approval.' : fsCan('Add') ? ' Start one under Draft / approval.' : '')));
  } else if (tab === 'dr') {
    if (!draft) body = sel + (fsCan('Add') ? `<button class="btn pri" data-act="fsNew">${live ? 'Start a revision from version ' + live.n : 'Start the first structure'}</button>` : empty('No draft. A user with Add rights starts one.'));
    else {
      const canEdit = draft.st === 'Draft' && fsCan('Add'), btns = [];
      if (canEdit) btns.push(`<button class="btn pri" data-act="fsSaveDraft" data-k="${draft.id}">Save amounts</button><button class="btn" data-act="fsSubmit" data-k="${draft.id}">Submit for approval</button><button class="btn" data-act="fsDiscard" data-k="${draft.id}">Discard draft</button>`);
      if (draft.st === 'Submitted' && fsCan('Approve') && draft.by !== mine && draft.subBy !== mine) btns.push(`<button class="btn pri" data-act="fsApprove" data-k="${draft.id}">Approve</button><button class="btn danger" data-act="fsReject" data-k="${draft.id}">Send back</button>`);
      if (draft.st === 'Submitted' && draft.by === mine && !fsCan('Approve')) btns.push('<span class="small muted">Waiting for approval by another user.</span>');
      body = sel + `<p class="small">Version ${draft.n} · <b>${esc(draft.st)}</b> · started by ${esc(draft.by)}${draft.note ? ' · sent back: ' + esc(draft.note) : ''}</p>` + (canEdit ? `<div class="form-grid"><label class="fld"><span>Effective from</span><input id="fs_from" type="date" value="${esc(draft.from)}"></label><label class="fld"><span>Change note</span><input id="fs_note" value="${esc(draft.why || '')}" placeholder="Why this structure or revision"></label></div>` : `<p class="small">Effective from ${esc(draft.from)} · ${esc(draft.why || '')}</p>`) + grid(draft, canEdit) + `<div class="btns">${btns.join(' ')}</div>` + (live ? `<details><summary class="small">Compare with approved version ${live.n}</summary>${table('fs_cmp', [{ h: 'Class', t: 'text', k: c => c }, { h: 'Approved total', t: 'inr', k: c => fsTotal(live, c) }, { h: 'Draft total', t: 'inr', k: c => fsTotal(draft, c) }, { h: 'Change', t: 'inr', k: c => fsTotal(draft, c) - fsTotal(live, c) }], cls, { noexp: true })}</details>` : '');
    }
  } else if (tab === 'cat') {
    const ver = draft && draft.st === 'Draft' && fsCan('Add') ? draft : live, edit = ver === draft;
    body = sel + (!ver ? empty('Category rates belong to a structure; start a draft first.') : `<p class="small muted">${edit ? 'Editing the draft' : 'Approved version ' + ver.n}. A category rate replaces the class fee for learners tagged with that category under Refunds & concessions → Learner categories.</p>` +
      `<div class="tbl-wrap"><table class="tbl compact"><thead><tr><th>Category</th><th>Given as</th><th class="n">Value</th><th>Note</th>${cls.slice(0, 4).map(c => `<th class="n">${esc(c)} payable</th>`).join('')}</tr></thead><tbody>${FS_CATS.map(k => { const c = ver.cats[k] || FS_CAT_DEF[k]; return `<tr><td><b>${esc(k)}</b></td><td>${edit ? `<select class="fscat" data-cat="${esc(k)}" data-f="kind"><option value="pct" ${c.kind === 'pct' ? 'selected' : ''}>Percent off</option><option value="amt" ${c.kind === 'amt' ? 'selected' : ''}>Rupees off</option></select>` : (c.kind === 'pct' ? 'Percent off' : 'Rupees off')}</td><td class="n">${edit ? `<input class="fscat" data-cat="${esc(k)}" data-f="val" type="number" min="0" value="${c.val}" style="width:80px;text-align:right">` : (c.kind === 'pct' ? c.val + '%' : INR(c.val))}</td><td>${edit ? `<input class="fscat" data-cat="${esc(k)}" data-f="note" value="${esc(c.note || '')}">` : esc(c.note || '')}</td>${cls.slice(0, 4).map(cl => `<td class="n">${INR(fsCatAmt(ver, cl, k))}</td>`).join('')}</tr>`; }).join('')}</tbody></table></div>` + (edit ? `<div class="btns"><button class="btn pri" data-act="fsSaveDraft" data-k="${ver.id}">Save</button></div>` : ''));
  } else if (tab === 'cards') {
    body = sel + fsCardsTab(bid, ay);
  } else if (tab === 'hist') {
    body = sel + table('fs_hist', [{ h: 'Version', t: 'num', k: x => x.n }, { h: 'Status', t: 'text', k: x => x.st }, { h: 'Effective', t: 'text', k: x => x.from }, { h: 'Started by', t: 'text', k: x => x.by }, { h: 'Approved by', t: 'text', k: x => x.apBy || '' }, { h: 'Note', t: 'text', k: x => x.why || '' }], V, { empty: 'No versions yet.', noexp: true });
  } else if (tab === 'log') {
    body = table('fs_log', [{ h: 'When', t: 'text', k: l => tsLabel(l.at) }, { h: 'User', t: 'text', k: l => l.user }, { h: 'Action', t: 'text', k: l => l.action }, { h: 'Detail', t: 'text', k: l => l.new }, { h: 'Reason', t: 'text', k: l => l.reason }], fsD().log.filter(l => l.bid === bid), { empty: 'Nothing recorded yet.' });
  }
  return card('Fee structure', tabs + body, { sub: 'The structure is a master for planning and checking. ERP fee figures on other screens are not changed by it.' });
} };
const fsFind = t => fsD().v.find(x => x.id === t.dataset.k);
FS_ACT.fsNew = async () => {
  if (!fsCan('Add')) return; const { bid } = acBidSel(), ay = fsSel(); if (fsDraft(bid, ay)) return toast('A draft already exists.', 'bad');
  const live = fsLive(bid, ay), d = Store.clone(fsD()); d.seq++; const n = fsVers(bid, ay).length + 1;
  const ver = { id: fsId('FS'), bid, ay, n, st: 'Draft', from: ay.slice(0, 4) + '-04-01', rates: live ? Store.clone(live.rates) : {}, cats: live ? Store.clone(live.cats) : Store.clone(FS_CAT_DEF), why: '', by: App.user.name, byId: App.user.id, at: nowIso() };
  d.v.push(ver); fsLog(d, bid, 'Draft started', { new: `${ay} v${n}` }); await fsSave(d); App.ui.pc_fs = 'dr'; toast('Draft started.'); rerender();
};
function fsReadGrid() { const rates = {}; document.querySelectorAll('.fsin').forEach(i => { const c = i.dataset.cls, h = i.dataset.h, x = Math.round(+i.value || 0); if (x < 0) return; (rates[c] = rates[c] || {})[h] = x; }); return rates; }
function fsReadCats(cur) { const cats = Store.clone(cur); document.querySelectorAll('.fscat').forEach(i => { const k = i.dataset.cat, f = i.dataset.f; cats[k] = cats[k] || Store.clone(FS_CAT_DEF[k]); cats[k][f] = f === 'val' ? Math.max(0, +i.value || 0) : i.value; }); return cats; }
FS_ACT.fsSaveDraft = async t => {
  const x = fsFind(t); if (!x || x.st !== 'Draft' || !fsCan('Add')) return; const d = Store.clone(fsD()), y = d.v.find(z => z.id === x.id);
  if (document.querySelector('.fsin')) y.rates = fsReadGrid(); if (document.querySelector('.fscat')) y.cats = fsReadCats(y.cats);
  for (const k of FS_CATS) { const c = y.cats[k]; if (c && c.kind === 'pct' && c.val > 100) return toast(`${k}: a percentage cannot exceed 100.`, 'bad'); }
  const f = document.getElementById('fs_from'); if (f) y.from = f.value || y.from; const w = document.getElementById('fs_note'); if (w) y.why = w.value.trim();
  fsLog(d, x.bid, 'Draft saved', { new: `${x.ay} v${x.n}` }); await fsSave(d); toast('Saved.'); rerender();
};
FS_ACT.fsSubmit = t => {
  const x = fsFind(t); if (!x || x.st !== 'Draft' || !fsCan('Add')) return;
  const rates = document.querySelector('.fsin') ? fsReadGrid() : x.rates, cls = fsClasses(x.bid), missing = cls.filter(c => !FS_HEADS.some(h => ((rates[c] || {})[h]) > 0));
  if (missing.length) return toast(`Enter at least one amount for ${missing[0]}.`, 'bad'); const why = (document.getElementById('fs_note') || {}).value || x.why; if (!why || why.trim().length < 10) return toast('Give a change note (at least 10 characters).', 'bad');
  askReason('Submit fee structure for approval', 'Confirm the note for the record (at least 10 characters).', async r => { if (r.length < 10) return toast('Give a note (at least 10 characters).', 'bad'); const d = Store.clone(fsD()), y = d.v.find(z => z.id === x.id); if (!y || y.st !== 'Draft') return toast('Already submitted.', 'bad'); y.rates = rates; y.why = why.trim(); const f = document.getElementById('fs_from'); if (f && f.value) y.from = f.value; y.st = 'Submitted'; y.subBy = App.user.name; y.subAt = nowIso(); fsLog(d, x.bid, 'Submitted for approval', { new: `${x.ay} v${x.n}` }, r); await fsSave(d); fsAud('Fee structure submitted', { new: `${x.bid} ${x.ay} v${x.n}` }); toast('Submitted.'); rerender(); });
};
FS_ACT.fsDiscard = t => {
  const x = fsFind(t); if (!x || x.st !== 'Draft' || !fsCan('Add')) return;
  askReason('Discard draft', 'Say why (at least 5 characters). The draft is kept in Versions as Discarded.', async r => { if (r.length < 5) return toast('Give a reason (at least 5 characters).', 'bad'); const d = Store.clone(fsD()), y = d.v.find(z => z.id === x.id); if (!y || y.st !== 'Draft') return; y.st = 'Discarded'; y.note = r; fsLog(d, x.bid, 'Draft discarded', { new: `${x.ay} v${x.n}` }, r); await fsSave(d); toast('Discarded.'); rerender(); });
};
FS_ACT.fsApprove = t => {
  const x = fsFind(t); if (!x || x.st !== 'Submitted' || !fsCan('Approve')) return; if (x.by === App.user.name || x.subBy === App.user.name) return toast('You prepared this structure, so someone else must approve it.', 'bad');
  askReason('Approve fee structure', 'Note for the record (at least 5 characters). The previous approved version is superseded.', async r => { if (r.length < 5) return toast('Give a note (at least 5 characters).', 'bad'); const d = Store.clone(fsD()), y = d.v.find(z => z.id === x.id); if (!y || y.st !== 'Submitted' || y.by === App.user.name || y.subBy === App.user.name) return toast('Already decided.', 'bad'); d.v.filter(z => z.bid === y.bid && z.ay === y.ay && z.st === 'Approved').forEach(z => { z.st = 'Superseded'; z.to = y.from; }); y.st = 'Approved'; y.apBy = App.user.name; y.apAt = nowIso(); fsLog(d, x.bid, 'Fee structure approved', { new: `${x.ay} v${x.n}` }, r); await fsSave(d); fsAud('Fee structure approved', { new: `${x.bid} ${x.ay} v${x.n}` }); App.ui.pc_fs = 'cur'; toast('Approved. This is now the current structure.'); rerender(); });
};
FS_ACT.fsReject = t => {
  const x = fsFind(t); if (!x || x.st !== 'Submitted' || !fsCan('Approve')) return; if (x.by === App.user.name || x.subBy === App.user.name) return toast('You prepared this structure, so someone else must decide.', 'bad');
  askReason('Send back for changes', 'Say what to change (at least 10 characters).', async r => { if (r.length < 10) return toast('Give a reason (at least 10 characters).', 'bad'); const d = Store.clone(fsD()), y = d.v.find(z => z.id === x.id); if (!y || y.st !== 'Submitted') return toast('Already decided.', 'bad'); y.st = 'Draft'; y.note = r; y.subBy = ''; fsLog(d, x.bid, 'Sent back', { new: `${x.ay} v${x.n}` }, r); await fsSave(d); toast('Sent back to draft.'); rerender(); });
};
/* ===== Per-student fee card: expected fee from the approved structure, less category and active concessions, next to the ERP figure ===== */
function fsCard(s, ay) {
  ay = ay || CUR_AY; const bid = DATA.branches[s.b].id, live = fsLive(bid, ay); if (!live) return null;
  const heads = FS_HEADS.map(h => ({ h, amt: ((live.rates[s.cls] || {})[h]) || 0 })).filter(x => x.amt > 0), gross = heads.reduce((a, x) => a + x.amt, 0);
  const catRec = (rfD().cat || {})[bid + '|' + s.adm], cat = catRec ? catRec.cat : '', catOff = cat ? gross - fsCatAmt(live, s.cls, cat) : 0;
  const base = gross - catOff, today = PROC_TODAY;
  const cons = rfD().cn.filter(c => c.adm === s.adm && c.st === 'Active' && c.from <= today && c.to >= today).map(c => ({ no: c.no, type: c.type, off: c.basis === '%' ? Math.round(base * c.val / 100) : Math.min(base, c.val) }));
  const conOff = Math.min(base, cons.reduce((a, c) => a + c.off, 0)), net = base - conOff;
  return { ver: live.n, heads, gross, cat, catOff, cons, conOff, net, erp: s.annual || 0, diff: net - (s.annual || 0) };
}
function fsCardHtml(s, c, o = {}) {
  const plan = typeof ipSchedule === 'function' ? ipSchedule(s) : null, planHtml = plan ? `<p class="small"><b>Instalment plan:</b> ${esc(plan.t.name)}${plan.disc ? ` · early-payment discount ${INR(plan.disc)}` : ''} · expected: ${plan.rows.map(r => `${r.due} ${INR(r.amt)}`).join(' · ')}</p>` : '';
  if (!c) return planHtml + '<p class="small muted">No approved fee structure for this branch and year, so no expected fee can be shown.</p>';
  const row = (l, v, b) => `<tr><td>${l}</td><td class="n">${b ? '<b>' + v + '</b>' : v}</td></tr>`;
  return planHtml + `<div class="tbl-wrap"><table class="tbl compact"><tbody>${c.heads.map(h => row(esc(h.h), INR(h.amt))).join('')}${row('Gross per structure v' + c.ver, INR(c.gross), 1)}${c.cat ? row(`Category: ${esc(c.cat)}`, '−' + INR(c.catOff)) : ''}${c.cons.map(x => row(`Concession ${esc(x.no)} · ${esc(x.type)}`, '−' + INR(x.off))).join('')}${row(o.family ? 'Net annual fee' : 'Expected net fee', INR(c.net), 1)}${o.family ? '' : row('ERP net fee', INR(c.erp)) + row('Difference', (c.diff > 0 ? '+' : '') + INR(c.diff))}</tbody></table></div>` + (o.family ? '' : Math.abs(c.diff) > 0.5 ? `<p class="small" style="color:#b45309">The ERP figure differs from the structure by ${INR(Math.abs(c.diff))}. Check the ERP fee or raise a Financial adjustment under Approvals.</p>` : '<p class="small muted">The ERP figure matches the structure.</p>');
}
function fsCardsTab(bid, ay) {
  const live = fsLive(bid, ay); if (!live) return empty('No approved structure yet, so fee cards cannot be built.');
  const rows = hsStuAll(bid).map(s => Object.assign({ s }, fsCard(s, ay))).filter(x => x.gross != null);
  const off = rows.filter(r => Math.abs(r.diff) > 0.5), showAll = App.ui.fsAllCards;
  const cols = [{ h: 'Student', t: 'text', k: r => `${r.s.name} (${r.s.adm})` }, { h: 'Class', t: 'text', k: r => r.s.cls + ' ' + (r.s.sec || '') }, { h: 'Gross', t: 'inr', k: r => r.gross }, { h: 'Category', t: 'text', k: r => r.cat || '' }, { h: 'Concessions', t: 'inr', k: r => r.catOff + r.conOff }, { h: 'Expected net', t: 'inr', k: r => r.net }, { h: 'ERP net', t: 'inr', k: r => r.erp }, { h: 'Difference', t: 'inr', k: r => r.diff, cls: 'em' }];
  return `<div class="kpis k4"><div class="kpi"><span>Students</span><b>${NUM(rows.length)}</b></div><div class="kpi"><span>Match the structure</span><b>${NUM(rows.length - off.length)}</b></div><div class="kpi"><span>Differ from ERP</span><b style="color:${off.length ? '#b45309' : 'inherit'}">${NUM(off.length)}</b></div><div class="kpi"><span>Net difference</span><b>${INR(off.reduce((a, r) => a + r.diff, 0))}</b></div></div><div class="ctrls"><label class="chk"><input type="checkbox" data-act="fsAllCards" ${showAll ? 'checked' : ''}> Show students that match too</label></div>` + table('fs_cards', cols, showAll ? rows : off, { title: showAll ? 'Fee cards' : 'Students whose ERP fee differs from the structure', empty: 'Every student matches the structure.', total: true });
}
FS_ACT.fsAllCards = t => { App.ui.fsAllCards = t.checked; rerender(); };
