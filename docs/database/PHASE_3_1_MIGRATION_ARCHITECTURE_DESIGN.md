# Phase 3.1 — Migration Architecture Design

**Status:** Design only. No migration, database, application runtime, or production configuration was changed.

## 1. Executive summary

The current 26-revision Alembic graph has one legitimate merge head, `47292a2a50d2`, but its root is a historical transformation of a legacy schema, not a fresh-install baseline. Replaying it on an empty database fails at an unconditional `DROP TABLE interview_questions`. Existing databases also may contain schema objects that later revisions attempt to create, and their live schema can differ from both their recorded revision and current SQLAlchemy metadata.

**Recommendation:** begin a separately versioned schema epoch (for example, `alembic_epoch2`) with a new, explicit Alembic baseline and a separate active version table such as `alembic_version_v2`. Keep the old scripts and old `alembic_version` table as immutable historical evidence. The new baseline must execute real DDL on an empty database, and on an existing database must classify and reconcile the inspected schema using explicit, reviewed operations. It must not replay the broken legacy chain, infer a revision from table presence, or stamp old history as applied. The baseline and subsequent migrations produce one new active head for both paths.

This design is a credible route, not a completed migration plan: PostgreSQL behavior, exact production schema, all database-specific conversion rules, and the set of supported historical schema profiles still require verification and testing before implementation or deployment.

## 2. Evidence labels and scope

- **Confirmed in this phase:** source and migration scripts were inspected; `alembic heads` and `alembic history --verbose` were run without requesting an upgrade or stamp. The graph has 26 revisions and one head.
- **Previously inspected, not revalidated against the database in this phase:** the local SQLite revision (`b8f2d4e6a901`), approximately 1,845 users, 26 metadata differences, and seven pending table conflicts. These are carried forward from [the Phase 3 migration safety report](../../QUBIRA_PHASE3_MIGRATION_REPAIR_REPORT.md); this phase did not reconnect to the original database.
- **New source observation:** the current runner's AST-based conflict check detects `create_table`/`drop_table` operations, not the full column, constraint, index, or data effects of every migration. The preflight compares against current model metadata rather than a version-specific historical schema.
- **Recommendation:** the epoch design below is proposed for Phase 3.2; it has not been implemented.
- **Unverified:** Neon/Render schema, PostgreSQL migration behavior, backup/restore capability, and the complete distribution of deployed database revisions.

No live database, production environment, or disposable database was connected to or modified in this design phase. No `alembic upgrade`, `alembic stamp`, `create_all()`, or schema-changing SQL was run.

## 3. Current architecture

- `backend/alembic.ini` selects `backend/alembic` as its script location. Its static `sqlalchemy.url` is a placeholder; `backend/alembic/env.py` replaces it with the synchronous application engine URL from `app.database.database`.
- `backend/alembic/env.py` sets `target_metadata = Base.metadata`, enables type comparison and batch rendering, and imports the audit model. Model registration is rooted in `app.models`.
- The synchronous engine is configured in `backend/app/database/database.py`; SQLite uses `pysqlite`, PostgreSQL URLs are normalized to the Psycopg driver. Async application engine configuration is separate in application configuration and uses `aiosqlite` or `asyncpg`.
- `backend/run_migrations.py` performs state checks and then invokes `alembic upgrade` to the sole head. It refuses known revision/table inconsistencies and model drift when already at head. It is not a full migration simulator or a complete schema compatibility proof.
- The current entrypoint runs the migration runner before starting the API and fails closed if migration execution fails. Application startup no longer initializes tables outside Alembic.
- The preflight uses SQLite read-only mode; its PostgreSQL branch requests a read-only transaction. It reports current metadata differences and table-operation conflicts but does not establish safety for an untested schema transformation.

### 3.1 Complete current revision graph

The parent edges confirmed by Alembic are:

