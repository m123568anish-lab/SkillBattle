# Phase 3.2A — Database Connection-Path Inventory

## Scope and safety

**Updated through Phase 3.2E.** The Phase 3.2A/3.2B observations remain
historical; the current evidence-based disposition is in the final section and
the [Phase 3.2D report](./PHASE_3_2D_IMPLEMENTATION_REPORT.md).

This is a static source inventory. The original SQLite database, environment files,
Neon, Render, and Supabase were not opened. No scripts, migrations, or application
startup paths were run. The isolated infrastructure tests use only pytest temporary
directories and synthetic SQLite schemas.

The inventory covers the active `backend/` tree, repository migration utilities,
the duplicated `frontend/backend/` tree, and database-creating test patterns found
by source search. It is not a claim that every third-party or manually launched
process has been discovered.

## Application engines and session paths

| Path | Access type | Where it is used | Phase 3.2B status / lock lifetime / test evidence |
|---|---|---|---|
| `backend/app/database/database.py` | Synchronous SQLAlchemy engine, `SessionLocal`, generator dependency `get_db()` | Sync API routes and middleware; direct engine consumers include initialization, migration preflight, and migration execution | **Not integrated.** No checkout/session hook acquires a shared lock; lock is not held over session or transaction lifetimes. Sync pool bypass demonstrated by `test_unintegrated_sqlalchemy_sync_pool_can_bypass_sidecar_lock`. |
| `backend/app/database/session.py` | Asynchronous SQLAlchemy engine, `AsyncSessionLocal`, `async_session_ctx()`, async `get_db()` | Most API/module routes; startup bootstrap and battle orchestration also open the factory directly | **Not integrated.** Async lock helper exists, but async sessions/connections do not acquire it. Async pool bypass demonstrated by `test_unintegrated_sqlalchemy_async_pool_can_bypass_sidecar_lock`. |
| `backend/app/database/init_db.py` | Direct synchronous engine inspection, `metadata.create_all()`, and repair SQL | Imported by test fixtures; schema initialization is application code, not an Alembic migration | **Not integrated; not run.** The broad test fixture can touch the configured application database unless isolated carefully. |
| `backend/app/database/migration_preflight.py` | Creates a SQLite read-only inspection engine (`mode=ro`) or another sync inspection engine | Read-only migration preflight | **Not integrated.** Separate engine and no shared lock lifetime. |
| `backend/alembic/env.py` | Alembic `engine_from_config()` connection | Legacy migration script environment | **Not integrated.** Its connection does not acquire an exclusive lock or share runner ownership. |
| `backend/run_migrations.py` | Uses the sync engine for preflight, then runs the legacy Alembic graph | Legacy migration runner | The runner now refuses if any provisional epoch control/version objects exist, based on the preflight connection's table names. **No exclusive lock is held**; a concurrent transition can race the check. Guard logic is tested against disposable SQLite only. |

### Direct consumers and asynchronous work

- Sync `get_db()` consumers found include `app/api/auth.py`,
  `app/api/dashboard/router.py`, `app/api/profile/router.py`,
  `app/middleware/api_auth.py`, and the `developer_portal`, `roadmap`, and
  `recruiter` module routers.
- Async `get_db()` consumers are spread across the API and module routers,
  including auth, profile, dashboard, battle, tournament, XP, placement,
  college, company, questions, analytics, notifications, matchmaking, and
  compiler/assessment flows. They use the common async session factory but do
  not acquire the new lock.
- `app/core/admin_bootstrap.py` opens `AsyncSessionLocal` directly during
  startup.
- `app/modules/battle/orchestrator/service.py` opens `AsyncSessionLocal`
  inside asynchronous battle-timer work. This is a background task and cannot
  rely on a request-scoped lock.
- Tournament schedulers generally receive an existing session; their database
  access is covered by the caller's session path, not by an independent scheduler
  engine. No standalone APScheduler/Celery database engine was identified in the
  searched application paths.
