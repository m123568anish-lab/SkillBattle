from collections import defaultdict

from fastapi import WebSocket


class TournamentConnectionManager:

    """
    Handles all WebSocket connections
    for tournament dashboards.
    """

    def __init__(self):

        self.rooms = defaultdict(list)

    async def connect(
        self,
        tournament_id: str,
        websocket: WebSocket,
    ):

        await websocket.accept()

        self.rooms[tournament_id].append(websocket)

    def disconnect(
        self,
        tournament_id: str,
        websocket: WebSocket,
    ):

        if tournament_id not in self.rooms:
            return

        if websocket in self.rooms[tournament_id]:

            self.rooms[tournament_id].remove(websocket)

        if not self.rooms[tournament_id]:

            del self.rooms[tournament_id]

    async def broadcast(
        self,
        tournament_id: str,
        event: str,
        data,
    ):

        if tournament_id not in self.rooms:

            return

        dead = []

        for socket in self.rooms[tournament_id]:

            try:

                await socket.send_json({

                    "event": event,

                    "data": data,

                })

            except Exception:

                dead.append(socket)

        for socket in dead:

            self.disconnect(
                tournament_id,
                socket,
            )


tournament_ws = TournamentConnectionManager()