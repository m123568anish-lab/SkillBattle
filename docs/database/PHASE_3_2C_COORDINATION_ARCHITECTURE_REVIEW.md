# Phase 3.2C — Migration Coordination Architecture Review

## Executive decision

**Recommend an exclusive maintenance window for local, file-backed SQLite
migrations. Do not proceed to migration activation yet.**

Phase 3.2B proved that the current SQLite sidecar is not an application-wide
coordinator: both SQLAlchemy's synchronous and asynchronous pools can open a
connection while an exclusive sidecar lock is held, and an uncoordinated
`sqlite3` writer can also access the database. The legacy runner's epoch-object
guard prevents some stale-runner executions, but it does not hold a lock and
therefore has a check/use race.

An application-wide shared/exclusive protocol could theoretically coordinate
every checkout, but it would require a mandatory async-safe acquisition and
release layer for every engine, raw connection, process, and maintenance tool.
SQLAlchemy pool events alone are not a safe shared integration point for
blocking OS locks: async engine pool events are synchronous. Current bypasses
make that redesign more complex and riskier than deliberately stopping all
database users before migration.

Maintenance-window coordination is the preferred local SQLite design, not
proof that all external access is prevented. It still requires a dedicated,
controlled host/process inventory and verified quiescence. Until that procedure,
the runner serialization, recovery behavior, and filesystem assumptions pass
disposable tests, **migration activation remains blocked**.

For PostgreSQL, use a database-scoped, session-level advisory lock acquired on
the exact connection used by the migration checks and Alembic work. For a
non-online schema transition, also stop application instances/workers unless a
separately reviewed compatibility strategy explicitly permits them to remain
online. PostgreSQL behavior and the server major version remain unverified.

## 1. Phase 3.2B findings

### Confirmed evidence

- The Windows helper (`sqlite_lock.py`) takes a kernel `LockFileEx` byte-range
  lock on a persistent sidecar. The guarantee is cooperative: callers must
  explicitly open and hold the sidecar lock.
- `test_unintegrated_sqlalchemy_sync_pool_can_bypass_sidecar_lock` demonstrated
  that a synchronous SQLAlchemy pool can connect while the sidecar is
  exclusively held.
- `test_unintegrated_sqlalchemy_async_pool_can_bypass_sidecar_lock` demonstrated
  the same bypass for the asynchronous engine.
- A disposable raw `sqlite3` writer also succeeded while the sidecar was held.
- The legacy runner checks for epoch control/version table names, but it has no
  exclusive lock around inspection or migration. Another runner/process can
  change state after the check.
- The current application uses two SQLAlchemy engines/session paths:
  `app/database/database.py` (sync) and `app/database/session.py` (async).
  Direct `AsyncSessionLocal` use exists in startup admin bootstrap and battle
  orchestration. The battle WebSocket router itself broadcasts events; related
  battle services/orchestration use the application async session path.
- Raw `sqlite3` use exists in diagnostics and repository migration/backup
  utilities. The duplicated `frontend/backend/` tree has separate database and
  Alembic files, and its deployment role is not established.
- The Phase 3.2B isolated infrastructure suite reported 21 passed, 1 skipped.
  The symlink creation test was skipped because of Windows `WinError 1314`.
  Reparse-point rejection logic was tested with mocked attributes; actual
  Windows symlink/junction behavior was not verified.
- The isolated persistence/restart test reported 1 passed and exercised
  registration, profile update, XP persistence, battle creation/settlement and
  history, admin update, and engine restart. It did not prove lock integration.

These are historical test results from Phase 3.2B, not tests run in this
documentation-only phase. The complete path inventory is
[`PHASE_3_2A_CONNECTION_INVENTORY.md`](./PHASE_3_2A_CONNECTION_INVENTORY.md).

### Current implementation limitations

- Locking only at `get_db()` would miss direct session factories, direct engine
  connections, startup/background jobs, Alembic, raw sqlite3, tests, and scripts.
- Locking on an engine's synchronous `checkout` event cannot await an async
  OS-lock acquisition. Blocking there can stall the event loop.
- `asyncio.to_thread()` makes waiting non-blocking for a caller that explicitly
  uses `SQLiteFileLock.acquire_async()`; it does not automatically wrap SQLAlchemy
  checkouts.
