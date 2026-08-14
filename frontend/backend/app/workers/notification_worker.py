"""
=========================================================

Notification Worker

=========================================================
"""

from __future__ import annotations

from app.workers.worker import Worker


class NotificationWorker(Worker):

    QUEUE = "notification"

    async def process(
        self,
        payload: dict,
    ):

        print(

            "Notification",

            payload,

        )


notification_worker = NotificationWorker()