"""
=========================================================

Notification Worker

=========================================================
"""

from __future__ import annotations

import logging
from app.workers.worker import Worker

logger = logging.getLogger(__name__)


class NotificationWorker(Worker):

    QUEUE = "notification"

    async def process(
        self,
        payload: dict,
    ):
        logger.info("Notification Job processed: %s", payload)


notification_worker = NotificationWorker()