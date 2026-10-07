from types import SimpleNamespace

from app.models.battle.battle_submission import BattleSubmission
from app.modules.battle.scoring import BattleScoringService


def test_battle_scoring_service_computes_authoritative_result_metrics():
    service = BattleScoringService()

    battle = SimpleNamespace(
        questions_data=[
            {"questions": [{"id": 1}, {"id": 2}, {"id": 3}]},
            {"questions": [{"id": 4}, {"id": 5}]},
        ],
        sections_config=[
            {"question_type": "mcq", "weight": 0.6},
            {"question_type": "coding", "weight": 0.4},
        ],
        battle_type="solo",
        battle_mode="solo",
    )

    submissions = [
        BattleSubmission(
            question_id=1,
            question_type="mcq",
            verdict="Correct",
            score_earned=10,
            passed_tests=1,
            total_tests=1,
            runtime_ms=120,
            memory_mb=32,
            time_taken_seconds=10,
        ),
        BattleSubmission(
            question_id=2,
            question_type="mcq",
            verdict="Incorrect",
            score_earned=0,
            passed_tests=0,
            total_tests=1,
            runtime_ms=0,
            memory_mb=0,
            time_taken_seconds=8,
        ),
        BattleSubmission(
            question_id=3,
            question_type="mcq",
            verdict="Pending",
            score_earned=0,
            passed_tests=0,
            total_tests=1,
            runtime_ms=0,
            memory_mb=0,
            time_taken_seconds=15,
        ),
        BattleSubmission(
            question_id=4,
            question_type="coding",
            verdict="Accepted",
            score_earned=48,
            passed_tests=2,
            total_tests=2,
            runtime_ms=220,
            memory_mb=12,
            time_taken_seconds=24,
        ),
        BattleSubmission(
            question_id=5,
            question_type="coding",
            verdict="Rejected",
            score_earned=12,
            passed_tests=1,
            total_tests=2,
            runtime_ms=300,
            memory_mb=16,
            time_taken_seconds=19,
        ),
    ]

    metrics = service.compute_result_metrics(battle, submissions, participant_id="p-1")

    assert metrics["total_questions"] == 5
    assert metrics["answered_questions"] == 5
    assert metrics["correct_answers"] == 2
    assert metrics["incorrect_answers"] == 2
    assert metrics["unanswered_questions"] == 0
    assert metrics["knowledge_score"] > 0
    assert metrics["coding_score"] > 0
    assert metrics["overall_score"] > 0
    assert metrics["accuracy"] >= 0
    assert metrics["completion_status"] in {"completed", "partial", "evaluating"}
    assert metrics["result_status"] == "result"
