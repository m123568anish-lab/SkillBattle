"""
=========================================================
SkillBattle Placement Router
=========================================================
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.modules.placement.catalog_service import list_catalogue, get_track

from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/placement",
    tags=["Placement & Career Readiness"],
)

@router.get("/catalogue")
async def catalogue(q: str = "", category: str | None = None, role: str | None = None, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {"items": await list_catalogue(db, q, category, role)}

@router.get("/tracks/{track_id}")
async def track(track_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    payload = await get_track(db, track_id)
    if not payload: raise HTTPException(404, "Preparation track not found")
    return payload
