from collections import defaultdict

from fastapi import WebSocket


class BattleWebSocketManager:

    def __init__(self):

        self.rooms: dict[str, list[WebSocket]] = defaultdict(list)

    async def connect(
        self,
        battle_id: str,
        websocket: WebSocket,
    ):

        await websocket.accept()

        self.rooms[battle_id].append(websocket)

    def disconnect(
        self,
        battle_id: str,
        websocket: WebSocket,
    ):

        if websocket in self.rooms[battle_id]:
            self.rooms[battle_id].remove(websocket)

        if not self.rooms[battle_id]:
            self.rooms.pop(battle_id, None)

    async def broadcast(
        self,
        battle_id: str,
        event: str,
        data: dict,
    ):

        payload = {
            "event": event,
            "data": data,
        }

        dead = []

        for socket in self.rooms.get(battle_id, []):

            try:
                await socket.send_json(payload)

            except Exception:
                dead.append(socket)

        for socket in dead:
            self.disconnect(
                battle_id,
                socket,
            )

    def room_size(
        self,
        battle_id: str,
    ) -> int:

        return len(self.rooms.get(battle_id, []))


battle_ws = BattleWebSocketManager()