- A lock held only around engine creation is ineffective. The ownership interval
  must span connection checkout through transaction completion and return/
  closure, including all error, cancellation, rollback, invalidation, and
  process-shutdown paths.
- `SQLiteFileLock` is not reentrant. Nested independent acquisitions and lock
  upgrades cannot be assumed safe.
- The Windows implementation is limited to fixed local NTFS volumes. A
  reparse-point rejection policy exists; actual alias rejection remains
  unverified. Hard-link aliases are not detected. POSIX locking and cross-host
  SQLite are unsupported.
- SQLite's own write lock/transaction does not coordinate the transition across
  separately committed phases. `BEGIN IMMEDIATE` releases its write reservation
  at commit and is not a transition lock.

## 2. Option A — Application-wide shared/exclusive coordination

### What a correct design would require

This option would retain an OS-level shared lock for every active application
database lease and acquire one exclusive lock for migration. It is not safe to
implement by adding a convenience context manager to request handlers. The
coordination boundary must be an unbypassable database access layer.

1. **Synchronous SQLAlchemy:** every connection checkout must obtain a shared
   lock before a SQLite DBAPI connection can be used, then release it only after
   transaction completion and connection checkin/close. Checkout failures,
   invalidation, rollback failures, and pool disposal must release exactly once.
2. **Asynchronous SQLAlchemy:** acquire the OS lock without blocking the event
   loop before opening/using the async connection; retain a lease object through
   async transaction completion and connection return. All direct
   `AsyncSessionLocal`, `AsyncEngine.connect()`, and session factory users must
   use the coordinated wrapper. A synchronous pool event cannot await this
   operation.
3. **Transactions and sessions:** define the actual lease unit. A SQLAlchemy
   session can lazily acquire one or more connections and keep them to commit,
   rollback, or close. The lock must cover each active connection and transaction
   boundary, not just session construction. If a transaction is suspended over
   application work, it retains the shared lease and can delay migration.
4. **Connection pools:** idle pooled DBAPI connections do not hold a SQLite
   transaction, but every checkout must re-enter the coordination protocol
   before use. `dispose()` and pool replacement must not orphan leases. A pool
   must not create or hand out a connection through an unwrapped engine path.
5. **Background work and WebSockets:** task code must acquire through the same
   session/connection coordinator. Long-lived WebSocket sessions or background
   tasks must not retain a database lease while waiting for socket input,
   timers, or unrelated work.
6. **Raw SQLite:** every `sqlite3.connect()` call must be routed through a
   guarded connection factory/context manager; scripts that cannot import that
   factory must be prohibited during normal operation and the maintenance
   window. File backup/copy tools must participate too.
7. **Alembic and scripts:** Alembic's actual migration connection, preflight
   reads, maintenance scripts, and both legacy/epoch runners must acquire the
   same exclusive lock before reading state and retain it through validation.
   Alembic cannot silently open a second connection without inheriting the
   lock's lifetime.
8. **Process enforcement:** every Qubira process, including duplicate backend
   deployments and CLI tools, must use the same canonical database identity and
   lock namespace. Direct file access by unrelated processes remains outside
   the guarantee; access control and operations must constrain it.

### Risk analysis

| Risk | Why it occurs | Required mitigation |
|---|---|---|
| Event-loop blocking | A synchronous SQLAlchemy event cannot `await` the sidecar acquisition. | An explicit async connection/lease abstraction must acquire before driver use; no blocking hook on the event loop. |
| Lock leaks | Exceptions, cancellation, disconnect, pool invalidation, process shutdown, or connection creation failure can skip release. | Single owner/lease object, idempotent finalization, cancellation-safe cleanup, and failure injection tests. |
| Deadlock / nested use | A route/service can open another session while holding a lock; lock upgrades or unrelated lock ordering can wait forever. | Define reentrancy policy and lock ordering; prohibit upgrades; test nested session and connection behavior. |
| Pool bypass | A direct engine/pool checkout can avoid request-level wrappers. | Hide raw engines behind a controlled API or prove all call sites are gated; tests must fail if a raw checkout succeeds during exclusive ownership. |
| Long-lived reads | A shared lock retained for a long transaction or long-lived session can starve migration. | Bounded lease durations and explicit timeout/refusal behavior; do not break a live lock. |
| Process crash | Kernel releases the sidecar handle but persistent transition state may remain. | Durable gate/audit state; next owner inspects and stops for manual recovery. |
| Cross-process inconsistency | Different URLs, aliases, hard links, working directories, or deployments can select distinct sidecar names. | One canonical DB identity; reject unsupported aliases/filesystems and prove alias behavior. |
| External access | OS sidecar is advisory to Qubira callers, not the SQLite database file. | Restrict host/file access and inventory every external utility; otherwise the guarantee is incomplete. |

