"""
=========================================================

SkillBattle

Tournament Service

Production Version

=========================================================
"""

from __future__ import annotations

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tournament import (
    Tournament,
    TournamentParticipant,
)

from app.modules.tournament.repository import (
    tournament_repository,
)

from app.modules.tournament.scheduler import (
    tournament_scheduler,
)

from app.modules.tournament.schemas import (
    CreateTournamentRequest,
)

logger = logging.getLogger(__name__)


class TournamentService:

    # =====================================================
    # Create Tournament
    # =====================================================

    async def create_tournament(
        self,
        db: AsyncSession,
        request: CreateTournamentRequest,
    ):

        tournament = Tournament(

            title=request.title,

            description=request.description,

            difficulty="Medium",

            tournament_type=request.tournament_type,

            max_players=request.max_players,

            registration_end=request.registration_end,

            starts_at=request.starts_at,

            status="registration",

        )

        tournament = await tournament_repository.create_tournament(

            db,

            tournament,

        )

        await tournament_repository.commit(
            db,
        )

        logger.info(

            "Tournament created: %s",

            tournament.id,

        )

        return tournament

    # =====================================================
    # Get Tournament
    # =====================================================

    async def get_tournament(
        self,
        db: AsyncSession,
        tournament_id: str,
    ):

        return await tournament_repository.get_tournament(

            db,

            tournament_id,

        )

    # =====================================================
    # List Tournaments
    # =====================================================

    async def list_tournaments(
        self,
        db: AsyncSession,
    ):

        return await tournament_repository.list_tournaments(
            db,
        )

        # =====================================================
    # Join Tournament
    # =====================================================

    async def join_tournament(
        self,
        db: AsyncSession,
        tournament_id: str,
        current_user,
    ):

        tournament = await tournament_repository.get_tournament(
            db,
            tournament_id,
        )

        if tournament is None:

            raise ValueError(
                "Tournament not found."
            )

        if tournament.status != "registration":

            raise ValueError(
                "Tournament registration is closed."
            )

        participant = await tournament_repository.get_participant(
            db,
            tournament_id,
            current_user.id,
        )

        if participant:

            return participant

        participants = await tournament_repository.get_participants(
            db,
            tournament_id,
        )

        if len(participants) >= tournament.max_players:

            raise ValueError(
                "Tournament is full."
            )

        participant = TournamentParticipant(

            tournament_id=tournament.id,

            user_id=current_user.id,

            seed=len(participants) + 1,

            eliminated=False,

        )

        participant = await tournament_repository.add_participant(

            db,

            participant,

        )

        await tournament_repository.commit(
            db,
        )

        logger.info(

            "User %s joined tournament %s",

            current_user.id,

            tournament.id,

        )

        return participant

    # =====================================================
    # Leave Tournament
    # =====================================================

    async def leave_tournament(
        self,
        db: AsyncSession,
        tournament_id: str,
        current_user,
    ):

        participant = await tournament_repository.get_participant(

            db,

            tournament_id,

            current_user.id,

        )

        if participant is None:

            return {

                "message": "Participant not found."

            }

        await tournament_repository.remove_participant(

            db,

            participant,

        )

        await tournament_repository.commit(
            db,
        )

        logger.info(

            "User %s left tournament %s",

            current_user.id,

            tournament_id,

        )

        return {

            "message": "Tournament left successfully."

        }

    # =====================================================
    # Tournament Participants
    # =====================================================

    async def participants(
        self,
        db: AsyncSession,
        tournament_id: str,
    ):

        return await tournament_repository.get_participants(

            db,

            tournament_id,

        )

    # =====================================================
    # Registration Count
    # =====================================================

    async def participant_count(
        self,
        db: AsyncSession,
        tournament_id: str,
    ) -> int:

        participants = await tournament_repository.get_participants(

            db,

            tournament_id,

        )

        return len(participants)

        # =====================================================
    # Start Tournament
    # =====================================================

    async def start_tournament(
        self,
        db: AsyncSession,
        tournament_id: str,
    ):

        tournament = await tournament_repository.get_tournament(
            db,
            tournament_id,
        )

        if tournament is None:

            raise ValueError(
                "Tournament not found."
            )

        participants = await tournament_repository.get_participants(
            db,
            tournament_id,
        )

        if len(participants) < 2:

            raise ValueError(
                "At least two participants are required."
            )

        tournament.status = "running"

        await tournament_repository.update_tournament(
            db,
            tournament,
        )

        matches = await tournament_scheduler.create_first_round(
            db,
            tournament,
            participants,
        )

        await tournament_repository.commit(
            db,
        )

        logger.info(
            "Tournament %s started.",
            tournament.id,
        )

        return {

            "status": "running",

            "matches_created": len(matches),

            "round": 1,

        }

    # =====================================================
    # Advance Round
    # =====================================================

    async def advance_round(
        self,
        db: AsyncSession,
        tournament_id: str,
    ):

        tournament = await tournament_repository.get_tournament(
            db,
            tournament_id,
        )

        if tournament is None:

            raise ValueError(
                "Tournament not found."
            )

        current_round = await tournament_scheduler.current_round(
            db,
            tournament_id,
        )

        finished = await tournament_scheduler.round_finished(
            db,
            tournament_id,
            current_round,
        )

        if not finished:

            return {

                "status": "waiting",

                "message": "Current round still in progress.",

            }

        winners = await tournament_scheduler.winners(
            db,
            tournament_id,
            current_round,
        )

        # Champion
        if len(winners) == 1:

            tournament.status = "finished"

            await tournament_repository.update_tournament(
                db,
                tournament,
            )

            await tournament_repository.commit(
                db,
            )

            return {

                "status": "finished",

                "champion": winners[0],

            }

        matches = await tournament_scheduler.create_next_round(
            db,
            tournament,
            winners,
            current_round + 1,
        )

        return {

            "status": "running",

            "round": current_round + 1,

            "matches_created": len(matches),

        }

    # =====================================================
    # Finish Tournament
    # =====================================================

    async def finish_tournament(
        self,
        db: AsyncSession,
        tournament_id: str,
    ):

        tournament = await tournament_repository.get_tournament(
            db,
            tournament_id,
        )

        if tournament is None:

            raise ValueError(
                "Tournament not found."
            )

        tournament.status = "finished"

        await tournament_repository.update_tournament(
            db,
            tournament,
        )

        await tournament_repository.commit(
            db,
        )

        logger.info(
            "Tournament %s finished.",
            tournament.id,
        )

        return {

            "status": "finished",

        }


tournament_service = TournamentService()