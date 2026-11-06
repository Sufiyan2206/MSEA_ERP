# Legacy module runtime (strangler migration)

**Goal:** every one of the original application's 192 screens runs inside the new React/TypeScript PWA today, with its data in MySQL behind the Flask API, while modules are rewritten natively one by one. This is the strangler-fig pattern: the new shell wraps the old application, and each native module replaces a slice of it until nothing legacy remains.

## What runs where

| Concern | Legacy screens (`/app/<key>`) | Native screens (`/students`, `/fees/*`, …) |
|---|---|---|
| UI code | original modules, built verbatim into `public/legacy/legacy-app.js` by `frontend/legacy/build-legacy.mjs` | React + TypeScript pages |
| Data | `legacy_docs` (99 JSON documents) and `legacy_records` (6 append collections) via `/api/v1/legacy/*` | typed tables (`students`, `receipts`, …) |
| Authentication | platform JWT; the legacy "user" is resolved from the platform user (`/legacy/me`) | platform JWT |
| Authorisation | server: module `legacy` View/Add; in the browser: the original role × screen matrix (`roles` document) | server-side `@require(module, action)` + branch scope |
| Audit | document-level audit rows + the legacy audit collection | row-level audit with old/new |
| Automation | original client-side automations (gap scan, reminders, brief) still run while a user is on a legacy screen | APScheduler jobs on the server |

## How the runtime is built

`frontend/legacy/src/*.js` are the original 125 source modules (unchanged). `build-legacy.mjs`:
1. Concatenates them in the original order with `SRC` (branch master) and the logo.
2. Applies the **PATCHES** list — 10 exact string replacements that reroute the artifact-runtime calls (`window.claude.use('db'|'user'|'downloads'|'sample')`) to `window.MSEA_BRIDGE`, render state classes on the host element instead of `<body>`, drive navigation through `/app/<key>`, pick the signed-in user from the platform session, and relabel the sync chip. The build **fails** if a patch does not match exactly the expected number of times, so upgrading the legacy sources is safe.
3. Appends a postlude exposing `window.MSEA_LEGACY = {go, render, rerender, PAGES, NAV, App, Store, pageOk}` and guards `render()` when the host is not mounted.
4. Scopes the original stylesheet under `.lg` with postcss-prefix-selector (`body.navopen` → `.lg.navopen`, `:root` → `.lg`). The platform stylesheet is scoped under `.nx … :not(.lg *)` by Vite's postcss config, so neither leaks into the other.
5. Copies the vendor libraries (Chart.js, SheetJS, jsPDF, autotable, qrcode) to `public/legacy/vendor` — no CDN, works offline.
6. Writes `src/legacy/directory.json` (24 groups, 197 nav entries) used by the native *Modules* page and global search.

`npm run dev` / `npm run build` run the builder automatically.

## Bridge (`frontend/src/legacy/bridge.ts`)

Implements the Firestore-like contract the legacy `Store` expects:

| Legacy call | Bridge behaviour |
|---|---|
| `db.doc('app/<k>').onSnapshot(cb)` | immediate callback with the bootstrap copy; later callbacks when polling finds a newer version |
| `db.doc('app/<k>').set({v})` | `PUT /legacy/docs/<k>` with the last known `version`. Writes to one document are **serialised and coalesced** (the legacy code often calls `Store.put` several times in a row). A 409 reloads the server copy and raises `conflict`, which the legacy UI shows as "The change could not be saved". |
| `db.collection(c).add(obj)` | `POST /legacy/colls/<c>` |
| `db.doc('<c>/<id>').update/set` | `PATCH/PUT /legacy/colls/<c>/<id>` |
| `use('downloads').save({filename,data})` | browser download (Blob) |
| `use('user').can('data.write')` | platform permission `legacy:Add` |

Bootstrap: one `GET /legacy/bootstrap` on first entry to any legacy screen (documents + the latest 200–1500 records per collection), then `GET /legacy/changes?since=` every 30 s. Documents that were never written stay at the legacy defaults (deterministic demo seed inside the bundle), exactly as the original app behaved before its first save.

## User mapping

`GET /legacy/me` resolves the legacy user record for the signed-in platform user: stored link (`users.legacy_user_id`) → e-mail match → first Active legacy user with the same role name → (Super Admin only) the demo user switcher. Admins link explicitly with `POST /legacy/me {user_id, legacy_user_id}`. Platform role **Super Admin** keeps the "Acting as" switcher for testing other roles; everyone else sees their own name.

## Limits you should know

* Fine-grained permissions on legacy screens are enforced by the legacy role matrix **in the browser**; the server only checks `legacy:View/Add`. Treat legacy data as writable by any staff user until the module is ported natively.
* Whole-document writes: two users editing the same document within the same 30 s window get a conflict on the later save (the UI reloads the fresher copy). Native modules use row-level tables and do not have this limit.
* The legacy bundle is 5.4 MB (1 MB gzipped), precached by the service worker; the first open after a deploy downloads it once.
* The legacy demo data (branches, students, "as on" date 19 Oct 2026) comes from the original seed. Replace via the legacy screens' import functions or by porting the module.

## Porting a legacy module natively (removing a strangler slice)

1. Read the module's documents (`Store.get('<doc>')` keys in its `*_core.js`) and design tables (DATABASE.md).
2. Write a one-off migration script that reads `legacy_docs.<doc>` and inserts rows (keep legacy ids in an `extra` JSON column for traceability).
3. Build the service + API + React page (DEVELOPER-GUIDE §3).
4. Point the `directory.json` entry and global search at the native route (`Modules.tsx` honours a `native` field if you add one), then remove the legacy page from `NAV` in `legacy/src/main.js` and rebuild; the bundle shrinks with every module removed.
