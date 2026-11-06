# Database

MySQL 8, `utf8mb4`. Schema is defined by the SQLAlchemy models (`backend/app/models`) and versioned by Alembic (`backend/migrations/versions`). **Never change the schema by hand**; change a model and generate a migration (DEVELOPER-GUIDE §3.1).

All business tables share `id CHAR(32)` (UUID hex), `created_at`, `updated_at`, `created_by`.

## Tables by module (39)

| Module | Tables | Key relationships / constraints |
|---|---|---|
| Organisation | `entities`, `branches`, `academic_years`, `sections` | `branches.entity_id → entities`; `branches.code` unique; `sections(branch_id,class_name,name)` unique |
| Auth & audit | `roles`, `role_permissions`, `users`, `access_mappings`, `audit_logs`, `notifications` | `users.role_id → roles`; `users.username` unique; `role_permissions(role_id,module,action)` unique; `audit_logs` is append-only (old/new JSON) |
| Students & admissions | `students`, `leads`, `lead_events` | `students.admission_no` unique; `leads.student_id → students` once admitted; `lead_events` timeline |
| Fees | `fee_heads`, `fee_structures`, `fee_demands`, `receipts`, `receipt_lines`, `concessions`, `refunds` | `fee_demands(student_id,academic_year,head_id,instalment_no)` unique; `receipt_lines.demand_id → fee_demands` (what each receipt paid); `receipts.no` unique + HMAC `signature` |
| Cash | `cashier_closings`, `cash_handovers` | `cashier_closings(branch_id,closing_date,cashier_id)` unique; handover state Submitted→Accepted→Deposited/Rejected |
| Attendance | `student_attendance`, `staff_attendance` | `(student_id, att_date, period)` unique; period 0 = daily |
| HR & payroll | `employees`, `leave_requests`, `payroll_runs`, `payroll_lines` | `employees.emp_code` unique; `payroll_runs(ym, branch_id)` one per month per branch; lines cascade |
| Gap analysis | `gap_rules`, `gap_records`, `gap_history`, `escalation_levels` | `gap_records.dedupe_key` prevents duplicates while open; `escalation_levels(category, level)` |
| Tasks | `delegations`, `checklists`, `checklist_items` | `checklists(branch_id, kind, period)` |
| Reports & settings | `report_definitions`, `report_runs`, `email_logs`, `settings` | `settings.key` holds numbering sequences `seq:<PREFIX>:<BRANCH>:<FY>` and app settings |

## Core relationships (ERD, text form)

```
entities 1─n branches 1─n sections
branches 1─n students 1─n fee_demands n─1 fee_heads
students 1─n receipts 1─n receipt_lines n─1 fee_demands
students 1─n concessions / refunds / student_attendance
leads n─1 branches ; leads 1─1 students (after admission) ; leads 1─n lead_events
users n─1 roles 1─n role_permissions ; users 1─n access_mappings ; users 1─n notifications
employees n─1 branches ; employees 1─n leave_requests / staff_attendance / payroll_lines n─1 payroll_runs
gap_rules (code) 1─n gap_records 1─n gap_history ; escalation_levels by category
cashier_closings n─1 branches ; cash_handovers n─1 branches
report_definitions 1─n report_runs ; email_logs ; settings
```

## Money & dates
* Amount columns `DECIMAL(12,2)`; balances are computed (`amount - concession - paid`) rather than stored, so the receipt/demand link is the single truth.
* Financial year for numbering starts 1 April (`services/numbering.fy`).

## Migration workflow
```bash
alembic upgrade head          # apply
alembic current / history     # inspect
alembic revision --autogenerate -m "msg"   # after editing models
alembic check                 # drift check (CI)
alembic downgrade -1          # rollback one
```
`migrations/env.py` reads `DATABASE_URL`; `render_as_batch` is on for SQLite so the same migrations run in tests.

## Seed data
`python -m scripts.seed` creates: 15 roles with permissions, 17 gap rules + default escalation matrix per category, academic year, super admin; with demo (default) 4 branches, fee heads/structures for 13 classes, ~165 students with demands/receipts/attendance, ~48 employees with attendance, ~60 leads, users per branch. `--no-demo` for production.

## Backup / restore
See DEVELOPER-GUIDE §8.5. Automatic backups are configured in `deploy/oci/terraform/main.tf` (`backup_policy`), deletion protection on.
