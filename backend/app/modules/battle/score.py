"""
=========================================================

SkillBattle

Battle Score Manager

Configurable scoring engine supporting MCQ, Coding, Debugging,
and Technical question evaluations with weighted sections and negative marking.

=========================================================
"""

from __future__ import annotations

from typing import Dict, Any


class BattleScoreManager:

    def calculate_mcq_score(
        self,
        student_option: str | None,
        correct_option: str,
        points: float = 10.0,
        negative_penalty: float = 2.5,
        negative_marking: bool = False,
    ) -> float:
        if not student_option:
            return 0.0

        if str(student_option).strip().upper() == str(correct_option).strip().upper():
            return points

        if negative_marking and negative_penalty > 0:
            return -abs(negative_penalty)

        return 0.0

    def calculate_coding_score(
        self,
        verdict: str,
        passed_tests: int,
        total_tests: int,
        runtime_ms: float = 0.0,
        memory_mb: float = 0.0,
        max_points: float = 50.0,
    ) -> float:
        if total_tests <= 0:
            total_tests = 1

        ratio = min(max(passed_tests / total_tests, 0.0), 1.0)
        base_score = ratio * max_points

        # Speed bonus for full pass
        if verdict in ("Accepted", "Correct") and ratio >= 1.0:
            if runtime_ms > 0 and runtime_ms < 500:
                base_score += max_points * 0.1
            if memory_mb > 0 and memory_mb < 64:
                base_score += max_points * 0.05

        return round(base_score, 2)

    def calculate_debugging_score(
        self,
        verdict: str,
        passed_tests: int,
        total_tests: int,
        max_points: float = 25.0,
    ) -> float:
        if total_tests <= 0:
            total_tests = 1
        ratio = min(max(passed_tests / total_tests, 0.0), 1.0)
        return round(ratio * max_points, 2)

    def calculate_technical_score(
        self,
        student_response: str | None,
        rubric: Dict[str, Any],
        max_points: float = 15.0,
    ) -> float:
        if not student_response or len(student_response.strip()) < 10:
            return 0.0

        resp = student_response.lower()
        key_concepts = rubric.get("key_concepts", [])
        if not key_concepts:
            return round(max_points * 0.8, 2)

        matched = sum(1 for concept in key_concepts if str(concept).lower() in resp)
        ratio = matched / len(key_concepts)
        return round(max(ratio, 0.5) * max_points, 2)

    def calculate_legacy_score(
        self,
        verdict: str,
        runtime: int,
        memory: int,
    ) -> int:
        if verdict != "Accepted":
            return 0
        score = 100
        if runtime < 500:
            score += 25
        elif runtime < 1000:
            score += 10
        if memory < 64:
            score += 10
        return score


battle_score_manager = BattleScoreManager()