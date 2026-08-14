from fastapi import APIRouter, HTTPException

from app.schemas.mentor import (
    MentorRequest,
    MentorResponse,
)

from app.services.mentor_service import (
    mentor_service,
)

router = APIRouter(
    prefix="/career/mentor",
    tags=["AI Mentor"],
)


@router.post(
    "",
    response_model=MentorResponse,
)
async def ask_ai(
    request: MentorRequest,
):

    try:

        answer = mentor_service.ask(
            question=request.question,
            resume_context="",
        )

        return MentorResponse(
            answer=answer,
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )