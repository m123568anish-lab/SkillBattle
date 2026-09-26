"""
=========================================================

SkillBattle

Dashboard Router

=========================================================
"""

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException, status
import logging

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
logger = logging.getLogger("uvicorn.error")


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
    user_id = str(current_user.id)
    try:
        return await dashboard_service.get_dashboard(db, current_user)
    except HTTPException:
        raise
    except LookupError as exc:
        logger.warning("Dashboard data not found for user_id=%s: %s", user_id, exc)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dashboard data not found.")
    except Exception:
        logger.exception("Dashboard request failed for user_id=%s", user_id)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Dashboard is temporarily unavailable.",
        )