### Assessment

Option A can be made plausible only as a broader database abstraction and
process contract. The current lock helper is a primitive, not that abstraction.
Implementing sync and async leases, pool ownership, direct-session coverage,
raw-connection governance, and tests for each surface is substantial. Its
correctness depends on application code always using the wrapper; one forgotten
direct engine access defeats the safety boundary.

## 3. Option B — Exclusive migration maintenance window

This option does not coordinate every request with a shared lock. Instead, it
establishes a controlled period in which no application or maintenance process
can access the SQLite database, then uses one exclusive migration owner. It is
recommended for SQLite because it avoids holding OS leases across every
application connection and avoids async pool hooks.

### Required process lifecycle

1. **Declare the maintenance window.** Choose the host and database identity;
   verify it is a supported local Windows NTFS file or a separately implemented
   and tested platform. No cross-host/shared SQLite path is supported.
2. **Remove traffic.** Put all API instances behind a maintenance response or
   remove them from ingress/load balancing. Stop accepting new HTTP requests and
   WebSocket connections.
3. **Drain active work.** Wait for in-flight handlers, database transactions,
   WebSocket operations, background battle finalization, and other tasks to
   finish. Use a finite deadline. If it expires, abort the migration window;
   do not kill an active transaction and continue as if it drained.
4. **Stop all application processes.** Stop every API process, worker, scheduler,
   reload process, alternate/duplicate backend deployment, and any process
   configured with the same database URL. Confirm each has exited.
5. **Dispose resources.** Application shutdown must close sync and async pools
   and await async engine disposal. Current `main.py` shutdown disposes the
   synchronous engine; an explicit awaited async-engine disposal path was not
   observed. This must be addressed and tested before operational quiescence is
   claimed. Raw sqlite3 handles and non-SQLAlchemy tools must also close.
6. **Freeze maintenance scripts.** Pause backup, integrity, data-transfer,
   reporting, admin, and migration utilities that might open the file. Only the
   approved coordinator may run. Disable automatic restart/supervision for
   application and worker processes until the window closes.
7. **Account for external processes.** Inventory the dedicated host's services,
   scheduled tasks, service accounts, command sessions, and file access. OS
   process/file-handle inspection is useful evidence but is not a universal
   proof that no same-user or future process can open SQLite. Use host/file ACLs,
   a dedicated service identity, controlled operator access, and an operational
   freeze. If an unknown process or uncoordinated access cannot be excluded,
   abort. The sidecar lock alone cannot block it.
8. **Acquire the exclusive migration lock.** The one authorized coordinator
   acquires the database-scoped exclusive lock before any mutable-state
   inspection and holds it through preflight, migration, post-validation, and
   final state recording. Lock acquisition timeout fails closed. Legacy and
   epoch runners use the same lock namespace and canonical DB identity; they
   cannot run concurrently.
9. **Verify before migration.** Under the lock, re-resolve and validate the DB
   identity; inspect read-only the current revision, full schema manifest,
   control/audit/version state, SQLite integrity and foreign-key checks, and
   required row/data invariants. Require a verified recoverable backup, a
   reviewed migration plan, supported profile, and no unknown active file
   handles to the extent the host can report them. Any mismatch or ambiguity
   aborts without migration.
10. **Execute and validate.** Recheck state immediately before writes. The
    authorized runner performs the approved migration while retaining exclusive
    ownership. Validate schema fingerprint, single active head, control/audit
    agreement, row counts/critical records, foreign keys, integrity, and
    application-level smoke checks against the same database before release.
11. **Restore service gradually.** Mark transition verified only after all
    checks pass. Start one application instance with serving still gated; require
    its startup head/fingerprint check to pass. Then restore ingress and start
    workers/schedulers. Monitor health and error logs. If validation or startup
    fails, keep all application access stopped and follow recovery; never start
    an old runner as a fallback.

