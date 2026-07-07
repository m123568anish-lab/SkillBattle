from pydantic import BaseModel


class CreateTournamentRequest(BaseModel):

    name: str

    tournament_type: str

    max_players: int