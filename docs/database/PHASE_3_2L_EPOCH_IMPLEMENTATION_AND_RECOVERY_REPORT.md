# Phase 3.2L — Epoch Implementation and Recovery Report

**Status: PARTIAL IMPLEMENTATION — NOT COMPLETE; PostgreSQL activation CLOSED**

## 1. Repository state

- At the start of this work: branch `main`, HEAD `b0a69d19ead8d13205face2d8b4747c42f328b13`, clean staged/unstaged/untracked state.
- At final verification: branch `main`, HEAD `5c94153d09b5373aed915429dd0b91c855b2dfd1`.
- The HEAD advanced during this work to a concurrent `fix(auth): configure Neon JWT verification on Render` commit (`render.yaml` only). It was not created by this task.
- Unrelated auth UI changes and frontend test/build artifact changes (including `frontend/test-results/.last-run.json`, Playwright artifacts, and `frontend/tsconfig.tsbuildinfo`) appeared in the working tree during verification. They were left untouched. Migration changes were not staged.
- The Phase 3.2J design, Phase 3.2K audit, and Phase 3.2K model/migration inventory were reviewed. The legacy graph was rechecked: 29 revisions, root `dd495117949b`, sole head `d1f5a8e7c2b4`; the epoch script directory still has no revisions.

## 2. Implemented

### Durable state and audit primitives

Added `epoch_control.py` with explicit `qubira_epoch_control` and `qubira_epoch_audit` SQLAlchemy table definitions, state transitions, generation/idempotency checks, digest and identifier validation, audit-chain validation, and an explicit caller-owned commit boundary.

| From | Allowed next state(s) |
|---|---|
| `unclassified` | `fresh_preflight`, `adoption_preflight`, `refused` |
| `fresh_preflight` | `started`, `refused` |
| `adoption_preflight` | `started`, `refused` |
| `started` | `applying`, `recovery_required` |
| `applying` | `committed_unverified`, `recovery_required` |
| `committed_unverified` | `verified`, `recovery_required` |
| `recovery_required` | `fresh_preflight` only after a trusted authorization verifier approves a recovery resolution |
| `verified`, `refused` | terminal |

`create_epoch_control_schema()` refuses any non-empty schema and leaves commit responsibility with its caller. Each state change inserts its audit event and updates the singleton control record in one transaction. A caller must commit durable intent separately before any migration DDL; that ordering is not yet wired into the migration runner.

Adoption is fail-closed: the approved-profile digest allowlist is empty, so no adoption profile is available. Recovery authorization is an injected verifier boundary, not a configured production authorization provider. Recovery execution and unattended retry are not implemented.

### Readiness

Added `DATABASE_READINESS_MODE` (`legacy` by default, `epoch` when explicitly selected), plus a read-only epoch preflight. Epoch readiness requires complete control objects, one known revision at the sole epoch head, a valid audit chain in `verified`, no legacy version table, and a matching target manifest fingerprint. It does not repair or mutate schema state. `/health` remains liveness-only; existing readiness response fields remain unchanged.

The epoch readiness path is fail-closed while the epoch directory has no head/baseline.

## 3. Files changed by this phase

- `backend/app/database/migration_infrastructure/epoch_control.py` — new control/audit schema and transition engine.
- `backend/app/core/config.py` — explicit readiness mode setting.
- `backend/app/core/monitoring/health.py` — readiness-mode dispatch.
- `backend/app/database/migration_preflight.py` — read-only epoch readiness checks.
- `backend/tests/migration_infrastructure/test_epoch_control.py` — transition, audit, adoption-refusal, recovery, and bootstrap tests.
- `backend/tests/migration_infrastructure/test_postgresql_migration_coordinator.py` — disposable PostgreSQL control DDL/state persistence test using the existing ownership lease.
- `backend/tests/api/test_health_readiness.py` — epoch-mode dispatch and read-only rejection tests.
- This report.

No legacy migration was modified. `run_migrations.py`, `alembic_epoch/env.py`, and `alembic_epoch.ini` were not changed.

## 4. Incomplete engineering work / defect register

