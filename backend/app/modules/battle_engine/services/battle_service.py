from app.modules.battle_engine.managers.room_manager import (
    room_manager,
)

from app.modules.battle_engine.state.state_machine import (
    state_machine,
)

from app.modules.battle_engine.state.battle_state import (
    BattleState,
)


class BattleService:

    def create_battle(self):

        return room_manager.create_room()

    def start(

        self,

        room_id,

    ):

        room = room_manager.get(room_id)

        state_machine.transition(

            room,

            BattleState.COUNTDOWN,

        )

        return room

    def begin(

        self,

        room_id,

    ):

        room = room_manager.get(room_id)

        state_machine.transition(

            room,

            BattleState.LIVE,

        )

        return room

    def finish(

        self,

        room_id,

    ):

        room = room_manager.get(room_id)

        state_machine.transition(

            room,

            BattleState.FINISHED,

        )

        return room


battle_service = BattleService()