# Phase 11 — Migration History Reconciliation and Production Credential Audit

**Review scope:** repository-only, read-only investigation. No migration runner,
`--staging-execute`, production/staging connection, DDL, deployment, credential
read, or Render-service change was performed.

## 1. Executive summary

Proven facts from this checkout:

- The legacy Alembic lineage has 30 revision files and one head:
  `f9a1b2c3d4e5`.
- The separate epoch lineage has one tracked root/head:
  `094cdd2eab54`. It is a frozen PostgreSQL schema snapshot, not the parent of
  the legacy lineage and not evidence that any external database has been
  stamped or migrated.
- The epoch baseline source contains 77 `op.create_table` calls. Current
  SQLAlchemy metadata contains 80 tables. The three additional tables are the
  placement tables added by legacy revision `f9a1b2c3d4e5`.
- That placement revision adds 17 `questions` columns. It backfills only
  `question_kind`, `verification_status`, `approval_status`, and
  `lifecycle_state`; the other fields receive DDL defaults or remain nullable.
- The repository does not contain the alleged 44-item comparison output,
  sanitized catalog snapshot, or baseline database. The 44 differences cannot
  be reproduced safely and completely from the checked-in evidence without
  either executing a migration or obtaining a disposable database/snapshot.
  This report therefore does not fabricate a 44-item list or claim that all
  differences are explained.
- `MIGRATION_DATABASE_URL` is declared on the production worker in
  `render.yaml`, but the worker's import/startup path does not read it for
  normal queries and does not import a migration runner. It is required by the
  separately invoked Alembic/epoch utilities, not by
  `python -m app.workers.placement_job_worker`. It is safe to consider removing
  it from the worker only after separate operator approval; it was not removed.

The primary unresolved blockers are the missing historical 44-difference
artifact and the absence of a sanitized, disposable PostgreSQL schema snapshot
that can establish actual live revision state.

## 2. Actual Alembic revision graph

The graph was loaded with `ScriptDirectory` without running revisions.

```text
dd495117949b
  -> bb9cc66e4c08 -> c4f8a1d2e6b7 -> e7b2c9d4f1a6
  -> f2a8c1d9e4b7 -> a1b2c3d4e5f6 -> b7c9d2e1f4a6
  -> 4a6e8c2d1f30 -> b0c9e2a7f1d4 -> 5c7e9a1d3f42
  -> d9f8e7c6b5a4
       ├─ e3f1a9c2d7b4 -> a4d5b6c7e8f9 ─┐
       ├─ c1f4a8d2e9b0 ─────────────────┤
       └─ 5d9e1f1a7c66 ────────────────┘
          └─ a9e4c1b7d602 (three-parent merge)
             ├─ b8f2d4e6a901 ───────────┐
             └─ c8d3f1a6b902 -> 1c9f26ee5924
                -> 3e7f2c1a9b44 -> 4f2a7c9e1b6d
                -> e8c1b2a3f4d5 -> f1a2b3c4d5e6
                -> 6e1c2d3f4a5b -> 7a2b1c4d9e8f ─┤
                                                   v
                                      47292a2a50d2 -> a14c6e8d2b37
                                      -> c9b0f2d5a713 -> d1f5a8e7c2b4
                                      -> f9a1b2c3d4e5 (legacy head)
```

The epoch graph is independent:

```text
094cdd2eab54 (epoch root and epoch head)
```

The frozen epoch revision is [094cdd2eab54_create_postgresql_epoch_baseline.py](./alembic_epoch/versions/094cdd2eab54_create_postgresql_epoch_baseline.py).
The legacy template is [script.py.mako](./alembic/script.py.mako), and the
legacy environment is [env.py](./alembic/env.py). Both environments block
ordinary offline execution; the epoch environment additionally requires the
coordinated ownership lease.

### Revision inventory

The following table records every legacy revision, its parent, purpose, schema
impact, and review status. Paths are relative to `backend`.

