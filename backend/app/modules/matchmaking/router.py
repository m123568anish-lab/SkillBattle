from __future__ import annotations

import asyncio
import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.models.matchmaking import MatchmakingMatch, PlacementPrepSession
from app.models.user import User
from app.modules.battle_engine.managers.connection_manager import connection_manager
from app.modules.matchmaking.managers.queue_manager import queue_manager
from app.modules.matchmaking.models.queue_player import QueuePlayer
from app.modules.matchmaking.services.matchmaking_service import matchmaking_service

router = APIRouter(

    prefix="/matchmaking",

    tags=["Matchmaking"],

)

_queue_lock = asyncio.Lock()
_lobby_room = "matchmaking:lobby"


class JoinQueueRequest(BaseModel):
    mode: str = Field(default="ranked", pattern="^(ranked|casual)$")
    rating: int | None = Field(default=None, ge=0, le=5000)
    region: str | None = Field(default=None, max_length=32)


class PrepUpdateRequest(BaseModel):
    match_id: str | None = None
    answers: dict = Field(default_factory=dict)
    completed_steps: list[str] = Field(default_factory=list)
    status: str = Field(default="in_progress", pattern="^(in_progress|ready)$")


def _queue_snapshot(mode: str | None = None) -> dict:
    queues = [queue_manager.get_queue(mode)] if mode else list(queue_manager.queues.values())
    players = [player for queue in queues for player in queue]
    return {
        "queue_size": len(players),
        "modes": {key: len(value) for key, value in queue_manager.queues.items()},
    }


@router.get("/lobby")
async def lobby(current_user: User = Depends(get_current_user)):
    """Return the public queue snapshot used by the lobby."""
    return {"success": True, **_queue_snapshot()}


@router.post("/queue/join")
async def join_queue(
    request: JoinQueueRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    async with _queue_lock:
        queue_manager.leave(current_user.id)
        player = QueuePlayer(
            user_id=current_user.id,
            username=current_user.username,
            rating=request.rating if request.rating is not None else current_user.coding_rating or 1000,
            region=request.region or current_user.country or "global",
            mode=request.mode,
        )
        queue_manager.join(player)
        match = matchmaking_service.find_match(request.mode)
        if match is not None:
            record = MatchmakingMatch(
                id=match.id,
                room_id=match.room_id,
                player_one_id=match.player_one,
                player_two_id=match.player_two,
                mode=match.mode,
                status="placement",
            )
            db.add(record)
            await db.flush()
            payload = {
                "matched": True,
                "match_id": match.id,
                "room_id": match.room_id,
                "status": "placement_prep",
                **_queue_snapshot(request.mode),
            }
            await connection_manager.broadcast(
                _lobby_room,
                {"event": "match_found", **payload},
            )
            return payload
        payload = {
            "matched": False,
            "status": "waiting",
            "position": next(
                (index + 1 for index, item in enumerate(queue_manager.get_queue(request.mode)) if item.user_id == current_user.id),
                0,
            ),
            **_queue_snapshot(request.mode),
        }
        await connection_manager.broadcast(_lobby_room, {"event": "queue_updated", **payload})
        return payload


@router.post("/queue/leave")
async def leave_queue(current_user: User = Depends(get_current_user)):
    queue_manager.leave(current_user.id)
    payload = {"success": True, "status": "idle", **_queue_snapshot()}
    await connection_manager.broadcast(_lobby_room, {"event": "queue_updated", **payload})
    return payload


@router.get("/queue/status")
async def queue_status(current_user: User = Depends(get_current_user)):
    for mode, queue in queue_manager.queues.items():
        for position, player in enumerate(queue, 1):
            if player.user_id == current_user.id:
                return {"matched": False, "status": "waiting", "mode": mode, "position": position, **_queue_snapshot(mode)}
    return {"matched": False, "status": "idle", "position": 0, **_queue_snapshot()}


@router.get("/placement-prep")
async def placement_prep(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PlacementPrepSession)
        .where(PlacementPrepSession.user_id == current_user.id)
        .order_by(PlacementPrepSession.updated_at.desc())
        .limit(1)
    )
    session = result.scalar_one_or_none()
    return {
        "steps": [
            {"id": "profile", "title": "Confirm your profile"},
            {"id": "rules", "title": "Review placement rules"},
            {"id": "ready", "title": "Ready up"},
        ],
        "session": None if session is None else {
            "id": session.id, "match_id": session.match_id,
            "answers": session.answers, "completed_steps": session.completed_steps,
            "status": session.status,
        },
    }


@router.post("/placement-prep")
async def update_placement_prep(
    request: PrepUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PlacementPrepSession)
        .where(PlacementPrepSession.user_id == current_user.id)
        .order_by(PlacementPrepSession.updated_at.desc())
        .limit(1)
    )
    session = result.scalar_one_or_none()
    if session is None:
        session = PlacementPrepSession(user_id=current_user.id)
        db.add(session)
    session.match_id = request.match_id
    session.answers = request.answers
    session.completed_steps = request.completed_steps
    session.status = request.status
    session.updated_at = datetime.utcnow()
    await db.flush()
    return {"success": True, "session_id": session.id, "status": session.status}


@router.websocket("/ws/{user_id}")
async def matchmaking_socket(websocket: WebSocket, user_id: str):
    """Realtime lobby stream; queue mutations remain handled by HTTP and use this stream for fan-out."""
    await connection_manager.connect(user_id, websocket)
    connection_manager.join_room(_lobby_room, user_id)
    await connection_manager.send(user_id, {"event": "lobby_snapshot", **_queue_snapshot()})
    try:
        while True:
            message = await websocket.receive_json()
            if message.get("event") == "ping":
                await connection_manager.send(user_id, {"event": "pong"})
            elif message.get("event") == "snapshot":
                await connection_manager.send(user_id, {"event": "lobby_snapshot", **_queue_snapshot()})
    except WebSocketDisconnect:
        connection_manager.disconnect(user_id)