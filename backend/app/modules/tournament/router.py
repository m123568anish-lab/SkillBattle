from fastapi import APIRouter

from app.modules.tournament.schemas.requests import (
    CreateTournamentRequest,
)

from app.modules.tournament.services.tournament_service import (
    tournament_service,
)

router = APIRouter(

    prefix="/tournaments",

    tags=["Tournaments"],

)


@router.post("/")

def create_tournament(

    request: CreateTournamentRequest,

):

    return tournament_service.create(

        request,

    )