from __future__ import annotations

from collections import defaultdict
from typing import Any


class BattleScoringService:
    """Canonical server-authoritative battle scoring service for solo battle outcomes."""

    def compute_result_metrics(self, battle: Any, submissions: list[Any], participant_id: str | None = None) -> dict[str, Any]:
        total_questions = 0
        answered_questions = 0
        correct_answers = 0
        incorrect_answers = 0
        unanswered_questions = 0

        if battle and getattr(battle, "questions_data", None):
            for section in battle.questions_data:
                for question in section.get("questions", []):
                    total_questions += 1

        for submission in submissions or []:
            submission_user_id = getattr(submission, "user_id", None)
            if participant_id is not None and submission_user_id not in (None, participant_id):
                continue
            if getattr(submission, "question_id", None) is None:
                continue
            answered_questions += 1
            verdict = str(getattr(submission, "verdict", "")).lower()
            if verdict in {"correct", "accepted"}:
                correct_answers += 1
            elif verdict in {"incorrect", "rejected"}:
                incorrect_answers += 1
            elif verdict in {"pending", "evaluating", "queued", "running", "submitted"}:
                continue
            else:
                # Any non-judged answer still counts as an attempted answer, not a missing one.
                continue

        if total_questions > 0:
            unanswered_questions = max(0, total_questions - answered_questions)

        if answered_questions > 0:
            accuracy = (correct_answers / answered_questions) * 100.0
        else:
            accuracy = 0.0

        knowledge_score = 0.0
        coding_score = 0.0
        if total_questions > 0:
            knowledge_score = round((correct_answers / total_questions) * 100.0, 2)

        coding_submissions = []
        for sub in submissions or []:
            submission_user_id = getattr(sub, "user_id", None)
            if participant_id is not None and submission_user_id not in (None, participant_id):
                continue
            if getattr(sub, "question_type", "").lower() in {"coding", "debugging"}:
                coding_submissions.append(sub)
        if coding_submissions:
            coding_points = 0.0
            total_weight = 0.0
            for sub in coding_submissions:
                max_points = max(float(getattr(sub, "max_possible_score", 100.0) or 100.0), 1.0)
                total_weight += max_points
                coding_points += float(getattr(sub, "score_earned", 0.0) or 0.0)
            coding_score = round((coding_points / total_weight) * 100.0 if total_weight else 0.0, 2)

        overall_score = round((knowledge_score * 0.6) + (coding_score * 0.4), 2)

        completion_status = "completed" if total_questions > 0 and unanswered_questions == 0 else "partial"
        if total_questions and answered_questions == total_questions and any(
            str(getattr(sub, "verdict", "")).lower() in {"pending", "evaluating", "queued", "running", "submitted"}
            for sub in submissions or []
        ):
            completion_status = "evaluating"
        if not submissions:
            completion_status = "pending"

        return {
            "total_questions": total_questions,
            "answered_questions": answered_questions,
            "correct_answers": correct_answers,
            "incorrect_answers": incorrect_answers,
            "unanswered_questions": unanswered_questions,
            "accuracy": round(accuracy, 2),
            "knowledge_score": round(knowledge_score, 2),
            "coding_score": round(coding_score, 2),
            "overall_score": round(overall_score, 2),
            "completion_status": completion_status,
            "result_status": "result",
            "participant_id": participant_id,
            "battle_state": getattr(battle, "status", "result"),
            "score_breakdown": {
                "knowledge_weight": 0.6,
                "coding_weight": 0.4,
            },
            "rank": "PENDING",
        }


battle_scoring_service = BattleScoringService()
