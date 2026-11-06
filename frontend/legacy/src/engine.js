/* ===== Fee engine: dataset generation (ERP stand-in), FIFO allocation, as-on-date calculations ===== */
const Engine = (() => {
  const DAY0 = Date.UTC(2026, 2, 1); // 1 Mar 2026 = day 0
  const ND = 420;                    // through ~ Apr 2027
  const MODES = ['Cash', 'Online / UPI', 'Card', 'Bank Transfer', 'Cheque'];
  const dn = s => { const [y, m, d] = s.split('-').map(Number); return Math.round((Date.UTC(y, m - 1, d) - DAY0) / 864e5); };
  const ds = n => new Date(DAY0 + n * 864e5).toISOString().slice(0, 10);
  const dow = n => new Date(DAY0 + n * 864e5).getUTCDay();
  const r2 = x => Math.round(x * 100) / 100;
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  const FIRST_M = ['Mohammed Ayaan', 'Mohammed Zaid', 'Abdul Rahman', 'Syed Arham', 'Mohd Faizan', 'Ahmed Rayyan', 'Mohammed Hamza', 'Imran Ali', 'Mohammed Arshad', 'Shaik Sameer', 'Mohammed Saad', 'Mirza Danish', 'Aarav', 'Vihaan', 'Arjun', 'Rohan', 'Mohammed Owais', 'Syed Rehan', 'Mohd Talha', 'Abdul Wasay', 'Mohammed Yusuf', 'Kabir', 'Mohammed Adnan', 'Mohammed Huzaifa'];
  const FIRST_F = ['Ayesha', 'Fatima', 'Zainab', 'Maryam', 'Sana', 'Hafsa', 'Aliya', 'Umme Salma', 'Mehwish', 'Rida', 'Areeba', 'Nida', 'Ananya', 'Diya', 'Saniya', 'Afreen', 'Tasneem', 'Heena', 'Bushra', 'Iqra', 'Zoya', 'Safa', 'Anam', 'Mahira'];
  const LAST = ['Khan', 'Siddiqui', 'Qureshi', 'Ansari', 'Shaikh', 'Syed', 'Hussain', 'Ahmed', 'Baig', 'Mirza', 'Pasha', 'Farooqui', 'Rizvi', 'Hashmi', 'Quadri', 'Sharma', 'Reddy', 'Fatima', 'Begum', 'Raza'];

  function profile(b) {
    const n = b.name;
    if (/Kids/.test(n)) return { avg: 32000, classes: ['Nursery', 'LKG', 'UKG'], secs: ['A', 'B', 'C'] };
    if (/IOE|SRC/.test(n)) return { avg: 150000, classes: ['Inter 1st Year', 'Inter 2nd Year'], secs: ['MPC-A', 'MPC-B', 'BiPC-A', 'BiPC-B'] };
    if (/MSEC/.test(n)) return { avg: 60000, classes: ['Inter 1st Year', 'Inter 2nd Year'], secs: ['MPC-A', 'BiPC-A'] };
    if (/Junior College/.test(n)) return { avg: 75000, classes: ['Inter 1st Year', 'Inter 2nd Year'], secs: ['MPC-A', 'MPC-B', 'BiPC-A', 'CEC-A', 'MEC-A'] };
    if (/Degree/.test(n)) return { avg: 45000, classes: ['B.Com Year 1', 'B.Com Year 2', 'B.Com Year 3', 'B.Sc Year 1', 'B.Sc Year 2', 'BBA Year 1'], secs: ['A', 'B'] };
    if (/OlympIAS/.test(n)) return { avg: 90000, classes: ['VI', 'VII', 'VIII', 'IX', 'X'], secs: ['A', 'B'] };
    return { avg: /Super/.test(n) ? 60000 : 48000, classes: ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'], secs: ['A', 'B', 'C'] };
  }

  /* Exactly scale a set of target amounts so they sum to `total`, each capped at cap[i]. */
  function fitExact(vals, caps, total, R, prefer) {
    let S = vals.reduce((a, v) => a + v, 0), diff = r2(total - S);
    const order = vals.map((_, i) => i).sort((a, b) => prefer(a) - prefer(b) || R() - 0.5);
    let guard = 0;
    while (Math.abs(diff) >= 0.01 && guard++ < 6) {
      for (const i of order) {
        if (Math.abs(diff) < 0.01) break;
        if (diff > 0) { const room = r2(caps[i] - vals[i]); if (room <= 0) continue; const t = Math.min(room, diff); vals[i] = r2(vals[i] + t); diff = r2(diff - t); }
        else { const t = Math.min(vals[i], -diff); if (t <= 0) continue; vals[i] = r2(vals[i] - t); diff = r2(diff + t); }
      }
    }
    return vals;
  }

  /* -------- Build the ERP stand-in dataset, calibrated to the uploaded report at its as-on date -------- */
  function build(src) {
    const J = dn(src.source.asOn), TODAY = dn(src.today), AYS = dn('2026-04-01');
    const branches = src.branches.map((b, i) => ({ ...b, idx: i, code: b.id }));
    const students = [], receipts = [], orphans = [];
    let rno = 0;
    const isHol = new Set((src.holidays || []).map(dn));
    const work = d => dow(d) !== 0 && !isHol.has(d);
    const backToWork = d => { while (!work(d) && d > 0) d--; return d; };
    const pickMode = R => { const u = R(); return u < .22 ? 0 : u < .67 ? 1 : u < .75 ? 2 : u < .9 ? 3 : 4; };

    branches.forEach((b, bi) => {
      const R = rng(1000 + bi * 7919);
      const P = profile(b);
      const annualTotal = b.netFee / 0.4;
      const n = Math.max(8, Math.round(annualTotal / P.avg));
      const first = students.length;
      const list = [];
      const w = [];
      for (let i = 0; i < n; i++) {
        const ci = Math.floor(R() * P.classes.length);
        const f = R() < .5;
        const st = {
          id: students.length + i, b: bi, adm: `${b.code}-${String(26000 + i + 1)}`,
          name: (f ? FIRST_F : FIRST_M)[Math.floor(R() * 24)] + ' ' + LAST[Math.floor(R() * LAST.length)],
          cls: P.classes[ci], ci, sec: P.secs[Math.floor(R() * Math.min(P.secs.length, n > 60 ? P.secs.length : 2))],
          mobile: '9' + String(Math.floor(R() * 1e9)).padStart(9, '0').replace(/^(\d{2})\d{4}/, '$1XXXX'),
          join: AYS - 20, py: 0, annual: 0, gross: 0, conc: 0, rc: []
        };
        list.push(st); w.push((0.75 + 0.5 * R()) * (1 + ci * 0.04));
      }
      // instalment-1 amounts summing exactly to the report's 1st-instalment net fee
      const W = w.reduce((a, x) => a + x, 0);
      const i1 = fitExact(w.map(x => r2(b.netFee * x / W)), w.map(() => 1e12), b.netFee, R, () => 0);
      list.forEach((s, i) => { s.annual = i1[i] / 0.4; if (R() < .07) { s.conc = 0.1 + R() * 0.4; } s.gross = r2(s.annual / (1 - s.conc)); });

      // ---- instalment-1 paid as on report date: exact to report ----
      const p = b.netFee > 0 ? b.paid / b.netFee : 0;
      const z = Math.min(1, Math.max(0, (1 - p) * 0.42));
      const q = Math.min(1, Math.max(0, (p / Math.max(1e-9, 1 - z) - 0.55) / 0.45));
      const f = list.map(() => { const u = R(); return u < z ? 0 : (R() < q ? 1 : 0.2 + 0.7 * R()); });
      let paid1 = fitExact(list.map((s, i) => r2(i1[i] * f[i])), i1, b.paid, R, i => (f[i] > 0 && f[i] < 1 ? 0 : f[i] === 1 ? 1 : 2));
      const mk = (s, d, amt, kind, mode) => { const r = { id: ++rno, no: `${b.code}/R${String(rno).padStart(6, '0')}`, s: s.id, b: bi, d, amt: r2(amt), kind, mode }; s.rc.push(r); receipts.push(r); return r; };
      const preDate = () => { const u = R(); let d; if (u < .55) d = dn('2026-03-20') + Math.floor(R() * 42); else if (u < .82) d = dn('2026-05-01') + Math.floor(R() * 61); else d = dn('2026-07-01') + Math.floor(R() * 21); d = Math.min(d, J); return d; };
      list.forEach((s, i) => {
        let a = paid1[i]; if (a <= 0) return;
        const m = pickMode(R); let d = preDate(); if (m === 0 || m === 4) d = backToWork(d);
        if (a > 2000 && R() < .3) { const a1 = r2(a * (0.4 + R() * 0.3)); mk(s, d, a1, 'F', m); const d2 = Math.min(J, d + 10 + Math.floor(R() * 40)); mk(s, backToWork(d2), r2(a - a1), 'F', pickMode(R)); }
        else mk(s, d, a, 'F', m);
        // full-year advance payers
        if (paid1[i] >= i1[i] - 0.01 && R() < .045) { const d3 = Math.min(J, d + Math.floor(R() * 20)); mk(s, backToWork(d3), r2(s.annual * 0.6), 'F', pickMode(R)); s.fullYear = true; }
      });

      // ---- previous-year dues: balance on report date exact to report ----
      if (b.pyDue > 0) {
        const pyOpen = r2(b.pyDue * (1.35 + R() * 0.6));
        const cand = list.filter(() => R() < 0.22); if (!cand.length) cand.push(list[0]);
        const pw = cand.map(() => 0.3 + R());
        const PW = pw.reduce((a, x) => a + x, 0);
        const opens = fitExact(pw.map(x => r2(pyOpen * x / PW)), pw.map(() => 1e12), pyOpen, R, () => 0);
        cand.forEach((s, i) => s.py = opens[i]);
        const target = r2(pyOpen - b.pyDue);
        const pf = cand.map(() => R() < .45 ? 1 : R() < .5 ? 0 : 0.3 + R() * 0.6);
        const pp = fitExact(cand.map((s, i) => r2(s.py * pf[i])), cand.map(s => s.py), target, R, i => pf[i] > 0 && pf[i] < 1 ? 0 : 1);
        cand.forEach((s, i) => { if (pp[i] > 0) { const m = pickMode(R); let d = dn('2026-04-01') + Math.floor(R() * 95); d = Math.min(d, J); if (m === 0 || m === 4) d = backToWork(d); mk(s, d, pp[i], 'PY', m); } });
      }

      // ---- after report date (simulated ERP activity up to today) ----
      const after = () => J + 1 + Math.floor(Math.pow(R(), 0.85) * (TODAY - J));
      const pb = 0.3 + 0.65 * R();
      list.forEach((s, i) => {
        const bal1 = r2(i1[i] - paid1[i]);
        if (bal1 > 0.01 && R() < pb) { const part = R() < .25 ? r2(bal1 * (0.3 + R() * 0.5)) : bal1; const m = pickMode(R); let d = after(); if (m === 0 || m === 4) d = Math.max(J + 1, backToWork(d)); mk(s, d, part, 'F', m); }
        const pyPaid = s.rc.filter(r => r.kind === 'PY').reduce((a, r) => a + r.amt, 0);
        const pyBal = r2(s.py - pyPaid);
        if (pyBal > 0.01 && R() < pb * 0.6) { const m = pickMode(R); mk(s, Math.max(J + 1, backToWork(after())), pyBal, 'PY', m); }
        // instalment 2 (due 10 Oct): some pay early (advance), more around the due date
        if (!s.fullYear && paid1[i] >= i1[i] - 0.01) {
          const u = R(); const amt2 = r2(s.annual * 0.3);
          if (u < .14) mk(s, backToWork(dn('2026-09-12') + Math.floor(R() * 27)), amt2, 'F', pickMode(R));
          else if (u < .2 + pb * 0.5) { const d = Math.min(TODAY, dn('2026-10-10') + Math.floor(Math.pow(R(), 1.6) * 10)); mk(s, backToWork(d) < dn('2026-10-10') ? dn('2026-10-10') : backToWork(d), amt2, 'F', pickMode(R)); }
        }
      });
      // new admissions after report date
      const nNew = Math.max(b.netFee > 0 ? 1 : 0, Math.round(n * 0.012));
      for (let k = 0; k < nNew; k++) {
        const ci = Math.floor(R() * P.classes.length);
        const jd = backToWork(J + 3 + Math.floor(R() * (TODAY - J - 3)));
        const s = { id: first + n + k, b: bi, adm: `${b.code}-${String(26000 + n + k + 1)}`, name: (R() < .5 ? FIRST_F : FIRST_M)[Math.floor(R() * 24)] + ' ' + LAST[Math.floor(R() * LAST.length)], cls: P.classes[ci], ci, sec: P.secs[0], mobile: '9' + String(Math.floor(R() * 1e9)).padStart(9, '0').replace(/^(\d{2})\d{4}/, '$1XXXX'), join: jd, py: 0, annual: r2(P.avg * (0.8 + R() * 0.4)), conc: 0, rc: [], isNew: true };
        s.gross = s.annual; list.push(s);
        if (R() < .7) mk(s, jd, r2(s.annual * (R() < .8 ? 0.4 : 0.7)), 'F', pickMode(R));
      }
      list.forEach((s, i) => s.id = first + i);
      list.forEach(s => s.rc.forEach(r => r.s = s.id));
      students.push(...list);
    });

    // ---- reversals, refunds and data anomalies (after report date only, so the report reconciles) ----
    const RA = rng(424242);
    const postJ = receipts.filter(r => r.d > J && r.amt > 0);
    postJ.filter(r => r.mode === 4).forEach(r => { if (RA() < .03) { const s = students[r.s]; const x = { id: ++rno, no: r.no + '-REV', s: s.id, b: r.b, d: Math.min(TODAY, r.d + 3 + Math.floor(RA() * 5)), amt: -r.amt, kind: r.kind, mode: 4, type: 'Reversal', ref: r.no }; s.rc.push(x); receipts.push(x); } });
    students.filter(s => s.fullYear).forEach(s => { if (RA() < .08) { const x = { id: ++rno, no: `${branches[s.b].code}/RF${rno}`, s: s.id, b: s.b, d: J + 10 + Math.floor(RA() * (TODAY - J - 10)), amt: -r2(s.annual * 0.3), kind: 'F', mode: 3, type: 'Refund' }; s.rc.push(x); receipts.push(x); } });
    // duplicates (same receipt number posted twice in ERP)
    const dupPick = [postJ[Math.floor(postJ.length * .21)], postJ[Math.floor(postJ.length * .57)], postJ[Math.floor(postJ.length * .83)]];
    const dups = dupPick.map(r => ({ ...r, id: ++rno, dup: true }));
    // receipts without a student / fee-head mapping (present in ERP ledger only)
    orphans.push({ no: `${branches[12].code}/R-UNMAPPED-1`, b: 12, d: TODAY - 2, amt: 18500, mode: 1, reason: 'Receipt has no student / fee head mapping' });
    orphans.push({ no: `${branches[40].code}/R-UNMAPPED-2`, b: 40, d: TODAY - 6, amt: 42000, mode: 3, reason: 'Receipt has no student / fee head mapping' });
    // students with a receipt but no fee plan (annual fee 0)
    [students.find(s => s.isNew && s.b === 27), students.find(s => s.isNew && s.b === 55)].filter(Boolean).forEach(s => { s.noPlan = true; s.annual = 0; s.gross = 0; });
    students.forEach(s => s.rc.sort((a, b) => a.d - b.d || a.id - b.id));
    return { branches, students, receipts, dups, orphans, J, TODAY, AYS };
  }

  /* -------- Allocation of receipts to instalments (oldest due first) and daily branch arrays -------- */
  function itemsFor(s, br, sched) {
    const out = [];
    sched.forEach((it, k) => {
      if (!it.active || it.kind === 'py') return;
      if (it.branches && it.branches !== 'all' && !it.branches.includes(br.id)) return;
      if (it.types && it.types !== 'all' && !it.types.includes(br.type)) return;
      if (it.classes && it.classes !== 'all' && !it.classes.includes(s.cls)) return;
      const amt = it.kind === 'fixed' ? +it.amount || 0 : r2(s.annual * (+it.pct || 0) / 100);
      if (amt <= 0) return;
      out.push({ k, amt, due: Math.max(it._due, s.join), sdue: it._due, grace: +it.grace || 0 });
    });
    out.sort((a, b) => a.due - b.due || a.k - b.k);
    return out;
  }

  function allocate(DATA, cfg) {
    const sched = cfg.schedule.map(it => ({ ...it, _due: dn(it.due) }));
    const pyK = sched.findIndex(it => it.kind === 'py' && it.active);
    const K = sched.length;
    const NB = DATA.branches.length;
    const A = { sched, pyK, K, NB };
    const mkArr = () => Array.from({ length: NB }, () => Array.from({ length: K + 1 }, () => new Float64Array(ND)));
    A.dueDay = mkArr(); A.paidDay = mkArr(); // k = K is "credit / unallocated"
    A.advDay = Array.from({ length: NB }, () => new Float64Array(ND));
    A.colDay = Array.from({ length: NB }, () => new Float64Array(ND));     // net cash collection (excl. adjustments)
    A.modeDay = Array.from({ length: NB }, () => MODES.map(() => new Float64Array(ND)));
    A.refDay = Array.from({ length: NB }, () => new Float64Array(ND));
    A.revDay = Array.from({ length: NB }, () => new Float64Array(ND));
    A.cntDay = Array.from({ length: NB }, () => new Float64Array(ND));
    const adjBy = {}; (cfg.adjustments || []).forEach(a => { (adjBy[a.studentId] = adjBy[a.studentId] || []).push(a); });
    const clamp = d => Math.max(0, Math.min(ND - 1, d));
    DATA.students.forEach(s => {
      const br = DATA.branches[s.b];
      const items = itemsFor(s, br, sched);
      const adj = adjBy[s.id] || [];
      adj.filter(a => a.amount > 0).forEach(a => items.push({ k: -2, amt: a.amount, due: dn(a.date), sdue: dn(a.date), grace: 0, adj: true }));
      items.sort((a, b) => a.due - b.due);
      const pyItem = pyK >= 0 && s.py > 0 ? { k: pyK, amt: s.py, due: sched[pyK]._due, sdue: sched[pyK]._due, grace: +sched[pyK].grace || 0 } : null;
      s._items = items; s._py = pyItem; s._ch = [];
      items.forEach(it => { if (it.k >= 0) A.dueDay[s.b][it.k][clamp(it.due)] += it.amt; });
      if (pyItem) A.dueDay[s.b][pyK][clamp(pyItem.due)] += pyItem.amt;
      const filled = items.map(() => 0); let credit = 0, pyFilled = 0;
      const rcs = s.rc.concat(adj.filter(a => a.amount < 0).map(a => ({ d: dn(a.date), amt: -a.amount, kind: 'F', adj: true, mode: -1 }))).sort((a, b) => a.d - b.d);
      const push = (d, k, a, isAdj, sdue) => { s._ch.push({ d, k, a, adj: !!isAdj, due: sdue }); const dd = clamp(d); A.paidDay[s.b][k < 0 ? K : k][dd] += a; if (!isAdj) { A.colDay[s.b][dd] += a; if (sdue > d) A.advDay[s.b][dd] += a; } };
      rcs.forEach(r => {
        const dd = clamp(r.d);
        if (!r.adj) {
          if (r.amt > 0) { A.modeDay[s.b][r.mode][dd] += r.amt; A.cntDay[s.b][dd]++; }
          else if (r.type === 'Refund') A.refDay[s.b][dd] -= r.amt; else A.revDay[s.b][dd] -= r.amt;
        }
        if (r.kind === 'PY' && pyItem) {
          if (r.amt > 0) { const t = Math.min(r.amt, pyItem.amt - pyFilled); if (t > 0) { pyFilled += t; push(r.d, pyK, t, r.adj, pyItem.due); } if (r.amt - t > 0.005) { credit += r.amt - t; push(r.d, -1, r.amt - t, r.adj, 1e9); } }
          else { const t = Math.min(-r.amt, pyFilled); pyFilled -= t; push(r.d, pyK, -t, r.adj, pyItem.due); }
          return;
        }
        if (r.amt > 0) {
          let x = r.amt;
          for (let i = 0; i < items.length && x > 0.005; i++) { const t = Math.min(x, items[i].amt - filled[i]); if (t > 0.005) { filled[i] += t; x -= t; push(r.d, items[i].k, t, r.adj, items[i].due); } }
          if (x > 0.005) { credit += x; push(r.d, -1, x, r.adj, 1e9); }
        } else {
          let x = -r.amt; const tc = Math.min(credit, x); if (tc > 0) { credit -= tc; x -= tc; push(r.d, -1, -tc, r.adj, 1e9); }
          for (let i = items.length - 1; i >= 0 && x > 0.005; i--) { const t = Math.min(x, filled[i]); if (t > 0.005) { filled[i] -= t; x -= t; push(r.d, items[i].k, -t, r.adj, items[i].due); } }
        }
      });
      s._credit = credit;
    });
    // cumulative arrays
    const cum = arr => { const c = new Float64Array(ND); let a = 0; for (let i = 0; i < ND; i++) { a += arr[i]; c[i] = a; } return c; };
    A.dueCum = A.dueDay.map(b => b.map(cum)); A.paidCum = A.paidDay.map(b => b.map(cum));
    A.colCum = A.colDay.map(cum); A.advCum = A.advDay.map(cum);
    A.memo = new Map();
    return A;
  }

  /* -------- Branch-level fast metrics -------- */
  const at = (arr, d) => d < 0 ? 0 : arr[Math.min(ND - 1, d)];
  function branchQuick(A, b, D) {
    let due = 0, paid = 0, adv = 0, od = 0, pyDue = 0, pyPaid = 0, net = 0;
    for (let k = 0; k < A.K; k++) {
      const it = A.sched[k]; const dueK = at(A.dueCum[b][k], D), paidK = at(A.paidCum[b][k], D);
      if (it._due <= D) { due += dueK; paid += paidK; if (it._due + (+it.grace || 0) < D) od += Math.max(0, dueK - paidK); }
      else adv += paidK;
      net += at(A.dueCum[b][k], ND - 1);
      if (k === A.pyK) { pyDue = dueK; pyPaid = paidK; }
    }
    adv += at(A.paidCum[b][A.K], D);
    return { due, paid, os: Math.max(0, due - paid), adv, od, pyDue, pyPaid, netFee: net - (A.pyK >= 0 ? at(A.dueCum[b][A.pyK], ND - 1) : 0) };
  }
  // outstanding at start of day F (dues falling due up to F, payments before F)
  function openingOS(A, b, F) {
    let os = 0;
    for (let k = 0; k < A.K; k++) if (A.sched[k]._due <= F) os += at(A.dueCum[b][k], F) - at(A.paidCum[b][k], F - 1);
    return Math.max(0, os);
  }
  function freshDues(A, b, F, D) { // dues that fell due after the 1st up to D (instalments + new admissions)
    let x = 0;
    for (let k = 0; k < A.K; k++) x += at(A.dueCum[b][k], D) - at(A.dueCum[b][k], F);
    return x;
  }
  function sumRange(arr, a, b) { return at(arr, b) - at(arr, a - 1); }
  function cumOf(arr) { const c = new Float64Array(ND); let a = 0; for (let i = 0; i < ND; i++) { a += arr[i]; c[i] = a; } return c; }

  /* -------- Student-level as-on-date -------- */
  function studentsAt(DATA, A, D) {
    if (A.memo.has(D)) return A.memo.get(D);
    const out = new Array(DATA.students.length);
    DATA.students.forEach((s, i) => {
      if (s.join > D) { out[i] = null; return; }
      const paidK = new Map(); let adv = 0;
      for (const c of s._ch) { if (c.d > D) break; paidK.set(c.k, (paidK.get(c.k) || 0) + c.a); }
      let due = 0, paid = 0, od = 0, cur = 0, curPaid = 0; const ag = [0, 0, 0, 0, 0]; const inst = {};
      const handle = (it, isPy) => {
        const p = paidK.get(it.k) || 0;
        if (it.due <= D) {
          due += it.amt; paid += p; const bal = Math.max(0, it.amt - p);
          if (!isPy) { cur += it.amt; curPaid += p; }
          if (bal > 0.005) { const late = D - it.due; ag[late <= 30 ? 0 : late <= 60 ? 1 : late <= 90 ? 2 : late <= 180 ? 3 : 4] += bal; if (late > it.grace) od += bal; }
          inst[it.k] = { due: it.amt, paid: p, bal };
        } else { adv += p; inst[it.k] = { due: 0, paid: p, bal: 0, upcoming: it.amt }; }
      };
      if (s._py) handle(s._py, true);
      s._items.forEach(it => it.k >= 0 ? handle(it, false) : handle(it, false));
      adv += paidK.get(-1) || 0;
      const py = s._py ? inst[s._py.k] : null;
      const os = Math.max(0, due - paid);
      let status = due <= 0.005 ? (adv > 0 ? 'Advance' : 'Not due') : paid <= 0.005 ? 'Zero payer' : os > 0.005 ? 'Partial' : 'Fully paid';
      let exited = false;
      if (s.exit && s.exit <= D) { exited = true; status = 'Exited'; od = 0; ag.fill(0); for (const k in inst) { inst[k].bal = 0; } }
      out[i] = { s, due: exited ? Math.min(due, paid) : due, paid, os: exited ? 0 : os, od, adv, ag, inst, status, exited, pyDue: py ? py.due : 0, pyBal: exited ? 0 : (py ? py.bal : 0), curDue: exited ? Math.min(cur, curPaid) : cur, curBal: exited ? 0 : Math.max(0, cur - curPaid), exitDue: due, exitOs: os };
    });
    if (A.memo.size > 12) A.memo.delete(A.memo.keys().next().value);
    A.memo.set(D, out);
    return out;
  }

  return { dn, ds, dow, ND, MODES, rng, build, allocate, branchQuick, openingOS, freshDues, studentsAt, at, sumRange, cumOf, r2 };
})();
if (typeof module !== 'undefined') module.exports = Engine;
