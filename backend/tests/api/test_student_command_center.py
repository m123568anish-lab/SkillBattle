from app.modules.student_command_center.service import StudentCommandCenterService


service = StudentCommandCenterService()


def test_command_center_uses_real_skill_intelligence_and_priority():
    skill_profile = {
        "skills": [
            {"skill_id": "dsa.graphs", "skill_name": "Graphs", "mastery": "DEVELOPING", "confidence": "MEDIUM", "score": 54.0, "evidence_count": 12},
            {"skill_id": "sql.join", "skill_name": "JOIN", "mastery": "LEARNING", "confidence": "MEDIUM", "score": 42.0, "evidence_count": 8},
            {"skill_id": "oop", "skill_name": "OOP", "mastery": "STRONG", "confidence": "HIGH", "score": 82.0, "evidence_count": 9},
        ],
        "gaps": [
            {"skill_id": "sql.join", "skill_name": "JOIN", "mastery": "LEARNING", "confidence": "MEDIUM", "trend": "DECLINING", "priority": "HIGH", "reason": "JOIN accuracy is low across recent attempts."},
            {"skill_id": "dsa.graphs", "skill_name": "Graphs", "mastery": "DEVELOPING", "confidence": "MEDIUM", "trend": "STABLE", "priority": "MEDIUM", "reason": "Graphs still needs more consistent confidence."},
        ],
        "placement_readiness": {
            "state": "DEVELOPING",
            "confidence": "MEDIUM",
            "matrix": {"dsa": {"mastery": "DEVELOPING"}, "sql": {"mastery": "LEARNING"}},
        },
        "next_best_action": {
            "skill_id": "sql.join",
            "skill_name": "JOIN",
            "action": "PRACTICE_SKILL",
            "reason": "JOIN accuracy is low across recent attempts.",
        },
    }

    state = service.build_command_center(
        skill_profile=skill_profile,
        xp=420,
        streak=5,
        target_company="Google",
        study_hours=90,
        roadmap={"title": "SDE Roadmap", "progress": 32, "milestone": "SQL"},
    )

    assert state["next_best_action"]["title"] == "Practice SQL JOINs"
    assert state["next_best_action"]["why"].startswith("JOIN accuracy")
    assert state["placement_readiness"]["state"] == "DEVELOPING"
    assert state["daily_actions"][0]["type"] == "PRACTICE"
    assert "JOIN" in state["daily_actions"][0]["title"]
    assert state["student_state"]["target_company"] == "Google"
    assert state["roadmap"]["progress"] == 32


def test_daily_plan_respects_study_hours_and_setup_state():
    skill_profile = {
        "skills": [
            {"skill_id": "dsa.arrays", "skill_name": "Arrays", "mastery": "STRONG", "confidence": "HIGH", "score": 80.0, "evidence_count": 10},
            {"skill_id": "sql.join", "skill_name": "JOIN", "mastery": "LEARNING", "confidence": "MEDIUM", "score": 45.0, "evidence_count": 8},
        ],
        "gaps": [
            {"skill_id": "sql.join", "skill_name": "JOIN", "mastery": "LEARNING", "confidence": "MEDIUM", "trend": "DECLINING", "priority": "HIGH", "reason": "JOIN accuracy is low across recent attempts."},
        ],
        "placement_readiness": {"state": "BUILDING", "confidence": "LOW", "matrix": {}},
        "next_best_action": {"skill_id": "sql.join", "skill_name": "JOIN", "action": "PRACTICE_SKILL", "reason": "JOIN accuracy is low across recent attempts."},
    }

    state = service.build_command_center(skill_profile=skill_profile, xp=0, streak=0, target_company="", study_hours=None)

    assert state["study_hours"]["configured"] is False
    assert state["daily_actions"][0]["type"] == "SETUP"
    assert "study time" in state["daily_actions"][0]["title"].lower()
