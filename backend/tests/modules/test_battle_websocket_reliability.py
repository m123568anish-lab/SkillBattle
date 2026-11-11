from unittest.mock import AsyncMock

import pytest
from starlette.websockets import WebSocketDisconnect, WebSocketState

from app.modules.battle.router import battle_socket
from app.modules.battle.websocket.manager import BattleWebSocketManager


class FakeWebSocket:
    def __init__(self, *, fail_event: str | None = None):
        self.application_state = WebSocketState.CONNECTING
        self.client_state = WebSocketState.CONNECTING
        self.fail_event = fail_event
        self.sent: list[dict] = []
        self.accept_count = 0
        self.receive_text = AsyncMock(
            side_effect=RuntimeError(
                'WebSocket is not connected. Need to call "accept" first.'
            )
        )

    async def accept(self):
        self.accept_count += 1
        self.application_state = WebSocketState.CONNECTED
        self.client_state = WebSocketState.CONNECTED

    async def send_json(self, payload: dict):
        if self.application_state != WebSocketState.CONNECTED:
            raise RuntimeError("Cannot send on a disconnected socket.")
        if payload["event"] == self.fail_event:
            self.application_state = WebSocketState.DISCONNECTED
            raise WebSocketDisconnect(code=1006)
        self.sent.append(payload)


@pytest.mark.asyncio
async def test_disconnect_during_broadcast_does_not_interrupt_other_sockets(monkeypatch):
    manager = BattleWebSocketManager()
    healthy = FakeWebSocket()
    churned = FakeWebSocket(fail_event="player_joined")
    await manager.connect("battle-1", healthy)
    monkeypatch.setattr("app.modules.battle.router.battle_ws", manager)

    await battle_socket(churned, "battle-1")

    assert manager.room_size("battle-1") == 1
    assert any(frame["event"] == "player_joined" for frame in healthy.sent)
    churned.receive_text.assert_not_awaited()


@pytest.mark.asyncio
async def test_broadcast_skips_disconnected_socket_and_delivers_to_remaining_room():
    manager = BattleWebSocketManager()
    disconnected = FakeWebSocket()
    unaccepted = FakeWebSocket()
    healthy = FakeWebSocket()
    await manager.connect("battle-1", disconnected)
    await manager.connect("battle-1", healthy)
    disconnected.application_state = WebSocketState.DISCONNECTED
    manager.rooms["battle-1"].append(unaccepted)

    await manager.broadcast("battle-1", "score_updated", {"score": 3})

    assert manager.room_size("battle-1") == 1
    assert unaccepted.sent == []
    assert unaccepted.application_state == WebSocketState.CONNECTING
    assert healthy.sent[-1] == {
        "event": "score_updated",
        "data": {"score": 3},
    }


@pytest.mark.asyncio
async def test_reconnect_receives_state_refresh_instruction():
    manager = BattleWebSocketManager()
    first = FakeWebSocket()
    reconnected = FakeWebSocket()

    assert await manager.connect("battle-1", first)
    manager.disconnect("battle-1", first)
    assert await manager.connect("battle-1", reconnected)

    assert reconnected.sent[-1] == {
        "event": "state_sync",
        "data": {"refresh_required": True},
    }


@pytest.mark.asyncio
async def test_registering_the_same_connection_twice_does_not_duplicate_it():
    manager = BattleWebSocketManager()
    websocket = FakeWebSocket()

    assert await manager.connect("battle-1", websocket)
    assert await manager.connect("battle-1", websocket)

    assert manager.room_size("battle-1") == 1
    assert websocket.accept_count == 1
    assert [frame["event"] for frame in websocket.sent] == ["state_sync"]
