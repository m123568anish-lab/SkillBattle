from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
)
from app.modules.battle.replay import (
    battle_replay_service,
)
import json

from app.modules.battle.websocket import (
    battle_ws,
    BattleEvent,
)
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.security import get_current_user
from app.models.user import User

from app.modules.battle.schemas import (
    CreateBattleRequest,
    JoinBattleRequest,
    LeaveBattleRequest,
)

from app.modules.battle.service import (
    battle_service,
)

router = APIRouter(
    prefix="/battle",
    tags=["Battle Arena"],
)


@router.get("/health")
async def health() -> dict[str, str]:
    return {"module": "battle", "status": "healthy"}

# ==========================================================
# Create Battle
# ==========================================================

@router.post("/create")
def create_battle(
    request: CreateBattleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    try:

        return battle_service.create_battle(
            db,
            current_user,
            request,
        )

    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


# ==========================================================
# Join Battle
# ==========================================================

@router.post("/join")
def join_battle(
    request: JoinBattleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    try:

        return battle_service.join_battle(
            db,
            request.battle_id,
            current_user,
        )

    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


# ==========================================================
# Leave Battle
# ==========================================================

@router.post("/leave")
def leave_battle(
    request: LeaveBattleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    battle_service.leave_battle(
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

@router.get("/waiting")
def waiting_battles(
    db: Session = Depends(get_db),
):

    return battle_service.waiting_battles(db)


# ==========================================================
# Battle Details
# ==========================================================

@router.get("/{battle_id}")
def battle_details(
    battle_id: str,
    db: Session = Depends(get_db),
):

    battle = battle_service.get_battle(
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

@router.get("/{battle_id}/participants")
def participants(
    battle_id: str,
    db: Session = Depends(get_db),
):

    return battle_service.participants(
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
def join_queue(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return battle_service.join_queue(
        db,
        current_user,
    )


# ==========================================================
# Leave Queue
# ==========================================================

@router.post("/queue/leave")
def leave_queue(
    current_user: User = Depends(get_current_user),
):

    return battle_service.leave_queue(
        current_user,
    )

from app.modules.battle.timer import (
    battle_timer,
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