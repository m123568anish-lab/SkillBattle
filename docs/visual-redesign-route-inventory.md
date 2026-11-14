# Qubira visual redesign route inventory

Generated from `frontend/src/app/**/page.tsx` on 2026-11-14. The application currently contains **70 page routes**.

## Route inventory

| Route | Product area |
| --- | --- |
| `/` | Public landing |
| `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`, `/sign-in/[[...sign-in]]`, `/sign-up/[[...sign-up]]` | Authentication |
| `/onboarding`, `/organization-setup` | Onboarding |
| `/dashboard`, `/activity`, `/analytics`, `/calendar`, `/coach`, `/achievements`, `/friends`, `/profile`, `/settings` | Student workspace |
| `/battle`, `/battle/[battleId]`, `/battle/championship`, `/battle/company-speedrun`, `/battle/create`, `/battle/history`, `/battle/lobby`, `/battle/new`, `/battle/placement-prep`, `/battle/queue`, `/battle/solo`, `/battle/solo/coding`, `/battle/solo/mcq`, `/battle/waiting`, `/leaderboard`, `/tournament` | Battle arena |
| `/practice`, `/practice/coding`, `/practice/coding/[id]`, `/practice/interview`, `/practice/mcq`, `/practice/progress`, `/practice/recommendations`, `/practice/saved`, `/practice/session`, `/practice/tasks`, `/practice/topics`, `/practice/topics/[slug]`, `/tasks`, `/challenge`, `/campaign`, `/campaign/level/[track]/[levelId]`, `/interview` | Learning and practice |
| `/career/dashboard`, `/career/mentor`, `/career/resume`, `/career/roadmap`, `/opportunities`, `/opportunities/[jobId]`, `/opportunities/applications`, `/opportunities/saved`, `/placement`, `/placement/scorecard` | Career and placement |
| `/admin`, `/college/dashboard`, `/company/dashboard`, `/assessments` | Administrative and institutional workspaces |
| `/faq`, `/privacy`, `/support`, `/terms` | Public support and policy |

## Current implementation status

- **Implemented:** shared Qubira shell treatment, semantic design foundations, responsive workspace background, panel and control primitives, dashboard hero composition, route inventory.
- **Partially completed:** route-specific visual redesign. Existing route components still need individual composition passes and browser screenshot review.
- **Not yet verified:** complete dark/light screenshot matrix at 1440, 1280, 1024, 768, 390, and 360px.
