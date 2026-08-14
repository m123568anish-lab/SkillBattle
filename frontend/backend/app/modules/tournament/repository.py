"""
=========================================================

SkillBattle

Tournament Repository

Production Async Version

=========================================================
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tournament import (
    Tournament,
    TournamentParticipant,
    TournamentMatch,
)


class TournamentRepository:

    # =====================================================
    # Tournament
    # =====================================================

    async def create_tournament(
        self,
        db: AsyncSession,
        tournament: Tournament,
    ) -> Tournament:

        db.add(tournament)

        await db.flush()

        await db.refresh(tournament)

        return tournament

    async def update_tournament(
        self,
        db: AsyncSession,
        tournament: Tournament,
    ) -> Tournament:

        db.add(tournament)

        await db.flush()

        await db.refresh(tournament)

        return tournament

    async def get_tournament(
        self,
        db: AsyncSession,
        tournament_id: str,
    ) -> Tournament | None:

        result = await db.execute(

            select(Tournament).where(

                Tournament.id == tournament_id

            )

        )

        return result.scalar_one_or_none()

    async def list_tournaments(
        self,
        db: AsyncSession,
    ):

        result = await db.execute(

            select(Tournament)

            .order_by(

                Tournament.starts_at.asc()

            )

        )

        return list(result.scalars().all())

    # =====================================================
    # Participants
    # =====================================================

    async def add_participant(
        self,
        db: AsyncSession,
        participant: TournamentParticipant,
    ) -> TournamentParticipant:

        db.add(participant)

        await db.flush()

        await db.refresh(participant)

        return participant

    async def get_participant(
        self,
        db: AsyncSession,
        tournament_id: str,
        user_id: str,
    ):

        result = await db.execute(

            select(TournamentParticipant)

            .where(

                TournamentParticipant.tournament_id == tournament_id,

                TournamentParticipant.user_id == user_id,

            )

        )

        return result.scalar_one_or_none()

    async def get_participants(
        self,
        db: AsyncSession,
        tournament_id: str,
    ):

        result = await db.execute(

            select(TournamentParticipant)

            .where(

                TournamentParticipant.tournament_id == tournament_id

            )

            .order_by(

                TournamentParticipant.seed.asc()

            )

        )

        return list(result.scalars().all())

    async def remove_participant(
        self,
        db: AsyncSession,
        participant: TournamentParticipant,
    ):

        await db.delete(participant)

    # =====================================================
    # Matches
    # =====================================================

    async def create_match(
        self,
        db: AsyncSession,
        match: TournamentMatch,
    ) -> TournamentMatch:

        db.add(match)

        await db.flush()

        await db.refresh(match)

        return match

    async def update_match(
        self,
        db: AsyncSession,
        match: TournamentMatch,
    ) -> TournamentMatch:

        db.add(match)

        await db.flush()

        await db.refresh(match)

        return match

    async def get_match(
        self,
        db: AsyncSession,
        match_id: str,
    ):

        result = await db.execute(

            select(TournamentMatch)

            .where(

                TournamentMatch.id == match_id

            )

        )

        return result.scalar_one_or_none()

    async def get_matches(
        self,
        db: AsyncSession,
        tournament_id: str,
    ):

        result = await db.execute(

            select(TournamentMatch)

            .where(

                TournamentMatch.tournament_id == tournament_id

            )

            .order_by(

                TournamentMatch.round_number.asc()

            )

        )

        return list(result.scalars().all())

    # =====================================================
    # Helpers
    # =====================================================

    async def commit(
        self,
        db: AsyncSession,
    ):

        await db.commit()

    async def rollback(
        self,
        db: AsyncSession,
    ):

        await db.rollback()


tournament_repository = TournamentRepository()