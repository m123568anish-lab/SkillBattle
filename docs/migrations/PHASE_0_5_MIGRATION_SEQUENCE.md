# Phase 0.5 Migration Sequence

## Current block

The repository is not yet in a safe migration state. Mixed legacy/epoch state prevents epoch adoption, and the target database is neither explicitly disposable nor ready for migration execution.

## Minimum safe sequence to prepare for future migration

1. Freeze the current state
   - Keep production Neon unchanged.
   - Keep SQLite source unchanged.
   - Preserve the verified backup.
   - Keep migration activation CLOSED.

2. Reconcile legacy Alembic history
   - Review the source revision `b8f2d4e6a901`.
   - Align the repository state to the expected head `d1f5a8e7c2b4`.
   - Resolve pending migration conflicts before proceeding.

3. Eliminate mixed legacy/epoch state
   - Clear the epoch/legacy mismatch identified by migration-state checks.
   - Ensure the migration coordinator can classify the database state without ambiguity.

4. Prepare a clean disposable target
   - Provision an empty PostgreSQL target outside production.
   - Validate direct/unpooled credentials and SSL.
   - Confirm the target is safe for dry-run migrations.

5. Run migration preflight only
   - Verify identity mappings and schema compatibility.
   - Confirm no destructive schema mutation is possible without explicit authorization.

6. Execute approved migration workflow
   - Only after migration gates are satisfied.
   - Only against the authorized disposable target.
   - Preserve source and target row counts and checksums.

## Why epoch adoption is blocked

The app contains mixed legacy and epoch state. The code explicitly refuses to adopt epoch behavior when the current database state is ambiguous. This is intentional safety logic and prevents silent migration drift.

## Final note

This sequence is the minimum safe path. It does not create a competing migration framework or fabricate a baseline. The repository remains in the read-only safety phase until the migration gates are satisfied.
