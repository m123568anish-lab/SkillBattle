# Qubira Phase 3 Migration Safety Report

## Status

Migration safety hardening and local validation are complete, but migration acceptance is **blocked**. The repository has one Alembic head; the fresh-install history still fails, and the existing local database is not eligible for automatic upgrade. No database or production migration was performed.

## Findings and root cause

- The merge revision `47292a2a50d2` already exists and is the sole head. It merges `7a2b1c4d9e8f` and `b8f2d4e6a901`. These revisions are separate branches of the graph; their merge is graph-only and does not resolve schema drift in databases.
- The currently inspected local SQLite database is at `b8f2d4e6a901`. It contains tables created by later migrations that are not reflected in its recorded revision, so applying those migrations would collide with existing objects.
- The historical root migration `dd495117949b` is not a clean-install initializer. On a fresh disposable SQLite database, `alembic upgrade head` fails while dropping the absent `interview_questions` table. Repairing that already-applied migration was intentionally avoided.
- The migration runner previously allowed automatic stamping/schema initialization behavior. It now fails closed and does not bypass migration history or hide migration errors.
- These findings apply to the inspected local SQLite database and disposable SQLite test databases only. Neon/Render were not accessed; their current schema and migration state remain unverified.

## Migration graph and files inspected

The complete 26-revision graph is inventoried in [backend/docs/ALEMBIC_MIGRATION_ARCHITECTURE.md](./backend/docs/ALEMBIC_MIGRATION_ARCHITECTURE.md). Relevant revisions:

| Revision | Graph role | Relevant operation/result |
|---|---|---|
| `dd495117949b` | Root | Assumes legacy tables exist; fresh SQLite upgrade fails on `interview_questions`. |
| `a9e4c1b7d602` | Multi-parent branchpoint | Parent of the later lifecycle and placement paths. |
| `b8f2d4e6a901` | Existing database revision; branch head | Opportunity lifecycle, saves, and application history. |
| `7a2b1c4d9e8f` | Other branch head | Unconditionally creates `placement_companies`, `placement_tracks`, and `placement_track_rounds`. |
| `47292a2a50d2` | Sole merge head | `down_revision` contains both `7a2b1c4d9e8f` and `b8f2d4e6a901`. |

`alembic heads` and `alembic history --verbose` confirmed one head and both branch revisions as its ancestors. No migration file was deleted or rewritten, and no new merge revision was needed.

## Changes made

- Hardened [backend/run_migrations.py](./backend/run_migrations.py): no auto-stamping, duplicate-row repair, or schema bootstrapping; it checks revision/table consistency, pending table-operation conflicts, and model-schema differences before upgrading, and fails closed.
- Added [backend/app/database/migration_state.py](./backend/app/database/migration_state.py) to validate revision metadata and inspect migration table operations.
- Added [backend/app/database/migration_preflight.py](./backend/app/database/migration_preflight.py), a read-only schema/revision preflight. SQLite inspection uses read-only mode. Structured schema differences are normalized to stable JSON fields.
- Removed startup `init_db()` schema initialization from [backend/app/main.py](./backend/app/main.py); updated [backend/entrypoint.sh](./backend/entrypoint.sh) to use the fail-closed runner.
- Added safety coverage in [backend/tests/test_migration_state.py](./backend/tests/test_migration_state.py) and [backend/tests/test_migration_preflight.py](./backend/tests/test_migration_preflight.py).
- Documented the graph, blockers, and safe operating procedure in [backend/docs/ALEMBIC_MIGRATION_ARCHITECTURE.md](./backend/docs/ALEMBIC_MIGRATION_ARCHITECTURE.md).
- No dashboard, XP, authentication, deployment configuration, or historical migration logic was changed.

## Local database inspection and safety

Read-only inspection of `D:\BattleAI\skillbattle.db` found:

