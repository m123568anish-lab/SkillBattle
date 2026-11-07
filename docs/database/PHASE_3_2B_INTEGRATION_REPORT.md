# Phase 3.2B — Database Access Coordination & Integration Report

## Status

**Integration acceptance: BLOCKED.** The current sidecar-lock helper is not a
central database access coordinator. Installing a partial SQLAlchemy hook would
leave bypasses and, for async SQLite, risk blocking the event loop. Per the task
instruction to stop unsafe portions rather than use a workaround, application,
Alembic, raw-script, and test-factory lock integration was not attempted.

Implemented this phase:

- A fail-closed legacy migration runner guard that refuses to proceed when
  provisional epoch control/version objects exist.
- A Windows path guard that rejects UNC/non-fixed/non-NTFS locations and
  reparse-point path components (including symlinks and junctions).
- Explicit tests demonstrating that current SQLAlchemy sync and async pools
  bypass the sidecar lock.
- An isolated application persistence regression run and this report/inventory
  update.

The epoch remains inactive. No baseline, migration, production setting,
deployment, or database was changed.

## 1. Phase 3.2A review and guarantees

Reviewed the Phase 3.2A implementation report, connection inventory,
`SQLiteFileLock`, epoch-state helper, manifest tooling, and infrastructure tests.
The helper uses a Windows kernel byte-range lock on a persistent sidecar and
supports shared/exclusive handles, bounded waits, and async acquisition through
`asyncio.to_thread()`. On this machine, the drive is a fixed NTFS volume.

The helper's guarantee is cooperative only: it excludes processes that acquire
the same sidecar lock. It does not lock the SQLite DB file itself, intercept
other connection APIs, or prevent uncoordinated processes from opening it. The
async API only makes acquisition asynchronous for callers that explicitly use
it; it does not automatically coordinate SQLAlchemy sessions or engines.

## 2. Database access path disposition

The detailed path-by-path table is in
[`PHASE_3_2A_CONNECTION_INVENTORY.md`](./PHASE_3_2A_CONNECTION_INVENTORY.md).

| Access path | Integration result | Lock lifetime / evidence |
|---|---|---|
| Sync SQLAlchemy engine and sessions (`app/database/database.py`) | **Not integrated** | None. A disposable test shows a sync engine pool successfully connects while an exclusive sidecar lock is held. |
| Async SQLAlchemy engine and sessions (`app/database/session.py`) | **Not integrated** | None. A disposable test shows an async engine pool successfully connects while an exclusive sidecar lock is held. |
| API requests, dependency sessions, and WebSockets | **Not integrated** | They use the uncoordinated sync/async engines above. |
| Background/startup direct `AsyncSessionLocal` use | **Not integrated** | Admin bootstrap and battle orchestration open the async session factory directly. |
| Initialization and repair (`init_db.py`) | **Not integrated; not run** | Direct engine operations. Existing root test fixture can invoke this against configured application DB; no broad test suite was run. |
| Migration preflight | **Not integrated; not run** | Creates its own inspection engine/connection. |
| Legacy migration runner | **Guard only** | It now refuses if any epoch control/version object is found on its preflight connection. There is no exclusive lock around inspection or execution, so a TOCTOU race remains. |
| Legacy Alembic `env.py` | **Not integrated; not run** | Creates a separate engine connection and can bypass any session wrapper. |
| Raw SQLite diagnostics and migration utilities | **Not integrated; not run** | Direct `sqlite3.connect()` calls bypass the sidecar unless explicitly wrapped. The hard-coded diagnostic DB script was not run. |
| Test-created engines and factories | **Not integrated** | Existing test engine factories do not acquire a shared lock. The integration test directory safely cuts off the root fixture. |
| Duplicate `frontend/backend/` tree | **Not integrated; not run** | Its deployment role is unclear and its engines/Alembic setup are separate potential bypasses. |
| PostgreSQL migration/maintenance paths | **Not integrated; not run** | Require a separate advisory-lock design and disposable PostgreSQL validation. |

### Why end-to-end integration stopped

SQLAlchemy pool `checkout` callbacks are synchronous. Calling the helper's
blocking `acquire()` there for `aiosqlite` can block the event loop, violating
the explicit async requirement. Acquiring only in `get_db()` would miss direct
`AsyncSessionLocal` uses, engine consumers, Alembic's independent engine, raw
SQLite, test factories, and standalone scripts. A runner-only exclusive lock
would not protect against the currently uncoordinated application processes.

A safe implementation needs a designed asynchronous connection-acquisition and
lease-lifetime layer, a policy for direct engine access and nested use, and
coordinated ownership across all scripts and runners. The current lock is not
reentrant; callers must not blindly nest it. No partial hook was added.

## 3. Legacy runner epoch-state guard

`backend/run_migrations.py` now checks the inspected table names before the
legacy graph preflight. It refuses to run when the provisional epoch control
tables or active epoch version table are present; partial combinations raise
the same fail-closed state error. Only complete absence of epoch objects permits
legacy-runner preflight.

The guard is defense-in-depth only. Because the runner does not hold a migration
exclusive lock, another process could create epoch state immediately after the
check. The guard checks catalog names, not control rows, audit state, active-head
contents, or schema fingerprints. It must not be interpreted as migration
coordination or epoch activation.

The guard test created only synthetic tables in a pytest temporary SQLite file.
It did not import/run the legacy runner or invoke Alembic.

## 4. Tests and results

### Isolated lock, epoch guard, and manifest suite

Command:

```powershell
Set-Location backend
$env:PYTHONDONTWRITEBYTECODE='1'
..\.venv\Scripts\python.exe -m pytest --confcutdir=tests\migration_infrastructure tests\migration_infrastructure -q -rs
```

