from fastapi import APIRouter

from .schemas import PlagiarismRequest

from .service import anti_cheat_service

router = APIRouter(

    prefix="/anti-cheat",

    tags=["AI Anti Cheat"],

)


@router.post("/detect")
async def detect(

    request: PlagiarismRequest,

):

    return await anti_cheat_service.detect(

        request,

    )