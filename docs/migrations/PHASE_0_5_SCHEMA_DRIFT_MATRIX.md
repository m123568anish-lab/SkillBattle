# Phase 0.5 Schema Drift Matrix

## Executive summary

The repository currently shows a mixed legacy/epoch state. This is a safety issue, not a migration-ready state. The app still has legacy Alembic drift and pending migration conflicts that must be reconciled before a safe epoch baseline can be adopted.

## Drift summary

| Category | Count | Status |
| --- | ---: | --- |
| Source migration differences | 34 | Active drift |
| Pending migration table conflicts | 7 | Active conflict |
| Target legacy schema differences | 2 | Active target drift |
| Source revision | `b8f2d4e6a901` | Legacy baseline |
| Repository head | `d1f5a8e7c2b4` | Current repo head |

## Drift classifications

| Difference | Table / column / constraint | SQLite definition | Repository definition | Neon actual definition | Introduced by | Type | Affects existing data | Resolution |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Source drift | Legacy schema mismatch | Current SQLite definition differs from repository model | Expected contract from `Base.metadata` | Not applicable to source comparison | Mixed legacy revisions | Additive / destructive depending on table | Potentially yes | Reconcile via migration coordinator and legacy baseline |
| Target drift | Legacy table / column mismatch | Not applicable | Expected contract | Production target differs from expected contract | Legacy / historical drift | Potentially destructive | Potentially yes | Manual review, then safe migration gating |
| Pending conflict | Table-level migration conflict | Table exists or pending state differs from Alembic metadata | Repository state expects reconciled migration state | Target conflict observed | Mixed migration sequence | Destructive if applied blindly | Yes | Resolve only through approved migration path |

## Operational interpretation

- The repository is not cleanly aligned with the source SQLite snapshot.
- The target Neon schema is not matched to the expected contract.
- Pending migration conflicts are not safe to apply automatically.
- Epoch adoption is blocked because mixed legacy/epoch state has not been reconciled.

## Safe policy

- Do not apply all pending migrations to production Neon.
- Do not blindly promote any schema drift to the target.
- Use the existing migration coordinator and preflight gates.
- Keep migration activation closed until the legacy history and target schema are reconciled.

## Evidence sources

- `backend/app/database/migration_preflight.py`
- `backend/run_migrations.py`
- `backend/app/database/migration_infrastructure/epoch_state.py`
- `backend/app/database/migration_infrastructure/migration_coordinator.py`
- `backend/tests/test_schema_compatibility.py`
