"""
=========================================================

SkillBattle

Battle WebSocket Manager

Hardened Production Version
- Tracks user_id per WebSocket connection
- Sends STATE_SYNC to reconnecting client
- 30-second grace period before forfeit on disconnect
- Room state snapshot for reconnect sync

=========================================================
"""
from __future__ import annotations

import asyncio
import logging
from collections import defaultdict
from typing import Optional

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class BattleWebSocketManager:
    """
    Manages WebSocket rooms for the battle arena.
    Server is the single source of truth; this manager
    delivers events and tracks who is connected.
    """

    # Seconds to wait before declaring a disconnected player forfeited
    DISCONNECT_GRACE_SECONDS = 30

    def __init__(self):
        # battle_id -> [WebSocket, ...]
        self.rooms: dict[str, list[WebSocket]] = defaultdict(list)

        # battle_id -> { user_id: WebSocket }
        self.user_sockets: dict[str, dict[str, WebSocket]] = defaultdict(dict)

        # battle_id -> { user_id: asyncio.Task }
        self.disconnect_tasks: dict[str, dict[str, asyncio.Task]] = defaultdict(dict)

        # battle_id -> state snapshot dict (updated by orchestrator each tick)
        self.room_state: dict[str, dict] = {}

    # =====================================================
    # Connect
    # =====================================================

    async def connect(
        self,
        battle_id: str,
        websocket: WebSocket,
        user_id: Optional[str] = None,
    ):
        await websocket.accept()
        self.rooms[battle_id].append(websocket)

        if user_id:
            # Cancel any pending forfeit for this user (they reconnected in time)
            task = self.disconnect_tasks.get(battle_id, {}).pop(user_id, None)
            if task and not task.done():
                task.cancel()
                logger.info(
                    "Player %s reconnected to battle %s — forfeit cancelled",
                    user_id,
                    battle_id,
                )

            self.user_sockets[battle_id][user_id] = websocket

            # Immediately send a STATE_SYNC so the client re-syncs
            state = self.room_state.get(battle_id)
            if state:
                try:
                    await websocket.send_json({"event": "state_sync", "data": state})
                except Exception:
                    pass

    # =====================================================
    # Disconnect
    # =====================================================

    def disconnect(
        self,
        battle_id: str,
        websocket: WebSocket,
    ) -> Optional[str]:
        """
        Removes the socket from the room.
        Returns the user_id that disconnected, or None if unknown.
        """
        if websocket in self.rooms.get(battle_id, []):
            self.rooms[battle_id].remove(websocket)

        # Find the user_id associated with this socket
        user_sockets = self.user_sockets.get(battle_id, {})
        disconnected_uid: Optional[str] = None
        for uid, ws in list(user_sockets.items()):
            if ws is websocket:
                del user_sockets[uid]
                disconnected_uid = uid
                break

        if not self.rooms.get(battle_id):
            self.rooms.pop(battle_id, None)

        return disconnected_uid

    # =====================================================
    # Schedule Forfeit After Grace Period
    # =====================================================

    def schedule_forfeit(
        self,
        battle_id: str,
        user_id: str,
        forfeit_callback,
    ) -> asyncio.Task:
        """
        Schedules a forfeit for a disconnected player after DISCONNECT_GRACE_SECONDS.
        If the player reconnects within the grace window, connect() cancels the task.
        forfeit_callback(battle_id, user_id) is an async callable.
        """
        async def _run():
            await asyncio.sleep(self.DISCONNECT_GRACE_SECONDS)
            logger.info(
                "Grace period expired for user %s in battle %s — declaring forfeit",
                user_id,
                battle_id,
            )
            try:
                await forfeit_callback(battle_id, user_id)
            except Exception:
                logger.exception(
                    "Error in forfeit_callback for user=%s battle=%s",
                    user_id,
                    battle_id,
                )

        task = asyncio.create_task(_run())
        self.disconnect_tasks.setdefault(battle_id, {})[user_id] = task
        return task

    # =====================================================
    # Update Room State Snapshot (called by orchestrator/timer)
    # =====================================================

    def update_state(self, battle_id: str, state: dict):
        """
        Merges new state data into the room state snapshot.
        This snapshot is sent to reconnecting clients as STATE_SYNC.
        """
        existing = self.room_state.get(battle_id, {})
        existing.update(state)
        self.room_state[battle_id] = existing

    def clear_state(self, battle_id: str):
        self.room_state.pop(battle_id, None)

    # =====================================================
    # Broadcast to all sockets in a room
    # =====================================================

    async def broadcast(
        self,
        battle_id: str,
        event: str,
        data: dict,
    ):
        payload = {"event": event, "data": data}
        dead = []

        for socket in list(self.rooms.get(battle_id, [])):
            try:
                await socket.send_json(payload)
            except Exception:
                dead.append(socket)

        for socket in dead:
            self.disconnect(battle_id, socket)

    # =====================================================
    # Send to a specific user
    # =====================================================

    async def send_to_user(
        self,
        battle_id: str,
        user_id: str,
        event: str,
        data: dict,
    ):
        ws = self.user_sockets.get(battle_id, {}).get(user_id)
        if ws is None:
            return
        try:
            await ws.send_json({"event": event, "data": data})
        except Exception:
            self.disconnect(battle_id, ws)

    # =====================================================
    # Room Size / Connected Users
    # =====================================================

    def room_size(self, battle_id: str) -> int:
        return len(self.rooms.get(battle_id, []))

    def connected_users(self, battle_id: str) -> list[str]:
        return list(self.user_sockets.get(battle_id, {}).keys())


battle_ws = BattleWebSocketManager()