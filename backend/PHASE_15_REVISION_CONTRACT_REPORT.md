# Phase 15 — Migration Revision Contract Repair

**Date:** 2026-11-20  
**Scope:** Local revision contract, migration graph, and test isolation only  
**Decision:** Revision contract repaired; a separate Phase 16 read-only staging preflight is recommended after operators verify the live current revision.

## Root cause and old contract

The Phase 14 diagnosis matches the implementation. `EXPECTED_MIGRATION_REVISION` was required and parsed as `target_revision`; validation only accepted `f9a1b2c3d4e5`. The live preflight separately hard-coded `d1f5a8e7c2b4` as the current database revision. Thus one variable had target semantics in configuration and an unrelated predecessor was enforced later. Phase 12 identifies `d1f5a8e7c2b4` only as a historical expected revision; it did not verify the live database's current revision.

## Corrected contract

- `EXPECTED_CURRENT_MIGRATION_REVISION` means the revision expected in the connected database. The preflight compares the actual database revision against it. A historical report does not establish the current live value.
- `TARGET_MIGRATION_REVISION` means the requested repository migration target and must be `f9a1b2c3d4e5`.
- A non-empty legacy `EXPECTED_MIGRATION_REVISION` is rejected as ambiguous. It is not mapped to either new variable.
- Before Neon API or PostgreSQL access, local validation confirms that both revisions exist, the target is the only legacy graph head, the expected revision is an ancestor, and the reviewed target directly descends from the expected current revision.
- Preflight also compares the actual database revision with `EXPECTED_CURRENT_MIGRATION_REVISION` and the repository head with `TARGET_MIGRATION_REVISION`.

## Migration graph findings

Local Alembic graph inspection and tests confirmed:

- `d1f5a8e7c2b4` exists.
- `f9a1b2c3d4e5` exists and declares `d1f5a8e7c2b4` as its direct parent.
- `f9a1b2c3d4e5` is reachable from `d1f5a8e7c2b4`.
- The legacy graph has exactly one head, `f9a1b2c3d4e5`; no unexpected branch or merge makes this upgrade ambiguous.

No migration files or graph history were rewritten.

## Phase 14 test collection failure

The earlier collection failure came from `tests/database_isolation_support.py` taking ambient `DATABASE_URL` as its test target and passing it to SQLAlchemy URL parsing. Parsing failed before test collection completed. This was an accidental dependency on the application environment and an invalid test URL format at the parser boundary; it was not a PostgreSQL driver mismatch or a connection failure. No test database connection was made during that failure.

The harness now defaults to a temporary SQLite file and ignores ambient `DATABASE_URL` and `ASYNC_DATABASE_URL`. An operator must explicitly select an isolated test target using `QUBIRA_TEST_DATABASE_URL` (and optionally `QUBIRA_TEST_ASYNC_DATABASE_URL`); existing loopback/disposable target validation remains in force.

## Regression coverage and exact results

Added or updated tests cover correct current/target values, actual-current mismatch, target mismatch, each missing revision setting, a historical revision absent from the graph, an unreachable target, multiple graph heads, ambiguous legacy variable rejection, local validation without Neon/database access, no migration execution in local validation, and ignoring ambient application URLs in the test harness.

- `python -m pytest -q tests/test_staging_migration.py tests/test_database_isolation.py`: **42 passed, 0 failed, 63 warnings**.
- Python syntax compilation for the edited staging configuration, runner, and test files: **passed, exit 0**.
- `git diff --check`: **passed, exit 0** (Git printed line-ending conversion warnings for pre-existing worktree files).
- The prior invalid-URL collection failure was not reproduced after the test harness change.

## Files changed in this phase

- `backend/app/database/staging_migration.py`
- `backend/run_migrations.py`
- `backend/.env.staging.example`
- `backend/tests/test_staging_migration.py`
- `backend/tests/database_isolation_support.py`
- `backend/tests/test_database_isolation.py`
- `docs/NEON_STAGING_RENDER_CONFIGURATION.md`
- `backend/PHASE_15_REVISION_CONTRACT_REPORT.md`

The shared worktree already contained other tracked modifications and untracked files. They were preserved; no Git staging or destructive Git operation was performed. The pre-existing `test-results/.last-run.json` modification remains in the worktree.

## Safety and next phase

No production or staging database was contacted. No Neon API call, migration, epoch runner, deployment, or Render service change occurred. `STAGING_MIGRATION_APPROVED=true` was not set. No credentials or connection URLs were printed.

**Recommendation:** In Phase 16, first independently establish the live staging branch and database identity, then supply the revision actually observed there as `EXPECTED_CURRENT_MIGRATION_REVISION` and run only the read-only staging preflight. Do not assume the historical Phase 12 value still describes live state. Do not execute the migration in that preflight phase.
