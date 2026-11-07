# Phase 3.2A — Isolated Migration Infrastructure Report

## 1. Executive summary

Implemented and tested a Windows-first, cross-process SQLite sidecar-lock
primitive, an async-compatible acquisition API, epoch control-object presence
guards, and a deterministic schema-manifest generator/comparator. Added an
inactive, separate Alembic epoch scaffold with no revisions and a fail-closed
environment guard.

All behavior tests used temporary disposable SQLite databases. No connection
was made to the original local database, Neon, Render, Supabase, or another
configured application database. No migration was executed, and the historical
Alembic files and application startup/entrypoint were not changed.

**Important incomplete integration gate:** no application engine, session
factory, background job, legacy runner, or maintenance script currently acquires
the new lock. This is intentional for this isolated stage, but it means the
sidecar lock does not yet protect the Qubira application or a real migration
transition. External/raw database clients can still bypass it. Phase 3.2A does
not authorize a migration or production activation.

## 2. Scope, evidence, and safety

### Confirmed in this phase

- Repository searches and source reads were static; no environment-file values
  were read.
- `backend/app/models` metadata was imported only to enumerate model declarations.
  No engine was created by that inspection snippet and no DBAPI connection was
  opened.
- Migration source files were parsed as Python AST to count operation calls;
  none were imported or executed.
- The legacy graph has 26 revision files and one head, `47292a2a50d2`. The
  isolated scaffold test independently asserts that single legacy head and an
  empty new epoch.
- The test run used Python 3.14.4, SQLite 3.50.4, SQLAlchemy 2.0.51, and
  aiosqlite 0.22.1.
- Docker, PostgreSQL server binaries, and `psql` were unavailable.

### Not verified

- No application database schema, data, revision state, or preservation counts
  were read during this phase.
- No PostgreSQL dialect behavior, server version, advisory lock, or migration
  compatibility was tested.
- No POSIX lock implementation exists.
- No production deployment build or application startup was run.

## 3. Files created

- `backend/app/database/migration_infrastructure/__init__.py`
- `backend/app/database/migration_infrastructure/sqlite_lock.py`
- `backend/app/database/migration_infrastructure/epoch_state.py`
- `backend/app/database/migration_infrastructure/schema_manifest.py`
- `backend/tests/migration_infrastructure/conftest.py`
- `backend/tests/migration_infrastructure/test_sqlite_lock.py`
- `backend/tests/migration_infrastructure/test_schema_manifest.py`
- `backend/tests/migration_infrastructure/test_epoch_scaffold.py`
- `backend/alembic_epoch.ini`
- `backend/alembic_epoch/env.py`
- `backend/alembic_epoch/script.py.mako`
- `backend/alembic_epoch/README.md`
- `backend/alembic_epoch/versions/.gitkeep`
- `docs/database/PHASE_3_2A_CONNECTION_INVENTORY.md`
- `docs/database/PHASE_3_2A_IMPLEMENTATION_REPORT.md`

No existing application file, legacy migration, dependency manifest, entrypoint,
deployment configuration, or database was changed.

## 4. SQLite lock implementation

`SQLiteFileLock` uses the Windows kernel `LockFileEx`/`UnlockFileEx` byte-range
locking APIs on a persistent sidecar file. It supports shared and exclusive
locks, bounded timeout, canonical absolute paths (including dot-segment and
resolved symlink paths), context-manager cleanup, and async acquisition through
`asyncio.to_thread()`. The lock sidecar is not deleted. PID metadata is not used
to infer lock ownership; kernel handle release governs process termination.

Supported for this initial implementation:

- Windows only.
- Windows fixed local NTFS volumes only.
- File-backed SQLite databases whose parent directory already exists.

Explicitly unsupported or not proven:

- POSIX/Linux/macOS (no implementation).
- UNC, network, mapped remote, or cross-host shared SQLite paths.
- Hard-link aliases (canonical path resolution does not unify hard links).
- Cloud-synced/virtualized folders; a local NTFS volume check alone does not
  prove their locking semantics.
- Protection against clients that bypass the sidecar lock.

The async API is available to future cooperating code, but there is no SQLAlchemy
event/session integration. Holding the helper around only some requests would
not be sufficient; all application and migration connection lifetimes must
participate before the transition lock can be relied on.

## 5. SQLite lock test evidence

**Command**

```powershell
Set-Location backend
$env:PYTHONDONTWRITEBYTECODE='1'
..\.venv\Scripts\python.exe -m pytest --confcutdir=tests\migration_infrastructure tests\migration_infrastructure -q -rs
```

**Final result:** exit code 0; 17 passed, 1 skipped.

Coverage included:

- Two independent exclusive-lock processes serialize.
- An exclusive lock waits for shared holders; shared application acquisition
  times out while a migration-style exclusive lock is held.
- Concurrent shared processes can write through SQLite without losing either
  committed test row.
- Process termination releases the kernel lock while a durable test transition
  row remains in the temporary SQLite DB.
- Fake stale PID text in the persistent sidecar does not prevent acquisition.
- A live owner is not bypassed after a bounded timeout.
- Async acquisition waits off the event loop and agrees with a separate
  synchronous process.
- SQLite `DELETE` and `WAL` journal modes both pass isolated lock/write tests.
- A direct, uncoordinated SQLite writer succeeds while the sidecar is held,
  demonstrating the documented bypass limitation.
- Epoch control-object presence combinations reject partial state.
- The new epoch scaffold has no revisions and is distinct from the legacy
  Alembic script directory.

**Skipped:** symlink alias creation was denied by Windows with
`WinError 1314` (the current user lacks the required privilege). Dot-segment
canonical path equality passed; symlink canonicalization was not verified in
this environment.

The test directory shadows the root autouse fixture and the command cuts off
ancestor `conftest.py` discovery, preventing `backend/tests/conftest.py` from
calling `init_db()` against application configuration.

Earlier focused runs exposed and resolved implementation/test issues before the
final pass: Windows `OVERLAPPED` structure binding and SQLite's omission of
inline UNIQUE constraints from SQLAlchemy's generic reflection were corrected.

## 6. Schema-manifest tooling and inspection report

`schema_manifest.py` exposes:

- `build_schema_manifest(engine, schema=None)`: read-only catalog inspection.
- `canonical_manifest_json()` and `manifest_fingerprint()`: canonical JSON and
  SHA-256, with a versioned format.
- `compare_schema_manifests()`: deterministic missing, extra, and conflicting
  object classification.

The manifest includes tables/columns/types/nullability/defaults, primary and
foreign keys/actions, unique and check constraints, indexes, views,
materialized views (PostgreSQL), triggers, sequences, and selected engine
properties. SQLite inline UNIQUE constraints are taken from `PRAGMA index_list`
because generic reflection omitted them in the tested SQLAlchemy/SQLite
versions. PostgreSQL catalog queries are implemented but untested.

Synthetic SQLite manifest tests used explicit DDL in pytest temporary
directories. **No production target manifest was generated.**

### Model/migration scope inventory (read-only)

Importing registered model metadata found 77 model-managed tables, 137 indexes,
102 foreign keys, 20 unique constraints, and no SQLAlchemy `CheckConstraint`
objects. The complete model table set is:

`achievements`, `api_request_logs`, `application_status_history`,
`assessment_attempts`, `assessment_question_submissions`, `audit_logs`,
`batches`, `battle_configs`, `battle_participants`, `battle_results`,
`battle_rooms`, `battle_submissions`, `campaign_attempts`,
`candidate_applications`, `candidate_privacy_settings`, `code_submissions`,
`college_assessment_questions`, `college_assessment_submissions`,
`college_assessments`, `college_students`, `colleges`, `companies`,
`company_interviews`, `company_members`, `company_skill_requirements`,
`conversations`, `daily_challenges`, `daily_practice_sessions`, `departments`,
`developer_api_keys`, `developer_api_usages`, `friendships`,
`interview_answers`, `interview_questions`, `interview_sessions`, `interviews`,
`job_postings`, `matchmaking_matches`, `messages`, `notifications`,
`password_reset_tokens`, `placement_companies`, `placement_prep_sessions`,
`placement_track_rounds`, `placement_tracks`, `problem_starter_codes`,
`problem_tags`, `problem_test_cases`, `problems`, `profiles`,
`quest_map_levels`, `quest_progress`, `question_exposures`, `questions`,
`refresh_tokens`, `resumes`, `roadmap_tasks`, `roadmap_weeks`, `roadmaps`,
`saved_opportunities`, `skill_evidence`, `streak`, `student_skill_profiles`,
`test_cases`, `tournament_matches`, `tournament_participants`, `tournaments`,
`unified_assessments`, `user_campaign_progress`, `user_daily_activities`,
`user_settings`, `user_skill_stats`, `user_stats`, `user_submissions`, `users`,
`xp`, `xp_ledger`.

An AST count across the 26 legacy revisions found 56 `op.create_table`, 53
`op.drop_table`, 24 `op.add_column`, 19 `op.drop_column`, 17
`op.batch_alter_table`, 2 `op.alter_column`, 64 `op.create_index`, 25
`op.drop_index`, and one `op.execute` call. These are operation-call counts
across migration sources, not a computed final schema. The raw SQL site is
`backend/alembic/versions/5c7e9a1d3f42_add_onboarding_completed_to_users.py`.
Migration-created objects, raw SQL effects, reflected constraints, and objects
not registered in `Base.metadata` still require full revision-by-revision
reconciliation before a target manifest can be approved.

