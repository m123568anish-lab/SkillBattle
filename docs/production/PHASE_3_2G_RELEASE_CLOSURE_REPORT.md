# Phase 3.2G PostgreSQL Validation and Release Closure

**Assessment:** release remains **BLOCKED**. Validation below used only loopback PostgreSQL 18.6 instances and disposable test data; no deployment was performed.

## Status summary

| Gate | Status | Evidence |
|---|---|---|
| Current Alembic graph | FIXED AND TESTED | 29 tracked revisions; exactly one head, `d1f5a8e7c2b4`. |
| PostgreSQL migration ownership | FIXED AND TESTED | Seven PostgreSQL ownership tests passed, including lock exclusion, owned-connection use, failure release, and release after process termination. |
| Fresh PostgreSQL baseline | FIXED AND TESTED | The isolated bootstrap test performed real ORM DDL, recorded the current revision afterward, and found no model-schema differences. |
| Existing-schema reconciliation and data preservation | BLOCKED | No schema-faithful, documented previous-schema fixture is available; preservation of users, profiles, XP, battles, and placements is unproven. |
| Normal PostgreSQL migration execution | BLOCKED | The intentional PostgreSQL activation gate remains closed. |
| API-only startup and readiness | FIXED AND TESTED | Uvicorn served the current schema; an empty incompatible schema remained unmodified and returned readiness HTTP 503. |
| Frontend dependency audit and build | FIXED AND TESTED | `npm audit` found zero vulnerabilities; unit, type, lint, production-build, and authenticated E2E checks passed. |
| Missing-auth-config runtime behavior | NOT TESTED | Local Next.js loaded dotenv files despite empty process values; its auth-session request returned HTTP 200. No response body was inspected. |
| Production Render/Vercel verification | NOT TESTED | No production settings, logs, database, or deployment were verified. |
| Validation isolation | BLOCKED | One initial pytest invocation selected the repository-default SQLite URL; its initializer may have applied schema repairs. See “Operator attention.” |

## Repository and migration graph

- Current branch and commit: `main`, `311a012b3470839e0884cd779d008207b9768534`.
- Comparison point requested: `8967803c9df17d4c2b63b9b71efa442b281ac60a`. The working tree differs materially from that commit; the comparison covered 52 files.
- The current tree contains 29 tracked files under `backend/alembic/versions`; no untracked migration revisions were found.
- `alembic heads` reports exactly one head: **`d1f5a8e7c2b4`**.
- `alembic history --verbose` confirms the relevant ancestry:

  ```text
  7a2b1c4d9e8f ─┐
                ├─ 47292a2a50d2 ─ a14c6e8d2b37 ─ c9b0f2d5a713 ─ d1f5a8e7c2b4
  b8f2d4e6a901 ─┘
  ```

  The earlier placement and opportunity branches are merged by the existing no-op graph revision `47292a2a50d2`. `a14c6e8d2b37` and `c9b0f2d5a713` are ancestors of the current head; none is a separate head. No merge revision was created in Phase 3.2G.

## Migration review and safety

Reviewed the historical root, merge ancestry, XP/battle reconciliation, and current identity/index/battle revisions, alongside the full Alembic history and operation inventory.

- `dd495117949b_initial_database_schema.py` is not a safe fresh-install chain: it assumes legacy objects exist and contains unconditional drops, including `interview_questions`. Do not replay the legacy chain on an empty or unknown database.
- `b0c9e2a7f1d4_sync_xp_and_battle_results.py` deletes duplicate XP rows after selecting a keeper, backfills missing XP rows, and has a guarded/lossy downgrade. Its data effects require an explicitly validated source schema.
- `47292a2a50d2_merge_migration_heads.py` joins revision ancestry; it does not reconcile database schema.
- `a14c6e8d2b37_add_neon_user_identity.py` conditionally adds a nullable identity column and unique index. Its downgrade removes those objects.
- `c9b0f2d5a713_adopt_assessment_submission_index.py` validates an existing index definition before adopting it and deliberately preserves the index on downgrade.
- `d1f5a8e7c2b4_reconcile_neon_battle_room_schema.py` conditionally adds battle ownership fields and verified constraints/indexes. It drops a redundant unique index only after confirming the matching constraint and definition; downgrade removes the migration-owned additions.

