# Phase 3.2E — Controlled Migration and API Startup Implementation Report

## Status

**Partial implementation; migration activation and deployment remain blocked.**
The PostgreSQL session-level lock, explicit migration authorization flag,
read-only API readiness checks, and removal of startup database writes are
implemented. Focused disposable SQLite and PostgreSQL coordination/API checks
passed. The complete PostgreSQL migration chain has not passed the required
fresh-database and supported-revision upgrade tests.

The epoch remains inactive. No baseline was created, no production database was
accessed, and no deployment configuration was changed.

## Architecture implemented

### PostgreSQL ownership

- Added a session-level advisory lock on a dedicated SQLAlchemy connection with
  `NullPool`.
- Alembic receives the exact ownership connection; runtime checks enforce the
  active lease, target database identity, pool type, and stable backend PID.
- The lock is retained over transaction commits and released explicitly during
  cleanup; PostgreSQL also releases it if the physical session terminates.
- A stable lock namespace/key is used by cooperating migration runners.
- The migration runner's PostgreSQL execution gate is deliberately closed until
  full fresh and supported-revision upgrades pass. Lock correctness does not
  authorize migration execution.

### Explicit migration command and API startup

- `run_migrations.py` requires `--execute`; invocation without it exits 2
  before calling the runner.
- SQLite migration still requires a trusted maintenance-window verifier and a
  verified new backup. No verifier is installed in normal CLI startup.
- PostgreSQL remains rejected by the dialect gate before connection ownership
  acquisition and before DDL.
- FastAPI lifespan no longer invokes migrations or automatically bootstraps a
  platform administrator. `run_admin_bootstrap.py` is the explicit
  administrator-provisioning command.
- Shutdown disposes both synchronous and asynchronous SQLAlchemy engines.
- `/health` remains a lightweight liveness endpoint. `/ready` and `/health/db`
  use the read-only migration/schema preflight and return 503 when unavailable
  or incompatible. These endpoints do not repair or migrate the database.

### Index ownership

The model metadata now declares `ix_assessment_q_sub_user_created` on
`assessment_question_submissions(user_id, created_at)`. The forward-only
revision `c9b0f2d5a713` creates it when absent, accepts only a matching existing
definition, and refuses a missing table or mismatched index. Its downgrade
preserves the index because its pre-migration ownership is uncertain. This
revision was not executed against the complete PostgreSQL graph because the
migration gate remains closed.

## Files created and modified

New:

- `backend/alembic/versions/c9b0f2d5a713_adopt_assessment_submission_index.py`
- `backend/run_admin_bootstrap.py`
- `backend/tests/api/test_health_readiness.py`
- `backend/tests/migration_infrastructure/test_postgresql_migration_coordinator.py`
- `docs/database/PHASE_3_2E_POSTGRESQL_MIGRATION_OWNERSHIP.md`
- `docs/database/PHASE_3_2E_IMPLEMENTATION_REPORT.md`

Modified:

- `backend/app/database/migration_infrastructure/migration_coordinator.py`
- `backend/run_migrations.py`
- `backend/alembic/env.py`
- `backend/app/database/migration_preflight.py`
- `backend/app/core/monitoring/health.py`
- `backend/app/main.py`
- `backend/app/models/assessment_engine.py`
- related migration state, coordinator, preflight, and epoch scaffold tests
- `docs/database/PHASE_3_2A_CONNECTION_INVENTORY.md`
- `docs/database/RENDER_POSTGRESQL_STARTUP_FAILURE_ANALYSIS.md`
- `docs/dashboard/DASHBOARD_LIVE_DATA_FAILURE_REPORT.md`

Historical migration revisions and `render.yaml` were not changed.

## Connection and lifecycle coverage

| Path | Current behavior | Remaining limitation |
|---|---|---|
| PostgreSQL migration ownership | Dedicated session lock and same-connection Alembic handoff tested against disposable PostgreSQL 18.6. | Full runner upgrade is gated and untested; all migration processes must use the same lock key. |
| SQLite migration ownership | Exclusive coordinator still requires verifier evidence, canonical identity, and a verified backup. | No trusted maintenance verifier/process controller is installed; an uncoordinated client can still open SQLite. |
| API sync/async pools | Both engines are disposed on application shutdown. | Disposal alone is not proof that all processes, requests, or transactions have drained. |
| Battle settlement and WebSocket work | No normal-operation cancellation semantics were changed. | Global task registries/drain behavior are not established; external maintenance control must prove all workers are stopped. |
| Startup administrator provisioning | Removed from API lifespan; separate explicit command is available. | The command was not executed as part of this phase; operators must invoke it only with an authorized database target. |
| Readiness | `/ready` and `/health/db` use read-only compatibility preflight; `/health` remains liveness-only. | No production schema or external database was checked. |
| Raw SQLite and external processes | No claim that the sidecar blocks independent clients. | Raw tools, duplicate backend tree, and other host processes remain outside application ownership. |

## Migration graph and PostgreSQL blocker

