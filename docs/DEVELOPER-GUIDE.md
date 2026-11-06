# Developer guide

This guide is written so that a developer who has never seen the code can set up, extend, and — most importantly — **diagnose and fix any error in the code or the database** by following the procedures in §6–§8.

## 1. Setup

Prerequisites: Python 3.12+, Node 22+, MySQL 8 (or Docker). Optional: `mysql` CLI.

```bash
git clone … msea-erp && cd msea-erp
cd backend && python -m venv .venv && . .venv/bin/activate && pip install -r requirements-dev.txt
cp .env.example .env   # edit DATABASE_URL, SECRET_KEY, JWT_SECRET
alembic upgrade head && python -m scripts.seed
flask --app wsgi run --port 8000 --debug
cd ../frontend && npm install && npm run dev
```
`.env` is read by `python-dotenv` only if you `export $(cat .env | xargs)` or use docker-compose; for plain `flask run` export the variables (or use `direnv`).

## 2. Conventions

* IDs are 32-char UUID hex strings (`new_id()`); document numbers (`RCP/HYD/2627/000123`) come from `services/numbering.next_no()` and are per prefix/branch/financial year with `SELECT … FOR UPDATE`.
* Money: `Numeric(12,2)` columns; convert to `float()` before arithmetic with Python floats, or use `Decimal` throughout (see `services/fees.py`).
* Dates: `Date` columns, ISO strings in JSON; `datetime` stored naive UTC.
* Every write endpoint: validate → `assert_scope(branch_id)` → service → `audit.record(...)` → `s.commit()`.
* Every state machine lives in a service and raises `Conflict` (409) for an illegal transition, `PolicyViolation` (422) for a business rule.
* Frontend: one file per module in `src/pages`; shared UI only in `components/ui.tsx`; never call `fetch` directly, use `lib/api.ts`.
* Error messages shown to users are the backend's messages; keep them actionable ("Reference is mandatory for non-cash payments").

## 3. How to add things

### 3.1 A new table / column
1. Edit the model in `backend/app/models/*.py` (import it in `models/__init__.py` if new).
2. `cd backend && alembic revision --autogenerate -m "add student photo"` → review the file in `migrations/versions/` (autogenerate misses renames and server defaults; edit by hand if needed).
3. `alembic upgrade head`; `alembic check` must print "No new upgrade operations detected".
4. Add a test in `tests/`. Run `pytest -q`.
Downgrade: `alembic downgrade -1`. History: `alembic history`. Current: `alembic current`.

### 3.2 A new API endpoint
Add a function to the blueprint in `app/api/<module>.py`:
```python
@bp.post("/things")
@require("things", "Add")          # module must exist in RBAC seed (scripts/seed.py ROLES) and the frontend MODULES list
def add_thing():
    d = body(); need(d, "name"); s = db()
    assert_scope(d.get("branch_id"))
    t = svc.create_thing(s, d)     # business rule in app/services/things.py
    s.commit(); return ok(t.to_dict()), 201
```
Then document it (docs/API.md is generated: rerun the generator snippet in the commit history or add the row manually).

### 3.3 A new screen
1. Create `frontend/src/pages/Things.tsx` using `useList/useOne/useAction` and `DataTable` (gives mobile layout for free).
2. Register the route in `App.tsx` inside `<Guard mod="things">`.
3. Add the nav item in `components/Shell.tsx` (`NAV` with `mod`), and optionally to the mobile bottom bar.
4. `npm run build` must pass (strict TypeScript).

### 3.4 A new gap rule (automation)
1. Write a detector in `app/services/gap_engine.py`: `def d_my_rule(s, today, cfg) -> list[Finding]` returning one `Finding` per gap with a **stable `dedupe_key`** (same situation → same key, so re-scans update instead of duplicating).
2. Register it in `DETECTORS["MY-RULE"]` and add the row to `RULES` (owner/reviewer roles, risk, due days, action text). `seed_rules()` is idempotent — rerun `python -m scripts.seed --no-demo`.
3. Test: create the condition in a test, call `POST /gaps/scan`, assert a gap exists; call again, assert `created == 0`.

### 3.5 A new report dataset
Add `def ds_x(s, bids, filters) -> list[dict]` in `app/services/reports.py` and register in `DATASETS`. Always apply `_scope(query, column, bids)`. The report builder UI discovers columns automatically.

### 3.6 Changing a legacy (runtime) screen
Edit the original module in `frontend/legacy/src/*.js`, run `node legacy/build-legacy.mjs` (or `npm run dev`). If the build says *patch mismatch*, a line that the bridge rewrites has changed — update `PATCHES` in `build-legacy.mjs` (see LEGACY-RUNTIME.md). Test with the legacy smoke script pattern (login → `/app/myday` → `window.MSEA_LEGACY.go(key)` for every key in `src/legacy/directory.json`, assert no "This screen hit an error").

