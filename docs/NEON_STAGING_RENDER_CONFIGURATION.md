# Qubira staging database and Render configuration

This guide prepares an isolated staging deployment without changing the live `production` Neon branch or the `skillbattle-backend` Render service.

## Target topology

| Component | Staging target |
|---|---|
| Neon project | SkillBattle |
| Neon branch | `qubira-staging` (child of `production`) |
| Database | `neondb` |
| Role | `neondb_owner` |
| API | `qubira-staging-api` |
| Worker | `qubira-placement-worker-staging` |
| Worker command | `python -m app.workers.placement_job_worker` |

The Render blueprint is [render.staging.yaml](../render.staging.yaml). The production blueprint [render.yaml](../render.yaml) is intentionally unchanged by this staging preparation.

## Connection semantics derived from the application

- `DATABASE_URL` feeds the synchronous SQLAlchemy engine and startup/readiness code. It accepts a normal SQLAlchemy PostgreSQL URL and is converted to the psycopg dialect by the application.
- `ASYNC_DATABASE_URL` feeds the FastAPI and worker async engine. Use `postgresql+asyncpg://...`; the application normalizes plain `postgresql://` values, but supplying the async dialect directly avoids ambiguity.
- `MIGRATION_DATABASE_URL` is used only by [alembic/env.py](../backend/alembic/env.py) and the one-off migration runner. It must be a direct, unpooled Neon URL. The migration guard rejects a `-pooler` host and requires a dedicated `NullPool` migration connection.
- `sslmode=require` is converted to the asyncpg `ssl=require` parameter by `normalize_async_database_url` in [config.py](../backend/app/core/config.py).
- The API and worker must receive the same staging `DATABASE_URL` and `ASYNC_DATABASE_URL` values. Do not give the long-running services `MIGRATION_DATABASE_URL`, the Neon management API key, or the migration approval flag. Supply the direct migration URL only to an isolated one-off migration shell/job.

Use [backend/.env.staging.example](../backend/.env.staging.example) as the placeholder checklist. It contains no credentials or hostnames.

## Render setup sequence

1. In Render, create a separate blueprint/service group from `render.staging.yaml`.
2. Enter `sync: false` values manually for the `qubira-staging` branch only.
3. Use a new staging `SECRET_KEY`; do not copy the production secret.
4. Set `ALLOWED_ORIGINS` only to the approved staging frontend origins.
5. Leave `RESEND_API_KEY`, `SMTP_HOST`, `SMTP_USERNAME`, and `SMTP_PASSWORD` empty. The blueprint uses a non-deliverable staging sender address.
6. Configure an approved staging AI provider. Do not copy production AI credentials blindly.
7. Confirm both services show `ENVIRONMENT=staging` and the worker name is `qubira-placement-worker-staging`.
8. Keep `autoDeploy: false` until the staging connection and migration checks have been explicitly reviewed.

## Migration safety procedure

The placement migration is the legacy Alembic revision
`f9a1b2c3d4e5`, directly after `d1f5a8e7c2b4`. The normal API and worker
must not run migrations at startup. Do not place migration approval or the
Neon API key in either long-running service.

Run the following only in an isolated one-off staging shell/job for the
read-only preflight. Supply the staging `DATABASE_URL`, direct
`MIGRATION_DATABASE_URL`, and `NEON_API_KEY` privately through the environment
or secret manager; never put credentials in command history. The
`.env.staging.example` file is a placeholder and is not loaded automatically.

```powershell
Set-Location backend
$env:ENVIRONMENT = "staging"
$env:EXPECTED_NEON_PROJECT_ID = "<expected-project-id>"
$env:EXPECTED_NEON_BRANCH_ID = "<expected-qubira-staging-branch-id>"
$env:EXPECTED_DATABASE_NAME = "neondb"
$env:EXPECTED_DATABASE_ROLE = "neondb_owner"
$env:EXPECTED_CURRENT_MIGRATION_REVISION = "d1f5a8e7c2b4"
$env:TARGET_MIGRATION_REVISION = "f9a1b2c3d4e5"
$env:STAGING_MIGRATION_APPROVED = "false"

# Set these three values privately in the shell or approved secret manager.
# Do not paste them into ChatGPT/Codex output or commit them.
$env:DATABASE_URL = "<staging-application-database-url>"
$env:ASYNC_DATABASE_URL = "<staging-async-database-url-if-required-by-the-shell>"
$env:MIGRATION_DATABASE_URL = "<staging-direct-unpooled-migration-url>"
$env:NEON_API_KEY = "<staging-read-identity-api-key>"

python run_migrations.py --staging-preflight

# Clear every one-off value after the preflight, including secrets.
Remove-Item Env:ENVIRONMENT, Env:EXPECTED_NEON_PROJECT_ID, Env:EXPECTED_NEON_BRANCH_ID, Env:EXPECTED_DATABASE_NAME, Env:EXPECTED_DATABASE_ROLE, Env:EXPECTED_CURRENT_MIGRATION_REVISION, Env:TARGET_MIGRATION_REVISION, Env:EXPECTED_MIGRATION_REVISION, Env:STAGING_MIGRATION_APPROVED, Env:DATABASE_URL, Env:ASYNC_DATABASE_URL, Env:MIGRATION_DATABASE_URL, Env:NEON_API_KEY -ErrorAction SilentlyContinue
```

