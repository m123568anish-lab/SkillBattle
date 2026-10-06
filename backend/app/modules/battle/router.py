from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from sqlalchemy import select
import json

from app.database.session import get_db
from app.models.user import User
from app.core.dependencies import get_current_user, get_optional_current_user
from app.models.battle import BattleResult, BattleSubmission

from app.modules.battle.schemas import (
    CreateBattleRequest,
    JoinBattleRequest,
    LeaveBattleRequest,
    BattleResponse,
    BattleParticipantResponse,
    MatchmakingRequest,
    SoloFinishRequest,
    BattleConfigCreate,
    BattleConfigResponse,
    SubmitAnswerRequest,
    BattleSubmissionResponse,
    BattleResultResponse,
)

from app.modules.battle.service import battle_service
from app.modules.battle.config.service import battle_config_service
from app.modules.battle.question_engine import question_engine
from app.modules.battle.websocket import battle_ws
from app.modules.battle.events import BattleEvent
from app.modules.battle.replay import battle_replay_service
from app.modules.battle.timer import battle_timer
from app.modules.battle.repository import battle_repository
from app.modules.company.service import company_service
from app.modules.college.service import college_service

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
# Battle Types & Configs
# ==========================================================

@router.get("/types")
async def get_battle_types():
    return {
        "types": [
            {
                "id": "general",
                "name": "General Competitive Battle",
                "desc": "Standard 1v1 algorithmic duel.",
                "icon": "sword",
            },
            {
                "id": "placement",
                "name": "Hybrid Placement Assessment",
                "desc": "Full placement test with MCQs, Coding, Debugging & Technical Qs.",
                "icon": "trophy",
            },
            {
                "id": "company",
                "name": "Company-Style Assessment",
                "desc": "Assessment based on public company hiring patterns.",
                "icon": "building",
            },
            {
                "id": "college",
                "name": "College Placement Test",
                "desc": "Batch placement assessment configured by placement cells.",
                "icon": "graduation-cap",
            },
            {
                "id": "tournament",
                "name": "Tournament Battle",
                "desc": "High-stakes ranked tournament match.",
                "icon": "medal",
            },
            {
                "id": "practice",
                "name": "Solo Skill Practice",
                "desc": "Self-paced solo practice with MCQs and coding tasks.",
                "icon": "target",
            },
        ]
    }


