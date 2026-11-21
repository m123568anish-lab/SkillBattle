# Qubira Render 44 Schema Differences Incident Report

**Assessment date:** 2026-11-21  
**Scope:** Local repository inspection, sanitized incident evidence, and disposable/local tests only.  
**Production status:** Not accessed or modified. No Neon SQL, migration, reset, stamp, deployment, or environment change was performed.

## Executive finding

The supplied failure is a real fail-closed startup result, not evidence that the application repaired the database:

```text
PostgreSQL schema preflight failed (revision='d1f5a8e7c2b4', schema_differences=44, state_errors=[]). Automatic schema creation and repair are disabled; use the authorized migration coordinator.
```

The strongest evidence-backed root cause is migration-version skew:

- The local repository has one legacy Alembic head: `f9a1b2c3d4e5`.
- `f9a1b2c3d4e5` directly follows the incident revision `d1f5a8e7c2b4`.
- That revision adds three placement tables, 17 `questions` columns, and their indexes/uniqueness requirements.
- Therefore a database reporting `d1f5a8e7c2b4` is behind this checkout's repository head and cannot be eligible for the current application without the reviewed forward migration.

The exact 44 observed comparator records are **not recoverable from the supplied log**. The log contains only a count; this checkout has no authorized production schema snapshot or comparator payload. It is therefore not valid to claim that all 44 are missing objects, or that all 44 are caused by `f9a1b2c3d4e5`. The incident remains **NEEDS AUTHORIZED EVIDENCE**, not fixed.

## Startup call path

1. Render starts Uvicorn from [`render.yaml`](../../render.yaml).
2. FastAPI enters the lifespan in [`main.py`](../../backend/app/main.py:63).
3. Lifespan calls [`ensure_database_compatibility()`](../../backend/app/database/init_db.py:225).
4. For PostgreSQL, the function calls [`build_preflight_report()`](../../backend/app/database/migration_preflight.py:407), unless epoch mode is configured.
5. Preflight opens a separate `NullPool` engine, executes `SET TRANSACTION READ ONLY`, reads `alembic_version`, checks the repository graph, and runs Alembic `compare_metadata` against the imported SQLAlchemy metadata.
6. Eligibility requires no state errors, the repository's single head, no missing applied tables, no table conflicts, and zero schema differences.
7. The failed report is raised as a `RuntimeError` at [`init_db.py`](../../backend/app/database/init_db.py:243), so Uvicorn startup terminates. No schema write occurs.

The application deliberately separates probes: `/health` and `/live` are liveness endpoints; `/ready` and `/health/db` return `503` when the database is incompatible. A failed lifespan currently prevents all routes from being served, which is fail-closed but means Render's liveness endpoint cannot report a process that has deliberately refused startup.

## Revision and deployment evidence

| Evidence | Result |
|---|---|
| `git rev-parse HEAD` | `60d1fcd2f01fb41df46e24b77fc026a09e8088d6` |
| `git rev-parse origin/main` | Same commit as local `HEAD` |
| Local legacy Alembic head | `f9a1b2c3d4e5` |
| `f9a1b2c3d4e5` parent | `d1f5a8e7c2b4` |
| Render-reported database revision | `d1f5a8e7c2b4` |
| Render deployed commit | **Unknown; not exposed by the supplied log** |
| Working tree | Dirty with unrelated pre-existing security/UI edits; those edits were not treated as deployed |

The local repository therefore proves the database revision is an ancestor, not the current head. It does not prove whether Render is running this commit, an older commit, or a different service command. The deployment commit must be obtained from Render by an authorized operator.

## Difference report

### Observed production differences

The only production comparator evidence supplied is `schema_differences=44`. No individual operation, schema, table, column, index, constraint, expected definition, or observed definition was supplied. All 44 records are consequently **NOT CLASSIFIED / EVIDENCE REQUIRED**, not silently marked as missing.

| Required classification | Observed count | Status | Evidence needed |
|---|---:|---|---|
| Missing table | Unknown | NOT TESTED | Redacted `schema_differences` payload or schema-only dump |
| Extra table | Unknown | NOT TESTED | Same |
| Missing column | Unknown | NOT TESTED | Same |
| Incorrect column type | Unknown | NOT TESTED | Same |
| Incorrect nullability/default | Unknown | NOT TESTED | Same |
| Missing index | Unknown | NOT TESTED | Same, including index definition |
| Incorrect index | Unknown | NOT TESTED | Same |
| Missing constraint | Unknown | NOT TESTED | Same |
| Incorrect foreign key | Unknown | NOT TESTED | Same |
| Missing sequence | Unknown | NOT TESTED | PostgreSQL schema-only catalog evidence |
| Missing view/materialized view | Unknown | NOT TESTED | PostgreSQL schema-only catalog evidence |
| Missing trigger | Unknown | NOT TESTED | PostgreSQL schema-only catalog evidence |
| PostgreSQL catalog mismatch | Unknown | NOT TESTED | Catalog query output and server version |
| Comparison/canonicalization false positive | Unknown | NOT TESTED | Comparator payload plus reproducible fixture |
| Unknown | 44 aggregate only | BLOCKED | Authorized evidence required |

### Expected forward delta (not claimed as observed)

The migration immediately after the reported revision proposes the following objects. These are a hypothesis for the 44 count, not a production finding:

- `placement_jobs`, `placement_source_records`, and `placement_inventory_targets` tables.
- 17 provenance/lifecycle columns on `questions`.
- Placement table indexes and question provenance indexes defined by [`f9a1b2c3d4e5`](../../backend/alembic/versions/f9a1b2c3d4e5_add_placement_jobs_and_question_provenance.py).
- Unique requirements on placement job idempotency and source URL.