| Finding | Classification | Evidence / remaining work |
|---|---|---|
| Epoch state tables and transition validation | **FIXED AND VERIFIED (limited scope)** | SQLite state-machine tests and PostgreSQL 18.6 DDL/persistence test pass. Full interruption/recovery semantics remain open below. |
| Epoch-aware read-only readiness | **FIXED AND VERIFIED (fail-closed path)** | Read-only test confirms an uninitialized DB remains unchanged; epoch mode cannot use legacy readiness. No successful epoch readiness is possible without a baseline. |
| Single coordinated runner dispatch across legacy and epoch | **OPEN — ENGINEERING DEFECT** | The existing runner remains legacy-only. Epoch control/state operations are not integrated into `run_migrations.py`; no cross-lineage dispatch or mutual-exclusion test exists. The existing PostgreSQL execution gate remains closed. |
| Real epoch fresh-install baseline | **OPEN — ENGINEERING DEFECT** | No epoch revision was created; `alembic_epoch heads` reports no head. No baseline DDL or fresh-install migration was executed. |
| Full PostgreSQL catalog comparison | **OPEN — ENGINEERING DEFECT** | Existing manifest captures tables/columns and common constraints/indexes, views/materialized views, triggers, sequences, types, routines, policies/RLS, partitions, ownership, schema/object privileges, default privileges, and cross-schema foreign keys. It does **not** fully represent exclusion constraints; complete view/routine dependency graphs and view options; materialized-view refresh state; effective privileges through role membership and database ACLs; extension ownership/dependencies; collation; relation persistence/storage options; all column attributes; or general cross-schema dependencies. No exhaustive comparison claim is made. |
| Crash/recovery and process termination behavior | **OPEN — ENGINEERING DEFECT** | State transitions and a verifier boundary exist, but the runner does not durably record intent around Alembic DDL, automatically classify interrupted states as recovery-required, or execute an operator-authorized recovery procedure. No process-kill, connection-loss, transactional DDL failure, or committed-but-unverified injection suite was run. |
| Adoption | **BLOCKED — OPERATOR EVIDENCE REQUIRED** | No reviewed historical schema manifest/profile or exact verified starting-revision evidence exists. Adoption remains disabled; no existing database was inspected or adopted. |
| Model-complete baseline evidence | **BLOCKED — ENGINEERING REVIEW REQUIRED** | The Phase 3.2K inventory is static model/migration evidence, not reviewed baseline DDL. It cannot authorize `create_all()`, adoption, or a claim of migration replay. |

The prior PostgreSQL advisory lock remains the only lock mechanism (`POSTGRESQL_MIGRATION_LOCK_NAMESPACE` / `POSTGRESQL_MIGRATION_LOCK_KEY`, dedicated `NullPool`). The new PostgreSQL test creates and verifies control objects while holding that existing lease and on its owned connection. The production runner was deliberately not enabled or redirected.

## 5. Test evidence

- `backend\\.venv\\Scripts\\python.exe -m pytest tests\\migration_infrastructure\\test_epoch_control.py -q` — **5 passed**.
- Targeted readiness, state, and schema tests — **16 passed**.
- Final `backend\\.venv\\Scripts\\python.exe -m pytest -q` — **260 passed, 12 skipped** (272 collected; 11 PostgreSQL tests skip unless the disposable PostgreSQL URL is set, and one platform-dependent test skips).
- `backend\\scripts\\test-postgresql18.ps1` — **11 passed** on a verified disposable PostgreSQL **18.6 loopback** cluster. This includes the new control-table DDL and durable transition test. API-only smoke check: `/health=200`, `/ready=503`; schema/revision state remained unchanged through API startup.
- `git diff --check` — exit 0; Git emitted only line-ending normalization warnings.
- Pylance diagnostics reported no errors in the control engine, readiness handler, configuration, or epoch-control tests before the final test addition; one unused-parameter warning (`metadata_default`) was reported in existing preflight comparison code. A final Pylance request timed out; the final source was exercised by the passing backend suite.
- Ruff was not installed (`No module named ruff`); no dependency was added.
- The initial full-suite run had one API-shape regression from an added readiness response field. The field was removed to preserve the existing response contract; the final full-suite run passed.

Not run / not claimed: fresh epoch baseline replay, existing-schema adoption, failure-injection recovery matrix, cross-lineage runner contention, complete catalog equivalence, frontend validation, or a successful epoch readiness check.

## 6. Safety and activation decision

- Only synthetic data and the repository's uniquely named disposable loopback PostgreSQL 18.6 cluster were used.
- No Neon/production database or protected repository SQLite database was accessed.
- No migration was run against a shared or production database; no stamp, deployment, production configuration change, commit, or push was performed by this task.
- No user data or unrelated working-tree changes were reverted.
- **Phase 3.2L is not complete. PostgreSQL migration activation remains CLOSED; existing-schema adoption remains BLOCKED.** Do not route deployment traffic to epoch migration mode or infer database compatibility from these tests.
