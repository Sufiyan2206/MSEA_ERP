# Migration plan — from the single-file app (v153, 192 screens) to the new stack

> **All 192 screens are available in this package.** "Ported" = native React + typed Flask tables. "Partial" = native screen covers part; the full original screen is available at `/app/<key>`. "Legacy runtime" = runs through the legacy module runtime (docs/LEGACY-RUNTIME.md) at `/app/<key>` with data in MySQL. Nothing is missing; the plan below is the order in which legacy-runtime screens get rewritten natively.

## What this package already ports (end to end: DB + API + UI + tests)

| Area | Old screens | New stack |
|---|---|---|
| Auth, roles, permissions, access mappings, audit, logins | Admin / Settings / Audit | `api/auth.py`, `api/org.py`, `/admin/users`, `/admin/audit` |
| Organisation (entities, branches, sections, academic years) | Setup | `api/org.py` (`/branches`, `/sections`) + seed |
| Students (list, profile, edit with reason, withdrawal, demands) | Students | `/students`, `/students/:id` |
| Admissions CRM (pipeline, follow-ups, duplicates, SRF, lost, **auto-onboarding**) | CRM, Enquiries, Onboarding automation | `/admissions`, `/admissions/:id` |
| Fees: heads, structures (versioned, approved), demands, collection, receipts (signed), cancel, concessions, refunds | Fee desk, Receipts, Concessions, Refunds, Fee master | `/fees/*` |
| Cash: closing with denominations, difference reasons, **auto handover**, accept/deposit chain, verification | Cashier closing, Handover | `/cash/*` |
| Attendance: student daily & period, corrections, 3-day alert, exam eligibility; staff attendance; mobile self check-in | Attendance, Staff attendance | `/attendance` |
| HR: employees, leave, payroll chain with variance flags, NEFT bank file | HR, Leave, Payroll, Bank file | `/hr/*` |
| Gap Analysis Center: 17 rules, dedupe, auto-resolve, escalation matrix, reminders, compliance score | Gap center, Escalation, Automation center | `/gaps` + scheduler |
| Task centre: role checklists (daily/monthly), delegations | Task & approval centre | `/tasks` |
| Notifications & acknowledgements, global search | Alerts, Search | `/notifications`, `/search` |
| Report builder: 13 datasets, columns/filters/group/sort, CSV export, saved versions, schedules, email log | Report builder, Management reports | `/reports` |
| Executive dashboard, daily brief, branch scorecard | Executive dashboard, Daily brief | `/dashboard` |

## How to port a remaining screen (repeatable recipe, ~½ day per simple screen)
1. **Data**: find the `Store` doc(s) the old page reads/writes (`src/store.js DOCS`), create the model(s) in `backend/app/models`, migration (`alembic revision --autogenerate`).
2. **Rules**: move the old `ACT.*` handlers' validations into a service function; raise `PolicyViolation`/`Conflict`; call `audit.record`.
3. **API**: blueprint with `@require(module, action)` + `assert_scope`; add the module to `ROLES` in `scripts/seed.py` and `MODULES` in `pages/Misc.tsx`.
4. **UI**: page in `frontend/src/pages`, using `DataTable`/`Modal`/`ReasonModal`; route in `App.tsx`; nav in `Shell.tsx`.
5. **Tests**: pytest for the rules; Playwright smoke on desktop + Pixel 7.
Suggested order (by business value): Parent portal & family app → Transport & hostel → Exams/marks/report cards → Timetable & substitutions → Inventory/assets/QR labels → Maintenance work orders → Smart classroom/content → remaining finance (ledgers, vendor bills, budgets) → facilities & compliance registers.

## Screen-by-screen inventory (32 ported, 11 partial, 149 legacy runtime)