| Revision | Parent revision(s) |
|---|---|
| `dd495117949b` | base |
| `bb9cc66e4c08` | `dd495117949b` |
| `c4f8a1d2e6b7` | `bb9cc66e4c08` |
| `e7b2c9d4f1a6` | `c4f8a1d2e6b7` |
| `f2a8c1d9e4b7` | `e7b2c9d4f1a6` |
| `a1b2c3d4e5f6` | `f2a8c1d9e4b7` |
| `b7c9d2e1f4a6` | `a1b2c3d4e5f6` |
| `4a6e8c2d1f30` | `b7c9d2e1f4a6` |
| `b0c9e2a7f1d4` | `4a6e8c2d1f30` |
| `5c7e9a1d3f42` | `b0c9e2a7f1d4` |
| `d9f8e7c6b5a4` | `5c7e9a1d3f42` |
| `e3f1a9c2d7b4` | `d9f8e7c6b5a4` |
| `a4d5b6c7e8f9` | `e3f1a9c2d7b4` |
| `c1f4a8d2e9b0` | `d9f8e7c6b5a4` |
| `5d9e1f1a7c66` | `d9f8e7c6b5a4` |
| `a9e4c1b7d602` | `a4d5b6c7e8f9`, `c1f4a8d2e9b0`, `5d9e1f1a7c66` |
| `b8f2d4e6a901` | `a9e4c1b7d602` |
| `c8d3f1a6b902` | `a9e4c1b7d602` |
| `1c9f26ee5924` | `c8d3f1a6b902` |
| `3e7f2c1a9b44` | `1c9f26ee5924` |
| `4f2a7c9e1b6d` | `3e7f2c1a9b44` |
| `e8c1b2a3f4d5` | `4f2a7c9e1b6d` |
| `f1a2b3c4d5e6` | `e8c1b2a3f4d5` |
| `6e1c2d3f4a5b` | `f1a2b3c4d5e6` |
| `7a2b1c4d9e8f` | `6e1c2d3f4a5b` |
| `47292a2a50d2` | `7a2b1c4d9e8f`, `b8f2d4e6a901` |

`a9e4c1b7d602` joins three lines after `d9f8e7c6b5a4`; the graph later splits into the `b8f2d4e6a901` and placement branches and merges at `47292a2a50d2`. The current head's merge body is a no-op; it reconciles revision graph ancestry, not database schema.

The individual scripts and operation inventory remain documented in [the existing Alembic architecture reference](../../backend/docs/ALEMBIC_MIGRATION_ARCHITECTURE.md).

### 3.2 Unsafe assumptions and migration risks

| Revision(s) | Confirmed source behavior | Design consequence |
|---|---|---|
| `dd495117949b` | Creates `refresh_tokens` and `resumes`, unconditionally drops many legacy tables and indexes (including `interview_questions`), adds columns to an assumed-existing `users` table, and alters `users.full_name`. | Not a clean-install initializer. Destructive to legacy schema/data; direct alteration is not SQLite batch-safe. Never replay as a fresh baseline or rewrite in place. |
| `c4f8a1d2e6b7`, `e7b2c9d4f1a6`, `b7c9d2e1f4a6`, `5c7e9a1d3f42`, and table-creation revisions | Several assume prior tables/columns exist; some create objects unconditionally. | A linear revision marker is not proof that the actual schema matches that point in the history. |
| `b0c9e2a7f1d4` | Deduplicates XP rows by deleting all but one row per user, backfills XP, creates uniqueness/FK objects, and alters battle-result semantics. Its downgrade rejects existing draw results. | Data-changing and potentially lossy. Must not be replayed automatically as an adoption repair; reconcile duplicates and XP meaning explicitly. |
| `f2a8c1d9e4b7`, `c8d3f1a6b902`, `7a2b1c4d9e8f` | Unconditionally create tables. `c8...` creates quest tables; `7a...` creates the three placement tables. | Fail when same-named tables already exist, including tables created outside the recorded history. |
| `4a6e8c2d1f30` | Silently returns if `profiles` is absent, while Alembic can still record the revision as applied. | Revision history can claim an operation that did not occur. |
| `d9f8e7c6b5a4`, `e3f1a9c2d7b4`, `a4d5b6c7e8f9`, `4f2a7c9e1b6d`, `e8c1b2a3f4d5`, `f1a2b3c4d5e6`, `6e1c2d3f4a5b`, `b8f2d4e6a901` | Several use existence guards, but a present table may be only partially compatible; table-existence checks do not prove its columns, constraints, or indexes. `5d...` and `e8...` both declare `company_skill_requirements`. | Guards can avoid duplicate creation but are not schema reconciliation. Inspect and compare each object, not just its name. |
| `5d9e1f1a7c66`, `e8c1b2a3f4d5` | `company_skill_requirements.company_id` conversion specifies PostgreSQL `company_id::integer`; SQLite conversion behavior is not explicitly defined. `e8...` has a no-op downgrade. | Requires engine-specific conversion and data preconditions; conversion cannot be assumed safe from declared types alone. |
| `e3f1a9c2d7b4`, `a4d5b6c7e8f9` | Downgrades deliberately raise to protect notification/audit history. | Downgrade is not a viable rollback strategy. |
| `b8f2d4e6a901` | Creates a unique index during upgrade but attempts to drop it as a table constraint during downgrade. | Downgrade behavior must be tested; do not assume symmetry. |
| Multiple revisions | Downgrades drop tables/columns or rebuild tables; SQLite batch operations and database-specific defaults/booleans are used. | Never use downgrade as an automatic recovery mechanism; require explicit data and rollback plans. |