### Reliability versus Option A

For a local SQLite installation on one controlled host, Option B is more
reliable than partially integrating shared locks because it reduces the number
of independently implemented lock lifetimes to one migration owner and a
verifiable process-stop/drain procedure. It avoids per-request async blocking,
per-connection reentrancy, pool callbacks, and lock release tied to arbitrary
application code.

It is **not** inherently safer if the operator cannot stop every process or
cannot constrain file access. A sidecar exclusive lock only prevents another
cooperating lock holder. A direct `sqlite3` process or SQLAlchemy pool that
doesn't acquire that sidecar can still connect. Therefore the operational
quiescence and access-control evidence is a required safety condition, not an
optional checklist.

## 4. Architecture comparison

| Dimension | Option A: application-wide shared/exclusive protocol | Option B: exclusive maintenance window |
|---|---|---|
| Safety | Potentially safe only if all paths are impossible to bypass; one missed raw or engine path invalidates the guarantee. Current tests prove bypasses exist. | Stronger for SQLite when all users are stopped and access is controlled; weaker if external processes can still open the file. |
| Implementation complexity | Very high: sync and async lease layers, pools, cancellation, nesting, raw drivers, all call sites, and tools. | Moderate code complexity; high operational discipline. One migration lease rather than a lease per application operation. |
| Operational complexity | Lower outage for ordinary operation, but complex lock observability, timeout handling, drain/starvation, and deployment coordination. | Explicit outage window, service stop/restart, drain and validation runbook. |
| Windows support | Current sidecar primitive is Windows fixed-local-NTFS only. Application-wide integration is not implemented or validated. | Fits a single controlled Windows/NTFS host if all app processes stop; helper still needs tested lock/recovery use. |
| SQLite transaction behavior | Shared lease must cover transaction lifetime; exclusive lease must span multiple commits. `BEGIN IMMEDIATE` does not replace it. | SQLite transactions remain responsible for DDL/data atomicity inside one migration; external exclusive lease spans phases. |
| Async application compatibility | Requires async-safe acquisition before connection use; synchronous pool callbacks can block the event loop. | App is stopped during DDL; no async lock hook runs on request paths. Async shutdown/disposal still must be correct before stop is declared complete. |
| Connection-pool behavior | Every checkout/checkin must be gated; idle pool connections must not bypass or leak a lease. Existing pool bypass tests fail this requirement. | Stop processes and dispose pools; no active pool should survive into migration. Verify process exit and no auto-restart. |
| Crash recovery | Kernel releases process lock; durable transition gate must leave app and both runners blocked pending inspection. | Same lock crash behavior; because application is stopped, recovery keeps the service offline until inspection/restore/forward repair. |
| Multi-process coordination | All app/worker processes must coordinate each DB lease and migration. | Stop all application processes; the single migration process takes exclusive ownership. Runner-to-runner lock still required. |
| External database access | Sidecar remains bypassable by uncoordinated clients. Requires every client or access control. | Same limitation; mitigate operationally with dedicated host/account, process inventory, ACLs, and an access freeze. Unknown access blocks. |
| Future maintenance | Ongoing requirement to add the lock protocol to every new connection path and test it. | Maintain an explicit migration runbook and process inventory; any new DB process must be added to quiescence checks. |

### Separate recommendation by database engine

| Engine/use | Recommendation |
|---|---|
| Local SQLite development/test DB | Use Option B. Stop the local app/test worker and all tools using the file, take a verified backup, run one migration owner, validate, then restart. For disposable tests, use a dedicated temporary file and an explicit fixture. |
| SQLite file used by a deployed service on one host | Option B only if service/process orchestration can prove quiescence and filesystem/access assumptions. If the file is shared across hosts, stop: this architecture is unsupported; move to server PostgreSQL or design a distributed coordinator. |
| PostgreSQL production/service DB | Use a session-level advisory lock for migration-owner serialization, held on the same connection used for preflight, Alembic migration operations, and post-validation. Separately quiesce application traffic for non-online-compatible transitions unless a tested expand/contract release plan authorizes online access. PostgreSQL advisory lock does not itself block ordinary application SQL. |

## 5. Legacy and epoch runner ownership

