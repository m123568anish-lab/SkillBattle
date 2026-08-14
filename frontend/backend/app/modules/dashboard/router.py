"""
=========================================================

SkillBattle

Dashboard Router

=========================================================
"""

from fastapi import APIRouter
from fastapi import Depends

from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db

from app.models.user import User

from app.core.dependencies import get_current_user

from app.modules.dashboard.schemas import DashboardResponse
from app.modules.dashboard.service import dashboard_service


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get(
    "",
    response_model=DashboardResponse,
)
async def get_dashboard(

    db: AsyncSession = Depends(get_db),

    current_user: User = Depends(
        get_current_user,
    ),

):

    return await dashboard_service.get_dashboard(
        db,
        current_user,
    )