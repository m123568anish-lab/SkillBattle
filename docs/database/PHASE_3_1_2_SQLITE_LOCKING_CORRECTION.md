# Phase 3.1.2 — SQLite Locking Correction

**Status:** Documentation-only correction. No lock implementation, migration, database access, application change, deployment change, commit, or push occurred.

This document supersedes the SQLite locking mechanism described in §3.2 of [Phase 3.1.1](./PHASE_3_1_1_EPOCH_TRANSITION_SAFETY.md). The remaining epoch decisions are unchanged. In particular, PostgreSQL continues to use a separate session-level advisory lock.

## 1. Correction

SQLite's `BEGIN IMMEDIATE` acquires a write reservation for one transaction. Committing that transaction releases the reservation. Therefore it cannot protect the gap between a separately committed durable transition marker and a later migration transaction.

For file-backed SQLite, the proposed cross-process design is:

1. Acquire one stable OS-level lock associated with the canonical database file.
2. Keep the lock handle open and exclusively locked for the whole migration transition, including separately committed control-state, migration, post-validation, and final verification transactions.
3. Use independent SQLite transactions inside that outer OS lock. SQLite transactions provide database atomicity where supported; the OS lock provides cross-phase process coordination.
4. Require every Qubira process that accesses this database to participate in the same locking protocol. The exclusive migration lock must wait for active application access to drain and block new cooperating access until the transition ends.
5. After any crash or uncertain transaction outcome, the OS lock may be released, but the persistent transition state remains. The next process must acquire the lock, inspect the database read-only, and stop for recovery review; it must not infer that the transition did not run.

`BEGIN IMMEDIATE` may still be used inside each write phase to acquire SQLite's database-level write reservation and detect competing SQLite writers. It is not the cross-phase migration lock.

## 2. Proposed OS/file-lock contract

### 2.1 Lock identity and filesystem assumptions

- Use a persistent lock file in a service-controlled directory on the same local host as the SQLite database. Derive its name from a canonical database identity, not from an unnormalized relative URL.
- Resolve relative paths, symlinks/junctions, case normalization on Windows, and file identity so two configured paths to the same database do not get different locks. The lock identity must be stable for the duration of a deployment; moving/renaming the database requires a controlled offline procedure.
- Use a kernel-managed cross-process file lock: on Windows a tested `LockFileEx`-class primitive, and on supported POSIX systems a tested `flock`/`fcntl` primitive. Select and test one implementation per supported platform. A Python `threading.Lock`, PID file, lock-directory existence check, or SQLite `BEGIN IMMEDIATE` alone is not sufficient.
- Keep the lock file itself persistent. Do not delete, rotate, replace, or unlink it during normal release or stale-lock recovery; replacing the inode/handle target while processes hold locks can create split lock domains.
- This contract supports only a local filesystem whose lock semantics are verified for the deployed OS/runtime. Do not assume correctness on NFS, SMB, cloud-synced folders, container filesystems shared across hosts, or other network/virtual filesystems.
- A SQLite file shared across multiple hosts is unsupported by this design. Cross-host correctness needs a different shared coordinator/database architecture or a move to a server database; do not extend the local lock claim to a shared file.

### 2.2 Lock modes, lifetime, and timeout

