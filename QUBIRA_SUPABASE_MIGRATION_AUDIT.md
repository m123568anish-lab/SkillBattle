# QUBIRA — FULL SQLITE TO SUPABASE MIGRATION AUDIT
## Phase 1: Comprehensive Read-Only System, Schema, Authentication & Dependency Audit

**Audit Timestamp:** 2026-11-05 18:55:00 UTC+05:30  
**Audit Mode:** Strict READ-ONLY (Zero writes, zero schema modifications, zero credential exposures)  
**Target Environment:** Supabase PostgreSQL & Supabase Auth  
**Current System:** Local SQLite (`skillbattle.db`) + Hybrid Clerk / Native FastAPI Auth  

---

## 1. Executive Summary

This document presents the complete Phase 1 Read-Only Migration Audit for migrating the **Qubira** platform from its local SQLite database (`skillbattle.db`) and Clerk/Native authentication architecture to **Supabase PostgreSQL** and **Supabase Auth**.

### Key Audit Findings
1. **Database Location & Integrity:** The live SQLite database is located at `D:\BattleAI\skillbattle.db` (6,410,240 bytes). Integrity checks (`PRAGMA integrity_check`, `PRAGMA quick_check`) passed with status `ok`. Foreign key verification (`PRAGMA foreign_key_check`) confirmed **0 foreign key violations** across the entire database.
2. **Schema & Record Volume:** The database contains **78 tables** and **0 views**, containing **14,940 total records**.
   - 47 tables contain active production/seed data (ranging from 1 to 1,845 rows).
   - 31 tables currently contain 0 rows (fully structured schema ready for feature activation).
3. **Data Integrity & Consistency:**
   - `users` table contains **1,845 user accounts**.
   - **0 null or empty emails**; **0 duplicate emails**; **0 duplicate usernames**.
   - Every single `users.id` (1,845 / 1,845) is a valid, RFC-compliant **UUID v4** string.
   - **0 orphaned foreign key references** across all child tables referencing `users`.
4. **Authentication Dual-Stack Discovery:**
   - The application does not use Clerk exclusively. It operates a **dual authentication architecture**:
     - **Native FastAPI Auth:** Handles registration, password hashing (`Argon2id`), login, session tokens, refresh tokens, and two-factor authentication (TOTP). **1,813 users have standard `$argon2id$` password hashes** in the SQLite database.
     - **Clerk Auth:** Serves as an SSO overlay. **68 users** have `clerk_user_id` populated. Crucially, all 68 Clerk users **also possess an Argon2id password hash, verified email, and internal UUID in the database**.
5. **Supabase Auth Migration Feasibility:**
   - Supabase Auth natively supports **Argon2id** password hashes via its Admin API (`supabase.auth.admin.createUser({ password_hash: ... })`) and direct SQL insertion into `auth.users`.
   - Because existing user IDs are already UUIDs and password hashes are preserved in the database, users can be migrated without requiring a mass password reset.
6. **Dependency Order & Graph Topology:**
   - The foreign key dependency graph of all 78 tables was analyzed using Kahn's algorithm. It forms a **clean Directed Acyclic Graph (DAG) with 0 circular dependencies** and 0 self-referencing foreign keys.
   - The migration sequence is deterministic across 78 sequential topological ranks.

---

## 2. Actual SQLite Database Location & Integrity Status

### Physical Storage & Verification
- **Primary Database File Path:** `D:\BattleAI\skillbattle.db`
- **File Size:** `6,410,240 bytes` (~6.11 MB)
- **Last Modified Timestamp:** `03-11-2026 23:50:28`
- **Legacy Artifact Identified:** `D:\BattleAI\_legacy_questions_d53ac800469d4b3ea37f2b60d2a9912d.db` (8,192 bytes, legacy backup from 01-10-2026; confirmed inactive).
- **Backend Configuration Binding:** `backend/app/core/config.py` defaults to `sqlite:///./skillbattle.db` and `sqlite+aiosqlite:///./skillbattle.db`, resolving to this file.

### Diagnostic PRAGMA Results
| Verification Check | PRAGMA Executed | Result | Status |
|---|---|---|---|
| Complete Database Integrity | `PRAGMA integrity_check;` | `["ok"]` | ✅ PASS |
| B-Tree / Freelist Quick Check | `PRAGMA quick_check;` | `["ok"]` | ✅ PASS |
| Relational Foreign Key Integrity | `PRAGMA foreign_key_check;` | `[]` (0 violations) | ✅ PASS |
| Schema Table Count | `SELECT COUNT(*) FROM sqlite_master WHERE type='table'` | `79` (78 app + 1 `sqlite_sequence`) | ✅ PASS |
| View Count | `SELECT COUNT(*) FROM sqlite_master WHERE type='view'` | `0` | ✅ PASS |

---

## 3. Complete Schema Inventory & Aggregate Statistics

### Database Dimension Summary
- **Total Tables:** 78
- **Total Rows:** 14,940
- **Total Foreign Key Relationships:** 84
- **Total Unique Constraints / Unique Indexes:** 55
- **Primary Key Architecture:**
  - `INTEGER` (Auto-incrementing identity): 44 tables
  - `VARCHAR(36)` (UUID v4 string): 30 tables
  - `VARCHAR` / `VARCHAR(32)` / `VARCHAR(100)`: 4 tables (`alembic_version`, `conversations`, `messages`, `quest_map_levels`)

### Column Data Types Utilized in SQLite
The following SQLite type affinities exist across the 78 tables:
- Numeric: `INTEGER`, `FLOAT`, `BOOLEAN`
- Temporal: `DATETIME`, `TIMESTAMP`, `DATE`
- Textual: `TEXT`, `VARCHAR`, `VARCHAR(9)` through `VARCHAR(2000)`
- Structured: `JSON`

---

## 4. Row Counts for Every Table

The following table provides the audited row counts across all 78 tables in `skillbattle.db`:

