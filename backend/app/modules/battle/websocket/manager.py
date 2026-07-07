from collections import defaultdict

from fastapi import WebSocket


class BattleConnectionManager:

    """
    Handles all active WebSocket
    connections for battle rooms.
    """

    def __init__(self):

        self.rooms = defaultdict(list)

    # =====================================================

    async def connect(

        self,

        battle_id: str,

        websocket: WebSocket,

    ):

        await websocket.accept()

        self.rooms[battle_id].append(websocket)

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

        if len(self.rooms[battle_id]) == 0:

            del self.rooms[battle_id]

    # =====================================================

    async def send(

        self,

        websocket: WebSocket,

        event: str,

        data,

    ):

        await websocket.send_json(

            {

                "event": event,

                "data": data,

            }

        )

    # =====================================================

    async def broadcast(

        self,

        battle_id: str,

        event: str,

        data,

    ):

        if battle_id not in self.rooms:

            return

        dead = []

        for socket in self.rooms[battle_id]:

            try:

                await socket.send_json(

                    {

                        "event": event,

                        "data": data,

                    }

                )

            except Exception:

                dead.append(socket)

        for socket in dead:

            self.disconnect(

                battle_id,

                socket,

            )

    # =====================================================

    def room_size(

        self,

        battle_id: str,

    ):

        if battle_id not in self.rooms:

            return 0

        return len(

            self.rooms[battle_id]

        )


battle_ws = BattleConnectionManager()