- `app/database/migrations.py` is empty and creates no connection.

These are source-level findings, not proof that every dynamically imported worker,
deployment process, or external tool follows the same lifecycle. Request handlers,
background tasks, and WebSocket paths that use these shared engines remain
uncoordinated. The existing persistence journey passed with temporary databases,
but that behavior test does not prove lock integration.

## Raw SQLite and maintenance paths

| Path | Static behavior | Phase 3.2B status / lock lifetime / test evidence |
|---|---|---|
| `backend/scripts/check_db.py` | Imports the application sync engine, then opens its SQLite database path directly with `sqlite3.connect()` | **Not integrated.** Raw handle lifetime bypasses the sidecar; not run. |
| `backend/tmp_db_check.py` | Hard-codes `D:\BattleAI\backend\skillbattle.db` and opens it directly | **Not integrated.** Inspected only; not run. |
| `scripts/migration/01_backup_and_verify_sqlite.py` | Reads a source SQLite file and writes a separate backup/output | **Not integrated.** Raw source and backup connections have no lock lifetime; not run. |
| `scripts/migration/02_validate_sqlite_integrity.py` | Opens the configured SQLite source read-only | **Not integrated.** Read connection bypasses lock; not run. |
| `scripts/migration/03_check_supabase_connection.py` | Creates a PostgreSQL engine from explicit/environment URL values; connectivity and catalog checks | **Not integrated.** External DB path; not run and no environment values inspected. |
| `scripts/migration/04_prepare_supabase_schema.py` | May invoke Alembic and execute PostgreSQL DDL | **Not integrated.** Mutating path; not run. |
| `scripts/migration/05_transfer_data_sqlite_to_postgres.py` | Reads SQLite source and may write to a PostgreSQL target | **Not integrated.** Both sides bypass coordination; not run. |
| `scripts/migration/06_sync_postgres_sequences.py` | May execute PostgreSQL `setval()` calls | **Not integrated.** Mutating external path; not run. |
| `scripts/migration/07_reconcile_identity_mapping.py` | May update PostgreSQL user identity mappings | **Not integrated.** Mutating external path; not run. |
| `scripts/migration/08_validate_migration_parity.py` | Reads SQLite source and PostgreSQL target | **Not integrated.** Both reads bypass coordination; not run. |
| `scripts/migration/09_test_supabase_auth_import.py` | Reads the SQLite source and may call the Supabase Auth API | **Not integrated.** External access path; not run. |
| `scripts/migration/10_inspect_supabase_target.py` | Connects to PostgreSQL for catalog inspection and sets the transaction read-only | **Not integrated.** External access path; not run. |
| `scripts/migration/test_tooling.py` | Uses a mock SQLite path in its test logic | **Not integrated.** Test-only path by intent; not run in this phase. |

The migration scripts are independent executable programs and cannot be made
cooperative merely by adding a lock to the FastAPI session factories. Raw
`sqlite3.connect()` users, Alembic, SQLAlchemy engine connections, backup tools,
and third-party processes all need explicit coordination or must be excluded from
the transition window. A sidecar lock does not stop an uncoordinated process from
opening the SQLite file.

## Duplicate backend tree

Static search also found database setup and Alembic files under
`frontend/backend/` (including `app/database/database.py`,
`app/database/session.py`, `alembic/env.py`, and `scripts/check_db.py`). Their
deployment role was not established. They are separate potential connection paths
if that tree is launched or packaged, and they are not integrated with the new
lock.

## Test connection paths

The existing backend tests create in-memory SQLite engines in test modules and
create a file-backed SQLite engine under `tmp_path` in
`tests/modules/test_local_database_persistence_restart.py`. Migration preflight
tests also use temporary SQLite files. These individual engines do not
automatically use the new sidecar lock. The new persistence behavior test uses a
per-test temporary file; it does not exercise coordinated sessions.

