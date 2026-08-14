from dataclasses import dataclass
from datetime import datetime


@dataclass(slots=True)
class Match:

    id: str

    player_one: str

    player_two: str

    mode: str

    created_at: datetime

    room_id: str