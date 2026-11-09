# Phase 3.2H — Existing Schema Preservation and Validation Isolation

**Overall release status: BLOCKED**

**Repository HEAD at start of work:** `4e4e315e1d4432b504e46d5f44789276abf8f27e`  
**Current legacy Alembic head:** `d1f5a8e7c2b4`  
**Production / Neon access:** None  
**Migration execution, stamp, deployment, commit, or push:** None

## Status summary

| Area | Status | Evidence |
|---|---|---|
| Database test URL isolation | **FIXED AND TESTED** | Backend tests use a unique temporary SQLite file by default; unsafe paths and non-loopback PostgreSQL URLs are rejected before application imports. `init_db` requires an explicit keyword-only URL matching its configured engine. |
| Test dotenv isolation | **FIXED AND TESTED** | Backend test mode disables implicit dotenv loading. Only an explicitly named test-only file can be read. A regression test proves `.env.local` and `.env.production` are ignored. |
| Auth test isolation | **FIXED AND TESTED** | Auth tests use a local fixture, a generated test cookie secret, and a loopback-only test guard. Playwright runs with `NODE_ENV=test`; the installed Next environment loader was checked against synthetic files and selected `.env.test` only. |
| Supported historical source schema | **BLOCKED** | Repository documentation does not identify a verified, reproducible previous schema profile. No profile or production schema was invented. |
| Existing-schema Alembic upgrade and data preservation | **BLOCKED** | No schema-faithful PostgreSQL fixture could be built from available evidence; no Alembic upgrade or data-preservation claim is made. |
| PostgreSQL migration ownership | **NOT TESTED** | Docker, `psql`, `pg_ctl`, and `postgres` are unavailable here. Seven PostgreSQL coordinator tests were skipped. |
| Advisory-lock activation gate | **BLOCKED** | The required PostgreSQL ownership scenarios remain unverified; the migration gate must stay closed. |
| Production schema compatibility / deployment | **NOT TESTED** | No production connection, configuration change, or deployment was made. Existing Neon compatibility remains unverified. |

## Repository and migration graph

The work began at commit `4e4e315e1d4432b504e46d5f44789276abf8f27e`. The migration directory had no staged, unstaged, or untracked migration revisions. No migration file was changed.

Read-only `alembic heads` and `alembic history --verbose` report exactly one head:

```text
d1f5a8e7c2b4
```

The current ancestry is `dd495117949b` through the historical revisions to `a9e4c1b7d602`, which merges three lines. That point branches into the `b8f2d4e6a901` and placement (`7a2b1c4d9e8f`) lines. `47292a2a50d2` merges those two revisions; the graph then continues through `a14c6e8d2b37`, `c9b0f2d5a713`, and `d1f5a8e7c2b4`.

The single-head result verifies graph shape only; it does not prove any database is compatible with that head. In particular:

- [PHASE_3_1_DECISIONS.md](PHASE_3_1_DECISIONS.md) says only verified schema profiles may be supported and that the prior local inspection findings are not a current database observation.
- [PHASE_3_1_MIGRATION_ARCHITECTURE_DESIGN.md](PHASE_3_1_MIGRATION_ARCHITECTURE_DESIGN.md) documents that `dd495117949b` is not a clean-install baseline, and that replaying it on an empty database fails. It also documents destructive XP deduplication/backfill behavior in `b0c9e2a7f1d4`.
- Those documents propose a separately versioned epoch with explicit baseline DDL and reviewed per-profile reconciliation. That architecture is not implemented or validated by this phase.

Consequently, there is no evidence-based supported historical profile from which to create the requested existing-schema fixture. A synthetic schema with guessed columns, constraints, or migration state would provide false evidence, so it was not created. The requested users, profiles, roles, XP, battle, question, and placement records were not fabricated or treated as a supported database.

## Test-isolation changes

Changed backend test setup so it selects and validates the database URL before importing the application:

- Missing `DATABASE_URL` selects a run-unique SQLite file under the operating-system temporary directory.
- Explicit SQLite URLs must be temporary files and cannot resolve to the protected repository database.
- PostgreSQL test URLs must use a loopback host and a database name with a distinct `test` segment. A supplied PostgreSQL URL remains PostgreSQL; it is not silently replaced with SQLite.
- Sync and async URLs must identify the same database. The test environment disables `RESET_DB` and clears any inherited migration URL.
- Temporary databases created by the harness are disposed and cleaned up at process exit.
- `init_db(*, database_url=...)` rejects a missing URL by its required signature and rejects a URL that differs from the already-configured engine before performing schema work.
- In test mode, environment files are not implicitly loaded. The admin dotenv test opts in only to its own generated temporary test file.

Regression tests cover the protected default path, external PostgreSQL URLs, mismatched sync/async URLs, a supplied loopback PostgreSQL URL remaining PostgreSQL, dotenv isolation, and the explicit `init_db` target requirement.

