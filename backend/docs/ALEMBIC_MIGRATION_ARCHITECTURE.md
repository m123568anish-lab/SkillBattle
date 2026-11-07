# Alembic Migration Architecture

## Current architecture

Alembic revisions live in `backend/alembic/versions`; `backend/alembic/env.py` uses the synchronous SQLAlchemy URL resolved by `app.database.database`. SQLAlchemy model metadata is imported from `app.models`. SQLite uses the synchronous `pysqlite` driver for migrations, while application async sessions use `aiosqlite`; PostgreSQL migration connections use the synchronous Psycopg 3 driver and async application sessions use `asyncpg`.

The Render service's start command is `python -u run_migrations.py && exec uvicorn app.main:app --host 0.0.0.0 --port $PORT`. The migration runner rejects ambiguous revision metadata, missing tables from already-recorded table-creation revisions, pending table-level conflicts, and model/schema drift at the current head before applying Alembic. Application lifespan no longer creates tables outside Alembic. The container entrypoint uses this runner and fails closed on migration errors.

## Revision graph

There are 26 revisions, no branch labels, and one repository head:

```text
dd495117949b
  -> bb9cc66e4c08 -> c4f8a1d2e6b7 -> e7b2c9d4f1a6
  -> f2a8c1d9e4b7 -> a1b2c3d4e5f6 -> b7c9d2e1f4a6
  -> 4a6e8c2d1f30 -> b0c9e2a7f1d4 -> 5c7e9a1d3f42
  -> d9f8e7c6b5a4
       ├-> e3f1a9c2d7b4 -> a4d5b6c7e8f9 ─┐
       ├-> c1f4a8d2e9b0 ──────────────────┼-> a9e4c1b7d602
       └-> 5d9e1f1a7c66 ─────────────────┘
           ├-> b8f2d4e6a901 ──────────────────────────────────┐
           └-> c8d3f1a6b902 -> 1c9f26ee5924 -> 3e7f2c1a9b44  │
               -> 4f2a7c9e1b6d -> e8c1b2a3f4d5 -> f1a2b3c4d5e6
               -> 6e1c2d3f4a5b -> 7a2b1c4d9e8f ───────────────┤
                                                               v
                                                     47292a2a50d2
```

`a9e4c1b7d602` merges three parents. `47292a2a50d2` merges `b8f2d4e6a901` and `7a2b1c4d9e8f` and performs no schema operation.

The individual revisions are authoritative for complete operation details. The audit identified these notable operations and risks:

- `dd495117949b` is a historical schema transformation, not a clean-install baseline. It creates `refresh_tokens` and `resumes`, drops numerous legacy tables unconditionally (including `interview_questions`), and alters `users`. It assumes the old schema exists and is not SQLite-safe for the `users.full_name` type alteration.
- `b0c9e2a7f1d4` performs XP data cleanup/backfill and modifies battle result nullability.
- `5d9e1f1a7c66` and `e8c1b2a3f4d5` both declare `company_skill_requirements`; guards reduce duplicate creation on the declared path. The PostgreSQL cast `company_id::integer` has no explicit SQLite equivalent.
- `e3f1a9c2d7b4` and `a4d5b6c7e8f9` intentionally reject downgrade.
- `b8f2d4e6a901` creates a unique index for applications, but downgrade attempts to drop it as a table constraint.
- `7a2b1c4d9e8f` unconditionally creates the placement tables and indexes. Existing databases may already have these tables.
- No migration files were deleted or edited during this phase.

### Revision-by-revision operation inventory

