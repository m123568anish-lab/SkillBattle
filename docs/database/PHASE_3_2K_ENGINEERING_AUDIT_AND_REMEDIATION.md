# Phase 3.2K Engineering Audit and Remediation

## Executive decision

**PostgreSQL migration activation: CLOSED.**

The legacy runner refuses PostgreSQL before opening a database connection. No
epoch baseline or existing-schema adoption was executed. The engineering
changes below improve fail-closed dispatch, connection ownership, readiness,
test isolation, and schema comparison, but do not establish PostgreSQL
migration compatibility.

The locally actionable migration bypasses and the tested ownership/readiness
defects are fixed and verified. Existing-schema compatibility, epoch
transition validation, exhaustive catalog comparison, and the root Render
readiness policy remain explicitly blocked or open as recorded below. This
report does not claim that all engineering defects are resolved.

## 1. Repository snapshot and scope

- Branch: `main`
- HEAD: `46a6c987efd06ac0cee9f5833c849dc2686e27b0`
- Working tree: dirty at audit completion; changes and untracked files were
  preserved. It contains audit work and concurrent frontend/auth, production
  report, screenshot deletion, and generated-file changes. Those unrelated
  changes were not reverted or folded into this report's remediation scope.
- Legacy Alembic graph: 29 revisions, exactly one head, `d1f5a8e7c2b4`.
  Historical root: `dd495117949b`.
- Epoch graph: no epoch revisions. `alembic_version_epoch` and the durable
  epoch transition/audit state machine have not been established.
- Protected SQLite and production/Neon databases were not accessed.

## 2. Phase 3.2J design compliance

| Design requirement | Audit result |
|---|---|
| Preserve every historical revision | No legacy migration file was edited or deleted. |
| Keep the epoch lineage separate | [`alembic_epoch/`](../../backend/alembic_epoch/) remains separate; no epoch revision was created or run. |
| Do not replay the unsafe legacy root for fresh PostgreSQL installs | PostgreSQL legacy execution is rejected; no `create_all()`/stamp bootstrap remains in the migration runner. |
| One shared PostgreSQL ownership mechanism | The PostgreSQL owner uses a dedicated `NullPool` connection and the same advisory-lock namespace/key. |
| Reuse one physical connection through owned operations | Runner passes the owned SQLAlchemy connection to Alembic and preflight; identity checks reject a different connection or backend PID. |
| Refuse unverified schema states | Legacy preflight rejects malformed/unknown revisions, partial state, missing applied objects, pending table conflicts, and model drift. |
| Preserve data during adoption | Not verified. No approved historical profile or existing-database evidence exists; adoption remains blocked. |
| Readiness is read-only | `/health` is liveness-only; `/ready` performs read-only preflight and fails closed on incompatible states. |

### Legacy graph evidence

`python -m alembic heads` returned only `d1f5a8e7c2b4`. The history contains
29 revisions. The graph includes the merge revision `47292a2a50d2`, whose
parents are `7a2b1c4d9e8f` and `b8f2d4e6a901`, followed by
`a14c6e8d2b37`, `c9b0f2d5a713`, and the current head.

The legacy root `dd495117949b` is not a clean-install baseline: it assumes
prior schema objects, drops legacy tables, and alters existing `users`.
Revision `b0c9e2a7f1d4` performs XP cleanup/backfill. These are historical
observations, not authorization or evidence of any current external database
schema.

## 3. Defect register

