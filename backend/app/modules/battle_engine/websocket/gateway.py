from fastapi import WebSocket
from fastapi import WebSocketDisconnect

from app.modules.battle_engine.managers.connection_manager import (
    connection_manager,
)

from app.modules.battle_engine.events import dispatcher


class BattleGateway:

    async def handle(
        self,
        websocket: WebSocket,
        room_id: str,
        user_id: str,
    ):

        # Accept connection
        await connection_manager.connect(
            user_id,
            websocket,
        )

        # Join room
        connection_manager.join_room(
            room_id,
            user_id,
        )

        # Notify room
        await connection_manager.broadcast(
            room_id,
            {
                "event": "player_joined",
                "room_id": room_id,
                "user_id": user_id,
            },
        )

        try:

            while True:

                data = await websocket.receive_json()

                event_name = data.get("event")

                if not event_name:

                    await connection_manager.send(
                        user_id,
                        {
                            "event": "error",
                            "message": "Missing event field.",
                        },
                    )
                    continue

                # Dispatch the event
                await dispatcher.dispatch(
                    event_name=event_name,
                    room_id=room_id,
                    user_id=user_id,
                    payload=data,
                )

        except WebSocketDisconnect:

            connection_manager.disconnect(
                user_id,
            )

            await connection_manager.broadcast(
                room_id,
                {
                    "event": "player_left",
                    "room_id": room_id,
                    "user_id": user_id,
                },
            )

        except Exception as exc:

            print(f"[BattleGateway] {exc}")

            connection_manager.disconnect(
                user_id,
            )

            await connection_manager.broadcast(
                room_id,
                {
                    "event": "player_disconnected",
                    "room_id": room_id,
                    "user_id": user_id,
                },
            )


battle_gateway = BattleGateway()