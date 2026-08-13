"""
=========================================================

SkillBattle

Battle Repository

Production SQLAlchemy 2.x Async Repository

=========================================================
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.battle import (
    BattleRoom,
    BattleParticipant,
    BattleSubmission,
    BattleResult,
)


class BattleRepository:

    # ==========================================================
    # Battle Room
    # ==========================================================

    async def create_battle(
        self,
        db: AsyncSession,
        battle: BattleRoom,
    ) -> BattleRoom:

        db.add(battle)

        await db.flush()
        await db.refresh(battle)

        return battle

    async def get_battle(
        self,
        db: AsyncSession,
        battle_id: str,
    ) -> BattleRoom | None:

        result = await db.execute(
            select(BattleRoom).where(
                BattleRoom.id == battle_id
            )
        )

        return result.scalar_one_or_none()

    async def get_waiting_battles(
        self,
        db: AsyncSession,
    ) -> list[BattleRoom]:

        result = await db.execute(
            select(BattleRoom)
            .where(BattleRoom.status == "waiting")
            .order_by(BattleRoom.created_at.asc())
        )

        return list(result.scalars().all())

    async def update_battle(
        self,
        db: AsyncSession,
        battle: BattleRoom,
    ) -> BattleRoom:

        db.add(battle)

        await db.flush()
        await db.refresh(battle)

        return battle

    async def delete_battle(
        self,
        db: AsyncSession,
        battle: BattleRoom,
    ) -> None:

        await db.delete(battle)

        await db.flush()

    # ==========================================================
    # Participants
    # ==========================================================

    async def add_participant(
        self,
        db: AsyncSession,
        participant: BattleParticipant,
    ) -> BattleParticipant:

        db.add(participant)

        await db.flush()
        await db.refresh(participant)

        return participant

    async def get_participant(
        self,
        db: AsyncSession,
        battle_id: str,
        user_id: str,
    ) -> BattleParticipant | None:

        result = await db.execute(
            select(BattleParticipant).where(
                BattleParticipant.battle_id == battle_id,
                BattleParticipant.user_id == user_id,
            )
        )

        return result.scalar_one_or_none()

    async def get_participants(
        self,
        db: AsyncSession,
        battle_id: str,
    ) -> list[BattleParticipant]:

        result = await db.execute(
            select(BattleParticipant)
            .where(
                BattleParticipant.battle_id == battle_id
            )
            .order_by(
                BattleParticipant.score.desc()
            )
        )

        return list(result.scalars().all())

    async def get_active_battle_for_user(
        self,
        db: AsyncSession,
        user_id: str,
    ) -> BattleParticipant | None:

        result = await db.execute(
            select(BattleParticipant).where(
                BattleParticipant.user_id == user_id
            )
        )

        return result.scalar_one_or_none()

    async def update_participant(
        self,
        db: AsyncSession,
        participant: BattleParticipant,
    ) -> BattleParticipant:

        db.add(participant)

        await db.flush()
        await db.refresh(participant)

        return participant

    async def remove_participant(
        self,
        db: AsyncSession,
        participant: BattleParticipant,
    ) -> None:

        await db.delete(participant)

        await db.flush()

    # ==========================================================
    # Submissions
    # ==========================================================

    async def create_submission(
        self,
        db: AsyncSession,
        submission: BattleSubmission,
    ) -> BattleSubmission:

        db.add(submission)

        await db.flush()
        await db.refresh(submission)

        return submission

    async def get_submissions(
        self,
        db: AsyncSession,
        battle_id: str,
    ) -> list[BattleSubmission]:

        result = await db.execute(
            select(BattleSubmission)
            .where(
                BattleSubmission.battle_id == battle_id
            )
            .order_by(
                BattleSubmission.submitted_at.desc()
            )
        )

        return list(result.scalars().all())

    async def get_latest_submission(
        self,
        db: AsyncSession,
        battle_id: str,
        user_id: str,
    ) -> BattleSubmission | None:

        result = await db.execute(
            select(BattleSubmission)
            .where(
                BattleSubmission.battle_id == battle_id,
                BattleSubmission.user_id == user_id,
            )
            .order_by(
                BattleSubmission.submitted_at.desc()
            )
        )

        return result.scalars().first()

    # ==========================================================
    # Results
    # ==========================================================

    async def create_result(
        self,
        db: AsyncSession,
        result_obj: BattleResult,
    ) -> BattleResult:

        db.add(result_obj)

        await db.flush()
        await db.refresh(result_obj)

        return result_obj

    async def get_result(
        self,
        db: AsyncSession,
        battle_id: str,
    ) -> BattleResult | None:

        result = await db.execute(
            select(BattleResult).where(
                BattleResult.battle_id == battle_id
            )
        )

        return result.scalar_one_or_none()

    # ==========================================================
    # Statistics
    # ==========================================================

    async def battle_exists(
        self,
        db: AsyncSession,
        battle_id: str,
    ) -> bool:

        battle = await self.get_battle(
            db,
            battle_id,
        )

        return battle is not None

    async def player_count(
        self,
        db: AsyncSession,
        battle_id: str,
    ) -> int:

        participants = await self.get_participants(
            db,
            battle_id,
        )

        return len(participants)


battle_repository = BattleRepository()