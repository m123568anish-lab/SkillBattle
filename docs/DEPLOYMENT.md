**Docker Compose Deployment**

This document describes how to run the project using Docker Compose and how to execute a basic smoke test.

Prerequisites
- Docker & Docker Compose
- At least 4GB RAM available

1) Copy example env and set secrets

```bash
cp .env.example .env
# edit .env and set SECRET_KEY and any API keys
```

2) Build and start the services

```bash
docker compose up --build -d
```

This starts:
- `postgres` (database)
- `backend` (FastAPI)
- `frontend` (Next.js)
- `nginx` (reverse proxy)

3) Check service status

```bash
docker compose ps
docker compose logs -f backend
```

4) Run smoke tests (from your host)

```bash
python3 - <<'PY'
import requests, time
base='http://localhost:8000/api/v1'
for i in range(10):
    try:
        r=requests.get(base+'/health')
        print('health',r.status_code,r.json())
        break
    except Exception as e:
        print('waiting for backend...',e)
        time.sleep(2)

# Register -> Login -> Dashboard
reg={'username':'smoketest','email':'smoketest@example.com','full_name':'Smoke Test','password':'password123'}
print('register', requests.post(base+'/auth/register',json=reg).status_code)
li={'email':'smoketest@example.com','password':'password123'}
resp=requests.post(base+'/auth/login',json=li)
print('login',resp.status_code, resp.text)
if resp.status_code==200:
    body=resp.json()
    token = body.get('access_token') or (body.get('tokens') or {}).get('access_token')
    headers={'Authorization':f'Bearer {token}'}
    d=requests.get(base+'/dashboard',headers=headers)
    print('dashboard', d.status_code)
PY
```

Notes
- If you prefer SQLite, set `DATABASE_TYPE=sqlite` in `.env` and remove Postgres-related env variables.
- The backend entrypoint runs Alembic migrations automatically.
