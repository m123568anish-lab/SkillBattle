from fastapi import APIRouter

from .schemas import BattleCoachRequest

from .service import battle_coach_service

router = APIRouter(

    prefix="/battle-coach",

    tags=["AI Battle Coach"],

)


@router.post("/analyze")
async def analyze(

    request: BattleCoachRequest,

):

    return await battle_coach_service.analyze(

        request,

    )