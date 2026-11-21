# Phase 3.2M Incident Evidence and Stabilization Report

**Date:** 2026-11-22  
**Incident:** Render PostgreSQL startup failure with `revision='d1f5a8e7c2b4'` and `schema_differences=44`  
**Status:** **OPEN — NEEDS AUTHORIZED PRODUCTION EVIDENCE**

## Executive conclusion

The revision graph and a clean disposable PostgreSQL 18.6 reproduction are now verified. The exact 44-difference shape is reproducible locally from the epoch baseline/current models:

| Difference class | Count | Stable objects |
|---|---:|---|
| Missing table | 3 | `placement_inventory_targets`, `placement_jobs`, `placement_source_records` |
| Missing column | 17 | Placement provenance/lifecycle columns on `questions` |
| Missing index | 23 | 5 inventory, 3 job, 3 source-record, 12 question indexes |
| Missing foreign key | 1 | `questions.duplicate_of_id -> questions.id` |
| **Total** | **44** | |

This is strong evidence that the Render count is caused by a physical schema at or near the pre-placement target while current model metadata includes placement provenance. It is not proof that Render has exactly this physical schema: the production database was not accessed and the supplied log contained no individual observations. The incident remains open.

The existing `f9a1b2c3d4e5` migration creates the three tables and 17 columns, but only 17 of the 23 model indexes and does not create the `duplicate_of_id` foreign key. Applying it blindly would therefore not necessarily eliminate all model drift. No migration was executed.

## Four previously failing tests

### 1. Avatar upload

- Test: `tests/api/test_account_deletion_and_avatar.py::test_avatar_upload_and_delete`
- Failure: `TypeError: validate_image_file() got an unexpected keyword argument 'max_size_bytes'`.
- Cause: [`profile/router.py`](../../backend/app/modules/profile/router.py:343) called the helper with `max_size_bytes`, while [`file_upload.py`](../../backend/app/core/security/file_upload.py:64) defines `max_size`.
- Incident relation: unrelated to database schema; it is a genuine regression in the dirty security-hardening worktree.
- Correction: changed the caller to `max_size=MAX_AVATAR_SIZE`.

### 2–4. Compatibility-profile tests

- Tests: `test_profile_requires_external_reviewed_digest_and_synthetic_fixture`, `test_profile_rejects_non_synthetic_data_and_missing_primary_key`, and `test_profile_rejects_unknown_starting_revision`.
- Failure: `Schema profile target is not the current single Alembic head.`
- Cause: the test profile and harness constant still targeted `d1f5a8e7c2b4`, while the repository head is now `f9a1b2c3d4e5`.
- Incident relation: directly related to revision drift and stale migration-test assumptions; not production evidence.
- Correction: updated the test-only reviewed target to the current repository head. Assertions remain strict.

Affected-test rerun: **5 passed, exit code 0** (including the avatar test and all compatibility-harness tests).

During the final full-suite run, four additional genuine date-boundary regressions appeared in `tests/modules/test_data_sync_and_streaks.py`. Streak and leaderboard comparisons used UTC calendar dates while tests and the product's local-calendar contract used the local date. At shortly after local midnight, an activity recorded as today was interpreted as yesterday. The fix uses `date.today()` for calendar-day decisions and retains UTC timestamps for event time. The affected module then passed **8/8**.

## Verified Alembic graph

The local graph has one legacy head, `f9a1b2c3d4e5`. The relevant chain is:

```text
c9b0f2d5a713 -> d1f5a8e7c2b4 -> f9a1b2c3d4e5
```

The full graph contains 31 revision files, including the historical branches and merge revisions. The migration-by-migration impact inventory is summarized below; the source files remain authoritative.

