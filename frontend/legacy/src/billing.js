/* ---------- Billing (read-only): fees raised vs collected, from the ERP schedule ---------- */
const BIL_ACT = {
  bilQ: t => { App.ui.bilQ = t.value.trim(); rerender(); }
};
function bilData() {
  const D = D_(), idx = scopeIdx(), set = new Set(idx);
  const S = E.studentsAt(DATA, A, D).filter(x => x && set.has(x.s.b));
  const mk = () => ({ billed: 0, paid: 0, os: 0, n: 0 });
  const add = (o, due, paid) => { o.billed += due; o.paid += paid; o.os += Math.max(0, due - paid); };
  const month = {}, cls = {}, head = {}; let upcoming = 0, adv = 0, nxt = 0;
  const tot = mk();
  S.forEach(x => {
    adv += x.adv || 0;
    const ck = x.s.cls + '|' + (x.s.sec || ''); cls[ck] = cls[ck] || Object.assign(mk(), { cls: x.s.cls, sec: x.s.sec || '' }); cls[ck].n++;
    const its = (x.s._py ? [x.s._py] : []).concat(x.s._items);
    its.forEach(it => {
      const r = x.inst[it.k]; if (!r) return;
      if (r.upcoming != null) { upcoming += r.upcoming; if (it.due <= D + 30) nxt += r.upcoming; return; }
      const due = r.due, paid = r.paid; if (x.exited) { /* exited: only what was paid counts as billed */ }
      const iso = E.ds(it.due), mkey = it.k === (A.pyK) && x.s._py === it ? 'py' : iso.slice(0, 7);
      month[mkey] = month[mkey] || mk(); add(month[mkey], due, paid);
      add(cls[ck], due, paid);
      const name = it.k >= 0 ? A.sched[it.k].name : 'Adjustment';
      head[name] = head[name] || mk(); add(head[name], due, paid);
      add(tot, due, paid);
    });
  });
  return { D, S, month, cls: Object.values(cls), head, tot, upcoming, adv, nxt };
}
PAGES.billing = { title: 'Billing – fees raised, collected & outstanding', mod: 'instalment', render() {
  if (!scopeIdx().length) return empty('No branches in your scope for these filters.');
  const B = bilData(), D = B.D, T = B.tot;
  const tab = pcTab('bil', 'dash');
  const tabs = pcTabs('bil', [['dash', 'Overview'], ['mon', 'By month'], ['cls', 'By class'], ['head', 'By fee head'], ['stu', 'Student statements']], 'dash');
  const pct = (a, b) => b > 0 ? a / b * 100 : 0;
  const note = `<div class="note">Read-only view built from the fee schedule and receipts. Nothing on this screen raises, changes or waives a fee. Figures are as on ${dLabel(D)} and follow the filters above.</div>`;
  let body = '';
  if (tab === 'dash') {
    body = card('Billing position · ' + esc(scopeLabel()), `<div class="strip">
      <div><span>Fees raised to date</span><b>${INR(T.billed)}</b></div><div><span>Collected against them</span><b>${INR(T.paid)}</b></div>
      <div><span>Outstanding</span><b class="${T.os > 0 ? 'red' : ''}">${INR(T.os)}</b></div><div><span>Collection %</span><b>${PCT(pct(T.paid, T.billed))}</b></div>
      <div><span>Falling due in next 30 days</span><b>${INR(B.nxt)}</b></div><div><span>Billed later in the year</span><b>${INR(B.upcoming)}</b></div>
      <div><span>Advance received</span><b>${INR(B.adv)}</b></div><div><span>Students billed</span><b>${NUM(B.S.length)}</b></div></div>`) + note;
  } else if (tab === 'mon') {
    const keys = Object.keys(B.month).sort((a, b) => a === 'py' ? -1 : b === 'py' ? 1 : a.localeCompare(b));
    const rows = keys.map(k => Object.assign({ label: k === 'py' ? 'Previous-year dues' : MON[+k.slice(5) - 1] + ' ' + k.slice(0, 4) }, B.month[k]));
    const cols = [{ h: 'Month fee fell due', k: r => r.label, t: 'text' }, { h: 'Billed', k: r => r.billed, t: 'inr' }, { h: 'Collected', k: r => r.paid, t: 'inr' }, { h: 'Outstanding', k: r => r.os, t: 'inr', cls: 'em' }, { h: 'Collection %', k: r => pct(r.paid, r.billed), t: 'pct' }];
    body = card('Billing by month', table('bilMon', cols, rows, { total: { label: 'Total', billed: T.billed, paid: T.paid, os: T.os, ...{} }, title: 'Billing by month' }), { right: exportBtns('bilMon', 'instalment', { label: false }), sub: 'Grouped by the month each instalment fell due; collected is what has been received against those instalments.' }) + note;
  } else if (tab === 'cls') {
    const rows = B.cls.slice().sort((a, b) => String(a.cls).localeCompare(String(b.cls), undefined, { numeric: true }) || a.sec.localeCompare(b.sec));
    const cols = [{ h: 'Class', k: r => r.cls, t: 'text' }, { h: 'Section', k: r => r.sec, t: 'text' }, { h: 'Students', k: r => r.n, t: 'num' }, { h: 'Billed', k: r => r.billed, t: 'inr' }, { h: 'Collected', k: r => r.paid, t: 'inr' }, { h: 'Outstanding', k: r => r.os, t: 'inr', cls: 'em' }, { h: 'Collection %', k: r => pct(r.paid, r.billed), t: 'pct' }];
    body = card('Billing by class', table('bilCls', cols, rows, { total: { cls: 'Total', n: rows.reduce((s, r) => s + r.n, 0), billed: T.billed, paid: T.paid, os: T.os }, title: 'Billing by class' }), { right: exportBtns('bilCls', 'instalment', { label: false }) }) + note;
  } else if (tab === 'head') {
    const rows = Object.keys(B.head).map(n => Object.assign({ name: n }, B.head[n]));
    const cols = [{ h: 'Fee head / instalment', k: r => r.name, t: 'text' }, { h: 'Billed', k: r => r.billed, t: 'inr' }, { h: 'Collected', k: r => r.paid, t: 'inr' }, { h: 'Outstanding', k: r => r.os, t: 'inr', cls: 'em' }, { h: 'Collection %', k: r => pct(r.paid, r.billed), t: 'pct' }];
    body = card('Billing by fee head', table('bilHead', cols, rows, { total: { name: 'Total', billed: T.billed, paid: T.paid, os: T.os }, title: 'Billing by fee head' }), { right: exportBtns('bilHead', 'instalment', { label: false }) }) + note;
  } else {
    const q = (App.ui.bilQ || '').toLowerCase();
    const can2 = can('instalment', 'View student-level details');
    if (!can2) body = card('Student statements', '<div class="note">Student-level statements need the "View student-level details" permission.</div>');
    else {
      const hits = q ? B.S.filter(x => (x.s.name + ' ' + x.s.adm).toLowerCase().includes(q)).slice(0, 25) : [];
      const rows = [];
      hits.forEach(x => {
        (x.s._py ? [x.s._py] : []).concat(x.s._items).forEach(it => {
          const r = x.inst[it.k]; if (!r) return;
          const nm = it.k >= 0 ? A.sched[it.k].name : 'Adjustment';
          rows.push({ stu: x.s.name + ' (' + x.s.adm + ')', cls: x.s.cls + ' ' + (x.s.sec || ''), head: nm, due: E.ds(it.due), amt: r.upcoming != null ? r.upcoming : r.due, paid: r.paid, bal: r.bal, st: r.upcoming != null ? 'Not yet due' : r.bal > 0.005 ? (r.paid > 0.005 ? 'Partly paid' : 'Unpaid') : 'Paid' });
        });
      });
      const cols = [{ h: 'Student', k: r => r.stu, t: 'text' }, { h: 'Class', k: r => r.cls, t: 'text' }, { h: 'Fee head', k: r => r.head, t: 'text' }, { h: 'Due date', k: r => r.due, t: 'text' }, { h: 'Amount', k: r => r.amt, t: 'inr' }, { h: 'Paid', k: r => r.paid, t: 'inr' }, { h: 'Balance', k: r => r.bal, t: 'inr', cls: 'em' }, { h: 'Status', k: r => r.st, t: 'text' }];
      body = card('Student statements', `<div class="fld"><span>Find a student (name or admission no.)</span><input id="bilQ" data-act="bilQ" value="${esc(App.ui.bilQ || '')}" placeholder="Type and press Enter"></div>` + (q ? (hits.length === 1 && typeof fsCard === 'function' && can('fst') ? `<details open><summary><b>Expected fee card · ${esc(hits[0].s.name)}</b></summary>${fsCardHtml(hits[0].s, fsCard(hits[0].s))}</details>` : '') + table('bilStu', cols, rows, { title: 'Student fee statement', empty: 'No student matches.' }) : '<p class="muted">Search for a student to see each instalment with its due date, payment and balance.</p>'), { right: q ? exportBtns('bilStu', 'instalment', { label: false }) : '' }) + note;
    }
  }
  return tabs + body;
} };
