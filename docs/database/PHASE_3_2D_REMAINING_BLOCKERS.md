# Phase 3.2D — Remaining Migration-Safety Blockers

## Decision

**Migration activation remains blocked.** The current SQLite coordinator serializes
cooperating migration owners and requires a newly verified backup, but it does
not prove that all application or external database clients have stopped. The
epoch is still an inactive scaffold without revisions, an epoch runner, durable
transition audit/state, or recovery flow.

This document records blockers after the Phase 3.2D code and disposable tests.
The detailed implementation evidence is in
[`PHASE_3_2D_IMPLEMENTATION_REPORT.md`](./PHASE_3_2D_IMPLEMENTATION_REPORT.md);
the per-path disposition is in
[`PHASE_3_2A_CONNECTION_INVENTORY.md`](./PHASE_3_2A_CONNECTION_INVENTORY.md).

## Blocker register

| ID | Blocker | Current evidence | Required closure evidence |
|---|---|---|---|
| B1 | No trusted maintenance-window provider | `MaintenanceWindowEvidence` is a data structure supplied by the caller. The repository has no provider that independently proves API/worker process termination, disabled auto-restart, zero open requests/transactions, pool disposal, task completion, raw handle closure, and external access control. | Approved operator/process controller with auditable evidence tied to canonical DB identity and a run ID; negative tests for each missing prerequisite; no arbitrary user-supplied booleans. |
| B2 | Async engine and request lifecycle | `app/main.py` disposes the sync engine only. It does not await disposal of `app/database/session.py`'s async engine. | Lifecycle implementation and tests showing all request/transaction work drained, `await async_engine.dispose()` completed, and no new DB access after shutdown begins. |
| B3 | Battle-settlement tasks | `backend/app/modules/battle/service.py` calls `asyncio.create_task(battle_orchestrator.start_battle(...))` without retaining the task. Orchestration can wait for a battle timer and then writes settlement/results/XP using `AsyncSessionLocal`. | Owned task registry and a reviewed shutdown policy that preserves settlement/results/XP. Test graceful completion and shutdown timeout/restart behavior; do not cancel active settlement without proving durable recovery. |
| B4 | WebSocket forfeit tasks | The WebSocket manager tracks per-user disconnect tasks and can cancel on reconnect, but has no global shutdown/join method. | Shutdown method that prevents new forfeit tasks and safely awaits or records pending forfeits; tests prove no DB-using callback continues after pool disposal. |
| B5 | Raw SQLite and maintenance scripts | Diagnostics, backup, transfer, validation and other tools use independent DB connections. The OS sidecar does not prevent non-cooperating SQLite opens. | Complete executable inventory and trusted host controller that disables/stops those tools and proves their exit/handles closed, or refactor each under explicit access control. |
| B6 | Duplicate `frontend/backend/` tree | Separate database engines and Alembic setup exist; whether this tree is deployed or launched is not established. | Deployment/packaging owner identifies whether it can access the target DB; if yes, include it in shutdown/serialization. |
| B7 | Epoch runner and transition-state contract | There is no epoch runner, baseline revision, control/audit schema, durable transition marker, or recovery implementation. | Approved exact control/audit/version schema and phase transitions; runner using the common exclusive ownership; startup gate; crash-point tests; no auto-resume after uncertain DDL. |
| B8 | Legacy runner invocation is intentionally unusable for SQLite by default | `run_migrations.py` requires an injected verifier and backup path; its normal CLI invocation has neither and fails closed before database connection. | Only after B1–B7 close, add an approved, non-secret, auditable operator entrypoint that obtains real verification and a unique backup path. Never add a permissive default. |
| B9 | PostgreSQL coordination | No Docker/Podman/PostgreSQL server binaries (`postgres`, `pg_ctl`, `initdb`, `psql`) were found on PATH. Server major version is unknown. Legacy runner and direct online Alembic execution fail closed for PostgreSQL, but no advisory lock exists. | Supply approved disposable server and exact major version; implement session advisory lock on the same connection passed to Alembic; test competing runners, connection loss, rollback, and lock release. No Neon/Render testing. |
| B10 | Windows alias verification | Hard-linked database identity is now rejected in code and test. Symlink creation was denied with `WinError 1314`; junction behavior was not tested. | Run actual symlink and junction rejection tests in an authorized Windows environment and record filesystem/OS details. |
| B11 | Backup restoration | Backup creation/hash/integrity/FK/data-count checks passed on disposable DBs; restore from a separately protected backup was not tested. | Isolated restore rehearsal with verified backup, checksums, schema/data invariants, and a documented operator approval boundary. |
| B12 | Application startup gate | No active-head, transition-audit, verified-state, or fingerprint gate is wired into startup. | Add read-only fail-closed startup validation after the durable state schema is finalized; test absent, partial, duplicated, unknown, and verified states against disposable DBs. |

## Lifecycle conclusions

- **Synchronous pool:** explicit sync engine disposal exists in FastAPI lifespan,
  but it is not proof the entire process fleet is stopped. The migration
  coordinator disposes its own sync engine around the exclusive run.
- **Asynchronous pool:** no explicit awaited disposal was observed in the app
  lifespan. This is not safely repaired alone while background DB work is
  untracked.
- **Battle settlement:** active work may last up to the configured battle
  duration, then updates results and XP. Immediate task cancellation could lose
  user outcomes. No arbitrary cancellation/force-settlement behavior was added.
- **WebSocket forfeit:** task registration is local to the manager and lacks a
  global drain. Canceling forfeits on process shutdown could change game
  outcomes; the semantics need an explicit restart/recovery design first.
- **Schedulers/workers:** no full deployment process inventory or control plane
  was available; their complete shutdown cannot be asserted.
- **External clients:** Windows file-handle inspection alone is not a permanent
  proof against same-user or later direct access. The sidecar is cooperative.

## Failure/recovery evidence

The tests prove kernel lock release after process termination and survival of a
synthetic durable marker. They do **not** prove epoch recovery because the
epoch transition marker/state machine does not yet exist. Specifically, there
is no verified behavior for crashes:

- before durable transition intent;
- after intent but before DDL;
- during DDL;
- after DDL but before version-row recording;
- after version-row recording but before schema validation; or
- after validation but before a verified transition state is committed.

Until B7 closes, every uncertain transition must keep startup and both runner
lineages blocked for manual inspection. Do not retry blindly, stamp, or fall
back to the legacy chain.

## Next safe sequence

1. Resolve process ownership and maintenance-window evidence for the actual
   deployment topology without touching a protected database.
2. Design lifecycle ownership for async engine connections, battle settlement,
   WebSocket forfeits, and any worker/scheduler; agree on durable outcomes before
   implementing cancellation or shutdown behavior.
3. Finalize the epoch control/audit state contract, then implement the epoch
   runner and startup gate without creating a canonical baseline.
4. Add and exercise the crash-recovery matrix only with disposable SQLite DBs.
5. Identify PostgreSQL major version and provide a disposable instance; otherwise
   keep PostgreSQL execution blocked.
6. Complete actual Windows alias checks and isolated backup-restore rehearsal.
7. Re-review all acceptance evidence. Activation requires every blocker marked
   closed with test or operational evidence; no code-only declaration suffices.

No phase after 3.2D is authorized by this document.
