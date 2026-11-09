# Qubira Dashboard Live-Data Failure Investigation

**Initial investigation:** 2026-11-07  
**Evidence update:** 2026-11-09  
**Scope:** Read-only source review and analysis of the user-supplied browser capture. No production service, production logs, or production databases were accessed.

## Result

The initial isolated local reproduction succeeded: the authenticated dashboard endpoint returned HTTP 200 from an in-memory SQLite database, with the expected statistics shape. New browser evidence now confirms a browser-visible HTTP 503 for `GET https://www.qubira.in/api/v1/dashboard`; the user also identifies the current-user request as affected. This establishes that the failure is not limited to the local reproduction, but it does not identify which production hop generated the status.

The supplied capture contains no response body or headers, timestamp, Vercel request/deployment ID, Render request log, or FastAPI request ID. It explicitly shows the dashboard request returning 503. It shows a `getCurrentUser` call stack, but not a separate response line or URL/status for that request; its failure is reported by the user but cannot be independently correlated from the captured text. The 503 source and root cause remain **undetermined**. No speculative code or configuration change was made.

## Request trace and findings

1. `frontend/src/app/dashboard/page.tsx` calls `useDashboard()`. `frontend/src/hooks/use-dashboard.ts` starts a request once the auth store has a user ID. On failure, the page displays the error and a Retry action; any cached result is identified as stale rather than represented as a live refresh.
2. `frontend/src/services/dashboard.service.ts` calls `api.get("/dashboard")` and rejects incomplete statistics. In the active `frontend` app, `frontend/src/lib/api.ts` uses the same-origin browser base URL and appends `/api/v1`, yielding `/api/v1/dashboard`.
3. `frontend/next.config.ts` rewrites `/api/v1/:path*` to `API_ORIGIN`. `frontend/src/lib/api-origin.mjs` requires an explicit `NEXT_PUBLIC_API_URL` outside development/test, normalizes it to an origin, and does not silently select a production fallback. The production deployment's configured value was not inspected.
4. `frontend/src/context/AuthContext.tsx` configures the Clerk token provider. The API request interceptor uses the active Clerk token when Clerk is signed in, otherwise the legacy access token; it does not make the dashboard public. The backend's `api/v1` router includes `app.modules.dashboard.router`, whose endpoint requires both `get_db` and `get_current_user` and allows only student/user roles.
5. `backend/app/modules/dashboard/service.py` builds a `DashboardResponse` validated by the backend schema. Its statistics include the required fields in `frontend/src/types/dashboard.ts`; local dashboard contract tests cover these fields.

### Safe reproduction

An in-process request used the real registration, login, token verification, dashboard route, and dashboard service, with a custom SQLAlchemy async engine backed only by in-memory SQLite. The user and all data were synthetic. `GET /api/v1/dashboard` returned **200** with the expected response sections and all required statistics. No external API or database was configured for this test.

The backend's existing pytest fixture calls `init_db()` against application settings, so it was not run: without replacing that fixture it cannot be guaranteed to avoid a file or externally configured database. The isolated in-memory request was used instead.

## New browser evidence and request routing

The supplied browser console text includes:

- `GET https://www.qubira.in/api/v1/dashboard 503 (Service Unavailable)`.
- A JavaScript stack through the dashboard loader and `getDashboard`.
- A separate `getCurrentUser` stack, without a corresponding request URL,
  response status line, body, or timing in the supplied text.

The active frontend source resolves the requests as follows:

1. `authService.getCurrentUser()` requests `/auth/me`; the browser API client
   uses a same-origin base URL and appends `/api/v1`, so the browser URL is
   `/api/v1/auth/me`.
2. The dashboard client requests `/dashboard`, which becomes
   `/api/v1/dashboard`.