The migration contains no evidence that the physical production schema is otherwise exactly equal to `d1f5a8e7c2b4`, so the remaining count cannot be assigned safely.

## Comparator review

The comparator is read-only for PostgreSQL and does not execute Alembic DDL. It compares current `Base.metadata`, not a historical metadata snapshot for `d1f5a8e7c2b4`. That distinction matters: a database at an older valid revision can show many model drift records even when its historical migration state is internally consistent.

The comparator also depends on the connection's default schema/search path because `compare_metadata` is used without `include_schemas=True`. The current report does not expose the inspected schema/search path. A non-`public` deployment or altered `search_path` therefore remains an unresolved comparison-risk until catalog evidence is collected.

The manifest implementation separately records PostgreSQL catalog objects, but the failing legacy path uses Alembic model comparison rather than the full manifest comparison. Unsupported or unstable catalog properties cannot be inferred from the count.

## Safe code change made

The fail-closed behavior was preserved. [`ensure_database_compatibility()`](../../backend/app/database/init_db.py:243) now includes sanitized diagnostic context in the exception:

- current revision and repository head;
- missing applied tables and pending conflicts;
- up to 20 operation/schema/table/object summaries;
- an explicit remainder count.

No URL, credential, SQL parameter, row data, or secret is logged. This is an observability correction, not a migration or compatibility waiver.

Regression coverage was added in [`test_schema_compatibility.py`](../../backend/tests/test_schema_compatibility.py:109) to ensure revision and difference context is present without sensitive text.

## Tests and exact results

Environment checks:

- Python: 3.11.9.
- Docker daemon: unavailable in this workspace; no disposable PostgreSQL 18.6 container could be started.
- `psql`/`pg_isready`: unavailable.
- No production or Neon URL was opened.

Commands:

```text
cd backend
pytest -q tests/test_migration_preflight.py tests/test_schema_compatibility.py tests/migration_infrastructure/test_schema_manifest.py tests/api/test_health_readiness.py tests/api/test_database_health.py
```

Result: **34 passed, 63 warnings, exit code 0**.

Full backend regression command:

```text
cd backend
pytest -q
```

Result: **352 passed, 4 failed, 18 skipped, 73 warnings, exit code 1**. The failures were:

- `tests/api/test_account_deletion_and_avatar.py::test_avatar_upload_and_delete`: the current dirty-worktree security changes call `validate_image_file(..., max_size_bytes=...)`, but the installed helper signature does not accept that keyword. This is outside the schema incident and was not changed.
- Three `tests/migration_infrastructure/test_postgresql_compatibility_harness.py` tests: their synthetic profile targets pre-current-head metadata, so the loader correctly rejects them with `Schema profile target is not the current single Alembic head.` This is consistent with the revision-drift finding and remains a separate fixture-maintenance task.

```text
git diff --check
```

Result: **exit code 0**. Git emitted only line-ending warnings from the already-dirty worktree.

The focused tests cover read-only preflight behavior, schema-difference formatting, revision checks, manifest stability, readiness status, and the new diagnostic context. PostgreSQL 18.6 execution is **NOT TESTED** because the required disposable server is unavailable; no SQLite result is being promoted to PostgreSQL evidence.

## Application startup decision

Do not make an incompatible database appear ready and do not remove the lifespan preflight. The current fail-closed startup is operationally strict. A future operational improvement may run the process with liveness available while keeping `/ready` at `503`, but that must be designed so no database-dependent endpoint is served before compatibility is verified. It is outside this incident's safe evidence boundary.

## Root cause status

| Finding | Status |
|---|---|
| Reported revision is behind this checkout's Alembic head | **CONFIRMED locally** |
| `f9a1b2c3d4e5` is the required next migration in this checkout | **CONFIRMED locally** |
| All 44 differences are exactly the `f9a1` delta | **UNPROVEN** |
| Historical migration partially failed | **UNPROVEN** |
| Manual production schema changes occurred | **UNPROVEN** |
| Wrong schema/search path was inspected | **UNPROVEN** |
| Render deployed commit equals local `HEAD` | **UNPROVEN** |
| PostgreSQL 18.6 comparator has no additional false positive in this incident | **NOT TESTED** |

## Authorized operator procedure

An operator with approved read-only access should run the following against the affected database, save the redacted output, and provide it to the migration owner. Do not include connection strings, passwords, row data, or full application secrets.

```sql
SELECT current_database(), current_user, current_schema(),
       current_setting('search_path'), version();
SELECT version_num FROM public.alembic_version;
SELECT schemaname, tablename, tableowner
FROM pg_catalog.pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY schemaname, tablename;
```

The application-side diagnostic must be run with the deployed commit and its normal read-only settings so the resulting `difference_summary` can be correlated. The operator must also record the Render commit SHA and confirm that the database URL points to the intended database/schema without disclosing its value.

Only after those records are reviewed should a disposable PostgreSQL 18.6 clone be built at the reported revision and compared against the candidate forward migration. No production migration is authorized by this report.

## Remaining remediation requirements

1. Obtain the redacted 44-record comparator payload and deployment SHA.
2. Compare the payload with the `f9a1` migration object-by-object.
3. If the payload is exactly the reviewed forward delta, execute that migration only through the authorized coordinator against an approved non-production clone first.
4. If objects differ, classify each record and prepare a reviewed forward migration or comparator correction; do not stamp or bypass preflight.
5. Run PostgreSQL 18.6 disposable fresh and supported-revision tests before any production decision.

**Final assessment:** **BLOCKED / NEEDS SIGNOFF.** The revision skew is established, the exact 44 differences are not. The incident is not declared fixed, and production remains untouched.
