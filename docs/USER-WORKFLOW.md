# How the application works — end-user workflow

Eduvia runs in any browser and installs on Android/iPhone as an app (open the site in Chrome → menu → *Add to Home screen*). Phones show a bottom bar (Home · Collect/Attend · Gaps · Alerts) and a drawer menu (☰); desktops show the side menu. Everything you can do depends on your **role** and your **branch**; what you cannot do is hidden, and the server blocks it anyway.

## 1. Signing in
1. Open the app → username + password (given by the System Admin).
2. First login forces a password change (8+ characters). 5 wrong passwords lock the account — ask the System Admin to unlock (Admin → Users → status Active).
3. You land on **My day**: your numbers, your checklist, gaps assigned to you, alerts.

Every important action asks for a **reason** and is written to the audit log with your name, old and new values.

## 2. A day at a branch (the money chain)

```
Fee Collector                 Branch Accountant                Finance / CFO
──────────────                ──────────────────               ─────────────
Collect fee → receipt   →   (end of day)
Close cash day          →   Handover auto-created
(count notes, explain       Accept handover (recount)   →    Verify closing
 any difference)            Record bank deposit ref     →    Gap engine checks: undeposited cash, differences, unverified closings
```

### 2.1 Collect a fee (Fee Collector / Accountant)
Home → **Collect fee** → search student (name / admission no / mobile) → tick the instalments (partial amounts allowed, never above balance) → choose mode (Cash, UPI, Card, Bank transfer, Cheque, Online) → non-cash needs the transaction reference → **Issue receipt** → receipt screen (print / share). Receipts are numbered `RCP/<branch>/<FY>/<seq>` and digitally signed.
Rules: no collection for withdrawn students; no receipt dated on/before your last closed cash day; cancellation (Accountant, reason ≥10 chars) only until the closing is verified — after that it becomes a refund.

### 2.2 Close the cash day (Fee Collector)
Cash closing → enter the count per denomination → the app shows expected cash (your cash receipts today) and the difference → a difference needs a written reason and alerts the Principal → **Close day & hand over**. The handover to the Accountant is created automatically; the app reminds you at 18:30 if you forgot.

### 2.3 Handover and bank (Branch Accountant)
Handovers → **Accept** (enter the amount you counted; a difference needs a reason) → after banking, **Record deposit** with the slip reference. Closings → **Verify** each cashier's closing. Unaccepted handovers (>1 day) and undeposited cash (>2 days) become *Critical* gaps automatically.

### 2.4 Concessions and refunds
Concession: Accountant requests with a supporting document reference → Principal/Finance approves (never the requester) → applied to the earliest open instalments. Refund: requested with reason → Approved by a different person → Paid by a third person (CFO/Finance). Pending ones become gaps after 5/7 days.

## 3. Admissions (Counsellor → Principal)
Admissions CRM → **New enquiry** (duplicate mobile in the same branch is blocked) → pipeline **New → Contacted → Visited → Application → Documents → SRF Paid → Admitted** (no skipping) or **Lost** with a reason. Record every call as a follow-up with the next date; overdue follow-ups turn red and become gaps.
**Admit** (Principal): one click creates the student, admission number, allocates the section with free seats, generates fee demands from the approved structure, notifies the fee desk and emails the parent (email is logged/simulated until SMTP is configured). The counsellor is taken straight to the student page.

## 4. Students (everyone with access)
Students → filters → open a student: balance/overdue/paid, fee demands per instalment, receipts, attendance % with exam eligibility (≥75 %), profile. Editing any field needs a reason. Withdrawal sets the exit date and blocks further collection.

## 5. Attendance
* **Class Teacher**: Attendance → choose class/section/date (daily or period) → every student defaults to Present → tap A/L/V/M for exceptions → Save. Three consecutive absences alert the Principal. Dates older than 2 days are corrections: need Edit permission and a reason.
* **Staff attendance** (Principal/HR): same one-tap grid for employees (P/A/H/L/W). Changing an existing mark = regularisation with reason.
* **My check-in** (any staff with a linked employee record): one button on the phone marks you present with device and time.
* Not-marked classes and students under 75 % become gaps.