| Revision | Parent | Purpose / schema impact | Status |
|---|---|---|---|
| `dd495117949b` | `None` | Historical transformation: user changes, refresh tokens/resumes, legacy drops. | Historical root; not a clean-install baseline. |
| `bb9cc66e4c08` | `dd495117949b` | Adds `user_skill_stats`. | Recorded legacy revision. |
| `c4f8a1d2e6b7` | `bb9cc66e4c08` | Adds `xp.daily_xp`. | Recorded legacy revision. |
| `e7b2c9d4f1a6` | `c4f8a1d2e6b7` | Adds `daily_challenges.xp_reward`. | Recorded legacy revision. |
| `f2a8c1d9e4b7` | `e7b2c9d4f1a6` | Adds battle questions, submissions, stats, settings. | Recorded legacy revision. |
| `a1b2c3d4e5f6` | `f2a8c1d9e4b7` | Adds matchmaking matches and placement prep sessions. | Recorded legacy revision. |
| `b7c9d2e1f4a6` | `a1b2c3d4e5f6` | Adds `questions.topic_tags`. | Recorded legacy revision. |
| `4a6e8c2d1f30` | `b7c9d2e1f4a6` | Adds profile onboarding preferences. | Recorded legacy revision. |
| `b0c9e2a7f1d4` | `4a6e8c2d1f30` | XP cleanup/unique index and battle-result lifecycle changes. | Data backfill; review before execution. |
| `5c7e9a1d3f42` | `b0c9e2a7f1d4` | Adds/backfills `users.onboarding_completed`. | Data backfill. |
| `d9f8e7c6b5a4` | `5c7e9a1d3f42` | Adds unified assessment and skill-profile tables. | Recorded legacy revision. |
| `e3f1a9c2d7b4` | `d9f8e7c6b5a4` | Adds notifications and related entity fields. | Downgrade intentionally blocked. |
| `a4d5b6c7e8f9` | `e3f1a9c2d7b4` | Adds audit logs and organization/entity context. | Downgrade intentionally blocked. |
| `c1f4a8d2e9b0` | `d9f8e7c6b5a4` | Adds adaptive battle ownership and question exposure history. | Recorded legacy revision. |
| `5d9e1f1a7c66` | `d9f8e7c6b5a4` | Adds skill evidence and company skill requirements. | PostgreSQL cast requires review. |
| `a9e4c1b7d602` | three parents | Merge; no schema operation. | Graph merge. |
| `b8f2d4e6a901` | `a9e4c1b7d602` | Adds opportunity lifecycle/saves/application history. | Downgrade index/constraint mismatch noted. |
| `c8d3f1a6b902` | `a9e4c1b7d602` | Adds quest map levels and progress. | Recorded legacy revision. |
| `1c9f26ee5924` | `c8d3f1a6b902` | Adds battle session lifecycle fields. | Recorded legacy revision. |
| `3e7f2c1a9b44` | `1c9f26ee5924` | Adds Clerk identity to users. | Recorded legacy revision. |
| `4f2a7c9e1b6d` | `3e7f2c1a9b44` | Adds password reset tokens. | Recorded legacy revision. |
| `e8c1b2a3f4d5` | `4f2a7c9e1b6d` | Aligns company skill requirement ID type. | PostgreSQL-specific cast noted. |
| `f1a2b3c4d5e6` | `e8c1b2a3f4d5` | Adds XP ledger. | Recorded legacy revision. |
| `6e1c2d3f4a5b` | `f1a2b3c4d5e6` | Adds daily practice sessions. | Recorded legacy revision. |
| `7a2b1c4d9e8f` | `6e1c2d3f4a5b` | Adds placement companies, tracks, and rounds. | Unconditional table creation; conflict risk. |
| `47292a2a50d2` | `7a2b1c4d9e8f`, `b8f2d4e6a901` | Merge; no schema operation. | Graph merge. |
| `a14c6e8d2b37` | `47292a2a50d2` | Adds Neon identity fields/indexes. | Recorded legacy revision. |
| `c9b0f2d5a713` | `a14c6e8d2b37` | Records assessment-submission composite index. | Historical index adoption marker. |
| `d1f5a8e7c2b4` | `c9b0f2d5a713` | Reconciles battle-room ownership schema. | Conditional historical reconciliation. |
| `f9a1b2c3d4e5` | `d1f5a8e7c2b4` | Adds placement job/source/inventory tables and 17 question provenance columns. | Untracked at review start; current legacy head; not epoch. |

