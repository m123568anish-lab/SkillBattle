"""
=========================================================

SkillBattle

Battle WebSocket Manager

=========================================================
"""

from __future__ import annotations

import json

from collections import defaultdict

from fastapi import WebSocket


class BattleWebSocket:

    def __init__(self):

        self.rooms: dict[str, list[WebSocket]] = defaultdict(list)

    # =====================================================
    # Connect
    # =====================================================

    async def connect(
        self,
        battle_id: str,
        websocket: WebSocket,
    ):

        await websocket.accept()

        self.rooms[battle_id].append(websocket)

    # =====================================================
    # Disconnect
    # =====================================================

    def disconnect(
        self,
        battle_id: str,
        websocket: WebSocket,
    ):

        if battle_id not in self.rooms:
            return

        if websocket in self.rooms[battle_id]:

            self.rooms[battle_id].remove(websocket)

        if not self.rooms[battle_id]:

            del self.rooms[battle_id]

    # =====================================================
    # Broadcast
    # =====================================================

    async def broadcast(
        self,
        battle_id: str,
        event: str,
        data: dict,
    ):

        if battle_id not in self.rooms:
            return

        payload = json.dumps(

            {

                "event": event,

                "data": data,

            }

        )

        disconnected = []

        for socket in self.rooms[battle_id]:

            try:

                await socket.send_text(payload)

            except Exception:

                disconnected.append(socket)

        for socket in disconnected:

            self.disconnect(
                battle_id,
                socket,
            )

    # =====================================================
    # Room Size
    # =====================================================

    def room_size(
        self,
        battle_id: str,
    ) -> int:

        return len(

            self.rooms.get(
                battle_id,
                [],
            )

        )


battle_ws = BattleWebSocket()