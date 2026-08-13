"""
=========================================================

SkillBattle

Battle Score Manager

=========================================================
"""

from __future__ import annotations


class BattleScoreManager:

    def calculate_score(
        self,
        verdict: str,
        runtime: int,
        memory: int,
    ) -> int:

        if verdict != "Accepted":

            return 0

        score = 100

        # Faster solutions receive bonus
        if runtime < 500:
            score += 25

        elif runtime < 1000:
            score += 10

        # Lower memory usage bonus
        if memory < 64:
            score += 10

        return score


battle_score_manager = BattleScoreManager()