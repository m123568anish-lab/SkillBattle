from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.modules.quest_map.catalog import MAP_ID
from app.modules.quest_map.service import quest_map_service


router = APIRouter(prefix="/quest-map", tags=["Quest Map"])


@router.get("")
async def get_quest_map(
    map_id: str = MAP_ID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return await quest_map_service.get_map(db, current_user, map_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/levels/{level_id}/start")
async def start_quest_level(
    level_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return await quest_map_service.start_level(db, current_user, level_id)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc