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

from sqlalchemy import bindparam, inspect, text

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
    PasswordResetToken,
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
    CandidatePrivacySettings,
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
from app.models.skill_intelligence import SkillEvidence, CompanySkillRequirement
from app.models.xp import XP, XPLedger


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
    "PasswordResetToken",
    "Streak",
    "BattleParticipant",
    "BattleResult",
    "BattleRoom",
    "BattleSubmission",
    "UserSkillStat",
    "SkillEvidence",
    "CompanySkillRequirement",
    "XP",
    "XPLedger",
    "Question",
    "UserSubmission",
    "UserStats",
    "UserSettings",
    "Company",
    "CompanyMember",
    "CandidatePrivacySettings",
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
            inspector = inspect(engine)
            existing_tables = set(inspector.get_table_names())
            schema_initialized = "users" in existing_tables and "questions" in existing_tables

            if not schema_initialized:
                logger.info("Initializing new database schema...")
                Base.metadata.create_all(bind=engine)
                _repair_users_table()
                _repair_achievements_table()
                _repair_profile_preferences()
                _repair_dashboard_tables()
                _repair_college_tables()
                _repair_company_tables()
                _repair_battle_tables()
                logger.info(f"✅ Tables created: {list(Base.metadata.tables.keys())}")
            else:
                Base.metadata.create_all(bind=engine)
                _repair_company_tables()
                logger.info("⚡ Database schema already initialized (%d tables found); verified all registered model tables exist.", len(existing_tables))

            _deactivate_legacy_sample_content()
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


def _deactivate_legacy_sample_content() -> None:
    """Hide only the exact records inserted by the removed built-in sample seeders."""
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    legacy_problem_slugs = (
        "two-sum",
        "reverse-string",
        "valid-parentheses",
        "binary-search",
        "maximum-subarray",
    )
    legacy_question_slugs = (
        "time-complexity-quicksort-worst-case",
        "acid-properties-dbms",
        "access-array-element",
        "sum-two-integers",
        "fix-off-by-one-loop-bug",
        "explain-rest-vs-graphql",
    )

    with engine.begin() as connection:
        if "problems" in tables and "is_active" in {
            column["name"] for column in inspector.get_columns("problems")
        }:
            connection.execute(
                text("UPDATE problems SET is_active = FALSE WHERE slug IN :slugs").bindparams(
                    bindparam("slugs", expanding=True)
                ),
                {"slugs": legacy_problem_slugs},
            )
        if "questions" in tables and "is_active" in {
            column["name"] for column in inspector.get_columns("questions")
        }:
            connection.execute(
                text("UPDATE questions SET is_active = FALSE WHERE slug IN :slugs").bindparams(
                    bindparam("slugs", expanding=True)
                ),
                {"slugs": legacy_question_slugs},
            )


