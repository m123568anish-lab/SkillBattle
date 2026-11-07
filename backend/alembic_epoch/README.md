# Inactive schema epoch scaffold

This directory is intentionally separate from the legacy Alembic history.
There are no revisions, no baseline, and no application-startup integration.

The environment refuses database access unless
`QUBIRA_EPOCH_SCAFFOLD_ACTIVE=1` is explicitly supplied together with
`QUBIRA_EPOCH_DATABASE_URL`. This guard is not an activation or deployment
mechanism; future epoch work must first complete the approved schema design,
locking integration, PostgreSQL validation, and migration acceptance checks.
