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

from sqlalchemy import inspect, text

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
    Streak,
    Question,
    UserSubmission,
    UserStats,
    UserSettings,
    College,
    Department,
    Batch,
    CollegeStudent,
    CollegeAssessment,
    CollegeAssessmentQuestion,
    CollegeAssessmentSubmission,
    Company,
    CompanyMember,
    JobPosting,
    CandidateApplication,
)
from app.models.battle import (
    BattleParticipant,
    BattleResult,
    BattleRoom,
    BattleSubmission,
)
from app.models.user_skill_stat import UserSkillStat
from app.models.xp import XP


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
    "Streak",
    "BattleParticipant",
    "BattleResult",
    "BattleRoom",
    "BattleSubmission",
    "UserSkillStat",
    "XP",
    "Question",
    "UserSubmission",
    "UserStats",
    "UserSettings",
    "Company",
    "CompanyMember",
    "JobPosting",
    "CandidateApplication",
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
            _repair_users_table()
            _repair_achievements_table()
            _repair_profile_preferences()
            _repair_dashboard_tables()
            _repair_college_tables()
            _seed_initial_problems()
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


def _repair_users_table() -> None:
    """Add columns missing from databases created by older app versions."""
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    existing = {column["name"] for column in inspector.get_columns("users")}
    missing_columns = {
        "username": "VARCHAR(30) DEFAULT 'player'",
        "role": "VARCHAR(50) DEFAULT 'user'",
        "avatar_url": "VARCHAR(500)",
        "bio": "VARCHAR(1000)",
        "country": "VARCHAR(100)",
        "city": "VARCHAR(100)",
        "website": "VARCHAR(500)",
        "github_url": "VARCHAR(500)",
        "linkedin_url": "VARCHAR(500)",
        "login_count": "INTEGER DEFAULT 0",
        "coding_rating": "INTEGER DEFAULT 0",
        "placement_score": "INTEGER DEFAULT 0",
        "resume_score": "INTEGER DEFAULT 0",
        "is_active": "BOOLEAN DEFAULT TRUE",
        "is_verified": "BOOLEAN DEFAULT TRUE",
        "onboarding_completed": "BOOLEAN DEFAULT TRUE",
        "last_login": "TIMESTAMP",
        "is_superuser": "BOOLEAN DEFAULT FALSE",
        "created_at": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        "updated_at": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
    }

    with engine.begin() as connection:
        for name, definition in missing_columns.items():
            if name not in existing:
                connection.execute(text(f'ALTER TABLE "users" ADD COLUMN "{name}" {definition}'))
                logger.info("Added missing users.%s column", name)

        # Ensure all existing user records have onboarding_completed set to True
        connection.execute(text('UPDATE "users" SET "onboarding_completed" = TRUE WHERE "onboarding_completed" IS NULL'))

        if "xp" in inspector.get_table_names():
            connection.execute(text('CREATE INDEX IF NOT EXISTS "ix_xp_user_id" ON "xp" ("user_id")'))
            connection.execute(text('CREATE INDEX IF NOT EXISTS "ix_xp_total_xp" ON "xp" ("total_xp")'))


def _repair_achievements_table() -> None:
    """Repair stale installations where the achievements table was created with only an id column."""
    inspector = inspect(engine)
    if "achievements" not in inspector.get_table_names():
        return

    existing = {column["name"] for column in inspector.get_columns("achievements")}
    required_columns = {
        "user_id": "VARCHAR(36) NOT NULL DEFAULT ''",
        "title": "VARCHAR(120) NOT NULL DEFAULT ''",
        "description": "VARCHAR(300) DEFAULT ''",
        "icon": "VARCHAR(50) DEFAULT 'trophy'",
        "unlocked": "BOOLEAN DEFAULT FALSE",
        "earned_at": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
    }

    with engine.begin() as connection:
        for name, definition in required_columns.items():
            if name not in existing:
                connection.execute(text(f'ALTER TABLE "achievements" ADD COLUMN "{name}" {definition}'))
                logger.info("Added missing achievements.%s column", name)

        connection.execute(text('CREATE INDEX IF NOT EXISTS "ix_achievements_user_id" ON "achievements" ("user_id")'))