The previously recorded local schema conflicts include `quest_map_levels`, `quest_progress`, `password_reset_tokens`, `xp_ledger`, `placement_companies`, `placement_tracks`, and `placement_track_rounds`. The reported `company_skill_requirements.company_id` mismatch is local `VARCHAR(36)` versus model `INTEGER`. Those observations are not claims about production.

### 3.3 Current runner/preflight limitation

`migration_state.py` parses migration source to detect table create/drop conflicts. It does not simulate conditional DDL, column alterations, defaults, unique-index creation, foreign keys, data updates, or all batch operations. The preflight's model comparison is against current `Base.metadata`, not a per-revision historical schema manifest. A report of no detected table conflict therefore cannot authorize migration. Phase 3.2 must replace this as a decision mechanism with explicit database profiles and reviewed operation plans; static checks may remain as defense in depth.

## 4. Path A — fresh database

### Recommended design: a versioned schema epoch with a real baseline

Create a new, separate Alembic script location (provisionally `backend/alembic_epoch2`) and configuration. Configure its active version table to a new name (for example, `alembic_version_v2`) so the old `alembic_version` history is retained verbatim as archival provenance.

The new root baseline is an actual migration, not a no-op or a stamp:

1. Freeze and review a canonical target schema from registered SQLAlchemy metadata plus migration-only objects. Record a schema manifest/version and verify all models are imported.
2. On a truly empty SQLite or PostgreSQL database, issue explicit, ordered Alembic operations for every target table, primary/foreign/unique/check constraint, index, and server default. Do not use `Base.metadata.create_all()` or import a prebuilt database file.
3. Use dialect-aware operations for defaults, types, generated/identity keys, JSON, boolean and timestamp semantics. Make the migration fail if an object unexpectedly exists or an assumption is false.
4. Let Alembic create and update `alembic_version_v2` only as the baseline migration actually succeeds. The final baseline is the initial epoch head; later changes add ordinary forward revisions.
5. After execution, compare the live schema to the frozen dialect-specific target manifest and run integrity checks before allowing application startup.

The new baseline may have an empty-database mode and a separately validated existing-schema mode (Path B). Both modes execute one real versioned migration and record one shared new revision. Do not execute legacy migrations merely to reach the new epoch.

### Alternatives considered

| Approach | Advantages | Rejected risks / trade-offs |
|---|---|---|
| Edit or guard `dd495117949b` | Could make the current graph appear usable on empty databases. | Rewrites already-applied history; semantics differ for installations that ran the original; conditional behavior still cannot prove or reconcile arbitrary old schemas. Rejected. |
| Add a no-op baseline, stamp, or mark old revisions applied | Superficially short path to a head. | Records migrations that did not execute and leaves schema unproved. Explicitly rejected. |
| Keep current graph as the active lineage and add a new baseline as another parent/branch | Preserves old revision names in one graph. | Alembic must traverse a merge's ancestors; a fresh upgrade would still execute the unsafe legacy path. A merge does not skip ancestor operations. Rejected. |
| New epoch, explicit baseline, separate version table, old history retained | Separates new-install truth from legacy assumptions; allows fresh and verified existing schemas to run a common new baseline; keeps old revision evidence. | Requires a controlled migration-runner/script-location cutover, a thoroughly tested schema-aware baseline, and operational handling of two version tables during transition. Recommended. |
| Rebuild the database from a schema dump or call `create_all()` | Fast for a disposable database. | Not a migration history, not auditable as ordered DDL, may omit migration-only objects, and is not acceptable for preserving existing data. Rejected. |

