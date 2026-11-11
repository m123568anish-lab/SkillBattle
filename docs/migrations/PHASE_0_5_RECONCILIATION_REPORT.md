# Phase 0.5 Reconciliation Report

## Status summary

- IMPLEMENTED: evidence gathering, startup safety guard, auth regression checks, and migration-readiness documentation.
- VERIFIED: SQLite development compatibility remains intact; production PostgreSQL startup is fail-closed; identity-link protections and auth token flows remain passing.
- BLOCKED: production Neon migration activation remains closed because there is no authorized disposable PostgreSQL target and the repo still contains mixed legacy/epoch migration state.
- NOT IMPLEMENTED: any production schema mutation, data import, or automatic user reconciliation.

## Scope and constraints

This phase was read-only. We did not run `create_all()` against production, did not stamp Alembic state, and did not modify SQLite or production Neon data. Migration activation remains CLOSED.

## Evidence reviewed

- Source SQLite dataset: 1,845 users.
- Target Neon dataset: 1,847 users.
- Neon identity mappings: 68 Clerk mappings and 2 Neon identity mappings.
- Source revision: `b8f2d4e6a901`
- Repository head: `d1f5a8e7c2b4`
- Reported source schema differences: 34
- Reported pending table conflicts: 7
- Reported target legacy schema differences: 2

## User discrepancy findings

The two extra Neon account records are not straightforward duplicates or merge candidates.

1. The records are present in the target database and are not reflected in the SQLite source as matching accounts.
2. No direct source UUID or normalized-email match was identified for either target row.
3. Each extra user had a Neon identity mapping path and was active in the application context, so deletion or blind merge is not safe.
4. Identity mapping preservation is required; automatic account merging is not allowed by policy.
5. Resolution should be limited to `MATCH_EXISTING`, `MANUAL_REVIEW`, or `CONFLICT` actions, with no silent `INSERT` into source records.

## Schema drift findings

The audited repository and target still show mixed legacy/epoch state:

- 34 source migration differences remain between SQLite and the repository contract.
- 7 pending table conflicts remain in migration-state inspection.
- 2 legacy differences remain in the target schema contract.
- The migration coordinator refuses to adopt epoch mode while legacy and epoch state are mixed.

This is not a safe state for production migration activation.

## Startup safety findings

The startup pathway now fails closed for PostgreSQL:

- `backend/app/database/init_db.py` checks PostgreSQL schema readiness without mutating it.
- `backend/app/main.py` invokes the compatibility check during startup.
- If the target is not eligible for migration, startup raises a runtime error instead of creating or repairing schema.
- SQLite development/test repair remains allowed, preserving local compatibility behavior.

## Required migration blocker

A safe disposable PostgreSQL target is still absent or not explicitly authorized.

Without a direct, unpooled, empty, authenticated, disposable PostgreSQL target, the migration must remain closed. The repository’s migration rules still require `MIGRATION_DATABASE_URL` to be an authorized disposable target, not production Neon.

## Next steps

1. Obtain a dedicated, empty, disposable PostgreSQL target outside production.
2. Verify the target is explicitly authorized and matches the migration gate policy.
3. Reconcile the legacy Alembic history and epoch state before any future baseline adoption.
4. Run the approved migration coordinator in a dry-run or staging-safe mode only.
5. Keep any future schema migration behind the existing authorization and validation gates.

## Final state

Production Neon was not modified. SQLite source data was not modified. Migration activation remains closed.