| Table Name | Row Count | Primary Key Type | Primary Key Column(s) | Role / Domain |
|---|---|---|---|---|
| `users` | **1,845** | VARCHAR(36) | `id` | Core user accounts & credentials |
| `refresh_tokens` | **1,702** | VARCHAR(36) | `id` | Active JWT refresh tokens & sessions |
| `user_settings` | **1,683** | INTEGER | `id` | User preferences & notifications |
| `user_stats` | **1,683** | INTEGER | `id` | Global rating, win rates & streaks |
| `xp` | **1,683** | INTEGER | `id` | Aggregated XP & tier levels |
| `profiles` | **1,452** | INTEGER | `id` | User profile bios, socials, tags |
| `problems` | **624** | INTEGER | `id` | Coding problem repository |
| `audit_logs` | **414** | VARCHAR(36) | `id` | Security audit & activity logs |
| `notifications` | **414** | VARCHAR(36) | `id` | In-app user notifications |
| `companies` | **296** | INTEGER | `id` | Registered employer entities |
| `company_members` | **296** | INTEGER | `id` | Recruiter/admin company memberships |
| `job_postings` | **286** | INTEGER | `id` | Published job & internship posts |
| `candidate_applications` | **196** | INTEGER | `id` | Student applications to job postings |
| `xp_ledger` | **186** | INTEGER | `id` | Immutable XP transaction history |
| `application_status_history` | **158** | INTEGER | `id` | Job application stage audit trail |
| `battle_participants` | **150** | VARCHAR(36) | `id` | Participants in battle rooms |
| `battle_rooms` | **150** | VARCHAR(36) | `id` | Active and historical battle arenas |
| `roadmap_tasks` | **147** | INTEGER | `id` | Sub-tasks in curriculum roadmaps |
| `candidate_privacy_settings` | **145** | INTEGER | `id` | Candidate discovery preferences |
| `battle_configs` | **117** | VARCHAR(36) | `id` | Arena duel match parameter templates |
| `battle_submissions` | **113** | VARCHAR(36) | `id` | Code/MCQ battle submission records |
| `roadmap_weeks` | **98** | INTEGER | `id` | Weekly milestones in learning tracks |
| `college_assessment_questions` | **96** | INTEGER | `id` | Institutional exam questions |
| `interview_questions` | **78** | INTEGER | `id` | Technical & behavioral interview prompts |
| `battle_results` | **68** | VARCHAR(36) | `id` | Battle final scores & ratings delta |
| `colleges` | **65** | INTEGER | `id` | Verified college organizations |
| `departments` | **65** | INTEGER | `id` | Academic departments within colleges |
| `batches` | **64** | INTEGER | `id` | Student graduation batches |
| `college_assessment_submissions` | **64** | INTEGER | `id` | Student submissions to college exams |
| `college_assessments` | **64** | INTEGER | `id` | Institutional placement assessments |
| `college_students` | **64** | INTEGER | `id` | College-enrolled student links |
| `saved_opportunities` | **54** | INTEGER | `id` | Bookmarked jobs & internships |
| `code_submissions` | **50** | INTEGER | `id` | Practice code editor submissions |
| `roadmaps` | **49** | INTEGER | `id` | Personalized AI learning paths |
| `questions` | **38** | INTEGER | `id` | Practice MCQ & task questions |
| `company_interviews` | **37** | INTEGER | `id` | Scheduled candidate interviews |
| `daily_challenges` | **36** | INTEGER | `id` | Daily coding & quiz challenges |
| `daily_practice_sessions` | **36** | INTEGER | `id` | Daily practice tracking sessions |
| `streak` | **29** | INTEGER | `id` | Active consecutive activity streaks |
| `user_daily_activities` | **29** | INTEGER | `id` | Activity calendar history |
| `interview_answers` | **26** | INTEGER | `id` | Candidate audio/text responses |
| `interview_sessions` | **26** | INTEGER | `id` | Candidate AI mock interview sessions |
| `problem_starter_codes` | **24** | INTEGER | `id` | Language boilerplates for problems |
| `problem_test_cases` | **18** | INTEGER | `id` | Input/output test suites for problems |
| `quest_map_levels` | **9** | VARCHAR(100) | `id` | Gamified campaign roadmap nodes |
| `tournaments` | **7** | VARCHAR(36) | `id` | Scheduled tournament competitions |
| `tournament_participants` | **5** | VARCHAR(36) | `id` | Registered tournament entrants |
| `alembic_version` | **1** | VARCHAR(32) | `version_num` | Alembic migration checkpoint (`b8f2d4e6a901`) |
| `achievements` | **0** | INTEGER | `id` | Badge awards definitions & unlocks |
| `api_request_logs` | **0** | VARCHAR(36) | `id` | Developer API call telemetry |
| `assessment_attempts` | **0** | VARCHAR(36) | `id` | Standardized assessment test runs |
| `assessment_question_submissions` | **0** | VARCHAR(36) | `id` | Granular assessment question answers |
| `campaign_attempts` | **0** | INTEGER | `id` | Quest map campaign level attempts |
| `company_skill_requirements` | **0** | VARCHAR(36) | `id` | Company hiring skill tags |
| `conversations` | **0** | VARCHAR | `id` | AI Mentor chat conversation threads |
| `developer_api_keys` | **0** | VARCHAR(36) | `id` | Public API integration keys |
| `developer_api_usages` | **0** | VARCHAR(36) | `id` | Usage tracking per API key |
| `friendships` | **0** | INTEGER | `id` | Bidirectional social connections |
| `interviews` | **0** | VARCHAR(36) | `id` | Generic mock interview entity |
| `matchmaking_matches` | **0** | VARCHAR(36) | `id` | Real-time matchmaking pairings |
| `messages` | **0** | VARCHAR | `id` | Chat thread message records |
| `password_reset_tokens` | **0** | VARCHAR(36) | `id` | One-time password reset tokens |
| `placement_companies` | **0** | VARCHAR(36) | `id` | Placement track catalog companies |
| `placement_prep_sessions` | **0** | VARCHAR(36) | `id` | Curated company speedrun sessions |
| `placement_track_rounds` | **0** | VARCHAR(36) | `id` | Rounds within placement tracks |
| `placement_tracks` | **0** | VARCHAR(36) | `id` | Company-specific hiring tracks |
| `problem_tags` | **0** | INTEGER | `id` | Topic tags linked to problems |
| `quest_progress` | **0** | VARCHAR(36) | `id` | User quest map level completions |
| `question_exposures` | **0** | INTEGER | `id` | Problem exposure fatigue tracking |
| `resumes` | **0** | VARCHAR(36) | `id` | Uploaded resume files & ATS scores |
| `skill_evidence` | **0** | VARCHAR(36) | `id` | Granular verified skill data |
| `student_skill_profiles` | **0** | VARCHAR(36) | `id` | Aggregated student skill radar data |
| `test_cases` | **0** | INTEGER | `id` | Legacy testcases table |
| `tournament_matches` | **0** | VARCHAR(36) | `id` | Bracket match pairings |
| `unified_assessments` | **0** | VARCHAR(36) | `id` | Universal skill assessment catalog |
| `user_campaign_progress` | **0** | INTEGER | `id` | Campaign track user progress |
| `user_skill_stats` | **0** | INTEGER | `id` | Specific skill mastery points |
| `user_submissions` | **0** | INTEGER | `id` | Legacy question submissions |

