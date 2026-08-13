from dataclasses import dataclass


@dataclass(slots=True)
class TournamentMatch:

    id: str

    round_number: int

    player_one: str

    player_two: str

    winner: str | None = None

    battle_room_id: str | None = None