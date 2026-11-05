"""
====================================================================
Step 03: Supabase PostgreSQL & API Connectivity Verification
====================================================================
Safely tests target Supabase database and service role credentials.
"""

from __future__ import annotations

import argparse
import os
import sys
from typing import Dict, Any
from urllib.parse import urlparse

from common import logger


def mask_url(url: str) -> str:
    """Mask password and sensitive connection parameters."""
    if not url:
        return "<not set>"
    try:
        parsed = urlparse(url)
        netloc = parsed.hostname or ""
        if parsed.port:
            netloc += f":{parsed.port}"
        if parsed.username:
            netloc = f"{parsed.username}:***@" + netloc
        return f"{parsed.scheme}://{netloc}{parsed.path}"
    except Exception:
        return "<masked-url>"


def run_connection_check(target_url: str | None = None) -> Dict[str, Any]:
    db_url = (
        target_url
        or os.getenv("SUPABASE_DATABASE_URL")
        or os.getenv("DATABASE_URL")
        or ""
    ).strip()

    supabase_url = os.getenv("SUPABASE_URL", "").strip()
    has_service_key = bool(os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

    logger.info("====================================================")
    logger.info("Step 03: Supabase Connection Verification")
    logger.info("====================================================")
    logger.info("Target DB URL: %s", mask_url(db_url))
    logger.info("Supabase API URL: %s", supabase_url or "<not set>")
    logger.info("Service Role Key configured: %s", has_service_key)

    result: Dict[str, Any] = {
        "configured": bool(db_url and ("postgres" in db_url or "postgresql" in db_url)),
        "database_connected": False,
        "supabase_api_accessible": False,
        "postgres_version": None,
        "extensions": [],
        "warnings": [],
    }

    if not result["configured"]:
        logger.warning(
            "Notice: Target PostgreSQL connection string (SUPABASE_DATABASE_URL) is not yet set in environment. "
            "Connectivity check will operate in DRY-RUN / SIMULATION mode."
        )
        return result

    # Standardize url for psycopg / sqlalchemy
    normalized_url = db_url
    if normalized_url.startswith("postgres://"):
        normalized_url = normalized_url.replace("postgres://", "postgresql://", 1)

    try:
        from sqlalchemy import create_engine, text

        logger.info("Testing connection to PostgreSQL database...")
        engine = create_engine(normalized_url, pool_pre_ping=True, connect_args={"connect_timeout": 10})
        with engine.connect() as conn:
            version = conn.execute(text("SELECT version();")).scalar()
            result["postgres_version"] = str(version)
            result["database_connected"] = True
            logger.info("Database Connection SUCCESSFUL!")
            logger.info("PostgreSQL Version: %s", str(version).split(",")[0])

            # Check schema permissions
            schema_check = conn.execute(
                text("SELECT has_schema_privilege(current_user, 'public', 'CREATE');")
            ).scalar()
            logger.info("Current user has public schema CREATE privilege: %s", schema_check)

            # Check installed extensions
            exts = conn.execute(text("SELECT extname FROM pg_extension;")).scalars().all()
            result["extensions"] = list(exts)
            logger.info("Installed extensions: %s", ", ".join(exts))

            # Check auth schema presence (Supabase specific)
            has_auth = conn.execute(
                text("SELECT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth');")
            ).scalar()
            logger.info("Supabase 'auth' schema detected: %s", bool(has_auth))

    except Exception as e:
        logger.error("Database connection failed: %s", str(e))
        result["warnings"].append(f"DB connection error: {e}")

    # Optional: check Supabase API endpoint if service key present
    if supabase_url and has_service_key:
        try:
            import urllib.request
            req = urllib.request.Request(
                f"{supabase_url.rstrip('/')}/auth/v1/health",
                headers={"apikey": os.environ["SUPABASE_SERVICE_ROLE_KEY"]},
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                if resp.status in (200, 204):
                    result["supabase_api_accessible"] = True
                    logger.info("Supabase Auth API health check PASSED!")
        except Exception as e:
            logger.warning("Supabase Auth API check notice: %s", e)
            result["warnings"].append(f"Supabase API notice: {e}")

    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test connection to Supabase PostgreSQL.")
    parser.add_argument("--url", type=str, default=None, help="Target PostgreSQL connection string")
    args = parser.parse_args()

    res = run_connection_check(args.url)
    if res["configured"] and not res["database_connected"]:
        sys.exit(1)
    sys.exit(0)
