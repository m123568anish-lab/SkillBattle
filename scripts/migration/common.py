"""
====================================================================
Qubira — Supabase Migration Tooling: Shared Utilities & Configuration
====================================================================
Phase 2: Migration Tooling, Topological Order, Logging & Safety
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

from alembic.config import Config
from alembic.script import ScriptDirectory

# Base repository root directory
REPO_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = REPO_ROOT / "backend"
DEFAULT_SQLITE_PATH = REPO_ROOT / "skillbattle.db"
DEFAULT_BACKUP_DIR = REPO_ROOT / "backups" / "sqlite"
CHECKPOINT_FILE = REPO_ROOT / "scripts" / "migration" / ".migration_checkpoint.json"

# Configure clean, security-conscious logging
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("qubira_migration")

# Add backend directory to sys.path so app models can be loaded seamlessly
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Strictly validated 78-table topological migration order (from Phase 1 DAG audit)
TOPOLOGICAL_MIGRATION_ORDER: List[str] = [
    # Tier 1: Independent Root Entities
    "streak",
    "placement_companies",
    "tournaments",
    "questions",
    "quest_map_levels",
    "alembic_version",
    "conversations",
    "users",
    "daily_challenges",
    "problems",
    "api_request_logs",
    "unified_assessments",
    # Tier 2: Primary Children of Users & Independent Tables
    "placement_tracks",
    "tournament_matches",
    "messages",
    "achievements",
    "audit_logs",
    "campaign_attempts",
    "candidate_privacy_settings",
    "colleges",
    "companies",
    "developer_api_keys",
    "friendships",
    "interview_sessions",
    "interviews",
    "matchmaking_matches",
    "notifications",
    "password_reset_tokens",
    "placement_prep_sessions",
    "profiles",
    "question_exposures",
    "refresh_tokens",
    "resumes",
    "roadmaps",
    "skill_evidence",
    "student_skill_profiles",
    "tournament_participants",
    "user_campaign_progress",
    "user_daily_activities",
    "user_settings",
    "user_skill_stats",
    "user_stats",
    "user_submissions",
    "xp",
    "xp_ledger",
    "code_submissions",
    "problem_starter_codes",
    "problem_tags",
    "problem_test_cases",
    "test_cases",
    "assessment_attempts",
    "placement_track_rounds",
    # Tier 3: College, Company & Learning Track Sub-Hierarchies
    "departments",
    "company_members",
    "company_skill_requirements",
    "job_postings",
    "developer_api_usages",
    "interview_questions",
    "roadmap_weeks",
    "daily_practice_sessions",
    "assessment_question_submissions",
    # Tier 4: Granular Operational Records
    "batches",
    "battle_configs",
    "saved_opportunities",
    "interview_answers",
    "roadmap_tasks",
    # Tier 5: Institutional & Arena State Machines
    "college_assessments",
    "college_students",
    "battle_rooms",
    # Tier 6: Submissions & Participants
    "college_assessment_questions",
    "college_assessment_submissions",
    "battle_participants",
    "candidate_applications",
    "quest_progress",
    # Tier 7: Battle Results & Workflow Histories
    "battle_results",
    "battle_submissions",
    "application_status_history",
    "company_interviews",
]

# 44 Tables that use auto-incrementing integer IDs requiring sequence synchronization
SERIAL_SEQUENCE_TABLES: Set[str] = {
    "streak", "questions", "daily_challenges", "problems",
    "achievements", "campaign_attempts", "candidate_privacy_settings",
    "colleges", "companies", "friendships", "interview_sessions",
    "profiles", "question_exposures", "roadmaps", "user_campaign_progress",
    "user_daily_activities", "user_settings", "user_skill_stats",
    "user_stats", "user_submissions", "xp", "xp_ledger",
    "code_submissions", "problem_starter_codes", "problem_tags",
    "problem_test_cases", "test_cases", "departments", "company_members",
    "job_postings", "interview_questions", "roadmap_weeks",
    "daily_practice_sessions", "batches", "saved_opportunities",
    "interview_answers", "roadmap_tasks", "college_assessments",
    "college_students", "college_assessment_questions",
    "college_assessment_submissions", "candidate_applications",
    "application_status_history", "company_interviews",
}


def compute_sha256(filepath: Path) -> str:
    """Compute SHA-256 hash of a file safely in 64KB chunks."""
    sha256 = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            sha256.update(chunk)
    return sha256.hexdigest()


def get_sqlite_ro_uri(path: Optional[Path] = None) -> str:
    """Return strict read-only SQLite URI."""
    target = path or DEFAULT_SQLITE_PATH
    return f"file:{target.resolve().as_posix()}?mode=ro"


def get_repo_alembic_head(alembic_dir: Optional[Path] = None) -> str:
    """Resolve the repository's canonical Alembic head directly from the checked-in graph."""
    target_dir = alembic_dir or (BACKEND_DIR / "alembic")
    alembic_ini = target_dir.parent / "alembic.ini"
    script = ScriptDirectory.from_config(Config(str(alembic_ini)))
    heads = script.get_heads()
    if len(heads) != 1:
        raise RuntimeError(
            f"Alembic graph does not resolve to a single head. Heads detected: {heads}. Refusing deployment."
        )
    return heads[0]