The legacy and epoch runners must use the **same database identity, lock
namespace, and exclusive ownership boundary**. For SQLite, the selected
maintenance-window coordinator acquires the exclusive OS lock before either
runner inspects mutable state and retains it through final validation. For
PostgreSQL, both runners acquire the same stable advisory-lock key on the same
database connection that Alembic uses; the lock must not be acquired on one
connection and migration executed on another.

Required order:

1. Acquire exclusive migration ownership.
2. Read-only inspect the database identity and all legacy/epoch control,
   version, and audit objects.
3. If any epoch control/version object is present, the legacy runner refuses,
   including complete verified epoch state. Partial/malformed epoch state
   refuses both runners pending recovery review.
4. If epoch state is absent, only the explicitly authorized current migration
   owner may run the legacy graph before cutover.
5. Once epoch transition intent is durably recorded, the epoch runner owns the
   database permanently. Legacy runner never resumes, even if the epoch runner
   crashes or the transition is marked verified.
6. The epoch runner may only resume via the reviewed recovery procedure when
   persistent state indicates uncertainty; no automatic old-chain fallback.
7. Release lock only after successful validation or controlled fail-closed exit.
   An unsuccessful or uncertain transition leaves the durable gate blocked.

The Phase 3.2B legacy guard currently checks names before migration but does not
acquire exclusive ownership. It is only a fail-closed guard and is subject to a
TOCTOU race; it does not meet these serialization requirements. Neither runner
was modified or executed for Phase 3.2C.

## 6. Failure and recovery model

| Failure point | Required result | Retry / recovery policy |
|---|---|---|
| Traffic drain or process stop fails | No migration starts; leave service in maintenance mode only as needed to restore cleanly. | Abort and retry after correcting process lifecycle. |
| Unknown process or DB handle remains | No migration starts. | Identify/stop owner or abort; do not infer safety from the sidecar lock. |
| Exclusive lock unavailable/times out | No migration starts. | Bounded retry only before transition intent and after identifying owner. Never force-break. |
| Preflight finds unknown revision/schema/control state | No schema write. | Manual review and a new approved migration profile. |
| Failure before durable transition intent and before DDL | Preserve unchanged DB; release lock after clean exit. | Retry only with fresh read-only preflight and no concurrent access. |
| Failure after durable `started` intent or after any DDL/data write | Keep app and both migration lineages blocked; lock may release only on orderly stop/process death. | Manual read-only inspection; compare full schema, version/audit state, integrity, and data. Forward repair is preferred when state is understood. |
| Crash during a SQLite transaction | SQLite/driver recovery may roll back that transaction, but earlier separately committed phases remain. | Treat outcome as uncertain; inspect journal/WAL and persistent transition records. No blind rerun. |
| Post-migration validation or first-app startup fails | Keep ingress/workers stopped. | Forward repair or restore a verified backup under an approved recovery plan; do not run legacy chain. |
| Restore required | Restore to a separate target first where possible and validate it. | Replacing the source requires explicit approval and reconciliation of writes since backup; never restore automatically. |

The durable `started`/recovery gate, not a held lock, is what ensures a process
crash does not silently authorize another runner. The lock serializes active
owners; the gate records incomplete state after that owner exits.

## 7. Recommended migration sequence for local SQLite

1. Complete a static inventory for the exact target and identify every service,
   worker, scheduler, test runner, CLI, backup, diagnostic, and IDE process that
   can open the file.
2. Verify one canonical absolute local database path and supported local
   filesystem; reject aliases and cross-host/shared storage.
3. Quiesce ingress, drain requests/WebSockets/background jobs, stop all
   application and maintenance processes, and disable automatic restarts.
4. Close/await both sync and async pools; close raw SQLite handles. Confirm no
   unknown handles remain to the level available on the host. If that cannot be
   established, stop.
5. Acquire the exclusive lock using the common migration-owner mechanism.
6. Read-only inspect revision metadata, control state, schema manifest, SQLite
   integrity/FK checks, critical row counts, and verified backup metadata.
7. Abort on any unsupported/ambiguous state; otherwise execute only the reviewed
   migration route.
8. Validate the single active revision, manifest fingerprint, audit state,
   schema/integrity/FK checks, and data-preservation invariants under the lock.
9. Start one app instance with traffic disabled; require the exact active-head,
   verified-gate, and fingerprint startup check.
10. Restore traffic, then workers/schedulers, and monitor. Keep the legacy runner
    permanently guarded once any epoch state appears.

