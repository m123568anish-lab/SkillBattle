---
schema: clarification-answers/v1
status: submitted
generated_at: "2026-11-05T13:23:24.939Z"
scope: [frontend, backend, generic]
questions_file: clarification-questions.json
---

# Rearchitecture Clarification Answers

## 🖥️ Frontend

- **F1** Confirm the framework and version for this design transformation. Should it remain on the existing Next.js version (the exact installed version can be confirmed from the project manifest), or should a different framework/version be targeted?
  - answer: Next.js — preserve the existing version; confirm its exact version from the project manifest
  - source: user
- **F2** Which existing or target component/UI library should the Qubira transformation use? Confirm keeping the current stack, or name the library and version.
  - answer: Preserve the current component library and add no new library
  - source: user
- **F3** Provide screenshots or a screen recording of the current UI, or a staging/production URL. If the Qubira target is in a Figma file, provide that link as well; include representative full-product screens and important states where possible.
  - answer: Current production website: https://skill-battle-one.vercel.app/

The project has been rebranded as Qubira. Use the existing website and repository as the baseline for the redesign.

Create a completely distinctive visual identity rather than copying the current AI-generated SaaS appearance.

Design direction:
- Premium editorial design.
- Swiss-inspired layouts and typography.
- Competitive sports and developer-platform visual language.
- Warm, minimalist surfaces.
- Distinctive page compositions.
- Professional coding workspaces.
- Original illustrations and visual assets where useful.

Support both Light and Dark themes with a persistent theme selector: Light, Dark, and System.

Do not treat the production URL as the final design reference. The objective is to substantially improve and redesign the existing product.
  - source: user
- **F4** What is the source of truth for the Qubira visual direction and design tokens? Provide a design-system/brand-guide URL, Figma or Storybook link, token file path, or explicit written instructions for colors, typography, spacing, and component styling.
  - answer: Create a new original Qubira design system.

Brand identity:
- Name: Qubira.
- Personality: Intelligent, competitive, modern, student-first, professional and distinctive.

Light theme:
- Warm paper: #F1EEE6
- Ink: #171A19
- Acid lime: #D8F36A
- Restrained coral accents.
- Muted stone borders.

Dark theme:
- Deep ink: #171A19
- Layered charcoal surfaces.
- Warm white typography.
- Acid lime: #D8F36A
- Restrained coral accents.

Use semantic CSS variables and design tokens.

Typography should be editorial, readable and distinctive. Use intentional whitespace, structured grids, meaningful alignment and page-specific layouts.

Avoid generic AI-generated SaaS design patterns, excessive gradients, neon glow, glassmorphism, repetitive cards, decorative charts and unnecessary animations.

Every page should have its own visual personality while maintaining one recognizable Qubira identity.

The theme toggle must support Light, Dark and System modes and persist across all pages and sessions.
  - source: user
- **F5** Which accessibility standard should the transformed frontend meet?
  - answer: WCAG 2.2 AA
  - source: user
- **F6** Which browsers and runtime versions must the transformed frontend support?
  - answer: modern evergreen (Chrome, Firefox, Safari, Edge — latest 2 major versions)
  - source: user
- **F7** What responsive/adaptive strategy should the Qubira transformation follow?
  - answer: mobile-first using existing breakpoints detected from codebase
  - source: user
- **F8** Which locales are in scope? List locale codes, say “none,” or confirm preserving the current locale set and i18n library.
  - answer: Preserve the existing locale set and existing internationalization implementation. Do not introduce a new i18n library or change existing translation keys. Ensure all redesigned components support existing localized content and flexible text lengths.
  - source: user
- **F9** Should the transformation keep the existing client/server-state approach, or do you require a particular state-management library?
  - answer: preserve existing pattern if identifiable; otherwise recommend minimal (component state + server-state library)
  - source: user
- **F10** Confirm the routing implementation the design transformation must retain. All existing route behavior must remain unchanged; name any preferred router or special URL requirements.
  - answer: match existing routing implementation and preserve all route behavior
  - source: user

## ⚙️ Backend

- **B1** The stated change is frontend-only. Confirm that there is no backend framework/version migration; if a backend change is intended, specify the target framework and major version.
  - answer: No backend framework or version migration.

Keep the existing FastAPI backend and its installed version. This is primarily a frontend design and UX transformation. Only make minimal backend changes when strictly necessary for frontend integration, existing functionality, or fixing confirmed bugs.
  - source: user
- **B2** Confirm the required external API contract policy for this work.
  - answer: must preserve
  - source: user
- **B3** Confirm that this frontend-only transformation requires no database or data migration, or specify another data migration approach.
  - answer: no migration
  - source: user
