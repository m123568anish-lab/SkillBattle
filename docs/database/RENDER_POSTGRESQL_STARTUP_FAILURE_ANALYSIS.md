# Render PostgreSQL Startup Failure Analysis

**Updated:** 2026-11-09  
**Scope:** Source inspection, user-supplied Render logs, and disposable local tests. No production service or database was accessed.

## Executive finding

The supplied Render logs establish that the migration process exited with status 1 before Uvicorn started. The configured shell command uses `&&`, so this exit prevents the API process from launching.

A matching failure was reproduced on a disposable PostgreSQL 18.6 cluster while Alembic compared server defaults for a JSON column. The baseline comparator attempted:

```sql
SELECT '{}'::json = '{}' AS anon_1
```

PostgreSQL returned SQLSTATE `42883` (`UndefinedFunction`); SQLAlchemy surfaced `ProgrammingError`, with psycopg's underlying exception type `UndefinedFunction`. PostgreSQL `json` has no equality operator. This is a credible explanation for the supplied generic `ProgrammingError`, but production's exact SQLSTATE, statement, deployed commit, and comparison phase were not supplied, so the production root cause is not yet proven.

The message about `ix_assessment_q_sub_user_created` is a separate schema-drift finding. The index is created by `init_db.py` but is absent from the model metadata and historical revision inspected. Alembic reports it as a removed index during comparison; comparison did not execute a `DROP INDEX`. Strict preflight would still reject the difference after the JSON comparison error is fixed unless the intended index is represented or deliberately handled.

The current worktree's migration runner and Alembic environment explicitly block online PostgreSQL migration execution until PostgreSQL ownership coordination exists. With a PostgreSQL URL, the current runner exits before connecting. Consequently, the supplied PostgreSQL autogenerate logs cannot have come from this exact runner/environment path; the deployed commit or service command remains unknown.

## Evidence and migration path

### Startup command

`render.yaml` declares:

```sh
python -u run_migrations.py && exec uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

If `run_migrations.py` exits nonzero, the shell does not execute Uvicorn. The supplied `Exited with status 1` and `No open ports detected` are consistent with that sequence.

### Current worktree behavior

- `run_migrations.py` obtains the repository head from `ScriptDirectory.get_heads()` and invokes `command.upgrade` to that explicit revision. It does not invoke `alembic revision --autogenerate`.
- If the database is already at the repository head, it calls `compare_model_schema()`, which uses Alembic `compare_metadata` to check model/schema drift. This is comparison, not a generated migration or DDL execution.
- `alembic/env.py` rejects online PostgreSQL execution before running any revision. `run_migrations.py` also rejects the PostgreSQL dialect before ownership acquisition or database inspection.
- With the correct test environment settings and a PostgreSQL URL, the runner exited 1 at `dialect_gate`, reporting that PostgreSQL migration ownership is not implemented. An `alembic upgrade head` attempt against a disposable PostgreSQL 18.6 cluster exited 1 at the explicit environment gate; the cluster remained without an `alembic_version` table or application tables.

The exact path observed in the current repository therefore cannot reproduce PostgreSQL schema introspection. The production logs must come from a different deployed commit, command, or runner path.

### Current Alembic graph

`alembic heads --verbose` and `alembic history --verbose` show one head in the current worktree:

```text
a14c6e8d2b37
  -> 47292a2a50d2 (merge of 7a2b1c4d9e8f and b8f2d4e6a901)
  -> existing migration graph
