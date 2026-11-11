from fastapi import APIRouter, WebSocket

from ..router import battle_socket as handle_battle_socket

router = APIRouter()


@router.websocket("/ws/{battle_id}")
async def battle_socket(
    websocket: WebSocket,
    battle_id: str,
):
    await handle_battle_socket(websocket, battle_id)