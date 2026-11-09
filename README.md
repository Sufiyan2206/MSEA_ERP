# Eduvia — MS Education Academy

Multi-branch school ERP rebuilt on a production stack:

| Layer | Technology |
|---|---|
| Frontend | TypeScript · React 18 · Vite · React Router · TanStack Query · Zustand · **PWA** (installable on Android/iOS/desktop, offline shell) |
| Backend | Python 3.12 · Flask 3 · SQLAlchemy 2 · **Alembic** migrations · PyJWT · APScheduler · gunicorn |
| Database | MySQL 8 (OCI MySQL HeatWave DB System in production; SQLite only for unit tests / quick local runs) |
| Deployment | Docker · nginx · **OCI** (Terraform: VCN, Load Balancer, compute, MySQL DB System, Object Storage) · GitHub Actions CI |

**All 192 screens of the original application are included**: the core operations are native React + typed Flask services; every remaining screen runs through the *legacy module runtime* (the original modules compiled into the PWA, data in MySQL via `/api/v1/legacy`, platform login) — see [docs/LEGACY-RUNTIME.md](docs/LEGACY-RUNTIME.md). Modules are replaced natively one at a time (strangler migration).

Every screen is responsive: desktop gets a sidebar + data tables, phones get a drawer, bottom navigation and card lists (same code, `DataTable` switches under 768 px).

## Repository layout

```
backend/            Flask API
  app/core/         config, db session, security (JWT + RBAC + branch scope), errors, validation
  app/models/       SQLAlchemy models (39 tables) – the single source of truth for the schema
  app/services/     business rules: fees, admissions onboarding, gap engine, HR/payroll, reports, brief, scheduler
  app/api/          HTTP blueprints (thin: validate → service → JSON)
  migrations/       Alembic (env.py + versions/)
  scripts/seed.py   roles, permissions, gap rules, demo organisation
  tests/            pytest suite (17 end-to-end API tests)
frontend/           React PWA (src/pages = native screens, src/components/ui.tsx = design system)
  legacy/src/       the original 125 modules (verbatim) + build-legacy.mjs → public/legacy/ (runtime for the other screens)
  src/legacy/       bridge.ts (storage/auth/navigation adapter), directory.json (module directory)
deploy/             docker-compose, nginx, OCI Terraform, CI workflow
docs/               documentation (start with DEVELOPER-GUIDE.md and USER-WORKFLOW.md)
```

## Quick start (local, 5 minutes)

```bash
# backend
cd backend && pip install -r requirements-dev.txt
export DATABASE_URL=sqlite:///dev.db            # or your MySQL URL
alembic upgrade head                            # create schema
python -m scripts.seed                          # roles + demo data (users below)
flask --app wsgi run --port 5000              # API on :5000 (SCHEDULER_ENABLED=1 by default)
# frontend
cd ../frontend && npm install && npm run dev    # http://localhost:5173 (proxies /api to :5000)
```

Demo logins (password `Msea@12345`, forced change at first login): `superadmin`, `ceo`, `cfo`, `hr`, `finance`, `auditor`, `sysadmin`,
`principal.hyd`, `accountant.hyd`, `cashier.hyd`, `counsellor.hyd`, `teacher.hyd` (same for `.sec`, `.blr`, `.mum`), `parent.demo`.
There is no seeded `admin` username; use `superadmin` for the local demo administrator account.

With Docker: `cd deploy/docker && cp ../../backend/.env.example .env && docker compose up -d --build` → http://localhost (MySQL included).

## Tests & checks

```bash
cd backend && pytest -q                 # 18 passed
cd backend && alembic check             # models == migrations
cd frontend && npm run build            # tsc --noEmit + vite build + service worker
```

## Documents

| Doc | For |
|---|---|
| [docs/USER-WORKFLOW.md](docs/USER-WORKFLOW.md) | End users: how the application works, role by role, day by day |
| [docs/DEVELOPER-GUIDE.md](docs/DEVELOPER-GUIDE.md) | Developers: setup, conventions, how to add a screen/rule/report, **error & issue → fix procedures for code and database** |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, security model, automation, PWA |
| [docs/DATABASE.md](docs/DATABASE.md) | Schema, relationships, migration workflow, backup/restore |
| [docs/API.md](docs/API.md) | All 110 endpoints with permissions and bodies |
| [docs/LEGACY-RUNTIME.md](docs/LEGACY-RUNTIME.md) | How the original screens run inside the new stack, the bridge, limits |
| [docs/MIGRATION-PLAN.md](docs/MIGRATION-PLAN.md) | Which screens are native vs legacy-runtime, and the recipe to port the rest |
| [deploy/oci/terraform/README.md](deploy/oci/terraform/README.md) | OCI deployment runbook |