## 6. HR & payroll
* **Leave**: any employee applies (type, dates, reason); Principal/HR approves (never your own); overlapping requests are blocked; approved leave is excluded from loss-of-pay.
* **Employees** (HR): add/edit with reason; bank details visible only to HR editors.
* **Payroll** (monthly): HR **Compute** → Draft lines (gross pro-rated on paid days, PF/ESI/PT/TDS defaults, variance flags for ±15 % vs last paid month or missing bank details) → HR may *exclude* a line with reason → Finance **Verify** (must be a different person; flagged lines need a note) → CFO **Approve** (third person) → **Generate bank file** → download NEFT CSV → **Mark paid**. Rejection at any step needs a reason.

## 7. Gap Analysis Center (the control tower)
Every morning at 06:00 the engine runs 17 rules (fees overdue >30 days, cash not closed, cash differences, handover pending, cash undeposited, closings unverified, refunds/concessions pending, follow-ups overdue, stale enquiries, SRF paid not admitted, attendance not marked, students <75 %, section over capacity, staff absent without leave, leave pending, dormant users). Each finding becomes a numbered gap with owner, reviewer, risk, due date and the expected action.
Owner workflow: **Acknowledge → Start work → Resolve** (note ≥10 chars; High/Critical need an evidence file reference) or **Reject** with reason. When the condition disappears the gap auto-resolves. Overdue gaps escalate: L1 owner reminder → L2 reviewer → L3 Principal → L4 Regional/Finance → L5 CFO/CEO (offsets configurable per category in *Escalation matrix*). The **compliance score** (100 minus weighted open gaps) appears on every dashboard. Managers can *Run scan now*.

## 8. Tasks & checklists
Each role gets a daily and monthly checklist per branch (e.g. cashier: open counter, collect, close day, hand over). Tick items with optional note/evidence; completion is audited. Delegate your approvals to a colleague for up to 45 days when on leave.

## 9. Dashboards, reports, alerts
* **Executive dashboard** (management): headline brief, red flags, KPIs, branch scorecard (collection, outstanding, attendance, open gaps, compliance). The same brief is sent at 07:00 as a notification/email.
* **Report builder**: choose a dataset (students, fee outstanding, receipts, daily collection by mode, closings, handovers, enquiries, admission funnel, attendance, employees, gaps, branch scorecard) → pick columns, group, sort → Run / Export CSV / Save (versioned) / Schedule (hour + emails).
* **Alerts** (bell): every notification with a link to the record; escalations and action items must be *Acknowledged*.
* **Search** (🔍): students, receipts, enquiries, employees, gaps in one box.

## 10. All other modules (Modules directory)
Menu → **All modules** lists every screen of the complete application (24 areas: strength & admissions, finance, SRF incentives, store & purchase, assets, petty cash, utilities, bank reconciliation, HR, maintenance, student information, academics, planner, franchise, compliance, communication, admissions CRM, IT, legal, payroll, AI assistant, admin control centre). These open with the module's own left menu and filters exactly as before; your role decides what you see inside. Changes are saved to the central database immediately (the status line reads "Saved to Eduvia database"). If a colleague changed the same record moments before you, the screen reloads their version and asks you to redo your change.

## 11. Administration (System Admin)
Admin → Users: create (initial password, role, branch), lock/unlock, reset password, access mappings (zone/region/state/selected branches with validity). Admin → Roles: permission grid per module × action (View, Add, Edit, Verify, Approve, Reject, Delete, Export, Configure Settings) with a mandatory reason. Audit log: filter by module, open any entry to see before/after; Email log shows every simulated/sent email.

## 12. Roles at a glance

| Role | Can |
|---|---|
| Fee Collector | collect, view receipts, close cash day, handover, own checklist, own gaps |
| Branch Accountant | + cancel receipts, request concessions/refunds, accept handovers, deposits, verify closings, reports |
| Admission Counsellor | enquiries pipeline, follow-ups |
| Class Teacher | student attendance, student view |
| Principal | branch-wide view, admit, approve concessions/leave, verify cash, attendance corrections, gaps approval, reports |
| HR Manager | employees, leave, staff attendance, payroll compute/verify, bank file |
| Finance Manager / CFO | approvals across fees, cash, payroll; dashboards; reports |
| Regional Head / CEO / COO | dashboards, gaps, reports across branches |
| Internal Auditor | read everything + audit log |
| System Admin | users, roles, mappings |
| Parent | own children (student view) — parent portal screens are in the migration plan |
