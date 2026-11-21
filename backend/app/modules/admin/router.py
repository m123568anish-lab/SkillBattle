"""
=========================================================

SkillBattle

Admin Router

=========================================================
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select, text
from sqlalchemy.exc import SQLAlchemyError

from app.database.session import get_db
from app.models.user import User
from app.core.dependencies import get_current_admin
from app.modules.admin.schemas import (
    DailyChallengeCreate,
    DailyChallengeResponse,
    AdminUserUpdate,
    AdminUserResponse,
    BattleLogItem,
    BattleSettings,
)
from app.modules.admin.service import admin_service
from app.models.assessment_engine import AssessmentAttempt
from app.models.battle.battle_room import BattleRoom
from app.models.placement_jobs import PlacementInventoryTarget, PlacementJob, PlacementSourceRecord
from app.models.question import Question
from app.models.user import User
from app.core.config import settings
from app.modules.ai.provider import ai_provider
from app.modules.placement.job_service import placement_job_service

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


@router.post(
    "/daily-challenge",
    response_model=DailyChallengeResponse,
)
async def set_daily_challenge(
    payload: DailyChallengeCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    return await admin_service.set_daily_challenge(db, payload)


@router.get(
    "/users",
    response_model=List[AdminUserResponse],
)
async def list_users(
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    return await admin_service.list_users(db, limit=limit, offset=offset)


@router.put(
    "/users/{user_id}",
    response_model=AdminUserResponse,
)
async def update_user(
    user_id: str,
    payload: AdminUserUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    try:
        updated = await admin_service.update_user(db, user_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return updated


@router.delete(
    "/users/{user_id}",
)
async def deactivate_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    success = await admin_service.delete_user(db, user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return {"message": "User deactivated successfully"}


@router.get(
    "/battle-logs",
    response_model=List[BattleLogItem],
)
async def get_battle_logs(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    return await admin_service.get_battle_logs(db, limit=limit)


@router.get(
    "/settings",
    response_model=BattleSettings,
)
async def get_settings(
    admin: User = Depends(get_current_admin),
):
    return await admin_service.get_settings()


@router.put(
    "/settings",
    response_model=BattleSettings,
)
async def update_settings(
    payload: BattleSettings,
    admin: User = Depends(get_current_admin),
):
    return await admin_service.update_settings(payload)


@router.get("/system-health")
async def get_system_health(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    database_status = "healthy"
    migration_version = "baseline"
    try:
        await db.execute(text("SELECT 1"))
        try:
            migration_version = (await db.scalar(text("SELECT version_num FROM alembic_version LIMIT 1"))) or "baseline"
        except SQLAlchemyError:
            migration_version = "baseline"
    except SQLAlchemyError:
        database_status = "unhealthy"
        await db.rollback()
        migration_version = "baseline"
    if not migration_version:
        migration_version = "baseline"

    total_users = await db.scalar(select(func.count()).select_from(User))
    active_users = await db.scalar(
        select(func.count()).select_from(User).where(User.is_active.is_(True))
    )
    assessment_count = await db.scalar(
        select(func.count()).select_from(AssessmentAttempt)
    )
    active_battles = await db.scalar(
        select(func.count()).select_from(BattleRoom).where(BattleRoom.status.in_(["waiting", "active", "running"]))
    )
    completed_battles = await db.scalar(
        select(func.count()).select_from(BattleRoom).where(BattleRoom.status == "completed")
    )

    ai_providers = {
        "openai": bool(settings.OPENAI_API_KEY),
        "anthropic": bool(settings.ANTHROPIC_API_KEY),
        "gemini": bool(settings.GEMINI_API_KEY),
        "deepseek": bool(settings.DEEPSEEK_API_KEY),
    }
    return {
        "api": "healthy",
        "database": database_status,
        "migration_version": migration_version,
        "total_users": int(total_users or 0),
        "active_users": int(active_users or 0),
        "assessment_attempts": int(assessment_count or 0),
        "active_battles": int(active_battles or 0),
        "completed_battles": int(completed_battles or 0),
        "ai_providers": ai_providers,
        "websocket": "initialized",
        "failed_jobs": None,
        "notification_queue": "not_configured",
    }


@router.get("/placement-intelligence")
async def get_placement_intelligence_summary(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    approved_questions = await db.scalar(
        select(func.count()).select_from(Question).where(
            Question.is_validated.is_(True),
            Question.is_active.is_(True),
            Question.approval_status == "approved",
            Question.lifecycle_state.in_(["APPROVED", "PUBLISHED"]),
        )
    )
    pending_review = await db.scalar(
        select(func.count()).select_from(Question).where(
            Question.verification_status == "needs_review"
        )
    )
    duplicate_candidates = await db.scalar(
        select(func.count()).select_from(Question).where(
            Question.duplicate_of_id.is_not(None)
        )
    )
    queued_jobs = await db.scalar(select(func.count()).select_from(PlacementJob).where(PlacementJob.status == "queued"))
    running_jobs = await db.scalar(select(func.count()).select_from(PlacementJob).where(PlacementJob.status == "running"))
    failed_jobs = await db.scalar(select(func.count()).select_from(PlacementJob).where(PlacementJob.status == "failed"))
    successful_sources = await db.scalar(select(func.count()).select_from(PlacementSourceRecord).where(PlacementSourceRecord.processed.is_(True)))
    last_successful_source = await db.scalar(
        select(PlacementSourceRecord.discovered_at)
        .where(PlacementSourceRecord.processed.is_(True))
        .order_by(PlacementSourceRecord.discovered_at.desc())
        .limit(1)
    )
    job_retry_history = await db.scalar(
        select(func.sum(PlacementJob.retry_count)).select_from(PlacementJob)
    )
    inventory_by_company = await db.execute(
        select(Question.company, func.count(Question.id)).where(Question.is_validated.is_(True), Question.is_active.is_(True), Question.approval_status == "approved", Question.lifecycle_state.in_(["APPROVED", "PUBLISHED"])).group_by(Question.company)
    )
    inventory_by_topic = await db.execute(
        select(Question.topic, func.count(Question.id)).where(Question.is_validated.is_(True), Question.is_active.is_(True), Question.approval_status == "approved", Question.lifecycle_state.in_(["APPROVED", "PUBLISHED"])).group_by(Question.topic)
    )
    inventory_by_difficulty = await db.execute(
        select(Question.difficulty, func.count(Question.id)).where(Question.is_validated.is_(True), Question.is_active.is_(True), Question.approval_status == "approved", Question.lifecycle_state.in_(["APPROVED", "PUBLISHED"])).group_by(Question.difficulty)
    )
    failed_job_rows = await db.execute(
        select(PlacementJob)
        .where(PlacementJob.status == "failed")
        .order_by(PlacementJob.updated_at.desc())
        .limit(10)
    )
    source_rows = await db.execute(
        select(PlacementSourceRecord)
        .order_by(PlacementSourceRecord.discovered_at.desc())
        .limit(10)
    )
    inventory_targets = (
        await db.execute(select(PlacementInventoryTarget).where(PlacementInventoryTarget.target_count > 0))
    ).scalars().all()
    shortages = []
    for target in inventory_targets:
        current_count = await db.scalar(
            select(func.count()).select_from(Question).where(
                Question.is_validated.is_(True),
                Question.is_active.is_(True),
                Question.lifecycle_state.in_(["APPROVED", "PUBLISHED"]),
                Question.company == target.company,
                Question.role == target.role,
                Question.topic == target.topic,
                Question.difficulty == target.difficulty,
                Question.question_type == target.question_type,
                Question.approval_status == "approved",
            )
        )
        missing = max(0, target.target_count - int(current_count or 0))
        if missing:
            shortages.append({
                "company": target.company,
                "role": target.role,
                "topic": target.topic,
                "difficulty": target.difficulty,
                "question_type": target.question_type,
                "target": target.target_count,
                "current": int(current_count or 0),
                "missing": missing,
            })
    return {
        "total_approved_questions": int(approved_questions or 0),
        "pending_review_count": int(pending_review or 0),
        "duplicate_candidates": int(duplicate_candidates or 0),
        "job_queue_status": {
            "queued": int(queued_jobs or 0),
            "running": int(running_jobs or 0),
            "failed": int(failed_jobs or 0),
        },
        "retry_history": int(job_retry_history or 0),
        "last_successful_source_scan": last_successful_source.isoformat() if last_successful_source else None,
        "source_records_processed": int(successful_sources or 0),
        "inventory_by_company": [{"company": company, "count": int(count)} for company, count in inventory_by_company.all()],
        "inventory_by_topic": [{"topic": topic, "count": int(count)} for topic, count in inventory_by_topic.all()],
        "inventory_by_difficulty": [{"difficulty": difficulty, "count": int(count)} for difficulty, count in inventory_by_difficulty.all()],
        "inventory_shortages": shortages,
        "recent_failed_jobs": [
            {
                "id": job.id,
                "type": job.job_type,
                "retry_count": job.retry_count,
                "max_retries": job.max_retries,
                "error_details": job.error_details,
                "updated_at": job.updated_at.isoformat(),
            }
            for job in failed_job_rows.scalars().all()
        ],
        "recent_sources": [
            {
                "id": source.id,
                "source_url": source.source_url,
                "company": source.company,
                "role": source.role,
                "title": source.title,
                "discovered_at": source.discovered_at.isoformat(),
                "processed": source.processed,
            }
            for source in source_rows.scalars().all()
        ],
    }


@router.get("/placement-provider-health")
async def get_placement_provider_health(admin: User = Depends(get_current_admin)):
    return await ai_provider.health_check()


@router.post("/placement-jobs/{job_id}/retry")
async def retry_placement_job(
    job_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    try:
        job = await placement_job_service.retry_job(db, job_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return {
        "id": job.id,
        "status": job.status,
        "retry_count": job.retry_count,
        "max_retries": job.max_retries,
    }