- Normal Qubira database access acquires a **shared** lock before opening/using the SQLite connection and holds it through the complete connection/transaction lifetime, releasing it only after transaction completion and connection close. The lock covers reads as well as writes so no query can observe a partially applied multi-transaction epoch transition.
- The migration runner acquires an **exclusive** lock before reading state. It waits until all shared users have drained, and new shared acquisitions block while the exclusive lock is held. It retains exclusivity until final verification or a fail-closed exit.
- All lock acquisition is bounded. Proposed starting defaults for testing are 5 seconds for ordinary application access and 60 seconds for migration exclusive acquisition. Make values configurable only within bounded limits; timeout logs must identify lock class, wait duration, and sanitized process owner metadata without leaking database contents or credentials. A timeout is a visible error, never a bypass.
- After migration timeout, do not automatically retry indefinitely. An operator may retry only after confirming the prior process has ended, the lock is available, and no persistent `started`, `committed_unverified`, malformed, or recovery-required transition state exists.
- Store owner metadata (process ID, process start identity, host, executable/release identifier, random run ID, acquisition timestamp) in the already-locked file for diagnostics only. It is not proof of lock ownership or liveness and must never be used in place of the kernel lock.
- Use robust handle cleanup in `finally`; kernel lock release on process termination is the crash-safety mechanism. The lock is held across SQLite commits, not implemented by leaving a transaction open. Lock handles must be non-inheritable across spawned child processes unless the child is explicitly part of the same lock owner; otherwise a child can accidentally keep the lock alive after the coordinator exits.

The 5/60-second values are initial test defaults, not production-approved settings. Tune only after measured local contention and confirm they remain finite.

### 2.3 Stale-lock and crash behavior

An OS file lock is not a stale marker file. If the process crashes or exits, the kernel releases its lock handle; the lock file remains and is reused. Therefore:

- Never decide a lock is stale from file age or a dead-looking PID, and never unlink the lock file to “clear” it.
- If the kernel lock can be acquired, no process currently holds that lock domain. Inspect persistent epoch control/version/audit state before doing any work.
- If the lock cannot be acquired, wait only until the configured timeout, then refuse with owner metadata for diagnosis. Do not force-break a held lock.
- If the process crashes while SQLite has an open transaction, SQLite/driver recovery may roll it back or leave an uncertain outcome depending on the exact phase/filesystem/driver. The next owner must inspect the database, WAL/journal state and transition records read-only before deciding.
- A crash after the `started` marker is committed leaves the marker in place even though the OS lock is released. All migration runners and app startup must refuse until a reviewed recovery action resolves it.
- A crash during control-table bootstrap may leave no control object or an incomplete set if atomicity was not established. Any presence of an epoch control table/version/audit object with missing peers or inconsistent rows is a poisoned/ambiguous state; do not resume baseline or fill missing tables automatically.

## 3. Control-table partial-creation guard

Control state is bootstrapped in its own SQLite write transaction while the exclusive OS lock is held. That transaction creates the complete control schema and initial `started` event atomically, before application DDL. It must not alter application tables. The implementation must prove SQLite DDL and control inserts are in the same actual driver transaction for each supported Python/SQLite runtime.

Before any transition, inspect the complete epoch state: the epoch gate/control table, transition audit/event table, and active epoch Alembic version table. The first two form the **control schema** and are bootstrapped together; Alembic owns creation/update of the active version table during the baseline migration transaction. Its absence is expected before that transaction starts, including the valid `started`-but-not-yet-applying phase. Its presence and row count must match the recorded transition phase exactly.

| Observed state | Required behavior |
|---|---|
| No control-schema objects, no epoch version table, no transition audit, and legacy state is a supported source profile | Preflight may proceed; acquire exclusive OS lock and recheck all source state before bootstrapping control state. |
| Complete control schema has one consistent `started` attempt; active version table is absent before Alembic starts, or is in the exact version-row state documented for the recorded migration phase | This may be a valid in-progress state only for the matching phase and transition ID. Do not start application or legacy runner. Epoch runner may continue only after read-only phase validation under lock; process restart after any uncertain DDL outcome requires recovery review. |
| Complete control schema and audit show `committed_unverified`; active version table has exactly the baseline/head row expected by the transition record | Do not rerun baseline. Keep app blocked; run read-only post-validation, then mark verified only under the full verification contract. |
| Complete control schema and audit show `verified`; active version table has exactly one row equal to the sole active head | Treat as activated. Validate manifest/startup contract; never rerun baseline. |
| Only one control-schema table exists, control schema differs, intent/audit rows are absent or malformed, active version table is malformed/duplicated/unknown, or the row does not match the recorded phase | Fail closed. Keep app and both migration runners blocked. Acquire exclusive lock, inspect read-only, and require explicit recovery. No `CREATE IF NOT EXISTS`, automatic table completion, cleanup, stamp, or inferred progress. |
| Any epoch state exists but the database otherwise appears empty | Treat as partial/unknown transition, not a fresh database. Fail closed for manual inspection. |

