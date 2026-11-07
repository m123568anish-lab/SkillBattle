# Supabase Session Pooler Authentication Root-Cause Report

Updated: 2026-11-07

## Dashboard settings and local URI comparison

The owner-provided Supabase Connect screenshot confirms Session Pooler mode and these non-secret settings:

- Host: `aws-0-ap-northeast-2.pooler.supabase.com`
- Port: `5432`
- Database: `postgres`
- Username: `postgres.zdpsncnbavuszdcpflje`
- Project reference: `zdpsncnbavuszdcpflje`

The current `backend/.env.migration` URL was parsed locally without printing the URL or password. Its scheme is `postgresql`; host, port, database, and username match the screenshot. The username as text before SQLAlchemy parsing matches the parsed SQLAlchemy username.

The probe reads this dedicated env file directly. Its configured expected Session Pooler endpoint and project-scoped username guards passed. The probe explicitly supplies `host`, `port`, `dbname`, and `user` to Psycopg2, and requires `sslmode=require`.

## Password and URL handling

- The local URL contains a password component, and SQLAlchemy returns a non-empty parsed password.
- The parsed password matches one percent-decoding of the URL password component.
- The password has no edge whitespace, and no unencoded reserved characters from the checked set (`@:/?#[]`) were present in its URL password component.
- Canonical re-encoding differs from the original password component. Percent escapes are case-insensitive and URL encoders may use different valid representations; this difference alone does not establish a malformed URL or double-encoding.
- The parsed password is passed directly to Psycopg2 as the explicit `password` keyword argument; it is not reconstructed or decoded again in the probe.
- The password was not printed, changed, reset, guessed, or copied into this report.

**Whether the local password is the current Supabase database password cannot be verified offline.** The screenshot confirms connection settings, not the current secret value or its acceptance by Supabase. Verifying that requires an authorized authentication attempt or an authoritative secret update/confirmation through Supabase.

## Username mismatch investigation

The prior authorized read-only attempt returned:

`FATAL: password authentication failed for user "postgres"`

This error text does not, by itself, prove that the client changed its username. Source review and local-only runtime checks found:

1. The URL username is `postgres.zdpsncnbavuszdcpflje`.
2. SQLAlchemy `make_url` returns `postgres.zdpsncnbavuszdcpflje`.
3. `psycopg2_connection_arguments()` puts that exact value in the explicit `user` keyword.
4. `connect_to_pooler()` invokes `psycopg2.connect(**arguments)` with that keyword; there is no fallback to bare `postgres`.
5. The host and port passed in the same argument mapping match the dashboard values.
6. The probe does not use a process-level `SUPABASE_DATABASE_URL` or reconstruct a URL. An explicit Psycopg2 `user` argument is provided, so libpq's `PGUSER` default is not used as a fallback.
7. `PGUSER` was unset during the prior local config-only inspection. A mocked offline driver test also set `PGUSER=postgres` and verified that the explicit `user` passed to Psycopg2 remained project-scoped.

The probe's source therefore does not explain the error's bare `postgres` text as a Python-side username substitution. The diagnostic may reflect how the pooler/server formats or normalizes an authentication principal, or may have another server-side explanation; there is not enough evidence to identify which. Do not change the username based on that message alone.

## Pooler mode and connection-path details

- The dashboard screenshot identifies the selected mode as **Session Pooler**; the configured hostname has the Supabase pooler form.
- The probe uses the dashboard's Session Pooler endpoint and port; it does not switch to a direct connection or transaction pooler.
- The probe forces TLS with `sslmode=require`. The previous failure occurred before a session was established, so it did not confirm an SSL session.
- The separate `10_inspect_supabase_target.py` loader allows existing process environment variables to override values loaded from `.env.migration`, then parses the selected URL and passes the original URL to SQLAlchemy `create_engine`. It validates the parsed username against the project reference. The standalone probe instead reads the dedicated file directly.
- `common.py` provides migration utilities and backend import-path setup; it does not load or transform the Supabase username.

## Static validation

- Local, no-connection URL inspection confirmed `postgresql` scheme, exact dashboard host/port/database/username, non-empty parsed password, one-layer decoding, and expected endpoint shape. The password itself was not emitted.
- The probe's `--validate-config-only` path previously showed URL, parsed, and Psycopg2 usernames all matching, and made no connection.
- `backend/tests/test_supabase_pooler_diagnostics.py`: **5 passed**; includes mocked verification of the exact username, host, port, and SSL arguments, even with `PGUSER=postgres`.
- Python compilation passed for the probe, inspector, common utilities, and tests.
- `backend/.env.migration` is Git-ignored.
- No live connection was made during this investigation.

## Assessment and remaining uncertainty

The dashboard's non-secret settings and local connection URI structure agree. SQLAlchemy URL parsing and Python's Psycopg2 argument construction preserve the expected project-scoped username and pooler host. No local override or fallback to bare `postgres` was found.

The prior server message establishes that authentication was rejected and that the emitted diagnostic names `postgres`; it does not establish that the client sent `postgres`. The exact current password and the pooler/server's interpretation or presentation of the role remain unverified. Database identity, PostgreSQL version, SSL session status, schema inventory, and target emptiness also remain unverified because authentication failed.

## Safest next action

Keep the confirmed host, username, port, and database unchanged. Do not reset or guess the password. Since no live attempt is authorized in this request, the next safe step is to verify the database password through the Supabase dashboard's supported secret-management flow. If authentication testing is needed afterward, obtain explicit authorization for one read-only attempt. Do not deploy the schema until a successful connection verifies target identity and emptiness.

## Safety

- No live connection attempt, password reset, credential guessing, DDL, Alembic upgrade, data import, Auth operation, or production configuration change was performed for this update.
- SQLite and Neon data were not read or modified.
