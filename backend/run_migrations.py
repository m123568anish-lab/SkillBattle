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
from alembic.script import ScriptDirectory
from sqlalchemy import inspect, text

from app.database.init_db import init_db
from app.database.database import engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def repair_duplicate_alembic_version_rows(alembic_cfg: Config) -> None:
    """Repair stale Alembic metadata when failed runs left multiple active revision rows."""
    with engine.connect() as connection:
        version_rows = connection.execute(text("SELECT version_num FROM alembic_version")).scalars().all()
        if len(version_rows) <= 1:
            if len(version_rows) == 0:
                logger.warning("alembic_version is empty while the schema exists; stamping the current Alembic head.")
            else:
                return

    script = ScriptDirectory.from_config(alembic_cfg)
    heads = script.get_heads()
    if len(heads) != 1:
        raise RuntimeError(
            f"Alembic revision graph has multiple heads ({heads}); refusing to auto-repair."
        )

    target_head = heads[0]
    logger.warning(
        "Detected duplicate Alembic version rows %s. Repairing metadata to single head %s.",
        version_rows,
        target_head,
    )

    with engine.begin() as connection:
        connection.execute(text("DELETE FROM alembic_version"))

    command.stamp(alembic_cfg, target_head)


def run_migrations():
    """Run Alembic migrations."""
    try:
        alembic_cfg = Config(str(Path(__file__).with_name("alembic.ini")))
        existing_tables = set(inspect(engine).get_table_names())

        if "alembic_version" in existing_tables:
            with engine.connect() as connection:
                version_rows = connection.execute(text("SELECT version_num FROM alembic_version")).scalars().all()

            if len(version_rows) == 0:
                script = ScriptDirectory.from_config(alembic_cfg)
                heads = script.get_heads()
                if len(heads) != 1:
                    raise RuntimeError(
                        f"Alembic revision graph has multiple heads ({heads}); refusing to auto-repair."
                    )
                logger.warning(
                    "Alembic metadata is empty while the schema already exists; stamping metadata to %s.",
                    heads[0],
                )
                command.stamp(alembic_cfg, heads[0])
                init_db()
                logger.info("✅ Migrations completed successfully")
                return 0

            if len(version_rows) > 1:
                repair_duplicate_alembic_version_rows(alembic_cfg)
                logger.info("Database schema already exists; repaired stale Alembic metadata without re-running prior migrations.")
                init_db()
                logger.info("✅ Migrations completed successfully")
                return 0

            logger.info("Applying pending Alembic migrations")
            command.upgrade(alembic_cfg, "head")
            init_db()
        elif "users" in existing_tables:
            logger.info("Repairing legacy schema and applying the current migration")
            init_db()
            command.stamp(alembic_cfg, "4a6e8c2d1f30")
            command.upgrade(alembic_cfg, "head")
        else:
            logger.info("Creating schema for a new database")
            init_db()
            command.stamp(alembic_cfg, "head")

        logger.info("✅ Migrations completed successfully")
        return 0
    except Exception as e:
        logger.exception("❌ Database schema setup failed: %s", e)
        return 1

if __name__ == "__main__":
    exit_code = run_migrations()
    sys.exit(exit_code)