Result: **exit code 0; 21 passed, 1 skipped**.

Included helper contention, crash release, durable marker persistence, timeout,
async event-loop progress, shared reader/writer process behavior, SQLite
`DELETE`/`WAL` checks, partial epoch-state refusal, legacy guard checks in a
temporary database, manifest checks, and the inactive epoch scaffold check.

Two passing tests intentionally demonstrate failed acceptance properties:

- `test_unintegrated_sqlalchemy_sync_pool_can_bypass_sidecar_lock`
- `test_unintegrated_sqlalchemy_async_pool_can_bypass_sidecar_lock`

They pass because they verify the known bypass exists. Thus **connection-pool
coordination acceptance fails**, even though the regression suite exits 0.
Likewise the direct uncoordinated sqlite3 writer test demonstrates that the
sidecar is not an OS-enforced database-file lock.

Skipped: symlink creation was denied with Windows `WinError 1314`; an actual
alias path could not be exercised. A safe rejection policy was added and its
reparse-point decision branch was tested with mocked Windows file attributes;
the real Windows symlink/junction rejection remains unverified in this
environment.

### Isolated persistence regression

Command (application-wide DB URLs pinned to memory; test itself uses its own
`tmp_path` file; root `tests/conftest.py` excluded):

```powershell
Set-Location backend
$env:PYTHONDONTWRITEBYTECODE='1'
$env:DATABASE_URL='sqlite:///:memory:'
$env:ASYNC_DATABASE_URL='sqlite+aiosqlite:///:memory:'
$env:SQLITE_DATABASE_URL='sqlite:///:memory:'
$env:SQLITE_ASYNC_DATABASE_URL='sqlite+aiosqlite:///:memory:'
..\.venv\Scripts\python.exe -m pytest --confcutdir=tests\modules tests\modules\test_local_database_persistence_restart.py -q
```

Result: **exit code 0; 1 passed, 70 warnings**. The test exercised registration,
profile update, XP award/persistence, battle creation/settlement/history,
administrative update, and database engine disposal/restart. It did not cover
dashboard API retrieval, placement operations, real request locks, WebSocket
database access, or background lock coordination.

### Not run

- Full backend suite: root autouse fixture may call `init_db()` against
  application configuration.
- Migrations or migration-chain tests.
- Production build or application startup.
- Any original local, Neon, Render, Supabase, or other configured DB access.
- PostgreSQL advisory lock tests.

## 5. Windows-specific validation

Environment: Python 3.14.4, SQLite 3.50.4, SQLAlchemy 2.0.51, aiosqlite 0.22.1,
Windows fixed NTFS volume. Process contention, timeout, crash release, journal
modes, async lock acquisition, and path normalization for dot segments passed.

Symlink creation was unavailable to the current user. The helper now rejects
existing reparse-point components rather than relying on alias canonicalization.
The reparse-point decision path passed with mocked Windows file attributes; the
actual Windows symlink/junction syscall path remains unverified. Hard-link
aliases are not detected and remain unsupported.

## 6. PostgreSQL status

No Docker, PostgreSQL server, `pg_ctl`, `initdb`, or `psql` was available. No
external database endpoint or environment value was inspected or contacted.
PostgreSQL major version is unknown. PostgreSQL session-level advisory locking
was not implemented or tested, and compatibility is **unverified**.

## 7. Files changed in Phase 3.2B

- `backend/app/database/migration_infrastructure/epoch_state.py`
- `backend/app/database/migration_infrastructure/sqlite_lock.py`
- `backend/run_migrations.py`
- `backend/tests/migration_infrastructure/test_sqlite_lock.py`
- `docs/database/PHASE_3_2A_CONNECTION_INVENTORY.md`
- `docs/database/PHASE_3_2B_INTEGRATION_REPORT.md`

The worktree already contained unrelated and prior-phase modifications. They
were not reverted. The inactive epoch scaffold and app startup/deployment
configuration were not changed in this phase.

## 8. Acceptance and remaining blockers

| Acceptance criterion | Result |
|---|---|
| Every Qubira-controlled SQLite path coordinated or explicitly blocked | **Fail** — application, Alembic, raw-script, duplicate-tree, and test engine paths remain bypasses. |
| SQLAlchemy sync/async pools cannot bypass lock | **Fail** — both bypass demonstrations pass. |
| Legacy runner refuses active/incomplete epoch object state | **Partial pass** — fail-closed catalog-name guard added; no lock and a race remains. |
| Persistence behavior preserved on isolated DB | **Pass for tested journey only** — one existing temporary-file persistence test passed. |
| Cross-process lock helper tests | **Pass for helper behavior** — not application integration. |
| Windows alias safety | **Partial** — reparse-point rejection implemented; actual symlink/junction case unverified. |
| PostgreSQL coordination | **Unverified** — no disposable server or version available. |
| Inactive epoch remains inactive | **Pass** — no revisions added and no startup integration. |
| Original and production databases untouched | **Pass** — no connections or DB operations were performed against them. |

Migration activation remains blocked. Do not start Phase 3.2C or generate a
baseline until the shared access architecture closes all listed bypasses, the
async path is proven non-blocking, the transition runner holds the appropriate
exclusive coordinator for its full lifetime, Windows alias tests can run, and
the PostgreSQL strategy is validated against an approved disposable server.

## 9. Safety confirmation

No original local SQLite database, Neon, Render, Supabase, or other production
database was connected to or modified. No migration was executed, no historical
revision was edited, no deployment configuration or production environment
variable was changed, and no epoch was activated, committed, pushed, or deployed.