Important fixture hazard: `backend/tests/conftest.py` has an autouse fixture that
calls `init_db()`, which uses the application engine and may reach the configured
database. The new infrastructure test directory shadows that fixture with a
local no-op fixture and is run with pytest's `--confcutdir` pointed at that
directory. The broader test suite was not run because it may invoke the
application-database fixture.

## Phase 3.2B lock integration result and blockers

- **Application connection paths integrated:** none.
- **Legacy migration runner:** fail-closed epoch object guard added; exclusive
  lock not integrated, so a TOCTOU race remains.
- **Alembic environment:** not integrated.
- **Raw scripts:** none integrated.
- **Isolated lock API exercised:** yes, from independent test processes and
  disposable SQLite files only; separate tests prove sync and async SQLAlchemy
  pools can currently bypass it.
- **Application behavior regression check:** existing temporary-DB persistence
  journey passed (registration, profile update, XP, battle settlement/history,
  admin update, engine restart).
- **Processes prevented from bypassing the lock:** only cooperating callers that
  explicitly hold the sidecar lock. The direct-writer test confirms an
  uncoordinated external process can still write while the sidecar is locked;
  SQLAlchemy sync/async pools also bypass it.
- **Next integration prerequisite:** inventory and adapt every in-scope engine,
  session, startup/background task, migration process, and maintenance tool under
  one lock protocol. This cannot be claimed complete until each connection
  lifetime is covered and Linux/POSIX locking and production database choices are
  validated.

The centralization requirement is blocked. An engine-level synchronous pool
checkout callback would block the event loop for `aiosqlite` while waiting for
the OS lock; session-only wrapping would miss direct engine users, background
sessions, Alembic, raw sqlite3, test-created pools, and maintenance scripts.
Implementing a safe end-to-end coordinator therefore needs an explicit async
connection acquisition/lifetime integration and migration/script ownership
redesign. No partial hook was added.

## Platform and PostgreSQL — Phase 3.2D snapshot

The following paragraphs record the state at the end of Phase 3.2D. They are
historical and are superseded for current ownership/test status by the Phase
3.2E section below.

The initial implementation supports Windows NTFS fixed local volumes only;
POSIX and network/shared SQLite filesystems are not supported. The database
file must not be shared across hosts. The current lock check rejects UNC paths,
non-fixed Windows volumes, non-NTFS filesystems, and any reparse-point path
component (including symlinks/junctions); hard-link aliases remain unsupported
and undetected.

At that phase, Docker and PostgreSQL server tools were unavailable, and the
server major version had not been established. Phase 3.2E subsequently used a
disposable local PostgreSQL 18.6 instance for coordinator tests only; full
migration upgrades remain unvalidated.

## Phase 3.2E current status

The following supersedes the earlier "not integrated" status only where noted.
The maintenance coordinator is a runner gate; it is not an application-wide
SQLite lock and does not prevent non-cooperating clients from opening the file.

