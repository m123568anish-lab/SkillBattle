# SKILLBATTLE AI — EXISTING PROJECT AUDIT

## 1. Project Summary

SkillBattle AI is an ambitious, full-stack educational and competitive coding platform. It uses Next.js for the frontend, FastAPI for the backend, PostgreSQL via SQLAlchemy, and integrates heavily with AI (e.g. Gemini, OpenAI) to provide personalized learning roadmaps, AI coaches, AI interviewers, and real-time multiplayer code battles (with WebSockets). The project aims to gamify the learning experience with XP, streaks, achievements, and tournaments. Currently, a significant portion of the foundation exists, but many sophisticated features remain either heavily mocked on the frontend or partially integrated with the backend.

## 2. Current Technology Stack

- **Frontend**: Next.js 15 (App Router), React, TypeScript, Tailwind CSS, Zustand (state management), Axios (API client).
- **Backend**: FastAPI, Python 3.11+, SQLAlchemy (async/sync), Pydantic (data validation), Alembic (migrations), Uvicorn.
- **Database**: PostgreSQL (currently configured to use Neon or Render with fallback to local SQLite for dev).
- **Authentication**: Custom JWT-based authentication with email/password and OTP (Resend integration), plus OAuth stubs (Google/GitHub).
- **AI Integrations**: Gemini, OpenAI, Anthropic, Ollama, Deepseek (supported via settings, mostly used for dynamic problem generation, career roadmaps, interview simulations, and AI mentor).
- **Real-time**: WebSockets (FastAPI built-in) for battle lobbies, matchmaking, notifications, and tournaments.
- **Deployment**: Vercel (Frontend), Render (Backend).

## 3. Current Folder Architecture

**Frontend (`src/`)**:
- `app/`: Next.js App Router structure. Contains `(auth)` (login, register), `dashboard`, `onboarding`, `battle`, `tournament`, `career-dashboard`, etc.
- `components/`: Highly modularized UI components categorized by domain (`auth`, `battle`, `dashboard`, `mentor`, `onboarding`, `ui` primitives).
- `context/`: React Context providers (e.g. `AuthContext.tsx`).
- `data/`: Mock data files (`dashboard.ts`, `goals.ts`, `languages.ts`, `roadmap.ts`, etc.). **(Heavy reliance on mock data for UI design)**.
- `hooks/`: Custom React hooks (`useAuth.ts`, `useDashboard.ts`, `useMentor.ts`, `use-login.ts`, etc.).
- `lib/`: Utilities, constants, theme config, API wrapper logic.
- `services/`: API interaction layer (`auth.service.ts`, `dashboard.service.ts`, `battle.service.ts`, etc.).
- `store/` & `stores/`: Zustand global state slices.
- `types/`: TypeScript definitions.

**Backend (`backend/app/`)**:
- `api/`: Global router aggregator (`api/v1`).
- `core/`: Config (`config.py`), security, middleware, exceptions, and `router_registry.py`.
- `database/`: DB connection (`database.py`, `session.py`), `init_db.py`.
- `models/`: Centralized SQLAlchemy model definitions (`user.py`, `profile.py`, `challenge.py`, etc.).
- `modules/`: Feature-sliced backend logic. Contains ~25 modules (e.g. `auth`, `dashboard`, `battle`, `xp`, `tournament`, `ai`, `problem_generator`). Each typically has `router.py`, `service.py`, `repository.py`, `schemas.py`.
- `websocket/`: Global websocket managers.
- `workers/`: Background task processing placeholders (`ai_worker.py`, `battle_worker.py`).

## 4. Current System Architecture

```text
User Browser / Client
        |
        v
[ Next.js Frontend (Vercel) ]
  |-- Pages & Components
  |-- Zustand State Stores
  |-- Axios API Services
        |
        v (HTTP / WebSocket)
[ FastAPI Backend (Render) ]
  |-- Middleware (CORS, Rate Limit, Auth)
  |-- Routers & Schemas (app/modules/*/router.py)
  |-- Services (Business Logic) & Repositories (DB Access)
  |-- WebSocket Managers (Battle, Notifications)
        |-----------------------|
        v                       v
[ PostgreSQL (Neon) ]    [ AI Providers (Gemini/OpenAI) ]
  |-- User, Profile        |-- Prompts & Generations
  |-- XP, Achievements     |-- Problem generation
  |-- Battle, Match        |-- Code Review
```

## 5. Current User Roles

Currently, the database and authentication predominantly support a **Student/Standard User** role.

- **Role Name**: Student/User
- **Login Method**: Email/Password, Email OTP.
- **Accessible Screens**: Dashboard, Onboarding, Battle Arena, AI Mentor, Career Dashboard.
- **Permissions**: Standard read/write on own profile, participate in battles, earn XP.
- **Missing Functionality**: There is an `admin.service.ts` and `recruiter/router.py` in the backend, indicating planned Admin and Recruiter roles, but there is no dedicated robust frontend UI or complex RBAC (Role-Based Access Control) enforced universally across all frontend routes yet.