## 5. Path B — existing database reconciliation

The new epoch must treat the stored legacy revision as evidence, not as proof. It must not update, delete, rename, or reinterpret the old `alembic_version` row. A new active version table tracks only migrations that actually execute in the new epoch.

### Required preflight and planning workflow

1. **Identify and isolate:** record dialect/server version, database identity without credentials, current legacy revision rows, active epoch revision rows (if any), SQLite file/WAL state or PostgreSQL database identity. Require exactly one understood legacy revision when legacy metadata exists. Missing, malformed, multiple, unknown, or non-ancestor revisions stop for manual review.
2. **Inventory actual schema:** read tables/views, columns and types, nullability, defaults, primary/unique/check constraints, foreign keys and actions, indexes, sequences/identity behavior, triggers, and relevant extensions. Record engine-specific semantics.
3. **Check data invariants:** row counts for critical tables; null counts; duplicate groups that would violate unique constraints; orphan references; type-conversion failures; key-set and relationship checks for users, battles, XP ledger, placement, opportunities/applications, and other data-bearing tables. Do not export PII into the report.
4. **Compare three inputs:** legacy revision ancestry, actual catalog/data, and the frozen target schema for that engine. Classify every object as exact, missing, compatible-but-different, conflicting, or unrecognized. A matching name is not a matching definition.
5. **Generate a reviewable plan:** each proposed operation lists preconditions, exact object, old/new definition, data transform, expected row impact, lock/downtime, verification query, and recovery action. No automatic drops, destructive casts, deduplication, or guessed values.
6. **Fail closed on ambiguity:** stop on unknown tables/columns with possible application data, differing constraint semantics, duplicate keys, invalid casts, unresolved foreign keys, unsupported revision, or anything that could drop or silently change records. Preserve extra objects; do not “clean them up.”
7. **Back up and rehearse:** take an engine-native, consistent backup, restore it into an isolated disposable target, run the exact proposed migration there, then validate schema, data invariants and application behavior. A backup is not verified until restore succeeds.
8. **Apply only after separate authorization:** maintenance window/write freeze or a documented online migration plan, monitoring and abort thresholds, migration lock/serialization, verified backup, operator approval, and a tested recovery path are prerequisites.
9. **Prove the new lineage:** the epoch baseline physically creates/changes only approved objects and records an audit row containing source revision, source and target schema-manifest identifiers, migration build, and completion result. It then records the epoch revision in `alembic_version_v2`. It does not claim that any old migration ran.

### Revision support policy

Create an explicit support matrix mapping each accepted old revision (including each historical branch state) and each database dialect to its expected schema profile, known data preconditions, and tested adoption route. The initial supported set must be limited to states that have a reproducible fixture or restored copy and have passed the full acceptance suite. All other revisions or schema variants stop for manual review. Do not infer the schema from the revision number alone; historical guards, manual DDL, and out-of-band changes can make the actual schema diverge.

### Handling known examples

- Seven existing-table collisions must be structurally compared table by table. If an existing table exactly meets target, preserve its rows and record the verified epoch transition; if it differs, propose explicit additive/transform operations. Never drop and recreate it just to silence `already exists`.
- For `company_skill_requirements.company_id`, inspect every value, target-company correspondence, nullability, unique relationships, and FK violations before proposing conversion. Non-convertible or ambiguous values block migration. A cast expression alone is not a data migration plan.
- For XP duplicates or other uniqueness conflicts, do not replay legacy deduplication. Either prove the target invariant already holds or stop for an explicitly reviewed preservation/consolidation design that accounts for every source record.
- For extra database objects not represented in models, preserve them by default and investigate ownership before choosing an operation.

## 6. Convergence guarantee

Both paths use the same new epoch migration directory, target manifest, active version table, and final head:

