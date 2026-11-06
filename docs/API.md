# API reference

Base URL `/api/v1`. Auth: `Authorization: Bearer <JWT>` from `POST /auth/login`. All responses are JSON: success `{"data": …, "total"?: n}`; error `{"error": {"code", "message", "details", "correlation_id"}}` with HTTP 400 validation_error · 401 unauthorized · 403 forbidden · 404 not_found · 409 conflict · 422 policy_violation · 500 server_error.

Permission column = `module:action` checked by `@require`; `login` = any signed-in user (role logic inside the handler). Branch scope is applied on top of permissions (see ARCHITECTURE.md).

| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/api/v1/admissions/leads` | admissions:View |  |
| POST | `/api/v1/admissions/leads` | admissions:Add |  |
| GET | `/api/v1/admissions/leads/<lid>` | admissions:View |  |
| POST | `/api/v1/admissions/leads/<lid>/follow-up` | admissions:Edit |  |
| POST | `/api/v1/admissions/leads/<lid>/stage` | admissions:Edit |  |
| GET | `/api/v1/admissions/stages` | login |  |
| POST | `/api/v1/attendance/self-checkin` | login | Mobile PWA: a staff user marks own presence (geo/device stamp recorded in audit). |
| GET | `/api/v1/attendance/staff` | hr:View |  |
| POST | `/api/v1/attendance/staff` | hr:Add |  |
| GET | `/api/v1/attendance/statuses` | login |  |
| GET | `/api/v1/attendance/students` | attendance:View | Roster + existing marks for branch/class/section/date/period. |
| POST | `/api/v1/attendance/students` | attendance:Add | Bulk mark: {branch_id, class_name, section?, date, period, marks:[{student_id,status}], reason?}. |
| GET | `/api/v1/attendance/students/<sid>/summary` | attendance:View |  |
| GET | `/api/v1/audit` | audit:View |  |
| POST | `/api/v1/auth/change-password` | login |  |
| POST | `/api/v1/auth/login` | login |  |
| POST | `/api/v1/auth/logout` | login |  |
| GET | `/api/v1/auth/me` | login |  |
| GET | `/api/v1/branches` | login |  |
| POST | `/api/v1/branches` | admin:Add |  |
| GET | `/api/v1/cash/closings` | cash:View |  |
| POST | `/api/v1/cash/closings` | cash:Add |  |
| POST | `/api/v1/cash/closings/<cid>/verify` | cash:Verify |  |
| GET | `/api/v1/cash/expected` | cash:View |  |
| GET | `/api/v1/cash/handovers` | cash:View |  |
| POST | `/api/v1/cash/handovers` | cash:Add |  |
| POST | `/api/v1/cash/handovers/<hid>/transition` | cash:Verify |  |
| GET | `/api/v1/dashboard/brief` | login |  |
| GET | `/api/v1/dashboard/kpis` | login |  |
| GET | `/api/v1/dashboard/search` | login |  |
| GET | `/api/v1/fees/concessions` | fees:View |  |
| POST | `/api/v1/fees/concessions` | fees:Add |  |
| POST | `/api/v1/fees/concessions/<cid>/decide` | fees:Approve |  |
| GET | `/api/v1/fees/heads` | fees:View |  |
| POST | `/api/v1/fees/heads` | fees:Configure Settings |  |
| GET | `/api/v1/fees/modes` | login |  |
| GET | `/api/v1/fees/receipts` | fees:View |  |
| POST | `/api/v1/fees/receipts` | fees:Add |  |
| GET | `/api/v1/fees/receipts/<rid>` | fees:View |  |
| POST | `/api/v1/fees/receipts/<rid>/cancel` | fees:Delete |  |
| GET | `/api/v1/fees/refunds` | fees:View |  |
| POST | `/api/v1/fees/refunds` | fees:Add |  |
| POST | `/api/v1/fees/refunds/<rid>/transition` | fees:Approve |  |
| GET | `/api/v1/fees/structures` | fees:View |  |
| POST | `/api/v1/fees/structures` | fees:Configure Settings |  |
| POST | `/api/v1/fees/structures/<sid>/approve` | fees:Approve |  |
| GET | `/api/v1/fees/students/<sid>/balance` | fees:View |  |
| GET | `/api/v1/gaps` | gaps:View |  |
| GET | `/api/v1/gaps/<gid>` | gaps:View |  |
| POST | `/api/v1/gaps/<gid>/reassign` | gaps:Approve |  |
| POST | `/api/v1/gaps/<gid>/transition` | gaps:Edit |  |
| GET | `/api/v1/gaps/matrix` | gaps:View |  |
| PUT | `/api/v1/gaps/matrix/<category>` | gaps:Configure Settings |  |
| GET | `/api/v1/gaps/meta` | login |  |
| GET | `/api/v1/gaps/rules` | gaps:View |  |
| PATCH | `/api/v1/gaps/rules/<rid>` | gaps:Configure Settings |  |
| POST | `/api/v1/gaps/scan` | gaps:Approve |  |
| GET | `/api/v1/gaps/summary` | gaps:View |  |
| GET | `/api/v1/hr/employees` | hr:View |  |
| POST | `/api/v1/hr/employees` | hr:Add |  |
| GET | `/api/v1/hr/employees/<eid>` | hr:View |  |
| PATCH | `/api/v1/hr/employees/<eid>` | hr:Edit |  |
| GET | `/api/v1/hr/leave` | login |  |
| POST | `/api/v1/hr/leave` | login |  |
| POST | `/api/v1/hr/leave/<lid>/decide` | hr:Approve |  |
| GET | `/api/v1/hr/payroll` | payroll:View |  |
| POST | `/api/v1/hr/payroll` | payroll:Add |  |
| GET | `/api/v1/hr/payroll/<rid>` | payroll:View |  |
| GET | `/api/v1/hr/payroll/<rid>/bank-file` | payroll:Export |  |
| POST | `/api/v1/hr/payroll/<rid>/lines/<int:lid>/exclude` | payroll:Verify |  |
| POST | `/api/v1/hr/payroll/<rid>/transition` | login |  |
| GET | `/api/v1/legacy/bootstrap` | legacy:View |  |
| GET | `/api/v1/legacy/changes` | legacy:View |  |
| POST | `/api/v1/legacy/colls/<coll>` | legacy:Add |  |
| PATCH | `/api/v1/legacy/colls/<coll>/<rid>` | legacy:Add |  |
| PUT | `/api/v1/legacy/colls/<coll>/<rid>` | legacy:Add |  |
| PUT | `/api/v1/legacy/docs/<key>` | legacy:Add |  |
| GET | `/api/v1/legacy/me` | login | Resolve the legacy user record for the signed-in user: stored link → email match → role-name match → Super Admin fallback. |
| POST | `/api/v1/legacy/me` | admin:Edit | Admin: link a platform user to a legacy user id. {user_id, legacy_user_id} |
| GET | `/api/v1/notifications` | login |  |
| POST | `/api/v1/notifications/<nid>/ack` | login |  |
| POST | `/api/v1/notifications/<nid>/read` | login |  |
| POST | `/api/v1/notifications/read-all` | login |  |
| GET | `/api/v1/reports/datasets` | reports:View |  |
| GET | `/api/v1/reports/definitions` | reports:View |  |
| POST | `/api/v1/reports/definitions` | reports:Add |  |
| GET | `/api/v1/reports/emails` | audit:View |  |
| POST | `/api/v1/reports/export` | reports:Export |  |
| POST | `/api/v1/reports/run` | reports:View |  |
| GET | `/api/v1/reports/runs` | reports:View |  |
| GET | `/api/v1/roles` | admin:View |  |
| PUT | `/api/v1/roles/<rid>/permissions` | admin:Configure Settings |  |
| GET | `/api/v1/sections` | login |  |
| POST | `/api/v1/sections` | admin:Add |  |
| GET | `/api/v1/students` | students:View |  |
| POST | `/api/v1/students` | students:Add |  |
| GET | `/api/v1/students/<sid>` | students:View |  |
| PATCH | `/api/v1/students/<sid>` | students:Edit |  |
| POST | `/api/v1/students/<sid>/demands/generate` | fees:Add |  |
| GET | `/api/v1/tasks/checklist` | login | Today's (or this month's) checklist for the user's role & branch — auto-created on first open. |
| POST | `/api/v1/tasks/checklist/items/<int:iid>` | login |  |
| GET | `/api/v1/tasks/delegations` | login |  |
| POST | `/api/v1/tasks/delegations` | login |  |
| POST | `/api/v1/tasks/delegations/<did>/revoke` | login |  |
| GET | `/api/v1/users` | admin:View |  |
| POST | `/api/v1/users` | admin:Add |  |
| PATCH | `/api/v1/users/<uid>` | admin:Edit |  |
| GET | `/api/v1/users/<uid>/mappings` | admin:View |  |
| POST | `/api/v1/users/<uid>/mappings` | admin:Edit |  |
| GET | `/health` | login |  |
## Request bodies (main write endpoints)

| Endpoint | Body |
|---|---|
| POST /auth/login | `{username, password}` → `{token, user}` |
| POST /students | `{name, branch_id, class_name, section?, parent_name?, mobile?, dob?, generate_demands?=true}` |
| PATCH /students/{id} | any editable field + `reason` (≥5 chars) |
| POST /admissions/leads | `{branch_id, name, class_name, mobile, parent_name?, source?, next_follow_up?}` (409 on duplicate open mobile) |
| POST /admissions/leads/{id}/stage | `{to, note?, srf_amount? (for "SRF Paid"), section? (for "Admitted")}` — stages cannot be skipped; Admitted triggers auto-onboarding |
| POST /fees/receipts | `{student_id, mode, reference?, receipt_date?, lines:[{demand_id, amount}]}` |
| POST /fees/receipts/{id}/cancel | `{reason}` (≥10 chars; blocked once the cash day is verified) |
| POST /fees/concessions | `{student_id, kind, amount, document, reason?}` → Requested; `/decide` `{approve, note?}` (maker ≠ approver) |
| POST /fees/refunds | `{student_id, amount, reason}`; `/transition` `{to: Approved|Rejected|Paid, note?}` |
| POST /cash/closings | `{closing_date?, denominations:{"500":n,…}, reason? (required if difference)}` → creates handover automatically |
| POST /cash/handovers/{id}/transition | `{to: Accepted|Rejected|Deposited, accepted_amount?, deposit_ref?, note?}` |
| POST /attendance/students | `{branch_id, class_name, section?, date?, period?=0, marks:[{student_id,status}], reason? (back-dated)}` |
| POST /attendance/staff | `{branch_id, date?, marks:[{employee_id,status}], reason?}` |
| POST /hr/leave | `{kind, from_date, to_date, reason, employee_id?}`; `/decide` `{approve, note?}` |
| POST /hr/payroll | `{ym:"2026-10", branch_id?}`; `/transition` `{to, note?}` through Draft → Finance verified → CFO approved → Bank file generated → Paid |
| POST /gaps/{id}/transition | `{to, note?, file?}` Open→Acknowledged→In progress→Resolved (High/Critical need `file`) |
| POST /reports/run | `{dataset, columns?, filters?:{where:[{col,op,val}]}, group_by?, sort_by?, sort_desc?, limit?}` |
| POST /reports/definitions | same + `{name, shared_roles?, schedule?:{hour, weekday?, to:[emails]}}`; include `id` to create a new version |
| PUT /legacy/docs/{key} | `{v, version?}` → `{version}`; 409 with `details.{version,v}` when stale |
| POST /legacy/colls/{coll} | record object → `{id}` (colls: audit, approvals, emaillog, views, srfsubs, ailog) |
| PUT /roles/{id}/permissions | `{permissions:{module:[actions]}, reason}` |