- Users: **1,845**
- Revision: `b8f2d4e6a901`
- Placement table row counts: **0** in each of the three placement tables
- `PRAGMA foreign_key_check`: **0 violations**
- Repository head: `47292a2a50d2` (one head)
- SQLAlchemy metadata differences: **26**
- Pending table-creation conflicts: **7**
- `eligible_for_migration`: **false**

The seven pending collisions are `quest_map_levels`, `quest_progress`, `password_reset_tokens`, `xp_ledger`, `placement_companies`, `placement_tracks`, and `placement_track_rounds`.

Differences requiring explicit reconciliation include `company_skill_requirements.company_id` (`VARCHAR(36)` locally versus `INTEGER` in the model), `battle_results` score nullability and constraints, battle-room foreign keys/indexes, candidate-application uniqueness representation, streak indexes/constraints/foreign keys, and defaults/indexes on other tables. The migration preflight reports these as differences; it does not change them or prove a data conversion safe.

The original SQLite database's SHA-256 was unchanged by inspection:

`EDA8C4634AD9E1216EDC11272D16F5BC8474B44AC69E42843B2D9C0253E8DB8F`

The 1,845-user count, revision, placement row counts, foreign-key check, and unchanged hash confirm that the original local database was not modified. No Neon connection or production operation was made.

## Validation evidence

Commands were run from `backend` unless noted.

| Command | Result |
|---|---|
| `alembic heads` | **PASS**, exit 0; exactly one head: `47292a2a50d2`. |
| `alembic history --verbose` | **PASS**, exit 0; the merge lists both branch heads as parents. |
| `python -m pytest tests/test_migration_state.py tests/test_migration_preflight.py tests/modules/test_local_database_persistence_restart.py -q --tb=short` | **PASS**, exit 0; 15 passed, 64 warnings. Uses test fixtures and a disposable SQLite database. |
| `python -m compileall -q run_migrations.py app\database\migration_state.py app\database\migration_preflight.py app\main.py tests\test_migration_state.py tests\test_migration_preflight.py` | **PASS**, exit 0. |
| `python -m app.database.migration_preflight` with the local SQLite URL | **PASS as a read-only diagnostic**, exit 0; reports 26 differences, 7 conflicts, and `eligible_for_migration: false`. Original DB hash unchanged. |
| `python -u run_migrations.py` with environment variables pointed to a synthetic disposable SQLite fixture at revision `b8f2d4e6a901` | **EXPECTED SAFE REFUSAL**, exit 1; detected that tables claimed by applied revisions were missing. The fixture hash was unchanged. This was not the original database. |
| `alembic upgrade head` with `DATABASE_URL` pointed to a new disposable SQLite file | **FAIL / BLOCKER**, exit 1; `dd495117949b` failed on `DROP TABLE interview_questions` because the table does not exist. This reproduces the fresh-install defect; only the disposable database was targeted. |
| `git diff --check` | **PASS**, exit 0. |

Warnings from pytest were reported, not suppressed. No disposable PostgreSQL service was available, so PostgreSQL upgrade behavior was not verified. No full backend, frontend build, or production validation is claimed by this report.

## Deployment and next steps

**Do not deploy the migration runner changes against Render/Neon yet.** The current local schema is not eligible for automatic upgrade, and the production schema was not inspected. A fail-closed refusal is safer than an unverified schema change, but it can still prevent the application from starting if production has the same conflicts.

Before any deployment or migration:

1. Separately authorize a read-only production preflight; verify the database identity and revision without exposing credentials.
2. Design and approve a forward-only reconciliation for the seven existing-table collisions and all schema differences, including the `company_id` conversion and data invariants.
3. Design a supported fresh-install/bootstrap path that does not rewrite an applied historical migration or substitute `create_all()`/stamping.
4. Validate the approved approach against a disposable restored copy and a fresh PostgreSQL test database; verify schema, data invariants, and application behavior.
5. Only after those checks pass, schedule a backed-up, separately approved production rollout. Do not disable the runner's failure behavior.

No Render, Neon, Vercel, or UptimeRobot settings were inspected or changed. No deployment, commit, push, stamp, or migration against the original SQLite database or production was performed.