| Revision(s) | Impact assessment | Data-safety assessment |
|---|---|---|
| `dd495117949b` | Historical transformation; creates refresh/resume objects, drops many legacy tables, alters users. | Destructive/irreversible on an incompatible starting schema; not a fresh baseline. |
| `bb9cc66e4c08`, `c4f8a1d2e6b7`, `e7b2c9d4f1a6` | User stats, XP, and daily-challenge columns. | Additive upgrades; downgrades remove columns/table data shape. |
| `f2a8c1d9e4b7`, `a1b2c3d4e5f6`, `b7c9d2e1f4a6`, `4a6e8c2d1f30` | Core question, matching, prep, and onboarding objects. | Additive; JSON/default and existing-schema assumptions require validation. |
| `b0c9e2a7f1d4`, `5c7e9a1d3f42` | XP dedup/backfill, constraints, battle-result and onboarding changes. | Data-transforming/backfill; downgrade has guards and may refuse. |
| `d9f8e7c6b5a4`, `e3f1a9c2d7b4`, `a4d5b6c7e8f9` | Assessment, notification, and audit schemas. | Additive; two revisions deliberately reject downgrade. |
| `c1f4a8d2e9b0`, `5d9e1f1a7c66`, `a9e4c1b7d602` | Battle exposure, skills, company requirements, merge only. | Additive/conditional; company type cast is PostgreSQL-specific. |
| `b8f2d4e6a901`, `c8d3f1a6b902`, `1c9f26ee5924` | Opportunity lifecycle, quest map, battle lifecycle. | Additive/conditional; one downgrade index operation is suspect. |
| `3e7f2c1a9b44`, `4f2a7c9e1b6d`, `e8c1b2a3f4d5` | Clerk identity, reset tokens, company requirement alignment. | Additive/guarded; PostgreSQL cast and historical assumptions require review. |
| `f1a2b3c4d5e6`, `6e1c2d3f4a5b`, `7a2b1c4d9e8f` | XP ledger, daily practice, placement catalog. | Additive; placement catalog creates tables unconditionally. |
| `47292a2a50d2` | Merge of placement and opportunity lines; no schema operation. | Safe merge metadata only. |
| `a14c6e8d2b37`, `c9b0f2d5a713` | Neon identity and assessment-submission index history. | Additive/index history; live index still requires catalog evidence. |
| `d1f5a8e7c2b4` | Battle-room ownership reconciliation, FK/index/unique changes. | Conditional but not an approved adoption profile. |
| `f9a1b2c3d4e5` | Adds 17 question fields and three placement tables with placement indexes. | Data-preserving backfill plus additive DDL; does not cover all current model indexes/FK. |

No migration was run. Legacy history was not rewritten.

## Exact disposable PostgreSQL 18.6 reproduction

Environment:

- PostgreSQL, `initdb`, and `pg_ctl`: 18.6.
- Cluster: local loopback only, temporary trust-authenticated cluster on port 55432.
- Databases: uniquely named `qubira_test_...`; synthetic only.
- No Neon or production connection.

The fresh epoch test reached the read-only postflight and failed with:

```text
The epoch database differs from its registered model schema (44 difference(s)).
```

Alembic emitted the exact 44 categories listed above. This validates genuine comparator detection and proves that a pre-placement baseline can produce the incident count. It does not prove the Render physical schema matches the fixture.

Fresh disposable PostgreSQL coordinator/placement run:

```text
pytest -q tests/migration_infrastructure/test_postgresql_migration_coordinator.py tests/migration_infrastructure/test_placement_migration_postgresql.py
13 passed, 63 warnings, exit code 0
```

The epoch fresh-install test remains **FAIL / required blocker** because the current epoch baseline is not compatible with current model metadata; it fails closed before readiness can be reported as current. This is not masked or converted into a skip.

The temporary PostgreSQL server was stopped and disposable databases were dropped. The workspace temporary cluster directory could not be removed by the host’s destructive-command policy after shutdown; it is stopped and contains no production data.

## Diagnostics coverage

[`migration_preflight.py`](../../backend/app/database/migration_preflight.py:300) now emits stable `object_id`, `expected`, and `observed` fields for table, column, index, constraint, foreign-key, and modify operations. Column type, nullability, and default changes retain normalized current/desired values. No values from rows, credentials, URLs, or tokens are included.

The full manifest comparator already includes expected-versus-actual records for tables, columns, constraints, indexes, sequences, views, materialized views, triggers, policies, row security, partitions, and PostgreSQL catalog sections. Production observations for those categories remain UNKNOWN until the operator runbook is executed.

