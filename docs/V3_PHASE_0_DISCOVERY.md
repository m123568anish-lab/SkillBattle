# SkillBattle V3 Phase 0 Discovery

**Date:** 2026-10-04  
**Phase:** V2 baseline discovery only  
**Implementation scope:** No V3 feature implementation in this audit. Findings below are source-level unless an executed test is explicitly cited.

## Executive Summary

SkillBattle has a substantial working V2 product surface: role-oriented pages, persisted users and organization records, assessments, battles, XP, notifications, audit activity, search, and deployment definitions. It is not yet a unified V3 platform foundation. Authorization is distributed across route dependencies and services; organization identity and membership are not modeled consistently across roles; several V3 workflows remain split across parallel models/services; and some unauthenticated or tenant-sensitive surfaces need security remediation before they can be considered release-ready.

The first V3 gate should be **security and tenancy triage**, not adding intelligence or monetization features. The strongest source-level concerns are the anonymous battle WebSocket, arbitrary storage-path deletion, organization-scoped assessment access controlled by caller-supplied IDs, and unauthenticated AI endpoints. Runtime exploitation was not attempted, so these are recorded as code-proven exposure paths requiring regression tests and fixes, not as a completed penetration test.

## Evidence and Limits

- Inspected the root FastAPI app, frontend App Router, model and module inventories, representative services/routers, Alembic revisions, tests, CI, Docker Compose, Render configuration, and deployment entrypoints.
- The active deployment configuration points to `backend/`: root Compose builds `./backend`, and `render.yaml` uses `rootDir: backend`. `frontend/backend/` is a second copy; its `app/main.py` differs from the root entrypoint by 36 lines. Treat the root backend as authoritative until deployment evidence says otherwise; remove or explicitly maintain the duplicate in a separately approved cleanup.
- The frontend uses Next.js App Router. The backend is a FastAPI modular monolith with async SQLAlchemy and SQLite/PostgreSQL configuration.
- This is a static architecture/security review plus test/build evidence, not a browser-based cross-role E2E run, load test, independent penetration test, or production configuration inspection. No secret-bearing `.env` files were read.
- No product code was changed for this audit. Existing local frontend edits remain uncommitted. `frontend/src/components/dashboard/Sidebar.tsx` and `frontend/src/data/dashboard.ts` were not changed.

## Subsystem Classification