| Finding | Root cause and correction | Regression evidence | Status |
|---|---|---|---|
| Startup and alternate migration paths could bypass explicit migration ownership or perform implicit schema bootstrap. | Startup configurations and tracked entrypoints now start the API without invoking migrations. The root runner has no `create_all()` or `stamp()` bootstrap path; it requires the ownership lease and refuses PostgreSQL. The nested backend disables direct Alembic and model bootstrap paths. | [`test_startup_migration_policy.py`](../../backend/tests/migration_infrastructure/test_startup_migration_policy.py); full backend suite. PostgreSQL runner dispatch remains covered by the live disposable PostgreSQL suite. | **FIXED AND VERIFIED** |
| Model-based `init_db` could create schema outside an explicitly isolated test database. | It now requires an explicit URL matching the configured engine, `QUBIRA_TEST_MODE=1`, `ENVIRONMENT=test`, and either a temporary SQLite file or loopback PostgreSQL database named `qubira_test_*`. It cannot target the protected repository SQLite file. | [`test_database_isolation.py`](../../backend/tests/test_database_isolation.py): 14 passed, including URL refusal and propagated DDL failure. Full backend suite passed. | **FIXED AND VERIFIED** |
| Test bootstrap silently swallowed reset failures and duplicate-table DDL errors. | Removed the broad inner catches and the success-shaped “already exists” fallback. Failures are logged and re-raised. | New `test_model_bootstrap_does_not_ignore_duplicate_table_errors`; [`test_database_isolation.py`](../../backend/tests/test_database_isolation.py): 14 passed. | **FIXED AND VERIFIED** |
| PostgreSQL ownership verified backend PID but did not prove the configured database and user matched the live connection. | Ownership acquisition and each connection assertion now verify `current_database()`, `current_user`, and `pg_backend_pid()`. A different SQLAlchemy connection or server session is rejected. | [`test_postgresql_migration_coordinator.py`](../../backend/tests/migration_infrastructure/test_postgresql_migration_coordinator.py); live PostgreSQL 18.6 runner: 10 passed. | **FIXED AND VERIFIED** |
| Same-connection and mutual exclusion rules were insufficiently guarded against accidental alternate connections. | PostgreSQL migration ownership uses the existing shared advisory lock and a dedicated `NullPool` connection. The runner wires that connection into Alembic; preflight/harness checks use the owned connection and fail if it differs. | Live PostgreSQL tests covered lock exclusion, lock release after success/exception, identity, Alembic/preflight connection identity, and release after backend-session termination. | **FIXED AND VERIFIED** for the exercised legacy ownership path; epoch-vs-legacy contention remains blocked because no epoch runner exists. |
| The ORM audit index declaration differed from the migration-created composite index. | `AuditLog` now declares the `(organization_type, organization_id)` index consistent with the migration. Historical migration content was not modified. | [`test_migration_preflight.py`](../../backend/tests/test_migration_preflight.py), schema comparison tests, and full backend suite. | **FIXED AND VERIFIED** |
| Schema manifest comparison could accept incomplete/unknown evidence and omitted useful PostgreSQL catalog categories. | Manifest format v2 now requires known top-level sections and rejects missing, unknown, malformed, or incompatible sections. The inventory includes tables/columns and constraints, indexes, views/materialized views, triggers, sequences, types, routines, extensions, policies/RLS state, partitions, ownership, privileges/default privileges, and cross-schema foreign keys. Catalog tests use disposable PostgreSQL 18.6. | [`test_schema_manifest.py`](../../backend/tests/migration_infrastructure/test_schema_manifest.py); [`test_postgresql_compatibility_harness.py`](../../backend/tests/migration_infrastructure/test_postgresql_compatibility_harness.py); live PostgreSQL catalog tests. | **FIXED AND VERIFIED** for the implemented and enumerated fields; exhaustive PostgreSQL equivalence is **not** claimed. |
| Startup-policy regression asserted that every Render service uses `/ready`, while the root configuration uses liveness `/health`. | Corrected the test contract to accept only the two supported health endpoints and documented the root-vs-nested difference. No Render configuration was changed. | [`test_startup_migration_policy.py`](../../backend/tests/migration_infrastructure/test_startup_migration_policy.py): 6 passed. | **FIXED AND VERIFIED** as a test/documentation inconsistency. Root service readiness policy remains **BLOCKED — OPERATOR EVIDENCE REQUIRED**. |
| Epoch transition state is not fully classifiable or verifiable. | Current scaffold detects absent, bootstrapped, complete, and partial epoch object sets, and legacy execution/readiness refuses when epoch objects appear. It does not validate epoch version rows, durable transition/audit invariants, recovery state, or an epoch-specific readiness contract. | [`test_epoch_scaffold.py`](../../backend/tests/migration_infrastructure/test_epoch_scaffold.py), [`test_migration_preflight.py`](../../backend/tests/test_migration_preflight.py); full suite. | **BLOCKED — OPERATOR EVIDENCE REQUIRED** before implementing or activating epoch transitions. |
| No approved existing-schema profile is available for adoption or preservation tests. | Did not fabricate a schema profile, use production/Neon, or stamp a database. The compatibility harness requires an approved profile/digest and exact starting revision and fails closed without them. | Harness guard tests passed. No existing-database replay was attempted. | **BLOCKED — OPERATOR EVIDENCE REQUIRED** |

