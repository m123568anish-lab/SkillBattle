"""
=========================================================

SkillBattle

AI WebSocket

=========================================================
"""

from __future__ import annotations

import json

from fastapi import WebSocket

from app.modules.ai.provider import (
    ai_provider,
)


class AIWebSocket:

    async def connect(
        self,
        websocket: WebSocket,
    ):

        await websocket.accept()

    async def chat(
        self,
        websocket: WebSocket,
    ):

        while True:

            message = await websocket.receive_text()

            response = await ai_provider.generate(
                message,
            )

            await websocket.send_text(

                json.dumps(

                    {

                        "response": response,

                    }

                )

            )


ai_ws = AIWebSocket()