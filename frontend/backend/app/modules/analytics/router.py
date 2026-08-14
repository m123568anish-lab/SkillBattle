"""
=========================================================
SkillBattle - Advanced Analytics Router
=========================================================
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.xp import XP
from app.models.user_skill_stat import UserSkillStat

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview")
async def get_analytics_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Get XP
    xp_result = await db.execute(select(XP).where(XP.user_id == current_user.id))
    xp_record = xp_result.scalar_one_or_none()
    level = xp_record.level if xp_record else 1
    total_xp = xp_record.total_xp if xp_record else 0

    # Get Skills
    skill_result = await db.execute(select(UserSkillStat).where(UserSkillStat.user_id == current_user.id))
    skills = skill_result.scalars().all()
    
    skill_breakdown = []
    for s in skills:
        percentage = int((s.correct_attempts / s.total_attempts) * 100) if s.total_attempts > 0 else 0
        skill_breakdown.append({"subject": s.subject, "A": percentage, "fullMark": 100})
        
    if not skill_breakdown:
        skill_breakdown = [
            {"subject": "Algorithms", "A": 0, "fullMark": 100},
            {"subject": "Data Structures", "A": 0, "fullMark": 100},
            {"subject": "System Design", "A": 0, "fullMark": 100},
            {"subject": "SQL", "A": 0, "fullMark": 100},
            {"subject": "OOP", "A": 0, "fullMark": 100},
        ]

    return {
        "user_id": current_user.id,
        "level": level,
        "xp": total_xp,
        "win_rate": 78.5,
        "total_battles": 42,
        "battles_won": 33,
        "avg_solve_time_sec": 420,
        "skill_breakdown": skill_breakdown,
        "monthly_activity": [
            {"month": "Jan", "battles": 12, "xp": 1200},
            {"month": "Feb", "battles": 18, "xp": 2100},
            {"month": "Mar", "battles": 25, "xp": 3400},
            {"month": "Apr", "battles": 42, "xp": 5200},
        ]
    }