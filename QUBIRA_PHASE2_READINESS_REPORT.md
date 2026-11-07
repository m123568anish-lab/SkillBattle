# Qubira Phase 2 Readiness Report

## 1. Executive summary

The local frontend build, type-check, targeted frontend tests, backend persistence tests, and an isolated API smoke flow passed. The two broader mobile-navigation test failures are existing test/source expectation mismatches, not changes introduced in this audit. Backend failures were attributable to test setup (leaked temporary SQLite overrides and absent validated question fixtures) or an undeclared optional Psycopg2 dependency.

**Do not run migrations against the existing local database or deploy yet.** The Alembic graph has one head, but the original SQLite database is at `b8f2d4e6a901` and already contains the placement tables that the pending `7a2b1c4d9e8f` migration unconditionally creates. A fresh SQLite upgrade also fails earlier in the baseline migration. Production settings and Neon were not accessed, so their state remains unverified.

No application source, authentication, business logic, or production settings were changed. The original `skillbattle.db` was inspected read-only.

## 2. Scope and files reviewed

Frontend: `frontend/src/lib/api-origin.mjs`, `frontend/src/lib/api.ts`, both Next.js config files, the server-status component, `frontend/src/hooks/useBattleSocket.ts`, `frontend/src/store/dashboardStore.ts`, `frontend/src/lib/dashboard-data.mjs`, dashboard/API-origin tests, the mobile navigation test and its source data, profile UI, environment examples, and deployment documentation.

Backend and database: `backend/app/core/config.py`, SQLAlchemy engine/session initialization, `backend/run_migrations.py`, `backend/alembic.ini`, the complete Alembic history, the three relevant revisions, backend test configuration, persistence and battle tests, and the original SQLite schema via read-only SQLite inspection.

The prior unrelated changes in `frontend/src/app/globals.css` and `frontend/tests/theme.spec.ts` were not edited.

## 3. Defects and findings

- **Navigation test mismatch:** `frontend/tests/dashboard-nav.test.mjs` expects older labels/routes (including student `Battle`, `Leaderboard`, `Friends`, `More`, and college `Placement` at `/placement/scorecard`) that do not match the current `frontend/src/data/dashboard.ts`. Both files are unchanged from `HEAD`; therefore this audit did not introduce the mismatch. The current product navigation contract is not documented well enough to conclude whether the source or test should change. Assertions were not weakened.
- **Config-precedence test isolation:** the test clears `DATABASE_URL` and `ASYNC_DATABASE_URL`, but not temporary `SQLITE_DATABASE_URL` / `SQLITE_ASYNC_DATABASE_URL` values injected for the test. The one failure with those values set is a test-environment leak, not evidence that local runtime selects the wrong database.
- **Battle test fixtures:** three battle-creation tests fail without validated question-bank records. Seeding valid records only into a disposable test database makes the same three tests pass. No questions were added to the application database.
- **Optional dependency:** collection of `backend/tests/test_supabase_pooler_diagnostics.py` fails because it imports `psycopg2`, which is not installed; `backend/requirements.txt` lists Psycopg v3 instead. No package was installed and no Supabase connection was attempted.
- **Profile/cache browser check:** the profile route and profile reads worked against the isolated API, but the editor interaction and mutation-driven cache invalidation were not verified. The browser network guard blocked external requests, and the frontend reported failure to load its Clerk client script. An initial test account was also redirected to onboarding until onboarding was completed. These are test-environment/auth-provider limitations; no auth settings were changed.

## 4. Frontend validation

| Command / check | Result |
|---|---|
| `cd frontend; npm test` | **13 passed.** Covers the configured API-origin, API-proxy, and dashboard-data tests. |
| `cd frontend; node --test --test-reporter=tap tests/*.test.mjs` | **19 passed, 2 failed.** Both failures are the navigation mismatch described above. |
| `cd frontend; npx tsc --noEmit` | **Passed.** |
| `cd frontend; npm run build` | **Passed** on Next.js 16.2.9. |
| `cd frontend; .\node_modules\.bin\playwright.cmd test tests\theme.spec.ts --grep "public navigation"` | **1 passed** for the public mobile navigation flow. |
| Local API/browser smoke checks | Registration `201`, login/profile/dashboard/XP reads `200`, profile update/read-back `200`, and two dashboard refreshes `200` against a disposable SQLite database. Cache payload origin and user ownership matched. A profile-mutation cache refresh was not proven because the editor interaction was blocked as described above. |
| HTTP-to-WebSocket conversion review | `http`→`ws` and `https`→`wss` construction checked; no live WebSocket connection was made. |

The standalone runtime-validation plan also ran: production build, type-check, configured tests, and a Next home-route HTTP probe. **All four assertions passed**; the home route returned `200`. The test-count parser could not parse the Node TAP output and recorded `0` counts (`parse-failed`), falling back to the successful process exit code. The direct `npm test` result above is the test-count evidence. The plan is at `frontend/.tsupgrader/runtime-validation/eval-plan.json`; the standalone result is at `frontend/.tsupgrader/runtime-validation/standalone-result.json`.

## 5. Backend validation and persistence

| Command / setup | Result |
|---|---|
| `cd backend; python -m pytest tests/test_config_precedence.py -q` | **2 passed** with the normal environment. |
| `cd backend; python -m pytest tests/test_config_precedence.py::test_local_sqlite_settings_override_production_defaults -q --tb=short` with temporary `SQLITE_*` URLs left set | **1 failed**, because those overrides remain active while the test expects defaults. |
| `cd backend; python -m pytest tests/modules/test_local_database_persistence_restart.py -q` with fresh temporary SQLite URLs | **1 passed**, including persistence across engine disposal/restart. |
| `cd backend; python -m pytest tests/modules/test_battle_lifecycle_foundation.py tests/api/test_battle_engine.py -q` without seeded questions | **3 failed** due to zero validated questions. |
| Same battle test files with validated questions seeded only in a disposable SQLite DB | **3 passed.** |
| `cd backend; python -m pytest -q --tb=short --ignore=tests/test_supabase_pooler_diagnostics.py --ignore=tests/test_config_precedence.py` with isolated SQLite and test fixtures | **146 passed, 69 warnings.** |
| `cd backend; python -m pytest --collect-only -q` | Collection is blocked by the missing `psycopg2` import in the Supabase diagnostic module. |
| Local HTTP smoke flow against the disposable DB | Registration/login, profile read/update/read-back, dashboard and XP reads, and dashboard refresh succeeded. No application-server restart was performed as part of this HTTP flow; restart persistence is covered by the dedicated test above. |

The actual local database provider is SQLite. The original `D:\BattleAI\skillbattle.db` was opened with SQLite `mode=ro`: it contains **1,845 users**, revision `b8f2d4e6a901`, and `PRAGMA foreign_key_check` reported **zero violations**. The three placement tables each contain zero rows. No write, migration, stamp, reset, or backup operation was performed on the original database. Test fixtures and smoke-flow users were confined to disposable test databases.

XP/battle behavior has backend test coverage, but a full browser-driven battle settlement/history flow and an end-to-end admin-user update were not independently exercised in this audit.

## 6. API origin, cache, and routing

- `resolveApiOrigin()` normalizes HTTP(S) URLs, rejects credentials/query/fragment and unexpected paths, defaults to `http://localhost:8000` only for development/test, and requires `NEXT_PUBLIC_API_URL` elsewhere.
- The frontend Next rewrites route browser API requests through the configured origin. The WebSocket client derives `ws:`/`wss:` from that same origin. Static checks and build passed; production values were not verified.
- Dashboard local storage keys include the API origin; payloads are validated against both user ID and origin and carry a timestamp. Cache hydration is marked cached/stale, and successful live loads clear those indicators. On API failure, retained data remains explicitly stale rather than being represented as a fresh response.
- Mutation invalidation is wired through the dashboard invalidation event and exercised by unit coverage. The cache's environment/user isolation was observed in the isolated browser flow; the post-profile-mutation refetch remains unverified because the profile editor could not be exercised with the external auth script blocked.

## 7. Alembic graph and reconciliation

`python -m alembic -c alembic.ini heads` reports exactly one head: `47292a2a50d2`. `python -m alembic -c alembic.ini history --verbose` confirms the merge revision has parents `7a2b1c4d9e8f` and `b8f2d4e6a901`. These are independent branches from common revision `a9e4c1b7d602`; their migration operations affect different table groups. The merge revision is a no-op merge. No migration file was changed.