@router.get("/configs", response_model=list[BattleConfigResponse])
async def list_battle_configs(
    battle_type: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    return await battle_config_service.list_configs(db, battle_type)


@router.post("/config", response_model=BattleConfigResponse)
async def create_battle_config(
    request: BattleConfigCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if request.company_id is not None and request.college_id is not None:
        raise HTTPException(status_code=400, detail="A battle configuration can belong to only one organization.")

    if request.company_id is not None:
        company = await company_service.get_company_for_user(db, current_user)
        if (
            not company
            or company.id != request.company_id
            or company.status != "verified"
            or request.battle_type.value != "company"
            or request.job_id is None
        ):
            raise HTTPException(status_code=403, detail="Verified company staff can configure assessments only for their own jobs.")
    elif request.job_id is not None or request.battle_type.value == "company":
        raise HTTPException(status_code=403, detail="Company assessments must be created by the verified job owner.")

    if request.college_id is not None:
        college = await college_service.get_user_college(db, current_user)
        if (
            not college
            or college.id != request.college_id
            or request.battle_type.value != "college"
        ):
            raise HTTPException(status_code=403, detail="College staff can configure assessments only for their own institution.")
    elif request.battle_type.value == "college":
        raise HTTPException(status_code=403, detail="College assessments require an institution owner.")

    return await battle_config_service.create_config(db, request)


# ==========================================================
# Create / Join / Leave Battle
# ==========================================================

@router.post("/create", response_model=BattleResponse)
async def create_battle(
    request: CreateBattleRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        battle = await battle_service.create_battle(db, current_user, request)
        if battle.questions_data:
            battle.questions_data = question_engine.sanitize_sections_for_client(
                battle.questions_data,
                current_section_index=battle.current_section_index,
                is_completed=False,
            )
        return battle
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/daily", response_model=BattleResponse)
async def get_daily_adaptive_battle(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        battle = await battle_service.get_or_create_daily_battle(db, current_user)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    battle.questions_data = question_engine.sanitize_sections_for_client(
        battle.questions_data,
        current_section_index=battle.current_section_index,
        is_completed=battle.status in ("completed", "finished", "finalized"),
    )
    submissions_result = await db.execute(
        select(BattleSubmission.question_id).where(
            BattleSubmission.battle_id == battle.id,
            BattleSubmission.user_id == current_user.id,
            BattleSubmission.question_id.is_not(None),
        )
    )
    response = BattleResponse.model_validate(battle)
    response.submitted_question_ids = list(submissions_result.scalars().all())
    return response


@router.post("/join", response_model=BattleResponse)
async def join_battle(
    request: JoinBattleRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return await battle_service.join_battle(db, request.battle_id, current_user)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/leave")
async def leave_battle(
    request: LeaveBattleRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await battle_service.leave_battle(db, request.battle_id, current_user)
    return {"message": "Battle left successfully."}


@router.get("/waiting", response_model=list[BattleResponse])
async def waiting_battles(
    db: AsyncSession = Depends(get_db),
):
    return await battle_service.waiting_battles(db)


# ==========================================================
# Battle Details (Sanitized for client)
# ==========================================================

@router.get("/{battle_id}", response_model=BattleResponse)
async def battle_details(
    battle_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    battle = await battle_service.get_battle(db, battle_id)
    if battle is None:
        raise HTTPException(status_code=404, detail="Battle not found.")
    participant = await battle_repository.get_participant(db, battle_id, current_user.id)
    if participant is None and not (current_user.is_superuser or current_user.role.lower() == "admin"):
        raise HTTPException(status_code=404, detail="Battle not found.")

    # Sanitize payload questions if running
    is_completed = battle.status in ("completed", "finished", "finalized")
    if battle.questions_data:
        battle.questions_data = question_engine.sanitize_sections_for_client(
            battle.questions_data,
            current_section_index=battle.current_section_index,
            is_completed=is_completed,
        )

    response = BattleResponse.model_validate(battle)
    submissions_result = await db.execute(
        select(BattleSubmission.question_id).where(
            BattleSubmission.battle_id == battle.id,
            BattleSubmission.user_id == current_user.id,
            BattleSubmission.question_id.is_not(None),
        )
    )
    response.submitted_question_ids = list(submissions_result.scalars().all())
    return response


@router.get("/{battle_id}/participants", response_model=list[BattleParticipantResponse])
async def participants(
    battle_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
):
    battle = await battle_service.get_battle(db, battle_id)
    if battle is None or (
        battle.adaptive_owner_id is not None
        and (current_user is None or current_user.id != battle.adaptive_owner_id)
    ):
        raise HTTPException(status_code=404, detail="Battle not found.")
    return await battle_service.participants(db, battle_id)


# ==========================================================
# Submit Answer (MCQ, Coding, Debugging, Technical)
# ==========================================================

@router.post("/submit-answer", response_model=BattleSubmissionResponse)
async def submit_answer(
    request: SubmitAnswerRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return await battle_service.submit_answer(db, current_user, request)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


# ==========================================================
# Anti-Cheat Telemetry Endpoint
# ==========================================================

@router.post("/{battle_id}/anti-cheat")
async def record_anti_cheat(
    battle_id: str,
    event_type: str = Query(..., description="tab_switch, focus_lost, copy_paste"),
    metadata: dict | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await battle_service.record_anti_cheat_event(
        db, battle_id, current_user, event_type, metadata or {}
    )


# ==========================================================
# Finish Battle & Comprehensive Result
# ==========================================================

@router.post("/{battle_id}/finish")
async def finish_battle(
    battle_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    battle = await battle_service.get_battle(db, battle_id)
    if battle is None:
        raise HTTPException(status_code=404, detail="Battle not found.")
    participant = await battle_repository.get_participant(db, battle_id, current_user.id)
    if participant is None and not (current_user.is_superuser or current_user.role.lower() == "admin"):
        raise HTTPException(status_code=403, detail="Only battle participants or platform admins can finish this battle.")

    try:
        res = await battle_service.finish_battle(db, battle_id)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    if res is None:
        raise HTTPException(status_code=404, detail="Battle not found or already finished.")
    return res


@router.get("/{battle_id}/result", response_model=BattleResultResponse)
async def get_battle_result(
    battle_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    battle = await battle_service.get_battle(db, battle_id)
    if battle is None:
        raise HTTPException(status_code=404, detail="Battle not found.")
    participant = await battle_repository.get_participant(db, battle_id, current_user.id)
    authorized = participant is not None or current_user.is_superuser or current_user.role.lower() == "admin"
    if not authorized and battle.company_id is not None:
        company = await company_service.get_company_for_user(db, current_user)
        authorized = company is not None and str(company.id) == battle.company_id
    if not authorized and battle.college_id is not None:
        college = await college_service.get_user_college(db, current_user)
        authorized = college is not None and str(college.id) == battle.college_id
    if not authorized:
        raise HTTPException(status_code=403, detail="You do not have access to this battle result.")

    stmt = select(BattleResult).where(BattleResult.battle_id == battle_id)
    res = (await db.execute(stmt)).scalar_one_or_none()
    if not res:
        # Generate result on the fly if needed
        try:
            res_data = await battle_service.finish_battle(db, battle_id)
        except ValueError as exc:
            raise HTTPException(status_code=409, detail=str(exc))
        if not res_data:
            raise HTTPException(status_code=404, detail="Battle result not found.")
        res = (await db.execute(stmt)).scalar_one_or_none()

    return res


# ==========================================================
# WebSocket Endpoint with Reconnect & Sync Support
# ==========================================================

@router.websocket("/ws/{battle_id}")
async def battle_socket(
    websocket: WebSocket,
    battle_id: str,
):
    await battle_ws.connect(battle_id, websocket)

    # Broadcast player joined
    await battle_ws.broadcast(
        battle_id,
        BattleEvent.PLAYER_JOINED.value,
        {"players": battle_ws.room_size(battle_id)},
    )

    try:
        while True:
            raw = await websocket.receive_text()
            message = json.loads(raw)
            event = message.get("event")
            data = message.get("data") or {}

            # Handle heartbeats or sync
            if event == "ping":
                await websocket.send_text(json.dumps({"event": "pong"}))
                continue

            await battle_ws.broadcast(battle_id, event, data)

    except WebSocketDisconnect:
        battle_ws.disconnect(battle_id, websocket)
        await battle_ws.broadcast(
            battle_id,
            BattleEvent.PLAYER_LEFT.value,
            {"players": battle_ws.room_size(battle_id)},
        )


# ==========================================================
# Queue & Matchmaking Endpoints
# ==========================================================

@router.post("/queue/join")
async def join_queue(
    request: MatchmakingRequest | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await battle_service.join_queue(db, current_user, request)


@router.get("/queue/status")
async def queue_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
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


@router.post("/queue/leave")
async def leave_queue(
    current_user: User = Depends(get_current_user),
):
    return await battle_service.leave_queue(current_user)


# ==========================================================
# Timer, Replay & Solo Finish
# ==========================================================

@router.get("/{battle_id}/timer")
async def timer(
    battle_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    battle = await battle_service.get_battle(db, battle_id)
    participant = await battle_repository.get_participant(db, battle_id, current_user.id) if battle else None
    if battle is None or (participant is None and not (current_user.is_superuser or current_user.role.lower() == "admin")):
        raise HTTPException(status_code=404, detail="Battle not found.")
    duration_seconds = sum(
        max(0, int(section.get("duration_minutes", 0))) * 60
        for section in (battle.sections_config or [])
    )
    if battle.started_at is not None and duration_seconds:
        elapsed_seconds = max(0, int((datetime.utcnow() - battle.started_at).total_seconds()))
        remaining_seconds = max(0, duration_seconds - elapsed_seconds)
        running = battle.status == "running" and remaining_seconds > 0
    else:
        remaining_seconds = battle_timer.remaining(battle_id)
        running = battle.status == "running" and battle_timer.is_running(battle_id)
    return {
        "remaining_seconds": remaining_seconds,
        "running": running,
    }


@router.get("/{battle_id}/replay")
def replay(battle_id: str, db: Session = Depends(get_db)):
    return battle_replay_service.replay(db, battle_id)


@router.post("/solo/finish")
async def solo_finish(
    request: SoloFinishRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    raise HTTPException(
        status_code=410,
        detail="Client-reported battle results are no longer accepted. Submit answers through a server-created battle.",
    )
