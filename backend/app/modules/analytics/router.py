"""
=========================================================
SkillBattle - Advanced Analytics Router
=========================================================
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from collections import defaultdict

from sqlalchemy import select
from app.database.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.xp import XP
from app.models.user_skill_stat import UserSkillStat
from app.models.battle import BattleParticipant, BattleResult

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview")
async def get_analytics_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Get persisted XP and the user's completed battle results.
    xp_result = await db.execute(select(XP).where(XP.user_id == current_user.id))
    xp_record = xp_result.scalar_one_or_none()
    level = xp_record.level if xp_record else 1
    total_xp = xp_record.total_xp if xp_record else 0

    battle_result = await db.execute(
        select(BattleResult)
        .join(BattleParticipant, BattleParticipant.battle_id == BattleResult.battle_id)
        .where(BattleParticipant.user_id == current_user.id)
    )
    results = battle_result.scalars().all()
    total_battles = len(results)
    battles_won = sum(result.winner_id == current_user.id for result in results)
    average_solve_time = (
        sum(result.duration_seconds for result in results) / total_battles
        if total_battles
        else 0
    )

    # Get persisted skill statistics.
    skill_result = await db.execute(select(UserSkillStat).where(UserSkillStat.user_id == current_user.id))
    skills = skill_result.scalars().all()
    
    skill_breakdown = []
    for s in skills:
        percentage = int((s.correct_attempts / s.total_attempts) * 100) if s.total_attempts > 0 else 0
        skill_breakdown.append({"subject": s.subject, "A": percentage, "fullMark": 100})
        
    monthly_totals: dict[str, dict[str, int]] = defaultdict(lambda: {"battles": 0, "xp": 0})
    for result in results:
        month = result.created_at.strftime("%b") if result.created_at else "Unknown"
        monthly_totals[month]["battles"] += 1
        monthly_totals[month]["xp"] += result.xp_earned

    monthly_activity = [
        {"month": month, **monthly_totals[month]}
        for month in sorted(monthly_totals)
    ]

    return {
        "user_id": current_user.id,
        "level": level,
        "xp": total_xp,
        "win_rate": round((battles_won / total_battles) * 100, 1) if total_battles else 0,
        "total_battles": total_battles,
        "battles_won": battles_won,
        "avg_solve_time_sec": round(average_solve_time),
        "skill_breakdown": skill_breakdown,
        "monthly_activity": monthly_activity,
    }