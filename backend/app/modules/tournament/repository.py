"""
=========================================================

SkillBattle

Tournament Repository

Production Async Version

=========================================================
"""

from __future__ import annotations

from sqlalchemy import func, select
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
        *,
        for_update: bool = False,
    ) -> Tournament | None:
        stmt = select(Tournament).where(Tournament.id == tournament_id)
        if for_update:
            stmt = stmt.with_for_update()
        result = await db.execute(stmt)

        return result.scalar_one_or_none()

    async def list_tournaments(
        self,
        db: AsyncSession,
        user_id: str,
    ):
        participant_count = (
            select(func.count(TournamentParticipant.id))
            .where(TournamentParticipant.tournament_id == Tournament.id)
            .correlate(Tournament)
            .scalar_subquery()
        )
        is_registered = (
            select(TournamentParticipant.id)
            .where(
                TournamentParticipant.tournament_id == Tournament.id,
                TournamentParticipant.user_id == user_id,
            )
            .correlate(Tournament)
            .exists()
        )
        result = await db.execute(
            select(Tournament, participant_count, is_registered)
            .order_by(Tournament.starts_at.asc())
        )
        return [
            {
                "id": tournament.id,
                "title": tournament.title,
                "description": tournament.description,
                "difficulty": tournament.difficulty,
                "tournament_type": tournament.tournament_type,
                "status": tournament.status,
                "max_players": tournament.max_players,
                "registered_players": int(registered_players or 0),
                "registration_end": tournament.registration_end,
                "starts_at": tournament.starts_at,
                "is_registered": bool(is_registered),
            }
            for tournament, registered_players, is_registered in result.all()
        ]

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