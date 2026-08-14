import uuid

from app.modules.battle_engine.models.battle_room import (
    BattleRoom,
)
from app.modules.battle_engine.state.battle_state import BattleState

class RoomManager:

    def __init__(self):

        self.rooms: dict[str, BattleRoom] = {}

    def create_room(self):

        room = BattleRoom(

            id=str(uuid.uuid4())

        )

        self.rooms[room.id] = room

        return room

    def get(

        self,

        room_id: str,

    ):

        return self.rooms.get(room_id)

    def remove(

        self,

        room_id: str,

    ):

        self.rooms.pop(room_id, None)

    def all_rooms(self):

        return list(self.rooms.values())
    def start_battle(
       self,
       room_id: str,
):
       room = self.get(room_id)

       if room:
        room.state = BattleState.COUNTDOWN

       return room


room_manager = RoomManager()