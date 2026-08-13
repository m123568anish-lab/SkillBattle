"""
=========================================================

AI Worker

=========================================================
"""

from __future__ import annotations

from app.workers.worker import Worker

from app.modules.ai.provider import (
    ai_provider,
)


class AIWorker(Worker):

    QUEUE = "ai"

    async def process(
        self,
        payload: dict,
    ):

        prompt = payload["prompt"]

        response = await ai_provider.generate(
            prompt,
        )

        print(

            "AI Completed",

            response[:100],

        )


ai_worker = AIWorker()