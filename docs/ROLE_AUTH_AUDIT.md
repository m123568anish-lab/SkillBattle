# Role-Based Account Architecture Audit

Audit snapshot: 2026-09-28, before the initial security changes documented at the end of this file.

## Scope and Active Application

- `backend/app/main.py` builds the FastAPI application and `backend/app/core/router_registry.py` registers its routers.
- `frontend/src` is the frontend used by `start-dev.ps1` and the root Docker Compose stack. The separate top-level `src` tree contains divergent, newer UI code and is not used by that startup path.
- College and company APIs are mounted both at `/college` and `/api/v1/college`, and at `/company` and `/api/v1/company`. Authentication is similarly mounted at the root and under `/api/v1`.

## Authentication and Identity

- The canonical auth routes are in `backend/app/modules/auth/router.py`; the separate `backend/app/api/auth.py` is not the router registered by the application.
- JWTs identify the user by subject. `get_current_user` reloads that user from the database and rejects pending, rejected, suspended, and disabled accounts. Refresh tokens are persisted and revocable.
- Passwords are hashed using the existing asynchronous auth service. Registration accepts `account_type`, but assigns `role="student"` for all account types. College/company signup requests are marked `PENDING_VERIFICATION`; they do not get privileged roles through the registration payload.
- Login accepts a client-supplied `role` and compares it to the stored role as a portal-selection check. It does not grant that role, but it is not needed for authentication and creates a misleading role-selection contract.
- `User` already has `role`, `account_type`, `requested_role`, `status`, `is_verified`, and `is_active`, but has no `organization_id`. Account type and organization role are not consistently modeled as separate concepts.

## Organization Data and Authorization

- College data is represented by `College`, `Department`, `Batch`, `CollegeStudent`, and assessment models. A college owner association is stored as `College.admin_user_id`; student membership is stored separately in `CollegeStudent`. There is no college staff membership/invitation model.
- Company data is represented by `Company`, `CompanyMember`, `JobPosting`, and application models. `CompanyMember.role` is a free-form string, and a user can have only one company membership.
- College and company route handlers use scattered role-name checks. `core/security/permissions.py` has a simple role checker, not the requested named permission system.
- Service queries generally scope organization data through the current user's membership. This is a useful base, but role checks and organization-status checks are inconsistent across endpoints.
- College registration is unauthenticated. It creates a pending organization and administrator when the email is new, but currently changes an existing user's account type, requested role, status, and verification state if their email is supplied.
- There is a platform-admin company approval route. Approval changes only `Company.status`; it does not activate/promote the pending owner. There is no equivalent college approval route.

## Frontend Routes and Views

- The active frontend has a single general-purpose registration form and redirects successful login to `/dashboard` or `/onboarding` without account-type routing.
- The active `frontend/src` tree has no college/company route groups or API service clients. The separate top-level `src` tree contains partial company/college pages, guards, and clients, but it differs from the deployed frontend and is not a safe drop-in replacement.
- Existing student battle/practice/AI and profile functionality should remain on the current student application path; it should not be replaced by portal-level UI changes.
- Frontend route guards are not a security boundary. Backend authorization remains mandatory.

## Schema, Migrations, and Test Baseline

- SQLAlchemy models are the runtime schema source for `init_db()`, which creates tables and repairs older installations. The repair path adds `account_type` and `requested_role` to older `users` tables.
- Alembic has an existing migration history, but the checked-in migrations do not add `account_type` or `requested_role`; `backend/alembic/env.py` also imports only part of the model set and omits the college/company models. A production schema change must therefore use a deliberate additive migration and include the affected models in Alembic metadata.
- No account seed fixtures were found; existing tests create accounts dynamically. College and company tests cover basic organization workflows, and company tests manually promote a platform admin.
- Baseline check `pytest -q backend/tests/api/test_security_registration.py backend/tests/api/test_college.py` currently reports 1 passed and 2 failed. The failures are contradictory test expectations: pending college registration is expected to log in, and a newly registered college is expected to be verified. Both contradict the requested verification gate.

## Safest Implementation Sequence

1. Prevent organization registration from modifying an existing user identity; add regression coverage.
2. Make organization approval an explicit platform-admin action that activates the owner and assigns the verified organization role atomically.
3. Introduce named backend permissions and enforce them at API/service boundaries, retaining existing organization-scoped queries.
4. Add additive migrations for any new persisted membership/invitation data and backfill legacy roles without deleting or recreating user records.
5. Build the three registration workflows and role-aware routing in the active `frontend/src` tree, then add invitation and join-request flows.

The repository currently has no shared organization-membership abstraction or invitation lifecycle. Those should be added additively; existing IDs, credentials, and student activity tables must remain untouched.

## Initial Security Changes

- College registration now rejects an administrator email that already belongs to a user, preventing the public endpoint from changing an existing account.
- Platform-admin-only college review endpoints are available at `GET /college/admin/colleges/pending` and `PATCH /college/admin/colleges/{college_id}/status`. Approval activates the owner and assigns `college_admin`; rejection keeps the account blocked.
- Company approval now activates the registered owner and assigns `company_admin`. Rejection and suspension propagate to the owner account status.
- Registration/organization tests now assert that pending organizations cannot log in or access management APIs, and that trusted roles are assigned only after approval.
- Validation: the focused authentication, college, company, and ecosystem test set passes (8 tests). Python diagnostics found no errors.

These changes establish the verification gate only. The active frontend still needs a deliberate portal implementation, and invitations, join requests, permission-based route enforcement, and a complete migration/backfill remain unimplemented.