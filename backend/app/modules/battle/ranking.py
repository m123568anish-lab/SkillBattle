"""
=========================================================

SkillBattle

Battle Ranking

=========================================================
"""

from __future__ import annotations


def rank_players(players):

    ranked = sorted(

        players,

        key=lambda p: (

            -p.score,

            p.joined_at,

        ),

    )

    for index, player in enumerate(

        ranked,

        start=1,

    ):

        player.rank = index

    return ranked