```text
Empty SQLite/PostgreSQL
  -> epoch baseline (explicit schema creation)
  -> epoch forward revisions
  -> EPOCH_HEAD

Supported existing legacy revision + verified catalog/data
  -> epoch baseline (reviewed reconciliation/adoption operations)
  -> epoch forward revisions
  -> EPOCH_HEAD
```

The old graph is archived, not executed as a prerequisite and not rewritten. Existing source revision and schema identity are retained in the old version table and a new transition audit record. The epoch baseline is legitimate because it runs and validates the actual schema transition; it does not assert that the database executed its old ancestors or assign a historical revision to it.

Convergence is guaranteed only for schema profiles explicitly supported and tested. Unknown/ambiguous states do not converge automatically; they remain blocked until a reviewed, versioned repair route is added. Every future release must expose exactly one active epoch head, and both fresh and supported existing test paths must finish at that same revision.

## 7. SQLite/PostgreSQL compatibility matrix

This is a planning matrix, not a claim that the current migrations work on PostgreSQL. SQLite and PostgreSQL migration acceptance requires actual tests on both supported engine versions.

| Operation | SQLite | PostgreSQL | Required design/test gate |
|---|---|---|---|
| Create table / PK | Supported; integer primary-key/autoincrement semantics differ from PostgreSQL identity/sequence behavior. | Supported; identity/sequence details and ownership matter. | Test generated IDs, FK creation order, names, and downgrade policy. |
| Add nullable column | Generally supported on modern SQLite; older versions and constraints can vary. | Supported. | Test on the minimum supported SQLite and PostgreSQL versions. |
| Add non-null column | Existing rows need a valid backfill/default; SQLite capabilities depend on default/constraint shape. | Existing rows need a valid default or prior backfill; locks may be significant. | Separate expand/backfill/validate/enforce steps for large tables; prove no nulls remain. |
| Change column type | Often requires Alembic batch table rebuild; type affinity does not guarantee values convert as intended. | `ALTER TYPE` may require explicit `USING`, locks, and index/FK rebuilding. | Profile every value and reference; test batch copy and casts on disposable copies; no lossy implicit cast. |
| Change nullability | Usually table rebuild for SQLite. | Native alteration, but fails if null rows exist. | Precheck values and preserve all rows; test rollback/recovery. |
| Unique constraint/index | Usually index support; rebuild may be needed for some constraints. Existing duplicates prevent creation. | Constraint/index support; concurrent index creation is non-transactional and has operational caveats. | Detect duplicates first; review lock strategy and whether index/constraint are semantically equivalent. |
| Foreign key | Enforcement depends on `PRAGMA foreign_keys` per connection; batch rebuild must preserve all FK actions. | Enforced natively; adding/validating large FKs can lock/scan tables. | Check orphans before migration; verify FK actions and run engine-native integrity checks after. |
| Index creation/drop | Supported, but locks writes and names/quoting differ. | Supported; `CONCURRENTLY` cannot run in a normal transaction. | Unique collisions and write-lock duration tested; only use nontransactional operations with explicit recovery. |
| Drop table/column | Destructive; column removal may rebuild. | Usually transactional DDL but destructive to data. | Prohibited by default for user-data objects; require retention/backup and separate approval. |
| Server defaults | SQLite default syntax/storage differs and does not provide PostgreSQL semantics. | Richer expressions and type-specific defaults. | Distinguish client defaults from server defaults; assert actual reflected defaults on both. |
| Boolean | Usually integer affinity / truth-value representation. | Native boolean. | Normalize values, defaults and checks; avoid dialect-specific raw predicates. |
| Date/time/timezone | Stored as text/number depending on type/driver; timezone semantics are not equivalent to PostgreSQL `timestamp with time zone`. | Native timestamp types and timezone conversion behavior. | Define UTC policy and test round-trip/ordering; do not infer timezone correctness from SQLite. |
| JSON | Commonly JSON text with JSON1 behavior depending on SQLite build. | JSON/JSONB types and operators differ. | Test serialization/default/index semantics; introduce dialect-specific expressions only when required. |
| Alembic batch alter | `batch_alter_table` may create/copy/swap/drop a table and can affect indexes, triggers, FKs, and locking. | Often maps to regular `ALTER`; batch behavior may be unnecessary. | Review emitted DDL and preservation of every table object. Do not run a rebuild without separately authorized proof and backup. |
| Transactional DDL / failure | SQLite supports transactional DDL with caveats across driver, locking, journal mode, and multi-step batch operations. | Most ordinary DDL is transactional; certain operations (e.g. concurrent indexes) are not. | Inject failures at each step on disposable instances; verify atomicity or documented partial-state recovery. |