```

The merge revision has both previous heads as parents, so they remain ancestors of the final head. The additional `a14c6e8d2b37` revision and related Neon identity changes are present in the worktree and affect the current head; they were not created as part of this investigation. The repository graph is not currently producing a multiple-head error.

## PostgreSQL comparator reproduction

An isolated PostgreSQL 18.6 cluster was initialized under the temporary directory and used only with synthetic schema objects.

1. A blank disposable schema completed a comparison against synthetic metadata.
2. A synthetic existing schema with a JSON server default reproduced the baseline failure:
   - SQLAlchemy exception: `ProgrammingError`
   - psycopg exception: `UndefinedFunction`
   - SQLSTATE: `42883`
   - Failed SQL: `SELECT '{}'::json = '{}' AS anon_1`
3. The updated JSON-specific comparison callback compared simple JSON literal defaults in Python. The same schema comparison then completed without issuing the unsupported equality query.
4. The synthetic composite index was reported as `remove_index`, but no `DROP INDEX` statement was executed.
5. No Alembic migration was executed: the current PostgreSQL migration path refuses online execution before applying a revision.

The local reproduction establishes the comparator defect and validates the narrow comparison correction. It does not establish that the same expression caused the production failure.

## Index and schema compatibility

`backend/app/database/init_db.py` creates `ix_assessment_q_sub_user_created` with `CREATE INDEX IF NOT EXISTS`. The inspected assessment model and `d9f8e7c6b5a4` revision do not define that composite index. Alembic's `Detected removed index` message describes a comparison result; it is not evidence that the runner executed destructive SQL.

Do not drop, recreate, or stamp the production index. Before treating the schema as compatible:

1. An authorized operator should obtain the deployed commit and a redacted schema-only definition of the index and relevant table from the production provider.
2. Confirm whether this index is intentionally maintained outside Alembic.
3. Choose an explicit forward-only representation, such as adding the index to model metadata and a guarded new revision for fresh databases, or an explicitly reviewed exception in schema comparison.
4. Verify the selected treatment against both a fresh disposable PostgreSQL database and a disposable database matching the existing schema.

No production schema was inspected, so production index safety is not independently confirmed. No production data was modified.

## Safe diagnostic logging

`backend/app/database/migration_diagnostics.py` and `run_migrations.py` now log structured, redacted failure context:

- phase, current revision, and target revision;
- SQLAlchemy and driver exception class;
- validated SQLSTATE when provided by the driver;
- SQL statement with URL credentials, quoted literals, and sensitive assignments redacted and length-limited;
- whether the SQLAlchemy transaction was active;
- sanitized traceback frame names without exception messages or bound parameters.

Focused redaction and comparator tests passed. The diagnostic logger intentionally does not emit a raw exception string or raw traceback because those may contain URLs, credentials, or server-provided sensitive text. The supplied production log is still insufficient to recover its SQLSTATE and failed statement.

## Application and dashboard checks

Tests used only temporary local SQLite data and a loopback Uvicorn process:

- Uvicorn started independently of the migration runner; `/health` returned healthy.
- `/api/v1/auth/me` and `/api/v1/dashboard` were present in OpenAPI.
- An invalid token sent to `/api/v1/auth/me` returned HTTP 401.
- The existing authorized-student versioned dashboard test passed, as did the current-user session/auth test.
- Of the seven selected auth/dashboard tests, five passed and two Neon identity tests failed: one expected a `Profile` row that was not created; the other test's registration request returned 422 instead of its expected 201. These failures are in the newly present Neon-auth worktree and are reported, not changed here.

Normal FastAPI lifespan code performs the platform-admin bootstrap when configured; it does not run Alembic. `/health` is lightweight and does not check the database. A successful health response therefore proves process availability, not database migration readiness.

## Root-cause status

**Confirmed locally:** PostgreSQL JSON server-default comparison can raise `ProgrammingError` / `UndefinedFunction` / SQLSTATE `42883` with the exact SQL shown above. The comparison correction avoids this failure on the synthetic schema.

**Not confirmed for production:** The original logs contain no SQLSTATE, failed statement, traceback, database revision, transaction state, or deployed commit. The index message alone does not identify the failing operation. Do not state that production's exact exception is established until the deployed path is correlated with those diagnostics.

## Recommended fix and deployment gate

1. Obtain the Render deployment commit and full redacted failure context: exception classes, SQLSTATE, failed statement, revision/phase, and transaction state. Correlate with the matching Vercel/Render request and startup logs.
2. If the deployed path confirms JSON default comparison, use the JSON-aware comparison correction in this worktree. Also resolve the composite-index metadata difference explicitly without deleting the index.
3. Do not deploy the current PostgreSQL migration runner as the Render start command: it intentionally exits 1 for PostgreSQL, which prevents Uvicorn from starting.
4. Before PostgreSQL migrations are enabled, implement and validate a session-level advisory lock on the exact connection used by Alembic. Run migrations as a controlled migration job; keep application startup read-only with a schema-compatibility check. Do not bypass the runner or ignore a failed migration.
5. Validate both a fresh disposable PostgreSQL database and a disposable database at the production-reported revision/schema, then confirm one Alembic head and verify startup, health, auth, and dashboard paths.
6. Only after those gates pass should operators deploy the reviewed migration job and then the API service. No deployment command or production change is safe to recommend from the evidence currently available.

No Neon/production connection, production migration, schema stamp, deployment change, or commit/push was performed.
