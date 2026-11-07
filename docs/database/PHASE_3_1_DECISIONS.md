# Phase 3.1 — Migration Architecture Decisions

**Status:** Design decision only; no migrations or database changes authorized.

## Decision

Adopt a new, explicit Alembic schema epoch in Phase 3.2, with a separate migration script location and active version table. Keep the existing 26-revision history and its `alembic_version` rows unchanged as historical evidence.

The new baseline must:

- Create the canonical current schema through explicit versioned Alembic operations on empty SQLite and PostgreSQL databases.
- For an existing database, inspect both its recorded legacy revision and its full live schema/data invariants; apply only a reviewed, versioned reconciliation for a supported profile.
- Record only the new epoch migrations that actually execute. Preserve the old revision record and include source revision/schema-manifest provenance in a transition audit.
- Stop on unknown revisions, unsupported schema variants, ambiguous conversions, conflicting objects, duplicate keys, invalid FKs, or possible destructive effects.
- Bring both accepted paths to exactly the same new active Alembic head.

This is a controlled history transition, not a stamp: old migrations are neither claimed as executed nor replayed. A verified existing schema may need no application-table DDL, but the executed baseline must still validate its full schema and record the new epoch transition transparently.

## Rejected approaches

1. **Modify the existing root migration:** rejected because it is already-applied history and its meaning would change across databases.
2. **Add a no-op baseline or use `stamp`:** rejected because it would claim schema history without applying or verifying the corresponding operations.
3. **Merge a new baseline branch into the old head:** rejected because Alembic traverses merge ancestors, so a fresh upgrade would still execute unsafe legacy migrations.
4. **Use `create_all()` or copy a database file:** rejected because it is not an auditable Alembic history and can omit migration-only objects.
5. **Assume matching revision numbers mean matching schemas:** rejected because guards, historical defects, and out-of-band DDL can produce drift.

## Current graph decision facts

- 26 existing revisions, no branch labels, one current head: `47292a2a50d2`.
- `a9e4c1b7d602` merges three branches; `47292a2a50d2` merges `7a2b1c4d9e8f` and `b8f2d4e6a901`.
- The current merge revision is graph-only and does not reconcile schema.
- `dd495117949b` is a destructive legacy transformation and fails on an empty SQLite database.
- `c8d3f1a6b902` and `7a2b1c4d9e8f` contain unconditional table creation; table-existence guards elsewhere do not prove full schema compatibility.
- `b0c9e2a7f1d4` deletes duplicate XP rows and performs data backfills; it is not safe to replay as generic reconciliation.

## Existing databases and support policy

The known local findings (1,845 users, revision `b8f2d4e6a901`, 26 metadata differences, seven pending table conflicts, and `company_skill_requirements.company_id` type mismatch) are previous inspection evidence, not a new database connection in Phase 3.1. Neon/Render remain uninspected.

Phase 3.2 must define a per-engine, per-revision support matrix. Only states with tested schema profiles and data-preserving plans are supported. Unknown or partially matching states stop for manual review. Existing table rows are preserved; no automatic table drops/recreation, silent deduplication, or inferred history is allowed.

## Convergence rule

```text
empty DB ── explicit epoch baseline ─┐
                                     ├── same forward migrations ── EPOCH_HEAD
verified existing DB ─ reconciliation┘
```

The old revision history remains archived. The new head is authoritative only after its baseline and all subsequent migrations actually execute and post-migration schema/data validation passes.

## Acceptance gate

Do not approve Phase 3.2 for deployment until fresh SQLite and disposable PostgreSQL installs, each declared existing schema profile, schema-to-manifest comparison, FK and critical data checks, app startup/persistence, injected migration failures, and backup restoration all pass. Verify one active head and a fail-closed response for every unsupported state. Production requires separate read-only assessment, verified backup/restore, explicit rollout authorization, and an approved operations plan.

## Phase boundary

Phase 3.1 did not run `upgrade`, `stamp`, `create_all()`, migration application, or schema-changing SQL; it did not connect to the original SQLite database, Neon, Render, or other production resources. Static `alembic heads` and `alembic history --verbose` graph queries were run. The phase did not modify historical migration files, application runtime behavior, deployment settings, commit, or push.
