"""
=========================================================

SkillBattle

Battle Result Engine

=========================================================
"""

from __future__ import annotations

from typing import Any


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


battle_result_engine = BattleResultEngine()