The exact source path for each row is
`alembic/versions/<revision>_*.py`; the full filenames are enumerated by the
repository in [backend/alembic/versions/](./alembic/versions/).

## 3. The alleged 44-difference comparison

### Reproduction result

**Not reproducible from the repository-only evidence.** `migration_preflight.py`
compares a live inspected connection to `Base.metadata` using Alembic
`compare_metadata`; it does not compare the epoch migration source directly to
the models. No sanitized PostgreSQL catalog, schema dump, JSON preflight output,
or historical 44-item output is checked in. Executing the epoch migration to
manufacture a reference database was prohibited, and no persistent or external
database was contacted.

Consequently, an exact 44-row table with historical and current definitions
would be fabricated unless the following evidence is supplied:

1. A disposable PostgreSQL database or schema-only catalog dump representing
   the frozen baseline, including columns, types, nullability, defaults,
   indexes, constraints, and foreign keys; or
2. The original credential-free preflight JSON containing all 44 entries.

### Evidence-backed categories and known items

| Category | Evidence currently available | Assessment / action |
|---|---|---|
| A. Expected placement additions | Three model tables and three `op.create_table` calls in `f9a1b2c3d4e5`. | Expected additions after the frozen 77-table snapshot. |
| B. Expected question provenance additions | Seventeen `batch_op.add_column` calls in `f9a1b2c3d4e5`. | Expected historical additions, subject to the nullability/default mismatch below. |
| C. Other documented historical changes | Legacy revision source and [ALEMBIC_MIGRATION_ARCHITECTURE.md](../docs/ALEMBIC_MIGRATION_ARCHITECTURE.md). | Documented, but not evidence of any live database state. |
| D. Unexplained model/history drift | `failure_reasons` is nullable in the placement migration but non-nullable in the current model; current model client defaults and migration server defaults also differ for several fields. | Potential drift; obtain disposable PostgreSQL comparison before correction. |
| E. Potential destructive/incompatible changes | Placement downgrade drops three tables and 17 columns; historical root performs unconditional drops; some legacy revisions contain raw backfills and PostgreSQL-specific casts. | Treat as blocked/high risk; no downgrade or migration was run. |

The known placement/provenance objects account for the requested themes, but not
for an unverified total of 44 Alembic autogenerate entries. The report leaves
the remaining count explicitly unresolved.

## 4. 77-versus-80 table reconciliation

The frozen epoch source contains 77 table creation statements. Current
`Base.metadata.tables` contains 80 names. Static set reconciliation is:

- Baseline-only: none established from the source/model set comparison.
- Model-only: `placement_jobs`, `placement_source_records`,
  `placement_inventory_targets`.
- Introduced by later legacy revision: the same three tables, in
  `f9a1b2c3d4e5`.
- Present in both sets: the remaining 77 names.

This proves the three placement tables are expected additions relative to the
frozen baseline. It does not prove that they exist in staging or production.

### Placement definitions

| Table | Model definition | Migration creation | Relationships / constraints |
|---|---|---|---|
| `placement_jobs` | Integer identity key; job/status/idempotency/payload/result/retry/worker/lock/timestamps. | `f9a1b2c3d4e5`, `op.create_table("placement_jobs", ...)`. | Unique `idempotency_key`; no foreign key. |
| `placement_source_records` | Integer identity key; unique source URL; classification, company, role, content, topics, license, processing state. | Same revision, `op.create_table("placement_source_records", ...)`. | Unique `source_url`; company and role indexes; no foreign key. |
| `placement_inventory_targets` | Integer identity key; company/role/topic/difficulty/question type and target/current counts. | Same revision, `op.create_table("placement_inventory_targets", ...)`. | Company and difficulty indexes; no foreign key. |

