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

from app.database.base import Base
from app.database.database import engine
from app import models as _models

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_migrations():
    """Run Alembic migrations."""
    try:
        # Configure Alembic
        alembic_cfg = Config("alembic.ini")

        logger.info("Creating missing tables from the current application schema")
        Base.metadata.create_all(bind=engine)

        try:
            ini_path = Path(__file__).parent / "alembic.ini"
            if ini_path.exists():
                alembic_cfg = Config(str(ini_path))
                command.stamp(alembic_cfg, "head")
        except Exception as stamp_err:
            logger.warning("Alembic stamp notification: %s", stamp_err)

        logger.info("✅ Migrations completed successfully")
        return 0
    except Exception as e:
        logger.exception("❌ Database schema setup failed: %s", e)
        return 1

if __name__ == "__main__":
    exit_code = run_migrations()
    sys.exit(exit_code)