## 6. Current Screens

| Screen Name | Location | Purpose | Data Source | Status |
|---|---|---|---|---|
| **Landing** | `src/app/page.tsx` | Marketing, Hero, CTA | Static / UI | COMPLETED |
| **Login** | `src/app/(auth)/login/page.tsx` | User authentication | `auth.service.ts` -> Backend | COMPLETED |
| **Register** | `src/app/(auth)/register/page.tsx` | User registration | `auth.service.ts` -> Backend | COMPLETED |
| **Onboarding** | `src/app/onboarding/page.tsx` | Initial setup, goal selection | `src/data/*` (Mocked) / Partially Backend | PARTIALLY COMPLETED |
| **Dashboard** | `src/app/dashboard/page.tsx` | Main hub, XP, Streaks | `dashboard.service.ts` -> Backend | COMPLETED (Recently fixed) |
| **Career Dashboard** | `src/app/career-dashboard/page.tsx` | Roadmap, resumes, jobs | Mocked / AI Service | UI ONLY / MOCKED |
| **Battle Lobby** | `src/app/battle/page.tsx` | Create/join battles | WebSockets + Backend | PARTIALLY COMPLETED |
| **Tournament** | `src/app/tournament/page.tsx` | Join tournaments | Mocked / Backend stub | UI ONLY / PARTIAL |
| **Profile** | `src/app/profile/page.tsx` | Edit user info | Backend | COMPLETED |

## 7. Current Features & 8. Feature Status Table

| Feature | Status | Evidence in Code | Problems | Recommendation |
|---------|--------|------------------|----------|----------------|
| Authentication (Email/Password) | COMPLETED | `auth.service.ts`, `app/modules/auth/` | Minor edge cases. | Keep as is, it's working. |
| Dashboard Data | COMPLETED | `dashboard/service.py`, `useDashboard.ts` | Recently fixed 500 error. | Verify all metrics are accurate. |
| Onboarding | PARTIALLY COMPLETED | `src/app/onboarding/`, `data/goals.ts` | Frontend relies heavily on static mock data. | Connect to real backend models and save user preferences to DB profile. |
| Roadmap Generation | MOCK/DUMMY / BACKEND ONLY | `src/data/roadmap.ts`, `app/modules/roadmap/` | Backend exists, but frontend uses hardcoded mock data. | Integrate frontend with `roadmap_router.py`. |
| AI Mentor/Chat | PARTIALLY COMPLETED | `src/components/mentor/`, `ai/router.py` | UI exists, backend AI service exists, connection is spotty. | Ensure streaming and context management works reliably. |
| Battle Arena | PARTIALLY COMPLETED | `src/app/battle/`, `websocket/manager.py` | UI exists, WS endpoints exist, but full real-time flow is brittle. | Harden WebSocket reconnection and state sync. |
| XP & Streak | COMPLETED | `xp/service.py`, `dashboard/service.py` | Backend logic is solid. | No immediate changes needed. |
| Problem Generator (AI) | BACKEND ONLY | `problem_generator/service.py` | Fully functional in backend, lacking direct frontend consumption outside of battles. | Create a dedicated "Practice" UI. |
| Leaderboard | PARTIALLY COMPLETED | `data/leaderboard.ts`, `leaderboard/router.py` | UI uses mocks, backend has actual logic. | Connect UI to API. |

## 9. Current Database Architecture

**Database Technology**: PostgreSQL via SQLAlchemy (async and sync engines configured).

**Core Entities**:
- **User**: Base identity (`id`, `email`, `hashed_password`).
- **Profile**: Extended info (`user_id`, `full_name`, `bio`, `github_username`, `level`).
- **Achievement**: Earned badges (`user_id`, `name`, `description`, `unlocked_at`).
- **Activity**: User actions (`user_id`, `action_type`, `timestamp`).
- **Tournament**, **TournamentMatch**, **Participant**: Complex tournament tracking logic.
- **Challenge** / **Problem**: Coding tasks.

**Issues**:
- Many feature modules (like `matchmaking`, `career`) define schemas but lack finalized, deeply integrated tables. The database is somewhat fragmented between modules.

## 10. Current API Architecture

FastAPI provides an extensive modular routing structure:
- `/auth/register`, `/auth/login` - Working.
- `/dashboard` - Working (fixed GET commit issue).
- `/xp/add`, `/streak/increment` - Working.
- `/roadmap/generate` - Working backend, unused by frontend.
- `/ai/chat`, `/ai/review` - Working backend, partial frontend usage.
- `/battle/ws` - WebSocket route, partially working.
- `/tournament/*` - CRUD endpoints exist, orchestrator logic exists.

**Status**: The backend API surface area is enormous and very complete on its own, but the frontend currently only consumes about 20-30% of it, relying on local `src/data/` mocks for the rest.

## 11. Current AI Architecture

