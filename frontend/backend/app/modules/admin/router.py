"""
=========================================================

SkillBattle

Admin Router

=========================================================
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.models.user import User
from app.core.dependencies import get_current_admin
from app.modules.admin.schemas import (
    DailyChallengeCreate,
    DailyChallengeResponse,
    AdminUserUpdate,
    AdminUserResponse,
    BattleLogItem,
    BattleSettings,
)
from app.modules.admin.service import admin_service

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


@router.post(
    "/daily-challenge",
    response_model=DailyChallengeResponse,
)
async def set_daily_challenge(
    payload: DailyChallengeCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    return await admin_service.set_daily_challenge(db, payload)


@router.get(
    "/users",
    response_model=List[AdminUserResponse],
)
async def list_users(
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    return await admin_service.list_users(db, limit=limit, offset=offset)


@router.put(
    "/users/{user_id}",
    response_model=AdminUserResponse,
)
async def update_user(
    user_id: str,
    payload: AdminUserUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    updated = await admin_service.update_user(db, user_id, payload)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return updated


@router.delete(
    "/users/{user_id}",
)
async def deactivate_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    success = await admin_service.delete_user(db, user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return {"message": "User deactivated successfully"}


@router.get(
    "/battle-logs",
    response_model=List[BattleLogItem],
)
async def get_battle_logs(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    return await admin_service.get_battle_logs(db, limit=limit)


@router.get(
    "/settings",
    response_model=BattleSettings,
)
async def get_settings(
    admin: User = Depends(get_current_admin),
):
    return await admin_service.get_settings()


@router.put(
    "/settings",
    response_model=BattleSettings,
)
async def update_settings(
    payload: BattleSettings,
    admin: User = Depends(get_current_admin),
):
    return await admin_service.update_settings(payload)