def _repair_profile_preferences() -> None:
    """Add onboarding preferences to profiles created by an earlier version."""
    inspector = inspect(engine)
    if "profiles" not in inspector.get_table_names():
        return

    existing = {column["name"] for column in inspector.get_columns("profiles")}
    if "onboarding_preferences" in existing:
        return

    with engine.begin() as connection:
        connection.execute(
            text(
                "ALTER TABLE \"profiles\" ADD COLUMN "
                "\"onboarding_preferences\" JSON NOT NULL DEFAULT '{}'"
            )
        )
        logger.info("Added missing profiles.onboarding_preferences column")


def _repair_dashboard_tables() -> None:
    """Add dashboard fields missing from databases created by older app versions."""
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    additions = {
        "xp": {"daily_xp": "INTEGER NOT NULL DEFAULT 0"},
        "daily_challenges": {"xp_reward": "INTEGER NOT NULL DEFAULT 50"},
    }

    with engine.begin() as connection:
        for table, columns in additions.items():
            if table not in tables:
                continue

            existing = {column["name"] for column in inspector.get_columns(table)}
            for name, definition in columns.items():
                if name not in existing:
                    connection.execute(
                        text(f'ALTER TABLE "{table}" ADD COLUMN "{name}" {definition}')
                    )
                    logger.info("Added missing %s.%s column", table, name)


def _seed_initial_problems() -> None:
    """Seed initial coding practice problems if the problems table is empty."""
    inspector = inspect(engine)
    if "problems" not in inspector.get_table_names():
        return

    with engine.begin() as connection:
        count = connection.execute(text("SELECT COUNT(*) FROM problems")).scalar()
        if count and count > 0:
            return

        logger.info("Seeding initial practice problems into database...")
        seed_data = [
            (
                "Two Sum",
                "two-sum",
                "Easy",
                "Arrays",
                "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
                "Line 1: Space-separated integers (nums)\nLine 2: Single integer (target)",
                "Space-separated pair of indices",
                "2 <= nums.length <= 10^4",
                "Use a hash map to store complements for O(N) lookup.",
                100,
            ),
            (
                "Reverse String",
                "reverse-string",
                "Easy",
                "Strings",
                "Write a function that reverses a string. The input string is given as an array of characters.",
                "Single line string",
                "Reversed string",
                "1 <= s.length <= 10^5",
                "Use two pointers (left and right) swapping elements inward.",
                80,
            ),
            (
                "Valid Parentheses",
                "valid-parentheses",
                "Easy",
                "Stack",
                "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
                "Single line containing brackets",
                "True if valid, False otherwise",
                "1 <= s.length <= 10^4",
                "Use a stack to push open brackets and match on closing brackets.",
                120,
            ),
            (
                "Binary Search",
                "binary-search",
                "Medium",
                "Search",
                "Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums.",
                "Line 1: Sorted integers\nLine 2: Target integer",
                "Index of target if found, else -1",
                "1 <= nums.length <= 10^4",
                "Maintain low and high pointers, halve the search space at mid.",
                200,
            ),
            (
                "Maximum Subarray",
                "maximum-subarray",
                "Hard",
                "Dynamic Programming",
                "Given an integer array nums, find the subarray with the largest sum, and return its sum.",
                "Space-separated integers",
                "Single integer (maximum sum)",
                "1 <= nums.length <= 10^5",
                "Kadane's Algorithm: current_sum = max(num, current_sum + num).",
                300,
            ),
        ]

        for title, slug, diff, cat, desc, inp, out, const, exp, xp in seed_data:
            connection.execute(
                text(
                    """
                    INSERT INTO problems (title, slug, difficulty, category, description, input_format, output_format, constraints, explanation, xp_reward, time_limit, memory_limit, is_active, created_at, updated_at)
                    VALUES (:title, :slug, :diff, :cat, :desc, :inp, :out, :const, :exp, :xp, 2, 256, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    ON CONFLICT DO NOTHING
                    """
                ),
                {
                    "title": title,
                    "slug": slug,
                    "diff": diff,
                    "cat": cat,
                    "desc": desc,
                    "inp": inp,
                    "out": out,
                    "const": const,
                    "exp": exp,
                    "xp": xp,
                },
            )
        logger.info("Successfully seeded 5 initial practice problems.")


def _repair_college_tables() -> None:
    """Ensure all college platform tables exist in the database."""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Checked & created college platform tables.")
    except Exception as e:
        logger.warning(f"College tables repair warning: {e}")


