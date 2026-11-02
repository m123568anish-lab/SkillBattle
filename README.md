# QUBIRA — Learn. Build. Compete.

**QUBIRA** is an AI-powered technical learning, coding assessment, and competitive skill platform designed to take software engineers from foundational computer science concepts to elite production engineering and interview readiness.

---

## 🌟 Official Brand & Feature Architecture

- **Brand Name:** QUBIRA
- **Official Tagline:** *Learn. Build. Compete.*
- **Official Domain / Support:** `https://qubira.io` · `support@qubira.io`

### Core Product Modules

| Feature Suite | Platform Section | Description |
|---|---|---|
| **Qubira Learn** | `/practice` | Distraction-free conceptual mastery, algorithmic problem sets, and guided curriculum tracks. |
| **Qubira Code** | `/practice/coding` | Monaco-powered interactive algorithmic code execution, multi-language support, custom testcases, and instant feedback. |
| **Qubira Quiz** | `/practice/mcq` | Rapid-fire concept reinforcement, multiple-choice quizzes, timed sprints, and knowledge tests. |
| **Qubira Missions** | `/practice/tasks` | Real-world engineering tasks, debugging puzzles, architectural scenarios, and project challenges. |
| **Qubira Arena** | `/battle` | The central command center for live and asynchronous developer combat. |
| **Solo Challenges** | `/battle/solo` | Timed personal best sprints, algorithm challenges, and ranked solo problem solving. |
| **Arena Duels** | `/battle/lobby` | Real-time synchronized 1v1 coding duels with WebSockets, live test execution, and dynamic ELO ratings. |
| **Daily Clash** | `/battle/championship` | Daily flagship competition under unified time constraints, verified XP pools, and championship badges. |
| **Qubira Rankings** | `/leaderboard` | Real-time global, college, and league rating leaderboards with verified student achievements. |
| **Qubira Mentor** | `/coach` | Context-aware AI coach generating tailored technical roadmaps, mock interviews, and personalized practice recommendations. |
| **Qubira Paths** | `/roadmap` | Personalized multi-week skill roadmaps aligned to target companies and roles. |
| **Interview Prep** | `/interview` | AI-evaluated behavioral and technical interview simulations with real-time scoring. |

---

## 🛠️ Technology Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Framer Motion, Monaco Editor
- **Backend:** FastAPI, Python 3.11+, SQLAlchemy 2.0 (async), Pydantic v2
- **Database:** PostgreSQL (with SQLite compatibility for local testing)
- **Real-Time:** WebSockets for multiplayer duels, live battle states, and chat
- **Caching & Queue:** Redis for rate limiting, matchmaking queues, and caching
- **AI Integration:** Google Gemini, OpenAI, and Ollama support with advisory mentorship guardrails
- **Deployment:** Vercel (Frontend), Render / Docker Compose (Backend & Workers)

---

## 🚀 Getting Started

### 1) Prerequisites

- Node.js 20+ and npm / yarn
- Python 3.11+
- PostgreSQL or local SQLite

### 2) Backend Setup

```bash
cd backend
python -m venv .venv

# Windows
.\.venv\Scripts\Activate.ps1

# Linux / macOS
source .venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:

```env
ENVIRONMENT=development
DATABASE_URL=sqlite+aiosqlite:///./test.db
SECRET_KEY=change-this-in-production-to-a-secure-secret-key-64chars
NEXT_PUBLIC_APP_URL=http://localhost:3000
AI_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-api-key
```

Run the backend server:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3) Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Run the frontend development server:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the Qubira platform.

---

## 🌐 Production Deployment & Migration Guide

When deploying the rebranded application to production:

### 1. Vercel (Frontend)
- Set **Root Directory** to `frontend`.
- Environment Variables:
  - `NEXT_PUBLIC_API_URL`: URL of the FastAPI backend (e.g., `https://api.qubira.io` or `https://skillbattle-api-2026.onrender.com`).
  - `NEXT_PUBLIC_APP_URL`: Frontend canonical URL (e.g., `https://qubira.io`).
- Custom Domains: Add `qubira.io` and `www.qubira.io` in the Vercel Domains tab.

### 2. Render / Cloud Hosting (Backend)
- Environment Variables:
  - `ENVIRONMENT=production`
  - `CORS_ORIGINS`: Include `https://qubira.io`, `https://www.qubira.io`, `https://skill-battle-frontend.vercel.app`.
  - `DATABASE_URL`: Production PostgreSQL connection string.
- Database Schema: Internal database table and column names remain completely backward-compatible.

### 3. DNS & Email (SMTP)
- Set transactional email `FROM` header to `Qubira Team <support@qubira.io>`.
- Configure SPF/DKIM records for `qubira.io` to ensure deliverability of verification and password-reset emails.

---

## 📄 License & Intellectual Property

© 2026 QUBIRA. All rights reserved. *Learn. Build. Compete.*
