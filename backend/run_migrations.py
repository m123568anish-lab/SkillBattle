#!/usr/bin/env python
"""
Run database migrations using Alembic.
This script is called before starting the FastAPI server on Render.
"""
import sys
import logging
from alembic.config import Config
from alembic import command

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_migrations():
    """Run Alembic migrations."""
    try:
        # Configure Alembic
        alembic_cfg = Config("alembic.ini")
        
        # Run upgrade to head
        logger.info("Running database migrations...")
        command.upgrade(alembic_cfg, "head")
        logger.info("✅ Migrations completed successfully")
        return 0
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        return 1

if __name__ == "__main__":
    exit_code = run_migrations()
    sys.exit(exit_code)