## Authentication test isolation

`getNeonAuthConfig` now rejects non-loopback Auth origins whenever `NODE_ENV=test` or `QUBIRA_AUTH_TEST_MODE=1`. Missing runtime configuration still throws; there is no success fallback.

The Playwright configuration sets `NODE_ENV=test`, a local Auth fixture URL, a fresh random test cookie secret, and a non-routable API URL before launching Next. A synthetic `@next/env` check with `NODE_ENV=test` and Next's development loading mode selected only `.env.test`, not `.env.local` or `.env.production`. The unit tests do not load dotenv files. The Auth route E2E test exercised anonymous and authenticated session responses through the local fixture; it did not contact Neon Auth.

The production build was validated separately. Next reported loading its normal `.env.local` and `.env.production` files during that build; no dotenv values were inspected or included in this report.

## Validation evidence

| Command / check | Result |
|---|---|
| `alembic heads` | **PASS** — one head: `d1f5a8e7c2b4`. |
| `alembic history --verbose` | **PASS** — graph inspection only; no database operation. |
| Focused database-isolation/config/admin tests | **PASS** — 18 passed. |
| Full backend suite: `python -m pytest -q` | **PASS** — 230 passed, 8 skipped. The PostgreSQL coordinator tests were among the skipped tests. |
| Frontend unit tests: `npm test` | **PASS** — 19 passed, 0 failed. |
| Authenticated opportunity and Auth-route E2E: `npm run test:e2e` | **PASS** — 6 passed, 0 failed; Auth upstream was the local fixture. |
| `npx tsc --noEmit` | **PASS** — exit code 0. |
| `npm run build` | **PASS** — Next.js 16.4.5 production build completed, including `/api/auth/[...path]`. |
| TypeScript runtime validation plan | **PASS** — build, no-emit typecheck, and home-route HTTP probe passed. Its TAP parser could not count tests, so the direct `npm test` result above is the test-count evidence. |
| PostgreSQL 18.6 availability | **BLOCKED** — `docker`, `psql`, `pg_ctl`, and `postgres` were unavailable. No PostgreSQL server or connection was used. |
| Fresh PostgreSQL Alembic installation | **NOT TESTED** — the backend suite's SQLite `create_all()` setup is not Alembic replay and is not PostgreSQL evidence. |
| Upgrade from a supported previous PostgreSQL schema to `d1f5a8e7c2b4` | **BLOCKED** — no verified source schema profile is documented or available. |
| Before/after preservation checks, migration failure injection, PostgreSQL advisory lock, process termination, and connection reuse | **NOT TESTED** — these require the missing disposable PostgreSQL environment and a schema-faithful fixture. |
| API-only Uvicorn startup and live readiness against PostgreSQL | **NOT TESTED** in this phase. |

No full `alembic upgrade head` or `alembic stamp` was run. The backend suite initializes its isolated SQLite database from current models and includes tests that invoke selected migration functions against disposable test databases. Those checks are not a replay of the complete legacy Alembic graph and are not PostgreSQL or existing-schema reconciliation evidence.

## Production and data protection

No Neon/production database was contacted. The protected repository SQLite database was not inspected, opened, repaired, reset, or restored. No live Render or Vercel settings were changed; nothing was deployed. The API-only startup architecture and PostgreSQL migration gate were not weakened. `run_migrations.py` still requires explicit `--execute`; that switch is not authorization to run against production.

The existing Neon schema was not changed by this work, but its compatibility and data safety are **unverified**. No statement that existing production data is compatible with the current migration head is warranted.

## Operator requirements to unblock Phase 3.2H

1. Provide an approved, sanitized schema manifest for the exact prior revision to be supported, including columns and types, defaults, PKs, FKs, indexes, constraints, and relevant data invariants. Prior counts or revision labels alone are insufficient.
2. Provision an isolated disposable PostgreSQL 18.6 instance bound to loopback, and a uniquely named disposable database containing a distinct `test` segment. Set explicit sync and async test URLs only in that isolated test process; do not use Neon, Render, or production credentials.
3. Build the fixture from that verified manifest and synthetic records. Capture before/after object inventories, row counts, IDs, FK integrity, and deterministic record checksums.
4. Execute the actual supported forward migration path on both a fresh disposable database and the documented prior-schema fixture. Inject the required failures and prove each unsupported state fails closed.
5. Re-run the PostgreSQL advisory ownership, exact connection reuse, lock release, process-termination, readiness, and API-only startup tests against that disposable service.
6. Keep PostgreSQL migration activation blocked until all required PostgreSQL scenarios pass and the resulting schema/data evidence is reviewed. Do not stamp, infer a production head, or deploy as a substitute for that evidence.

The separate pre-existing modification to `docs/production/VERCEL_RENDER_STARTUP_REPAIR_REPORT.md` was preserved and not included in this phase's changes.
