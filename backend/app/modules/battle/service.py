"""
=========================================================

SkillBattle

Battle Service

Core Battle Logic

=========================================================
"""
from __future__ import annotations

from app.modules.battle.score import battle_score_manager
from app.modules.battle.result import battle_result_engine
from app.modules.battle.ranking import rank_players
from app.modules.battle.websocket import battle_ws
from app.modules.battle.events import BattleEvent
from app.modules.battle.schemas import BattleType

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User

from app.models.battle import BattleRoom, BattleParticipant

from app.modules.battle.repository import battle_repository
from app.modules.battle.schemas import CreateBattleRequest
from app.modules.battle.matchmaking import matchmaking_engine
from app.modules.battle.config import battle_config_service
from app.modules.battle.orchestrator import battle_orchestrator

import asyncio


class BattleService:

    # ==========================================================
    # Create Battle
    # ==========================================================

    async def create_battle(
        self,
        db: AsyncSession,
        current_user: User,
        request: CreateBattleRequest,
    ) -> BattleRoom:

        # Determine max_players based on battle_type if not explicitly set
        if request.max_players == 2:  # default value, adjust according to type
            if request.battle_type == BattleType.SOLO:
                max_players = 1
            elif request.battle_type == BattleType.DUO:
                max_players = 2
            elif request.battle_type == BattleType.SQUAD:
                max_players = 4
            else:
                max_players = request.max_players
        else:
            max_players = request.max_players

        battle = BattleRoom(
            title=request.title,
            difficulty=request.difficulty,
            problem_id=request.problem_id,
            max_players=max_players,
            status="waiting",
        )

        battle = await battle_repository.create_battle(db, battle)

        participant = BattleParticipant(
            battle_id=battle.id,
            user_id=current_user.id,
            score=0,
            rank=1,
        )

        await battle_repository.add_participant(db, participant)

        # -------------------------------------------------------
        # Auto‑add a friend if any are available and battle supports >1 player
        # -------------------------------------------------------
        from app.modules.friend.service import friend_service
        friends = await friend_service.get_friends(db, current_user)
        if friends and max_players > 1:
            # friends list contains Friendship objects; pick the opposite user id
            friend_row = friends[0]
            friend_user_id = (
                friend_row.friend_id
                if friend_row.user_id == current_user.id
                else friend_row.user_id
            )
            # Add friend as second participant (if slot available)
            friend_participant = BattleParticipant(
                battle_id=battle.id,
                user_id=friend_user_id,
                score=0,
                rank=2,
            )
            await battle_repository.add_participant(db, friend_participant)
        # -------------------------------------------------------
        await db.commit()

        return battle

    # ==========================================================
    # Join Battle
    # ==========================================================

    async def join_battle(
        self,
        db: AsyncSession,
        battle_id: str,
        current_user: User,
    ) -> BattleRoom:

        battle = await battle_repository.get_battle(db, battle_id)

        if battle is None:
            raise ValueError("Battle not found.")

        existing = await battle_repository.get_participant(db, battle_id, current_user.id)

        if existing:
            return battle

        players = await battle_repository.get_participants(db, battle_id)

        if len(players) >= battle.max_players:
            raise ValueError("Battle is already full.")

        participant = BattleParticipant(
            battle_id=battle.id,
            user_id=current_user.id,
            score=0,
            rank=len(players) + 1,
        )

        await battle_repository.add_participant(db, participant)

        players = await battle_repository.get_participants(db, battle.id)

        if len(players) == battle.max_players:
            battle.status = "running"
            await battle_repository.update_battle(db, battle)

        await db.commit()

        return battle

    # ==========================================================
    # Leave Battle
    # ==========================================================

    async def leave_battle(
        self,
        db: AsyncSession,
        battle_id: str,
        current_user: User,
    ) -> None:

        participant = await battle_repository.get_participant(db, battle_id, current_user.id)

        if participant is None:
            return

        await battle_repository.remove_participant(db, participant)

        await db.commit()

    # ==========================================================
    # Waiting Battles
    # ==========================================================

    async def waiting_battles(self, db: AsyncSession):
        return await battle_repository.get_waiting_battles(db)

    # ==========================================================
    # Battle Details
    # ==========================================================

    async def get_battle(self, db: AsyncSession, battle_id: str):
        return await battle_repository.get_battle(db, battle_id)

    # ==========================================================
    # Participants
    # ==========================================================

    async def participants(self, db: AsyncSession, battle_id: str):
        return await battle_repository.get_participants(db, battle_id)

    # ==========================================================
    # Join Matchmaking Queue
    # ==========================================================

    async def join_queue(self, db: AsyncSession, current_user: User, request: MatchmakingRequest | None = None):

        active = await battle_repository.get_active_battle_for_user(db, current_user.id)

        if active:
            return {"status": "already_in_battle", "battle_id": active.battle_id}

        request = request or MatchmakingRequest()

        if request.mode == "friend":
            if not request.friend_id:
                raise ValueError("friend_id is required for friend matchmaking.")
            if request.friend_id == current_user.id:
                raise ValueError("Cannot invite yourself.")

            from app.modules.friend.service import friend_service

            friends = await friend_service.get_friends(db, current_user)
            friend_ids = {
                f.friend_id if f.user_id == current_user.id else f.user_id
                for f in friends
            }
            if request.friend_id not in friend_ids:
                raise ValueError("You can only invite confirmed friends.")

            config = battle_config_service.build_config(rating=1200)
            battle = BattleRoom(
                title=f"{current_user.username} vs friend",
                difficulty=request.difficulty or config["difficulty"],
                problem_id=config["problem_id"],
                status="waiting",
                max_players=2,
            )
            battle = await battle_repository.create_battle(db, battle)
            await battle_repository.add_participant(
                db,
                BattleParticipant(
                    battle_id=battle.id,
                    user_id=current_user.id,
                    score=0,
                    rank=1,
                ),
            )
            await db.commit()

            return {"status": "invited", "battle_id": battle.id}

        match = matchmaking_engine.join_queue(user_id=current_user.id)

        players = matchmaking_engine.find_match()

        if players is None:
            return {"status": "waiting", "queue_size": match["queue_size"]}

        config = battle_config_service.build_config(rating=1200)

        battle = BattleRoom(
            title=config["title"],
            difficulty=config["difficulty"],
            problem_id=config["problem_id"],
            status="running",
            max_players=config["max_players"],
        )

        battle = await battle_repository.create_battle(db, battle)

        await battle_repository.add_participant(
            db, BattleParticipant(battle_id=battle.id, user_id=players["player1"].user_id)
        )

        await battle_repository.add_participant(
            db, BattleParticipant(battle_id=battle.id, user_id=players["player2"].user_id)
        )

        await db.commit()

        asyncio.create_task(battle_orchestrator.start_battle(battle.id, config["duration"]))

        return {"status": "matched", "battle_id": battle.id}

    # ==========================================================
    # Leave Queue
    # ==========================================================

    async def leave_queue(self, current_user: User):
        matchmaking_engine.leave_queue(current_user.id)
        return {"message": "Removed from queue."}

    # ==========================================================
    # Update Score
    # ==========================================================

    async def update_score(self, db: AsyncSession, battle_id: str, user_id: str, verdict: str, runtime: int, memory: int):

        participant = await battle_repository.get_participant(db, battle_id, user_id)

        if participant is None:
            return

        participant.score += battle_score_manager.calculate_score(verdict, runtime, memory)

        await battle_repository.update_participant(db, participant)

        players = await battle_repository.get_participants(db, battle_id)

        players = rank_players(players)

        await db.commit()

        await battle_ws.broadcast(
            battle_id,
            BattleEvent.SCORE_UPDATED.value,
            {
                "leaderboard": [
                    {"user_id": p.user_id, "score": p.score, "rank": p.rank} for p in players
                ]
            },
        )

    # ==========================================================
    # Finish Battle
    # ==========================================================

    async def finish_battle(self, db: AsyncSession, battle_id: str):

        battle = await battle_repository.get_battle(db, battle_id)

        if battle is None:
            return

        players = await battle_repository.get_participants(db, battle_id)

        winner = battle_result_engine.determine_winner(players)

        draw = battle_result_engine.is_draw(players)

        battle.status = "finished"

        await battle_repository.update_battle(db, battle)

        await db.commit()

        await battle_ws.broadcast(
            battle_id,
            BattleEvent.BATTLE_FINISHED.value,
            {
                "winner": (None if draw else winner.user_id),
                "draw": draw,
                "leaderboard": [
                    {"user_id": player.user_id, "score": player.score, "rank": player.rank}
                    for player in players
                ],
            },
        )

        return {"winner": None if draw else winner, "draw": draw}


battle_service = BattleService()