If control bootstrap commit acknowledgement is lost, the next runner acquires the OS lock and checks this state table. It must not repeat bootstrap merely because the previous process returned an error. Complete `started` state is not automatically resumable after a crash; inspect whether migration work began. Partial/inconsistent control state means recovery-required; no control state permits a fresh locked preflight.

## 4. Re-inspection boundaries

Holding the OS lock prevents cooperating Qubira processes from entering the database, but state is re-read to detect non-cooperating writers, external tools, or stale assumptions. Each check is read-only and compares canonical manifests and legacy revision rows:

| Boundary | Required inspection while holding exclusive OS lock |
|---|---|
| A. Before control bootstrap | Read SQLite file identity/runtime properties; catalog; legacy version rows; complete source manifest; data-invariant summaries; confirm no epoch control objects. Match exactly one supported profile. |
| B. Immediately after acquiring lock, before any write | Repeat A. If the pre-lock plan differs in any application object, revision, or invariant, abort without creating control state. |
| C. Before control bootstrap transaction | Recheck control-schema absence, epoch-version-table absence, and source fingerprint. Then create the complete control schema and durable `started` event in one SQLite transaction. |
| D. After control transaction commits, before baseline DDL | Reopen/read state under the still-held OS lock. Confirm complete control schema, exactly one `started` event for the attempt, expected absence of the Alembic-owned active version table, unchanged legacy revisions, and unchanged application source fingerprint. If not exact, stop. |
| E. Before each separately committed migration/data write phase | Re-read the immediately relevant object definitions, source/target phase fingerprint, and data preconditions. Confirm `started` status and lock ownership. Abort if another writer or unexpected change is detected. |
| F. After each write phase commits, before the next write phase | Re-inspect affected objects and data invariants; compare to the phase's expected intermediate manifest. Advance only when exact. |
| G. After Alembic DDL/version transaction commits, before marking verified | Re-read active version rows, legacy rows, audit, full target manifest, and preservation/integrity checks. Only exact expected revision and target state may proceed; record `committed_unverified` before the independent post-validation phase. |
| H. Before committing `verified` status | Reconfirm the same target fingerprint, sole active head, exact active revision, and transition ID in a final read-only inspection. Commit the verified status separately while still holding exclusive lock. |

No phase releases the OS lock between these checks/transactions. A newly observed discrepancy never triggers automatic repair.

## 5. Coordinating every Qubira database user

An OS advisory file lock is cooperative. It cannot stop an arbitrary process that opens the SQLite database directly and ignores the lock. The design is acceptable only if all Qubira-controlled access paths are inventoried and routed through one SQLite connection/transaction coordinator:

- Synchronous SQLAlchemy engine and sessions.
- Asynchronous SQLAlchemy engine and sessions.
- API workers, background tasks, scheduled jobs and websocket handlers that touch the database.
- Alembic/epoch and legacy migration runners.
- Admin scripts, data maintenance/import/export utilities, test helpers and backup/restore utilities.
- Any monitoring or local developer tool that queries the SQLite file.

Every connection/transaction path must take the shared lock for its full access lifetime; migration/control code takes exclusive ownership. A single wrapper/factory should be the only approved route to create SQLite engines or raw connections, and direct `sqlite3.connect`/independent SQLAlchemy engine creation must be prohibited by review, static checks, or an equivalent enforceable policy. The async implementation must use a nonblocking/asynchronous-compatible file-lock integration rather than block the event loop.

