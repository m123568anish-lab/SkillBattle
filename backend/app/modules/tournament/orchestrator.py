"""
=========================================================

SkillBattle

Tournament Orchestrator

Production Version

=========================================================
"""

from __future__ import annotations

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.tournament.websocket import (

    tournament_ws,

    TournamentEvent,

)

from app.modules.tournament.service import (

    tournament_service,

)

logger = logging.getLogger(__name__)


class TournamentOrchestrator:

    """
    Coordinates the tournament lifecycle.
    """

    def __init__(self):

        self.running: dict[str, bool] = {}

    # =====================================================
    # Start
    # =====================================================

    async def start(
        self,
        db: AsyncSession,
        tournament_id: str,
    ):

        if tournament_id in self.running:

            return

        self.running[tournament_id] = True

        await tournament_service.start_tournament(

            db,

            tournament_id,

        )

        await tournament_ws.broadcast(

            tournament_id,

            TournamentEvent.TOURNAMENT_STARTED,

            {

                "tournament_id": tournament_id,

            },

        )

        logger.info(

            "Tournament %s started",

            tournament_id,

        )

    # =====================================================
    # Advance
    # =====================================================

    async def advance(
        self,
        db: AsyncSession,
        tournament_id: str,
    ):

        result = await tournament_service.advance_round(

            db,

            tournament_id,

        )

        await tournament_ws.broadcast(

            tournament_id,

            TournamentEvent.ROUND_FINISHED,

            result,

        )

        if result.get("status") == "finished":

            await tournament_ws.broadcast(

                tournament_id,

                TournamentEvent.CHAMPION,

                {

                    "champion": result["champion"],

                },

            )

            self.running.pop(

                tournament_id,

                None,

            )

    # =====================================================
    # Stop
    # =====================================================

    async def stop(
        self,
        db: AsyncSession,
        tournament_id: str,
    ):

        await tournament_service.finish_tournament(

            db,

            tournament_id,

        )

        await tournament_ws.broadcast(

            tournament_id,

            TournamentEvent.SYSTEM,

            {

                "message": "Tournament stopped.",

            },

        )

        self.running.pop(

            tournament_id,

            None,

        )


tournament_orchestrator = TournamentOrchestrator()