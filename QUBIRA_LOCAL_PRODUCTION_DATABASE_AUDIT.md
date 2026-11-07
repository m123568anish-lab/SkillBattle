# Qubira Local vs Production Database Audit

Date: 2026-11-07

## Executive summary

The local FastAPI process is configured to use the repository's SQLite database, `D:\BattleAI\skillbattle.db`; it does not use Neon in the current development configuration. The local Next.js frontend is configured to call `http://localhost:8000`, so its dashboard requests go to that local FastAPI process and then to SQLite.

Render's checked-in manifest runs the API with `ENVIRONMENT=production` and requires a real PostgreSQL `DATABASE_URL`. The owner identifies the existing cloud database as Neon. The actual Render value and actual Vercel environment could not be independently verified without accessing production settings, which was out of scope.

Therefore, different local and production records are expected: SQLite and Neon are separate datasets. In addition, the local SQLite Alembic marker (`b8f2d4e6a901`) is behind the checked-in repository head (`47292a2a50d2`), and the local run script does not invoke Alembic. A read-only structural check found no model-table or model-column omissions, so that marker alone does not establish that the current dashboard failures are caused by missing schema objects.

## 1. Local database configuration

### Effective settings

With the backend working directory set to `backend`, a safe import of `app.core.config.settings` resolved:

| Setting | Effective local result |
|---|---|
| `ENVIRONMENT` | `development` |
| `DATABASE_TYPE` | `sqlite` |
| `DATABASE_URL` | SQLite file `D:\BattleAI\skillbattle.db` |
| `ASYNC_DATABASE_URL` | SQLite async driver, same file |

The local read-only SQLite inspection found:

- Database file exists; size 6,410,240 bytes.
- 78 tables total: 77 application/model tables plus `alembic_version`.
- 1,845 user rows (count only; no user records were read into the report).
- Local Alembic revision: `b8f2d4e6a901`.
- Checked-in Alembic graph head: `47292a2a50d2`.
- Compared to the registered SQLAlchemy model metadata: no missing model tables, no extra non-Alembic tables, and no missing or extra model columns.

The schema comparison was read-only. It did not compare every index, constraint, trigger, or data invariant.

### Environment precedence and engine setup

- `backend/app/core/config.py` loads local files in this order when their keys are not already present in the process environment: `.env.local`, `.env`, `.env.admin`, `.env.admin.local`. Existing OS environment values take precedence.
- Pydantic Settings also declares those same env files; `.env.production` is not part of this backend loader/configuration.
- `backend/.env.local` sets `ENVIRONMENT=development`; `backend/.env` specifies SQLite URLs and `DATABASE_TYPE=sqlite`.
- The settings validator forces SQLite in `development`, `dev`, `test`, and pytest contexts. Setting a PostgreSQL `DATABASE_URL` alone while leaving `ENVIRONMENT=development` does not select Neon; production mode is required to select the PostgreSQL branch.
- `app.database.database` creates a synchronous SQLAlchemy engine from `settings.DATABASE_URL`. `app.database.session` creates a separate asynchronous engine from `settings.ASYNC_DATABASE_URL`. Both resolved to the same SQLite file locally.
- `app.main` imports the synchronous engine for startup initialization. The audited modern profile, dashboard, XP, battle, and admin routes use the asynchronous `get_db` dependency and the async engine.
- `backend/run_backend.bat` starts Uvicorn directly. Startup `init_db()` uses `create_all()` and repair helpers; it does not run Alembic. File deletion is gated by `RESET_DB=True`; the inspected default is false.
- Render's manifest runs `run_migrations.py` before Uvicorn, unlike the local batch launcher.

## 2. Production database and Render configuration

- `render.yaml` declares service `skillbattle-api`, root directory `backend`, `ENVIRONMENT=production`, a secret `DATABASE_URL`, and `/health` as Render's health check.
- `backend/app/core/config.py` rejects a missing, placeholder, or non-PostgreSQL `DATABASE_URL` in production.
- If Render does not set `ASYNC_DATABASE_URL`, the settings logic derives the async PostgreSQL URL from `DATABASE_URL`. The sync and async engines therefore target the same database under the manifest's declared configuration. A separate live `ASYNC_DATABASE_URL` value could change this, but Render settings were not accessed.
- The project owner identifies the production PostgreSQL provider as Neon. The checked-in manifest itself is provider-neutral; it does not prove which host is currently configured in Render.
- The local ignored `backend/.env.production` is not a production source of truth; it contains placeholder configuration and is not included in the backend loader's env-file list.
- No Render or Neon settings, database contents, or credentials were accessed.