`backend/run_migrations.py` obtains the repository head dynamically and calls `command.upgrade(..., "head")`, so it targets the intended single-head graph. However, it also stamps head for a newly initialized schema and stamps head when existing revision metadata is empty, without a complete schema-parity check. Its duplicate-row repair likewise stamps the graph head. These branches must not be used to bypass schema reconciliation.

### Placement migration comparison

The pending placement revision is `7a2b1c4d9e8f`, parent `6e1c2d3f4a5b`. It creates `placement_companies`, `placement_tracks`, and `placement_track_rounds` and their indexes; its `upgrade()` is not guarded against existing tables. The current SQLite database already has all three tables even though its recorded revision is `b8f2d4e6a901`.

| Aspect | Migration `7a2b1c4d9e8f` | Existing SQLite schema |
|---|---|---|
| Tables / rows | Creates all three placement tables | All exist; each has 0 rows |
| Columns and nullability | Company: `id`, `name`, `category`, `source_url`, `last_verified_at`, `is_published`, `created_at`; track: `id`, `company_id`, `role`, `title`, `description`, `template_kind`, `is_published`; round: `id`, `track_id`, `position`, `title`, `assessment_type`, `topic`, `description`, nullable `assessment_id` | Same columns, SQLite types, primary keys, and nullability observed |
| Foreign keys | Track→company `CASCADE`; round→track `CASCADE`; round→unified assessment `SET NULL` | Same targets and delete actions observed |
| Unique constraints / indexes | Unique company name plus explicit company-name and category indexes; track indexes on company and role; round index on track | Company name is enforced by a unique index named `ix_placement_companies_name`; other named indexes match. The existing unique-index shape differs from the migration's unique constraint plus separately-created name index. |
| Defaults | Server defaults for company `source_url` (`""`) and `is_published` (`true`), and track `is_published` (`true`) | No server defaults on those existing columns |
| Data invariants | No uniqueness for track/round positions is declared by this migration | No rows in these placement tables; current schema has no detected FK violations |

The fresh disposable SQLite command `python -m alembic -c alembic.ini upgrade b8f2d4e6a901` failed in the base revision `dd495117949b_initial_database_schema.py`: it unconditionally drops `interview_questions`, which is absent in a fresh database. The chained `upgrade head` was therefore not reached. A migration from the original database is unsafe as well: its `b8f2d4e6a901` metadata would make Alembic attempt the unguarded placement table creation, which collides with existing tables.

**Reconciliation plan:** keep the original DB untouched; first make a verified backup only in a separately authorized phase, then reconcile the complete schema and revision metadata on a disposable copy. Fix fresh-install migration behavior in a forward-compatible, reviewed migration strategy without rewriting an applied production revision. Test both a fresh database and the exact existing schema copy. Do not stamp or upgrade the original until the schema diff, data invariants, and a rollback/recovery plan are approved. Neon was not inspected, so no claim is made about its schema.

## 8. Production verification and deployment blockers

No connection was made to Neon; no Render, Vercel, or UptimeRobot settings were accessed or changed. The following must be manually verified by an authorized operator:

1. Render service identity and whether `DATABASE_URL` points to the intended Neon database.
2. Render `ASYNC_DATABASE_URL` value and precedence relative to `DATABASE_URL`.
3. Vercel `NEXT_PUBLIC_API_URL` points to the intended Render backend and is present for the production build.
4. Vercel project root directory is `frontend`.
5. UptimeRobot's actual monitor target and whether it checks application health or database readiness. Locally, `/health` returned healthy while `/health/db` failed against an intentionally unmigrated temporary DB; the configured UptimeRobot URL was not inspected.

**Blockers before deployment:** resolve local schema/revision drift safely; repair or replace the fresh-database migration path; verify production environment values and the actual Neon schema; decide the expected mobile navigation contract; and arrange a permitted browser-auth test environment to complete mutation-driven cache invalidation verification.

## 9. Actions and approval boundary

Approved and completed: static review, local builds/tests, read-only inspection of the original SQLite schema, and test-only operations against disposable databases.

Not performed and still unapproved: migration/stamp/DDL against the original SQLite database or Neon, production access or settings changes, data imports/deletions, auth changes, deployment, dependency installation, or commits/pushes. No unrelated dashboard, XP, CSS, or theme-test changes were made.
