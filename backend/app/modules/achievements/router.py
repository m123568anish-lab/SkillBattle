from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.user import User

from app.core.security import get_current_user
from app.modules.achievements.service import (
    achievement_service,
)

router = APIRouter(
    prefix="/achievements",
    tags=["Achievements"],
)


@router.get("")
def get_achievements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return achievement_service.get_user_achievements(
        db,
        current_user,
    )