`alembic heads` reported exactly one head: `c9b0f2d5a713`. The verbose history
shows it descends from the prior merge revision `47292a2a50d2`, whose parents
are the formerly divergent `7a2b1c4d9e8f` and `b8f2d4e6a901`.

The required migration test is not complete. A prior disposable PostgreSQL
18.6 fresh-database attempt found that historical root revision
`dd495117949b` assumes existing schema objects and performs unguarded drops and
`users` alterations. The current preflight rejects the fresh schema before DDL;
the disposable database remained empty. No historical revision was changed.
No schema-faithful disposable copy at the production revision was available,
and no database was stamped to simulate one.

The PostgreSQL runner gate therefore remains closed. A reviewed fresh-database
strategy and both fresh and supported-revision disposable upgrade tests are
required before migration activation.

## Validation results

| Validation | Result |
|---|---|
| Focused migration/readiness regressions on explicit disposable SQLite | **35 passed, 6 skipped** (the 6 PostgreSQL tests skipped because this run had no test PostgreSQL URL). |
| PostgreSQL ownership tests on disposable PostgreSQL 18.6 | **6 passed**. |
| Auth/dashboard API tests using disposable SQLite | **4 passed**. |
| Real Uvicorn process using a new disposable SQLite path | **Passed**: bound to loopback; `/health` 200; invalid `/auth/me` 401; unauthenticated `/api/v1/dashboard` 401; DB file remained absent. |
| `alembic heads` / `alembic history --verbose` | **Passed**: exactly one head, `c9b0f2d5a713`; commands did not create/connect to the configured disposable database. |
| Runner without `--execute` | **Passed**: exit 2 and no configured DB file created, asserted by regression test. |
| Fresh full PostgreSQL upgrade | **Blocked**: historical root schema assumptions rejected by read-only preflight before DDL. |
| Upgrade from supported existing PostgreSQL revision | **Not run**: no disposable schema-faithful database was available; production was not accessed. |
| API readiness against a live compatible schema | **Not established**: endpoint decision behavior is unit-tested with compatible/incompatible preflight reports; no production schema was probed. |
| Full build/lint | **Not run**: focused Python tests and Pylance syntax/diagnostic checks were used; no broader build command was identified for the backend. |

The focused Pylance checks found no errors in the runner, coordinator,
readiness, or new PostgreSQL tests. Existing unrelated warnings included an
unused import in `alembic/env.py`, an unresolved optional `sentry_sdk` import,
and unused symbols in existing application/test code. `git diff --check`
passed.

## Failure, recovery, and deployment status

- PostgreSQL process/session loss releases its session advisory lock; normal
  and exceptional lock-release behavior passed disposable tests.
- Migration transaction rollback and post-migration schema validation were not
  verified through the full repository graph.
- No automatic restart or replay is authorized after uncertain DDL state.
- No Neon/Render production access, schema changes, migration execution, stamp,
  environment-variable change, deployment, commit, or push occurred.
- `render.yaml` remains unchanged and still chains the migration command before
  Uvicorn without `--execute`. If that exact configuration runs this worktree,
  the runner exits 2 and Uvicorn does not start. Do not deploy that combination.
- After migration gates pass, use a separately authorized one-off command
  `python -u run_migrations.py --execute`, then run the API service with
  `uvicorn app.main:app --host 0.0.0.0 --port $PORT` without migrations in its
  startup command. These are future deployment instructions, not commands run
  or configuration changes made in this phase.

**Final decision: migration activation is not safe yet and remains blocked.**

## Phase 3.2F stabilization follow-up (2026-11-09)

The Neon-auth suite failures were test defects, not a demonstrated application
failure:

- `Profile.id` is an integer primary key; the test incorrectly called
  `db.get(Profile, user.id)`. It now queries by the distinct `Profile.user_id`
  foreign key. The Neon-user helper already creates the Profile in the same
  transaction as the local user and related records.
- `email-validator` rejects `example.test` because `.test` is a reserved
  special-use domain. The test now uses `example.com`; production validation
  was not weakened.

Verification on a newly created disposable SQLite database:
`pytest -q tests/api/test_neon_auth.py tests/api/test_auth.py
tests/api/test_security_registration.py` — **10 passed**, exit code 0.
Pydantic `EmailStr` independently rejected the former `.test` input with the
reserved-domain validation error. No production or protected local database
hash was computed or accessed in this follow-up.

An unvalidated experimental revision `d1f5a8e7c2b4` and an unrelated
SQLite-to-PostgreSQL import utility were briefly introduced during delegated
work. They were removed before completion because the revision contained
unverified schema changes and destructive downgrade operations, and the import
utility was not requested. `render.yaml` was restored and is unchanged. The
current graph remains at the previously reported single head
`c9b0f2d5a713`; no migration was applied.

PostgreSQL migration execution remains blocked. The fresh-database historical
root-revision conflict described above remains unresolved, and a
schema-faithful supported-revision PostgreSQL upgrade has not been run. The
explicit runner gate must remain closed until the user-data-safe migration
architecture is designed and both upgrade scenarios pass on disposable
PostgreSQL. This Phase 3.2F work does not establish production readiness.
