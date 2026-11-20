# Phase 16 — Live Staging Verification and Read-Only Preflight

**Date:** 2026-11-20  
**Readiness:** BLOCKED — MISSING EVIDENCE

## Configuration validation

The screenshot-confirmed identifiers are project `SkillBattle` (`green-cake-01021519`), branch `qubira-staging` (`br-dark-lake-axm12r04`), database `neondb`, role `neondb_owner`, AWS US East 2 (Ohio), with `production` as parent. These are expected values only; they are not live identity evidence.

The following required settings matched the requested values: `ENVIRONMENT`, `EXPECTED_NEON_PROJECT_ID`, `EXPECTED_NEON_BRANCH_ID`, `EXPECTED_DATABASE_NAME`, `EXPECTED_DATABASE_ROLE`. The private settings `NEON_API_KEY`, `DATABASE_URL`, and `MIGRATION_DATABASE_URL` were present; their contents were not inspected or printed.

The required `EXPECTED_CURRENT_MIGRATION_REVISION` and `TARGET_MIGRATION_REVISION` variables were **missing**. The legacy `EXPECTED_MIGRATION_REVISION` variable was **set**, contrary to the corrected Phase 15 contract. Its value was not read or reported. Configuration validation therefore failed and processing stopped before network access.

## Neon and PostgreSQL identity

- Neon API project and branch identity: **not verified; no API request made**.
- PostgreSQL database, role, direct endpoint, and link to the verified branch: **not verified; no database connection made**.
- Actual database revision and pending migrations: **unknown**.
- No preflight was run.

The stop was required by the missing and inconsistent configuration. The expected current revision was not changed to make validation pass.

## Local Alembic graph

The current checkout was revalidated locally, without a database connection:

- `d1f5a8e7c2b4` exists.
- `f9a1b2c3d4e5` exists and directly descends from `d1f5a8e7c2b4`.
- The target is reachable from the expected revision.
- The only legacy graph head is `f9a1b2c3d4e5`.

These local graph findings do not establish the revision currently recorded in Neon.

## Static migration review and unavailable live findings

Source review of `backend/alembic/versions/f9a1b2c3d4e5_add_placement_jobs_and_question_provenance.py` shows the migration adds 17 question provenance columns and creates `placement_jobs`, `placement_source_records`, and `placement_inventory_targets`. It updates `question_kind` from normalized `question_type`; it marks a question approved/published only when both `is_active` and `is_validated` are true, and puts other legacy questions into review. It updates existing question rows in place and contains no question-row deletion in `upgrade()`.

The migration defines unique constraints for job idempotency keys and source URLs, plus indexes. It declares no foreign keys. The `failure_reasons` column is nullable in the migration while the model expects non-null; this known mismatch remains. Defaults do not establish actual source licensing or canonical hashes. `downgrade()` drops the placement tables and all added provenance columns, so it is not an automatic rollback.

Because no live preflight ran, existing placement tables, provenance columns, row counts, legacy preservation, index/constraint conflicts, and destructive-operation inspection against the live branch are **unknown**. No live schema or data claim is made.

## Epoch issue

Phase 11 documents that the historical 44-difference comparison lacks the source comparison output and sanitized baseline catalog needed to verify the differences. It remains a separate infrastructure evidence gap. This phase provides no evidence that it blocks or clears the placement migration. No epoch runner was run.

## Tests and checks

- `python -m pytest -q tests/test_staging_migration.py tests/test_database_isolation.py`: **42 passed, 0 failed, 63 warnings**. The isolated test harness used temporary SQLite; no live database was used.
- Python syntax compilation for `app/core/config.py`, `app/database/staging_migration.py`, `run_migrations.py`, and the focused staging/database-isolation tests: **passed, exit 0**.
- `git diff --check`: **passed, exit 0**. Git printed line-ending conversion warnings for existing worktree files.
- Local Alembic graph check: **passed**, as detailed above.
- Live preflight: **not run** because required configuration validation failed.

## Worktree preservation

Initial `git status --short` contained:

```text
 M backend/.env.staging.example
 M backend/app/database/staging_migration.py
 M backend/run_migrations.py
 M backend/tests/database_isolation_support.py
 M backend/tests/test_database_isolation.py
 M backend/tests/test_staging_migration.py
 M docs/NEON_STAGING_RENDER_CONFIGURATION.md
 M test-results/.last-run.json
?? backend/PHASE_15_REVISION_CONTRACT_REPORT.md
```

Final status contains the same entries plus this new report:

```text
?? backend/PHASE_16_LIVE_STAGING_PREFLIGHT_REPORT.md
```

No existing changes were reverted, staged, or overwritten. The report is the only file added in Phase 16.

## Final decision and safety confirmation

**BLOCKED — MISSING EVIDENCE.** Required revision settings are absent and the ambiguous legacy variable is present. Neon API identity, connected database identity, and live preflight evidence are unavailable. No production or staging database was contacted. No migration, epoch command, deployment, or Render change occurred. `STAGING_MIGRATION_APPROVED=true` was not set. No secrets or connection URLs are included here.

After the operator privately configures both Phase 15 revision variables and removes the legacy variable, a separate Phase 16 read-only attempt may validate identity and run only `python run_migrations.py --staging-preflight`. The observed current revision must be reported and must match the configured expected current revision; do not update it automatically. Migration execution still requires separate authorization.

## Rerun attempt after operator update

The follow-up attempt rechecked the current execution environment before any network operation. The expected non-secret identity values and `ENVIRONMENT=staging` matched, and the three private settings were present without inspecting their contents. However, both `EXPECTED_CURRENT_MIGRATION_REVISION` and `TARGET_MIGRATION_REVISION` were missing in this process, while `EXPECTED_MIGRATION_REVISION` was set. `STAGING_MIGRATION_APPROVED` was not enabled. Configuration validation therefore failed again; no Neon API call, PostgreSQL connection, or read-only preflight was attempted. This report records the environment actually visible to the execution process, regardless of settings configured in another PowerShell process.
