#!/usr/bin/env python
"""
Run database migrations using Alembic.
This script is called before starting the FastAPI server on Render.
"""
import sys
import logging
import traceback
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    stream=sys.stdout,
    force=True,
)

from alembic.config import Config
from alembic import command
from alembic.script import ScriptDirectory
from sqlalchemy import inspect, text

from app.database.init_db import init_db
from app.database.database import engine

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
    stage = "configuration"
    logger.info("MIGRATION STARTED")
    try:
        alembic_cfg = Config(str(Path(__file__).with_name("alembic.ini")))
        script = ScriptDirectory.from_config(alembic_cfg)
        target_heads = script.get_heads()
        logger.info(
            "MIGRATION TARGET revisions=%s config=%s database_driver=%s",
            target_heads,
            alembic_cfg.config_file_name,
            engine.url.drivername,
        )

        stage = "database inspection"
        existing_tables = set(inspect(engine).get_table_names())

        if "alembic_version" in existing_tables:
            stage = "revision inspection"
            with engine.connect() as connection:
                version_rows = connection.execute(text("SELECT version_num FROM alembic_version")).scalars().all()
            logger.info("MIGRATION CURRENT revisions=%s", version_rows)
            if len(version_rows) == 1 and len(target_heads) == 1:
                pending_revisions = [
                    revision.revision
                    for revision in reversed(
                        list(script.iterate_revisions(target_heads[0], version_rows[0]))
                    )
                ]
                logger.info("MIGRATION PENDING revisions=%s", pending_revisions)

            if len(version_rows) == 0:
                if len(target_heads) != 1:
                    raise RuntimeError(
                        f"Alembic revision graph has multiple heads ({target_heads}); refusing to auto-repair."
                    )
                logger.warning(
                    "Alembic metadata is empty while the schema already exists; stamping metadata to %s.",
                    target_heads[0],
                )
                stage = "stamping empty revision metadata"
                command.stamp(alembic_cfg, target_heads[0])
                stage = "schema initialization"
                init_db()
                logger.info("MIGRATION COMPLETED")
                return 0

            if len(version_rows) > 1:
                stage = "repairing duplicate revision metadata"
                repair_duplicate_alembic_version_rows(alembic_cfg)
                logger.info("Database schema already exists; repaired stale Alembic metadata without re-running prior migrations.")
                stage = "schema initialization"
                init_db()
                logger.info("MIGRATION COMPLETED")
                return 0

            stage = "applying Alembic migrations"
            logger.info("MIGRATION APPLY current=%s target=%s", version_rows, target_heads)
            command.upgrade(alembic_cfg, "head")
            logger.info("MIGRATION APPLY COMPLETED target=%s", target_heads)
            stage = "schema initialization"
            init_db()
        elif "users" in existing_tables:
            logger.info("MIGRATION CURRENT revisions=[] legacy_schema=true")
            stage = "legacy schema initialization"
            logger.info("Repairing legacy schema and applying the current migration")
            init_db()
            stage = "stamping legacy revision"
            command.stamp(alembic_cfg, "4a6e8c2d1f30")
            stage = "applying Alembic migrations"
            logger.info("MIGRATION APPLY current=4a6e8c2d1f30 target=%s", target_heads)
            command.upgrade(alembic_cfg, "head")
            logger.info("MIGRATION APPLY COMPLETED target=%s", target_heads)
        else:
            logger.info("MIGRATION CURRENT revisions=[] new_schema=true")
            stage = "new schema initialization"
            logger.info("Creating schema for a new database")
            init_db()
            stage = "stamping new schema revision"
            command.stamp(alembic_cfg, "head")

        logger.info("MIGRATION COMPLETED")
        return 0
    except Exception:
        logger.error("MIGRATION FAILED stage=%s", stage)
        traceback.print_exc(file=sys.stdout)
        sys.stdout.flush()
        for handler in logging.getLogger().handlers:
            handler.flush()
        return 1

if __name__ == "__main__":
    exit_code = run_migrations()
    sys.exit(exit_code)
