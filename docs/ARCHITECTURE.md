# Architecture

## Overview

```
 Phone / Tablet / Desktop browser
 ┌───────────────────────────────┐
 │ React PWA (TypeScript)        │  installable, offline shell, service worker (Workbox)
 │  pages → hooks/useApi → lib/api (fetch + JWT)                                   
 └──────────────┬────────────────┘
                │ HTTPS  /api/v1/*
      OCI Load Balancer (TLS)
                │
   nginx (static PWA + reverse proxy)  ──►  Flask API (gunicorn, N workers)
                                                │  SQLAlchemy 2 / PyMySQL
                                                ▼
                                       MySQL 8 (HeatWave DB System)
   scheduler container (1 instance, SCHEDULER_ENABLED=1): APScheduler jobs → same DB
   Object Storage: uploads (photos, evidence files), DB backups
```

## Backend layering

| Layer | Folder | Rule |
|---|---|---|
| API | `app/api/*.py` | One blueprint per module. Parse/validate input, check permission (`@require`), call service, serialise. No business logic. |
| Services | `app/services/*.py` | All business rules, state machines, numbering, notifications, audit. Receive the SQLAlchemy session explicitly → unit-testable without Flask. |
| Models | `app/models/*.py` | Tables only. `TimestampMixin` gives UUID-hex `id`, `created_at/updated_at/created_by`, `to_dict()`. |
| Core | `app/core/` | config (env vars), db session, security, uniform errors, validation helpers. |

Request lifecycle: `before_request` assigns a correlation id → `current_user()` decodes JWT, loads user, computes `g.scope` (branch ids) and `g.perms` → handler → `teardown_appcontext` removes the scoped session (uncommitted work is rolled back automatically). Every error is converted by `core/errors.py` into `{"error": {...,"correlation_id"}}` and logged with the same id.

## Security model

* **Authentication**: username/password (Werkzeug scrypt hashes), JWT HS256 (`JWT_SECRET`, 10 h default), 5 failed logins → account Locked, forced password change at first login.
* **Authorisation (RBAC)**: `roles` × `role_permissions(module, action)`; actions = View, Add, Edit, Verify, Approve, Reject, Delete, Export, Configure Settings. `Super Admin` bypasses. Enforced server-side with `@require(module, action)`; the UI only hides what the user cannot do.
* **Branch scope**: `compute_scope()` = user's branch + `access_mappings` (All Branches / Zone / Region / State / Entity / Selected). Management roles and head-office users without a branch see everything. `scope_filter(query, column)` and `assert_scope(branch_id)` apply it to reads and writes.
* **Segregation of duties** inside services: maker ≠ approver for concessions, refunds, fee structures, payroll; cashier cannot accept own handover or verify own closing; approver cannot pay the refund.
* **Audit**: `services/audit.record()` writes who/what/old/new/reason/evidence/ip/device for every write. Sensitive edits require a reason (validated length).
* **Receipt integrity**: each receipt carries an HMAC signature of (no, student, total, date, mode); the API reports `signature_valid` so tampering in the DB is visible.
* Headers: `X-Content-Type-Options`, `X-Frame-Options`, CORS limited to `CORS_ORIGINS`.

## Automation (replaces the "maximum automatic" features of the old app)

| Job (`services/scheduler.py`) | When | What |
|---|---|---|
| `gap_scan` | 06:00 | Runs all active gap rules (`services/gap_engine.py`), dedupes by `dedupe_key`, auto-resolves cleared gaps, escalates per matrix, reminds owners |
| `daily_brief` | 07:00 | Executive brief to CEO/CFO/COO/Regional/Auditor as notification + email log |
| `cash_close_reminder` | 18:30 | Cashiers with cash receipts today and no closing |
| `scheduled_reports` | every 15 min | Saved report definitions with `schedule.hour` |

Event-driven automation lives in services: lead Admitted → **auto-onboarding** (student, admission no, section allocation, fee demands, notifications, welcome email); cash closing → **auto handover**; 3 consecutive absences → principal alert; cash difference → principal alert; leave request → approver alert; escalation → role notifications.

## Legacy module runtime (strangler)

The original 125 JS modules are built verbatim into `public/legacy/legacy-app.js` and mounted at `/app/:page` by `LegacyHost.tsx`. `src/legacy/bridge.ts` implements the storage contract the original `Store` expects on top of `/api/v1/legacy/*` (documents in `legacy_docs`, records in `legacy_records`, optimistic versions, 30 s change polling), supplies the platform user, downloads and navigation. Platform CSS is scoped `.nx … :not(.lg *)`, legacy CSS `.lg …`, so the two never collide. Details and limits: LEGACY-RUNTIME.md.

## Frontend

* `lib/api.ts` — typed fetch, JWT header, uniform `ApiError`, auto-logout on 401, CSV download.
* `store/auth.ts` — persisted session + `can(module, action)`; `store/ui.ts` — toasts/drawer.
* `hooks/useApi.ts` — `useList/useOne` (TanStack Query) and `useAction` (mutation + cache invalidation + toast with the backend's policy message verbatim).
* `components/ui.tsx` — design system: `DataTable` (table ⇄ cards), `Modal` (bottom-sheet on phones), `ReasonModal`, `Pill`, `Kpi`, `Tabs`, `Field`.
* `components/Shell.tsx` — role-aware navigation (sidebar / drawer / bottom bar), notification badge, offline banner.
* Routing guard (`App.tsx`) checks login, forced password change and module permission.

### PWA
`vite-plugin-pwa` generates `manifest.webmanifest` + Workbox service worker: app shell precached, reference endpoints `NetworkFirst`, all other API calls `NetworkOnly` (never serve stale financial data). Android: Chrome offers "Add to Home screen"; it opens full-screen (`display: standalone`). The staff **self check-in** screen is designed for phones.

## Scaling notes
Stateless API → add VMs behind the LB. Only one scheduler instance. MySQL HeatWave handles read replicas if reporting load grows; report datasets are plain functions and can be moved to SQL views later.
