# Phase 3A — Supabase Target Inspection

Inspection generated: 2026-11-05T16:28:26Z

## Status: FAILED — read-only connection authentication

One read-only connection attempt was made after the owner confirmed that the credential source had been verified. Authentication failed. No further attempt was made. No DDL, migrations, data imports, or production changes were performed.

## Local configuration checks

- Environment file: `backend/.env.migration`
- Process-level `SUPABASE_DATABASE_URL` override: none; the inspection script reads the local env file.
- Git-ignore status: confirmed.
- SQLAlchemy URL parsing: passed.
- Configured pooler host, port, database, project-scoped username, project reference, and approved revision: match the expected values.
- Password was present, remained local, and was not printed or included in this report.
- Parsed password had no edge whitespace or residual `%XX` escape token. Percent-escape syntax and one-layer URL decoding/encoding round-trip passed. These checks do not prove which password is current in Supabase.
- SQLAlchemy receives the same parsed username and password as the URL parser; masked URL rendering hides the password.

## Connection diagnostics

- Result: failed with SQLAlchemy `OperationalError`, classified as an authentication failure.
- PostgreSQL SQLSTATE: unavailable; the captured exception exposed no SQLSTATE.
- No raw driver error text was retained in the report or terminal output.
- DNS resolution: succeeded.
- Session Pooler endpoint and configured username match the supplied project reference.
- Connected user and server identity: not verified.
- PostgreSQL version and connected database: not retrieved.
- SSL: not established. The URL has no `sslmode` parameter; the effective installed driver is Psycopg2 2.9.12, whose libpq default is `sslmode=prefer`.
- No more connection attempts will be made as part of this diagnostic.

## Target inventory

- Schemas: not inspected.
- Existing application or Supabase-managed objects: not inspected.
- Auth schema/tables: not inspected.
- Alembic metadata: not inspected.
- Target emptiness: not confirmed.

## Local migration readiness

- Repository Alembic head: `47292a2a50d2`
- Approved revision: `47292a2a50d2`
- Exactly one repository head: confirmed.
- SQLAlchemy model registry: import passed; 77 registered application tables match the migration inventory.
- Required BattleRoom fields: present.
- Model/migration table inventory discrepancies: none found.

## Diagnostic assessment and recommendation

The local loader, endpoint parsing, and password encoding checks passed. SQLAlchemy resolves the configured PostgreSQL URL scheme to Psycopg2, even though the backend requirements also declare Psycopg 3. No evidence from local parsing identifies truncation or double-encoding. Authentication failure indicates the server did not accept the credentials, but local inspection cannot determine whether a reset completed or whether the local password matches the current Supabase database password. The driver did not provide an SQLSTATE, so no more specific sanitized server error is available.

Verify the current database password and connection details in the Supabase dashboard. Any further connection attempt requires a separate explicit request. Do not deploy the schema until a successful read-only inspection verifies the connected project and confirms the target state.

## Safety confirmation

- No Alembic upgrade or schema-changing SQL was run.
- No SQLite or Neon data was read or modified for this inspection.
- No Supabase Auth data was queried or imported.
- No Clerk, Render, or Vercel settings were changed.
- Schema deployment approval: **NOT GRANTED**.
