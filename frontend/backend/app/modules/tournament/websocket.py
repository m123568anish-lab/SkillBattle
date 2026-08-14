"""
=========================================================

SkillBattle

Tournament WebSocket

Production Version

=========================================================
"""

from __future__ import annotations

import json

from collections import defaultdict

from fastapi import WebSocket


class TournamentEvent:

    PLAYER_JOINED = "player_joined"

    PLAYER_LEFT = "player_left"

    TOURNAMENT_STARTED = "tournament_started"

    ROUND_STARTED = "round_started"

    ROUND_FINISHED = "round_finished"

    MATCH_CREATED = "match_created"

    MATCH_FINISHED = "match_finished"

    BRACKET_UPDATED = "bracket_updated"

    CHAMPION = "champion"

    SYSTEM = "system"


class TournamentWebSocket:

    def __init__(self):

        self.rooms: dict[str, list[WebSocket]] = defaultdict(list)

    # =====================================================
    # Connect
    # =====================================================

    async def connect(
        self,
        tournament_id: str,
        websocket: WebSocket,
    ):

        await websocket.accept()

        self.rooms[tournament_id].append(
            websocket,
        )

    # =====================================================
    # Disconnect
    # =====================================================

    def disconnect(
        self,
        tournament_id: str,
        websocket: WebSocket,
    ):

        if tournament_id not in self.rooms:
            return

        if websocket in self.rooms[tournament_id]:

            self.rooms[tournament_id].remove(
                websocket,
            )

        if not self.rooms[tournament_id]:

            del self.rooms[tournament_id]

    # =====================================================
    # Broadcast
    # =====================================================

    async def broadcast(
        self,
        tournament_id: str,
        event: str,
        data: dict,
    ):

        if tournament_id not in self.rooms:

            return

        payload = json.dumps(

            {

                "event": event,

                "data": data,

            }

        )

        disconnected = []

        for socket in self.rooms[tournament_id]:

            try:

                await socket.send_text(
                    payload,
                )

            except Exception:

                disconnected.append(
                    socket,
                )

        for socket in disconnected:

            self.disconnect(
                tournament_id,
                socket,
            )

    # =====================================================
    # Room Size
    # =====================================================

    def room_size(
        self,
        tournament_id: str,
    ) -> int:

        return len(

            self.rooms.get(

                tournament_id,

                [],

            )

        )


tournament_ws = TournamentWebSocket()