### Revision variable contract

- `EXPECTED_CURRENT_MIGRATION_REVISION` is the expected revision already
  recorded in the staging database. Phase 12 documented
  `d1f5a8e7c2b4` as a historical expectation, but did not verify the live
  revision. A future preflight must compare the connected database's actual
  revision with this value; it must not infer current state from this report.
- `TARGET_MIGRATION_REVISION` is the intended migration graph target and must
  be `f9a1b2c3d4e5`. The local graph check verifies it exists, is the sole
  legacy head, and is the direct child of the expected current revision before
  any Neon API or database access.
- The legacy `EXPECTED_MIGRATION_REVISION` name is rejected whenever it has a
  non-empty value. It is ambiguous because earlier code treated it as the
  target while the Phase 12 report used the value as the expected current
  revision. It must not be silently mapped to either new variable.

`ASYNC_DATABASE_URL` is not needed by the one-off preflight itself, but it is
shown for completeness when the same shell is also used to inspect staging
application configuration. It must identify the staging branch only. The
preflight migration connection is always the separate direct
`MIGRATION_DATABASE_URL`.

The read-only preflight requires all of the following before it connects:

- `ENVIRONMENT=staging`, the expected Neon project and branch IDs, database
  name/role, and exact migration target.
- A Neon API identity check confirming the branch is named
  `qubira-staging`, is ready and non-default, and that the configured direct
  host is its unique read-write endpoint.
- A direct, unpooled PostgreSQL URL whose connected database and role match
  the expected identity.
- The actual current revision must equal
  `EXPECTED_CURRENT_MIGRATION_REVISION`; the repository graph must have the
  single target head `TARGET_MIGRATION_REVISION=f9a1b2c3d4e5`, expected legacy
  question columns, and no existing placement tables or provenance columns.
- A read-only count of legacy question types grouped by active and validation
  state, plus a static check that the target `upgrade()` contains no drop,
  truncate, or delete operation. The report also identifies destructive
  operations in `downgrade()`; the current downgrade drops placement tables,
  indexes, and added question columns.

Review the non-secret JSON preflight report and stop. This guide intentionally
does not provide migration-execution instructions. A separate approved change
control process must define any future execution procedure; this preflight does
not authorize or perform it.

### Disposable PostgreSQL test

Before staging execution, configure `QUBIRA_TEST_POSTGRESQL_URL` to a
disposable loopback PostgreSQL database whose name begins `qubira_test_`, then
run from `backend`:

```powershell
python -m pytest tests/migration_infrastructure/test_placement_migration_postgresql.py -q
```

This test executes the actual placement migration artifact and its downgrade
against PostgreSQL, checking preservation of synthetic legacy question data,
type/status backfills, and creation/removal of placement objects. It does not
connect to Neon.

The general pytest database harness ignores ambient `DATABASE_URL` and
`ASYNC_DATABASE_URL` values and creates temporary SQLite by default. An
explicit disposable test database may be selected with
`QUBIRA_TEST_DATABASE_URL` and, if needed,
`QUBIRA_TEST_ASYNC_DATABASE_URL`; the harness applies its loopback/disposable
target checks. Never use staging or production credentials for these values.

### Rollback limitations and production protections

The migration's `downgrade()` drops placement tables and all added question
provenance columns; any data written to those structures after upgrade would
be lost. Do not use downgrade as an automatic rollback. Stop writes and use a
separately reviewed recovery plan/snapshot appropriate to the staging branch.

The staging path rejects the default/production branch, any branch not named
`qubira-staging`, pooled endpoints, unexpected project/branch/database/role
identities, and any revision other than the reviewed predecessor. It refuses
legacy migration if epoch-control objects exist and never invokes the epoch
lineage. The existing generic runner remains restricted to SQLite and the
explicit disposable PostgreSQL test mode. Never use `create_all()`, stamp
revisions, reset/truncate the branch, activate production epoch migrations,
or run this command against production.

## Current verification status

- Configuration source audit: completed locally.
- Staging files: prepared with placeholders only.
- Staging branch/database identity was previously verified read-only; this
  migration implementation re-verifies it immediately before any execution.
- Render service creation/configuration: not executed.
- Migration: not executed; staging approval remains a manual one-off step.
- Focused staging/migration suite: 24 passed, 63 warnings; it includes two
  disposable PostgreSQL 18.6 migration/preflight tests.
- Production branch/service: not contacted or modified.
