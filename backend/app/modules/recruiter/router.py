from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

from app.database.database import get_db

from .schemas import RecruiterReportRequest
from .service import recruiter_service

router = APIRouter(
    prefix="/recruiter",
    tags=["AI Recruiter"],
)


@router.get("/health")
async def health() -> dict[str, str]:
    return {"module": "recruiter", "status": "healthy"}


@router.post("/report")
async def generate_report(
    request: RecruiterReportRequest,
    db: Session = Depends(get_db),
):

    return await recruiter_service.generate_report(
        db,
        request.user_id,
    )