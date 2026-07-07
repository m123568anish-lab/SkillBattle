from pydantic import BaseModel


class TournamentResponse(BaseModel):

    id: str

    name: str

    tournament_type: str

    started: bool

    finished: bool