## 8. Data preservation, backup, and recovery

- Before any future migration, quiesce writes or document an online consistency strategy. Capture an engine-native backup and restore it to a separate database/file; do not treat a file copy during active SQLite writes as a verified backup.
- SQLite plan: use the SQLite online backup API (and account for WAL/journal state); validate integrity and foreign keys on the restored copy.
- PostgreSQL plan: take a consistent logical or platform-approved snapshot/backup; restore into an isolated PostgreSQL instance; validate extensions, ownership, schema, and data. A local SQLite rehearsal is not a PostgreSQL backup or compatibility proof.
- Compare before/after counts and primary-key sets for critical tables, relationship/orphan checks, XP totals/ledger invariants, battle outcomes, placement tracks/rounds, and applications/history. Where a deliberate transform changes row shape, provide a source-to-target mapping and show every source record accounted for.
- Avoid destructive downgrade as rollback. Prefer tested forward repair. If a failed operation leaves ambiguity, stop writes and restore the verified backup to a separate target; do not retry on the original until the partial state is understood.
- Preserve the old Alembic version table and source migration files as audit evidence. Keep the new epoch audit record and schema-manifest identifier with the migration release artifacts.

## 9. Migration acceptance design

No implementation or migration may be approved until all applicable gates pass:

1. **Graph/source:** every revision imports; all parents resolve; `alembic heads` returns exactly one active epoch head; history has no unintended branch; no active epoch migration is an unreviewed legacy replay.
2. **Fresh SQLite:** start with a new disposable file; run the new runner; reach the active head; compare to the SQLite target manifest; verify defaults, indexes, unique constraints, FK actions, `PRAGMA foreign_key_check`, application startup, and representative persistence flows.
3. **Fresh PostgreSQL:** use a disposable PostgreSQL instance at the production-supported major version; run the same active epoch to the same head; compare against the PostgreSQL target manifest; run FK/data checks and application startup. No production endpoint is used.
4. **Existing SQLite:** restore a verified local copy to a disposable file; test every declared supported revision/schema profile, including the previously observed `b8f2d4e6a901` state; preserve original row counts, IDs, relationships, and critical XP/battle/application/placement records.
5. **Existing PostgreSQL:** use restored snapshots or synthetic schema profiles for each supported revision; do not claim compatibility without a real disposable PostgreSQL run.
6. **Historical coverage:** for every revision/profile declared supported, use a real restored historical snapshot where available or a documented fixture whose schema and metadata actually represent that revision. Do not use `stamp` to manufacture test state. Unsupported or unrepresented revisions must be reported as unsupported and fail closed.
7. **Schema fidelity:** compare full tables/columns/types/nullability/defaults/PKs/FKs/unique/check constraints/indexes and dialect-specific objects to a versioned target manifest. Alembic autogenerate output alone is insufficient.
8. **Data and behavior:** record row counts/key-set checks and critical-record invariants before/after; run backend persistence and relevant application integration tests against the disposable target; verify startup after migration.
9. **Failure/recovery:** inject migration failure at reversible and non-transactional boundaries; prove transaction behavior, fail-closed runner status, accurate diagnostics, and restore procedure on a separate target.
10. **Operational approval:** independent migration review, verified backup restore, maintenance/lock plan, database identity check, abort thresholds, and explicit production authorization. No automatic retry or success-shaped fallback.

Required production approval gate: all tests above pass for the database engines actually deployed; no unresolved schema differences/conflicts; exactly one active head; backup restore is proven; protected data invariants are preserved; the new runner refuses unknown state; and a reviewed deployment/rollback plan is signed off. Failure of any gate blocks rollout.

## 10. Risks and unresolved questions