| Revision (parent) | Upgrade operations and key schema objects | Downgrade / compatibility notes |
|---|---|---|
| `dd495117949b` (base) | Creates `refresh_tokens` (user FK, unique token, user index) and `resumes` (user FK, user/email indexes); drops legacy `interview_questions`, `battle_participants`, `developer_api_usages`, `problems`, `battle_rooms`, `interview_answers`, `tournament_matches`, `api_request_logs`, `battle_submissions`, `daily_challenges`, `memory`, `streak`, `interview_sessions`, `roadmap_weeks`, `profiles`, `code_submissions`, `test_cases`, `roadmap_tasks`, `roadmaps`, `developer_api_keys`, `xp`, `achievements`, `webhooks`, `battle_results`, `tournament_participants`, and `tournaments`; alters `users` with profile/role/stat columns and a username unique index. | Recreates the legacy tables and reverses the user changes. Unconditional table/index drops fail if absent; `users.full_name` alter is not SQLite batch-safe. Not a clean-install baseline. |
| `bb9cc66e4c08` (`dd495117949b`) | Creates `user_skill_stats` with user FK and user index. | Drops the table. |
| `c4f8a1d2e6b7` (`bb9cc66e4c08`) | Adds `xp.daily_xp` non-null with default `0`. | Drops the column; SQLite requires batch alter support. |
| `e7b2c9d4f1a6` (`c4f8a1d2e6b7`) | Adds `daily_challenges.xp_reward` non-null with default `50`. | Drops the column; SQLite requires batch alter support. |
| `f2a8c1d9e4b7` (`e7b2c9d4f1a6`) | Creates `user_stats`, `user_settings`, `questions`, `user_submissions`; defines PKs, unique user IDs/question title+slug/submission user+question, user/question FKs, and query indexes. | Drops the four tables. |
| `a1b2c3d4e5f6` (`f2a8c1d9e4b7`) | Creates `matchmaking_matches` (unique room, two user FKs, room index) and `placement_prep_sessions` (user FK and user index). | Drops both tables. |
| `b7c9d2e1f4a6` (`a1b2c3d4e5f6`) | Adds `questions.topic_tags` JSON non-null with default `[]`. | Drops the column; dialect JSON/default handling requires validation. |
| `4a6e8c2d1f30` (`b7c9d2e1f4a6`) | Conditionally adds `profiles.onboarding_preferences` JSON non-null with `{}` default. | Conditionally removes the column. |
| `b0c9e2a7f1d4` (`4a6e8c2d1f30`) | Deduplicates/backfills XP, adds unique user index/FK, and adds `battle_results.is_draw` and nullable winner support. | Removes index/FK; refuses downgrade if draws exist; otherwise reverses the result changes. Uses raw SQL/backfill and `TRUE`. |
| `5c7e9a1d3f42` (`b0c9e2a7f1d4`) | Adds/backfills `users.onboarding_completed` non-null Boolean default true. | Drops the column. |
| `d9f8e7c6b5a4` (`5c7e9a1d3f42`) | Creates `unified_assessments`, `assessment_attempts`, `assessment_question_submissions`, and `student_skill_profiles`; defines user/assessment/question FKs, a unique profile user, and lookup indexes. | Drops the four tables. |
| `e3f1a9c2d7b4` (`d9f8e7c6b5a4`) | Creates `notifications` with user cascade FK and user/created indexes; adds related-entity columns when a table already exists. | Deliberately raises; not downgradeable. |
| `a4d5b6c7e8f9` (`e3f1a9c2d7b4`) | Creates `audit_logs` with nullable user `SET NULL` FK and user/organization indexes; conditionally adds organization/entity/metadata context columns. | Deliberately raises; not downgradeable. |
| `c1f4a8d2e9b0` (`d9f8e7c6b5a4`) | Conditionally adds adaptive owner/date fields and a unique pair index to `battle_rooms`; creates `question_exposures` with user/question cascade FKs, unique user/question, and user/question indexes. | Drops the new table and battle-room additions. |
| `5d9e1f1a7c66` (`d9f8e7c6b5a4`) | Creates `skill_evidence` with user cascade FK, identity unique constraint, and six lookup indexes; creates `company_skill_requirements` with company cascade FK, company/skill unique, and indexes. | Drops both tables. Uses PostgreSQL `company_id::integer` cast in a conditional conversion; SQLite equivalent is not explicit. |
| `a9e4c1b7d602` (three-parent merge) | No schema operations. | No schema operations. |
| `b8f2d4e6a901` (`a9e4c1b7d602`) | Adds job-posting lifecycle/source columns and deadline index; adds application method/confirmation fields and unique job/user index; creates saved-opportunity and application-status-history tables with cascading / `SET NULL` FKs and indexes. | Drops added objects. The unique index is dropped as a constraint, which may not match the upgrade operation. |
| `c8d3f1a6b902` (`a9e4c1b7d602`) | Creates `quest_map_levels` and `quest_progress` with map/user/level/battle relationships, unique battle and user/level constraints, and lookup indexes. | Drops both tables. |
| `1c9f26ee5924` (`c8d3f1a6b902`) | Conditionally adds battle lifecycle fields to `battle_rooms` and readiness/status fields to `battle_participants`. | Conditionally removes those columns; SQLite alter behavior requires testing. |
| `3e7f2c1a9b44` (`1c9f26ee5924`) | Conditionally adds `users.clerk_user_id` and a unique index. | Removes the column/index. |
| `4f2a7c9e1b6d` (`3e7f2c1a9b44`) | Creates `password_reset_tokens` if absent, with user cascade FK and user/unique token-hash indexes. | Drops the table. |
| `e8c1b2a3f4d5` (`4f2a7c9e1b6d`) | Creates or aligns `company_skill_requirements`; repeats the guarded definition from `5d9e1f1a7c66` and may convert `company_id`. | No-op downgrade. PostgreSQL-specific cast has no explicit SQLite equivalent. |
| `f1a2b3c4d5e6` (`e8c1b2a3f4d5`) | Creates `xp_ledger` with user cascade FK, unique user/source/reference, and user/source/reference indexes. | Drops the table. |
| `6e1c2d3f4a5b` (`f1a2b3c4d5e6`) | Conditionally creates `daily_practice_sessions` with user/challenge/problem/submission FKs, unique user/date, and user/date/problem/status indexes. | Conditionally drops the table. |
| `7a2b1c4d9e8f` (`6e1c2d3f4a5b`) | Unconditionally creates placement companies (unique name and name/category indexes), tracks (company cascade FK, company/role indexes), and rounds (track cascade and assessment `SET NULL` FKs, track index). | Drops the three tables. Existing same-named tables cause failure before migration completion. |
| `47292a2a50d2` (merge of `7a2b1c4d9e8f`, `b8f2d4e6a901`) | No schema operations. | No schema operations. |

