# Qubira Phase 3A — Supabase Schema Deployment Validation

## Status
This phase was prepared in a safe, read-only manner. No live Supabase connection was attempted because there are no valid local target credentials configured yet (`SUPABASE_DATABASE_URL` / `SUPABASE_PROJECT_ID` / `SUPABASE_SERVICE_ROLE_KEY` are unset).

## Preconditions checked
- Required environment variables were checked without exposing secrets.
- Result: not configured locally.
- Target project identity: not available; no Supabase project is configured locally for this deployment.
- Deployment gate: blocked until valid credentials are installed locally and the target database is explicitly verified.

## Repository Alembic state
The repository’s authoritative migration graph is derived from the checked-in Alembic revisions rather than a duplicated hardcoded constant.

Resolved repository head:
- `47292a2a50d2` — merge migration head

Verification logic:
- The Alembic script directory is inspected directly and the single remaining head is resolved dynamically.
- The resulting head is then checked against the approved revision value only when `APPROVED_ALEMBIC_REVISION` or `ALEMBIC_APPROVED_REVISION` is set.

Migration graph details:
- `47292a2a50d2` revises `7a2b1c4d9e8f` and `b8f2d4e6a901`
- `7a2b1c4d9e8f` is a valid branch parent (`add_placement_catalog`)
- `b8f2d4e6a901` is a valid branch parent (`add_opportunity_lifecycle_and_saves`)
- The repository is already in the merged state; the previous branch revisions are ancestors, not the final repository head.

This means the repository already contains the Alembic merge fix and should not be treated as a pre-merge multiple-head state.

## Expected deployment workflow
1. Add valid local target credentials for the new Supabase project.
2. Confirm the target database is reachable with a masked connectivity check.
3. Inspect `information_schema` and Alembic metadata in the target database.
4. Refuse deployment if unexpected application tables or data are present.
5. Review Alembic upgrade SQL (`alembic upgrade head` with SQL output) before execution.
6. Validate the target database schema against the SQLAlchemy model registry.
7. Run the repository’s Alembic migration system to deploy schema only.
8. Stop after schema validation, without data migration or auth migration.

## Safety/guardrails
The following were intentionally not done:
- No SQLite import.
- No auth-user import.
- No password or token migration.
- No Clerk or Render changes.
- No destructive migration.
- No live database writes.
- No traffic switching.

## Conclusion
Phase 3A is ready to proceed only once a valid, empty Supabase target is created and its local credentials are configured. At the moment, the required target is not available, so a live deployment cannot be safely executed.