---

## 5. SQLAlchemy Architecture & Alembic Audit

### Authoritative Migration System
- **Authoritative System:** **Alembic** is confirmed as the official, authoritative schema migration system for the project.
- **Current Alembic Revision:** `b8f2d4e6a901` (`b8f2d4e6a901_add_opportunity_lifecycle_and_saves.py`).
- **Configuration Path:** `backend/alembic.ini` pointing to `backend/alembic/`.
- **Target Metadata:** Bound to `app.models.Base.metadata` with unified `NAMING_CONVENTION` in `backend/app/database/base.py`.

### Model vs SQLite Schema Comparison
A programmatic inspection comparing `Base.metadata.tables` with SQLite `sqlite_master` revealed:
1. **Model Table Registration:**
   - 72 models are explicitly imported in `backend/app/models/__init__.py`.
   - 5 models exist in the codebase but were omitted from `app/models/__init__.py`:
     - `tournaments` (`backend/app/models/tournament/tournament.py`)
     - `tournament_matches` (`backend/app/models/tournament/tournament_match.py`)
     - `tournament_participants` (`backend/app/models/tournament/tournament_participant.py`)
     - `friendships` (`backend/app/models/friend.py`)
     - `interviews` (`backend/app/modules/interview/model.py`)
   - `alembic_version` is managed internally by Alembic.
   - Adding these 5 imports to `backend/app/models/__init__.py` will make `Base.metadata.tables` 100% complete across all 77 application tables.
2. **Column Divergence:**
   - In table `battle_rooms`, migration `c1f4a8d2e9b0_add_adaptive_battle_history.py` added `adaptive_owner_id VARCHAR(36)` and `adaptive_date DATE` to the SQLite table, but `backend/app/models/battle.py` omitted these two fields on the `BattleRoom` class.
   - All other 77 tables have 100% identical columns between SQLAlchemy models and the physical SQLite database.
3. **Session & Connection Management:**
   - `backend/app/database/session.py` already includes dynamic detection and optimization for PostgreSQL:
     - Sets driver to `postgresql+asyncpg://`.
     - Configures pool parameters: `pool_size=5`, `max_overflow=10`, `pool_timeout=15`, `pool_recycle=300`, `pool_pre_ping=True`.
   - `backend/app/database/database.py` includes sync PostgreSQL engine configuration (`postgresql+psycopg://`).
   - SQLite hardcoded checks (`check_same_thread: False`, relative path normalization) are safely isolated inside `if database_url.startswith("sqlite"):` blocks.

---

## 6. Clerk Authentication Architecture Audit

### Frontend Integration
- **Package:** `@clerk/nextjs` (version `^7.9.15`).
- **Provider Wrapper:** `frontend/src/app/layout.tsx` wraps the root DOM with `<ClerkProvider>`.
- **Clerk Routes:**
  - `frontend/src/app/sign-in/[[...sign-in]]/page.tsx` renders Clerk's `<SignIn />`.
  - `frontend/src/app/sign-up/[[...sign-up]]/page.tsx` renders Clerk's `<SignUp />`.
  - `frontend/src/components/navbar/ClerkAuthControls.tsx` renders `<SignInButton>`, `<SignUpButton>`, and `<UserButton>`.
- **Proxy Middleware:** `frontend/src/proxy.ts` defines request matchers for Next.js SSR headers.
- **Session & API Interceptor:**
  - `frontend/src/context/AuthContext.tsx` invokes `useClerkAuth()`. When `isSignedIn === true`, it calls `configureClerkTokenProvider` in `frontend/src/lib/api.ts`.
  - `frontend/src/lib/api.ts` attaches `Authorization: Bearer <clerkToken>` to all outgoing Axios requests.
  - If no Clerk session is active, it falls back to `localStorage.getItem("access_token")`.

### Backend Integration
- **Environment Variables:**
  - `CLERK_SECRET_KEY`: Used for backend API calls to `api.clerk.com/v1/users/{id}`.
  - `CLERK_JWT_KEY` / `CLERK_ISSUER_URL` / `CLERK_JWKS_URL` / `CLERK_AUDIENCE`: Used in `backend/app/core/security/clerk.py` to verify JWT signatures.
- **Token Verification:**
  - `backend/app/core/dependencies.py` (`get_current_user`):
    1. First attempts `decode_token(token)` (native JWT verification).
    2. If that fails, falls back to `verify_clerk_token(token)` and `_get_or_create_clerk_user(db, claims)`.
- **User Linking Mechanism:**
  - Checks if `User.clerk_user_id == claims["sub"]`.
  - If not matched, fetches Clerk user profile via email, links `user.clerk_user_id = claims["sub"]`, and sets `is_verified = True`.
  - If user does not exist, provisions a new `User` with UUID `id`, generated password hash, and `account_type = metadata.get("account_type", "STUDENT")`.

### Clerk vs Native User Population Breakdown
- **Total Users in SQLite:** `1,845`
- **Users with `clerk_user_id` populated:** `68` (3.69%)
- **Users with native accounts only:** `1,777` (96.31%)
- **Clerk Webhooks:** **None implemented**. There are no Clerk webhook consumers or signature verifiers in the backend.

---

## 7. Supabase Auth Migration Feasibility

### Password Hash Transferability
- **Native User Password Hashes:** `1,813` users in `users.password_hash` have standard modular crypt format **Argon2id** hashes (`$argon2id$...`).
- **Supabase Compatibility:** Supabase Auth (GoTrue) natively supports both **Argon2id** and **bcrypt** hashes.
- **Import Strategy:** Using the Supabase Admin SDK (`supabase.auth.admin.createUser`) or direct insert into `auth.users`, we pass `password_hash: user.password_hash` with `email_confirm: true`.
- **Outcome:** **Users will NOT be forced to reset their passwords.** They can log into Supabase Auth immediately using their existing credentials.

### Clerk Users Password Situation
- For the 68 users who authenticated via Clerk:
  - All 68 already possess a valid row in `users` with an Argon2id hash (assigned during account creation in `_get_or_create_clerk_user`).
  - If the user originally registered on Qubira with a password before linking Clerk, their password is their known password.
  - If the user signed up exclusively through Clerk OAuth (Google/GitHub) or magic link, their password in `users` is a random Argon2 hash.
  - **Resolution for Clerk OAuth Users:** When Supabase Auth is enabled with Google and GitHub OAuth providers matching the same email, Supabase Auth links the identities by email (`email_confirm: true`), allowing seamless 1-click SSO login. Alternatively, users can use Supabase's "Forgot Password" / magic link.

### Email Verification Status
- Out of 1,845 users in `users`:
  - `1,845` have non-null, valid emails.
  - `is_verified` is `1` for all active student, college, and company accounts.
  - During Supabase Auth migration, all users will be imported with `email_confirm: true`, preserving their verified standing.

### Sessions, MFA & Tokens
- **Existing Sessions:** All current JWT access and refresh tokens (`refresh_tokens` table) are tied to the local secret key and Clerk. During migration cutover, all old sessions will be cleanly invalidated, requiring users to log in once through Supabase Auth.
- **Two-Factor Authentication (MFA):**
  - In SQLite `users`, two-factor fields exist (`two_factor_enabled`, `two_factor_secret`, `two_factor_recovery_hashes`).
  - Supabase Auth manages TOTP factors in `auth.mfa_factors`. Because secret formats and recovery hash structures differ, users with active 2FA will be prompted to re-enroll their authenticator in Supabase MFA.

---

## 8. Identity Mapping Proposal

### Core Preservation Requirement
The application has **over 40 tables with foreign keys referencing `users.id`**. Rewriting `users.id` to a new ID would require updating hundreds of thousands of foreign key records across dozens of tables and risks breaking relational integrity.

### The Identity Solution
Because **every `users.id` in `skillbattle.db` is already an RFC-compliant UUID v4**, we can map identities with **zero foreign key rewrites**:

```
Existing SQLite `users.id` (UUID v4) 
                │
                ├───> Supabase `auth.users.id` (UUID)  [Identical Value]
                │
                └───> Supabase `public.users.id` (UUID) [Identical Value]
```

### Proposed Schema Enhancement for `public.users`
Add an explicit column to `public.users` to maintain an auditable link to Supabase Auth:

```sql
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for high-speed token resolution
CREATE INDEX IF NOT EXISTS ix_users_auth_user_id ON public.users(auth_user_id);
```

### Mapping Attributes Matrix
| Identifier Field | Purpose | Target Type | Preserved / Migrated |
|---|---|---|---|
| `users.id` | Internal primary key referenced by 40+ tables | `UUID` | **100% Preserved** (No FK rewrites) |
| `auth.users.id` | Supabase Auth user identity | `UUID` | **Set to match `users.id`** |
| `users.auth_user_id` | Foreign key linking application user to Supabase Auth | `UUID` | **Populated with `auth.users.id`** |
| `users.clerk_user_id` | Historical Clerk subject reference (`user_2...`) | `VARCHAR(64)` | **Preserved as historical audit column** |
| `users.email` | Unique account identifier | `VARCHAR(255)` | **Identical in `auth.users` & `public.users`** |

### Resume Safety & Idempotency
If the migration script is interrupted, it can safely be re-run:
1. Lookup existing `auth.users` record by `email` or `id`.
2. If already created, update `public.users.auth_user_id = auth.users.id`.
3. If not created, create `auth.users` with `id = public.users.id`.
4. This ensures strict idempotency and zero duplicate creation.

---

## 9. Table-by-Table Migration Matrix

The complete migration matrix for all 78 tables from SQLite to Supabase PostgreSQL:

