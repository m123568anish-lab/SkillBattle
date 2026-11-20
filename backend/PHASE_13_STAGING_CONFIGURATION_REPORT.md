# Phase 13 — Staging Configuration and Preflight Recovery

**Review date:** 2026-11-20  
**Scope:** configuration repair and read-only preflight preparation  
**Migration execution:** not authorized and not performed

## 1. Root cause of the Phase 12 failure

Phase 12 invoked the correct command, but the process did not contain
`ENVIRONMENT=staging`. `load_staging_migration_authorization()` reads the
process environment and fails closed before any database connection or Neon
identity request.

The repository's `.env.staging.example` is a placeholder-only template. It was
not automatically loaded. Before this phase, generic local/admin files were
eligible for automatic loading, while the staging example was not. That made
the safe behavior dependent on explicit shell inheritance, but without a
clear, aggregated configuration check.

## 2. Required staging configuration

The one-off read-only preflight requires these names to be present. Values must
be supplied privately and are never printed by the validation or report:

| Variable | Purpose |
|---|---|
| `ENVIRONMENT` | Must be exactly `staging` for this operation. |
| `EXPECTED_NEON_PROJECT_ID` | Expected Neon project identity. |
| `EXPECTED_NEON_BRANCH_ID` | Expected non-default `qubira-staging` branch identity. |
| `EXPECTED_DATABASE_NAME` | Must be `neondb` for the reviewed staging target. |
| `EXPECTED_DATABASE_ROLE` | Must be `neondb_owner` for the reviewed staging target. |
| `EXPECTED_MIGRATION_REVISION` | Must be `f9a1b2c3d4e5`. |
| `NEON_API_KEY` | Read-only Neon API identity check for the one-off shell only. |
| `DATABASE_URL` | Staging application database identity, compared with the migration target before connection. |
| `MIGRATION_DATABASE_URL` | Staging-only direct, non-pooled PostgreSQL URL using the synchronous psycopg driver. |

`STAGING_MIGRATION_APPROVED` is optional for preflight and must remain unset or
false. It was not set to true in this phase. `ASYNC_DATABASE_URL` is not needed
by the one-off preflight itself, but is required when configuring the staging
API/worker and must identify the staging branch only. It is never used as the
direct migration endpoint.

The target revision is fixed by the reviewed placement migration. The validator
rejects any other target, pooled migration host, non-PostgreSQL URL, unexpected
database/role, invalid identity formats, and production-looking host/database
markers.

## 3. Configuration changes made

### Fail-closed loading behavior

[config.py](./app/core/config.py) now skips generic `.env`, `.env.local`, and
admin-file loading whenever the caller has explicitly selected
`ENVIRONMENT=staging`. Pydantic settings no longer performs a second implicit
env-file load; the repository's explicit loader remains the only local-file
loader. This prevents a staging operation from silently inheriting generic or
production-adjacent credentials.

The staging example remains documentation only. No `.env.staging` was created,
and no real secret was committed.

### Pre-connection validation

[staging_migration.py](./app/database/staging_migration.py) now exposes
`validate_staging_configuration()`. It:

- rejects any environment other than explicit `staging`;
- reports all missing variable names together, without values;
- requires both the application `DATABASE_URL` and direct migration URL;
- rejects pooled endpoints;
- rejects production-looking host/database markers;
- preserves the existing branch, endpoint, database, role, target revision,
  and approval checks.

This validation runs before `run_staging_migration()` can acquire a database
connection. It is not a substitute for the subsequent Neon API and SQL
identity checks.

### Documentation changes

[NEON_STAGING_RENDER_CONFIGURATION.md](../docs/NEON_STAGING_RENDER_CONFIGURATION.md)
now documents a preflight-only PowerShell procedure with placeholders, makes
clear that `.env.staging.example` is not auto-loaded, separates the async
application URL from the direct migration URL, and includes commands to clear
all one-off environment variables after the check. Migration-execution
instructions were removed from that procedure.

`render.yaml` was not modified. `render.staging.yaml` remains a staging-only
service template and contains no migration credentials or approval flag.

## 4. Variable consistency review

The names are now consistent across the Python authorization code,
`.env.staging.example`, and the documented PowerShell procedure:

- `ENVIRONMENT`
- `DATABASE_URL`
- `ASYNC_DATABASE_URL`
- `MIGRATION_DATABASE_URL`
- `NEON_API_KEY`
- `EXPECTED_NEON_PROJECT_ID`
- `EXPECTED_NEON_BRANCH_ID`
- `EXPECTED_DATABASE_NAME`
- `EXPECTED_DATABASE_ROLE`
- `EXPECTED_MIGRATION_REVISION`
- `STAGING_MIGRATION_APPROVED`

`render.staging.yaml` intentionally contains only long-running API/worker
values. It sets `ENVIRONMENT=staging`, `DATABASE_URL`, and
`ASYNC_DATABASE_URL`; it does not contain `MIGRATION_DATABASE_URL`,
`NEON_API_KEY`, or `STAGING_MIGRATION_APPROVED`. Those belong only to an
isolated one-off preflight shell/job.

No missing configuration can silently select production for the staging
preflight: explicit staging is required, generic env-file loading is disabled
in staging mode, and production-looking migration targets are rejected.
Successful local validation still does not prove live branch identity; the
Neon API and SQL checks remain mandatory.

## 5. Exact Windows PowerShell procedure

Use an isolated PowerShell session from `D:\BattleAI\backend`. Obtain values
from the approved staging secret manager or operator channel; do not paste
credentials into ChatGPT/Codex output or commit them.

```powershell
Set-Location D:\BattleAI\backend

$env:ENVIRONMENT = "staging"
$env:EXPECTED_NEON_PROJECT_ID = "<expected-project-id>"
$env:EXPECTED_NEON_BRANCH_ID = "<expected-qubira-staging-branch-id>"
$env:EXPECTED_DATABASE_NAME = "neondb"
$env:EXPECTED_DATABASE_ROLE = "neondb_owner"
$env:EXPECTED_MIGRATION_REVISION = "f9a1b2c3d4e5"
$env:STAGING_MIGRATION_APPROVED = "false"

$env:DATABASE_URL = "<staging-application-database-url>"
$env:ASYNC_DATABASE_URL = "<staging-async-database-url-if-required>"
$env:MIGRATION_DATABASE_URL = "<staging-direct-unpooled-migration-url>"
$env:NEON_API_KEY = "<staging-read-identity-api-key>"

python run_migrations.py --staging-preflight

Remove-Item Env:ENVIRONMENT, Env:EXPECTED_NEON_PROJECT_ID, Env:EXPECTED_NEON_BRANCH_ID, Env:EXPECTED_DATABASE_NAME, Env:EXPECTED_DATABASE_ROLE, Env:EXPECTED_MIGRATION_REVISION, Env:STAGING_MIGRATION_APPROVED, Env:DATABASE_URL, Env:ASYNC_DATABASE_URL, Env:MIGRATION_DATABASE_URL, Env:NEON_API_KEY -ErrorAction SilentlyContinue
```

The command above is the only migration-related command in this procedure. It
is read-only. Do not set approval to true and do not invoke an execution mode.

## 6. Live preflight status

The live preflight was **not rerun in Phase 13** because the private staging
variables were not present in the execution environment. The prior Phase 12
attempt failed before connection with:

```text
STAGING MIGRATION FAILED phase=authorization ... detail=Staging migrations require ENVIRONMENT=staging explicitly.
```

Therefore:

- staging identity: **unverified**;
- current staging revision: **unknown**;
- target revision: `f9a1b2c3d4e5` from repository safeguards;
- pending revisions and live placement/schema inventory: **unknown**;
- production identity: not contacted.

The exact missing configuration names are the nine required variables listed in
Section 2. The safe rerun must supply them privately and rerun only
`--staging-preflight`.

## 7. Tests and exact checks

Executed from `D:\BattleAI\backend`:

```text
python -m pytest -q tests/test_staging_migration.py tests/test_config_precedence.py tests/test_migration_database_url.py tests/migration_infrastructure/test_startup_migration_policy.py
python -m compileall -q app/core/config.py app/database/staging_migration.py run_migrations.py
git diff --check
```

Results:

- **30 passed, 0 failed**, 63 warnings.
- Python syntax compilation passed, exit code `0`.
- `git diff --check` passed, exit code `0`.
- Tests cover missing environment/identity/database settings, incorrect
  environment, production-like targets, pooled endpoints, staging-only file
  loading behavior, approval isolation, endpoint checks, and startup migration
  policy.
- PostgreSQL integration tests were not run against staging. No persistent
  database was substituted.

## 8. Remaining blockers

1. The nine required staging variables must be supplied privately in an
   isolated shell/job.
2. The Neon API must independently verify the non-default ready branch named
   `qubira-staging` and its unique direct endpoint.
3. SQL preflight must independently verify `neondb`, `neondb_owner`, public
   schema, non-replica state, current revision, absent placement objects, and
   question data counts.
4. The Phase 11 epoch 44-difference evidence gap remains a separate concern;
   this phase neither resolves nor combines it with placement readiness.
5. The known `failure_reasons` model/migration nullability discrepancy remains
   unresolved and requires a separately approved schema decision.

## 9. Safety confirmation

- No production or staging database was contacted in Phase 13.
- No migration, epoch runner, `--staging-execute`, or approval path was run.
- `STAGING_MIGRATION_APPROVED=true` was never set.
- No Render service or production configuration was modified.
- No deployment occurred.
- No credentials, URLs, tokens, or secret values were printed.
- Existing tracked and untracked worktree changes were preserved.

## 10. Files changed

- [app/core/config.py](./app/core/config.py)
- [app/database/staging_migration.py](./app/database/staging_migration.py)
- [tests/test_staging_migration.py](./tests/test_staging_migration.py)
- [NEON_STAGING_RENDER_CONFIGURATION.md](../docs/NEON_STAGING_RENDER_CONFIGURATION.md)
- [PHASE_13_STAGING_CONFIGURATION_REPORT.md](./PHASE_13_STAGING_CONFIGURATION_REPORT.md)