## Fresh installation status and procedure

**A fresh SQLite migration is not currently supported by the historical chain.** The root revision is not a clean-install schema initializer: it fails when an unconditionally dropped legacy table is absent, and it subsequently assumes pre-existing `users` and legacy tables. Changing that revision would violate the requirement to preserve already-applied migration history; a downstream revision cannot repair an error that happens before the downstream revision runs.

Until a versioned bootstrap architecture is separately designed and approved, do not claim a fresh database is initialized by `alembic upgrade head`, `create_all()`, or `stamp head`. The safe behavior is to stop with a diagnostic and preserve the database. A complete replacement/bootstrap design must retain a valid one-head graph and explicitly define how databases already on every historical revision converge; no such migration is provided by this phase.

Application startup no longer calls `init_db()`. Once an approved bootstrap path exists, operators should use the repository's migration runner before starting the API:

```powershell
cd backend
python -m app.database.migration_preflight
python run_migrations.py
```

At present, the runner will deliberately refuse a clean database if planned table operations conflict with its inspected state. The preflight command is diagnostic; `eligible_for_migration: false` is a stop condition, not an instruction to stamp or bypass revisions.

## Existing database upgrade procedure

1. Stop writes and create a database-native backup using an approved procedure; verify that the backup can be restored to an isolated target.
2. Run `python -m app.database.migration_preflight` with the intended database URL and retain its output securely. It performs no DDL or data changes.
3. Review current and target revisions, all schema differences, and pending-operation conflicts with a database architect.
4. Do not proceed when revision metadata is missing, unknown, multiple, or inconsistent; when preflight reports conflicts; or when the actual schema has not been reconciled.
5. Apply only a reviewed migration plan to a disposable restored copy first. Verify schema, row counts, foreign keys, unique constraints, and application behavior.
6. Production application requires separate explicit approval, a verified backup/recovery plan, and a maintenance window.