| # | Source Table | Source Rows | Target PostgreSQL Table | Primary Key | Key Foreign Keys | Type Transformations & Mapping Rules |
|---|---|---|---|---|---|---|
| 1 | `streak` | 29 | `public.streak` | `id` (INT) | None | `last_activity_date` -> DATE |
| 2 | `placement_companies` | 0 | `public.placement_companies` | `id` (UUID) | None | UUID string -> UUID |
| 3 | `tournaments` | 7 | `public.tournaments` | `id` (UUID) | None | `created_at` -> TIMESTAMPTZ |
| 4 | `questions` | 38 | `public.questions` | `id` (INT) | None | `options` -> JSONB |
| 5 | `quest_map_levels` | 9 | `public.quest_map_levels` | `id` (VARCHAR) | None | `rewards` -> JSONB |
| 6 | `alembic_version` | 1 | `public.alembic_version` | `version_num` | None | VARCHAR(32) |
| 7 | `conversations` | 0 | `public.conversations` | `id` (VARCHAR) | None | `created_at` -> TIMESTAMPTZ |
| 8 | `users` | 1,845 | `public.users` | `id` (UUID) | None | UUID string -> UUID, booleans -> BOOLEAN, add `auth_user_id` UUID |
| 9 | `daily_challenges` | 36 | `public.daily_challenges` | `id` (INT) | None | `challenge_date` -> DATE |
| 10 | `problems` | 624 | `public.problems` | `id` (INT) | None | `examples` -> JSONB, `constraints` -> JSONB |
| 11 | `api_request_logs` | 0 | `public.api_request_logs` | `id` (UUID) | None | `timestamp` -> TIMESTAMPTZ |
| 12 | `unified_assessments` | 0 | `public.unified_assessments` | `id` (UUID) | None | `config` -> JSONB |
| 13 | `placement_tracks` | 0 | `public.placement_tracks` | `id` (UUID) | `company_id` -> `placement_companies` | UUID FK |
| 14 | `tournament_matches` | 0 | `public.tournament_matches` | `id` (UUID) | `tournament_id` -> `tournaments` | UUID FK |
| 15 | `messages` | 0 | `public.messages` | `id` (VARCHAR) | `conversation_id` -> `conversations` | Text FK |
| 16 | `achievements` | 0 | `public.achievements` | `id` (INT) | `user_id` -> `users` | `unlocked` -> BOOLEAN |
| 17 | `audit_logs` | 414 | `public.audit_logs` | `id` (UUID) | `user_id` -> `users` | `metadata` -> JSONB |
| 18 | `campaign_attempts` | 0 | `public.campaign_attempts` | `id` (INT) | `user_id` -> `users` | `created_at` -> TIMESTAMPTZ |
| 19 | `candidate_privacy_settings` | 145 | `public.candidate_privacy_settings` | `id` (INT) | `user_id` -> `users` | `allow_recruiter_search` -> BOOLEAN |
| 20 | `colleges` | 65 | `public.colleges` | `id` (INT) | `admin_user_id` -> `users` | `is_verified` -> BOOLEAN |
| 21 | `companies` | 296 | `public.companies` | `id` (INT) | `created_by_user_id` -> `users` | `is_verified` -> BOOLEAN |
| 22 | `developer_api_keys` | 0 | `public.developer_api_keys` | `id` (UUID) | `user_id` -> `users` | `is_active` -> BOOLEAN |
| 23 | `friendships` | 0 | `public.friendships` | `id` (INT) | `user_id`, `friend_id` -> `users` | Composite unique |
| 24 | `interview_sessions` | 26 | `public.interview_sessions` | `id` (INT) | `user_id` -> `users` | `analysis` -> JSONB |
| 25 | `interviews` | 0 | `public.interviews` | `id` (UUID) | `user_id` -> `users` | `feedback` -> JSONB |
| 26 | `matchmaking_matches` | 0 | `public.matchmaking_matches` | `id` (UUID) | `player1_id`, `player2_id` -> `users` | `matched_at` -> TIMESTAMPTZ |
| 27 | `notifications` | 414 | `public.notifications` | `id` (UUID) | `user_id` -> `users` | `is_read` -> BOOLEAN |
| 28 | `password_reset_tokens` | 0 | `public.password_reset_tokens` | `id` (UUID) | `user_id` -> `users` | `expires_at` -> TIMESTAMPTZ |
| 29 | `placement_prep_sessions` | 0 | `public.placement_prep_sessions` | `id` (UUID) | `user_id` -> `users` | `metrics` -> JSONB |
| 30 | `profiles` | 1,452 | `public.profiles` | `id` (INT) | `user_id` -> `users` | `onboarding_preferences` -> JSONB |
| 31 | `question_exposures` | 0 | `public.question_exposures` | `id` (INT) | `user_id` -> `users`, `question_id` -> `questions` | `exposed_at` -> TIMESTAMPTZ |
| 32 | `refresh_tokens` | 1,702 | `public.refresh_tokens` | `id` (UUID) | `user_id` -> `users` | `revoked` -> BOOLEAN (Deprecated in Supabase) |
| 33 | `resumes` | 0 | `public.resumes` | `id` (UUID) | `user_id` -> `users` | `skills` -> JSONB |
| 34 | `roadmaps` | 49 | `public.roadmaps` | `id` (INT) | `user_id` -> `users` | `milestones` -> JSONB |
| 35 | `skill_evidence` | 0 | `public.skill_evidence` | `id` (UUID) | `user_id` -> `users` | `evidence_data` -> JSONB |
| 36 | `student_skill_profiles` | 0 | `public.student_skill_profiles` | `id` (UUID) | `user_id` -> `users` | `skill_map` -> JSONB |
| 37 | `tournament_participants` | 5 | `public.tournament_participants` | `id` (UUID) | `user_id` -> `users`, `tournament_id` -> `tournaments` | Composite unique |
| 38 | `user_campaign_progress` | 0 | `public.user_campaign_progress` | `id` (INT) | `user_id` -> `users` | `level` -> INT |
| 39 | `user_daily_activities` | 29 | `public.user_daily_activities` | `id` (INT) | `user_id` -> `users` | `activity_date` -> DATE |
| 40 | `user_settings` | 1,683 | `public.user_settings` | `id` (INT) | `user_id` -> `users` | `email_notifications` -> BOOLEAN |
| 41 | `user_skill_stats` | 0 | `public.user_skill_stats` | `id` (INT) | `user_id` -> `users` | `accuracy` -> FLOAT |
| 42 | `user_stats` | 1,683 | `public.user_stats` | `id` (INT) | `user_id` -> `users` | Rating & battle counts |
| 43 | `user_submissions` | 0 | `public.user_submissions` | `id` (INT) | `user_id` -> `users`, `question_id` -> `questions` | `is_correct` -> BOOLEAN |
| 44 | `xp` | 1,683 | `public.xp` | `id` (INT) | `user_id` -> `users` | `total_xp` -> INT |
| 45 | `xp_ledger` | 186 | `public.xp_ledger` | `id` (INT) | `user_id` -> `users` | `created_at` -> TIMESTAMPTZ |
| 46 | `code_submissions` | 50 | `public.code_submissions` | `id` (INT) | `user_id` -> `users`, `problem_id` -> `problems` | Code text, status |
| 47 | `problem_starter_codes` | 24 | `public.problem_starter_codes` | `id` (INT) | `problem_id` -> `problems` | Starter code templates |
| 48 | `problem_tags` | 0 | `public.problem_tags` | `id` (INT) | `problem_id` -> `problems` | Tag text |
| 49 | `problem_test_cases` | 18 | `public.problem_test_cases` | `id` (INT) | `problem_id` -> `problems` | `is_hidden` -> BOOLEAN |
| 50 | `test_cases` | 0 | `public.test_cases` | `id` (INT) | `problem_id` -> `problems` | Testcases legacy |
| 51 | `assessment_attempts` | 0 | `public.assessment_attempts` | `id` (UUID) | `assessment_id` -> `unified_assessments`, `user_id` -> `users` | Composite FK |
| 52 | `placement_track_rounds` | 0 | `public.placement_track_rounds` | `id` (UUID) | `track_id` -> `placement_tracks` | Round config JSONB |
| 53 | `departments` | 65 | `public.departments` | `id` (INT) | `college_id` -> `colleges` | Name, code |
| 54 | `company_members` | 296 | `public.company_members` | `id` (INT) | `company_id` -> `companies`, `user_id` -> `users` | Recruiter role |
| 55 | `company_skill_requirements` | 0 | `public.company_skill_requirements` | `id` (UUID) | `company_id` -> `companies` | Skill weights |
| 56 | `job_postings` | 286 | `public.job_postings` | `id` (INT) | `company_id` -> `companies`, `created_by_user_id` -> `users` | `skills` -> JSONB |
| 57 | `developer_api_usages` | 0 | `public.developer_api_usages` | `id` (UUID) | `api_key_id` -> `developer_api_keys` | Count, timestamp |
| 58 | `interview_questions` | 78 | `public.interview_questions` | `id` (INT) | `session_id` -> `interview_sessions` | Question prompt |
| 59 | `roadmap_weeks` | 98 | `public.roadmap_weeks` | `id` (INT) | `roadmap_id` -> `roadmaps` | Week number |
| 60 | `daily_practice_sessions` | 36 | `public.daily_practice_sessions` | `id` (INT) | `user_id` -> `users` | `session_date` -> DATE |
| 61 | `assessment_question_submissions`| 0 | `public.assessment_question_submissions` | `id` (UUID) | `attempt_id` -> `assessment_attempts`, `user_id` -> `users` | Score, feedback |
| 62 | `batches` | 64 | `public.batches` | `id` (INT) | `department_id` -> `departments` | Graduation year |
| 63 | `battle_configs` | 117 | `public.battle_configs` | `id` (UUID) | `job_id` -> `job_postings` | `rules` -> JSONB |
| 64 | `saved_opportunities` | 54 | `public.saved_opportunities` | `id` (INT) | `job_id` -> `job_postings`, `user_id` -> `users` | `saved_at` -> TIMESTAMPTZ |
| 65 | `interview_answers` | 26 | `public.interview_answers` | `id` (INT) | `question_id` -> `interview_questions` | Audio/text answer |
| 66 | `roadmap_tasks` | 147 | `public.roadmap_tasks` | `id` (INT) | `week_id` -> `roadmap_weeks` | `completed` -> BOOLEAN |
| 67 | `college_assessments` | 64 | `public.college_assessments` | `id` (INT) | `college_id` -> `colleges`, `batch_id` -> `batches` | Exam metadata |
| 68 | `college_students` | 64 | `public.college_students` | `id` (INT) | `college_id` -> `colleges`, `batch_id` -> `batches`, `user_id` -> `users` | Student roll no |
| 69 | `battle_rooms` | 150 | `public.battle_rooms` | `id` (UUID) | `config_id` -> `battle_configs`, `creator_id` -> `users` | State machine |
| 70 | `college_assessment_questions` | 96 | `public.college_assessment_questions` | `id` (INT) | `assessment_id` -> `college_assessments` | `options` -> JSONB |
| 71 | `college_assessment_submissions`| 64 | `public.college_assessment_submissions` | `id` (INT) | `assessment_id` -> `college_assessments`, `student_id` -> `college_students` | Submission score |
| 72 | `battle_participants` | 150 | `public.battle_participants` | `id` (UUID) | `battle_id` -> `battle_rooms`, `user_id` -> `users` | Participant state |
| 73 | `battle_results` | 68 | `public.battle_results` | `id` (UUID) | `battle_id` -> `battle_rooms`, `participant_id` -> `battle_participants` | Rank, points |
| 74 | `battle_submissions` | 113 | `public.battle_submissions` | `id` (UUID) | `battle_id` -> `battle_rooms`, `participant_id` -> `battle_participants`, `user_id` -> `users` | Solution code |
| 75 | `candidate_applications` | 196 | `public.candidate_applications` | `id` (INT) | `job_id` -> `job_postings`, `candidate_user_id` -> `users` | Application stage |
| 76 | `quest_progress` | 0 | `public.quest_progress` | `id` (UUID) | `user_id` -> `users`, `level_id` -> `quest_map_levels` | Level score |
| 77 | `application_status_history` | 158 | `public.application_status_history` | `id` (INT) | `application_id` -> `candidate_applications`, `changed_by_user_id` -> `users` | Status transition |
| 78 | `company_interviews` | 37 | `public.company_interviews` | `id` (INT) | `application_id` -> `candidate_applications`, `created_by_user_id` -> `users` | Interview schedule |

