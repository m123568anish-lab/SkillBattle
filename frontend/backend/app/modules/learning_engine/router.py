from fastapi import APIRouter

from .schemas import LearningEngineRequest
from .service import learning_engine_service

router = APIRouter(
    prefix="/learning-engine",
    tags=["AI Learning Engine"],
)


@router.post("/generate")
async def generate_learning_plan(
    request: LearningEngineRequest,
):

    return await learning_engine_service.generate_plan(
        request,
    )