## 3. Frontend API routing

- The root `package.json` delegates frontend development/build commands to the `frontend` directory.
- `frontend/.env.local` sets `NEXT_PUBLIC_API_URL` to `http://localhost:8000`.
- In the browser, `frontend/src/lib/api.ts` leaves Axios's base URL empty; requests use same-origin `/api/v1/...` paths. `frontend/next.config.ts` rewrites those paths to `NEXT_PUBLIC_API_URL`. Locally, this routes to `http://localhost:8000/api/v1/...`.
- Server-side frontend calls use the configured API origin directly. The battle WebSocket helper also uses `NEXT_PUBLIC_API_URL`.
- The local ignored `frontend/.env.production` points to `skillbattle-api-2026.onrender.com`, while the frontend API helper and `frontend/next.config.ts` fallback point to `skillbattle-backend.onrender.com`. The repository-root `next.config.ts` fallback points to `skillbattle-api.onrender.com`; the deployment guide also documents `skillbattle-api.onrender.com`.
- These are divergent checked-in/local defaults. The actual Vercel project root directory and production `NEXT_PUBLIC_API_URL` were not inspected, so the production frontend's effective backend URL is **not verified**. A missing or stale Vercel environment value, or deploying the other frontend tree/config, can route requests to a different Render service.
- Vercel does not connect to SQLite or Neon directly; it calls FastAPI.

## 4. Representative dashboard data flows

All routes below are included under `/api/v1` by `app/api/v1/router.py`. The frontend Axios client appends `/api/v1`.

| Operation | Frontend → API | FastAPI path and data access | Read/write and user scoping |
|---|---|---|---|
| User/profile loading | Auth store calls `/auth/me`; `ProfileService` calls `/profile/me`. | Auth/profile routers use `get_current_user`; profile service loads `Profile` through the async session. | Queries are scoped using the authenticated `current_user.id`. Profile GET creates and commits a default profile if none exists, so it is not strictly read-only. Profile updates commit changes. |
| Student dashboard statistics | `dashboardService.getDashboard()` → `GET /dashboard`. | `modules/dashboard/router.py` → `dashboard_service.get_dashboard()` and dashboard repositories. | Reads profile, achievements, battle results, streaks, XP, submissions, practice and user stats using the authenticated user ID. XP reconciliation can flush changes; the request dependency commits when its write marker is set. |
| XP/level | Frontend dashboard consumes XP in dashboard stats; backend also exposes `GET /xp`, `/xp/history`, and `/xp/reconcile`. | `modules/xp/router.py` → `xp_service`. | User XP queries use `current_user.id`. `GET /xp` may create a missing XP/UserStats record and commits by default. Verified server-side awards update XP and ledger; client `/xp/add` is deliberately forbidden. |
| Battle history | `battleService.getHistory()` → `GET /battle/history`. | `modules/battle/router.py` joins `BattleRoom`, `BattleParticipant`, and `BattleResult`. | Read query filters `BattleParticipant.user_id == current_user.id`. Battle completion/settlement paths write results and may award XP; the history endpoint itself is a read. |
| Admin user management | Admin service calls `/admin/users`, `/admin/users/{id}`, and delete/deactivation endpoint. | `modules/admin/router.py` → `admin_service`. | List reads users; update and deactivate are admin-guarded and explicitly commit. List is intentionally global/admin-wide rather than scoped to the acting admin's user ID. |

The modern dashboard routes use the same async engine and session dependency for each operation. In local configuration that engine points to SQLite; in Render, with the manifest's variables, it should point to the PostgreSQL database derived from Render's `DATABASE_URL`. The identity dependency and route query use the authenticated user ID; no cross-user dashboard query was found in the traced paths.

## 5. Data consistency, fallback, caching, and commits

