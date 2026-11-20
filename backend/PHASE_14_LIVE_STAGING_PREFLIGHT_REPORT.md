# Phase 14 — Live Staging Identity Verification and Read-Only Preflight

**Date:** 2026-11-20  
**Result:** BLOCKED — MISSING EVIDENCE

## Confirmed identifiers and evidence source

The identifiers below are screenshot-confirmed as supplied by the operator. They were not independently verified against Neon during this phase.

- Project: SkillBattle (`green-cake-01021519`)
- Branch: `qubira-staging` (`br-dark-lake-axm12r04`)
- Database/role: `neondb` / `neondb_owner`
- Region: AWS US East 2 (Ohio); parent/default branch: `production`
- Branch expiration shown: November 24, 2026, 23:30

Phase 12 records `d1f5a8e7c2b4` as the expected pre-placement revision, while stating that live staging current revision was unknown. It is historical expected-revision evidence only, not a verified live current revision.

## Local configuration validation

All nine required names were present. The six expected settings matched the task-provided values, checked without printing values. Private credentials were presence-checked only; their values were not read into output or reported.

Repository implementation paths are `backend/app/core/config.py` and `backend/app/database/staging_migration.py`; the requested `backend/config.py` and `backend/staging_migration.py` do not exist. The implementation explicitly requires `ENVIRONMENT=staging`, disables generic env-file loading in staging, aggregates missing names only, rejects production-looking targets and pooled migration endpoints, compares application and migration DB targets, and mandates Neon API plus SQL identity checks before preflight.

**Blocking mismatch:** The task-provided `EXPECTED_MIGRATION_REVISION=d1f5a8e7c2b4` represents the expected prior/current baseline from Phase 12. The implementation instead interprets this variable as the target revision and rejects anything other than `f9a1b2c3d4e5`. This conflict prevents local authorization validation from passing. No Neon API request or database connection was attempted.

## Independent identity and live database findings

- Neon API identity: not verified; no API call made.
- PostgreSQL database, role, direct endpoint, and branch linkage: not verified; no database connection made.
- Current Alembic revision and pending revisions: unknown.
- Target revision in repository: `f9a1b2c3d4e5`.
- Preflight inventory, counts, conflicts, and live authorization/identity: unavailable because the fail-closed configuration gate conflicts with the specified expected revision.

## Migration source safety review

Static review of `backend/alembic/versions/f9a1b2c3d4e5_add_placement_jobs_and_question_provenance.py` shows it adds 17 question provenance columns and creates `placement_jobs`, `placement_source_records`, and `placement_inventory_targets`. It updates `question_kind` from normalized `question_type` and sets approval/verification/lifecycle to approved/published only when both `is_active` and `is_validated` are true; other legacy rows become needs-review. Existing rows are updated in place, with no question deletion operation in upgrade.

The new tables define unique idempotency/source URL constraints and ordinary indexes. They declare no foreign keys. Existing live index/constraint conflicts and row preservation cannot be established without the blocked database preflight. `failure_reasons` is nullable in the migration but non-null in the model, a known unresolved drift. Defaults for provenance do not establish source licensing or canonical hashes. Downgrade drops the three new tables and all 17 provenance columns; it is destructive to any data subsequently stored there and is not an automatic rollback.

## Epoch issue separation

Phase 11 says the alleged 44 Alembic differences lack the historical comparison output/catalog needed to verify them. The epoch graph is an independent lineage with root/head `094cdd2eab54`; placement revision `f9a1b2c3d4e5` belongs to the legacy graph and descends from `d1f5a8e7c2b4`. No evidence here proves that the 44-difference issue blocks this legacy placement revision, nor that it is resolved. It remains an independent infrastructure evidence gap. No epoch runner was invoked.

## Tests and checks

- `python -m pytest -q tests/test_staging_migration.py`: **failed to collect**, exit 4. `tests/conftest.py` imports `database_isolation_support.py`, which rejected the configured test database URL as invalid. No test body ran.
- `python -m compileall -q app/core/config.py app/database/staging_migration.py run_migrations.py`: passed, exit 0.
- `git diff --check`: passed, exit 0 (Git emitted existing line-ending conversion warnings).
- Live preflight: not run.

## Worktree preservation and files

Initial and final `git status --short` were recorded in the execution transcript; the initial status contained pre-existing modified and untracked frontend, backend, placement, Render, migration, and test-result work. No existing worktree files were edited by this phase. This report is the only intended new file. No Git staging or destructive Git command was used.

## Decision and safety confirmation

**BLOCKED — MISSING EVIDENCE** — local authorization cannot be validated because the specified expected baseline revision conflicts with the implementation's required target-revision value. API identity, database identity, actual revision, and live preflight evidence are therefore unavailable. This is not a readiness approval.

No migration, upgrade, downgrade, epoch command, deployment, or production operation occurred. `STAGING_MIGRATION_APPROVED=true` was not set. No secret or connection URL is included in this report.