3. `frontend/next.config.ts` rewrites both `/api/v1/:path*` paths to
   `${API_ORIGIN}/api/v1/:path*`. `API_ORIGIN` is resolved from
   `NEXT_PUBLIC_API_URL` when the Next.js config is loaded. The public example
   names `https://skillbattle-api.onrender.com`, but that example is not
   evidence of the value used by the production Vercel deployment. No deployed
   environment value or resolved rewrite destination was read.
4. The repository's `render.yaml` declares a Render web service named
   `skillbattle-api`, with `/health` as its health check and a start command
   that runs `python -u run_migrations.py` before `uvicorn`. A nonzero
   migration-runner exit would prevent Uvicorn from starting under that
   configuration. This file does not establish which commit or service
   configuration is currently deployed.

### Can the 503 source be identified from this evidence?

No. The browser request URL is the Vercel-facing same-origin URL. A Next.js
rewrite forwards the request to its configured backend origin, but the browser
status alone cannot distinguish a Vercel-generated/upstream 503 from a response
returned by Render or FastAPI. The attached console text lacks the headers and
body normally useful for that distinction (for example `x-vercel-id`,
`server`, `via`, and the backend `X-Request-ID`).

Source inspection identifies possible FastAPI-generated 503 paths, but does
not prove either ran in production:

- `MaintenanceMiddleware` returns a JSON 503 for every request if
  `settings.MAINTENANCE_MODE` is truthy. However, the inspected `Settings`
  model does not declare `MAINTENANCE_MODE` and sets `extra="ignore"`, so a
  deployment environment variable by that name alone is not expected to enable
  this branch. No production runtime state was inspected.
- The dashboard route catches unexpected service exceptions, logs
  `Dashboard request failed`, then returns JSON 503 with
  `Dashboard is temporarily unavailable.` The dashboard 503 body and matching
  log were not supplied.
- The `/auth/me` handler itself returns the authenticated user and has no
  explicit 503 response in its handler. Middleware, dependencies, startup or
  infrastructure can still affect it; no production trace was available.
- The FastAPI app adds an `X-Request-ID` response header and logs request
  completion through middleware. No ID or matching request log was present in
  the capture.

The two endpoint failures would be evidence for a shared upstream or
application-wide issue only if their timestamps and statuses are confirmed to
overlap. The supplied capture does not provide enough timing or response data
to make that comparison.

## Production evidence and root-cause status

No authorized Render or Vercel log/status integration was available in this
workspace. The available cloud-log helper is for Azure resources, not Render.
No Render logs, Vercel request logs, health status, deployment events, response
headers, or service configuration were accessed. No production HTTP request
was made. Therefore it is not currently possible to conclude whether:

1. Vercel rejected or failed to resolve/reach its rewrite destination;
2. Render had no healthy instance or did not receive the request;
3. the configured migration start command prevented Uvicorn startup;
4. Uvicorn received the request and application middleware/route returned 503;
5. an upstream dependency timed out or became unavailable.

### Exact operator evidence collection steps

For one reproduced failure, collect the following without exposing credentials
or changing service state:

1. In browser DevTools Network, preserve both `/api/v1/dashboard` and
   `/api/v1/auth/me` request entries. Record UTC timestamp (convert from the
   browser's displayed timezone), method, status, response body, and response
   headers. Record `x-vercel-id` (if present), `server`, `via`, and
   `x-request-id` (if present). Redact `Authorization`, cookies, tokens, and
   personal response data before sharing.
2. In Vercel, for the matching production deployment and UTC interval, check
   request/function/build logs and deployment status for both paths. Record
   the deployment ID, request IDs, status, rewrite/upstream errors, and the
   configured rewrite destination's hostname. Verify the resolved backend
   origin without copying any secrets.
3. In the Render dashboard, select the matching `skillbattle-api` service and
   inspect Events plus service logs for the same UTC interval. Record deploy
   commit/state, instance health/restarts, startup output (especially migration
   command exit and Uvicorn bind/start messages), and any request completion
   entries for `/api/v1/dashboard` and `/api/v1/auth/me`.
4. Compare the same request IDs and timestamps:
   - No Render request entry, paired with a Vercel rewrite/upstream error:
     investigate the resolved origin, DNS/TLS/connectivity, Vercel routing, and
     Render service health. This is not evidence of a database failure.
   - Render deployment/startup failure or unhealthy instances, with no Uvicorn
     startup/bind message: investigate the Render start command, migration
     runner exit, and port binding. Do not retry migrations or change databases
     as a diagnostic shortcut.
   - A matching FastAPI request ID/status in Render logs: inspect the
     corresponding application exception and route/middleware log. A dashboard
     `Dashboard request failed` entry or maintenance response body would
     identify an application path; then inspect only the specific dependency
     indicated by that exception.
   - FastAPI logs show a successful response while the browser sees 503:
     investigate the proxy/rewrite/upstream response path and deployment
     routing.
5. If operators need a basic service availability check, use the configured
   Render `/health` endpoint and record its status and timestamp. In this
   repository that endpoint is lightweight and does not query the database.
   Do not use `/health/db` for this investigation because it opens a database
   session and performs database/migration-state queries, which are outside
   this investigation's no-production-database-access boundary.

The operator should return only redacted log lines and metadata needed to
correlate the requests. Once supplied, the evidence can establish which hop
generated the 503 and support a targeted fix.

## Validation

The existing plan at `frontend/.tsupgrader/runtime-validation/eval-plan.json` was run in standalone mode; the result is in `frontend/.tsupgrader/runtime-validation/standalone-result.json`.

- Production build: passed.
- TypeScript no-emit: passed.
- Existing plan test command: exit code 0. Its harness reported test-result parsing as `unknown` with zero parsed tests; a direct replay of `npm test` confirmed **13 passed, 0 failed**.
- Planned home-route probe: HTTP 200.
- Safe backend dashboard request described above: HTTP 200.

The TypeScript runtime guide under `frontend/node_modules/next/dist/docs/01-app/01-getting-started/06-fetching-data.md` was read before considering frontend changes. No frontend edit was needed.

## Limitations and production verification not performed

The local success establishes that the current request path, auth flow,
endpoint, service, and response contract work for a new synthetic student
against an in-memory database. The browser capture independently confirms a
production-facing 503 for the dashboard URL, but does not identify the
responding hop. It does not establish the deployed API origin, deployment
environment values, Render service health, startup outcome, matching request
logs, a particular Clerk/legacy session, production data, or network
availability.

No request was made to `qubira.in`; Render/Vercel logs, production databases
(including Neon), and `D:\\BattleAI\\skillbattle.db` were not accessed. There
was no deployment, migration, commit, or push.

**Conclusion at the initial investigation:** Production HTTP 503 was confirmed
by the supplied dashboard browser capture; its source and root cause were not
established. No speculative code or configuration change was made at that
stage.

## Render PostgreSQL startup evidence update

Subsequent user-supplied Render logs show the migration process exiting with
status 1 before Uvicorn binds, followed by `No open ports detected`. The
repository's declared `python -u run_migrations.py && exec uvicorn ...`
sequence guarantees that a nonzero migration-runner exit prevents Uvicorn from
starting. This provides a plausible shared cause for the dashboard and
current-user request failures, but the requests have not been correlated by
timestamp or request ID.

A disposable PostgreSQL 18.6 reproduction found a schema-comparison failure:
Alembic's baseline JSON server-default comparison executed
`SELECT '{}'::json = '{}' AS anon_1`, which PostgreSQL rejects with SQLSTATE
`42883` (`UndefinedFunction`). A JSON-aware comparison callback passed the
same synthetic comparison. The production log supplied to date contains only
generic `ProgrammingError` text, so this local result is not proof that this
was the exact production SQL or deployed code path.

The accompanying `Detected removed index 'ix_assessment_q_sub_user_created'`
message is a schema-drift report, not evidence that Alembic executed a
`DROP INDEX`. The index is created by `init_db.py` but is absent from the
inspected model metadata and historical revision. It may remain a separate
strict-preflight blocker after the JSON comparison issue is addressed; do not
drop or recreate it without verified schema evidence.

The current worktree's runner and `alembic/env.py` fail closed for online
PostgreSQL migrations. A disposable PostgreSQL upgrade attempt exited before
applying revisions, leaving the disposable database without migration tables.
Thus, PostgreSQL autogenerate output in the supplied production log indicates
that Render used a different commit, command, or execution path than the
current checkout. The deployed commit and service settings are not known.

On temporary SQLite data, the current worktree's Uvicorn process started
independently of the runner, `/health` returned healthy, both versioned routes
were registered, and an invalid current-user token returned 401. The
authorized-student versioned dashboard and current-user auth tests passed.
Subsequent disposable-SQLite reproduction traced two Neon identity test
failures to test assumptions: one queried a `Profile` by its integer primary
key rather than `user_id`, and another supplied the reserved `.test` domain
that `EmailStr` rejects. The tests now use the relationship key and a valid
`example.com` registration address; the combined Neon-auth, profile,
registration, and auth suite passed (13 passed, 133 warnings). These test-only
corrections do not establish or diagnose production behavior.

No production request, database query, migration, restart, or deployment was
performed. The exact production exception and the causal link between startup
failure and both browser 503s remain unconfirmed until operators correlate
the deployed commit, redacted SQLSTATE/statement/phase, and matching
Vercel/Render request logs. See
[`RENDER_POSTGRESQL_STARTUP_FAILURE_ANALYSIS.md`](../database/RENDER_POSTGRESQL_STARTUP_FAILURE_ANALYSIS.md)
for the detailed analysis and deployment gates. A narrow JSON server-default
comparison correction is present in the worktree and passed disposable tests;
it has not been deployed and is not claimed as a verified production fix.

## Phase 3.2E startup separation update

The current worktree now requires an explicit `--execute` flag before
`run_migrations.py` will call the migration runner. A regression test verifies
that invoking the command without the flag exits with status 2 and does not
create the configured disposable database. SQLite execution still refuses
without maintenance-window evidence and a verified backup. PostgreSQL execution
also remains fail-closed pending successful full-graph migration tests.

The API lifespan no longer bootstraps the platform administrator or runs
migrations; it disposes both synchronous and asynchronous SQLAlchemy engines at
shutdown. Administrator provisioning is available separately through
`backend/run_admin_bootstrap.py`. This command was not run against any shared or
protected database.

On an isolated Windows SQLite path, four auth/dashboard integration tests passed:
the versioned student dashboard returned successfully for an authorized
student, current-user authentication worked for a valid session, invalid-token
requests remained rejected, and an unauthenticated dashboard request was
rejected. A separate disposable Uvicorn process bound to a loopback port;
`/health` returned 200, invalid `/auth/me` credentials returned 401, and the
unauthenticated dashboard returned 401. The database file was not created by
API startup or these unauthenticated probes, confirming no implicit migration
or startup database write on that path.

`render.yaml` was not changed. Its current command still chains
`python -u run_migrations.py` before Uvicorn, without `--execute`. If that exact
configuration runs this worktree, the migration process exits 2 and Uvicorn
will not start. Whether production is running this worktree or command remains
unknown. Do not deploy the current chained command or claim the production 503
is fixed: the deployment must be split into an explicitly authorized migration
job and an API-only Uvicorn command, after the migration compatibility gate
passes.

Keep migration execution and deployment blocked until a supported-revision
disposable PostgreSQL upgrade and a fresh-database migration strategy both
pass. Keep API startup read-only and use the operator evidence steps above to
correlate production 503s with a deployed commit and matching Render/Vercel
request logs.