class MigrationCheckpoint:
    """Manages resumable migration checkpoints."""

    def __init__(self, checkpoint_path: Path = CHECKPOINT_FILE):
        self.path = checkpoint_path
        self.data: Dict[str, Any] = self._load()

    def _load(self) -> Dict[str, Any]:
        if self.path.exists():
            try:
                with open(self.path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.warning("Could not read checkpoint file: %s. Starting fresh.", e)
        return {
            "started_at": datetime.utcnow().isoformat(),
            "completed_tables": {},
            "failed_tables": {},
            "sequences_synced": [],
            "identity_mapped": False,
            "status": "in_progress",
        }

    def save(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.data["last_updated_at"] = datetime.utcnow().isoformat()
        with open(self.path, "w", encoding="utf-8") as f:
            json.dump(self.data, f, indent=2)

    def record_success(self, table: str, row_count: int) -> None:
        self.data["completed_tables"][table] = {
            "rows": row_count,
            "migrated_at": datetime.utcnow().isoformat(),
        }
        self.data["failed_tables"].pop(table, None)
        self.save()

    def record_failure(self, table: str, error: str) -> None:
        self.data["failed_tables"][table] = {
            "error": error,
            "failed_at": datetime.utcnow().isoformat(),
        }
        self.save()

    def is_completed(self, table: str) -> bool:
        return table in self.data.get("completed_tables", {})


def sanitize_value(val: Any, col_type: str) -> Any:
    """Convert SQLite column values to PostgreSQL compatible representations."""
    if val is None:
        return None

    type_upper = col_type.upper()

    # Booleans: SQLite stores 0/1; Postgres requires True/False
    if "BOOL" in type_upper:
        if isinstance(val, (int, float)):
            return bool(val)
        if isinstance(val, str):
            return val.lower() in ("1", "true", "t", "yes")
        return bool(val)

    # JSON / JSONB: Ensure valid JSON serialization
    if "JSON" in type_upper:
        if isinstance(val, (dict, list)):
            return json.dumps(val)
        if isinstance(val, str):
            try:
                # Test validity
                json.loads(val)
                return val
            except Exception:
                return json.dumps(val)

    # Date / Timestamp: string normalization
    if any(k in type_upper for k in ("DATETIME", "TIMESTAMP", "DATE")):
        if isinstance(val, str):
            # Normal SQLite datetime format: 'YYYY-MM-DD HH:MM:SS.ffffff' or 'YYYY-MM-DD'
            return val.replace(" ", "T") if " " in val and "T" not in val else val

    return val