- **B4** Should the existing authentication/authorization mechanism and its frontend integration remain unchanged? If a specific framework or identity provider is in scope, name it and its version.
  - answer: preserve existing auth mechanism; detect from codebase
  - source: user
- **B5** Are there explicit latency, throughput, or availability targets the frontend change must retain?
  - answer: match current production baseline; no regression
  - source: user

## 📋 General

- **G1** What outcome defines success for the Qubira transformation?
  - answer: The transformation is complete when the actual Qubira website has been redesigned across all existing routes and user roles, with a distinctive original design system and fully functioning Light, Dark and System themes.

Required outcomes:

1. A recognizable Qubira brand identity.
2. Complete redesign of the actual application shell, sidebar, topbar, footer and navigation.
3. Redesigned student dashboard, Daily Challenges, Practice Tasks, Battle Arena, Puzzle Quest, profile, settings and career pages.
4. Redesigned college, company and platform-admin experiences.
5. Page-specific layouts rather than repetitive dashboard templates.
6. Fully functional and persistent theme switching across every route and component.
7. Responsive and accessible desktop, tablet and mobile experiences.
8. All existing features, routes, authentication, API contracts and real data preserved.
9. No demo data presented as real production data.
10. No unused replacement components or disconnected pages.
11. No significant performance regressions.

Verification must include actual browser screenshots in Light and Dark modes, representative desktop and mobile routes, TypeScript, lint, frontend tests, production build and relevant backend regression tests.

Do not declare completion based on source-code changes alone. Verify the rendered application.

Deliver a detailed report listing changed files, migrated routes, test results, screenshots and incomplete functionality.
  - source: user
- **G2** Confirm the explicit boundaries and anything else that must not be changed.
  - answer: Do not:

- Migrate Next.js to another framework.
- Replace FastAPI.
- Replace Clerk authentication.
- Replace PostgreSQL or SQLAlchemy.
- Change existing API contracts.
- Perform destructive database migrations.
- Delete existing users, XP, battles, submissions, or learning history.
- Remove working features.
- Introduce fake production data.
- Create duplicate navigation systems or duplicate feature engines.
- Add unnecessary dependencies.
- Change existing deployment infrastructure without authorization.

The task is a complete visual, UX and frontend architecture transformation, not a greenfield rebuild.

Preserve all existing functional capabilities and improve them where required for the new design.
  - source: user
- **G3** Confirm which existing checks are expected to pass and whether existing tests may be rewritten. The supplied brief requests focused/full frontend tests, typecheck, lint, build, and relevant backend regressions where feasible.
  - answer: partial: focused/full frontend tests, typecheck, lint, build, and relevant backend regressions where feasible
  - source: user
- **G5** Add any requirements, exclusions, dependencies, compliance rules, or operational constraints not covered above.
  - answer: ## Additional Qubira Requirements

### 1. Actual implementation
All redesign work must happen in the real existing repository. Identify the components used by actual application layouts and replace them. Do not create unused mockups or alternative components.

### 2. Complete page coverage
Inspect every existing route and migrate the entire product. Do not stop after redesigning the homepage or dashboard.

### 3. Dual-theme completeness
Light, Dark and System themes must work across:
- Sidebar and topbar.
- All dashboards.
- Daily Challenges and Practice Tasks.
- Coding editor and console.
- Battle Arena and tournaments.
- Existing Candy Crush-style Puzzle Quest.
- Profile and settings.
- Modals, forms, dropdowns and tables.
- Charts and notifications.
- College, company and admin interfaces.

### 4. Real data
Preserve real user data and existing backend integrations. Do not introduce hardcoded demo statistics, fake progress, mock users or simulated successful operations.

### 5. Original visual design
Do not apply one generic template to all pages. Use different visual compositions for competition, coding, career, learning, gaming and administration.

### 6. Existing functionality
Preserve all existing routes, navigation behavior, Clerk sessions, XP, user profiles, battle records, coding submissions, tournaments, Puzzle Quest progression and role permissions.

### 7. Performance
The current website has experienced slow loading and API timeout issues. The redesign must not make performance worse. Lazy-load heavy features and avoid unnecessary network requests.

### 8. Verification
Require real browser verification, desktop and mobile screenshots, Light and Dark theme testing, and honest reporting of incomplete features.

### 9. Implementation discipline
Implement in manageable phases, validate each phase, and continue through the entire route inventory. Do not stop after generating a plan or design system.

### 10. Branding
Use Qubira consistently in all new user-facing branding. Preserve existing technical identifiers and historical records where changing them would risk regressions.
  - source: user