## 7. PostgreSQL preparation

No Docker, PostgreSQL server, `pg_ctl`, `initdb`, or `psql` is installed. No
connection was attempted. The target PostgreSQL major version remains an
unresolved input; production configuration was not inspected.

Future testing profile:

1. Provision an explicitly disposable PostgreSQL instance at the approved major
   version, separate from Neon/Render and without production credentials.
2. Provide its URL only to a dedicated test harness (for example
   `QUBIRA_TEST_POSTGRES_URL`); do not read an application `.env` implicitly.
3. Use a dedicated session-level advisory lock on the same connection retained
   for the whole transition. A dropped connection releases the lock. Define a
   fixed application namespace/key and test lock contention, crash release, and
   transaction-boundary behavior.
4. Run fresh and historical-revision test cases, then dispose of the test DB.

This is a proposed test profile, not an implemented lock or a compatibility
claim. PostgreSQL advisory-lock behavior and schema-manifest PostgreSQL queries
remain unverified.

## 8. Inactive Alembic epoch scaffold

Created `backend/alembic_epoch.ini` and a separate `backend/alembic_epoch/`
script directory. It has no revision files, no baseline, and no application or
entrypoint integration. The configured version table is
`alembic_version_epoch`.

The scaffold environment requires both
`QUBIRA_EPOCH_SCAFFOLD_ACTIVE=1` and an explicitly supplied
`QUBIRA_EPOCH_DATABASE_URL` before an online or offline Alembic environment
proceeds. This is a guard for explicit future development, not an activation.
The scaffold test confirms the legacy head remains `47292a2a50d2` and the epoch
has zero heads.

## 9. Startup head check and control-state guard

The design-level active-head gate remains a future implementation task. Before
an epoch is activated, startup/runner logic must verify all of the following
under the engine-specific lock:

1. The epoch script directory has exactly one head.
2. The active epoch version table exists at the phase when it is required and
   contains exactly one row.
3. That row equals the sole repository epoch head.
4. The control/audit records describe a terminal `verified` transition, not
   `started`, `committed_unverified`, malformed, or ambiguous state.
5. The current versioned schema fingerprint matches the approved target
   manifest.

`epoch_state.py` implements only the first catalog-level guard for the three
provisional object names (`qubira_epoch_control`, `qubira_epoch_audit`, and
`alembic_version_epoch`): no objects, complete control pair without the active
version table, or all three. Other partial combinations fail closed. It does
not inspect rows, validate a head, read audit status, or run at application
startup. The partial-state test exercises the pure classifier; it does not
create control tables or simulate DDL recovery.

## 10. Files reviewed and changes avoided

Reviewed the legacy runner/configuration and state/preflight modules,
SQLAlchemy sync/async setup, model registration, test fixtures, SQLite
diagnostic scripts, and migration utility connection sites. The complete
connection inventory is in
[`PHASE_3_2A_CONNECTION_INVENTORY.md`](./PHASE_3_2A_CONNECTION_INVENTORY.md).

The worktree already contained unrelated changes and prior-phase artifacts.
Those were preserved. No historical migration, runtime database engine,
application entrypoint, or production setting was modified.

## 11. Remaining blockers and Phase 3.2A status

Phase 3.2A infrastructure artifacts and isolated tests are complete, but the
overall reliability gate is **not ready for migration activation**:

1. No application or migration connection path is integrated with the lock.
2. POSIX locking is absent; the deployment runtime must be known before SQLite
   coordination can be considered portable.
3. Windows NTFS/local-volume support was exercised only on this machine; cloud
   sync and other filesystem semantics are unresolved.
4. Symlink lock-path alias test was skipped due user privilege; hard links are
   not unified.
5. No disposable PostgreSQL instance/version is available.
6. PostgreSQL lock/profile, manifest reflection, and compatibility remain
   unverified.
7. The schema manifest is infrastructure tooling only; no canonical target
   manifest or full migration-object reconciliation has been produced.
8. Active-head row validation, transition audit validation, recovery semantics,
   and application startup gating are not implemented.

Do not begin fresh baseline implementation, existing database reconciliation,
or deployment until these blockers are addressed under the approved phase
sequence.

## 12. Explicitly not performed

- No original local or production database connection/read/write.
- No Alembic `upgrade`, `downgrade`, or `stamp`.
- No `create_all()` execution by this task.
- No historical migration edit.
- No app startup, entrypoint, or deployment configuration change.
- No PostgreSQL compatibility claim.
- No deploy, commit, or push.