| Old key | Title | Module | Source file | Status | New route |
|---|---|---|---|---|---|
| `acad` | Academic Management | acad | acad.js | Legacy runtime |  |
| `acplan` | Academic planning | acpl | acplan.js | Legacy runtime |  |
| `settings` | Target & Instalment Control | settings | admin.js | Legacy runtime |  |
| `approvals` | Approvals & Adjustments | approvals | admin.js | Legacy runtime |  |
| `admin_home` | System Admin Control Centre | admin_home | admin.js | Legacy runtime |  |
| `admin_users` | User Management | admin_users | admin.js | Legacy runtime |  |
| `admin_roles` | Role & Permission Management | admin_roles | admin.js | Legacy runtime |  |
| `admin_mapping` | Data Scope & Branch Mapping | admin_mapping | admin.js | Legacy runtime |  |
| `admin_email` | Email Recipient & Report Distribution | admin_email | admin.js | Legacy runtime |  |
| `admin_sync` | ERP Sync & Reconciliation Control | admin_sync | admin.js | Legacy runtime |  |
| `audit` | Audit Log | audit | admin.js | Ported | /admin/audit |
| `adp` | Admission Tests & Offers | adp | admtest.js | Legacy runtime |  |
| `ai_chat` | AI Assistant |  | ai3.js | Legacy runtime |  |
| `ai_admin` | AI Control Centre |  | ai5.js | Legacy runtime |  |
| `ealerts` | Emergency alerts | ema | alerts.js | Legacy runtime |  |
| `surveys` | Parent surveys | svy | alerts.js | Legacy runtime |  |
| `alumni` | Alumni & Placements | alm | alumni.js | Legacy runtime |  |
| `as_home` | Asset Management Dashboard | as_home | asset_pages.js | Legacy runtime |  |
| `as_register` | Asset Register | as_register | asset_pages.js | Legacy runtime |  |
| `as_alloc` | Asset Allocation & Returns | as_alloc | asset_pages.js | Legacy runtime |  |
| `as_transfer` | Asset Transfers | as_transfer | asset_pages.js | Legacy runtime |  |
| `as_maint` | Asset Maintenance, Warranty & AMC | as_maint | asset_pages.js | Legacy runtime |  |
| `as_verify` | Physical Verification & Audit | as_verify | asset_pages2.js | Legacy runtime |  |
| `as_incidents` | Missing, Damaged & Disposal | as_incidents | asset_pages2.js | Legacy runtime |  |
| `as_finance` | Fixed Assets & Depreciation | as_finance | asset_pages2.js | Legacy runtime |  |
| `as_requests` | Asset Requests | as_requests | asset_pages2.js | Legacy runtime |  |
| `as_reports` | Asset Reports | as_reports | asset_reports.js | Legacy runtime |  |
| `as_admin` | Asset Control Centre | as_admin | asset_reports.js | Legacy runtime |  |
| `attendance` | Student attendance | att | attendance.js | Ported | /attendance |
| `tapp` | Teacher app | tapp | attendance.js | Legacy runtime |  |
| `automation` | Automation center | gap | automation.js | Ported | scheduler jobs + /gaps scan |
| `br_fees` | Fee Collection Reconciliation | br_fees | bank_india.js | Legacy runtime |  |
| `br_bulk` | Bulk Payment Reconciliation | br_bulk | bank_india.js | Legacy runtime |  |
| `br_home` | Bank Reconciliation Dashboard | br_home | bank_pages.js | Legacy runtime |  |
| `br_recon` | Direct Bank Reconciliation | br_recon | bank_pages.js | Legacy runtime |  |
| `br_import` | Bank Statements & Import | br_import | bank_pages.js | Legacy runtime |  |
| `br_accounts` | Bank Account Master | br_accounts | bank_pages.js | Legacy runtime |  |
| `br_reports` | BRS & Reconciliation Reports | br_reports | bank_pages2.js | Legacy runtime |  |
| `br_admin` | Bank Reconciliation Control Centre | br_admin | bank_pages2.js | Legacy runtime |  |
| `billing` | Billing – fees raised, collected & outstanding | instalment | billing.js | Ported | /fees/receipts + /reports fee_outstanding |
| `fbp` | Foundation & Board Prep | fbp | boardprep.js | Legacy runtime |  |
| `cal` | Calendar | cal | calendar.js | Legacy runtime |  |
| `cb_home` | Petty Cash Dashboard | cb_home | cash_pages.js | Legacy runtime |  |
| `cb_vouchers` | Petty Cash Vouchers | cb_vouchers | cash_pages.js | Legacy runtime |  |
| `cb_advances` | Cash Advances & Reimbursements | cb_advances | cash_pages.js | Legacy runtime |  |
| `cb_day` | Daily Cash Book | cb_day | cash_pages.js | Legacy runtime |  |
| `cb_replenish` | Petty Cash Replenishment | cb_replenish | cash_pages.js | Legacy runtime |  |
| `cb_reports` | Petty Cash Reports | cb_reports | cash_pages2.js | Legacy runtime |  |
| `cb_admin` | Petty Cash Control Centre | cb_admin | cash_pages2.js | Legacy runtime |  |
| `cashctl` | Cash control | cch | cashctl.js | Legacy runtime |  |
| `certs` | Certificates & ID cards | crt | certs.js | Legacy runtime |  |
| `collections` | Collections desk | cdk | collections.js | Ported | /fees/collect |
| `cmc` | Communication Centre | cmc | commcentre.js | Legacy runtime |  |
| `consent` | Consents | consent | consent.js | Legacy runtime |  |
| `corp` | Corporate dashboard | corp | corp.js | Ported | /dashboard (branch scorecard) |
| `crm_home` | Admissions CRM | crm_home | crm2.js | Ported | /admissions |
| `cur` | Curriculum Master | cur | curriculum.js | Legacy runtime |  |
| `exam` | Examinations | exam | exam.js | Legacy runtime |  |
| `feestruct` | Fee structure | fst | feestruct.js | Ported | /fees/structures |
| `fn_home` | Finance Control Centre | fn_home | fin_pages.js | Legacy runtime |  |
| `fn_gl` | General Ledger | fn_gl | fin_pages.js | Legacy runtime |  |
| `fn_ar` | Accounts Receivable | fn_ar | fin_pages2.js | Legacy runtime |  |
| `fn_ap` | Accounts Payable | fn_ap | fin_pages2.js | Legacy runtime |  |
| `fn_bank` | Cash Management | fn_bank | fin_pages3.js | Legacy runtime |  |
| `fn_budget` | Budget & Cost Control | fn_budget | fin_pages3.js | Legacy runtime |  |
| `fn_reports` | Financial Reports | fn_reports | fin_reports.js | Partial | see recipe; data model partly exists |
| `fn_admin` | Finance Control Centre | fn_admin | fin_reports.js | Legacy runtime |  |
| `franchise` | Franchise Management | franchise | franchise.js | Legacy runtime |  |
| `gaps` | Gap Analysis Center | gap | gaps.js | Ported | /gaps |
| `helpdesk` | Parent help desk | ptk | helpdesk.js | Legacy runtime |  |
| `hostel` | Hostel & Mess | hml | hostel.js | Legacy runtime |  |
| `house` | House System | house | house.js | Legacy runtime |  |
| `hr_home` | HR Dashboard | hr_home | hr_pages.js | Partial | see recipe; data model partly exists |
| `hr_emp` | Employee Master | hr_emp | hr_pages.js | Ported | /hr/employees |
| `hr_prf` | Staff Requirement (PRF) & Position Control | hr_prf | hr_pages.js | Legacy runtime |  |
| `hr_recruit` | Recruitment & Applicant Tracking | hr_recruit | hr_pages2.js | Legacy runtime |  |
| `hr_onboard` | Onboarding & Confirmation | hr_onboard | hr_pages2.js | Legacy runtime |  |
| `hr_att` | Attendance & Shift Management | hr_att | hr_pages3.js | Ported | /attendance (Staff tab; shifts legacy runtime) |
| `hr_leave` | Leave & Holiday Management | hr_leave | hr_pages3.js | Ported | /hr/leave (holidays legacy runtime) |
| `hr_pms` | Performance Management | hr_pms | hr_pages3.js | Legacy runtime |  |
| `hr_train` | Training, CPT & Development | hr_train | hr_pages3.js | Legacy runtime |  |
| `hr_ess` | Self-Service | hr_ess | hr_pages4.js | Ported | /hr/leave + /attendance (My check-in) |
| `hr_exit` | Separation & Exit | hr_exit | hr_pages4.js | Legacy runtime |  |
| `hr_comp` | Grievance, Discipline & Compliance | hr_comp | hr_pages4.js | Legacy runtime |  |
| `hr_reports` | HR Reports & Dashboards | hr_reports | hr_pages4.js | Partial | see recipe; data model partly exists |
| `hr_admin` | HR Control Centre | hr_admin | hr_pages4.js | Partial | see recipe; data model partly exists |
| `gratuity` | Gratuity | grat | hrfin.js | Legacy runtime |  |
| `hr_roster` | Shift roster | rost | hrfin.js | Legacy runtime |  |
| `py_statutory` | Statutory files | py_reports | hrfin.js | Legacy runtime |  |
| `intercompany` | Inter-company | icoy | hrfin.js | Legacy runtime |  |
| `iplans` | Instalment plans | iplan | iplan.js | Legacy runtime |  |
| `lc_home` | Legal Documents & Compliance | lc_home | legal2.js | Legacy runtime |  |
| `lc_register` | Legal Document Register | lc_register | legal2.js | Legacy runtime |  |
| `lc_cal` | Compliance Calendar | lc_cal | legal2.js | Legacy runtime |  |
| `lc_renew` | Renewals & Filings | lc_renew | legal2.js | Legacy runtime |  |
| `lc_cases` | Cases & Notices | lc_cases | legal2.js | Legacy runtime |  |
| `lc_reports` | Legal & Compliance Reports | lc_reports | legal2.js | Legacy runtime |  |
| `lc_setup` | Legal & Compliance Setup | lc_setup | legal2.js | Legacy runtime |  |
| `lc_audit` | Legal & Compliance Audit Trail | lc_audit | legal2.js | Partial | see recipe; data model partly exists |
| `lib` | Library | lib | library.js | Legacy runtime |  |
| `lms` | Learning Management | lms | lms.js | Legacy runtime |  |
| `lrc` | Outcomes & Report Cards | lrc | lrcard.js | Legacy runtime |  |
| `meet` | Meetings | meet | meet.js | Legacy runtime |  |
| `mm_home` | Maintenance Management | mm_home | mm2.js | Legacy runtime |  |
| `it_home` | IT Management | it_home | mm2.js | Legacy runtime |  |
| `moves` | Student moves | smv | moves.js | Partial | see recipe; data model partly exists |
| `myday` | My Day | myday | myday.js | Ported | / (My day) |
| `onlinepay` | Online payments | opay | onlinepay.js | Legacy runtime |  |
| `exec` | Executive Dashboard | exec | pages2.js | Ported | /dashboard |
| `strength` | Strength, Target & Capacity | strength | pages2.js | Legacy runtime |  |
| `targets` | Target Planning | targets | pages2.js | Legacy runtime |  |
| `capacity` | Capacity Setup & Planning | capacity | pages2.js | Legacy runtime |  |
| `admplan` | Admission Target Achievement Plan | admplan | pages2.js | Legacy runtime |  |
| `revenue` | Revenue, Collection & Outstanding | revenue | pages2.js | Ported | /dashboard + report branch_scorecard |
| `compare` | Multi-year Comparison | compare | pages2.js | Legacy runtime |  |
| `masters` | Student & Fee Category Masters | masters | pages2.js | Ported | /fees/structures (fee heads/structures; categories legacy runtime) |
| `import` | Data Import (Excel) | import | pages2.js | Legacy runtime |  |
| `hierarchy` | Organisation & directors | admin_mapping | pages2.js | Legacy runtime |  |
| `cancel` | Cancellations & Withdrawals | cancel | pages2.js | Legacy runtime |  |
| `py_home` | Payroll Dashboard | py_home | payroll.js | Partial | see recipe; data model partly exists |
| `py_run` | Payroll Processing | py_run | payroll.js | Ported | /hr/payroll |
| `py_salary` | Salary Structures | py_salary | payroll.js | Partial | see recipe; data model partly exists |
| `py_bank` | Staff Bank Information | py_bank | payroll.js | Legacy runtime |  |
| `py_reports` | Payroll Reports | py_reports | payroll.js | Ported | /hr/payroll (bank file) + report employees |
| `portal` | Parent & Student app | portal | portal.js | Ported | Parent role + /students/:id (full portal legacy runtime) |
| `pr_home` | Store & Purchase Dashboard | pr_home | proc_pages.js | Legacy runtime |  |
| `pr_mr` | Material Requests | pr_mr | proc_pages.js | Legacy runtime |  |
| `pr_pr` | Purchase Requests | pr_pr | proc_pages.js | Legacy runtime |  |
| `pr_inbox` | Approvals Inbox | pr_inbox | proc_pages.js | Legacy runtime |  |
| `pr_store` | Store & Inventory | pr_store | proc_pages3.js | Legacy runtime |  |
| `pr_vendors` | Vendors & Quotations | pr_vendors | proc_pages3.js | Legacy runtime |  |
| `pr_po` | Purchase Orders | pr_po | proc_pages3.js | Legacy runtime |  |
| `pr_budget` | Budget & Finance Controls | pr_budget | proc_pages3.js | Legacy runtime |  |
| `pr_reports` | Store & Purchase Reports | pr_reports | proc_reports.js | Legacy runtime |  |
| `pr_admin` | Store & Purchase Settings | pr_admin | proc_reports.js | Legacy runtime |  |
| `psd_home` | Salary release | psd_home | psd2.js | Legacy runtime |  |
| `psd_me` | My salary status | psd_me | psd2.js | Legacy runtime |  |
| `qps` | Question Paper Security | qps | qpsec.js | Legacy runtime |  |
| `rbuild` | Report builder | email | rbuild.js | Ported | /reports |
| `refunds` | Refunds & concessions | rfc | refunds.js | Ported | /fees/approvals |
| `reminders` | Fee reminders | fdm | reminders.js | Legacy runtime |  |
| `rm_import` | Rent – Tally Excel Import | rm_import | rent_import.js | Legacy runtime |  |
| `rm_home` | Rent Management | rm_home | rent_pages.js | Legacy runtime |  |
| `rm_master` | Rent Master | rm_master | rent_pages.js | Legacy runtime |  |
| `rm_entries` | Monthly Rent Processing | rm_entries | rent_pages.js | Legacy runtime |  |
| `rm_ledger` | Rent Accounting & Payments | rm_ledger | rent_pages.js | Legacy runtime |  |
| `rm_reports` | Rent Reports | rm_reports | rent_pages2.js | Legacy runtime |  |
| `rm_admin` | Rent Control Centre | rm_admin | rent_pages2.js | Legacy runtime |  |
| `dashboard` | Management Dashboard | dashboard | reports.js | Ported | /dashboard |
| `daily` | Daily Branch Collection | daily | reports.js | Ported | /fees/receipts (day totals) + report daily_collection_summary |
| `target` | Monthly Collection Target | target | reports.js | Partial | see recipe; data model partly exists |
| `instalment` | Instalment-wise Dues & Outstanding | instalment | reports.js | Legacy runtime |  |
| `zeropayer` | Zero Payer Analysis | zeropayer | reports.js | Legacy runtime |  |
| `students` | Student Corner | students | reports.js | Ported | /students |
| `alerts` | Alerts & Escalations | alerts | reports.js | Ported | /notifications + /gaps (matrix) |
| `exceptions` | Exceptions & Reconciliation | exceptions | reports.js | Legacy runtime |  |
| `email` | Daily Email Reports | email | reports.js | Ported | /admin/audit (Email log) + scheduled reports |
| `rollover` | Backup & Year-end | rov | rollover.js | Legacy runtime |  |
| `sis` | Student Information System | sis | sis.js | Ported | /students/:id |
| `content` | Content library | scl | smartclass.js | Legacy runtime |  |
| `teach` | Teach | scl | smartclass.js | Legacy runtime |  |
| `devices` | Classroom devices & sync | sdev | smartclass.js | Legacy runtime |  |
| `acdash` | Academic dashboards | acpl | smartclass2.js | Ported | /dashboard (attendance KPIs only) |
| `smk` | Smart Classroom & Kits | smk | smartkits.js | Legacy runtime |  |
| `srf_dashboard` | SRF dashboard | srf | srf_native.js | Ported | /admissions (SRF stage + funnel) |
| `srf_verification` | SRF verification | srf | srf_native.js | Legacy runtime |  |
| `srf_payment` | SRF payments | srf | srf_native.js | Legacy runtime |  |
| `srf_reports` | SRF reports | srf | srf_native.js | Partial | see recipe; data model partly exists |
| `srf_submission` | SRF request | srf | srf_native.js | Legacy runtime |  |
| `sa_home` | Super Admin Dashboard | sa_home | superadmin.js | Ported | /admin/users |
| `sa_modules` | Module Control | sa_modules | superadmin.js | Legacy runtime |  |
| `sa_access` | Access & Sensitive Data | sa_access | superadmin.js | Legacy runtime |  |
| `sa_rules` | Data Access Rules | sa_rules | superadmin.js | Legacy runtime |  |
| `sa_workflows` | Approval Workflows | sa_workflows | superadmin.js | Legacy runtime |  |
| `sa_requests` | Access Requests | sa_requests | superadmin.js | Legacy runtime |  |
| `sa_reports` | Access & Security Reports | sa_reports | superadmin.js | Partial | see recipe; data model partly exists |
| `tac` | Teacher Academy | tac | tacademy.js | Legacy runtime |  |
| `tasks` | Task & approval center | tasks | taskcentre.js | Ported | /tasks |
| `tcv_home` | Technician Conveyance & Daily Work Report | tcv_home | tc2.js | Legacy runtime |  |
| `tc_app` | Technician App | tc_app | tc3.js | Legacy runtime |  |
| `mm_app` | Maintenance Manager App | tcm_app | tc3.js | Legacy runtime |  |
| `transport` | Transport | tnp | transport.js | Legacy runtime |  |
| `udise` | UDISE+ & Compliance | udise | udise.js | Legacy runtime |  |
| `ut_home` | Utilities Dashboard | ut_home | util_pages.js | Legacy runtime |  |
| `ut_conns` | Utility Connections | ut_conns | util_pages.js | Legacy runtime |  |
| `ut_bills` | Utility Bills & Payments | ut_bills | util_pages.js | Legacy runtime |  |
| `ut_meters` | Consumption, Meters & Water Tankers | ut_meters | util_pages.js | Legacy runtime |  |
| `ut_ptax` | Property Tax | ut_ptax | util_pages.js | Legacy runtime |  |
| `ut_rent` | Rent & Leases | ut_rent | util_pages.js | Legacy runtime |  |
| `ut_tickets` | Utility Complaints & Renewals | ut_tickets | util_pages.js | Legacy runtime |  |
| `ut_reports` | Utilities Reports | ut_reports | util_pages2.js | Legacy runtime |  |
| `ut_admin` | Utilities Control Centre | ut_admin | util_pages2.js | Legacy runtime |  |
