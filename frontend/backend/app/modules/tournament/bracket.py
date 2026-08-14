"""
=========================================================

SkillBattle

Tournament Bracket Generator

Production Version

=========================================================
"""

from __future__ import annotations

import random
from math import ceil


class TournamentBracket:

    """
    Generates tournament brackets.
    """

    # =====================================================
    # Single Elimination
    # =====================================================

    def single_elimination(
        self,
        participants: list,
        shuffle: bool = True,
    ):

        players = participants.copy()

        if shuffle:
            random.shuffle(players)

        matches = []

        round_number = 1

        while len(players) >= 2:

            round_matches = []

            for i in range(0, len(players), 2):

                if i + 1 >= len(players):

                    round_matches.append(
                        {
                            "player_one": players[i],
                            "player_two": None,
                            "winner": players[i],
                            "bye": True,
                        }
                    )

                    continue

                round_matches.append(
                    {
                        "player_one": players[i],
                        "player_two": players[i + 1],
                        "winner": None,
                        "bye": False,
                    }
                )

            matches.append(
                {
                    "round": round_number,
                    "matches": round_matches,
                }
            )

            # Placeholder for next round
            players = [None] * ceil(len(players) / 2)

            round_number += 1

        return matches

    # =====================================================
    # Number of Rounds
    # =====================================================

    def rounds_required(
        self,
        total_players: int,
    ) -> int:

        rounds = 0

        players = 1

        while players < total_players:

            players *= 2

            rounds += 1

        return rounds


tournament_bracket = TournamentBracket()