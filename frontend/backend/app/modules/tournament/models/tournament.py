from dataclasses import dataclass, field
from datetime import datetime


@dataclass(slots=True)
class Tournament:

    id: str

    name: str

    tournament_type: str

    max_players: int

    created_at: datetime = field(
        default_factory=datetime.utcnow
    )

    started: bool = False

    finished: bool = False