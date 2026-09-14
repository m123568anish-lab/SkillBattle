"""
=========================================================

AI Worker

=========================================================
"""

from __future__ import annotations

import logging
from app.workers.worker import Worker
from app.modules.ai.provider import ai_provider

logger = logging.getLogger(__name__)


class AIWorker(Worker):

    QUEUE = "ai"

    async def process(
        self,
        payload: dict,
    ):
        prompt = payload["prompt"]
        response = await ai_provider.generate(prompt)
        logger.info("AI Completed job response prefix: %s", response[:100])


ai_worker = AIWorker()