### Remaining catalog coverage gaps

Manifest v2 improves inventory and fails closed on absent/unknown sections, but
it is not a complete PostgreSQL catalog equivalence proof. The following
semantics remain outside its verified canonical comparison:

- Aggregate and window routine identity/behavior.
- Exclusion constraints.
- Complete view/routine cross-schema dependency graphs, view options, and
  materialized-view refresh state.
- Effective privileges inherited through role membership and database-level
  ACLs.
- Extension ownership and all extension-managed object relationships.
- Some relation and column attributes, including collation, persistence, and
  relation storage/options.
- Any PostgreSQL catalog behavior not represented by the manifest's current
  normalized object records.

Do not treat a matching manifest as proof of full PostgreSQL semantic
equivalence. These gaps are **OPEN — ENGINEERING DEFECT** for any future
workflow that requires exhaustive catalog equivalence; migration activation
must remain closed until the gaps are either implemented and tested or
explicitly excluded by approved scope.

## 4. Runner, ownership, and state classification

### Runner entry points

- [`run_migrations.py`](../../backend/run_migrations.py) is the coordinated
  legacy runner.
- The root Alembic environment requires the runner-provided ownership
  attributes for online execution; direct offline/online execution is not an
  approved bypass.
- [`env.py`](../../frontend/backend/alembic/env.py) refuses direct Alembic use.
- Both tracked container entrypoints and both Render start commands launch
  Uvicorn without running a migration.
- The runner does not bootstrap an empty PostgreSQL database or stamp it.
  PostgreSQL dispatch fails before connecting. SQLite execution is separately
  guarded by maintenance evidence, backup, and ownership checks.

### Shared ownership evidence and limits

The advisory lock key is shared (`POSTGRESQL_MIGRATION_LOCK_NAMESPACE` and
`POSTGRESQL_MIGRATION_LOCK_KEY`). A dedicated `NullPool` connection holds the
lock. The runner asserts connection object, database, user, and backend PID
before and after migration-sensitive operations. The lock naturally ends when
the PostgreSQL backend session terminates.

Live tests exercised lock exclusion and cleanup after normal completion,
exception, and backend-session termination. The following are **not tested**:

- Concurrent attempts through both a legacy and an epoch runner (no epoch
  runner exists).
- Killing the migration client process during every transaction/DDL boundary.
- Full recovery of an interrupted PostgreSQL migration.
- Fresh epoch DDL or existing-schema adoption.

No claim of migration replay, process-termination recovery, or epoch/legacy
mutual exclusion is made.

### Epoch and legacy state

Legacy preflight is read-only and rejects missing/multiple/malformed revision
rows, unknown or non-ancestor revisions, incomplete applied-table evidence,
pending table conflicts, epoch object presence, and schema differences. The
legacy runner also refuses PostgreSQL before connection.

`epoch_state.py` detects whether epoch objects are absent, control-bootstrapped,
complete, or partially present. It does not yet verify
`alembic_version_epoch` contents or durable control/audit row invariants.
There is no active epoch lineage and no epoch-ready state to approve. Any
partial, malformed, mixed, or unknown epoch state must remain a manual
recovery case; no automatic stamping or repair is authorized.

