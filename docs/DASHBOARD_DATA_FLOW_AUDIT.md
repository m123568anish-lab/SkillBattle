# Dashboard persistence and data-flow audit

## Scope and evidence

This audit follows the checked-in application configuration and code paths for the
Next.js dashboard, FastAPI dashboard route, authentication, database sessions,
practice activity, battle completion, XP, streaks, and deployment migrations.
It does not inspect production credentials, query the production database, or
exercise deployed services.

## Data flow

1. `frontend/src/context/AuthContext.tsx` configures the Clerk token provider and
   bootstraps the local application session.
2. `frontend/src/lib/api.ts` sends requests to `NEXT_PUBLIC_API_URL` (falling
   back to the configured Render host in production) under `/api/v1`, attaching
   the active Clerk token or a legacy access token.
3. `backend/app/modules/dashboard/router.py` resolves the authenticated local
   `User` through `get_current_user` and scopes the dashboard to `current_user.id`.
   Clerk identities are mapped through the unique `users.clerk_user_id` column;
   new mappings require a verified email.
4. `backend/app/modules/dashboard/service.py` reads XP, streak, battle counts,
   recent XP activity, achievements, and profile-dependent recommendations.
   The battle counts are aggregated by
   `backend/app/modules/dashboard/repository.py` from participant and result
   records. The response schema is defined in
   `backend/app/modules/dashboard/schemas.py`.
5. `frontend/src/services/dashboard.service.ts` requests `/dashboard`;
   `frontend/src/store/dashboardStore.ts` caches a successful response per
   local user ID, and `frontend/src/app/dashboard/page.tsx` renders it.

The async API session uses `ASYNC_DATABASE_URL` through
`backend/app/database/session.py`. Alembic and the synchronous engine use
`DATABASE_URL` through `backend/app/database/database.py`. The Render manifest
declares `DATABASE_URL` and runs `run_migrations.py` before serving. The checked-in
configuration derives an async URL from `DATABASE_URL` when one is not supplied,
but the actual deployed values cannot be verified here.

## Confirmed findings before remediation

1. **Writes could be returned as successful without being committed.** In
   `backend/app/database/session.py`, `get_db()` checked `dirty`, `new`, and
   `deleted` after the handler returned. ORM changes already flushed by a service
   no longer appear in these collections, so the dependency could close the
   transaction without committing. Commit exceptions were also suppressed after
   rollback, allowing a successful response after a failed commit.
2. **Dashboard reads do not reconcile a stale XP balance.**
   `DashboardService.get_dashboard()` reads `XP.total_xp` through
   `xp_service.get_user_xp()`, which returns an existing XP row without checking
   the `xp_ledger`. A reconciliation method exists, but this dashboard read does
   not invoke it. A persisted ledger can consequently disagree with the displayed
   balance.
3. **The dashboard shows zero-valued fallback metrics without a live response.**
   `frontend/src/app/dashboard/page.tsx` builds zero defaults when `dashboard` is
   absent. It also shows an error banner, but still renders those defaults as
   student statistics.
4. **The practice task and recommendation endpoints contained static activity
   claims.** `backend/app/modules/practice/router.py` now reads the persisted
   daily assignment and derives recommendations from the authenticated user's
   recorded coding submissions. Weekly challenges remain unimplemented and the
   endpoint returns an empty list rather than claiming completion.
5. **The dashboard health surfaces are incomplete/inconsistent.**
   `backend/app/core/monitoring/health.py` has a safe connectivity check, but it
   does not report database type or migration status. Other readiness handlers
   in `backend/app/main.py` include exception text in their response, which can
   disclose sensitive connection details.

## Remediations applied

- `get_db()` now commits any active request transaction, including writes that
  have already been flushed, and propagates commit failures after attempting a
  rollback.
- The dashboard reconciles XP from the persisted ledger and existing XP balance
  before building statistics.
- The dashboard no longer displays fallback zero statistics when no live
  response is available; loading and error states are shown instead.
- Daily-practice, MCQ, coding, and battle completion now persist qualifying
  activity and rewards in the same transaction. Failures propagate rather than
  being treated as successful activity.
- MCQ questions and answers are now served and checked by the backend.
  `UserSubmission`, `UserSkillStat`, XP ledger/balance, and streak activity are
  updated together; a repeated correct answer does not award XP again.
- Coding and MCQ submissions update attempt-based skill statistics in the same
  transaction as the submission. Dashboard practice accuracy is calculated from
  correct submissions over recorded submissions; completed tasks are counted
  distinctly.
- Dashboard stats now include persisted coding and MCQ attempts/completions,
  daily-practice completions, current challenge completion, weekly XP/activity,
  skill progress, and recent activity.
- `/health/db` reports database connectivity, database type, Alembic migration
  status, and readiness without returning connection details. Other database
  health error responses no longer include raw exception text.
- No migration was created for these changes.

## Existing persistence and boundaries

- Practice coding status is derived from authenticated-user
  `CodeSubmission` rows. Daily assignments are stored in
  `daily_practice_sessions`; weekly challenges have no persisted implementation.
- Battle completion persists `BattleResult`, participant state, XP, and rating
  changes in `backend/app/modules/battle/service.py`. Existing result checks and
  the XP ledger's unique `(user_id, source, reference_id)` constraint provide
  idempotency protection for ordinary repeat requests. Dashboard battle totals
  are filtered to completed battle results.
- XP is represented by `xp`, `user_stats`, and `xp_ledger`. Streak state is
  represented by `streak` and `user_daily_activities`.
- The dashboard stats include XP/level, streak, rating, battle totals, practice
  attempt/completion totals and accuracy, daily-practice completion, and daily
  challenge completion. Skill progress and recent activity are returned
  separately from persisted user data.
- The database session uses the authenticated local database user ID in the
  dashboard query path; no evidence in this path shows statistics being queried
  by email or by Clerk subject directly.

## Production verification still required

The repository does not establish which Render database instance is configured,
whether Vercel currently points at that deployment, whether the deployed schema
is at the expected Alembic head, or whether existing production activity rows
are present. Those claims require inspecting deployment configuration and a
controlled, read-only production/staging connection. No historical data was
queried or changed as part of this audit.

Deploy the backend and frontend changes, then verify `GET /health/db` reports
`connection_ready: true` and `migration_status: "current"` before running the
dashboard and activity flows against controlled accounts. Confirm Render's
database URL points to the intended Neon project and Vercel's
`NEXT_PUBLIC_API_URL` points to the deployed Render API; their live values and
deployed revisions were not available for verification here. Do not run these
flows against production accounts until that configuration is confirmed.

These changes do not include a production data migration; rollback is a code
deployment rollback. Weekly challenges still have no persisted implementation.
User-configurable time zones are not supported; daily calculations use UTC.
Browser-level refresh and logout/login flows, deployment revision checks, and
read-only verification of the requested production tables remain outstanding.

## Local verification

- Full backend test suite: 136 passed (62 warnings).
- Final focused persistence, MCQ persistence/isolation, and dashboard tests: 9 passed.
- Next.js 16.2.9 production build and TypeScript validation: passed.
- Frontend ESLint: passed with 7 existing warnings in unrelated files.
- `git diff --check`: passed.
- The MCQ account-isolation test uses a local in-memory SQLite database. No
  production database, deployment, or browser-based auth/session flow was run.
