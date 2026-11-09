# Phase 3.2I — PostgreSQL Environment and Existing-Schema Compatibility

**Overall release status: BLOCKED**

**Repository HEAD:** `ef1e0c7f4795e354e78367474af199ac7a4dd49a`

**Current legacy Alembic head:** `d1f5a8e7c2b4`

**PostgreSQL tested:** 18.6, disposable cluster on loopback

**Production / Neon access:** None

**Repository migration execution or stamp:** None

**Deployment, commit, or push:** None

## Status summary

| Area | Status | Evidence |
|---|---|---|
| Current Alembic graph | **FIXED AND TESTED** | `alembic heads` reports the single head `d1f5a8e7c2b4`; the verbose history confirms its ancestors. |
| Reproducible local PostgreSQL 18.6 test environment | **FIXED AND TESTED** | [test-postgresql18.ps1](../../backend/scripts/test-postgresql18.ps1) creates a uniquely named temporary cluster/database, verifies loopback/server/data-directory identity before test DDL, and stops/removes that cluster. |
| PostgreSQL migration ownership checks | **FIXED AND TESTED** | Seven focused PostgreSQL tests passed: independent-process exclusion, normal and exceptional release, connection identity, Alembic connection reuse, preflight connection reuse, and release after process termination. |
| API-only startup | **FIXED AND TESTED** | Uvicorn started without a migration command. `/health` returned 200, `/ready` returned 503 for the intentionally incomplete synthetic schema, and unauthenticated auth/dashboard calls returned 401. Schema inventory and the synthetic Alembic revision remained unchanged. |
| Manifest-gated compatibility harness | **PARTIALLY IMPLEMENTED** | Requires an externally approved profile digest, exact source/target manifests, a starting/target revision, and synthetic-only preservation tables. Unit guards pass; no approved Qubira profile exists, so migration compatibility was not run. |
| Historical source schema profile | **BLOCKED** | No reliable revision-specific PostgreSQL snapshot or schema-only dump was found. Prior architecture reports explicitly prohibit inferring a schema from revision numbers or current models. |
| Existing-schema migration to `d1f5a8e7c2b4` | **BLOCKED** | No supported starting revision/profile is established. The compatibility harness was implemented and unit-tested, but not run against a fabricated Qubira profile. |
| Fresh full Alembic replay | **BLOCKED** | The historical root has unsafe assumptions and destructive drops. The migration runner also has a `create_all()` plus `stamp()` bootstrap path; that path is not a permitted substitute for Alembic replay and was not run. |
| Already-at-head, unknown-revision, incompatibility, partial-failure, and interrupted-upgrade scenarios | **NOT TESTED** | They require an approved source/target schema profile and an authorized migration path. |
| Qubira data preservation (users, XP, battles, placement, etc.) | **NOT TESTED** | No Qubira-shaped records or historical schema were fabricated. The PostgreSQL tests used only synthetic coordinator tables. |
| Migration activation / production compatibility | **BLOCKED** | Keep the PostgreSQL execution gate closed. No production state was inspected. |

## Repository and history review

At the start of this phase, the tracked worktree was clean and one unrelated
untracked frontend file was present. During this work, additional unrelated
frontend edits appeared in the shared worktree; they were not inspected,
modified, or reverted. All Phase 3.2H work and those unrelated changes were
preserved. No file in `backend/alembic/versions` was changed.

The current revision graph has one head:

```text
dd495117949b
  ... historical revisions and branch merges ...
47292a2a50d2
  -> a14c6e8d2b37
  -> c9b0f2d5a713
  -> d1f5a8e7c2b4 (head)
```

The earlier placement and opportunity lines merge at `47292a2a50d2`. The
single-head graph is graph evidence only; it does not establish that a database
at any recorded revision has the corresponding schema.

The Phase 3.1 through Phase 3.2H reports were reviewed. Their relevant findings
remain applicable:

- `dd495117949b` is not a fresh-install baseline. It assumes existing objects
  and includes unconditional table/index drops.
- `b0c9e2a7f1d4` deletes duplicate XP records and performs data backfills.
- The Phase 3.1 epoch proposal is not implemented as an active migration path.
- Phase 3.2E/G documented earlier disposable PostgreSQL 18.6 tests. Phase 3.2H
  later reported missing PostgreSQL tools. This phase independently found
  PostgreSQL 18.6 binaries installed outside `PATH`, verified their version,
  and used a new cluster. Neither of the machine's existing PostgreSQL
  services/databases was used.

## PostgreSQL environment and test commands

The reproducible Windows test launcher is:

```powershell
Set-Location D:\BattleAI
.\backend\scripts\test-postgresql18.ps1
```

The launcher:

1. Requires the installed PostgreSQL binaries to report exactly 18.6.
2. Creates a run-unique data directory under the system temporary directory,
   with a random synthetic owner password and a unique `qubira_test_<id>`
   database.
3. Starts a separate cluster bound to `127.0.0.1`; it does not use either
   installed PostgreSQL Windows service.
4. Verifies PostgreSQL version, database/user identity, loopback server address,
   configured listener, port, and data directory before test DDL. It verifies
   the newly created database identity again before tests.
5. Runs PostgreSQL-specific tests with the repository root `conftest.py`
   excluded, so model-based fixtures cannot silently create the application
   schema.
6. Runs API-only Uvicorn probes, checks the database schema/revision state
   before and after, then stops and removes only its run-unique temporary
   cluster.

An initial run exposed that the root pytest `conftest.py` could initialize
model tables in a disposable PostgreSQL test database. The launcher was
corrected to use `--confcutdir=tests/migration_infrastructure`; the successful
run used that isolation and did not invoke the current-head bootstrap/stamp
test. All temporary clusters from failed attempts were stopped and removed.