### 3.7 A new role or permission
Edit `ROLES` in `scripts/seed.py` and rerun the seed (it rewrites permissions for system roles), or use Admin → Roles in the UI (audited, needs a reason).

## 4. Testing

* `pytest -q` — API tests on in-memory SQLite (`TestConfig`). Fixtures build roles from the seed so RBAC tests reflect production.
* `alembic check` — schema drift.
* `npm run build` — type check + bundle. For a browser smoke test use Playwright (`npx playwright` is not bundled; see `/tmp/claude-0/e2e.cjs` pattern in the QA notes: login, visit each route, assert no console errors / no horizontal overflow on Pixel 7 and 1366 px).

## 5. Logging & observability

* Each request has `X-Request-Id` (sent back in the response header). Every logged error carries `cid=<id>`; users see the same id in the error toast ("ref abc123"). **Grep the API log for that id to find the stack trace.**
* `GET /health` returns `{"status","db"}` — used by the OCI LB and Docker healthcheck.
* Audit log (Admin → Audit) is the business-level trail; application log is the technical one.

## 6. Error & issue → fix procedures (code)

Use this table first; §8 has the database ones.

| Symptom (what you see) | Where to look | Cause | Fix |
|---|---|---|---|
| UI toast "Internal error; quote the correlation id (ref X)" | `docker compose logs api \| grep X` | Unhandled Python exception | Read the traceback line in `app/...`; reproduce with a pytest that calls the same endpoint; fix; add the test. |
| HTTP 500 `TypeError: Object of type Decimal is not JSON serializable` | handler returning a dict with Decimal | Money column passed raw into `jsonify`/JSON column | Use `to_dict()` (converts Decimal) or `float()`. The engine JSON serializer (`core/db.json_dumps`) already handles JSON columns. |
| `TypeError: unsupported operand type(s) for *: 'decimal.Decimal' and 'float'` | service arithmetic | Mixing Decimal columns with floats | `float(col)` or `Decimal(str(x))` consistently. |
| 403 "You need 'Add' on 'fees'" but role should have it | `role_permissions` table / `scripts/seed.py` | Permission missing or JWT issued before role change | Fix role via Admin → Roles (or seed), user re-logs in (permissions are read per request, so only role *changes* on the user need re-login). |
| 403 "That branch is outside your access scope" | `core/security.compute_scope` | User has a branch but the record belongs to another; or mapping expired (`valid_to`) | Add an `access_mappings` row (Admin → Users → mappings) or correct the user's branch. Head-office users with no branch get all branches. |
| 401 right after login / token invalid | `JWT_SECRET` differs between web and scheduler containers or was rotated | Secret mismatch | Set the same `JWT_SECRET` in every container; rotating it logs everyone out (expected). |
| 422 `policy_violation` | message text | A business rule in `app/services` | Not a bug: the message tells the user what to change. If the rule itself is wrong, change it in the service and its test. |
| 409 `conflict` | message | Illegal state transition / duplicate | Check the state machine table in USER-WORKFLOW.md; duplicates (receipt no, admission no) mean a seed/import issue — see §8.3. |
| `No new upgrade operations detected` expected but missing after model edit | Alembic | Model file not imported in `models/__init__.py` | Import it; rerun `alembic revision --autogenerate`. |
| `alembic.util.exc.CommandError: Can't locate revision` | `alembic_version` table vs `migrations/versions` | DB stamped with a revision that no longer exists (branch switch) | `alembic history`; `alembic stamp <existing revision>` to the one the schema really matches, then `upgrade head`. |
| Scheduler jobs run twice / notifications duplicated | `SCHEDULER_ENABLED` | Enabled in web workers too | Only the `scheduler` service may have `SCHEDULER_ENABLED=1`; web containers `0`. |
| Scheduler never runs | logs show "scheduler started with 4 jobs" missing | `SCHEDULER_ENABLED=0` everywhere, or container crashed | Check `docker compose ps scheduler`; run a job manually: `flask --app wsgi shell` → `from app.services.scheduler import job_gap_scan; job_gap_scan(app)`. |
| Gap appears every day as a new record | `dedupe_key` | Detector key includes a changing value (date, amount) | Make the key stable (ids only); resolve the duplicates in UI. |
| CORS error in browser console | `CORS_ORIGINS` | Frontend origin not listed | Add it (comma separated) and restart api. In production nginx proxies `/api` on the same origin so CORS is not needed. |
| PWA shows an old version after deploy | service worker | Cached shell | Workbox `autoUpdate` refreshes on next navigation; make sure nginx serves `sw.js` with `Cache-Control: no-cache` (provided). Users can hard-refresh. |
| White screen on phone, works on desktop | browser console | JS error in a mobile-only branch of `DataTable`/`Modal` | Run Playwright with `devices['Pixel 7']`; fix the TSX; `npm run build`. |
| Horizontal scroll on phone | CSS | A fixed-width element (table not wrapped, long unbroken string) | Wrap tables in `.tbl-wrap`; use `DataTable`; add `min-width: 0` to flex children. |
| `sqlite3.InterfaceError: bad parameter or other API misuse` (local dev only) | SQLite + threads | Shared connection across threads | Only `:memory:` uses StaticPool now; use a file DB (`sqlite:///dev.db`) or MySQL. Never SQLite in production. |
| Legacy screen shows "This screen hit an error: …" | browser console, the module file named in the stack | JS exception inside the original module | Fix in `frontend/legacy/src/<module>.js`, rebuild; the error text is the original module's message. |
| Legacy screen: "The change could not be saved: conflict" | `/legacy/docs/<key>` 409 | Another user saved the same document first | Expected; the fresh copy is loaded, redo the change. Frequent conflicts on one document = port that module natively (row-level tables). |
| `/app/...` shows "Could not load. Route not found" or "API server is an older version" | `GET /api/v1/legacy/bootstrap` → 404 | The Flask process was started from an older copy of the backend (no `legacy` blueprint) | Stop the old API; from **this** package: `cd backend && alembic upgrade head && python -m scripts.seed --no-demo && flask --app wsgi run --port 8000`. Check `flask --app wsgi routes \| grep legacy` lists 8 routes. |
| `/app/...` shows "failed /legacy/vendor/…" or unstyled buttons in dev | `GET /legacy/legacy.css` returns HTML | `public/legacy` missing when the dev server started | Fixed: `vite.config.ts` builds the runtime before Vite indexes `public/`. On older copies: stop Vite, run `node legacy/build-legacy.mjs`, start Vite again. |
| `/app/...` shows "Loading module…" forever | Network tab: `/legacy/legacy-app.js` or `/legacy/bootstrap` | Bundle not built (`public/legacy` missing) or `legacy:View` missing on the role | `npm run build` (runs the builder); give the role `legacy` View/Add (seed or Admin → Roles). |
| Legacy screen renders as wrong user / "no access" everywhere | `GET /legacy/me` | Platform user not linked to a legacy user record with that role | Link with `POST /legacy/me {user_id, legacy_user_id}` (Admin) or create the legacy user under Admin control centre → Users with the same e-mail. |
| Styles of a native page look different after adding CSS | `vite.config.ts` postcss | Selector excluded from the `.nx` prefix (html/body/:root are intentionally global) | Keep page styles class-based; never style bare elements globally. |
| Tests pass locally but fail in CI with MySQL-specific SQL | dialect | SQLite vs MySQL differences (`ILIKE`, `func.if`) | Keep queries dialect-neutral (`ilike` is emulated; use `case()` not `if()`); run the suite against a MySQL `DATABASE_URL` before release. |