## 5. PostgreSQL schema inventory and model/migration inventory

The generated static inventory is
[`PHASE_3_2K_MODEL_AND_MIGRATION_INVENTORY.json`](./PHASE_3_2K_MODEL_AND_MIGRATION_INVENTORY.json).
It records 77 registered model tables, 29 legacy revisions, and 303 parsed
migration operations. It was generated from current ORM metadata and migration
source; it did not connect to a database or execute DDL. It identifies no
migration-only table creation and no unresolved migration index target; two
migration indexes are represented by model unique constraints.

The PostgreSQL manifest is a separate live catalog inventory, exercised on a
disposable local PostgreSQL 18.6 instance. Its supported objects include
tables/columns, primary and foreign keys, unique/check constraints, indexes,
views/materialized views, triggers/functions, sequences/ownership, custom
types, extensions, RLS policies/state, partitions, grants/default privileges,
schema ownership, and cross-schema foreign keys to the extent represented by
the normalized queries. The precise gaps above remain. Neither inventory is
an approved historical profile or an adoption certificate.

## 6. Readiness and API startup

- `/health` remains liveness-only and does not invoke database preflight.
- `/ready` invokes read-only preflight and returns 503 for unknown revisions,
  schema drift, malformed or mixed state, and unreachable databases.
- Preflight uses a read-only SQLite connection or a PostgreSQL read-only
  transaction. It does not execute DDL, migrate, repair, or stamp.
- Legacy readiness does not require an epoch database to have a legacy
  `alembic_version` row; instead, the presence of epoch objects is incompatible
  with legacy readiness.
- Epoch-specific readiness is not implemented. An epoch database is not
  approved as ready.
- API-only disposable PostgreSQL smoke checks returned `/health` 200,
  `/ready` 503 for the deliberately incomplete synthetic schema,
  `/api/v1/auth/me` 401, and `/api/v1/dashboard` 401. The schema inventory and
  synthetic revision state remained unchanged.
- Root [`render.yaml`](../../render.yaml) checks `/health`; nested
  [`render.yaml`](../../frontend/render.yaml) checks `/ready`. This difference
  is documented but not changed. Whether the root
  Render service should use readiness rather than liveness requires operator
  direction; no deployment occurred.

## 7. Exact validation evidence

Commands were run from `backend` unless stated otherwise.

| Command | Result |
|---|---|
| `.\.venv\Scripts\python.exe -m alembic heads` | Exactly one head: `d1f5a8e7c2b4`. |
| `.\.venv\Scripts\python.exe -m alembic history --verbose` | 29 revisions; merge ancestry and single head confirmed. |
| `.\.venv\Scripts\python.exe -m pytest -q tests/migration_infrastructure/test_startup_migration_policy.py tests/test_database_isolation.py` | 20 passed. |
| `.\.venv\Scripts\python.exe -m pytest -q` | 251 passed, 11 skipped, 0 failed. |
| `.\scripts\test-postgresql18.ps1` | Disposable PostgreSQL 18.6 loopback run: 10 passed. API-only smoke results as documented above. |
| From `frontend`: `npm run lint` | Exit 0; 5 existing `<img>` optimization warnings, 0 errors. |
| From `frontend`: `npx tsc --noEmit` | Exit 0. |
| From `frontend`: `npm run build` | Exit 0; Next.js 16.4.5 production build completed. The command reported React 18 deprecation and loaded environment-file names; no environment values were inspected. |

The full backend suite was initially run concurrently with PostgreSQL test
load; a time-sensitive SQLite test counted 9/10 ticks. Its assertion was not
weakened. Serial runs passed: first 250 passed/11 skipped, then after the
additional regression test and startup-policy correction, 251 passed/11
skipped. No concurrency-related test failure remained in the final serial
run.

## 8. Required scenarios not executed

The following requirements remain **NOT TESTED** because PostgreSQL activation
is prohibited and no approved baseline/profile exists:

- Fresh PostgreSQL epoch installation using actual Alembic DDL.
- Existing-schema upgrade from an exact, operator-approved revision/profile.
- Upgrade from a database already at the current epoch head.
- Full existing-data preservation for users, profiles, roles, XP/levels,
  achievements, battles/participants/results, questions/submissions, and
  placement records.
- Epoch version-table, control-table, and audit-row validation.
- Concurrent legacy/epoch migration attempts.
- Actual migration failure, interrupted client process, and forward recovery.
- Unknown/incompatible existing schema rejection against an operator profile.

The live PostgreSQL suite validated ownership, identity, catalog inspection,
read-only preflight properties, and API startup only. It did **not** execute
`alembic upgrade`, `alembic stamp`, or any production migration.

## 9. External/operator blockers

Before any existing-database adoption or activation:

1. Provide an operator-approved, sanitized schema-only manifest from the
   intended source state, with exact supported starting revision and
   provenance. Do not provide production credentials or data rows.
2. Review and approve the epoch control/version/audit state machine and the
   recovery procedure for partial transitions.
3. Decide whether the root Render health check should remain liveness-only or
   use `/ready`.
4. Approve an isolated PostgreSQL test plan covering actual baseline DDL,
   adoption from the exact profile, synthetic data preservation, failure
   recovery, process termination, and concurrent ownership across both paths.
5. Resolve or formally scope the catalog coverage gaps listed above.

Until then, do not enable PostgreSQL migration execution, create the epoch
baseline, adopt/stamp an existing database, or claim compatibility.

## 10. Files changed in the audit scope

The audit/remediation touched the root runner and migration infrastructure,
readiness/preflight, isolated test bootstrap, PostgreSQL/schema tests, the
composite audit model index, the migration architecture documentation, the
static model/migration inventory, and startup-policy tests. Specific files
include:

- [`run_migrations.py`](../../backend/run_migrations.py)
- [`init_db.py`](../../backend/app/database/init_db.py)
- [`migration_coordinator.py`](../../backend/app/database/migration_infrastructure/migration_coordinator.py)
- [`schema_manifest.py`](../../backend/app/database/migration_infrastructure/schema_manifest.py)
- [`migration_preflight.py`](../../backend/app/database/migration_preflight.py)
- [`health.py`](../../backend/app/core/monitoring/health.py)
- [`model.py`](../../backend/app/modules/audit/model.py)
- [`test_database_isolation.py`](../../backend/tests/test_database_isolation.py)
- [`test_migration_preflight.py`](../../backend/tests/test_migration_preflight.py)
- [`test_health_readiness.py`](../../backend/tests/api/test_health_readiness.py)
- [`migration_infrastructure/`](../../backend/tests/migration_infrastructure/)
- [`test-postgresql18.ps1`](../../backend/scripts/test-postgresql18.ps1)
- [`ALEMBIC_MIGRATION_ARCHITECTURE.md`](../../backend/docs/ALEMBIC_MIGRATION_ARCHITECTURE.md)
- [`PHASE_3_2K_MODEL_AND_MIGRATION_INVENTORY.json`](./PHASE_3_2K_MODEL_AND_MIGRATION_INVENTORY.json)

The complete dirty worktree is not represented by this list; concurrent
unrelated changes were preserved.

## 11. Safety confirmations and final status

- No Neon or production database was accessed.
- The protected repository SQLite database was not accessed.
- PostgreSQL DDL/testing was confined to the uniquely named disposable
  loopback PostgreSQL 18.6 environment.
- No historical Alembic migration was changed or deleted.
- No PostgreSQL migration was executed; no database was stamped.
- No production environment variable was changed or inspected.
- No deployment, commit, or push occurred.
- PostgreSQL migration activation remains **CLOSED**.

Final assessment: critical runner and ownership bypasses are fixed and
verified on the covered paths. Existing-schema compatibility, epoch migration
readiness, exhaustive schema equivalence, and operator-dependent deployment
policy remain blocked/open. Do not describe the migration system as
production-ready or existing-database compatible.
