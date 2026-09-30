"""
=========================================================
SkillBattle V3 — Centralized Scoring & Evaluation Engine
=========================================================
"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Tuple

logger = logging.getLogger(__name__)


class CentralizedScoringEngine:

    @staticmethod
    def evaluate_mcq(
        submitted_choice: str,
        correct_option: str,
        max_marks: float = 10.0,
        negative_marks: float = 0.0,
    ) -> Tuple[float, bool, str]:
        """Evaluate single-choice MCQ."""
        sub = (submitted_choice or "").strip().lower()
        corr = (correct_option or "").strip().lower()

        if not sub:
            return 0.0, False, "No answer provided"

        if sub == corr:
            return max_marks, True, "Correct"
        else:
            deduction = abs(negative_marks)
            return -deduction, False, f"Incorrect. Correct answer is {correct_option}"

    @staticmethod
    def evaluate_multiple_select(
        submitted_choices: List[str],
        correct_options: List[str],
        max_marks: float = 10.0,
        negative_marks: float = 0.0,
    ) -> Tuple[float, bool, str]:
        """Evaluate multiple-selection question with partial credit."""
        sub_set = set([str(c).strip().lower() for c in submitted_choices if c])
        corr_set = set([str(c).strip().lower() for c in correct_options if c])

        if not sub_set:
            return 0.0, False, "No choices selected"

        if sub_set == corr_set:
            return max_marks, True, "All correct options selected"

        # Check for wrong choices
        wrong_choices = sub_set - corr_set
        if wrong_choices:
            return -abs(negative_marks), False, "Incorrect choices selected"

        # Partial credit for subset of correct choices
        correct_matches = sub_set.intersection(corr_set)
        if correct_matches and corr_set:
            partial_ratio = len(correct_matches) / len(corr_set)
            earned = round(max_marks * partial_ratio, 2)
            return earned, False, f"Partially correct ({len(correct_matches)}/{len(corr_set)} selected)"

        return 0.0, False, "Incorrect"

    @staticmethod
    def evaluate_coding_test_cases(
        passed_count: int,
        total_count: int,
        max_marks: float = 10.0,
        execution_status: str = "ACCEPTED",
    ) -> Tuple[float, bool, str]:
        """Evaluate coding submission test cases."""
        if total_count <= 0:
            if execution_status == "ACCEPTED":
                return max_marks, True, "Execution accepted"
            return 0.0, False, f"Execution status: {execution_status}"

        ratio = min(1.0, max(0.0, passed_count / total_count))
        score = round(max_marks * ratio, 2)
        is_fully_solved = (passed_count == total_count) and (execution_status == "ACCEPTED")

        msg = f"Passed {passed_count}/{total_count} test cases ({int(ratio * 100)}%)"
        if execution_status != "ACCEPTED" and passed_count < total_count:
            msg += f" [{execution_status}]"

        return score, is_fully_solved, msg

    @staticmethod
    def compute_assessment_total(
        question_submissions: List[Dict[str, Any]],
        sections: List[Dict[str, Any]],
        scoring_rules: Dict[str, Any],
        passing_score_percentage: float = 60.0,
    ) -> Dict[str, Any]:
        """Compute aggregated assessment score, section breakdown, and pass/fail result."""
        total_awarded = 0.0
        total_possible = 0.0
        section_breakdown = {}

        for sub in question_submissions:
            q_type = (sub.get("question_type") or "CODING").upper()
            score = float(sub.get("score_awarded", 0.0))
            max_s = float(sub.get("max_score", 10.0))

            total_awarded += score
            total_possible += max_s

            sec_name = sub.get("section_name", "General")
            if sec_name not in section_breakdown:
                section_breakdown[sec_name] = {"awarded": 0.0, "possible": 0.0, "questions": 0}
            
            section_breakdown[sec_name]["awarded"] += score
            section_breakdown[sec_name]["possible"] += max_s
            section_breakdown[sec_name]["questions"] += 1

        percentage = round((total_awarded / total_possible * 100), 2) if total_possible > 0 else 0.0
        is_passed = percentage >= passing_score_percentage

        return {
            "total_score": round(total_awarded, 2),
            "max_possible_score": round(total_possible, 2),
            "percentage": percentage,
            "is_passed": is_passed,
            "section_breakdown": section_breakdown,
        }


scoring_engine = CentralizedScoringEngine()