Debugging workflow: reproduce → write the failing pytest in `backend/tests` → fix → `pytest -q` → `alembic check` → `npm run build` → deploy.

## 7. Business-logic reference (where each rule lives)

| Rule | File / function |
|---|---|
| Fee demand generation, instalment dates | `services/fees.generate_demands` |
| Receipt validation, numbering, signature | `services/fees.collect`, `_sign` |
| Receipt cancel (before verified closing only) | `services/fees.cancel_receipt` |
| Concession application to demands, 4-eyes | `services/fees.decide_concession` |
| Refund states & SoD | `services/fees.refund_transition` |
| Cash closing, difference reason, auto handover | `services/fees.close_day` |
| Handover Submitted→Accepted→Deposited | `services/fees.handover_transition` |
| Lead stages, duplicate detector, lost reason | `services/admissions.move_stage`, `create_lead` |
| Auto-onboarding | `services/admissions.onboard` |
| Attendance locking/corrections, 3-day absence alert | `api/attendance.mark` |
| Leave approval (no self-approval) | `services/hr.decide_leave` |
| Payroll computation (PF/ESI/PT/TDS defaults), variance flags | `services/hr.compute_payroll` |
| Payroll approval chain | `services/hr.payroll_transition`, `bank_file` |
| Gap detectors, scan, escalation, compliance score | `services/gap_engine` |
| Daily brief & KPIs | `services/brief` |
| Report datasets, filters, grouping | `services/reports` |
| Checklists per role | `api/tasks.DAILY / MONTHLY` |

## 8. Error & issue → fix procedures (database)

### 8.1 Connecting
```bash
mysql -h <host> -u msea -p msea            # production via bastion
docker compose exec db mysql -umsea -pmsea msea   # local docker
```
Always take a backup before manual fixes: `mysqldump -h <host> -u msea -p --single-transaction msea > fix-$(date +%F).sql`.