Before an exclusive transition:

1. Deploy the epoch-aware guard to every Qubira process before transition.
2. Stop/drain old or unguarded processes and ensure no unmanaged local tool has the database open.
3. Acquire the exclusive lock and wait for all in-flight shared holders to exit.
4. Keep application access blocked through post-validation and verified-state commit. On SQLite, the transition's exclusive OS lock is held for all of this; application startup must not attempt a shared lock and continue while the control state is in progress.
5. Release only after the terminal state has been rechecked.

Filesystem ACLs and service-account isolation should limit the database directory to the Qubira service and approved operator tools. ACLs are defense in depth, not proof that same-account processes obey advisory locking. If uncoordinated processes can access the file, the safe choices are to quiesce/disable them or move access behind a single controlled service; an advisory lock alone cannot guarantee exclusion against them.

## 6. PostgreSQL remains separate

PostgreSQL uses a stable, documented **session-level advisory lock** on the same database session/connection held across the separate control, migration, and validation transactions. The session lock survives transaction commits and is released when the session ends. It does not use or depend on the SQLite lock file. Guarded legacy and epoch runners must use the same PostgreSQL lock key and namespace; app migration state checks and all transition phases occur while the session lock is held.

As with SQLite, a durable `started` marker survives process exit while the advisory lock does not. After a crash, the next runner must reacquire the lock and inspect persistent state before acting. PostgreSQL advisory locks serialize only participants that request the same lock; the epoch gate, runner guards, startup behavior, and process inventory remain required.

## 7. Exact active-head and startup check

Before app startup after epoch activation, under the appropriate read lock (shared OS file lock on SQLite; normal consistent transaction on PostgreSQL):

1. Load the epoch script directory and assert `get_heads()` returns exactly one revision, `EPOCH_HEAD`.
2. Require the active epoch version table (for example `alembic_version_v2`) to exist with exactly one row.
3. Require that row's revision to equal `EPOCH_HEAD` exactly. A known ancestor is **not** sufficient: it indicates incomplete migration.
4. Require exactly one complete control-state schema and a latest transition for the active epoch with status `verified`.
5. Require audit epoch/baseline/bundle identifiers to agree with the code's configured epoch and exact active revision.
6. Require current dialect-specific schema fingerprint to match the accepted target manifest (or an explicitly approved runtime-compatible fingerprint) and any required integrity validation marker to reference that exact fingerprint.
7. Refuse startup if any control object is partially present, rows are missing/duplicated/malformed, revision/head disagree, fingerprint differs, status is `started`, `committed_unverified`, `blocked`, or `recovery_required`, or a migration lock owner/transition is unresolved.

The legacy `alembic_version` table is retained as source history, but after epoch activation it does not authorize startup or legacy migrations. Its value must agree with the transition audit's recorded source revision and remain unchanged unless a separately approved archival policy says otherwise.

## 8. Required locking test plan

Run only against fresh disposable SQLite files on every supported OS and Python/SQLite/driver combination. No test may use the protected local database or a shared production file.

