from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from starlette.websockets import WebSocketDisconnect

from app.modules.battle.repository import battle_repository
from app.modules.battle.router import battle_socket


@pytest.mark.asyncio
async def test_active_battle_lookup_excludes_finished_rooms_and_limits_to_latest():
    participant = SimpleNamespace(battle_id="active-battle", user_id="user-1")
    db = AsyncMock()
    db.execute.return_value = SimpleNamespace(
        scalar_one_or_none=lambda: participant,
    )

    result = await battle_repository.get_active_battle_for_user(db, "user-1")

    assert result is participant
    statement = db.execute.await_args.args[0]
    query = str(statement.compile(compile_kwargs={"literal_binds": True})).lower()
    assert "battle_rooms.status not in" in query
    assert "battle_participants.user_id = 'user-1'" in query
    assert "order by battle_rooms.created_at desc" in query
    assert "limit 1" in query


@pytest.mark.asyncio
async def test_battle_socket_does_not_broadcast_client_submission(monkeypatch):
    broadcasts = AsyncMock()
    monkeypatch.setattr("app.modules.battle.router.battle_ws.connect", AsyncMock())
    monkeypatch.setattr("app.modules.battle.router.battle_ws.disconnect", lambda *_: None)
    monkeypatch.setattr("app.modules.battle.router.battle_ws.room_size", lambda *_: 1)
    monkeypatch.setattr("app.modules.battle.router.battle_ws.broadcast", broadcasts)

    websocket = SimpleNamespace(
        receive_text=AsyncMock(side_effect=[
            '{"event":"submission","data":{"verdict":"Accepted"}}',
            WebSocketDisconnect(),
        ]),
        send_text=AsyncMock(),
    )

    await battle_socket(websocket, "battle-1")

    events = [call.args[1] for call in broadcasts.await_args_list]
    assert events == ["player_joined", "player_left"]