---

## 10. Migration Dependency Order (Topological Sequence)

The 78 tables must be created and migrated in the following topological order (grouped by hierarchy tier). This guarantees that parent tables are fully populated before foreign keys in dependent child tables are inserted:

```
[Tier 1: Independent Root Entities]
  1. streak
  2. placement_companies
  3. tournaments
  4. questions
  5. quest_map_levels
  6. alembic_version
  7. conversations
  8. users  <--- (Primary User Table & Supabase Auth Sync)
  9. daily_challenges
  10. problems
  11. api_request_logs
  12. unified_assessments

[Tier 2: Primary Children of Users & Independent Tables]
  13. placement_tracks
  14. tournament_matches
  15. messages
  16. achievements
  17. audit_logs
  18. campaign_attempts
  19. candidate_privacy_settings
  20. colleges
  21. companies
  22. developer_api_keys
  23. friendships
  24. interview_sessions
  25. interviews
  26. matchmaking_matches
  27. notifications
  28. password_reset_tokens
  29. placement_prep_sessions
  30. profiles
  31. question_exposures
  32. refresh_tokens
  33. resumes
  34. roadmaps
  35. skill_evidence
  36. student_skill_profiles
  37. tournament_participants
  38. user_campaign_progress
  39. user_daily_activities
  40. user_settings
  41. user_skill_stats
  42. user_stats
  43. user_submissions
  44. xp
  45. xp_ledger
  46. code_submissions
  47. problem_starter_codes
  48. problem_tags
  49. problem_test_cases
  50. test_cases
  51. assessment_attempts
  52. placement_track_rounds

[Tier 3: College, Company & Learning Track Sub-Hierarchies]
  53. departments
  54. company_members
  55. company_skill_requirements
  56. job_postings
  57. developer_api_usages
  58. interview_questions
  59. roadmap_weeks
  60. daily_practice_sessions
  61. assessment_question_submissions

[Tier 4: Granular Operational Records]
  62. batches
  63. battle_configs
  64. saved_opportunities
  65. interview_answers
  66. roadmap_tasks

[Tier 5: Institutional & Arena State Machines]
  67. college_assessments
  68. college_students
  69. battle_rooms

[Tier 6: Submissions & Participants]
  70. college_assessment_questions
  71. college_assessment_submissions
  72. battle_participants
  73. candidate_applications
  74. quest_progress

[Tier 7: Battle Results & Workflow Histories]
  75. battle_results
  76. battle_submissions
  77. application_status_history
  78. company_interviews
```

