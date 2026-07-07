from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.modules.xp.schemas import (
    XPResponse,
    AddXPRequest,
)

from app.modules.xp.service import (
    xp_service,
)

from app.models.user import User
from app.core.security import get_current_user


router = APIRouter(
    prefix="/xp",
    tags=["XP"],
)


@router.get(
    "",
    response_model=XPResponse,
)
def get_xp(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return xp_service.get_user_xp(
        db,
        current_user,
    )


@router.post(
    "/add",
    response_model=XPResponse,
)
def add_xp(
    request: AddXPRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return xp_service.add_xp(
        db,
        current_user,
        request.amount,
    )