from fastapi import APIRouter
from fastapi import WebSocket

from app.modules.battle_engine.websocket.gateway import (
    battle_gateway,
)

router = APIRouter()


@router.websocket("/battle/ws/{room_id}/{user_id}")

async def websocket_endpoint(

    websocket: WebSocket,

    room_id: str,

    user_id: str,

):

    await battle_gateway.handle(

        websocket,

        room_id,

        user_id,

    )