### 8.2 Connection / startup errors
| Error | Fix |
|---|---|
| `pymysql.err.OperationalError: (2003) Can't connect` | Wrong host/port, NSG rule missing (app NSG → db NSG 3306), DB System stopped. Check `DATABASE_URL`, OCI console. |
| `(1045) Access denied` | Wrong user/password in `DATABASE_URL`. Reset in OCI → DB System → Users. |
| `(1049) Unknown database 'msea'` | `CREATE DATABASE msea CHARACTER SET utf8mb4;` then `alembic upgrade head`. |
| `(1146) Table 'msea.xxx' doesn't exist` | Migrations not applied: `alembic upgrade head`. If `alembic_version` is ahead of the real schema, `alembic stamp base` (empty DB only) then upgrade. |
| `(1054) Unknown column` | Code newer than schema (or vice versa). `alembic current` vs `alembic heads`; upgrade, or redeploy matching code. |
| `(2006) MySQL server has gone away` / `Lost connection` | Idle connections closed; `pool_pre_ping=True` is set — if persistent, raise `wait_timeout` on the DB System or lower gunicorn `--max-requests`. |
| `Incorrect string value: '\xE2\x82\xB9'` | Database/table not utf8mb4. `ALTER DATABASE msea CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;` and alter the table. |
| `Lock wait timeout exceeded` | A long transaction holds `settings` (numbering) or a receipt row. `SHOW PROCESSLIST;` kill the stuck session; keep transactions short (services commit per request). |

### 8.3 Data integrity problems
| Symptom | Diagnose | Repair |
|---|---|---|
| Duplicate document numbers | `SELECT no, COUNT(*) FROM receipts GROUP BY no HAVING COUNT(*)>1;` | Should be impossible (unique index). If from an import, renumber the later rows with `next_no` via a Flask shell script and record an audit entry. |
| Student balance wrong | `SELECT amount, concession, paid FROM fee_demands WHERE student_id=…;` compare with `SUM(receipt_lines.amount)` of Paid receipts | Recompute: in `flask shell` iterate demands and set `paid = sum(lines of non-cancelled receipts)`; cancelled receipts must have reversed `paid` (see `cancel_receipt`). |
| Receipt `signature_valid=false` | row edited directly in DB | Investigate in audit log; if legitimate, re-sign in shell: `r.signature = _sign(r)` and audit it with a reason. |
| Closing counted ≠ expected after a late receipt | receipt dated the closed day | Policy: receipt dates after closing are blocked; a late one means someone bypassed the API. Create a correcting handover; add a gap if needed. |
| Gap stuck Open although fixed | detector still fires | Run `POST /gaps/scan`; if the condition is gone, it auto-resolves. If the detector is wrong, fix it (§3.4). |
| Orphan rows after a manual delete | FK constraints are ON (`ondelete` set where cascading is intended) | Never delete business documents; cancel/reject instead. Restore from backup if needed. |
| Numbering sequence jumped | `settings` rows `seq:*` | Gaps in numbers are acceptable (rolled-back transactions); never reset a sequence downward. |

### 8.4 Migrations gone wrong
1. `alembic current` and `alembic history` — identify where the DB is.
2. Failed halfway (MySQL DDL is not transactional): read the migration, apply the remaining statements by hand, then `alembic stamp <rev>`.
3. Need to revert: `alembic downgrade -1` (ensure the migration has a real `downgrade()`), or restore the pre-deploy backup.
4. Autogenerate produced a drop you did not intend (e.g. renamed column): edit the migration to `op.alter_column(..., new_column_name=...)`.

### 8.5 Backup & restore
* OCI DB System: automatic daily backups (14-day retention, configured in Terraform) + manual backup before every release.
* Logical: `mysqldump --single-transaction msea | gzip > msea-$(date +%F).sql.gz` → upload to the `msea-backups` bucket (`oci os object put`).
* Restore test quarterly: create a temporary DB System from backup, run `alembic current`, point a staging API at it.

### 8.6 Performance
* Slow list endpoints: add an index in the model (`index=True`) + migration; existing indexes cover branch/date/student lookups.
* Reports on large data: datasets run in Python; convert heavy ones to SQL `GROUP BY` queries (see `ds_daily_collection_summary` for the pattern).
* `SQL_ECHO=1` prints queries in development.

## 9. Release checklist
1. `pytest -q`, `alembic check`, `npm run build` green in CI.
2. Backup DB. 3. Deploy api (runs `alembic upgrade head`). 4. Deploy web. 5. Check `/health`, sign in as a cashier on a phone, issue a test receipt in a test branch and cancel it. 6. Watch `grep ERROR` in logs for 30 min.
