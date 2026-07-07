from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.modules.roadmap.schemas import GenerateRoadmapRequest
from app.modules.roadmap.service import roadmap_service

router = APIRouter(prefix="/roadmap", tags=["Roadmap"])


@router.post("/generate")
def generate(
    request: GenerateRoadmapRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    roadmap = roadmap_service.generate(db, current_user, request.duration_weeks)
    return {
        "success": True,
        "roadmap_id": roadmap.id,
        "message": "Roadmap generated successfully.",
    }


@router.post("/task/{task_id}/complete")
def complete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return roadmap_service.complete_task(db, current_user, task_id)