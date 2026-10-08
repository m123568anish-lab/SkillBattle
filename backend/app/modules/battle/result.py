"""
=========================================================

SkillBattle

Battle Result Engine

Calculates overall winner, section-wise performance, skill breakdown,
and Placement Readiness reports derived from empirical battle submissions.

=========================================================
"""

from __future__ import annotations

from typing import Any, List, Dict


class BattleResultEngine:

    def determine_winner(
        self,
        participants: list[Any],
    ):
        if not participants:
            return None

        ranked = sorted(
            participants,
            key=lambda player: (
                -player.score,
                player.joined_at,
            ),
        )
        return ranked[0]

    def is_draw(
        self,
        participants: list[Any],
    ) -> bool:
        if len(participants) < 2:
            return False

        ranked = sorted(
            participants,
            key=lambda player: player.score,
            reverse=True,
        )
        return ranked[0].score == ranked[1].score

    def generate_comprehensive_result(
        self,
        battle_room: Any,
        participants: list[Any],
        submissions: list[Any],
    ) -> Dict[str, Any]:
        """
        Derives section scores, accuracy, skill breakdown, and placement readiness
        from actual empirical submissions.
        """
        winner = self.determine_winner(participants)
        draw = self.is_draw(participants)

        # Calculate total and average scores
        total_score = sum(p.score for p in participants) if participants else 0
        avg_score = round(total_score / len(participants), 2) if participants else 0.0

        # Process Submissions for Accuracy & Skill Breakdown
        total_qs = len(submissions)
        correct_qs = 0
        section_scores: Dict[str, float] = {}
        skill_correct: Dict[str, int] = {}
        skill_total: Dict[str, int] = {}
        question_breakdown: List[Dict[str, Any]] = []

        for sub in submissions:
            is_correct = getattr(sub, "accepted", False) or sub.verdict in ("Accepted", "Correct")
            if is_correct:
                correct_qs += 1

            sec_name = f"Section {getattr(sub, 'section_index', 0) + 1}"
            section_scores[sec_name] = section_scores.get(sec_name, 0.0) + getattr(sub, "score_earned", float(sub.score))

            skill = getattr(sub, "question_type", "coding").upper()
            skill_total[skill] = skill_total.get(skill, 0) + 1
            if is_correct:
                skill_correct[skill] = skill_correct.get(skill, 0) + 1

            question_breakdown.append({
                "submission_id": sub.id,
                "user_id": sub.user_id,
                "question_id": sub.question_id,
                "section_index": sub.section_index,
                "question_type": sub.question_type,
                "verdict": sub.verdict,
                "score_earned": getattr(sub, "score_earned", float(sub.score)),
                "submitted_at": sub.submitted_at.isoformat() if hasattr(sub.submitted_at, "isoformat") else str(sub.submitted_at),
            })

        accuracy = round((correct_qs / total_qs * 100.0), 1) if total_qs > 0 else (100.0 if winner else 0.0)

        knowledge_score = round((correct_qs / total_qs * 100.0), 1) if total_qs > 0 else 0.0

        coding_weight = 0.0
        coding_points = 0.0
        debugging_weight = 0.0
        debugging_points = 0.0
        technical_weight = 0.0
        technical_points = 0.0

        for sub in submissions:
            question_type = str(getattr(sub, "question_type", "")).lower()
            max_points = max(float(getattr(sub, "max_possible_score", 100.0) or 100.0), 1.0)
            earned = float(getattr(sub, "score_earned", 0.0) or 0.0)
            if question_type == "coding":
                coding_weight += max_points
                coding_points += earned
            elif question_type == "debugging":
                debugging_weight += max_points
                debugging_points += earned
            elif question_type == "technical":
                technical_weight += max_points
                technical_points += earned

        coding_score = round((coding_points / coding_weight) * 100.0, 1) if coding_weight else 0.0
        debugging_score = round((debugging_points / debugging_weight) * 100.0, 1) if debugging_weight else 0.0
        technical_score = round((technical_points / technical_weight) * 100.0, 1) if technical_weight else 0.0
        overall_score = round((knowledge_score * 0.6) + (coding_score * 0.4), 2)

        # Build Skill Breakdown
        skill_breakdown = {}
        recommendations = []
        for skill, tot in skill_total.items():
            corr = skill_correct.get(skill, 0)
            ratio = corr / tot
            if ratio >= 0.8:
                status = "Strong"
            elif ratio >= 0.5:
                status = "Good"
            else:
                status = "Needs Practice"
                recommendations.append(f"Review and practice more {skill} questions to boost performance.")

            skill_breakdown[skill] = {
                "status": status,
                "accuracy": f"{round(ratio * 100, 1)}%",
                "total_attempted": tot,
                "correct": corr,
            }

        if not recommendations:
            recommendations.append("Outstanding performance! Keep challenging yourself with hard battle arena problems.")

        # Derive Placement Readiness
        readiness_status = "Ready" if accuracy >= 75 else ("Developing" if accuracy >= 50 else "Needs Practice")
        placement_readiness = {
            "overall_status": readiness_status,
            "accuracy_percentage": accuracy,
            "placement_rating": min(1000 + int(accuracy * 10), 2000),
            "mcq_proficiency": skill_breakdown.get("MCQ", {}).get("status", "N/A"),
            "coding_proficiency": skill_breakdown.get("CODING", {}).get("status", "N/A"),
            "debugging_proficiency": skill_breakdown.get("DEBUGGING", {}).get("status", "N/A"),
            "technical_proficiency": skill_breakdown.get("TECHNICAL", {}).get("status", "N/A"),
        }

        return {
            "winner_id": winner.user_id if winner else None,
            "winner_score": winner.score if winner else 0,
            "is_draw": draw,
            "total_players": len(participants),
            "average_score": avg_score,
            "knowledge_score": knowledge_score,
            "coding_score": coding_score,
            "debugging_score": debugging_score,
            "technical_score": technical_score,
            "overall_score": overall_score,
            "accuracy": accuracy,
            "accuracy_percentage": accuracy,
            "completion_status": "completed" if total_qs > 0 else "pending",
            "result_status": "result",
            "participant_id": (winner.user_id if winner else None),
            "rank": "1" if winner else "PENDING",
            "section_scores": section_scores,
            "question_breakdown": question_breakdown,
            "skill_breakdown": skill_breakdown,
            "placement_readiness": placement_readiness,
            "recommendations": recommendations,
            "scoring_metadata": {
                "knowledge_score": knowledge_score,
                "coding_score": coding_score,
                "debugging_score": debugging_score,
                "technical_score": technical_score,
                "overall_score": overall_score,
                "accuracy": accuracy,
                "score_breakdown": {
                    "knowledge_weight": 0.6,
                    "coding_weight": 0.4,
                },
            },
        }


battle_result_engine = BattleResultEngine()