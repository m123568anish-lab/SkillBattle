"""
=========================================================

SkillBattle

Admin Service

=========================================================
"""

from typing import List, Optional
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.challenge import Challenge
from app.models.battle.battle_room import BattleRoom
from app.modules.admin.schemas import (
    DailyChallengeCreate,
    DailyChallengeResponse,
    AdminUserUpdate,
    AdminUserResponse,
    BattleLogItem,
    BattleSettings,
)

# In-memory store for global settings fallback
DEFAULT_SETTINGS = BattleSettings(
    battle_duration_minutes=30,
    xp_multiplier=1.0,
    allow_custom_battles=True,
)


class AdminService:

    async def set_daily_challenge(
        self,
        db: AsyncSession,
        payload: DailyChallengeCreate,
    ) -> DailyChallengeResponse:
        # Check if a challenge exists
        result = await db.execute(select(Challenge))
        challenge = result.scalars().first()

        if challenge is None:
            challenge = Challenge(
                title=payload.title,
                difficulty=payload.difficulty,
                category=payload.category,
            )
            db.add(challenge)
        else:
            challenge.title = payload.title
            challenge.difficulty = payload.difficulty
            challenge.category = payload.category

        await db.commit()
        await db.refresh(challenge)

        return DailyChallengeResponse(
            id=challenge.id,
            title=challenge.title,
            difficulty=challenge.difficulty,
            category=challenge.category,
        )

    async def list_users(
        self,
        db: AsyncSession,
        limit: int = 50,
        offset: int = 0,
    ) -> List[AdminUserResponse]:
        result = await db.execute(
            select(User).order_by(User.created_at.desc()).offset(offset).limit(limit)
        )
        users = result.scalars().all()

        return [
            AdminUserResponse(
                id=u.id,
                username=u.username,
                full_name=u.full_name,
                email=u.email,
                role=getattr(u, "role", "user"),
                is_active=u.is_active,
                is_superuser=getattr(u, "is_superuser", False),
                created_at=u.created_at,
            )
            for u in users
        ]

    async def update_user(
        self,
        db: AsyncSession,
        user_id: str,
        payload: AdminUserUpdate,
    ) -> Optional[AdminUserResponse]:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            return None

        if payload.role is not None:
            user.role = payload.role
        if payload.is_active is not None:
            user.is_active = payload.is_active
        if payload.full_name is not None:
            user.full_name = payload.full_name

        await db.commit()
        await db.refresh(user)

        return AdminUserResponse(
            id=user.id,
            username=user.username,
            full_name=user.full_name,
            email=user.email,
            role=getattr(user, "role", "user"),
            is_active=user.is_active,
            is_superuser=getattr(user, "is_superuser", False),
            created_at=user.created_at,
        )

    async def delete_user(
        self,
        db: AsyncSession,
        user_id: str,
    ) -> bool:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            return False

        user.is_active = False
        await db.commit()
        return True

    async def get_battle_logs(
        self,
        db: AsyncSession,
        limit: int = 20,
    ) -> List[BattleLogItem]:
        try:
            result = await db.execute(
                select(BattleRoom).order_by(BattleRoom.created_at.desc()).limit(limit)
            )
            rooms = result.scalars().all()
            return [
                BattleLogItem(
                    id=str(r.id),
                    room_code=getattr(r, "code", getattr(r, "room_code", None)),
                    mode=getattr(r, "mode", "duo"),
                    status=getattr(r, "status", "completed"),
                    created_at=getattr(r, "created_at", None),
                )
                for r in rooms
            ]
        except Exception:
            return []

    async def get_settings(self) -> BattleSettings:
        return DEFAULT_SETTINGS

    async def update_settings(self, payload: BattleSettings) -> BattleSettings:
        global DEFAULT_SETTINGS
        DEFAULT_SETTINGS = payload
        return DEFAULT_SETTINGS


admin_service = AdminService()
