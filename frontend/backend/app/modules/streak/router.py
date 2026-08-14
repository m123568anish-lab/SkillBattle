from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

from app.database.database import get_db

from app.core.security import get_current_user
from app.models.user import User

from app.modules.streak.schemas import (
    StreakResponse,
)

from app.modules.streak.service import (
    streak_service,
)

router = APIRouter(
    prefix="/streak",
    tags=["Streak"],
)


@router.get(
    "",
    response_model=StreakResponse,
)
def get_streak(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return streak_service.get_streak(
        db,
        current_user,
    )


@router.post(
    "/update",
    response_model=StreakResponse,
)
def update_streak(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return streak_service.update_streak(
        db,
        current_user,
    )