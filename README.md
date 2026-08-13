# BattleAI / SkillBattle

BattleAI is a full-stack skill-battle application with a FastAPI backend and Next.js frontend. The repository includes local development support, Docker Compose orchestration, and production-ready configuration for PostgreSQL and Nginx.

## Status

- ✅ Backend FastAPI app with async lifespan and health endpoints
- ✅ Frontend Next.js app with dashboard and auth flows
- ✅ Docker Compose development and production configs
- ✅ Smoke test script for API verification
- ✅ Production environment examples under `.env.production.example`

## Getting Started

### 1) Install dependencies

#### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

#### Frontend

```powershell
cd frontend
yarn install
```

### 2) Run locally

#### Backend

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend

```powershell
cd frontend
yarn dev
```

### 3) Environment

Copy the example env file and set secrets:

```powershell
copy .env.example .env
```

Set `SECRET_KEY` and any other required values before running the application.

## Docker Compose

### Development

```powershell
docker compose up --build -d
```

Services started:
- `postgres`
- `backend`
- `frontend`
- `nginx`

To inspect logs:

```powershell
docker compose logs -f backend
```

### Production

Copy the production example and start with the production compose file:

```powershell
copy .env.production.example .env.production
# update values
docker compose -f docker-compose.prod.yml up --build -d
```

## Smoke Test

A smoke test is available at `scripts/smoke_test.py`.

```powershell
python scripts\smoke_test.py
```

The script performs:
- backend healthcheck
- register
- login
- dashboard access
- token refresh

## Important Files

- `docker-compose.yml` - development compose setup
- `docker-compose.prod.yml` - production compose setup
- `backend/Dockerfile.prod` - production backend image
- `backend/entrypoint.sh` - migration startup helper
- `backend/app/main.py` - FastAPI application entrypoint
- `backend/app/core/config.py` - environment config
- `scripts/smoke_test.py` - API smoke test

## Next Steps

1. Verify the app locally with `uvicorn` and `yarn dev`
2. Confirm Docker Compose startup
3. Run `scripts/smoke_test.py`
4. After verification, commit the final documentation and production config

## Notes

- For production, set `ENVIRONMENT=production` and use PostgreSQL.
- `NEXT_PUBLIC_API_URL` must point to your deployed frontend domain.
- If you want HTTPS, add Certbot and reverse proxy cert automation later.