def _repair_users_table() -> None:
    """Add columns missing from databases created by older app versions."""
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    existing = {column["name"] for column in inspector.get_columns("users")}
    missing_columns = {
        "username": "VARCHAR(30) DEFAULT 'player'",
        "clerk_user_id": "VARCHAR(64)",
        "role": "VARCHAR(50) DEFAULT 'user'",
        "account_type": "VARCHAR(30) DEFAULT 'STUDENT'",
        "requested_role": "VARCHAR(50)",
        "status": "VARCHAR(30) DEFAULT 'ACTIVE'",
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
        "two_factor_enabled": "BOOLEAN DEFAULT FALSE",
        "two_factor_secret": "VARCHAR(255)",
        "two_factor_recovery_hashes": "VARCHAR(2000)",
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

        # Performance indexes for fast dashboard evidence and roadmap lookups
        if "user_submissions" in tables:
            connection.execute(text('CREATE INDEX IF NOT EXISTS "ix_user_submissions_user_created" ON "user_submissions" ("user_id", "created_at")'))
        if "battle_submissions" in tables:
            connection.execute(text('CREATE INDEX IF NOT EXISTS "ix_battle_submissions_user_submitted" ON "battle_submissions" ("user_id", "submitted_at")'))
        if "assessment_question_submissions" in tables:
            connection.execute(text('CREATE INDEX IF NOT EXISTS "ix_assessment_q_sub_user_created" ON "assessment_question_submissions" ("user_id", "created_at")'))
        if "roadmaps" in tables:
            connection.execute(text('CREATE INDEX IF NOT EXISTS "ix_roadmaps_user_status" ON "roadmaps" ("user_id", "status")'))


def _repair_college_tables() -> None:
    """Ensure all college platform tables exist in the database."""
    try:
        Base.metadata.create_all(bind=engine)
        inspector = inspect(engine)
        if "college_assessment_questions" in inspector.get_table_names():
            columns = {column["name"] for column in inspector.get_columns("college_assessment_questions")}
            if "skill_category" not in columns:
                with engine.begin() as connection:
                    connection.execute(
                        text(
                            'ALTER TABLE "college_assessment_questions" '
                            'ADD COLUMN "skill_category" VARCHAR(100) NOT NULL DEFAULT \'General\''
                        )
                    )
                logger.info("Added missing college_assessment_questions.skill_category column")
        logger.info("Checked & created college platform tables.")
    except Exception as e:
        logger.warning(f"College tables repair warning: {e}")


def _repair_company_tables() -> None:
    """Add company recruitment fields to existing installations."""
    inspector = inspect(engine)
    with engine.begin() as connection:
        tables = set(inspector.get_table_names())
        if "job_postings" in tables:
            existing = {column["name"] for column in inspector.get_columns("job_postings")}
            additions = {
                "category": "VARCHAR(100) NOT NULL DEFAULT 'general'",
                "work_mode": "VARCHAR(20) NOT NULL DEFAULT 'on_site'",
                "eligibility": "TEXT NOT NULL DEFAULT ''",
                "application_url": "VARCHAR(500) NOT NULL DEFAULT ''",
                "source_url": "VARCHAR(500) NOT NULL DEFAULT ''",
                "source_label": "VARCHAR(120) NOT NULL DEFAULT 'Company'",
                "verification_status": "VARCHAR(30) NOT NULL DEFAULT 'verified'",
                "opens_at": "DATETIME",
                "deadline_at": "DATETIME",
            }
            for name, definition in additions.items():
                if name not in existing:
                    connection.execute(text(f'ALTER TABLE "job_postings" ADD COLUMN "{name}" {definition}'))
                    logger.info("Added missing job_postings.%s column", name)
        if "candidate_applications" in tables:
            existing = {column["name"] for column in inspector.get_columns("candidate_applications")}
            additions = {
                "assessment_battle_id": "VARCHAR(36)",
                "assessment_status": "VARCHAR(30) NOT NULL DEFAULT 'not_started'",
                "assessment_score": "FLOAT",
                "application_method": "VARCHAR(30) NOT NULL DEFAULT 'internal'",
                "externally_confirmed_at": "DATETIME",
            }
            for name, definition in additions.items():
                if name not in existing:
                    connection.execute(text(f'ALTER TABLE "candidate_applications" ADD COLUMN "{name}" {definition}'))
                    logger.info("Added missing candidate_applications.%s column", name)


def _repair_battle_tables() -> None:
    """Ensure missing columns exist on questions, battle_rooms, battle_submissions, and battle_results."""
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())

    with engine.begin() as connection:
        if "questions" in tables:
            existing = {c["name"] for c in inspector.get_columns("questions")}
            cols = {
                "question_type": "VARCHAR(30) DEFAULT 'coding'",
                "options": "JSON",
                "examples": "JSON",
                "hidden_test_cases": "JSON",
                "company_tags": "JSON",
                "topic_tags": "JSON",
                "correct_option": "VARCHAR(100) DEFAULT ''",
                "buggy_code": "TEXT",
                "fixed_code_reference": "TEXT",
                "rubric": "JSON",
                "explanation": "TEXT",
                "skill_category": "VARCHAR(50) DEFAULT 'Problem Solving'",
                "estimated_time_minutes": "INTEGER DEFAULT 5",
                "is_ai_generated": "BOOLEAN DEFAULT FALSE",
                "is_validated": "BOOLEAN DEFAULT TRUE",
            }
            for name, defn in cols.items():
                if name not in existing:
                    connection.execute(text(f'ALTER TABLE "questions" ADD COLUMN "{name}" {defn}'))
                    logger.info("Added missing questions.%s column", name)

            # Cast JSON to text before checking legacy empty values; PostgreSQL JSON
            # has no equality operator against an untyped empty string.
            json_defaults = {
                "options": "[]",
                "examples": "[]",
                "hidden_test_cases": "[]",
                "company_tags": "[]",
                "topic_tags": "[]",
                "rubric": "{}",
            }
            for column, default_json in json_defaults.items():
                connection.execute(
                    text(
                        f"UPDATE questions SET {column} = '{default_json}' "
                        f"WHERE {column} IS NULL OR CAST({column} AS TEXT) IN ('', '\"\"')"
                    )
                )

        if "battle_rooms" in tables:
            existing = {c["name"] for c in inspector.get_columns("battle_rooms")}
            cols = {
                "config_id": "VARCHAR(36)",
                "battle_type": "VARCHAR(50) DEFAULT 'general'",
                "current_section_index": "INTEGER DEFAULT 0",
                "company_id": "VARCHAR(36)",
                "college_id": "VARCHAR(36)",
                "sections_config": "JSON",
                "questions_data": "JSON",
                "anti_cheat_logs": "JSON",
            }
            for name, defn in cols.items():
                if name not in existing:
                    connection.execute(text(f'ALTER TABLE "battle_rooms" ADD COLUMN "{name}" {defn}'))
                    logger.info("Added missing battle_rooms.%s column", name)

        if "battle_submissions" in tables:
            existing = {c["name"] for c in inspector.get_columns("battle_submissions")}
            cols = {
                "question_id": "INTEGER",
                "section_index": "INTEGER DEFAULT 0",
                "question_type": "VARCHAR(30) DEFAULT 'coding'",
                "mcq_option": "VARCHAR(100)",
                "score_earned": "FLOAT DEFAULT 0.0",
                "max_possible_score": "FLOAT DEFAULT 100.0",
                "time_taken_seconds": "INTEGER DEFAULT 0",
                "telemetry": "JSON",
            }
            for name, defn in cols.items():
                if name not in existing:
                    connection.execute(text(f'ALTER TABLE "battle_submissions" ADD COLUMN "{name}" {defn}'))
                    logger.info("Added missing battle_submissions.%s column", name)

        if "battle_results" in tables:
            existing = {c["name"] for c in inspector.get_columns("battle_results")}
            cols = {
                "battle_type": "VARCHAR(50) DEFAULT 'general'",
                "participant_id": "VARCHAR(36)",
                "knowledge_score": "FLOAT DEFAULT 0.0",
                "coding_score": "FLOAT DEFAULT 0.0",
                "debugging_score": "FLOAT DEFAULT 0.0",
                "technical_score": "FLOAT DEFAULT 0.0",
                "overall_score": "FLOAT DEFAULT 0.0",
                "accuracy_percentage": "FLOAT DEFAULT 0.0",
                "accuracy": "FLOAT DEFAULT 0.0",
                "completion_status": "VARCHAR(30) DEFAULT 'completed'",
                "result_status": "VARCHAR(30) DEFAULT 'result'",
                "rank": "VARCHAR(30)",
                "section_scores": "JSON",
                "question_breakdown": "JSON",
                "skill_breakdown": "JSON",
                "placement_readiness": "JSON",
                "recommendations": "JSON",
                "finalized_at": "DATETIME",
                "scoring_metadata": "JSON DEFAULT '{}'",
            }
            for name, defn in cols.items():
                if name not in existing:
                    connection.execute(text(f'ALTER TABLE "battle_results" ADD COLUMN "{name}" {defn}'))
                    logger.info("Added missing battle_results.%s column", name)

        if "battle_configs" in tables:
            existing = {c["name"] for c in inspector.get_columns("battle_configs")}
            if "job_id" not in existing:
                connection.execute(text('ALTER TABLE "battle_configs" ADD COLUMN "job_id" INTEGER'))
                logger.info("Added missing battle_configs.job_id column")
