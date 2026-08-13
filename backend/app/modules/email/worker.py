"""
=========================================================

SkillBattle

Email Worker

=========================================================
"""

from __future__ import annotations

from app.workers.worker import Worker

from app.modules.email.service import (
    email_service,
)


class EmailWorker(Worker):

    QUEUE = "email"

    async def process(
        self,
        payload: dict,
    ):

        await email_service.send_email(

            payload["recipient"],

            payload["subject"],

            payload["body"],

        )


email_worker = EmailWorker()