from collections import defaultdict
from fastapi import WebSocket


class ConnectionManager:

    def __init__(self):

        self.connections: dict[str, WebSocket] = {}

        self.rooms: dict[str, set[str]] = defaultdict(set)

    async def connect(

        self,

        user_id: str,

        websocket: WebSocket,

    ):

        await websocket.accept()

        self.connections[user_id] = websocket

    def disconnect(

        self,

        user_id: str,

    ):

        self.connections.pop(user_id, None)

        for room in self.rooms.values():

            room.discard(user_id)

    def join_room(

        self,

        room_id: str,

        user_id: str,

    ):

        self.rooms[room_id].add(user_id)

    def leave_room(

        self,

        room_id: str,

        user_id: str,

    ):

        if room_id in self.rooms:

            self.rooms[room_id].discard(user_id)

    async def send(

        self,

        user_id: str,

        data,

    ):

        websocket = self.connections.get(user_id)

        if websocket:

            await websocket.send_json(data)

    async def broadcast(

        self,

        room_id: str,

        data,

    ):

        if room_id not in self.rooms:

            return

        for user_id in self.rooms[room_id]:

            websocket = self.connections.get(user_id)

            if websocket:

                await websocket.send_json(data)


connection_manager = ConnectionManager()