No step authorizes migration execution in this phase.

## 8. PostgreSQL recommendation and unresolved test prerequisite

Use a distinct PostgreSQL coordination mechanism: a stable, documented
database-scoped session-level advisory lock. Acquire it before state inspection
and retain that same DBAPI/session connection through the Alembic migration and
post-validation. Both runner lineages must share the same key. If the runner
delegates to Alembic, pass the locked connection through Alembic's supported
configuration path rather than allowing `env.py` to open an uncoordinated
connection.

For a destructive, non-backward-compatible, or otherwise unverified migration,
also use a maintenance window: stop API instances/workers and drain connections.
Advisory lock only serializes cooperating migration owners; it does not prevent
the app from issuing SQL. Online schema changes require a separate expand/contract
plan, tested compatibility window, and startup gating.

No disposable PostgreSQL server was available in Phase 3.2A/3.2B; PostgreSQL
major version remains unknown. The advisory-lock and migration behavior are
recommendations, not verified compatibility claims.

## 9. Remaining prerequisites before implementation

- Agree that local SQLite migrations require an explicit maintenance window and
  define the supported host/filesystem boundary.
- Establish and test process/traffic orchestration, worker stop/drain, auto-restart
  suppression, pool disposal, raw-handle closure, and safe service restoration.
- Resolve the application shutdown gap: verify explicit async engine disposal
  and task cancellation/joining before declaring all connections closed.
- Define how unknown same-host processes and same-user direct SQLite access are
  prevented, not merely observed. Sidecar locking cannot supply this guarantee.
- Complete SQLite canonical identity/alias policy; actual reparse-path behavior
  and hard-link rejection remain unverified.
- Implement a single migration coordinator that owns the exclusive lock and
  passes the same connection/ownership into Alembic as required.
- Make the runner's epoch-state guard atomic with lock acquisition; test both
  runners competing and legacy refusal after any epoch object appears.
- Prove startup fails closed for incomplete, unknown, or unverified state.
- Test crash points before/after durable intent, DDL, version-table update,
  validation, and service restart using disposable SQLite copies.
- Identify PostgreSQL major version and provide a disposable instance for
  advisory-lock and schema/migration tests.
- Preserve the inactive epoch and do not create the canonical baseline until
  the above gates pass.

## 10. Proposed Phase 3.2D sequence

1. **Decision and operational contract:** approve Option B for local SQLite;
   define supported deployment host topology, database path, service accounts,
   maintenance ownership, lock namespace, and explicit abort conditions.
2. **Quiescence harness design:** create a testable coordinator contract for
   stop, drain, cancel/join background work, dispose sync/async pools, verify
   process termination, and restore traffic. Do not assume IDE/manual processes
   are covered.
3. **Runner serialization:** implement a single exclusive SQLite migration
   coordinator with lock-before-inspection ordering. Make both legacy and epoch
   runners consume it; the legacy runner refuses any epoch state atomically
   under that lock. Add Windows process competition and race tests.
4. **Filesystem identity gate:** test supported NTFS paths, aliases,
   reparse-point rejection, hard-link policy, lock-file ACL/lifetime, and crash
   release. Reject uncertain identities.
5. **Disposable SQLite failure testing:** exercise separate transaction
   boundaries, persistent `started` markers, active-head/audit consistency,
   abrupt process termination, recovery refusal, backup validation, and
   same-host unknown-access controls. Do not use the protected local DB.
6. **PostgreSQL profile:** once server major version is supplied, use a disposable
   server to implement/test a session-level advisory lock on the exact Alembic
   connection; test two competing runners, connection loss, and rollback.
7. **Application lifecycle verification:** confirm shutdown closes every sync
   and async engine and joins/cancels database-using jobs; test a drained and
   stopped disposable app before enabling a migration procedure.
8. **Acceptance gate:** require proof of quiescence, runner serialization,
   fail-closed startup, one active head, schema-manifest match, FK/integrity
   checks, and record preservation before any Phase 3.2C baseline work or
   deployment authorization.

Phase 3.2D is not started by this review.

## 11. Actions not performed

- No application code, lock implementation, migration runner, historical
  revision, or deployment configuration was changed.
- No migration or database connection was made.
- No production environment variable was inspected or modified.
- No commit, push, or deployment occurred.
