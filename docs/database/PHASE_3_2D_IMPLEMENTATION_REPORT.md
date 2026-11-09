# Phase 3.2D — Controlled Migration Coordinator Implementation Report

## Status

**Partial implementation; migration activation remains blocked.**

Implemented a Windows/local-NTFS SQLite ownership primitive for a migration
runner, a required maintenance-evidence interface, a non-overwriting SQLite
backup-and-validation step, and source-level same-connection handoff wiring to
legacy Alembic.
The runner refuses SQLite execution when no verifier/backup path is supplied;
the normal command-line entrypoint supplies neither and therefore fails closed
before creating or opening the target database.

This is not a complete maintenance controller. The repository has no trusted
service/process orchestrator that proves application/worker shutdown, pool
disposal, background-task drainage, raw-handle closure, or external access
control. The `MaintenanceWindowEvidence` value is only an interface for such a
provider; its booleans are not independent proof. No provider is installed, and
the application has lifecycle gaps described below.

The PostgreSQL coordinator and tests were not implemented because no disposable
PostgreSQL server/tools were available. The legacy runner and direct online
Alembic environment now fail closed for non-SQLite dialects instead of using an
uncoordinated PostgreSQL path. PostgreSQL migration support is not available.
The epoch remains inactive with no revisions. **Phase 3.2D acceptance and
migration activation are not approved.**

## Architecture implemented

### SQLite migration ownership

`acquire_sqlite_migration_ownership()`:

1. Rejects non-SQLite, in-memory, or missing-verifier use.
2. Resolves the canonical database identity and acquires the exclusive
   persistent sidecar lock before database inspection.
3. Rechecks filesystem/file identity and requires recent maintenance evidence
   covering stopped application/worker processes, disposed sync/async pools,
   stopped background/scheduled work, closed raw connections, and controlled
   external access.
4. Creates a new SQLite backup without overwriting an existing file, then
   checks its integrity, foreign keys, schema fingerprint, table row counts,
   page count, and SHA-256.
5. Opens the SQLAlchemy connection, rechecks live integrity/schema/counts
   against the backup, and yields one active ownership object.
6. Keeps the lock and connection through the caller's Alembic work and
   validation, then invalidates the lease, closes the connection, and disposes
   the synchronous engine.

The runner's SQLite path is wired to pass that same connection and active
ownership into legacy Alembic. The SQLite Alembic environment refuses direct
online use without the same active ownership object and canonical identity.
No successful Alembic migration was executed, so runtime upgrade and
post-validation handoff have not been verified. This is cooperative
coordination only: a raw or otherwise non-cooperating process can still open the
SQLite file. The required host/process verifier is not present.

The legacy runner and direct online Alembic environment refuse PostgreSQL until
a tested session-level advisory-lock implementation is available. Offline SQL
generation does not execute migrations against a database.

### Filesystem identity

The Windows lock helper now checks the unresolved path for reparse points before
canonicalization and rejects hard-linked database and sidecar files. Existing
database identity is rechecked after lock acquisition. The policy remains
Windows fixed-local NTFS only; UNC/network/shared files, POSIX, cloud-synced
locations, and cross-host SQLite remain unsupported.

The epoch Alembic environment additionally refuses execution while the scaffold
has no revisions, requires an injected active ownership lease for online
execution, validates its database identity, and explicitly blocks PostgreSQL.
There is still no epoch runner, control/audit schema, durable transition
state-machine, or automatic-recovery implementation.

## Application lifecycle findings

| Path | Observed behavior | Result |
|---|---|---|
| Sync SQLAlchemy engine | FastAPI lifespan calls `engine.dispose()` on shutdown. The SQLite migration coordinator also disposes the synchronous engine before and after its leased connection. | The runner's own sync engine is disposed; application-process quiescence is still external. |
| Async SQLAlchemy engine | `app/database/session.py` owns a separate async engine; FastAPI lifespan does not explicitly await its disposal. | Not confirmed disposed by application shutdown. |
| Startup admin bootstrap | `ensure_platform_admin()` is awaited during startup and uses `AsyncSessionLocal` directly. | No independent recurring task was found; it is not lock-coordinated. |
| Application startup epoch gate | No active-head/control/audit/fingerprint verification was observed in `main.py`. | Epoch is inactive; startup gating is not implemented. |
| Battle settlement | Battle service starts `BattleOrchestrator.start_battle` with `asyncio.create_task`; the created task is not retained in an application-wide registry. It later uses `AsyncSessionLocal` to settle the battle. | Cannot reliably drain/join from the current lifespan. Cancellation policy could affect battle settlement, so it was not changed. |
| WebSocket forfeit tasks | Per-player tasks are tracked and canceled on reconnect, but no global shutdown/join method was found. | Not proven stopped at application shutdown. |
| Raw SQLite and maintenance scripts | Diagnostics, backup, migration, and validation scripts open SQLite independently. | They must be stopped by an external controller; they do not participate in the sidecar protocol. |
| Duplicate `frontend/backend/` tree | Separate engine/session/Alembic entry points remain; deployment role is unknown. | Cannot be declared stopped or excluded without an ownership/deployment inventory. |

