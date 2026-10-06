from datetime import datetime, timedelta

from app.modules.skill_intelligence.service import SkillIntelligenceService, normalize_skill_id


def _evidence(skill_id: str, correct: bool, difficulty: str = "medium", score: float = 1.0, *, hours_ago: int = 0):
    return {
        "user_id": "u-123",
        "skill_id": normalize_skill_id(skill_id),
        "source_type": "ASSESSMENT",
        "source_id": f"source-{hours_ago}",
        "question_id": f"q-{hours_ago}",
        "difficulty": difficulty,
        "correct": correct,
        "score": float(score),
        "max_score": 1.0,
        "response_time_ms": 2000,
        "timestamp": (datetime.utcnow() - timedelta(hours=hours_ago)).isoformat(),
    }


def test_mastery_and_confidence_are_evidence_based():
    service = SkillIntelligenceService()
    records = [
        _evidence("Arrays", True, difficulty="easy", hours_ago=100),
        _evidence("Arrays", True, difficulty="medium", hours_ago=90),
        _evidence("Arrays", False, difficulty="medium", hours_ago=80),
        _evidence("Arrays", True, difficulty="medium", hours_ago=70),
        _evidence("Arrays", True, difficulty="medium", hours_ago=60),
        _evidence("Arrays", True, difficulty="hard", hours_ago=50),
        _evidence("Arrays", True, difficulty="hard", hours_ago=40),
        _evidence("Arrays", True, difficulty="hard", hours_ago=30),
        _evidence("Arrays", True, difficulty="hard", hours_ago=20),
        _evidence("Arrays", True, difficulty="hard", hours_ago=10),
    ]
    state = service.calculate_skill_state(records)
    assert state["mastery"] in {"COMPETENT", "STRONG"}
    assert state["confidence"] in {"MEDIUM", "HIGH"}
    assert state["evidence_count"] == 10


def test_recent_decline_affects_trend():
    service = SkillIntelligenceService()
    historical = [
        _evidence("SQL", True, difficulty="medium", hours_ago=120),
        _evidence("SQL", True, difficulty="medium", hours_ago=110),
        _evidence("SQL", True, difficulty="medium", hours_ago=100),
        _evidence("SQL", True, difficulty="medium", hours_ago=90),
        _evidence("SQL", True, difficulty="medium", hours_ago=80),
    ]
    recent = [
        _evidence("SQL", False, difficulty="hard", hours_ago=7),
        _evidence("SQL", False, difficulty="hard", hours_ago=6),
        _evidence("SQL", False, difficulty="hard", hours_ago=5),
        _evidence("SQL", False, difficulty="hard", hours_ago=4),
        _evidence("SQL", False, difficulty="hard", hours_ago=3),
    ]
    combined = historical + recent
    state = service.calculate_skill_state(combined)
    assert state["trend"] == "DECLINING"


def test_duplicate_evidence_is_prevented():
    service = SkillIntelligenceService()
    evidence = _evidence("JOIN", True, "medium", 1.0, hours_ago=2)
    first = service.normalize_evidence(evidence)
    second = service.normalize_evidence({**evidence, "source_id": evidence["source_id"], "question_id": evidence["question_id"]})
    assert first["dedupe_key"] == second["dedupe_key"]
    deduped = service.dedupe_records([first, second])
    assert len(deduped) == 1


def test_gap_priority_uses_real_evidence():
    service = SkillIntelligenceService()
    records = [
        _evidence("Graphs", False, difficulty="hard", hours_ago=8),
        _evidence("Graphs", False, difficulty="hard", hours_ago=7),
        _evidence("Graphs", False, difficulty="hard", hours_ago=6),
        _evidence("Graphs", False, difficulty="hard", hours_ago=5),
        _evidence("Graphs", False, difficulty="hard", hours_ago=4),
        _evidence("Graphs", False, difficulty="hard", hours_ago=3),
    ]
    gap = service.calculate_gap(records)
    assert gap["priority"] in {"HIGH", "CRITICAL"}
    assert gap["skill_id"].startswith("dsa")


def test_placement_readiness_explicitly_handles_unknown_skills():
    service = SkillIntelligenceService()
    evidence = {
        "dsa.arrays": [
            _evidence("Arrays", True, "easy", hours_ago=10),
            _evidence("Arrays", True, "medium", hours_ago=8),
            _evidence("Arrays", False, "medium", hours_ago=6),
        ],
        "sql.join": [
            _evidence("JOIN", True, "medium", hours_ago=4),
            _evidence("JOIN", False, "medium", hours_ago=2),
        ],
    }
    readiness = service.calculate_placement_readiness(evidence)
    assert readiness["state"] in {"BUILDING", "DEVELOPING", "NEAR_READY"}
    assert readiness["confidence"] in {"LOW", "MEDIUM", "HIGH"}
    assert "dsa" in readiness["matrix"]
