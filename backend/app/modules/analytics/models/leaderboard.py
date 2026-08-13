from dataclasses import dataclass


@dataclass(slots=True)
class LeaderboardEntry:

    user_id: str

    username: str

    rating: int

    rank: int

    wins: int

    losses: int

    solved: int