The inspected local database is at `b8f2d4e6a901`, while the repository has one head, `47292a2a50d2`. Read-only preflight found 26 SQLAlchemy metadata differences and seven pending `CREATE TABLE` collisions: `quest_map_levels`, `quest_progress`, `password_reset_tokens`, `xp_ledger`, and the three placement tables. In particular, `company_skill_requirements.company_id` is `VARCHAR(36)` locally but `INTEGER` in the model. The placement migration creates its tables without existence guards. The runner detects these conflicts and does not stamp the missing revision; the local database is not eligible for automatic upgrade. Types, nullability, defaults, indexes, constraints, and foreign keys require explicit reconciliation before any upgrade.

## Migration preflight

Run from `backend`:

```powershell
python -m app.database.migration_preflight
```

The command reports a credential-free database identity, dialect, current revision, repository heads/count, table count, missing tables expected from already-recorded table-creation revisions, SQLAlchemy metadata differences (including columns, types, nullability, defaults, indexes, constraints, and foreign keys), pending table conflicts, state diagnostics, and a conservative `eligible_for_migration` result. SQLite inspection uses a `mode=ro` connection. PostgreSQL inspection issues `SET TRANSACTION READ ONLY` before reading schema metadata.

Preflight does not create tables, alter schema, stamp revisions, insert or delete data, or adjust database settings. It is not a substitute for reviewing each migration operation. PostgreSQL preflight was not run in this phase.

## SQLite and PostgreSQL behavior

SQLite and PostgreSQL differ in DDL transaction semantics, alter-column support, autoincrement behavior, JSON representation, booleans, and foreign-key enforcement. The migration graph contains a direct `users.full_name` type alteration, batch-style operations in `b8f2d4e6a901`, JSON/Boolean server defaults, and a PostgreSQL-specific cast. SQLite may require Alembic batch table rebuilds for some alterations; those rebuilds must be tested against a disposable copy with representative data.

All SQLite integration tests must point to a newly-created disposable file. Preserve foreign-key checks and use synthetic records only. Never infer that a migration is PostgreSQL-safe from SQLite tests. A disposable PostgreSQL service was not available for this phase, and no Neon connection was made.

## Backup, recovery, and rollback

- Never use `RESET_DB`, delete/recreate a database, or run `create_all()` as a migration substitute.
- Never run `stamp head` to silence a revision mismatch. Any narrowly scoped revision reconciliation requires a separately approved schema proof and a durable audit record.
- Prefer forward corrective migrations for already-applied schema changes. Downgrades are not assumed safe; some are intentionally prohibited and the `b8f2d4e6a901` downgrade has a unique-index/constraint mismatch.
- If an approved migration fails, stop application rollout and restore the verified backup to a separate database. Do not retry on the original until the partial state is understood.
- Restore/recovery and any original-database operation are outside the scope of this phase.

## Production deployment

The current Render start command runs `run_migrations.py` before Uvicorn and must remain fail-closed. No Render, Vercel, Neon, or UptimeRobot settings were inspected or changed in this phase. Do not deploy the migration runner changes until the historical fresh-install issue and the existing placement-table reconciliation have a reviewed, tested resolution.

## Prohibited operations

During this phase and until separate approval: migration/stamp/DDL against `D:\BattleAI\skillbattle.db`; any Neon connection or production database operation; production settings changes; record import/export; migration-file deletion; authentication or application business-logic changes; deployment; commit or push.