Current validation:

| Command/check | Result |
|---|---|
| `python -m alembic heads` | **PASS** — `d1f5a8e7c2b4` only. |
| `python -m alembic history --verbose` | **PASS** — revision ancestry inspected; no database was opened. |
| `.\backend\scripts\test-postgresql18.ps1` | **PASS, limited scope** — seven PostgreSQL ownership/preflight tests passed; the migration bootstrap test that stamps the current head was deselected. API probes also passed. |
| `python -m pytest -q tests\migration_infrastructure\test_schema_manifest.py tests\migration_infrastructure\test_postgresql_compatibility_harness.py` | **PASS** — 7 passed. |
| PowerShell parser check for `test-postgresql18.ps1` | **PASS**. |
| `git diff --check` on the task's backend changes | **PASS**. |
| Full repository Alembic replay / `alembic upgrade head` | **NOT RUN** — the known legacy path is unsafe and the gate remains closed. |
| `alembic stamp` | **NOT RUN**. |

The focused PostgreSQL suite exercised synthetic DDL only. In particular, it
proved that a competing process cannot acquire the advisory lock, that normal
and exceptional exits release it, that Alembic's synthetic revision receives
the owner's exact SQLAlchemy connection/backend PID, that the model preflight
uses the owner connection, and that terminating a lock-holding process releases
the session lock. It did not execute the repository's revision graph.

## Historical schema evidence and operator input

Repository search found no historical PostgreSQL dump, revision-specific
schema snapshot, or reviewed previous-schema manifest. The existing
`schema_manifest.py` builds and compares schema inventories; it is not itself
evidence for a historical Qubira profile. Current model metadata cannot fill
that gap, and prior local observations in old reports are not current database
observations.

**No previous revision is currently approved as a supported starting revision.**
The required operator-provided profile must be built from an authorized,
sanitized schema-only snapshot/restore and include:

- A separately reviewed profile ID and evidence/ticket ID.
- The exact `alembic_version.version_num` from that verified snapshot. Do not
  infer or set it.
- The complete schema manifest for the source revision: tables, columns/types,
  defaults, nullability, PKs, FKs/actions, unique/check constraints, indexes,
  views, triggers, sequences, relevant extensions, and a reviewed inventory of
  other schema objects.
- The PostgreSQL server version and schema name.
- A separately reviewed target manifest for the approved final schema at
  `d1f5a8e7c2b4`; the current ORM model alone is not sufficient proof.
- Explicit preservation-table names/primary keys and synthetic-only data
  fixtures. Include before/after row counts and deterministic hashes for
  synthetic records, not PII or production row values.
- A source-manifest and target-manifest SHA-256, plus an overall profile
  SHA-256 supplied out-of-band from the review record.

The compatibility harness requires this reviewed profile and refuses non-
loopback hosts, databases not named `qubira_test_*`, mismatched PostgreSQL
version/schema manifests, unsupported starting revisions, missing
tables/primary keys, unexpected target objects represented by the manifest,
changed preservation counts/checksums, or an unexpected final revision. It
uses the owned connection for schema inventory and accepts an explicitly
supplied coordinated upgrade callback. Unit tests cover profile digest,
synthetic-only, and primary-key guards. The full harness remains unexecuted
until a real supported profile and target manifest exist.

The current manifest covers tables/columns, PK/FK/unique/check constraints,
indexes, views, materialized views, triggers, sequences, and PostgreSQL
extensions. It does not yet inventory every possible PostgreSQL object class
(for example, routines, policies, grants, or all custom types). The operator
profile must include and review those objects before a claim of complete
unknown-object preservation; expanding that inventory is part of the remaining
compatibility work.

## Migration and API findings

`run_migrations.py` still rejects PostgreSQL in
`require_supported_migration_dialect()` before acquiring migration ownership.
The rejection is intentional and must remain. Separately, the current helper
`_bootstrap_empty_postgresql_database()` calls `Base.metadata.create_all()` and
`MigrationContext.stamp()`; this phase did not invoke it. It is not evidence of
an Alembic migration replay and must not be used to satisfy the fresh-install
gate in this task.

The API-only test ran Uvicorn independently against the isolated database,
which contained only disposable coordination-test objects and its synthetic
Alembic revision row:

| Endpoint | Result | Interpretation |
|---|---:|---|
| `/health` | 200 | Liveness succeeded. |
| `/ready` | 503 | Correct fail-closed readiness for an incomplete synthetic schema. |
| `/api/v1/auth/me` | 401 | No authentication bypass; request had no credentials. |
| `/api/v1/dashboard` | 401 | No authentication bypass; request had no credentials. |

The public schema relation count and synthetic revision row were identical
before and after API startup/requests. This is API-only startup evidence, not a
test of a compatible Qubira schema.

## Remaining blockers and activation decision

1. Obtain the operator-approved sanitized historical schema profile and the
   matching reviewed target manifest. Do not access Neon or production to
   produce them.
2. Design and approve the supported forward-only migration path. The current
   legacy root is not safe for fresh replay; do not rewrite it or use
   `create_all()`/`stamp()` to claim completion.
3. Once the profile/path is approved, run actual coordinated Alembic upgrades
   in disposable PostgreSQL 18.6 from that exact revision. Compare complete
   before/after schema and synthetic data; inject unknown revision, incompatible
   object, partial failure, and connection-loss cases; verify recovery without
   stamping or automatic retry.
4. Test current-head no-op/readiness, complete application persistence, and
   all user/profile/role/XP/battle/question/placement record invariants against
   that fixture.
5. Keep the PostgreSQL activation gate closed until all required migration,
   preservation, failure, and recovery scenarios pass and receive review.

No Neon/production connection, protected SQLite access, database reset,
production migration, deployment, or production configuration change occurred.