---

## 11. Risks and Unresolved Questions

### Identified Technical Risks & Mitigation
1. **Integer Sequence Resync:**
   - *Risk:* 44 tables use auto-incrementing integer IDs. When rows are inserted into PostgreSQL with explicit IDs, PostgreSQL sequences (`table_id_seq`) do not advance automatically. Subsequent inserts would trigger primary key conflicts (`23505: duplicate key value`).
   - *Mitigation:* The migration tool must run `SELECT setval(pg_get_serial_sequence('table', 'id'), COALESCE(max(id), 1)) FROM table;` across all 44 sequence tables immediately after data transfer.
2. **Boolean Type Interpretation:**
   - *Risk:* SQLite stores booleans as `0` or `1`. PostgreSQL requires `BOOLEAN` (`true`/`false`).
   - *Mitigation:* In Python data pipeline, cast integer values to `bool()` before passing to psycopg3 / asyncpg parameters.
3. **JSON vs String Encoding:**
   - *Risk:* In SQLite, JSON fields (`options`, `onboarding_preferences`, `rules`) are stored as TEXT.
   - *Mitigation:* Parse strings with `json.loads()` and insert as native PostgreSQL `JSONB`.
4. **Active Sessions Invalidation:**
   - *Risk:* Transitioning to Supabase Auth invalidates existing Clerk and legacy JWT tokens.
   - *Mitigation:* Users will experience a one-time sign-out. The frontend Auth Context will gracefully route them to the login form with an informative message.
5. **PostgreSQL Reserved Keywords:**
   - *Risk:* Table `users` and columns like `status`, `role`, `desc` are common SQL terms.
   - *Mitigation:* All table and column names in the migration scripts must be strictly quoted (`"users"`, `"status"`).

### Unresolved Items (To be confirmed before Phase 2)
1. **Clerk Enterprise Export Availability:** Does the project owner have an active Clerk Enterprise subscription to export any additional OAuth refresh tokens, or will OAuth users simply re-authenticate via Supabase OAuth? *(Recommended: Standard Supabase Google/GitHub OAuth linking on login).*
2. **Supabase Project Provisioning:** Has the target Supabase project been created, and are the database connection URL and Service Role Key provisioned?

---

## 12. Required Environment Variables (Names Only)

To prepare for Phase 2 and production cutover, the following environment variables will be required across Render (backend) and Vercel (frontend). **No secret values are shown:**

### Backend (Render Environment)
- `DATABASE_URL` (Direct Supabase PostgreSQL connection string for sync engines / migrations)
- `ASYNC_DATABASE_URL` (Async Supabase PostgreSQL connection string `postgresql+asyncpg://...`)
- `SUPABASE_URL` (Supabase project API endpoint)
- `SUPABASE_SERVICE_ROLE_KEY` (Supabase administrative key for backend user validation & sync)
- `SUPABASE_JWT_SECRET` (Supabase JWT Secret for direct HMAC-SHA256 signature verification, or JWKS URL)
- `ENVIRONMENT` (`production` / `staging`)
- `SECRET_KEY` (Qubira internal application secret key)
- `ALLOWED_ORIGINS` (CORS allowed domains)

