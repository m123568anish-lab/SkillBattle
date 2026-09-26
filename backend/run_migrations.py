#!/usr/bin/env python
"""
Run database migrations using Alembic.
This script is called before starting the FastAPI server on Render.
"""
import sys
import logging
from pathlib import Path
from alembic.config import Config
from alembic import command
from sqlalchemy import inspect

from app.database.init_db import init_db
from app.database.database import engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_migrations():
    """Run Alembic migrations."""
    try:
        alembic_cfg = Config(str(Path(__file__).with_name("alembic.ini")))
        existing_tables = set(inspect(engine).get_table_names())

        if "alembic_version" in existing_tables:
            logger.info("Applying pending Alembic migrations")
            command.upgrade(alembic_cfg, "heads")
            init_db()
        elif "users" in existing_tables:
            logger.info("Repairing legacy schema and applying the current migration")
            init_db()
            command.stamp(alembic_cfg, "4a6e8c2d1f30")
            command.upgrade(alembic_cfg, "heads")
        else:
            logger.info("Creating schema for a new database")
            init_db()
            command.stamp(alembic_cfg, "heads")

        logger.info("✅ Migrations completed successfully")
        return 0
    except Exception as e:
        logger.exception("❌ Database schema setup failed: %s", e)
        return 1

if __name__ == "__main__":
    exit_code = run_migrations()
    sys.exit(exit_code)
