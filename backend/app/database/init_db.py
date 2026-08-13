"""
=========================================================

SkillBattle

Database Initialization

Initialize all database tables from models.

Ensures all models are imported before calling
Base.metadata.create_all() to guarantee all table
definitions are registered.

=========================================================
"""

import logging
import os

from app.database.base import Base
from app.database.database import engine

logger = logging.getLogger(__name__)

# CRITICAL: Import all models to register them with Base.metadata
# This MUST happen before create_all() is called
from app.models import (
    User,
    Profile,
    Achievement,
    Challenge,
    Conversation,
    Message,
    Roadmap,
    RoadmapWeek,
    RoadmapTask,
    InterviewSession,
    InterviewQuestion,
    InterviewAnswer,
    Resume,
    RefreshToken,
)

# Silence unused import warnings
__all__ = [
    "User",
    "Profile",
    "Achievement",
    "Challenge",
    "Conversation",
    "Message",
    "Roadmap",
    "RoadmapWeek",
    "RoadmapTask",
    "InterviewSession",
    "InterviewQuestion",
    "InterviewAnswer",
    "Resume",
    "RefreshToken",
]


def init_db() -> None:
    """
    Create all database tables.

    Models are imported above to ensure they're registered
    with Base.metadata before table creation.
    """
    logger.info("Creating database tables from registered models...")
    try:
        # If using a SQLite file-based DB, remove the existing file so
        # `create_all` creates a fresh schema matching the models. This
        # helps tests run against an up-to-date schema during development.
        try:
            # Only remove the SQLite DB file when explicitly requested via
            # the `RESET_DB` setting. This avoids accidental data loss when
            # the app restarts in development or with auto-reload enabled.
            from app.core.config import get_settings

            settings = get_settings()

            url = engine.url
            if url.drivername.startswith("sqlite"):
                db_path = url.database
                if (
                    getattr(settings, "RESET_DB", False)
                    and db_path
                    and db_path != ":memory:"
                    and os.path.exists(db_path)
                ):
                    logger.info(f"Removing existing SQLite DB at {db_path} (RESET_DB=True)")
                    os.remove(db_path)
                else:
                    logger.info("Skipping SQLite DB removal (RESET_DB is False)")
        except Exception:
            # If we can't determine or remove the file, continue and let create_all handle errors
            pass

        try:
            Base.metadata.create_all(bind=engine)
            logger.info(f"✅ Tables created: {list(Base.metadata.tables.keys())}")
        except Exception as e:
            # Some DB backends may raise an OperationalError on concurrent create_all
            # (e.g., multiple reload processes trying to create the same table).
            # If the error indicates the table already exists, log a warning and continue.
            import sqlalchemy

            if isinstance(e, sqlalchemy.exc.OperationalError) and "already exists" in str(e):
                logger.warning(f"Table already exists (ignored): {e}")
            else:
                logger.error(f"❌ Failed to create tables: {e}", exc_info=True)
                raise
    except Exception as e:
        logger.error(f"❌ Failed to create tables: {e}", exc_info=True)
        raise
