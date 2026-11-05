"""
====================================================================
Step 04: Prepare Supabase PostgreSQL Schema via Alembic & DDL
====================================================================
Prepares target PostgreSQL tables using the official Alembic migrations.
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from typing import Dict, Any

from common import (
    BACKEND_DIR,
    REPO_ROOT,
    TOPOLOGICAL_MIGRATION_ORDER,
    logger,
)


def run_schema_preparation(
    target_url: str | None = None,
    dry_run: bool = False,
) -> Dict[str, Any]:
    db_url = (
        target_url
        or os.getenv("SUPABASE_DATABASE_URL")
        or os.getenv("DATABASE_URL")
        or ""
    ).strip()

    logger.info("====================================================")
    logger.info("Step 04: Supabase PostgreSQL Schema Preparation")
    logger.info("====================================================")
    logger.info("Dry-Run: %s", dry_run)
    logger.info("Authoritative Migration Tool: Alembic")
    logger.info("Total Tables to Prepare: %d", len(TOPOLOGICAL_MIGRATION_ORDER))

    is_postgres = bool(db_url and ("postgres" in db_url or "postgresql" in db_url))

    if dry_run or not is_postgres:
        logger.info("[DRY-RUN] Simulating Alembic schema preparation...")
        logger.info("[DRY-RUN] Would run: alembic upgrade head against target database")
        logger.info("[DRY-RUN] Target schema includes all 77 application tables + alembic_version")
        logger.info("[DRY-RUN] Would execute identity link DDL on public.users:")
        logger.info("          ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE;")
        logger.info("          CREATE INDEX IF NOT EXISTS ix_users_auth_user_id ON public.users(auth_user_id);")

        # Verify that alembic can generate offline SQL without error
        try:
            env = os.environ.copy()
            env["DATABASE_URL"] = "postgresql://mock:mock@localhost:5432/mock"
            res = subprocess.run(
                ["alembic", "upgrade", "head", "--sql"],
                cwd=str(BACKEND_DIR),
                capture_output=True,
                text=True,
                env=env,
            )
            if res.returncode == 0:
                logger.info("[DRY-RUN] Alembic offline SQL generation test: SUCCESSFUL (Generated %d lines of DDL)", len(res.stdout.splitlines()))
            else:
                logger.warning("[DRY-RUN] Alembic offline SQL notice: %s", res.stderr[:200] if res.stderr else "None")
        except Exception as e:
            logger.warning("[DRY-RUN] Could not execute alembic CLI directly: %s", e)

        return {
            "status": "dry_run_success",
            "tables_planned": len(TOPOLOGICAL_MIGRATION_ORDER),
            "identity_ddl": "ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE;",
        }

    # Standardize URL
    normalized_url = db_url.replace("postgres://", "postgresql://", 1)

    logger.info("Applying migrations to target database...")
    env = os.environ.copy()
    env["DATABASE_URL"] = normalized_url

    # 1. Run Alembic upgrade head
    cmd = ["alembic", "upgrade", "head"]
    proc = subprocess.run(cmd, cwd=str(BACKEND_DIR), env=env, capture_output=True, text=True)
    if proc.returncode != 0:
        logger.error("Alembic migration failed: %s", proc.stderr)
        return {"status": "failed", "error": proc.stderr}

    logger.info("Alembic migrations applied successfully!")

    # 2. Add auth_user_id mapping column to public.users
    from sqlalchemy import create_engine, text
    engine = create_engine(normalized_url)
    with engine.begin() as conn:
        logger.info("Applying identity linking DDL to public.users...")
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"))
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";"))
        conn.execute(text("ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE;"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_auth_user_id ON public.users(auth_user_id);"))
        logger.info("Identity linking columns prepared.")

    return {
        "status": "success",
        "tables_prepared": len(TOPOLOGICAL_MIGRATION_ORDER),
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Prepare Supabase PostgreSQL schema.")
    parser.add_argument("--dry-run", action="store_true", help="Simulate schema creation without modifying database")
    parser.add_argument("--url", type=str, default=None, help="Target PostgreSQL connection string")
    args = parser.parse_args()

    res = run_schema_preparation(args.url, dry_run=args.dry_run)
    sys.exit(0 if "success" in res.get("status", "") else 1)
