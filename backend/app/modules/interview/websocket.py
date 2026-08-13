"""
=========================================================

SkillBattle

Interview WebSocket

Production Version

=========================================================
"""

from __future__ import annotations

import json

from collections import defaultdict

from fastapi import WebSocket


class InterviewWebSocket:

    def __init__(self):

        self.connections = defaultdict(list)

    # =====================================================
    # Connect
    # =====================================================

    async def connect(

        self,

        interview_id: str,

        websocket: WebSocket,

    ):

        await websocket.accept()

        self.connections[

            interview_id

        ].append(

            websocket,

        )

    # =====================================================
    # Disconnect
    # =====================================================

    def disconnect(

        self,

        interview_id: str,

        websocket: WebSocket,

    ):

        if websocket in self.connections[

            interview_id

        ]:

            self.connections[

                interview_id

            ].remove(

                websocket,

            )

    # =====================================================
    # Broadcast
    # =====================================================

    async def broadcast(

        self,

        interview_id: str,

        event: str,

        payload: dict,

    ):

        message = json.dumps(

            {

                "event": event,

                "payload": payload,

            }

        )

        dead = []

        for ws in self.connections.get(

            interview_id,

            [],

        ):

            try:

                await ws.send_text(

                    message,

                )

            except Exception:

                dead.append(ws)

        for ws in dead:

            self.disconnect(

                interview_id,

                ws,

            )


interview_ws = InterviewWebSocket()