| Test | Setup and action | Required result |
|---|---|---|
| Two competing migration processes | Launch two independent OS processes targeting the same canonical DB identity; synchronize them to contend for exclusive lock. | At most one owns the lock; the second waits up to the configured timeout or fails visibly. Exactly one transition occurs; no duplicate audit/version rows or partial schema. |
| Migration waits for active app transaction | Process A holds a shared lock while reading/writing and transaction is open; process B requests exclusive migration lock. | B cannot enter migration until A commits/rolls back and releases shared lock; no state check races active app work. |
| App blocked during migration | B holds exclusive lock through separate control and DDL commits; A attempts shared lock. | A waits or times out; it never queries intermediate schema. After B marks verified and releases, A performs exact-head startup checks. |
| Crash before control commit | Terminate migration process during control bootstrap before commit. | Kernel lock is released; transaction outcome is inspected. No automatic resume. Either no control objects (fresh locked preflight required) or partial state (recovery-required); no app startup on ambiguity. |
| Crash after `started` commit, before DDL | Terminate owner after committed marker. | OS lock becomes acquirable, but all runners/startup see `started` and refuse. No baseline replay until manual inspection/resolution. |
| Crash during migration transaction | Terminate process while DDL/data transaction is open. | Reacquiring process finds lock released; inspect SQLite integrity, journal/WAL, control state, active version and manifest. Assert actual outcome for each supported driver; no blind retry. |
| Crash after migration commit, before verified | Terminate after epoch version/DDL commit but before post-validation/verified marker. | State remains `committed_unverified`; startup and both runners refuse. Read-only validation and approved completion/recovery required. |
| Stale owner metadata / stale lock file | Leave lock file and old PID metadata after owner exits normally or is killed; start a new process. | Kernel lock acquisition, not file age/PID, decides ownership. New process can acquire a released lock file, then must inspect persistent transition state. Never unlink the file. |
| Live lock timeout | Hold kernel lock from a live process beyond timeout. | Contender returns a clear timeout and does not remove/bypass lock or touch migration state. |
| Concurrent non-Qubira SQLite writer | Attempt a direct SQLite write that does not honor the OS lock during a held exclusive migration lock. | Test demonstrates advisory lock cannot prevent the write. This is a deployment-blocking condition unless access is prevented by process quiescence/permissions or the writer is brought into the coordinator. |
| Alias/path identity | Open same file by canonical path and configured alias/symlink. | Both resolve to the same lock identity, or unsupported aliases are rejected before transition. |
| Unsupported filesystem | Run lock probe on network/shared filesystem. | Platform is rejected unless kernel lock behavior and SQLite file semantics are explicitly qualified and tested; no cross-host guarantee is claimed. |
| Control partial-state fixtures | Precreate each combination of one/missing/malformed control table, version row, audit row, and `started` status. | All incomplete/ambiguous states fail closed without DDL, auto-repair, stamping or table recreation. |
| Async and sync coordination | Hold shared lock from async DB path and request exclusive migration; repeat with sync path. | Lock is process-wide and event-loop-safe; exclusive waits for both sync and async holders to release. |

For each test, assert lock ownership/order, exit code, control/audit/version state, schema fingerprint, data invariants, startup decision, and absence of automatic retry. Also test driver behavior with actual SQLite rollback journal and WAL configurations that are supported. A unit test of a mocked lock is not sufficient.

## 9. Design limits and unresolved questions

- This design supports local single-host SQLite only, after the OS lock primitive and actual sync/async engine integration are implemented and tested. A SQLite database file shared across hosts is explicitly unsupported.
- Advisory file locks are cooperative; every Qubira process must use the coordinator. An unrelated process with filesystem access can ignore it. The deployment must inventory/quiesce such access or restrict it; if that cannot be guaranteed, SQLite epoch migration is blocked.
- Exact file identity handling for Windows and POSIX, selected library/primitive, lock directory ACLs, and service-account model remain implementation decisions.
- The proposed application/migration timeouts (5/60 seconds) need contention testing and operational approval.
- SQLite transaction atomicity for control bootstrap and each planned DDL/batch operation remains unproven until failure-injection tests use supported driver versions and settings.
- PostgreSQL session-level lock behavior, role permissions, and production engine version remain to be tested on a disposable PostgreSQL instance; this correction makes no production compatibility claim.
- Existing local and production schema profiles remain unverified in this documentation-only task.

## 10. Phase boundary

This correction and the necessary clarification in [Phase 3.1.1](./PHASE_3_1_1_EPOCH_TRANSITION_SAFETY.md) are documentation only. No locks were implemented or tested, no database was accessed, no migration was run, no application or deployment configuration was changed, and no commit or push was made.
