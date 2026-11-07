# Qubira Local/Production Database Consistency Fix Report

## Summary

Implemented the safe frontend API-origin and dashboard-cache corrections, and added isolated SQLite persistence coverage. The local `skillbattle.db` was not used for tests, modified, backed up, or migrated. No Render, Neon, Vercel, or UptimeRobot settings were accessed or changed.

The established inconsistency causes are:

- Local and production are separate data stores: local FastAPI uses SQLite; the owner identifies Render's PostgreSQL as Neon, but its live connection target was not inspected.
- Frontend API URLs had contradictory Render defaults in the frontend Next config, API client, server-status card, and local production environment file.
- Dashboard `localStorage` was not scoped to an API origin, so the same browser profile could reuse another environment's dashboard payload.

The exact user-visible local failure cannot be attributed to one request without a browser/server trace. The local database currently contains 1,845 users, and the isolated service-level integration test confirms successful writes survive an engine restart.

## Changes

### API origin

- Added [`frontend/src/lib/api-origin.mjs`](./frontend/src/lib/api-origin.mjs) as the shared origin resolver. Development/test defaults to `http://localhost:8000`; production requires an explicit valid `NEXT_PUBLIC_API_URL`. Invalid schemes, credentials, query strings, fragments, and unsupported paths fail validation.
- Routed the API client, both Next.js rewrite configurations, server-status link, and battle WebSocket through the shared resolver.
- Updated the tracked frontend environment examples and deployment guidance to use the repository-documented Render candidate `https://skillbattle-api.onrender.com`. Updated only the API-origin line in the ignored local `frontend/.env.production`; `frontend/.env.local` remains `http://localhost:8000`.
- The documented Render URL is a repository value, not a live-verified service URL. Verify it manually before deployment. No Vercel or Render environment variable was changed.
- Docker Compose's `http://backend:8000` remains an explicit in-network container override.

### Dashboard cache

- Cache keys now include the normalized API origin. Cache payloads also record and validate that origin and the owning user ID, preventing reuse across environments or accounts.
- Store state distinguishes cached/stale from successful live data and retains the last-success timestamp. Cached metrics are visibly labeled; refresh failures are not presented as live data.
- Successful non-auth mutations emit a dashboard invalidation event. The store marks data stale and refreshes it, including after any already-running refresh completes, while retaining cached data for offline use.

### Persistence coverage

Added [`backend/tests/modules/test_local_database_persistence_restart.py`](./backend/tests/modules/test_local_database_persistence_restart.py). It creates a temporary test-only SQLite database, exercises registration, profile update, XP/level award, battle settlement/history, and admin update, disposes the engine, then verifies persisted values through a new engine. Test-only metadata creation is confined to this temporary database; it is not a migration or a substitute for one.

## Database and migration safety

- Read-only local verification found **1,845 users**, Alembic marker `b8f2d4e6a901`, and the three placement tables plus their expected indexes already present.
- `alembic heads` reports exactly one head: `47292a2a50d2`. `alembic history --verbose` shows this existing merge revision joins `7a2b1c4d9e8f` and `b8f2d4e6a901`. No merge revision was created in this phase.
- The pending `7a2b1c4d9e8f` upgrade uses unguarded `op.create_table` calls for the placement tables that already exist locally. Applying it to this database as-is is unsafe and is likely to fail at the first table creation. Table/index presence alone does not establish full foreign-key, constraint, or data parity.
- [`backend/run_migrations.py`](./backend/run_migrations.py) selects the sole graph head and calls `upgrade("head")` for a versioned database. It also contains automatic stamp paths for empty revision metadata and new/legacy schemas; those paths do not perform a full schema comparison before stamping. This runner was not changed or executed.
- No migration, stamp, DDL, database backup, or production connection was performed. Before any separately approved migration, create and verify a SQLite backup, compare the complete schema and data invariants with migration operations, and test against a copy/fresh database. Do not stamp this database to suppress the revision difference.

## Validation results

| Validation | Result |
|---|---|
| Frontend type-check (`npx tsc --noEmit`) | Passed |
| Production frontend build (`npm run build`) | Passed |
| Focused API-origin, routing, and dashboard-cache tests | **13 passed** |
| Isolated persistence/restart integration test | **1 passed** |
| Alembic graph | **1 head**, `47292a2a50d2` |
| Full frontend Node test collection | **19 passed, 2 failed**: existing student/college mobile-navigation expectation tests; unrelated to these changes and left untouched |
| Backend suite, excluding the Supabase diagnostic module that cannot import because `psycopg2` is unavailable | **144 passed, 4 failed**: one config-precedence test conflicts with the temporary SQLite override used to isolate the suite; three battle-creation tests require validated question-bank fixtures absent from the isolated database |
| Runtime-validation HTTP probe | Passed in earlier runs. The final run's probe could not start because a prior validation Next process still held port 3000 (`EADDRINUSE`); that specific validation process was stopped and the port is now free. Type-check, build, and focused tests passed in that run. |

The runtime-validation test-count parser did not recognize Node's TAP output, so its reported counts were unavailable; the direct `npm test` output confirms 13/13 focused tests passed. The full-suite failures above are reported rather than suppressed.

## Persistence/data-flow findings

- Local development settings select the same SQLite file for the synchronous and asynchronous SQLAlchemy engines; dashboard/profile/XP/battle/admin request paths use the async session.
- Registration commits the user, profile, and progression rows; profile and admin updates commit explicitly; XP and battle settlement persist their ledgers/results. The session dependency commits marked writes and rolls back request failures.
- Battle history is scoped by the authenticated participant's user ID. No production dataset was copied.
- Local SQLite and production PostgreSQL necessarily contain different datasets absent an explicit synchronization process.
- The deployment guide documents UptimeRobot polling `/docs` every five minutes to keep Render awake. That is an HTTP liveness check, not a database-readiness check. The live UptimeRobot target is unverified; Render's documented `/health` is static and does not query the database.

## Manual production verification still required

Before deploying, verify these in the provider dashboards without sharing credentials:

1. Render service identity and URL; the repository manifest names `skillbattle-api`, with root directory `backend`.
2. Render `DATABASE_URL` provider and database identity (expected by the owner to be the existing Neon database).
3. Whether Render sets `ASYNC_DATABASE_URL`; if set, verify it targets the same database as `DATABASE_URL`.
4. Vercel project root directory (`frontend`) and `NEXT_PUBLIC_API_URL`; set it to the verified Render service origin. Production builds now fail if the variable is missing or malformed.
5. UptimeRobot's actual monitor URL and interval; the checked-in guide documents `/docs`, but the live monitor was not inspected.

## Recommended next steps

1. Manually verify the Render and Vercel values above, then deploy the frontend/API-origin changes.
2. Test local registration/profile/XP/battle flows against the preserved SQLite database and distinguish live results from cached results.
3. In a separate approval, plan and test the SQLite revision/schema reconciliation. Do not migrate Neon or change any production setting as part of this report.

## Worktree note

During validation, unrelated edits appeared in `frontend/src/app/globals.css` and `frontend/tests/theme.spec.ts`. They are outside this task and were left untouched. The earlier [`QUBIRA_LOCAL_PRODUCTION_DATABASE_AUDIT.md`](./QUBIRA_LOCAL_PRODUCTION_DATABASE_AUDIT.md) was also present before this implementation and was preserved.