No historical revision was changed. The graph being single-headed does not establish that any production schema matches it.

## PostgreSQL 18.6 evidence

An isolated PostgreSQL 18.6 cluster listened only on `127.0.0.1` and was stopped and removed after testing. No Neon connection was intentionally used for these tests.

### Ownership tests

The targeted backend run completed **45 passed** with explicit disposable SQLite and PostgreSQL URLs. All seven tests in `test_postgresql_migration_coordinator.py` passed. Coverage includes:

- competing ownership lock exclusion and release;
- rejection of a different physical SQLAlchemy connection;
- Alembic DDL using the connection holding the advisory lock;
- fresh-schema bootstrap and metadata comparison;
- non-destructive comparison and index adoption;
- lock release following migration failure and connection/process termination.

The PostgreSQL test now patches the configured migration URLs as well as the engine, so Alembic's configured database-identity check is exercised correctly under pytest.

### Fresh schema

`test_fresh_postgresql_schema_bootstrap_stamps_current_head` passed against a fresh schema. The tested helper performs `Base.metadata.create_all()` first, then records the current revision, and verifies `compare_model_schema(...) == []`. A separate disposable baseline run observed 78 public tables including `alembic_version`, with revision `d1f5a8e7c2b4`.

This verifies the current model-based bootstrap, **not** replay of all historical `alembic upgrade head` scripts. The unsafe legacy root and the active PostgreSQL gate prevent claiming that a normal Alembic replay is a supported clean-install path.

### Existing-schema reconciliation

**BLOCKED.** The architecture document says the supported historical schema profiles and fingerprints are not yet defined. No faithful prior-schema snapshot was available. Therefore there is no verified evidence that an upgrade preserves existing users, profiles, XP/levels, battle records, placement records, or unknown schema objects. No schema was fabricated or relabeled to simulate production history.

Do not open the PostgreSQL gate until a supported previous-schema fixture is documented and a disposable reconciliation test proves data/object preservation and safe refusal of unknown states.

## Migration runner and API-only startup

`backend/run_migrations.py` requires `--execute`. Before acquiring ownership, it calls `require_supported_migration_dialect`; the PostgreSQL coordinator intentionally raises while the activation gate is closed. **Do not remove the gate, stamp a production database, or run the migration job against Render/Neon.**

FastAPI's lifespan does not invoke the migration runner. The tested API-only command was:

```sh
uvicorn app.main:app --host 127.0.0.1 --port <disposable-port>
```

Against a disposable database at the current schema, synthetic student data produced:

| Request | Result |
|---|---:|
| `/health` | 200 |
| `/ready` | 200 |
| `/api/v1/auth/me` with a valid synthetic token | 200 |
| `/api/v1/dashboard` with a valid synthetic token | 200 |
| `/api/v1/auth/me` with an invalid token | 401 |

Against a separate empty PostgreSQL database, API startup did not create tables or `alembic_version`: the public table count remained zero. `/health` returned 200 and `/ready` returned 503 with `database=connected`, `migration_status=pending`, `connection_ready=false`, and the repository head reported as `d1f5a8e7c2b4`. This confirms the API does not silently migrate or declare an incompatible schema ready.

## Dependency and frontend validation

The current dependency remediation pins Next.js to `16.4.5` and retains the narrow DOMPurify override at `3.4.17`. The resolved tree reports `@neon/auth@0.8.2`, Better Auth `1.7.18`, `@better-fetch/fetch@1.3.3`, and React `18.2.0`.