No application runtime behavior was changed to cancel or alter battle tasks.
The maintenance verifier must not claim quiescence until these gaps are resolved
or an external process controller proves all relevant processes have exited.

## Runner serialization and recovery

- Legacy SQLite runner is wired to use one active lease and one connection for
  preflight, Alembic execution, and final head validation. That path was not
  exercised with a successful migration.
- The legacy epoch-object guard remains in place and refuses any detected epoch
  control/version object state. The guard is performed under the new lease for
  SQLite execution.
- A disposable two-process runner-coordination test proves the exclusive
  ownership requests serialize and that a waiting legacy runner checks state
  only after acquiring ownership, then refuses the epoch control state written
  by the first process. Existing lock tests also cover competing lock holders,
  timeout, and kernel-lock release after process termination.
- The standard `python run_migrations.py` invocation has no verifier or backup
  path and refuses SQLite before creating/opening the target DB. There is no
  trusted CLI verifier provider yet.
- PostgreSQL legacy runner and direct online Alembic invocation refuse before
  database connection because advisory locking is not implemented or tested.
- No migration was executed. There is no durable transition marker or
  audit/version-table state machine for crashes before/after DDL, version
  recording, or verification. Therefore only lock-release and independent
  backup-refusal behavior were tested; migration crash recovery is not
  implemented or proven.
- The epoch cannot resume an uncertain transition because no epoch runner or
  recovery mechanism exists. The inactive scaffold refuses execution rather
  than attempting automatic recovery.
- The backup receipt is returned to the calling process but is not written to a
  durable transition audit; no epoch audit/control schema exists yet.

## Connection-path coverage

| Path | Phase 3.2D disposition |
|---|---|
| Legacy SQLite runner | Exclusive lease and backup gate exist; absent a trusted maintenance provider, actual runner execution remains refused. |
| Legacy SQLite Alembic environment | Direct online invocation without the lease is refused; runner path uses the owned connection. |
| Legacy PostgreSQL runner/Alembic | Fail closed before database connection; advisory lock remains unimplemented and untested. |
| Epoch Alembic | No revisions and no runner; direct execution is refused. Future implementation must use the same SQLite ownership contract or a PostgreSQL session-level lock on the same connection. |
| Sync/async application sessions and requests | Not integrated with per-operation locks; the selected maintenance-window architecture requires all processes to stop. |
| Background battle tasks and WebSockets | No global shutdown/drain/join proof. |
| Raw SQLite, maintenance utilities, test engines | Not automatically coordinated. Tests in this report use only explicit disposable `tmp_path` files. |
| `frontend/backend/` | Deployment/runtime role unresolved; remains a possible bypass. |

The full connection inventory is
[`PHASE_3_2A_CONNECTION_INVENTORY.md`](./PHASE_3_2A_CONNECTION_INVENTORY.md).

## Validation results

Environment: Windows, Python 3.14.4, SQLite 3.50.4.

### Isolated migration infrastructure

Command:

```powershell
Set-Location backend
$env:PYTHONDONTWRITEBYTECODE='1'
.\.venv\Scripts\python.exe -m pytest --confcutdir=tests\migration_infrastructure tests\migration_infrastructure -q -rs
```

Result after the final runner refusal and cross-process check/use test:
**32 passed, 1 skipped**.

Coverage included:

- Fresh and known-schema disposable databases.
- Backup integrity, foreign-key validation, content/table-count preservation,
  no overwrite, and live database reinspection against the snapshot.
- Refusal when the simulated maintenance evidence reports an active app or
  when no verifier is supplied.
- The normal legacy SQLite runner refuses without a verifier and does not
  create the target database.
- The legacy runner refuses an uncoordinated database dialect before calling
  `connect()`.
- Two independent processes serialize; the waiting legacy-runner path observes
  synthetic epoch control state after lock acquisition and refuses to proceed.
- Existing helper tests for exclusive/shared contention, lock timeout, crash
  release with a persistent marker, stale owner metadata, and direct-writer
  limitation.
- Hard-link database identity rejection.

**Skipped:** actual symlink alias creation was denied with Windows `WinError
1314`. Junction behavior was not tested. Reparse-point rejection logic has
previous mocked coverage; actual alias behavior remains unverified.