| Subsystem | Status | Evidence-based V2 baseline and V3 gap |
|---|---|---|
| Frontend application | PARTIAL | `frontend/src/app/` contains student, college, company, admin, and shared feature routes. `npm run build` passed with 42 generated routes. There is no frontend test script in `frontend/package.json`; only one E2E spec was found and it is not wired into the CI workflow. |
| V2 navigation/sidebar | WORKING, PROTECTED | The standard shell uses `frontend/src/components/dashboard/Sidebar.tsx` and role metadata in `frontend/src/data/dashboard.ts`. The sidebar is intact. Mobile tabs and `DashboardLayout` quick-access groups duplicate route definitions instead of deriving all entries from one role config; Admin also has a separate shell in `frontend/src/app/admin/layout.tsx`. Do not refactor during Phase 0. |
| Authentication | PARTIAL | Password registration/login, access/refresh tokens, logout, OTP verification, and 2FA routes/services exist. `Google`/OAuth settings exist in config, but no OAuth callback/provider route was found in the active backend. `get_current_verified_user` explicitly returns the user without enforcing `is_verified`; frontend route guards are not backend authorization. |
| Role and permission model | PARTIAL | `User.role`, `account_type`, `requested_role`, `status`, and `is_superuser` drive authorization. `get_current_admin` and `require_role` exist, but checks are also repeated in routers/services. No centralized permission/resource/action engine was found. Some frontend role aliases differ from backend exact role checks. |
| Organization tenancy | PARTIAL | Company access uses `CompanyMember`, and company queries commonly constrain by the resolved company ID. Candidate visibility also checks consent/privacy flags. College ownership is primarily `College.admin_user_id` plus `CollegeStudent`; there is no common organization/membership contract shared by College and Company. No cross-organization isolation test was found. |
| Student profile and skill evidence | PARTIAL | Profile, user skill stats, assessment results, and profile-sharing preferences are persisted. Skill evaluation reads persisted evidence. A single canonical profile spanning assessment, battle, projects, certifications, interviews, and placement is not established by the inspected models. |
| College workflow | PARTIAL | College registration/approval, departments, batches, student association, and college assessments exist. Staff access uses role strings; the ownership lookup paths are not one shared membership abstraction. No complete training-to-placement workflow was found. |
| Company/hiring workflow | PARTIAL | Company verification, jobs, candidate applications, assessment assignment, privacy/consent, and shortlist checks exist. `tests/api/test_company.py` and `tests/api/test_ecosystem.py` exercise parts of a College-to-Company workflow. Interview scheduling, selection, and final hiring/placement are not demonstrated as one persisted state machine. |
| Assessment engine | PARTIAL; SECURITY BLOCKER | A unified `UnifiedAssessment`/`AssessmentAttempt` engine has persisted attempts, server-calculated timers, scoring, and skill evaluation. Separate `CollegeAssessment` and company `BattleConfig` flows also exist, so the platform does not yet have one authoritative assessment lifecycle. `tests/api/test_assessment_engine.py` covers scoring/sandbox behavior, not API tenant authorization. See Security Findings. |
| Battle engine | PARTIAL | Battle rooms, participants, submissions, results, server-side scoring, and reward idempotency are present; `tests/api/test_battle_engine.py` and `tests/modules/test_persistence_source_of_truth.py` cover key flows. WebSocket authentication/room authorization is not present in the router. |
| XP and gamification | PARTIAL | `XP` is the persisted progression record and `UserStats.xp/level` mirrors values; repository/service tests verify synchronization and battle awards. No XP ledger/transaction entity or reconciliation process was found. User registration initializes baseline XP/level/rating values in code; confirm these are explicit product starting values, not presented as measured user performance. |
| AI | PARTIAL; SECURITY/COST BLOCKER | Provider abstraction exists for Ollama/OpenAI/Gemini, with chat, roadmap, resume, interview, recommendation, and RAG routes. The active AI router has no user-auth dependency; service calls are generic request-to-provider calls without persisted user context, output provenance, usage/cost tracking, or user-level limits. The AI test file only checks `/ai/health`. |
| Notifications | WORKING, PARTIAL V3 | Notifications are persisted, per-user filtered, paginated, and support read/unread state. `tests/api/test_notifications.py` verifies user scoping and mark-read behavior. Business modules enqueue notifications directly; a common domain-event workflow and preference/priority system were not found. |
| Audit/activity | PARTIAL | Audit rows and `/audit/me` exist; organization activity has some role/member checks. Complete, consistent audit coverage for all important admin/security/business state transitions is not established. |
| Analytics | PARTIAL | `/analytics/overview` derives values from XP, battle results, and skill stats. It is student-oriented; separate evidence for the full College, Company, Admin, retention, and product-event analytics requested by V3 was not found. `frontend/src/app/calendar/page.tsx` creates an empty `activityMap` locally and converts streak API failure into zero values, so the calendar currently displays a code-generated empty activity view rather than a persisted activity feed. |
| Search | PARTIAL | `/search` queries persisted questions, problems, open verified-company jobs, waiting public battles, and role-specific records. Authorization/visibility logic is in the route and needs cross-role isolation tests. |
| Files/storage | PARTIAL; SECURITY BLOCKER | A provider abstraction supports local/S3/Cloudinary/MinIO. The authenticated delete route accepts a caller-supplied path but does not pass the current user into the service. The local provider joins that path to `uploads/` without canonical-path containment checks. See Security Findings. |
| WebSockets | SECURITY BLOCKER | The battle WebSocket manager tracks optional user IDs, but `backend/app/modules/battle/websocket/router.py` accepts the socket without validating a token, battle participation, or role, and broadcasts client-provided event/data to the room. |
| Events/background jobs | PARTIAL / NOT RUNNING | Worker classes and Redis queues exist, but no worker process startup was found in `app.main`, Render start command, or Compose services. Compose/Render also do not define Redis. `_NoopRedis` does not implement queue operations such as `lpop`/`rpush`; queue workers therefore lack a usable no-Redis fallback. |
| Rate limiting | PARTIAL; FAIL-OPEN | A global IP-based limit is configured. When Redis operations fail, `RateLimiter.allow` returns `True`; the no-op `incr()` also returns `0`, so requests are allowed. No route-specific limits for AI/auth/search/assessment/admin were found in the inspected middleware. |
| Database and migrations | TECHNICAL DEBT | SQLAlchemy models, SQLite/Postgres engines, and Alembic revisions exist. Startup/migration code also calls `Base.metadata.create_all()` and manual `_repair_*` SQL, creating two schema-evolution mechanisms. `init_db()` seeds code-defined practice problems/questions when tables are empty; confirm this is approved curated catalog content under the no-demo-data rule. |
| Health/observability | PARTIAL; READINESS DEFECT | Request ID/timing middleware, Prometheus metrics, Sentry configuration, `/health/db`, and admin health data exist. `health.py` returns `{"ready": true}` without checking dependencies and is included before the root `/ready` handler that attempts database/schema checks, so the static router can shadow the stronger handler. Several admin health fields are explicitly `null`/`not_configured` or labels such as `websocket: initialized`, not live checks. |
| Deployment/CI | PARTIAL | Render, Docker, Compose, and frontend deployment configurations exist. Render selects Python 3.11.9, backend Dockerfiles use Python 3.12, and CI uses Python 3.11. `.github/workflows/ci.yml` installs/import-checks backend and builds frontend but runs no automated tests. |
| Billing, entitlements, feature flags | NOT FOUND IN ACTIVE INVENTORY | No active billing, subscription, entitlement, usage-limit, or feature-flag module/model surfaced in the inspected backend/frontend inventories. These remain future platform foundation work, not existing V2 behavior. |
| Privacy/security verification | PARTIAL | Candidate privacy and consent controls exist and are covered in part by company tests. No cross-role/cross-tenant suite was found for the V3 matrix; no independent penetration test, WebSocket auth test, storage ownership/path test, or assessment IDOR test has been run. |