| Command | Result |
|---|---|
| `npm audit` | 0 vulnerabilities |
| `npm test` | 17 passed |
| `npx tsc --noEmit` | Passed |
| `npm run lint` | Passed; five existing `<img>` optimization warnings, zero errors |
| `npm run build` | Passed after removing two inspected malformed stale `.next/dev/types` artifacts |
| `npm run test:e2e` | 5 passed, including unauthenticated redirect and authenticated opportunity flows at 360/390/430 px and desktop |

Next.js reports that React 18 support is deprecated for Next.js 16 and will be removed in Next.js 17. This is a warning, not a build failure; React was not upgraded in this phase.

The production build output listed `.env.local` and `.env.production` as loaded. Their contents were not inspected or printed.

### Auth runtime smoke-test caveat

A local `next start` process was launched with empty `NEON_AUTH_BASE_URL` and `NEON_AUTH_COOKIE_SECRET` process values. Next.js loaded the dotenv files, and a local `GET /api/auth/get-session` returned HTTP 200. The response body was not inspected; the response file and server process were removed/stopped. Because the dotenv values may have populated runtime auth configuration, this does **not** validate missing-secret behavior and may have contacted the configured Auth upstream. No claim is made that this request was isolated from production. Do not repeat this smoke test until the operator provides a sanitized, explicitly non-production auth configuration.

## Render/Vercel release reconciliation

- The local `render.yaml` has working-tree changes that were preserved; this phase did not edit Render configuration.
- Render's deployed commit, effective start command, and production logs remain unknown. Local `HEAD` is not proof of what Render runs.
- No live Vercel/Render environment settings were read or changed. The local dotenv files noted above were loaded by Next.js, but their values were not inspected or printed. Vercel must have the following variable **names** configured separately for Production, Preview, and Development, with values verified only by an authorized operator:
  - `NEON_AUTH_BASE_URL`
  - `NEON_AUTH_COOKIE_SECRET`
  - `NEXT_PUBLIC_API_URL`
- Render auth verification also requires the matching `NEON_AUTH_BASE_URL` and `NEON_AUTH_JWKS_URL`; no values belong in this report.

Proposed command structure, **not authorized for deployment yet**:

1. Controlled, one-off migration job after the missing existing-schema gate passes:

   ```sh
   python -u run_migrations.py --execute
   ```

   Use the approved direct migration URL and explicit ownership/backup procedure. In the current code this exits at the PostgreSQL activation gate; do not schedule it as a workaround.

2. API-only Render web service:

   ```sh
   exec uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

   Monitor `/health` for liveness and `/ready` for read-only schema compatibility. Keep readiness failures visible.

Before any release, an operator must capture the deployed Render commit SHA, effective start command, and sanitized startup logs; confirm the Vercel environment variable names are present without exposing values; and complete authorized staged migration validation. No deploy or live configuration change was made here.

## Operator attention: validation isolation

One initial backend pytest invocation set `DATABASE_URL` to PostgreSQL but did not override `SQLITE_DATABASE_URL`. The application's settings detect pytest and force SQLite, so the test fixture's `init_db()` selected the configured SQLite URL; absent a local override, its default is `sqlite:///./skillbattle.db` from the backend working directory. `RESET_DB` was false, so no reset or deletion was requested, but `init_db()` can run `create_all` and schema repair logic. Its resolved path and before/after state were not captured. The command failed because that SQLite schema lacked `users.neon_user_id`.

No further access to that default SQLite path was made. The later 45-test run explicitly used a new temporary SQLite file plus a separate loopback PostgreSQL database and passed. The repository-local SQLite file was not inspected or restored; its state is unverified and requires operator review. Do not interpret the initial pytest result as a production-schema failure.

## Final disposition

The Alembic graph, PostgreSQL ownership tests, fresh model-based bootstrap, API-only startup, incompatible-schema readiness behavior, and frontend dependency/build checks passed in disposable environments. Release closure is **BLOCKED** by the unvalidated existing-database profile and the intentionally closed PostgreSQL execution gate. Production behavior is **NOT TESTED**. The two operator-attention caveats above must be resolved before claiming full compliance or production readiness.
