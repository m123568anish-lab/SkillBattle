from .battle_state import BattleState


class BattleStateMachine:

    VALID_TRANSITIONS = {

        BattleState.WAITING: {

            BattleState.COUNTDOWN,

            BattleState.CANCELLED,

        },

        BattleState.COUNTDOWN: {

            BattleState.LIVE,

            BattleState.CANCELLED,

        },

        BattleState.LIVE: {

            BattleState.PAUSED,

            BattleState.FINISHED,

        },

        BattleState.PAUSED: {

            BattleState.LIVE,

            BattleState.FINISHED,

        },

        BattleState.FINISHED: set(),

        BattleState.CANCELLED: set(),

    }

    def transition(

        self,

        room,

        new_state,

    ):

        current = room.state

        if new_state not in self.VALID_TRANSITIONS[current]:

            raise ValueError(

                f"Invalid transition "

                f"{current} -> {new_state}"

            )

        room.state = new_state


state_machine = BattleStateMachine()