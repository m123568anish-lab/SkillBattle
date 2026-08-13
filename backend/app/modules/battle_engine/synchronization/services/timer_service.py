import asyncio

from app.modules.battle_engine.managers.connection_manager import (
    connection_manager,
)


class TimerService:

    async def start(

        self,

        room,

    ):

        while room.remaining_time > 0:

            await asyncio.sleep(1)

            room.remaining_time -= 1

            await connection_manager.broadcast(

                room.id,

                {

                    "event": "timer",

                    "remaining": room.remaining_time,

                },

            )


timer_service = TimerService()