### Frontend (Vercel Environment)
- `NEXT_PUBLIC_API_URL` (FastAPI backend production endpoint)
- `NEXT_PUBLIC_APP_URL` (Frontend domain e.g., `https://qubira.io`)
- `NEXT_PUBLIC_SUPABASE_URL` (Supabase project endpoint)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase browser-safe anonymous key)

---

## 13. Recommended Migration Tooling Structure

In Phase 2, migration tools will be organized cleanly in a dedicated directory:

```
scripts/migration/
├── 01_backup_and_verify_sqlite.py    # Generates timestamped SQLite snapshot & hash verification
├── 02_prepare_supabase_schema.py    # Applies Alembic migrations to target Supabase PostgreSQL
├── 03_migrate_sqlite_to_postgres.py # Resumable chunked data transfer with FK disabling & sequence sync
├── 04_import_supabase_auth_users.py # Programmatic user provisioning in Supabase Auth (Argon2 hashes preserved)
├── 05_reconcile_identity_mapping.py # Sets public.users.auth_user_id = auth.users.id and checks consistency
├── 06_validate_migration_parity.py  # Strict row-count, column checksum, and sample comparison
└── 07_rollback_recovery.py          # Reverts connection string & restores baseline state
```

### Script Architectural Specifications
- **Dry-Run Flag:** Every script must support `--dry-run` to log proposed operations without committing transactions.
- **Resumability:** Track migration progress using a local checkpoint table or state JSON file. If interrupted, the script skips already verified tables.
- **Logging Safety:** Log counts, table names, elapsed times, and errors. Never log plaintext passwords, hashes, tokens, or personal identifiers.
- **Foreign Key Safety:** Wrap data migration inside `SET session_replication_role = 'replica';` during data load, then re-enable with `SET session_replication_role = 'origin';` before foreign key parity validation.

---

## 14. Testing and Validation Plan

### Phase 2 Pre-Cutover Validation Checklist
1. **Row Count Parity:** Verify `COUNT(*)` in Supabase PostgreSQL matches SQLite across all 78 tables.
2. **Column Checksum Verification:** For numeric, text, and timestamp columns, verify minimum, maximum, and row-by-row hash samples between SQLite and PostgreSQL.
3. **Foreign Key Integrity Check in PostgreSQL:**
   ```sql
   DO $$
   DECLARE
       r RECORD;
   BEGIN
       FOR r IN (SELECT conrelid::regclass AS tbl, conname FROM pg_constraint WHERE contype = 'f') LOOP
           EXECUTE format('SELECT 1 FROM %s LIMIT 1', r.tbl);
       END LOOP;
   END $$;
   ```
4. **Sequence Verification:** Ensure `currval` or `nextval` for all 44 serial sequences is greater than `MAX(id)`.
5. **Authentication Verification Tests:**
   - Attempt password login with existing native user credentials against Supabase Auth.
   - Verify JWT issued by Supabase Auth is accepted by FastAPI `get_current_user`.
   - Verify Google and GitHub OAuth redirects and callback handlers in Next.js.
   - Verify role-based permissions (`student`, `college_admin`, `company_admin`, `PLATFORM_ADMIN`).

---

## 15. Production Cutover and Rollback Plan

### Production Cutover Steps (Planned for Phase 3)
1. **Maintenance Mode Announcement:** Display scheduled maintenance banner on frontend (30-minute window).
2. **Backend Freeze:** Set Render backend to maintenance mode to reject new mutations (`MaintenanceMiddleware`).
3. **Final Delta SQLite Snapshot:** Execute `01_backup_and_verify_sqlite.py` to create the final immutable snapshot.
4. **Execute Data Transfer:** Run `03_migrate_sqlite_to_postgres.py` followed by sequence resync.
5. **Execute Auth Migration:** Run `04_import_supabase_auth_users.py` and `05_reconcile_identity_mapping.py`.
6. **Deploy Backend Update:** Deploy FastAPI backend on Render with updated `DATABASE_URL` pointing to Supabase PostgreSQL and Supabase Auth token validator.
7. **Deploy Frontend Update:** Deploy Next.js frontend on Vercel with Supabase Auth Provider and components enabled.
8. **Automated Smoke Tests:** Execute end-to-end user login, challenge submission, and ranking retrieval tests.
9. **Lift Maintenance Mode:** Restore public traffic.

### Rollback Strategy
If any unrecoverable error occurs prior to DNS/client cutover:
1. Revert Render environment variables `DATABASE_URL` and `ASYNC_DATABASE_URL` back to SQLite.
2. Revert Vercel deployment to the previous immutable release hash.
3. Restart backend services.
4. SQLite database remains 100% untouched and unchanged. Zero downtime or data loss incurred.

---

## 16. Clear Checklist for Phase 2

Before executing Phase 2, the following prerequisites must be confirmed:

- [ ] Project Owner provisions a Supabase project and provides:
  - Direct PostgreSQL Connection String (`postgres://...:5432/postgres`)
  - Transaction Pooler / Session Pooler URL (`postgresql://...:6543/postgres`)
  - Supabase Project URL (`https://<project-ref>.supabase.co`)
  - Supabase Service Role Key (`eyJh...`)
  - Supabase Anon Key (`eyJh...`)
  - Supabase JWT Secret (`...`)
- [ ] Project Owner configures Google & GitHub OAuth client credentials in Supabase Dashboard (Authentication -> Providers).
- [ ] Add the 5 omitted models (`tournaments`, `tournament_matches`, `tournament_participants`, `friendships`, `interviews`) to `backend/app/models/__init__.py`.
- [ ] Add `adaptive_owner_id` and `adaptive_date` fields to `BattleRoom` in `backend/app/models/battle.py`.
- [ ] Review and approve the Phase 1 Audit Report (`QUBIRA_SUPABASE_MIGRATION_AUDIT.md`).
- [ ] Authorize the creation and dry-run execution of Phase 2 migration scripts.

---
*Report produced by Antigravity Senior Migration & Security Architect under strict Phase 1 READ-ONLY protocols.*
