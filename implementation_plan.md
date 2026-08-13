# Full-Stack Completion Plan

## Overview
This plan covers the end-to-end work required to complete the SkillBattle application across backend and frontend, including routing, auth, friends, battle flow, UI, tests, documentation, and CI.

## 1️⃣ Project Scan Summary

### Backend (`app/`)
- Fixed routing issues for `/api/v1/profile/me` and leaderboard routes.
- No friend system exists yet, so battle creation cannot auto-add a friend.
- Missing global exception handler and request/response logging middleware.
- Missing `logout/all` endpoint for revoking all refresh tokens.
- Some routers were registered twice or with duplicate prefixes; router_registry cleanup is required.
- Profile service auto-creates a blank profile, but the API path was misconfigured.

### Frontend (`frontend/src/`)
- Folder layout exists, but concrete pages and components need implementation.
- Typical Next.js structure is present, but no type-safe API client or robust 400/404 error handling UI has been confirmed.
- Missing UI for friend list and auto-match battle with a friend.
- Missing visual indication for missing/blank profile.

### Shared
- Missing end-to-end tests covering login → profile → battle → leaderboard.
- No CI/CD workflow defined in repo, despite Docker files being present.

## 2️⃣ Backend Completion Tasks

### 2.1 Friendship Model & Service
- Add `app/models/friend.py`.
- Create friend repository and service.
- Expose friend endpoints for adding/removing/listing friends.

### 2.2 Battle Creation
- Update battle creation service so it can auto-add the first available friend if the user has friends.
- Document the strategy: use the first friend returned for now.

### 2.3 Profile Endpoint
- Ensure `/api/v1/profile/me` is exposed and returns the current user's profile.

### 2.4 Global Exception Handler
- Add `app/core/exceptions/handlers.py` or equivalent.
- Centralize common HTTP errors and unexpected server exceptions.

### 2.5 Logging Middleware
- Add middleware for request IDs, latency, and status code logging.
- Optionally include request/response correlation data.

### 2.6 Logout-All
- Add `POST /api/v1/auth/logout/all`.
- Revoke all refresh tokens for the current user.

### 2.7 Database Migration
- Create Alembic migration for friendship table.
- Ensure model and schema match backend expectations.

### 2.8 Tests
- Add unit tests for friend flow, profile, logout-all, and battle creation.
- Add integration tests for the new APIs.

### 2.9 Documentation
- Add Swagger tags for new endpoints.
- Add markdown API reference for auth, profile, friends, battle, leaderboard, logout-all.

## 3️⃣ Frontend Completion Tasks

### 3.1 Pages
- Create pages for:
  - Profile
  - Leaderboard
  - Battle Arena
  - Friends
- Use backend endpoints:
  - `/api/v1/profile/me`
  - `/api/v1/leaderboard/me`
  - `/api/v1/battle/create`
  - friend-related endpoints

### 3.2 Components
- Create reusable UI components:
  - `ProfileCard`
  - `LeaderboardTable`
  - `BattleCard`
  - `FriendList`
- Style with gradients, glassmorphism, and polished micro-animations.

### 3.3 Hooks
- Add hooks:
  - `useAuth`
  - `useProfile`
  - `useBattle`
  - `useFriends`
- Centralize API calls, loading state, and error state.

### 3.4 Providers
- Build an `AuthProvider` React context.
- Store JWT and refresh token.
- Implement auto-refresh token logic.

### 3.5 State Management
- Add state slices using Redux Toolkit or Zustand for:
  - auth
  - profile
  - battle
  - friends

### 3.6 Services
- Add `apiService.ts` or equivalent.
- Build base URL helpers for `/api/v1/...`.
- Attach auth headers automatically.

### 3.7 Error UI
- Add a global error boundary.
- Show toast notifications for API failures.
- Display friendly HTTP error messages for 400/404 responses.

### 3.8 Friend Flow
- Build a friend page showing current friends and friend requests.
- Add simple friend request actions such as add/remove.
- Display auto-match battle state when creating a battle.

### 3.9 Testing
- Add Jest + React Testing Library tests:
  - unit tests for hooks/services
  - integration tests for page rendering with mocked API

### 3.10 Styling
- Add global CSS variables for colors.
- Add dark mode support.
- Add smooth transitions and loading spinners.

### 3.11 Performance
- Lazy-load heavy components.
- Use `next/image` for optimized images.

### 3.12 SEO
- Add proper `<title>`, meta description, and heading hierarchy for each page.

## 4️⃣ End-to-End Flow

### Sign-up / Login
- User signs up or logs in.
- JWT stored in HttpOnly cookie.
- `AuthProvider` maintains auth state.

### Profile Page
- Calls `GET /api/v1/profile/me`.
- Backend auto-creates a blank profile if none exists.
- UI renders editable profile form when needed.

### Friends Page
- Calls `GET /api/v1/friend/me`.
- Displays friends and friend request actions.

### Battle Arena
- `Create Battle` triggers `POST /api/v1/battle/create`.
- Backend auto-adds the first friend if available.
- UI shows participants and countdown.

### Leaderboard
- Shows personal and global ranking via `GET /api/v1/leaderboard/me`.

### Logout-All
- In settings, user clicks `Logout from all devices`.
- Calls `POST /api/v1/auth/logout/all`.
- All tokens are revoked and client redirects to login.

## 5️⃣ Verification & Release Checklist

### Backend unit tests
- Run `pytest -q` and expect zero failures.

### Backend integration tests
- Use `httpx` or similar to exercise public endpoints and assert 200.

### Frontend unit tests
- Run `npm test` and target coverage.

### Frontend E2E
- Add Cypress or Playwright tests for login → profile → battle → logout-all.

### Manual QA
- Verify app in Chrome.
- Test dark mode and responsive layout.

### CI/CD
- Add GitHub Actions workflows for backend and frontend tests.
- Add badge to `README.md`.

### Production Build
- Run `npm run build && npm start` in Docker.
- Confirm `/health` returns healthy.

### Documentation
- Confirm Swagger UI includes auth, profile, friends, battle, leaderboard, logout-all.

### Performance
- Confirm page load is under 2s on a simulated 4G connection.

## 6️⃣ Next Steps
- Approve the friend selection strategy: use the first friend by default.
- Approve the plan and begin generating the missing backend models, migrations, middleware, frontend pages, tests, and CI workflow.
- After approval, implement the full feature set and verify with automated tests.

---

## Notes
- The backend will use the first friend returned for auto-match battle creation.
- The current plan assumes the auth endpoint uses a JWT refresh flow with HttpOnly cookies.
- The plan is intentionally comprehensive: it includes backend, frontend, testing, CI, documentation, and production readiness.
