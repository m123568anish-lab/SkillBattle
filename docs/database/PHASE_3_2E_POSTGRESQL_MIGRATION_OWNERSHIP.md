# Phase 3.2E — PostgreSQL Migration Ownership

## Decision

**PostgreSQL migration execution remains blocked.** The session-level ownership
mechanism and Alembic connection handoff are implemented and have focused
disposable-server evidence. The repository migration chain has not passed a
fresh-database upgrade or a supported-revision upgrade, so the ownership
implementation is not permission to run migrations.

No Neon or production database was accessed. The PostgreSQL tests used a
disposable PostgreSQL 18.6 server on loopback.

## Ownership protocol

`acquire_postgresql_migration_ownership()` in
`backend/app/database/migration_infrastructure/migration_coordinator.py`:

1. Requires a PostgreSQL SQLAlchemy URL and creates a dedicated engine using
   `NullPool`.
2. Opens one physical connection and requests a session-level
   `pg_try_advisory_lock()` using the stable two-integer key
   `(0x51554249, 0x524D4947)`.
3. Fails immediately by default if another cooperating migration owner holds
   the key. Optional bounded polling is available to the controlled caller.
4. Captures database identity and `pg_backend_pid()` in an active ownership
   lease.
5. Keeps the dedicated physical session alive across Alembic commits. The lock
   is session-scoped, so transaction commits do not release it.
6. Marks the lease inactive, rolls back any open transaction, explicitly
   unlocks, closes the connection, and disposes the `NullPool` engine on exit.
   PostgreSQL releases the session lock if the connection/process is lost.

The key is cluster-wide for this application namespace: migrations using the
same key on one PostgreSQL cluster serialize even if they target different
databases. The captured database identity (host, port, database, user) is
checked separately so Alembic cannot silently switch the target.

## Alembic same-session checks

`backend/alembic/env.py` accepts PostgreSQL online execution only when the
runner provides the active ownership object and the exact `Connection` held by
that object. It verifies:

- the ownership lease is active;
- the supplied object is the owner's exact SQLAlchemy connection;
- the engine pool is `NullPool`;
- the SQLAlchemy URL's database identity matches the lease and configured
  application URL; and
- `pg_backend_pid()` is unchanged.

Offline Alembic execution remains blocked. Direct online Alembic execution
without a runner-provided lease remains blocked.

## Runner authorization and current execution gate

`backend/run_migrations.py` requires an explicit `--execute` flag. Without it,
the process exits with status 2 before invoking migration logic. This is tested
with a disposable SQLite URL and asserts that no database file is created.

Even with `--execute`, PostgreSQL currently fails closed in
`require_supported_migration_dialect()` before acquiring the lock or executing
DDL. This temporary gate remains until both fresh-database and supported-revision
upgrade tests succeed. SQLite retains its separate maintenance-verifier and
verified-backup requirements.

## Test evidence

On disposable PostgreSQL 18.6, all six tests in
`backend/tests/migration_infrastructure/test_postgresql_migration_coordinator.py`
passed:

- a competing owner is refused while the first owner holds the advisory lock;
- the lock is reacquirable after normal exit and exceptional exit;
- a different SQLAlchemy connection cannot be substituted;
- a synthetic Alembic revision observes the backend PID of the owner
  connection;
- JSON server-default comparison and non-destructive index adoption checks
  pass; and
- server-session termination releases the advisory lock.

These are coordination tests. They do not prove a successful upgrade of the
repository's complete revision graph, transactional rollback of its DDL, or
schema compatibility with the production database.

## Migration compatibility blocker

A disposable PostgreSQL 18.6 fresh-database attempt exposed unsafe assumptions
in the historical root revision `dd495117949b`: it contains unguarded
`drop_table`/`drop_index` operations for tables expected to pre-exist and
alters an assumed `users` table. The current runner's read-only pending-state
preflight rejects this empty schema before DDL; the disposable database
remained empty. Historical revisions were not edited.

No migration was run against a database representing the production revision.
No production revision was stamped or inspected. A safe baseline/upgrade
strategy must be designed and approved without rewriting applied history.

## Required gates before activation

1. Review and approve a fresh-database strategy that preserves historical
   revision files and does not stamp an unverified schema.
2. Run the entire graph against a fresh disposable PostgreSQL database of a
   known major version.
3. Run an upgrade from each supported existing revision/schema using a
   disposable, schema-faithful database; verify data, indexes, constraints,
   revision state, and model comparison.
4. Prove runner-level ownership remains held through preflight, Alembic
   execution, postflight, and validation; test lock release after failure and
   connection loss.
5. Keep API startup read-only. Move migrations to a separate, explicitly
   authorized one-off job only after those gates pass.

`render.yaml` was not changed. Its current command does not pass `--execute` and
would exit 2 with this worktree before Uvicorn starts. The deployed commit and
Render command remain unverified.
