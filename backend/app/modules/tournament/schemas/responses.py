from datetime import datetime

from pydantic import BaseModel


class TournamentResponse(BaseModel):
    id: str
    title: str
    description: str
    difficulty: str
    tournament_type: str
    status: str
    max_players: int
    registered_players: int
    registration_end: datetime
    starts_at: datetime
    is_registered: bool