"""
=========================================================

SkillBattle

Admin Router

=========================================================
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select, text
from sqlalchemy.exc import SQLAlchemyError

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
from app.models.assessment_engine import AssessmentAttempt
from app.models.battle.battle_room import BattleRoom
from app.models.user import User
from app.core.config import settings

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


@router.get("/system-health")
async def get_system_health(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    database_status = "healthy"
    try:
        await db.execute(text("SELECT 1"))
        migration_version = await db.scalar(text("SELECT version_num FROM alembic_version LIMIT 1"))
    except SQLAlchemyError:
        database_status = "unhealthy"
        migration_version = None
        await db.rollback()
        return {
            "api": "healthy",
            "database": database_status,
            "migration_version": migration_version,
            "total_users": None,
            "active_users": None,
            "assessment_attempts": None,
            "active_battles": None,
            "completed_battles": None,
            "ai_providers": {
                "openai": bool(settings.OPENAI_API_KEY),
                "anthropic": bool(settings.ANTHROPIC_API_KEY),
                "gemini": bool(settings.GEMINI_API_KEY),
                "deepseek": bool(settings.DEEPSEEK_API_KEY),
            },
            "websocket": "initialized",
            "failed_jobs": None,
            "notification_queue": "not_configured",
        }

    total_users = await db.scalar(select(func.count()).select_from(User))
    active_users = await db.scalar(
        select(func.count()).select_from(User).where(User.is_active.is_(True))
    )
    assessment_count = await db.scalar(
        select(func.count()).select_from(AssessmentAttempt)
    )
    active_battles = await db.scalar(
        select(func.count()).select_from(BattleRoom).where(BattleRoom.status.in_(["waiting", "active", "running"]))
    )
    completed_battles = await db.scalar(
        select(func.count()).select_from(BattleRoom).where(BattleRoom.status == "completed")
    )

    ai_providers = {
        "openai": bool(settings.OPENAI_API_KEY),
        "anthropic": bool(settings.ANTHROPIC_API_KEY),
        "gemini": bool(settings.GEMINI_API_KEY),
        "deepseek": bool(settings.DEEPSEEK_API_KEY),
    }
    return {
        "api": "healthy",
        "database": database_status,
        "migration_version": migration_version,
        "total_users": int(total_users or 0),
        "active_users": int(active_users or 0),
        "assessment_attempts": int(assessment_count or 0),
        "active_battles": int(active_battles or 0),
        "completed_battles": int(completed_battles or 0),
        "ai_providers": ai_providers,
        "websocket": "initialized",
        "failed_jobs": None,
        "notification_queue": "not_configured",
    }
