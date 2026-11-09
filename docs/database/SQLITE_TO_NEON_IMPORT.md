# SQLite to Neon data transfer

The populated source is `skillbattle.db` at the repository root. The importer
copies every modeled application table, preserves primary keys and relationships,
converts SQLite JSON/date/boolean values for PostgreSQL, and resets generated
sequences. It refuses to write unless the target application tables are empty.
Neon's `neon_auth` schema is not part of the application model and is never
copied or modified.

## Validate and import to the validation branch

From `backend` in PowerShell, set the validation branch's **direct** URL without
printing it:

```powershell
$env:MIGRATION_DATABASE_URL = (neon connection-string br-flat-grass-axzx5kta `
  --project-id green-cake-01021519 --database-name neondb | Out-String).Trim()
```

Run a read-only preflight first:

```powershell
python scripts\import_sqlite_to_postgres.py `
  --source ..\skillbattle.db `
  --target-branch-id br-flat-grass-axzx5kta
```

Only after reviewing the preflight, add `--environment validation --apply` to
perform the transactional import. The command reports table counts, not user
records or credentials.

## Runtime and migration connections

For Render, set `DATABASE_URL` to Neon's pooled URL for web requests and
`MIGRATION_DATABASE_URL` to the direct, unpooled URL for schema changes. The
backend derives its async runtime URL from `DATABASE_URL`. The migration runner
requires explicit execution and refuses a pooled migration URL. `render.yaml`
now runs that explicit migration command and declares the direct migration URL
as a required dashboard setting. Updating deployed environment values is still
a separate deployment action.

Production is a separate operation. The importer requires both
`--environment production` and `--allow-production` for a production import.
Do not use those flags until the validation branch has passed and production
rollout has been explicitly approved.

## Validation and rollout status

The existing-schema migration and import passed on the validation branch:
77 tables and 14,939 rows were verified, with no row-count or schema drift.
Application writes through the pooled Neon URL passed a write/read/delete
check.

An empty PostgreSQL database bootstrapped successfully from the current ORM
metadata, was stamped at the current Alembic head transactionally, and passed
schema preflight. The temporary database was deleted.

With explicit approval, production was migrated to `d1f5a8e7c2b4` and imported.
All 77 modeled tables and 14,939 rows match the SQLite source; schema preflight
reports zero differences and all PostgreSQL foreign keys are validated. The
1,702 legacy refresh-token rows were included. Neon Auth remains separate; its
existing user and session records were not modified.

`render.yaml` now declares the migration command and direct migration URL, but
Render's deployed environment and service were not changed. To route live site
reads and writes to Neon, configure Render's `DATABASE_URL` with the pooled
production URL and `MIGRATION_DATABASE_URL` with the direct production URL, then
deploy the backend.