The two-process test uses synthetic verifiers; it proves lock serialization,
not that real application processes or external clients were stopped.

### Isolated application persistence

Command used in the backend with all application SQLite URLs pinned to
in-memory databases and the existing per-test data file isolated under
`tmp_path`:

```powershell
Set-Location backend
$env:PYTHONDONTWRITEBYTECODE='1'
$env:DATABASE_URL='sqlite:///:memory:'
$env:ASYNC_DATABASE_URL='sqlite+aiosqlite:///:memory:'
$env:SQLITE_DATABASE_URL='sqlite:///:memory:'
$env:SQLITE_ASYNC_DATABASE_URL='sqlite+aiosqlite:///:memory:'
.\.venv\Scripts\python.exe -m pytest --confcutdir=tests\modules tests\modules\test_local_database_persistence_restart.py -q
```

Result: **1 passed, 70 warnings**. This is a persistence regression only; it
does not test lifecycle shutdown, migration coordination, dashboard retrieval,
or placement flows. Its test fixture calls `Base.metadata.create_all()` only
against its disposable `tmp_path` database; no existing or protected database
was initialized this way.

### Other checks

- Python AST parsing: **7 changed Python files parsed successfully**.
- `git diff --check`: passed at the time checked.
- Pylance diagnostics timed out; no Pylance diagnostic result is claimed.
- Full backend suite, full app startup, production build, and historical/epoch
  migration execution were not run.

## PostgreSQL status

No `docker`, `podman`, `postgres`, `pg_ctl`, `initdb`, or `psql` executable was
available on PATH. The PostgreSQL major version is unknown. No PostgreSQL
server, Neon, Render, or production endpoint was contacted. Session-level
advisory locking, same-connection Alembic execution, competing runners,
connection-loss release, and rollback tests remain unimplemented and blocked.

## Files created and modified

- Added `backend/app/database/migration_infrastructure/migration_coordinator.py`.
- Updated `backend/app/database/migration_infrastructure/sqlite_lock.py` for
  unresolved reparse-point checks and hard-link rejection.
- Updated `backend/run_migrations.py` and `backend/alembic/env.py` to use a
  leased SQLite connection, fail closed for uncoordinated direct SQLite
  Alembic execution, and block PostgreSQL online migration paths pending
  advisory-lock support.
- Updated `backend/alembic_epoch/env.py` to remain inactive without revisions
  and ownership, and to block untested PostgreSQL execution.
- Added coordinator, backup, runner-refusal, race, and live-reinspection tests
  under `backend/tests/migration_infrastructure/`; extended the lock tests for
  hard-link rejection.
- Updated `docs/database/PHASE_3_2A_CONNECTION_INVENTORY.md`.
- Added this report.

No historical Alembic revision, canonical epoch baseline, deployment setting,
entrypoint, or application business logic was changed.

## Remaining blockers and decision

1. Implement and review a trusted maintenance-window provider that can prove
   all app instances/workers have stopped, all requests/tasks drained, pools
   disposed, raw DB handles closed, scheduled jobs disabled, and external access
   controlled. The current boolean evidence object is not proof by itself.
2. Add a defined shutdown/drain protocol for async engine connections,
   battle-settlement tasks, and WebSocket forfeit tasks without changing
   settlement semantics.
3. Decide whether and how the duplicate `frontend/backend/` tree and every raw
   script are deployed or launched; either integrate them or reliably stop them.
4. Define and test the durable epoch control/audit state machine and crash
   recovery for failures before/during/after DDL, version-table updates, and
   validation. Do not automatically retry uncertain states or fall back to the
   legacy chain.
5. Add a fail-closed application startup check for exactly one active epoch
   head, verified transition status, and matching schema fingerprint before any
   database-backed startup work.
6. Implement PostgreSQL session-level advisory locking with the same connection
   handed to Alembic, after the server major version and disposable PostgreSQL
   environment are supplied.
7. Run actual symlink/junction checks on an authorized Windows test host and
   verify backup restoration from a separately protected location.

**Migration activation is still blocked.** Phase 3.2D is not complete under its
acceptance criteria, and Phase 3.2E/baseline work must not start automatically.

## Safety confirmation

Only disposable temporary SQLite databases were opened by the tests. The
protected `D:\BattleAI\skillbattle.db`, any other original application database,
Neon, Render, and all production data were not accessed or modified. No
migration, stamp, production build, deployment, commit, or push was performed.
The persistence regression's `create_all()` call was confined to its disposable
temporary database. Test-only environment variables were confined to their
child processes/tool invocation and were not persisted.
