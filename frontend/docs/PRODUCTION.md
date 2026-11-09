**Production Hardening & Deployment Guide**

This document explains recommended production settings, TLS, secrets, and deployment steps.

1) Generate secrets

  - Generate a strong SECRET_KEY and place in `.env.production`:

  ```bash
  python scripts/generate_secret.py > secret.txt
  # copy the value into .env.production SECRET_KEY
  ```

2) Prepare `.env.production`

  - Copy the example and set real secrets and domain names:

  ```bash
  cp .env.production.example .env.production
  # edit .env.production and set SECRET_KEY, POSTGRES_PASSWORD, NEXT_PUBLIC_API_URL
  ```

3) Use the production Docker Compose

  ```bash
  docker compose -f docker-compose.prod.yml --env-file .env.production up --build -d
  ```

  This uses the optimized `Dockerfile.prod` image for the backend (gunicorn + uvicorn worker).

4) TLS (recommended)

  - Use a reverse proxy (nginx) with Let's Encrypt (Certbot) or a managed TLS provider.
  - Example nginx production snippet (replace `yourdomain.com` and certificate paths):

  ```nginx
  server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
  }

  server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
      proxy_pass http://frontend:3000;
      proxy_set_header Host $host;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
      proxy_pass http://backend:8000;
      proxy_set_header Host $host;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }
  }
  ```

5) Database migrations

  - API startup does not run schema creation or migrations. The nested legacy
    backend in this folder has no coordinated migration runner, so direct
    `alembic upgrade head` and model-based `init_db()` are disabled. Use only a
    separately reviewed migration process after the epoch and ownership gates
    have been implemented; neither fresh PostgreSQL installation nor existing
    database adoption is currently supported.

6) Health checks and monitoring

  - Use `/ready` for service readiness and `/health` for liveness only.
  - Configure Prometheus scraping (the project includes a Prometheus router at `/metrics`).

7) Security recommendations

  - Set `ENVIRONMENT=production` and `DEBUG=false`.
  - Limit `CORS_ORIGINS` to your production domain.
  - Store secrets in a secret manager (Azure Key Vault, AWS Secrets Manager, etc.) in production.
  - Run containers as non-root where possible and enable resource limits.

8) Logging & backups

  - Persist Postgres volumes and create regular backups.
  - Forward application logs to a central log provider (ELK/Datadog).

9) Rollback plan

  - Keep DB backups and schema versioning via Alembic.
  - Test migrations in staging before production.

If you want, I can:
- create a `systemd` unit file for the backend (non-Docker) or
- implement an automated Certbot + nginx setup script for this repository.
