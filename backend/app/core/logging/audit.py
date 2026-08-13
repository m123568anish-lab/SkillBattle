"""
=========================================================

Audit Logger

=========================================================
"""

from __future__ import annotations

from app.core.logging.logger import logger


class AuditLogger:

    def login(

        self,

        user_id: str,

    ):

        logger.info(

            "[LOGIN] user=%s",

            user_id,

        )

    def logout(

        self,

        user_id: str,

    ):

        logger.info(

            "[LOGOUT] user=%s",

            user_id,

        )

    def battle(

        self,

        battle_id: str,

        user_id: str,

    ):

        logger.info(

            "[BATTLE] battle=%s user=%s",

            battle_id,

            user_id,

        )

    def tournament(

        self,

        tournament_id: str,

        user_id: str,

    ):

        logger.info(

            "[TOURNAMENT] tournament=%s user=%s",

            tournament_id,

            user_id,

        )

    def ai(

        self,

        user_id: str,

        prompt: str,

    ):

        logger.info(

            "[AI] user=%s prompt_length=%s",

            user_id,

            len(prompt),

        )


audit_logger = AuditLogger()