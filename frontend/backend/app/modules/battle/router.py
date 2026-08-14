from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect

from sqlalchemy.ext.asyncio import AsyncSession
import json
from sqlalchemy.orm import Session

from app.database.session import get_db

from app.models.user import User

from app.core.dependencies import (
    get_current_user,
)

from app.modules.battle.schemas import (
    CreateBattleRequest,
    JoinBattleRequest,
    LeaveBattleRequest,
    BattleResponse,
    BattleParticipantResponse,
    MatchmakingRequest,
    SoloFinishRequest,
)

from app.modules.battle.service import (
    battle_service,
)

from app.modules.battle.websocket import (
    battle_ws,
    BattleEvent,
)

from app.modules.battle.replay import (
    battle_replay_service,
)

from app.modules.battle.timer import (
    battle_timer,
)

router = APIRouter(
    prefix="/battle",
    tags=["Battle"],
)

@router.get("/health")
async def health():

    return {
        "module": "Battle",
        "status": "healthy",
    }
# ==========================================================
# Create Battle
# ==========================================================

@router.post(
    "/create",
    response_model=BattleResponse,
)
async def create_battle(

    request: CreateBattleRequest,

    db: AsyncSession = Depends(get_db),

    current_user: User = Depends(
        get_current_user,
    ),

):

    try:

        return await battle_service.create_battle(

            db,

            current_user,

            request,

        )

    except ValueError as exc:

        raise HTTPException(

            status_code=400,

            detail=str(exc),

        )
# ==========================================================
# Join Battle
# ==========================================================

@router.post(
    "/join",
    response_model=BattleResponse,
)
async def join_battle(

    request: JoinBattleRequest,

    db: AsyncSession = Depends(get_db),

    current_user: User = Depends(
        get_current_user,
    ),

):

    try:

        return await battle_service.join_battle(

            db,

            request.battle_id,

            current_user,

        )

    except ValueError as exc:

        raise HTTPException(

            status_code=400,

            detail=str(exc),

        )
# ==========================================================
# Leave Battle
# ==========================================================

@router.post("/leave")
async def leave_battle(

    request: LeaveBattleRequest,

    db: AsyncSession = Depends(get_db),

    current_user: User = Depends(
        get_current_user,
    ),

):

    await battle_service.leave_battle(

        db,

        request.battle_id,

        current_user,

    )

    return {

        "message": "Battle left successfully."

    }
# ==========================================================
# Waiting Battles
# ==========================================================
@router.get(
    "/waiting",
    response_model=list[BattleResponse],
)
async def waiting_battles(

    db: AsyncSession = Depends(get_db),

):

    return await battle_service.waiting_battles(db)
# ==========================================================
# Battle Details
# ==========================================================
@router.get(
    "/{battle_id}",
    response_model=BattleResponse,
)
async def battle_details(

    battle_id: str,

    db: AsyncSession = Depends(get_db),

):

    battle = await battle_service.get_battle(

        db,

        battle_id,

    )

    if battle is None:

        raise HTTPException(

            status_code=404,

            detail="Battle not found.",

        )

    return battle
# ==========================================================
# Participants
# ==========================================================

@router.get(
    "/{battle_id}/participants",
    response_model=list[BattleParticipantResponse],
)
async def participants(

    battle_id: str,

    db: AsyncSession = Depends(get_db),

):

    return await battle_service.participants(

        db,

        battle_id,

    )
# ==========================================================
# Battle WebSocket
# ==========================================================

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

        }

    )

    try:

        while True:

            raw = await websocket.receive_text()

            message = json.loads(raw)

            event = message.get("event")

            data = message.get("data")

            await battle_ws.broadcast(

                battle_id,

                event,

                data,

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

            }

        )

        # ==========================================================
# Join Queue
# ==========================================================

@router.post("/queue/join")
async def join_queue(

    request: MatchmakingRequest | None = None,

    db: AsyncSession = Depends(get_db),

    current_user: User = Depends(
        get_current_user,
    ),

):

    return await battle_service.join_queue(

        db,

        current_user,

        request,

    )


@router.get("/queue/status")
async def queue_status(

    db: AsyncSession = Depends(get_db),

    current_user: User = Depends(
        get_current_user,
    ),

):
    from app.modules.battle.matchmaking.engine import matchmaking_engine

    active = await battle_repository.get_active_battle_for_user(db, current_user.id)
    status = {
        "matched": active is not None,
        "queue_size": matchmaking_engine.queue_size(),
    }
    if active is not None:
        status["battle_id"] = active.battle_id
    return status

# ==========================================================
# Leave Queue
# ==========================================================

@router.post("/queue/leave")
async def leave_queue(

    current_user: User = Depends(
        get_current_user,
    ),

):

    return await battle_service.leave_queue(

        current_user,

    )
# ==========================================================
# Remaining Time
# ==========================================================

@router.get("/{battle_id}/timer")
def timer(
    battle_id: str,
):

    return {

        "remaining_seconds":

        battle_timer.remaining(

            battle_id,

        ),

        "running":

        battle_timer.is_running(

            battle_id,

        ),

    }

# ==========================================================
# Battle Replay
# ==========================================================

@router.get("/{battle_id}/replay")
def replay(
    battle_id: str,
    db: Session = Depends(get_db),
):

    return battle_replay_service.replay(

        db,

        battle_id,

    )
from sqlalchemy import select
from app.models.user_skill_stat import UserSkillStat
from app.models.xp import XP

@router.post("/solo/finish")
async def solo_finish(
    request: SoloFinishRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Add XP
    result = await db.execute(select(XP).where(XP.user_id == current_user.id))
    xp_record = result.scalar_one_or_none()
    if not xp_record:
        xp_record = XP(user_id=current_user.id, total_xp=0, weekly_xp=0)
        db.add(xp_record)
    
    xp_record.total_xp += request.xp_earned
    xp_record.weekly_xp += request.xp_earned
    
    # Track Skills
    for res in request.mcq_results:
        stmt = select(UserSkillStat).where(
            UserSkillStat.user_id == current_user.id,
            UserSkillStat.subject == res.category
        )
        stat = (await db.execute(stmt)).scalar_one_or_none()
        
        if not stat:
            stat = UserSkillStat(
                user_id=current_user.id,
                subject=res.category,
                correct_attempts=0,
                total_attempts=0
            )
            db.add(stat)
            
        stat.total_attempts += 1
        if res.correct:
            stat.correct_attempts += 1
            
    await db.commit()
    return {"status": "success", "xp_added": request.xp_earned}
