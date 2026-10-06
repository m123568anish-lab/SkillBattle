from __future__ import annotations

from copy import deepcopy
from typing import Any

from app.modules.skill_intelligence.service import CANONICAL_SKILL_TREE


MAP_ID = "placement-journey"


def _level(
    level_id: str,
    sequence: int,
    title: str,
    description: str,
    level_type: str,
    skill: str,
    prerequisites: list[str],
    question_type: str,
    difficulty: str = "easy",
    question_count: int = 1,
    *,
    milestone: bool = False,
) -> dict[str, Any]:
    section = {
        "title": title,
        "question_type": question_type,
        "skill_category": skill,
        "question_count": question_count,
        "weight": 1.0,
        "duration_minutes": 12,
        "negative_marking": False,
    }
    return {
        "id": level_id,
        "map_id": MAP_ID,
        "sequence": sequence,
        "title": title,
        "description": description,
        "level_type": level_type,
        "skill_category": skill,
        "battle_configuration": {
            "battle_type": "practice",
            "difficulty": difficulty,
            "duration_minutes": 12,
            "sections": [section],
        },
        "prerequisite_level_ids": prerequisites,
        "reward_configuration": {"xp_source": "canonical_battle_result"},
        "is_milestone": milestone,
        "is_active": True,
    }


LEVEL_CATALOG = [
    _level("arrays-foundation", 1, "Array Foundations", "Build reliable array reasoning from validated battle questions.", "FOUNDATION", "Arrays", [], "mcq"),
    _level("strings-practice", 2, "String Patterns", "Practice canonical string concepts and pattern recognition.", "PRACTICE", "Strings", ["arrays-foundation"], "mcq"),
    _level("hashing-skill", 3, "Hashing and Lookup", "Develop evidence in hashing and fast lookup strategies.", "SKILL", "Hashing", ["strings-practice"], "mcq", difficulty="medium"),
    _level("linked-list-skill", 4, "Linked List Control", "Strengthen pointer and linked-list fundamentals.", "SKILL", "Linked Lists", ["strings-practice"], "mcq", difficulty="medium"),
    _level("sql-select-skill", 5, "SQL Selection", "Build query fundamentals using the canonical SQL skill taxonomy.", "SKILL", "SELECT", ["arrays-foundation"], "mcq"),
    _level("sql-join-skill", 6, "Relational Joins", "Practice join reasoning before progressing to placement queries.", "SKILL", "JOIN", ["sql-select-skill"], "mcq", difficulty="medium"),
    _level("debugging-speed", 7, "Debugging Precision", "Identify and correct defects using validated debugging questions.", "DEBUGGING", "Debugging", ["hashing-skill", "linked-list-skill"], "debugging", difficulty="medium"),
    _level("dsa-boss", 8, "DSA Boss Battle", "A milestone battle across the DSA skills you have trained.", "BOSS_BATTLE", "Arrays", ["hashing-skill", "linked-list-skill"], "mcq", difficulty="hard", question_count=2, milestone=True),
    _level("placement-checkpoint", 9, "Placement Checkpoint", "Apply your battle evidence in a placement-oriented SQL challenge.", "PLACEMENT_TEST", "JOIN", ["sql-join-skill", "debugging-speed", "dsa-boss"], "mcq", difficulty="hard", milestone=True),
]


def get_level_catalog() -> list[dict[str, Any]]:
    valid_skills = {skill for skills in CANONICAL_SKILL_TREE.values() for skill in skills}
    levels = deepcopy(LEVEL_CATALOG)
    invalid = sorted({level["skill_category"] for level in levels if level["skill_category"] not in valid_skills})
    if invalid:
        raise ValueError(f"Quest Map skills are not in the canonical taxonomy: {', '.join(invalid)}")
    return levels