# Phase 12 — Live Staging Preflight and Migration Readiness Verification

**Review date:** 2026-11-20  
**Scope:** read-only verification only  
**Result:** **BLOCKED — CONNECTION OR IDENTITY FAILURE**

## 1. Executive summary

The live staging preflight did not succeed. The exact permitted command,
`python run_migrations.py --staging-preflight`, stopped in the authorization
phase before opening a database connection because the process did not have
`ENVIRONMENT=staging` configured.

No staging branch identity, database identity, role, endpoint, current Alembic
revision, table inventory, question counts, or live schema differences can be
certified from this run. No alternative database was contacted and no private
credential was substituted.

The repository target revision is `f9a1b2c3d4e5`. The expected preflight target
is therefore the placement migration revision, but the staging current
revision is **unknown** because the read-only connection was never established.

## 2. Previous-phase evidence and safeguard review

The following files were inspected without modifying them:

- [Phase 11 report](./PHASE_11_MIGRATION_RECONCILIATION_REPORT.md)
- [Neon staging configuration](../docs/NEON_STAGING_RENDER_CONFIGURATION.md)
- [staging_migration.py](./app/database/staging_migration.py)
- [run_migrations.py](./run_migrations.py)
- [placement migration](./alembic/versions/f9a1b2c3d4e5_add_placement_jobs_and_question_provenance.py)
- [staging migration tests](./tests/test_staging_migration.py)
- [PostgreSQL placement tests](./tests/migration_infrastructure/test_placement_migration_postgresql.py)

The safeguards described in the previous evidence are still present in the
reviewed source:

- Authorization requires explicit staging environment and expected project,
  branch, database, role, target revision, Neon API key, and migration URL.
- The migration URL must be synchronous PostgreSQL, direct, non-pooled, and
  use the expected PostgreSQL port.
- Neon API verification requires a ready, non-default branch named
  `qubira-staging` and exactly one matching enabled read-write endpoint.
- The reviewed upgrade is statically rejected if destructive operations are
  found; the downgrade is separately reported as destructive.
- The preflight checks database identity, revision state, table conflicts,
  schema state, question counts, and read-only transaction state.
- Execution requires explicit approval, but approval was not set or bypassed
  during this phase.

The repository contains only [`.env.staging.example`](./.env.staging.example),
not a private staging environment file. Process environment variable names
matching staging, Neon, migration, or database credentials were absent. Secret
values were not printed or inspected.

## 3. Staging identity verification

| Check | Result |
|---|---|
| Neon branch name `qubira-staging` | **Not verified**; preflight stopped before Neon API/database verification. |
| Database `neondb` | **Not verified**. |
| Role `neondb_owner` | **Not verified**. |
| Direct non-pooled migration endpoint | **Not verified**. Source guard requires it, but no URL was available to authorize. |
| Connected database is not production | **Not verified by connection**. No connection was made. |
| Staging-only credentials | **Unavailable in this process**; no substitute used. |

The intended endpoint type from the repository safeguards is a direct,
non-pooled Neon PostgreSQL read-write endpoint using the synchronous psycopg
driver for migration/preflight. The endpoint URL is intentionally not included.

Because branch identity cannot be independently established, the requested
identity gate requires stopping here. The report does not infer identity from
the branch name in documentation or from the example environment file.

## 4. Exact preflight command and complete output

Command executed from `D:\BattleAI\backend` using the configured Python 3.11.9
interpreter:

```text
python run_migrations.py --staging-preflight
```

The command exited with status `1`. Complete output, with no secret values,
was:

```text
2026-11-20 21:37:45,048 ERROR __main__: STAGING MIGRATION FAILED phase=authorization error_type=StagingMigrationError driver_error_type=None sqlstate=None detail=Staging migrations require ENVIRONMENT=staging explicitly. traceback_frames=run_migrations.py:746:run_staging_migration -> staging_migration.py:118:load_staging_migration_authorization
EXIT_CODE=1
```

This is an authorization failure, not a database or migration result. The
command did not produce current revision, pending revision, table, column,
question-count, index, constraint, destructive-operation, or branch-verification
data. Those fields remain **not observed**, not empty and not assumed safe.

## 5. Current and target revisions

| Revision | Status |
|---|---|
| Current staging Alembic revision | **Unknown**; no connection was made. |
| Repository legacy head | `f9a1b2c3d4e5`, verified locally from the Alembic graph. |
| Requested migration target | `f9a1b2c3d4e5`, from the repository authorization contract. |
| Pending revisions | **Unknown**; cannot calculate without staging `alembic_version`. |
| Epoch head | `094cdd2eab54`, independent path; not part of this placement preflight. |

The Phase 11 report identified `d1f5a8e7c2b4` as the expected pre-placement
revision based on prior repository evidence. This phase does not reassert that
as staging's current revision because the live identity gate failed.

## 6. Existing table and column inventory

### Live staging inventory

**Not available.** The preflight did not connect, so the following cannot be
reported for staging:

- presence or absence of `placement_jobs`, `placement_source_records`, and
  `placement_inventory_targets`;
- presence or absence of the 17 question provenance columns;
- existing indexes, constraints, foreign keys, or table conflicts;
- `questions` row counts grouped by question type, activity, or validation;
- epoch control/version objects;
- pending table-operation conflicts.

### Repository target inventory

The reviewed migration statically declares:

- three new tables: `placement_jobs`, `placement_source_records`, and
  `placement_inventory_targets`;
