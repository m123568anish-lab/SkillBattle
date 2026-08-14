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
from app.models.user import User
from app.models.xp import XP

router = APIRouter(prefix="/achievements", tags=["Achievements"])

# Static achievement definitions (unlocked based on XP/level thresholds)
ACHIEVEMENT_CATALOG = [
    {"id": "first_blood", "title": "First Blood", "description": "Win your first battle", "icon": "⚔️", "xp_threshold": 100},
    {"id": "daily_warrior", "title": "Daily Warrior", "description": "Complete 7 daily challenges", "icon": "🔥", "xp_threshold": 500},
    {"id": "century_coder", "title": "Century Coder", "description": "Solve 100 problems", "icon": "💯", "xp_threshold": 2000},
    {"id": "algorithm_ace", "title": "Algorithm Ace", "description": "Reach Level 10", "icon": "🧠", "xp_threshold": 5000},
    {"id": "speed_demon", "title": "Speed Demon", "description": "Solve a Hard problem in under 5 minutes", "icon": "⚡", "xp_threshold": 1000},
    {"id": "undefeated", "title": "Undefeated", "description": "Win 10 battles in a row", "icon": "🏆", "xp_threshold": 3000},
    {"id": "polyglot", "title": "Polyglot", "description": "Submit solutions in 3 different languages", "icon": "🌐", "xp_threshold": 800},
    {"id": "night_owl", "title": "Night Owl", "description": "Solve problems after midnight", "icon": "🦉", "xp_threshold": 250},
    {"id": "faang_ready", "title": "FAANG Ready", "description": "Complete a FAANG Prep Roadmap", "icon": "🚀", "xp_threshold": 8000},
    {"id": "mentor_mind", "title": "Mentor Mind", "description": "Help 5 community members", "icon": "🎓", "xp_threshold": 4000},
]


@router.get("/user")
async def get_user_achievements(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(XP).where(XP.user_id == current_user.id)
    res = await db.execute(stmt)
    xp_record = res.scalar_one_or_none()
    user_xp = xp_record.total_xp if xp_record else 0

    result = []
    for ach in ACHIEVEMENT_CATALOG:
        unlocked = user_xp >= ach["xp_threshold"]
        result.append({
            "id": ach["id"],
            "title": ach["title"],
            "description": ach["description"],
            "icon": ach["icon"],
            "unlocked": unlocked,
            "xp_threshold": ach["xp_threshold"],
        })
    return result