- **Dataset difference is established by architecture:** local FastAPI uses SQLite and Render is configured for PostgreSQL. Those databases are independent. There is no automatic production-to-local data synchronization, and no production dataset was copied.
- **Local data exists:** the local SQLite file has 1,845 user rows. The corresponding production count was not queried, so row-level parity or user-ID parity cannot be asserted.
- **Frontend mock/demo fallback:** the audited active profile/dashboard/XP/history/admin services call API routes; dashboard statistics validation rejects incomplete responses rather than substituting invented metrics. Static data files exist for navigation/UI metadata but are not used as the active dashboard metrics source.
- **Dashboard cache:** `frontend/src/store/dashboardStore.ts` stores dashboard data in browser `localStorage`, keyed by user ID, not API origin/database. It revalidates on mount; on failure it preserves prior data and the dashboard page explicitly shows cached metrics. Switching between prod and local APIs in the same browser profile can therefore temporarily show data from the previous environment for the same user ID.
- **Auth cache:** the auth store also caches user data locally but performs `/auth/me` to resolve the current session. A transient backend error can retain a cached user in state; it does not by itself prove a live local identity.
- **Transactions:** async `get_db` commits a transaction when ORM write events mark a request as having writes; exceptions trigger rollback. Several services also explicitly commit. Thus writes generally persist; some apparent dashboard reads can perform initialization/reconciliation writes.
- **No specific rollback defect was established** in the five traced flows. Errors in dashboard requests are surfaced by the route/UI and cached data is retained, which can make a failed local refresh appear like stale or inconsistent data.

## 6. UptimeRobot and health checks

- The deployment guide documents UptimeRobot as an HTTP(s) monitor for `https://skillbattle-api.onrender.com/docs`, every five minutes, intended to keep a sleeping Render service awake.
- That documented `/docs` endpoint only demonstrates HTTP/API reachability; it does not check the database.
- The Render manifest's health path `/health` returns a static healthy response and does not query the database.
- `/ready` likewise returns a static `{"ready": true}` response.
- `/health/db` performs `SELECT 1` and compares the DB's Alembic revision to the repository heads; this is the audited endpoint that verifies database connectivity and migration readiness.
- The actual UptimeRobot dashboard/configuration was not accessed, so its live monitor target is not verified. No monitor configuration was changed.

## 7. Root-cause findings

### Established

1. Local FastAPI is using SQLite, not Neon. The effective development config and database file were verified locally without printing secrets.
2. Local Next.js is configured to call local FastAPI at `localhost:8000`.
3. Local and production databases are separate datasets, so production dashboard data will not automatically appear locally.
4. The local SQLite Alembic marker is behind the checked-in head. Local startup does not run Alembic, although the current SQLite schema has all registered model tables and columns.
5. Dashboard localStorage cache is not environment-scoped and is deliberately retained after API refresh failure.
6. API origin values in local/production examples and fallbacks are inconsistent; actual Vercel routing remains unverified.

### Not established

- Whether the exact local dashboard symptom is a missing local user/record, a request to the wrong backend in the user's browser, stale cache, or a latent SQLite constraint/index difference.
- Whether Render's live `DATABASE_URL` currently points to Neon, and whether Vercel currently points to the intended Render service.
- Whether the local and production databases have matching users, records, constraints, or migrations.

**Most likely architectural cause when local dashboard content differs from production:** local requests are correctly reaching a separate SQLite database with its own data. If the symptom is instead an API error, the production URL drift and stale-dashboard cache are the next concrete areas to verify; no production or browser-network inspection was performed.

## 8. Recommended architecture and safe corrective plan

1. Keep per-environment stores explicit: local development → SQLite file; Render production → Neon through `DATABASE_URL`. Do not copy production records locally.
2. Confirm the Vercel project's root directory and production `NEXT_PUBLIC_API_URL`, then consolidate the duplicate frontend API defaults so local, preview, and production each resolve to an intentional backend. Do not edit Vercel settings until separately authorized.
3. Use a disposable/backup-protected local database for Alembic testing. Before any local migration, compare the SQLite marker and schema with the checked-in graph and decide whether the local database is disposable or must be preserved. No migration is recommended or performed by this audit.
4. For local dashboard testing, create/use a local account and local practice/battle records through supported application flows. Avoid production data exports.
5. Namespace or clear browser dashboard cache when changing API environments; at minimum, ensure operational testing distinguishes live data from retained localStorage cache.
6. Treat UptimeRobot `/docs` and Render `/health` as liveness checks only. If approved later, monitor `/health/db` separately for database/migration readiness; do not modify current monitors as part of this audit.
7. Leave authentication, database providers, records, and production configuration unchanged until the specific local symptom and effective Vercel/Render environment values have been confirmed.

## Validation and safety

- `backend/tests/test_config_precedence.py`: **2 passed** (63 pre-existing pytest warnings).
- Effective local backend settings were read without showing connection credentials.
- SQLite schema/table/row-count checks used SQLite read-only mode.
- Alembic history was inspected from the checked-in migration files only.
- No production settings, cloud database connections, migrations, DDL, imports, password resets, authentication changes, or record modifications were performed.
