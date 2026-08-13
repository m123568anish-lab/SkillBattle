"""
=========================================================

SkillBattle

Notification WebSocket

=========================================================
"""

from __future__ import annotations

import json

from collections import defaultdict

from fastapi import WebSocket


class NotificationWebSocket:

    def __init__(self):

        self.connections = defaultdict(list)

    # =====================================================
    # Connect
    # =====================================================

    async def connect(

        self,

        user_id: str,

        websocket: WebSocket,

    ):

        await websocket.accept()

        self.connections[user_id].append(

            websocket,

        )

    # =====================================================
    # Disconnect
    # =====================================================

    def disconnect(

        self,

        user_id: str,

        websocket: WebSocket,

    ):

        if websocket in self.connections[user_id]:

            self.connections[user_id].remove(

                websocket,

            )

    # =====================================================
    # Push
    # =====================================================

    async def push(

        self,

        user_id: str,

        notification,

    ):

        payload = json.dumps(

            {

                "title": notification.title,

                "message": notification.message,

                "type": notification.notification_type,

                "created_at": str(

                    notification.created_at,

                ),

            }

        )

        dead = []

        for ws in self.connections.get(

            user_id,

            [],

        ):

            try:

                await ws.send_text(

                    payload,

                )

            except Exception:

                dead.append(ws)

        for ws in dead:

            self.disconnect(

                user_id,

                ws,

            )


notification_ws = NotificationWebSocket()