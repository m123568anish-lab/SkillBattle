import json

from fastapi import APIRouter
from fastapi import WebSocket
from fastapi import WebSocketDisconnect

from .manager import battle_ws
from .events import BattleEvent

router = APIRouter()


@router.websocket("/ws/{battle_id}")
async def battle_socket(
    websocket: WebSocket,
    battle_id: str,
):

    await battle_ws.connect(
        battle_id,
        websocket,
    )

    await battle_ws.broadcast(

        battle_id,

        BattleEvent.PLAYER_JOINED,

        {
            "players": battle_ws.room_size(
                battle_id,
            )
        },

    )

    try:

        while True:

            raw = await websocket.receive_text()

            message = json.loads(raw)

            await battle_ws.broadcast(

                battle_id,

                message.get("event"),

                message.get("data"),

            )

    except WebSocketDisconnect:

        battle_ws.disconnect(

            battle_id,

            websocket,

        )

        await battle_ws.broadcast(

            battle_id,

            BattleEvent.PLAYER_LEFT,

            {
                "players": battle_ws.room_size(
                    battle_id,
                )
            },

        )