## Stabilization changes

- Fixed the avatar upload keyword regression.
- Updated stale compatibility-profile target fixtures to the current repository head.
- Improved schema-difference diagnostics and preserved the legacy audit-index compatibility rule despite enriched difference records.
- Fixed local-calendar/UTC date-boundary handling in streak and leaderboard services.
- Added [RENDER_SCHEMA_EVIDENCE_COLLECTION_RUNBOOK.md](./RENDER_SCHEMA_EVIDENCE_COLLECTION_RUNBOOK.md).
- Did not alter migration activation, epoch enablement, startup fail-closed behavior, or production configuration.

## Test evidence

Focused incident/regression suite:

```text
pytest -q tests/test_migration_preflight.py tests/test_schema_compatibility.py tests/migration_infrastructure/test_schema_manifest.py tests/api/test_health_readiness.py tests/api/test_database_health.py tests/migration_infrastructure/test_postgresql_compatibility_harness.py tests/api/test_account_deletion_and_avatar.py::test_avatar_upload_and_delete
39 passed, 64 warnings, exit code 0
```

Full backend suite after stabilization:

```text
pytest -q
356 passed, 18 skipped, 73 warnings, exit code 0
```

This is test-suite evidence only; it does not close the production incident.

`git diff --check` must be rerun after this report generation. Frontend build/type checks were not relevant to this backend incident and were not used as evidence of database compatibility.

## Migration coordinator and activation gate

The coordinator uses a dedicated `NullPool` PostgreSQL connection, session-level advisory lock, database/user/backend-PID identity checks, and same-connection Alembic handoff. Failure states remain fail-closed. The runner rejects PostgreSQL execution unless the explicitly gated disposable-test conditions are present. Application startup performs read-only preflight only; it does not run migrations or automatic PostgreSQL repair.

The epoch runner remains disabled for production. The reproduced baseline mismatch is additional evidence that activation must remain closed until a reviewed baseline/target contract is supplied.

## Remaining production evidence requirements

An authorized operator must provide:

1. Render deployed commit SHA.
2. PostgreSQL 18.6 engine/version and schema/search-path evidence.
3. Exactly one sanitized Alembic revision row.
4. Sanitized catalog manifest and SHA-256 fingerprint.
5. Full sanitized 44-record comparator payload.
6. Confirmation whether the physical schema contains the 3/17/23/1 objects reproduced locally.

Until then, the 44 Render findings are UNKNOWN at the individual-object level. No production migration plan is approved by this report.

## Final Git state

The checkout remains on `main`, with pre-existing unrelated security/frontend changes preserved. This phase changed only incident/test-scoped files:

- [`backend/app/modules/profile/router.py`](../../backend/app/modules/profile/router.py:343)
- [`backend/app/modules/streak/service.py`](../../backend/app/modules/streak/service.py:49)
- [`backend/app/modules/leaderboard/service.py`](../../backend/app/modules/leaderboard/service.py:31)
- [`backend/app/database/migration_preflight.py`](../../backend/app/database/migration_preflight.py:300)
- [`backend/tests/test_migration_preflight.py`](../../backend/tests/test_migration_preflight.py:378)
- [`backend/tests/test_schema_compatibility.py`](../../backend/tests/test_schema_compatibility.py:109)
- [`backend/tests/migration_infrastructure/postgresql_compatibility_harness.py`](../../backend/tests/migration_infrastructure/postgresql_compatibility_harness.py:24)
- [`backend/tests/migration_infrastructure/test_postgresql_compatibility_harness.py`](../../backend/tests/migration_infrastructure/test_postgresql_compatibility_harness.py:66)
- [`backend/tests/migration_infrastructure/test_placement_migration_postgresql.py`](../../backend/tests/migration_infrastructure/test_placement_migration_postgresql.py:181)
- [`backend/tests/migration_infrastructure/test_epoch_postgresql_runner.py`](../../backend/tests/migration_infrastructure/test_epoch_postgresql_runner.py:49)
- This report and the operator runbook.

No commit or push was performed. The incident remains **OPEN** until authorized Render schema evidence classifies the actual 44 differences and the baseline/forward migration contract passes review.