- seventeen new `questions` columns: `source_url`, `source_classification`,
  `company`, `role`, `assessment_round`, `question_kind`, `topic`, `subtopic`,
  `original_publish_date`, `license`, `verification_status`,
  `approval_status`, `lifecycle_state`, `duplicate_of_id`, `failure_reasons`,
  `canonical_hash`, and `reuse_permission`.

This source inventory is not a live staging inventory.

## 7. Question data preservation and migration safety

The migration source preserves the original question columns and explicitly
backfills:

- `question_kind` from normalized `question_type`, defaulting to `mcq`;
- `verification_status` to `approved` only when `is_active` and `is_validated`
  are both true, otherwise `needs_review`;
- `approval_status` using the same active/validated rule;
- `lifecycle_state` to `PUBLISHED` only when active and validated, otherwise
  `NEEDS_REVIEW`.

The source gives existing-row DDL defaults to the other non-null provenance
columns. That preserves row existence but does not recover missing provenance,
compute canonical hashes, perform deduplication, or establish licensing
evidence.

Static risks requiring live evidence before approval:

- `failure_reasons` is nullable in the migration but non-nullable in current
  SQLAlchemy metadata; this is a model/history drift requiring a decision.
- `duplicate_of_id` has an index but no foreign key in the migration.
- `canonical_hash` defaults to an empty value rather than computing a hash or
  enforcing uniqueness.
- Placement table creation is additive in the upgrade, but existing tables or
  indexes would be a conflict that only the staging preflight can identify.
- The downgrade drops all three placement tables and all 17 provenance
  columns. It is not an automatic or lossless rollback.

The source migration contains no upgrade `drop_table`, `drop_column`,
`drop_index`, `truncate`, or destructive raw SQL operation according to the
repository's AST safety check. This static fact does not override a failed
identity gate or prove that the live database is compatible.

## 8. Recovery strategy

No recovery action was performed. If a later, separately approved execution is
considered, the minimum recovery plan is:

1. Confirm the Neon branch, project, database, role, and direct endpoint through
   independent API and SQL identity checks.
2. Create and verify a database-native backup or branch restore point before
   any DDL; confirm the restore is usable on an isolated target.
3. Run the read-only preflight against the restored/disposable target and
   retain its redacted JSON output.
4. If execution fails, stop and preserve the failure state; do not retry on the
   original branch until the partial transaction/DDL state is understood.
5. Prefer an approved forward-fix migration for any discovered drift. Do not
   use downgrade as rollback because it drops generated placement/provenance
   objects.
6. Restore the staging branch from the verified recovery point if the approved
   recovery decision calls for it. Production must remain outside the process.

## 9. Epoch 44-difference issue remains separate

The Phase 11 finding that the historical 44-item epoch comparison cannot be
reproduced remains an independent migration-infrastructure concern. This phase
did not execute the epoch runner, compare epoch metadata to a live database, or
combine epoch differences with the placement revision.

The placement preflight uses the legacy Alembic lineage and target
`f9a1b2c3d4e5`. The epoch root `094cdd2eab54` is not a parent of that revision.
The missing 44-item evidence therefore remains unresolved, but no conclusion
is drawn here that it blocks or clears placement execution. A separate epoch
review is required.

## 10. Readiness decision

### **BLOCKED — CONNECTION OR IDENTITY FAILURE**

This result is required because the preflight could not establish
`ENVIRONMENT=staging` and therefore could not independently verify the Neon
branch or database identity. It is not `READY FOR HUMAN APPROVAL` and does not
authorize migration execution.

Required human/operator decisions and evidence:

- Provide the staging-only environment with `ENVIRONMENT=staging` and the
  expected identity values through the approved private channel.
- Provide the direct, non-pooled staging migration credential and Neon API key
  privately; never place either in the report or source tree.
- Independently verify that the API key and direct endpoint refer to the
  non-default `qubira-staging` branch, `neondb`, and `neondb_owner`.
- Rerun only `python run_migrations.py --staging-preflight` and retain its
  redacted complete JSON output.
- Review any pending revisions, existing placement objects, question counts,
  indexes, constraints, and preflight conflicts before deciding whether to
  request migration approval.
- Resolve the `failure_reasons` model/migration nullability discrepancy and the
  separate epoch 44-difference evidence gap before production-facing changes.

## 11. Commands, tests, and checks

Executed:

```text
python run_migrations.py --staging-preflight
python -m pytest -q tests/test_staging_migration.py tests/migration_infrastructure/test_placement_migration_postgresql.py
python -m compileall -q app/database/staging_migration.py run_migrations.py
git diff --check
```

Results:

- Live preflight: failed closed during authorization, exit code `1`.
- Local staging safeguard tests: **13 passed, 2 skipped, 0 failed**.
- Skipped tests require a uniquely named loopback disposable PostgreSQL
  database; no persistent or staging database was substituted.
- Python syntax compilation: passed, exit code `0`.
- `git diff --check`: passed, exit code `0`.

## 12. Explicit operation confirmation

- No production database was contacted.
- No staging database was contacted because authorization failed before
  connection.
- No migration, `alembic upgrade`, `alembic downgrade`, epoch runner, or
  `--staging-execute` path was run.
- `STAGING_MIGRATION_APPROVED=true` was not set.
- No Render service was modified or deployed.
- No database URL, credential, API token, or secret value was printed.
- Existing worktree changes were preserved.

## 13. Files changed

Only this report was added by Phase 12:

[PHASE_12_STAGING_PREFLIGHT_REPORT.md](./PHASE_12_STAGING_PREFLIGHT_REPORT.md)

