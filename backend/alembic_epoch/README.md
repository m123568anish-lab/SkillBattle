# Separate epoch migration lineage

The epoch lineage is separate from the legacy Alembic history. Its configured
version table is `alembic_version_epoch`; the legacy lineage uses
`alembic_version`.

## Frozen epoch baseline

`versions/094cdd2eab54_create_postgresql_epoch_baseline.py` is a tracked,
root revision (`down_revision = None`) and the sole current epoch head. It is a
frozen PostgreSQL schema snapshot, not the current legacy Alembic revision and
not proof that any external database has this schema.

The legacy Alembic lineage is configured by `../alembic.ini` and currently has
head `f9a1b2c3d4e5`. Current SQLAlchemy metadata contains 80 tables. The frozen
epoch baseline defines 77; it predates the placement-intelligence additions
`placement_jobs`, `placement_source_records`, and
`placement_inventory_targets`.

## Placement revision status

The placement revision
`../alembic/versions/f9a1b2c3d4e5_add_placement_jobs_and_question_provenance.py`
is a child of legacy revision `d1f5a8e7c2b4`, not an epoch revision. Repository
history records it as unapplied to staging. This file does not establish the
revision state of any live database; verify the intended database with the
approved read-only preflight before requesting migration approval.

## Execution and rollback safety

API startup performs schema preflight and does not apply migrations. Epoch
execution is a separate coordinated path in `run_migrations.py`; direct
Alembic execution is blocked by the epoch environment. This README does not
authorize or activate that path.

The epoch baseline's `downgrade()` is explicitly disabled. The placement
revision's `downgrade()` drops its three tables and 17 question columns, so it
can destroy generated inventory and provenance data. Do not treat downgrade
as an automatic or lossless rollback.

No staging or production migration was run during this repository review.
Repository files alone cannot certify the historical revision state of either
external database. Production must remain outside the scope of this lineage
review.