| Connection path | Current status | Ownership/lifetime and evidence | Remaining bypass or blocker |
|---|---|---|---|
| Legacy runner on local SQLite (`backend/run_migrations.py`) | **Explicitly gated; migration activation is blocked.** Without `--execute`, the CLI exits 2 before invoking migration logic. With the flag, a trusted maintenance verifier and fresh backup path are still required. | Acquires the exclusive sidecar before backup/preflight, creates and verifies a new SQLite backup, reuses one SQLAlchemy connection for preflight, Alembic, and final head validation, and keeps ownership through the call. Disposable two-process tests exercise serialization and epoch-state refusal. | There is no trusted host/process-maintenance verifier installed or CLI provider. Actual application quiescence is not established, so a migration cannot be authorized in this repository yet. |
| Legacy Alembic environment (`backend/alembic/env.py`) | **SQLite direct Alembic access blocked unless an active coordinator lease and the same connection are supplied; PostgreSQL access requires the new tested lease but the runner gate currently blocks PostgreSQL migrations.** | SQLite validates active lease and canonical identity. PostgreSQL validates the active lease, exact connection, database identity, `NullPool`, and backend PID. Six disposable PostgreSQL 18.6 ownership tests passed, including a synthetic Alembic same-connection migration. | The complete PostgreSQL revision graph has not passed fresh and supported-revision upgrades; no PostgreSQL DDL is authorized. |
| Epoch Alembic environment (`backend/alembic_epoch/env.py`) | **Inactive and fails closed.** Requires explicit scaffold opt-in, a revision head, and an active ownership lease. | Direct online invocation without injected ownership is rejected; current scaffold has no revisions, so no migration can execute. | There is no epoch runner, control/audit state machine, transition marker, or automatic-recovery implementation. PostgreSQL epoch execution is explicitly blocked. |
| Application sync SQLAlchemy engine/session | **Not coordinated during normal requests.** | FastAPI lifespan disposes the sync engine on shutdown. No shared lock is held for request/session lifetime. | During a maintenance migration, an external verifier must prove every process using this engine stopped, requests/transactions drained, and its pool disposed. No trusted quiescence provider exists. |
| Application async SQLAlchemy engine/session | **Not coordinated during normal requests.** | FastAPI lifespan now awaits disposal of the async engine on shutdown; no per-session shared lock exists. | Detached background tasks and live requests may retain/reopen database access; process shutdown/drain controller is absent. |
| Startup admin bootstrap | **Removed from API startup; explicit command available.** | `backend/run_admin_bootstrap.py` invokes the existing bootstrap outside the FastAPI lifespan. | Command was not executed in this phase and does not provide migration coordination; run only with an explicitly authorized DB target. |
| Battle settlement/orchestration | **Not reliably stoppable from current lifecycle code.** | `BattleOrchestrator.start_battle` creates/awaits timer work and opens `AsyncSessionLocal` for settlement. The task is launched with `asyncio.create_task` from battle service without a retained task handle. | No application-wide cancel/join/drain mechanism. Changing settlement cancellation semantics needs a separate design. |
| WebSocket forfeit tasks | **Partially tracked, not globally drained.** | Manager stores per-player tasks and cancels them on reconnect. No app shutdown method joins/cancels all outstanding tasks. | Maintenance verifier cannot rely on app shutdown to prove task completion. |
| Raw SQLite scripts, backups, diagnostics, and maintenance utilities | **Not coordinated.** | Direct `sqlite3.connect()` paths remain independent of the sidecar. | Each process must be stopped/disabled by a trusted host controller; no controller exists. |
| Duplicate `frontend/backend/` tree | **Not coordinated; runtime role unresolved.** | Separate sync/async engines and Alembic environment remain possible database users. | Must determine whether deployed/launched and stop or adapt all entry points. |
| Test-created engines | **Focused regression and API tests used explicit disposable SQLite paths.** | Migration/readiness regressions: 35 passed, 6 skipped. Auth/dashboard integration tests: 4 passed. | Full backend persistence suite was not run. |
| PostgreSQL migration runners | **Ownership mechanism implemented and tested; full migration execution blocked.** | Six PostgreSQL 18.6 tests passed for lock competition/release, connection identity, Alembic handoff, index/comparator behavior, and session termination. Runner still rejects PostgreSQL before acquiring ownership. | Design/approve a safe fresh-database strategy and pass fresh plus supported-revision disposable upgrades before opening the execution gate. |

Phase 3.2D added hard-link detection for existing SQLite database/sidecar files.
The NTFS hard-link test passed. The symlink creation test remains skipped because
Windows returned `WinError 1314`; actual symlink/junction behavior is unverified.

**Acceptance remains blocked:** no production-grade process orchestrator
provides quiescence evidence; the app cannot prove all async/background task
shutdown; raw and duplicate-tree clients remain outside the coordinator;
transition audit and crash recovery are not implemented; and the full
PostgreSQL migration graph has not passed disposable upgrade tests. No connection
path in this inventory authorizes migration activation or epoch activation.
