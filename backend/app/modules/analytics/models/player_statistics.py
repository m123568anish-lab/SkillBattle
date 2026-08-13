from dataclasses import dataclass


@dataclass(slots=True)
class PlayerStatistics:

    total_battles: int = 0

    wins: int = 0

    losses: int = 0

    draws: int = 0

    solved_problems: int = 0

    current_rating: int = 1200

    highest_rating: int = 1200

    current_streak: int = 0

    longest_streak: int = 0