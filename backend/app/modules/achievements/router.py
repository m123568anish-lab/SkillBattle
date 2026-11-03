"""
=========================================================
SkillBattle - Achievements Router
=========================================================
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.session import get_db
from app.core.dependencies import get_current_user
from app.models.achievement import Achievement
from app.models.user import User

router = APIRouter(prefix="/achievements", tags=["Achievements"])

@router.get("/user")
async def get_user_achievements(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Achievement)
        .where(Achievement.user_id == current_user.id)
        .order_by(Achievement.earned_at.desc(), Achievement.id.desc())
    )
    return result.scalars().all()