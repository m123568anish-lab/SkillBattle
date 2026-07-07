from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User

from app.api.auth.dependency import get_current_user

from app.modules.interview.schemas import (
    StartInterviewRequest,
    SubmitAnswerRequest,
)

from app.modules.interview.service import (
    interview_service,
)

router = APIRouter(
    prefix="/interview",
    tags=["Interview"],
)


@router.get("/health")
async def health() -> dict[str, str]:
    return {"module": "interview", "status": "healthy"}


@router.post("/start")
def start_interview(
    request: StartInterviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return interview_service.start_interview(
        db,
        current_user,
        request,
    )


@router.get("/active")
def active_interview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return interview_service.get_active_interview(
        db,
        current_user,
    )


@router.get("/next")
def next_question(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return interview_service.get_next_question(
        db,
        current_user,
    )


@router.post("/answer")
def submit_answer(
    request: SubmitAnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return interview_service.submit_answer(
        db,
        current_user,
        request.question_id,
        request.answer,
    )


@router.post("/finish")
def finish_interview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return interview_service.finish_interview(
        db,
        current_user,
    )


@router.get("/history")
def history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return interview_service.get_history(
        db,
        current_user,
    )


@router.get("/report/{session_id}")
def report(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return interview_service.get_report(
        db,
        session_id,
    )