The source model is [placement_jobs.py](./app/models/placement_jobs.py), and
the migration is [f9a1b2c3d4e5_add_placement_jobs_and_question_provenance.py](./alembic/versions/f9a1b2c3d4e5_add_placement_jobs_and_question_provenance.py).

## 5. The 17 question provenance columns

The historical baseline `questions` definition ends with the original content,
validation, activity, and `created_at` fields. Revision `f9a1b2c3d4e5` adds the
following columns:

| Column | SQLAlchemy type | Nullability | Migration default / model default | Index / constraint | Backfill / assessment |
|---|---|---:|---|---|---|
| `source_url` | `String(500)` | false | `''` / `''` | none | Existing rows receive empty value; provenance remains unknown. |
| `source_classification` | `String(60)` | false | `existing-inventory` / same | model and migration index | Safe DDL default; indexed. |
| `company` | `String(120)` | false | `''` / `''` | model and migration index | Safe DDL default; indexed. |
| `role` | `String(120)` | false | `''` / `''` | model and migration index | Safe DDL default; indexed. |
| `assessment_round` | `String(80)` | false | `''` / `''` | model and migration index | Safe DDL default; indexed. |
| `question_kind` | `String(40)` | false | `mcq` / `mcq` | model and migration index | Backfilled from normalized `question_type`, fallback `mcq`. |
| `topic` | `String(120)` | false | `''` / `''` | model index | Safe DDL default; no migration index in source. |
| `subtopic` | `String(120)` | false | `''` / `''` | model index | Safe DDL default; no migration index in source. |
| `original_publish_date` | `String(30)` | true | none / none | none | Existing rows remain null; safe. |
| `license` | `String(300)` | false | `''` / `''` | none | Safe DDL default. |
| `verification_status` | `String(40)` | false | `approved` / `approved` | model index | Backfilled to `approved` only when active and validated, otherwise `needs_review`. |
| `approval_status` | `String(40)` | false | `approved` / `approved` | model index | Same approval backfill; no separate provenance evidence. |
| `lifecycle_state` | `String(40)` | false | `PUBLISHED` / `PUBLISHED` | model index | Backfilled to `PUBLISHED` only when active and validated, otherwise `NEEDS_REVIEW`. |
| `duplicate_of_id` | `Integer` | true | none / none | model and migration index | No backfill; safe null. No FK is declared. |
| `failure_reasons` | `JSON` | migration true; model false | none in migration / Python `list` | none | **Unresolved drift:** model requires non-null while migration permits null. |
| `canonical_hash` | `String(128)` | false | `''` / `''` | model and migration index | Safe DDL default but does not compute hashes or deduplicate existing rows. |
| `reuse_permission` | `String(220)` | false | `''` / `''` | none | Safe DDL default; no policy backfill. |

The migration backfill preserves existing rows but does not establish complete
provenance, canonical hashes, deduplication, or source licensing. Those are
semantic risks, not reasons to alter the migration without a disposable
PostgreSQL test and explicit approval.

## 6. README/documentation reconciliation

The root [README.md](../README.md) contains setup/deployment guidance but does
not provide an authoritative Alembic baseline statement. The specialized
[alembic_epoch/README.md](./alembic_epoch/README.md) already states the intended
meaning: `094cdd2eab54` is a frozen historical epoch snapshot, the legacy head
is separate, placement is a legacy revision, and no staging/production
migration is certified.

No README edit was made in this phase because the available documentation
already makes the required distinction. One stale statement remains in
[ALEMBIC_MIGRATION_ARCHITECTURE.md](../docs/ALEMBIC_MIGRATION_ARCHITECTURE.md):
it says there are 29 legacy revisions and names `d1f5a8e7c2b4` as head. The
current checkout has 30 and head `f9a1b2c3d4e5`. This report records the fact;
the architecture document was not edited because it is already an existing
user change/context file and the task prohibited broad documentation edits.

There is no repository evidence that any migration has run in staging or
production. The placement README's statement that its revision is recorded as
unapplied to staging is repository documentation, not an external database
observation.

## 7. Production worker migration credential audit

### Import and startup sequence

`python -m app.workers.placement_job_worker` imports:

1. `app.database.session.AsyncSessionLocal`;
2. `app.modules.placement.job_service.placement_job_service`;
3. placement models/services and AI provider dependencies.

It then calls `asyncio.run(main())`, polls `run_once()`, and uses the async
application session. The worker does not import [run_migrations.py](./run_migrations.py),
`app.database.staging_migration`, Alembic `command`, or epoch execution code.
No worker startup hook, health check, or normal job path invokes a migration.

`app.database.session` derives its async engine from `settings.ASYNC_DATABASE_URL`.
In production, settings normalizes that from the application `DATABASE_URL` when
needed. `MIGRATION_DATABASE_URL` is not used by this module or the placement
worker.

### Credential findings

| Question | Finding |
|---|---|
| Does the worker read `MIGRATION_DATABASE_URL`? | No direct read. Settings loads the optional field, but the worker's session engine does not select it. |
| Is it required by worker imports/startup/health checks? | No. It is required only when the separate migration environments/utilities are explicitly invoked. |
| Can the worker accidentally invoke migrations? | No path was found in the worker import/startup sequence. The migration runner requires explicit execution and additional coordination guards. |
| Does normal application work use the direct endpoint? | The worker uses `DATABASE_URL`/`ASYNC_DATABASE_URL`; it does not use the migration URL. Whether `DATABASE_URL` itself is a direct or pooled endpoint is an operator configuration fact not visible here. |
| Is a separate least-privilege application credential configured? | Not provable from repository files. Render marks both values `sync: false`; secret values and effective Render inheritance were not inspected. |
| Is the credential inherited, duplicated, or unused? | The worker declaration duplicates the variable name from the API service. Its worker-side use is unused; actual secret inheritance/value cannot be established offline. |

**Recommendation:** `MIGRATION_DATABASE_URL` is **required only for a separate
process**, namely an explicitly coordinated migration/preflight operation. It is
unused by the placement worker and could be removed from that worker after
approval, but no Render configuration or credential was changed in this phase.
The API/migration process must retain an approved direct migration credential
until the migration architecture is formally changed.

## 8. Tests and validation

All commands were local and used the repository's disposable test harness.

| Check | Result |
|---|---|
| Alembic legacy graph load | Passed: 30 revisions, head `f9a1b2c3d4e5`. |
| Epoch graph load | Passed: 1 revision, head `094cdd2eab54`. |
| Focused migration/preflight/state/database-url/provenance tests | Passed: 48; skipped: 2 PostgreSQL fixture tests; failed: 0. |
| Python syntax compilation (`app`, `alembic`, `alembic_epoch`, `run_migrations.py`) | Passed, exit code 0. |
| `git diff --check` | Passed, exit code 0. |
| Persistent PostgreSQL, staging, or production migration | Not run. |
| Epoch runner / `--staging-execute` | Not run. |

The two skipped tests require a disposable loopback PostgreSQL 18.6 fixture.
No attempt was made to substitute a persistent database.

## 9. Remaining risks, blockers, and approvals

- The complete 44-difference report remains blocked by missing historical
  comparison evidence. Obtain a sanitized disposable PostgreSQL baseline
  catalog or the original credential-free JSON, then rerun only read-only
  comparison.
- The current model's non-null `failure_reasons` conflicts with the migration's
  nullable definition. This needs a separately approved schema decision; no
  migration was created.
- Model Python defaults are not equivalent to migration server defaults for
  several placement JSON/timestamp fields. PostgreSQL DDL behavior should be
  verified on a disposable fixture before approval.
- The 30-revision legacy graph and stale 29-revision architecture prose should
  be reconciled in a separately approved documentation change.
- Effective production role privileges, Render secret inheritance, and actual
  database endpoint topology require operator-provided sanitized evidence.

## 10. Safety confirmation

Production and staging were untouched. No database URL, credential, token, or
secret value was printed or read from an external service. No migration,
epoch-runner path, staging execution flag, DDL, deployment, Render-service
change, credential removal, rotation, reset, stash, discard, or broad Git
operation was performed. Existing frontend changes and untracked placement
assets were preserved.