## Security Findings To Triage Before V3 Expansion

These are confirmed by the inspected code path. Runtime exploitability and production reachability were not independently probed; treat them as release blockers until fixed and regression-tested.

1. **Anonymous battle WebSocket and room broadcast** — `backend/app/modules/battle/websocket/router.py` accepts the connection using only `battle_id`; it does not authenticate the caller or verify participant membership. It accepts arbitrary JSON event/data and broadcasts it to the room.
2. **Storage delete lacks ownership and path containment** — `backend/app/modules/storage/router.py` authenticates a user but passes only the supplied path to `storage_service.delete`. `backend/app/modules/storage/providers/local.py` unlinks `ROOT / path` without resolving/limiting the path to the uploads root. This creates a path-traversal/IDOR risk for local storage and an ownership gap for other providers.
3. **Assessment tenant access is caller-controlled** — `backend/app/modules/assessment_engine/routers/assessment_router.py` allows `GET /{assessment_id}` without auth and without checking public/tenant visibility. Create/list accept `college_id`/`company_id` from the request/query; `AssessmentService.list_assessments` does not derive ownership from the user and does not use its `user_role` argument.
4. **AI endpoints are unauthenticated** — `backend/app/modules/ai/router.py` exposes chat, resume review, roadmap, interview, recommendation, and RAG without `get_current_user`, user-level quotas, or request-size policy. Resume text and provider spend are exposed to unauthenticated use.
5. **Rate limiting fails open** — `backend/app/core/redis/rate_limiter.py` allows requests when Redis errors; `_NoopRedis.incr()` returns zero. Redis is not declared in inspected Render/Compose configurations.
6. **Email verification is not an API-wide gate** — `get_current_verified_user` documents verification as informational and returns the user; most APIs use `get_current_user`. The frontend guard is not a substitute for backend policy. Define which actions require verified email, then enforce them on the backend.

## Quality Evidence

- **Backend suite:** `backend/.venv/Scripts/python.exe -m pytest -q` using a unique temporary SQLite database: **40 passed, 2 failed**, 4m32s.
- `tests/test_config_precedence.py::test_local_sqlite_settings_override_production_defaults` failed because the isolation run supplied `SQLITE_DATABASE_URL`; that test asserts the repository default URL and is an environment-induced failure, not a product regression.
- `tests/api/test_admin_system_health.py::test_system_health_is_platform_admin_only_and_uses_database` failed because the fixture calls `init_db()` but does not run Alembic, so `alembic_version` is absent and the endpoint reports `database: unhealthy`. Production Render startup does run `run_migrations.py`; the test setup and migration-version expectation need alignment.
- **Frontend:** `cd frontend; npm run build` passed after the current local edits, including TypeScript and generation of 42 app routes.
- **CI:** the active workflow does not execute pytest or frontend tests. Tests in `backend/app/tests/` are outside `backend/pytest.ini`'s `testpaths = tests` default discovery.
- **Not verified:** browser navigation/scroll regression, every role's login-to-dashboard flow, real deployed API behavior, Redis availability, worker execution, tenant-isolation matrix, security penetration tests, production latency/load, database restore, and deployment rollback.

## Current Local Worktree

The existing uncommitted frontend work covers dashboard deferred loading, dashboard avatar fallback, compact header/panels, role-aware dashboard routing, and a parent-shell height constraint for the reported sidebar movement. It does not modify the protected `Sidebar.tsx` or role-navigation source.

The current production build passes. Browser validation used an isolated temporary backend and student account, not production data. At a 1440x900 desktop viewport on `/profile`, the content column had `scrollHeight=962`, `clientHeight=900`, and changed `scrollTop` from `0` to about `62`; the sidebar remained at `top=24`, `bottom=876`, `height=852`, while the document stayed 900px tall. At a 390x844 mobile viewport, the desktop sidebar remained hidden, the mobile navigation was visible, and horizontal overflow was false. The separate Admin and Career shells were not changed by this parent-shell fix.

## Phase 0 Exit Decision

Phase 0 has produced an initial source/test baseline; it is **not a V3 readiness sign-off**. Before opening major V3 product phases:

1. Triage and regression-test the WebSocket, storage deletion, assessment tenant access, AI endpoint auth/quota, and fail-open rate-limit findings.
2. Agree on canonical User–Organization–Membership–Permission relationships for College and Company while preserving current V2 roles and data.
3. Decide the one authoritative assessment lifecycle and the XP ledger/source-of-truth contract before adding new scoring or analytics surfaces.
4. Define the worker/Redis deployment target and make readiness checks reflect actual dependencies.
5. Establish a CI gate that runs isolated backend tests and frontend tests, including cross-role and tenant-isolation cases.
6. Confirm seeded question/problem content and starting XP/rating values meet the no-demo-data rule.

Do not declare V3 complete from this discovery document. No V3 release gates have been fully tested.