AI is deeply embedded in the backend `app/modules/`.
- **Providers**: Configured in `Settings` (Gemini, OpenAI, Anthropic).
- **Modules**:
  - `problem_generator`: Dynamically creates coding challenges based on difficulty/topic using AI.
  - `roadmap`: Generates personalized week-by-week study plans based on user goals.
  - `ai` (Mentor): Chatbot for coding assistance.
  - `interview`: AI-driven mock interviews.
  - `battle_coach`: Provides hints during battles.

**Flow**:
User UI Request -> API Route -> AI Service (Prompt Builder -> LLM API) -> Parsing -> Response to Frontend.
Most AI endpoints are completely functional on the backend.

## 12. Current Authentication & Authorization

- JWT based. `access_token` and `refresh_token` flow implemented.
- `RequireAuth.tsx` protects frontend routes.
- `Depends(get_current_user)` protects backend routes.
- Authorization (RBAC) is very basic right now (mostly just "is authenticated").

## 13. Completed Development

- Full monorepo setup (Next.js + FastAPI + Postgres).
- Production deployment pipelines (Vercel + Render).
- Authentication (Login, Register, JWT, Profile creation).
- Core Dashboard (XP, Streak, Achievements loading from DB).
- Backend AI services (prompts, LLM clients, generation logic).

## 14. Incomplete Development

- **Frontend/Backend Integration**: The biggest gap. The frontend is heavily populated with beautiful UI components that render static data from `src/data/` (e.g., Roadmaps, Leaderboards, Tournaments, Career Dashboard).
- **WebSockets**: The Battle real-time system is partially implemented but needs hardening for edge cases (disconnects, synchronization).
- **Onboarding**: Needs to save data to the actual user profile instead of just advancing UI states.

## 15. Broken Functionality

- No major breaking 500 errors remain in the core flows (Dashboard bug and Render deployment bug just fixed).
- The "Battle" flow might fail dynamically due to WS state mismatches if tested end-to-end.

## 16. Technical Problems

1. **HIGH**: Heavy reliance on Mock Data in UI. `src/data/*.ts` files are masking the fact that the frontend isn't communicating with the backend for many features.
2. **MEDIUM**: State Management Duplication. Zustand stores and React Context are somewhat overlapping.
3. **MEDIUM**: Complex Database Migrations. With so many decoupled modules, ensuring Alembic migrations are up to date and in sync across all models is risky.
4. **LOW**: Unused Dependencies/Files. There are many experimental UI components not currently rendered.

## 17. Recommended Modifications

**CURRENT**: Frontend uses `src/data/roadmap.ts` and `data/leaderboard.ts`.
**PROBLEM**: User data is static and not personalized.
**RECOMMENDED CHANGE**: Swap mock data imports with Axios/React Query calls to the existing backend endpoints (`/roadmap` and `/leaderboard`).
**REASON**: To make the application actually dynamic and personalized.
**IMPACT**: Medium. Requires updating frontend state/loading UIs.

**CURRENT**: Onboarding collects data but doesn't persist it properly to affect the AI generation.
**PROBLEM**: Personalization engine lacks input.
**RECOMMENDED CHANGE**: On completion of onboarding, send a bulk payload to `/profile/update` and trigger `/roadmap/generate`.
**REASON**: Fulfills the core product promise of personalized AI learning.

## 18. Things That Should NOT Be Changed

- **FastAPI Modular Architecture**: The backend folder structure (`app/modules/*`) is excellent and highly scalable. Keep it.
- **Next.js App Router Setup**: The UI components are beautiful and well-structured using Tailwind. Do not redesign the UI.
- **Authentication**: It currently works perfectly across frontend and backend. Leave it alone.
- **Database Connection Logic**: The recent fixes to `session.py` and `config.py` make it robust.

## 19. Gap Analysis

- **Frontend vs Backend**: Backend has ~25 modules fully coded. Frontend is only consuming ~5 of them.
- **AI Integration**: Backend has sophisticated prompt chains. Frontend has static placeholder text for AI responses in some dashboards.
- **State**: Required State is a fully dynamic app. Current state is a semi-dynamic app with a beautifully mocked shell.

## 20. Next Development Phase

**PHASE A: The Great Integration (Data Wiring)**
*We should not build new features. We must connect the existing UI to the existing backend.*

## 21. Exact Next Tasks

1. **Leaderboard Integration**: Connect `src/app/.../Leaderboard.tsx` to the `GET /leaderboard` backend endpoint. Remove `src/data/leaderboard.ts`.
2. **Onboarding Persistence**: Modify `src/app/onboarding/page.tsx` to POST the user's selected language, goals, and company to the backend upon completion.
3. **Dynamic Roadmap**: Connect the Career Dashboard / Roadmap UI to the `GET /roadmap` API, allowing the AI generated roadmap to render instead of the mock data.

## 22. Definition of Done

- No `src/data/*.ts` mock files are used for core dynamic features (Leaderboard, Roadmap).
- A new user can register, complete onboarding, and immediately see a backend-persisted, AI-generated roadmap tailored to their choices.
- The UI must correctly show loading states while the backend processes AI requests.