- What exact PostgreSQL major version and extensions are used by Render/Neon? Not inspected or verified here.
- Which schema/revision state is currently deployed in production? Unknown; no production access was made.
- Are all local tables and the seven conflicting tables app-owned, and are there unmodeled triggers/views/indexes? Prior report does not establish full object ownership.
- What are all historical field types and values in `company_skill_requirements.company_id`, and can they be mapped to current company IDs without ambiguity? Unverified.
- Which databases have already applied `b0c9e2a7f1d4` and therefore may have lost duplicate XP rows? The current schema cannot restore deleted historical rows; preserve what remains and do not replay that deletion.
- How many database variants exist beyond the known `b8f2d4e6a901` local state? Unknown.
- The legacy graph has guarded migrations whose successful revision record can coexist with missing/partial objects; unsupported drift must be blocked rather than inferred.
- A new active version table creates an epoch boundary. Deployment, observability, database ownership, backup retention, and old-runner rollback semantics must be coordinated; a code rollback is not assumed safe after schema cutover.
- The complete target schema must include model metadata and migration-only objects; missing model imports or hand-managed objects would invalidate the baseline.

## 11. Proposed Phase 3.2 implementation sequence

1. Inventory all supported database identities, revision rows, full schemas, critical data invariants, and deployed engine versions using separately authorized read-only access or isolated restored copies.
2. Define and review the canonical target schema manifests for SQLite and PostgreSQL; reconcile model registration and explicitly include migration-managed objects.
3. Define a support matrix by old revision, dialect, and actual schema fingerprint. Mark all untested states unsupported.
4. Specify exact baseline behavior for empty databases and each supported existing profile, including every conversion/backfill and stop condition. Preserve extra/unowned objects.
5. Implement the separate epoch script location, config, new active version table, explicit baseline, transition audit, preflight, and runner. Preserve all old migration files and legacy version records.
6. Build isolated SQLite and PostgreSQL fixtures/restores. Run fresh and historical profile tests, failure injection, integrity/data-preservation checks, and application startup/persistence tests.
7. Run independent review and signoff. Prepare a backup restore rehearsal and staged deployment plan. Stop if any profile or operation is ambiguous.
8. Request separate authorization before applying anything to the original local database or production, changing deployment configuration, deploying, or retiring legacy history.

### Files expected to change in Phase 3.2

Proposed scope; final list depends on the reviewed implementation:

- New `backend/alembic_epoch2.ini`.
- New `backend/alembic_epoch2/env.py`, migration template, and versioned baseline/follow-up revisions.
- `backend/run_migrations.py` to select and validate the new active lineage without changing application startup semantics.
- `backend/app/database/migration_state.py` and `backend/app/database/migration_preflight.py` to report full schema profiles and proposed operations instead of relying on table-only static analysis.
- `backend/tests/test_migration_state.py` and `backend/tests/test_migration_preflight.py`; new disposable SQLite/PostgreSQL migration integration tests and schema-profile fixtures.
- `backend/docs/ALEMBIC_MIGRATION_ARCHITECTURE.md` plus operator backup/recovery/deployment documentation.
- `backend/entrypoint.sh` and container copy/build configuration only if the new runner or script directory requires invocation/packaging changes.
- `backend/app/models/__init__.py` only if a verified target-manifest audit finds missing model registration.

Historical files under `backend/alembic/versions/`, the original SQLite database, production data/configuration, authentication, and dashboard/XP business logic are explicitly out of scope unless separately authorized.

## 12. Inspections performed in Phase 3.1

- Static reads of `backend/alembic.ini`, `backend/alembic/env.py`, all 26 files under `backend/alembic/versions/`, `backend/run_migrations.py`, `backend/app/database/migration_state.py`, `backend/app/database/migration_preflight.py`, database configuration, model registration, migration tests, entrypoint, and existing architecture documentation.
- `alembic heads` — exit 0; one head, `47292a2a50d2`.
- `alembic history --verbose` — exit 0; parent graph listed in §3.1.
- No migration application (`upgrade`/`stamp`), DDL, or migration tests were run in this design-only phase. The `heads`/`history` graph queries above do not apply migrations. PostgreSQL compatibility and production schema remain unverified.
