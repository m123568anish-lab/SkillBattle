from fastapi import APIRouter

from .schemas import GenerateProblemRequest

from .service import problem_generator_service

router = APIRouter(

    prefix="/problem-generator",

    tags=["AI Problem Generator"],

)


@router.post("/generate")
async def generate_problem(

    request: GenerateProblemRequest,

):

    return await problem_generator_service.generate(

        request.difficulty,

        request.topic,

        request.company,

    )