# Vercel and Render Startup Repair Report

## Status summary

| Area | Status | Result |
|---|---|---|
| Vercel build-time Neon Auth failure | FIXED AND TESTED | A dotenv-free production build succeeds with the two Neon Auth runtime variables absent. |
| Neon Auth runtime configuration | FIXED AND TESTED | Missing configuration returns HTTP 500; no success fallback is used. A local authenticated fixture returns HTTP 200. |
| Authenticated opportunity flows | FIXED AND TESTED | 5/5 Playwright tests pass, including unauthenticated redirect and mobile/desktop flows. |
| API-only startup | FIXED AND TESTED | Uvicorn starts without migrations; health, readiness, auth, dashboard, and invalid-token behavior were checked against disposable SQLite. |
| PostgreSQL migration activation | BLOCKED | The local gate is closed. No disposable PostgreSQL server was available, so fresh and existing-schema validations remain untested. |
| Production Vercel/Render deployment | NOT TESTED | No live settings, databases, logs, or deployments were accessed. |
| Production dependency audit | BLOCKED | `npm audit --omit=dev` reports 8 vulnerabilities; no blanket or forced upgrades were applied. |

## Vercel build failure

### Root cause

The installed `@neon/auth@0.8.2` server SDK requires `cookies.secret` in the configuration passed to `createNeonAuth()`. Previously, auth construction happened at module import time and used a TypeScript non-null assertion for the environment value. That assertion did not provide a runtime secret. Next.js evaluated the auth route during page-data collection, and the SDK threw `Missing required config: cookies.secret`.

### Repair

Auth initialization is now lazy and cached. The route and Proxy only construct the SDK when a request is handled. Runtime validation requires `NEON_AUTH_BASE_URL` and `NEON_AUTH_COOKIE_SECRET`, rejects invalid or credential-bearing URLs, requires HTTPS in production, and enforces the SDK's 32-character minimum secret length. Missing configuration produces an explicit error naming the required variables; it is not replaced with a generated or development secret.

The clean build was run from a copy with no dotenv files, with both Neon Auth variables empty and only a non-routable API-origin placeholder supplied for the build:

- `npm run build`: exit code 0; compilation, TypeScript, page-data collection, and static generation completed.
- Runtime request to `/api/auth/get-session` without Neon Auth configuration: HTTP 500.
- Local HTTPS Playwright fixture: the SDK auth session endpoint returned HTTP 200 during authenticated tests.

### Files changed for this repair

- `frontend/src/lib/auth/config.mjs`
- `frontend/src/lib/auth/server.ts`
- `frontend/src/app/api/auth/[...path]/route.ts`
- `frontend/src/proxy.ts`
- `frontend/tests/auth-config.test.mjs`
- `frontend/tests/fixtures/neon-auth-server.mjs`
- `frontend/tests/opportunities.spec.ts`
- `frontend/playwright.config.ts`
- `frontend/package.json`
- `frontend/package-lock.json`

### Vercel environment variables

Configure these independently in **Production**, **Preview**, and **Development**:

| Variable | Requirement |
|---|---|
| `NEON_AUTH_BASE_URL` | HTTPS URL of the matching Neon Auth instance in deployed environments. |
| `NEON_AUTH_COOKIE_SECRET` | Cryptographically random secret of at least 32 characters. Generate a distinct value per environment, for example with `openssl rand -base64 32`. Never commit or log it. |
| `NEXT_PUBLIC_API_URL` | Explicit backend origin for the corresponding environment; production has no silent default. |

No live Vercel values were read or changed. The operator must set these in Vercel before deploying.

## Opportunity authentication tests

The earlier four browser failures were caused by missing authenticated-session setup, not by authorization being disabled. The new browser suite obtains a session from a local test-only auth fixture, mocks only the application API boundary, retains the actual Neon Auth middleware and protected-route behavior, and explicitly tests an unauthenticated redirect.

`npm run test:e2e`: exit code 0, **5 passed**:

- unauthenticated visitor is redirected to sign-in;
- authenticated student discovers and filters listings, opens details, saves, and applies at 360, 390, and 430 pixel widths;
- desktop listing layout remains usable.

Frontend checks: `npm test` **17 passed**, `npx tsc --noEmit` passed, and `npm run lint` passed with five existing `<img>` optimization warnings and zero errors.

## Render migration and startup findings

### Current code behavior

`backend/run_migrations.py` requires the explicit `--execute` flag. Its PostgreSQL path acquires ownership and checks the Alembic connection identity, but the coordinator previously allowed the PostgreSQL dialect before disposable migration scenarios had been validated. Because no disposable PostgreSQL was available, this task restored an explicit PostgreSQL activation gate in `require_supported_migration_dialect()` and added a regression assertion. The ownership implementation remains present; this gate prevents the runner from entering it until validation is complete.

The API can be started independently with:

```sh
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

The FastAPI lifespan performs no migration DDL. `/health` is a liveness endpoint and returns HTTP 200 while the process is running. `/ready` and `/health/db` perform read-only compatibility checks and return 503 when the schema is not ready.

Disposable API-only smoke results:

- Uvicorn bound successfully.
- `/health`: HTTP 200 (`healthy`).
- `/ready`: HTTP 503 for the intentionally unversioned test schema.
- Valid authenticated `/api/v1/auth/me`: HTTP 200.
- Valid authenticated `/api/v1/dashboard`: HTTP 200.
- Invalid token: HTTP 401.
- No `alembic_version` table was created during API startup.

The test schema was created in a temporary SQLite database solely for this smoke test. These results do not establish PostgreSQL compatibility.

### Commit and command discrepancy

The inspected repository `HEAD` is `8967803c9df17d4c2b63b9b71efa442b281ac60a`.

- At `HEAD`, `render.yaml` has a migration-plus-Uvicorn command **without** `--execute`; that committed command would stop at the runner's explicit authorization check.
- The current working-tree `render.yaml` has an uncommitted `--execute` change. This task did not modify `render.yaml`.
- `HEAD` does not contain the current PostgreSQL ownership implementation; it exists only in uncommitted working-tree changes. The current working-tree runner/coordinator also contain those ownership changes and the PostgreSQL gate. The reported `phase=dialect_gate` log therefore does not match the command and source in `HEAD`.
- The Render service's actual deployed commit, dashboard start command, and logs were not available. It cannot be determined whether Render ran the committed code or a different commit/configuration.

Consequently, do not infer that the latest production log came from `HEAD` or from the current worktree. Obtain the deployed commit SHA and effective Render start command before making a production diagnosis.

### Migration revisions and graph

`alembic heads` reports exactly one current worktree head: `d1f5a8e7c2b4`. `alembic history --verbose` shows this ancestry:

```text
7a2b1c4d9e8f and b8f2d4e6a901
  -> mergepoint 47292a2a50d2
  -> a14c6e8d2b37
  -> c9b0f2d5a713
  -> d1f5a8e7c2b4 (single head)
```

| Revision | Worktree status | Parent | Observations |
|---|---|---|---|
| `a14c6e8d2b37` | Tracked | `47292a2a50d2` | Adds nullable Neon identity column and unique index if absent. |
| `c9b0f2d5a713` | Untracked | `a14c6e8d2b37` | Adopts or creates the reviewed `ix_assessment_q_sub_user_created` index; downgrade preserves it. |
| `d1f5a8e7c2b4` | Untracked | `c9b0f2d5a713` | Reconciles battle-room columns and related constraints/indexes, and drops named unique indexes only when matching unique constraints are verified. |

The two untracked revisions are not part of `HEAD` and therefore cannot be assumed to exist in the deployed commit. Their operations have not been tested on PostgreSQL. The graph's single head is not evidence that the Neon schema matches it.

### PostgreSQL validation blocker and production data

Docker, `psql`, `pg_ctl`, and a local PostgreSQL server were unavailable. The PostgreSQL advisory-lock tests were skipped (7 skipped); PostgreSQL 18.6 lock behavior, a fresh disposable install, and existing-schema reconciliation were **NOT TESTED**. No Neon connection, production database inspection, stamp, or migration was performed.

The existing Neon schema was not changed and remains untouched. Its compatibility with the current worktree revisions is **NOT VERIFIED**; obtain a reviewed, read-only schema comparison in an authorized disposable/production-read-only process before considering migrations.

### Proposed deployment separation

Do not deploy these commands until the deployed commit is confirmed and the required PostgreSQL validations pass:

1. **Controlled migration job** — run only as an explicitly authorized one-off job, with a direct (non-pooled) migration URL and reviewed backup/ownership controls:

   ```sh
   python -u run_migrations.py --execute
   ```

   In the current worktree this intentionally refuses PostgreSQL execution until fresh and existing disposable PostgreSQL scenarios pass. Do not remove that gate or use `stamp` as a workaround.

2. **API-only web service** — no migration command in the service start command:

   ```sh
   exec uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

   Use `/health` for liveness and check `/ready` for read-only schema compatibility. An incompatible schema must remain unready; do not make the API silently accept it.

No Render configuration or live service setting was changed.

## Dependency and configuration review

- Installed versions: `@neon/auth@0.8.2`, Better Auth packages `1.7.18`, and `@better-fetch/fetch@1.3.3`. The OAuth provider peer requirement mismatch was resolved with a narrow lockfile override; `npm ls` reports a consistent tree.
- Node declared minimum: `>=20.19.0`; validation runtime: Node `v24.14.1`.
- `sharp@0.34.5` loads successfully and the production build passes. npm warns its install script is not approved; no script approval was added.
- `npm config get cache-dir` returns undefined; no cache-dir configuration was added.
- `next.config.ts` already sets `turbopack.root`; no `outputFileTracingRoot` is configured. The clean production build completed without a root/tracing error.
- `npm audit --omit=dev` exits nonzero with **8 vulnerabilities (1 moderate, 5 high, 2 critical)**, including critical Next.js and DOMPurify advisories. npm reports that the Next.js fix requires moving to 16.4.5, outside the current exact 16.2.9 pin. No force upgrade was applied; dependency remediation needs a separate compatibility review and validation.

## Remaining operator actions

1. Set the three required Vercel variables in all three environments and verify them without printing values.
2. Confirm the Render deployed commit SHA, effective start command, and full sanitized startup error.
3. Keep PostgreSQL migration execution blocked until the 18.6 advisory-lock tests, fresh install, and existing-schema reconciliation pass on isolated disposable databases.
4. Review the dependency advisories and plan tested upgrades separately.
5. After authorized deployment, verify Vercel build/runtime auth and Render `/health` plus `/ready`. No production deployment has been verified by this report.
