"""
=========================================================
SkillBattle Placement Router
=========================================================
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.modules.placement.catalog_service import list_catalogue, get_track
from app.modules.placement.intelligence_service import (
    get_company_catalog,
    get_company_profile,
    get_question_source_catalog,
    get_topic_taxonomy,
)
from app.modules.placement.question_catalog_service import placement_question_catalog_service

from app.core.dependencies import get_current_admin, get_current_user
from app.models.question import Question
from app.models.user import User

router = APIRouter(
    prefix="/placement",
    tags=["Placement & Career Readiness"],
)

@router.get("/catalogue")
async def catalogue(q: str = "", category: str | None = None, role: str | None = None, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {"items": await list_catalogue(db, q, category, role)}

@router.get("/companies")
async def companies():
    return {"items": get_company_catalog(), "count": len(get_company_catalog())}

@router.get("/company-profiles")
async def company_profiles():
    return {"items": [get_company_profile(company["name"]) for company in get_company_catalog()], "count": len(get_company_catalog())}

@router.get("/profiles")
async def profiles():
    return {"items": [get_company_profile(company["name"]) for company in get_company_catalog()], "count": len(get_company_catalog())}

@router.get("/taxonomy")
async def taxonomy():
    return {"items": get_topic_taxonomy()}

@router.get("/question-sources")
async def question_sources():
    return {"items": get_question_source_catalog()}

async def _list_placement_inventory(
    db: AsyncSession,
    company: str | None = None,
    role: str | None = None,
    topic: str | None = None,
    difficulty: str | None = None,
    question_type: str | None = None,
    source_classification: str | None = None,
    verification_status: str | None = None,
):
    items = await placement_question_catalog_service.list_inventory(
        db,
        company=company,
        role=role,
        topic=topic,
        difficulty=difficulty,
        question_type=question_type,
        source_classification=source_classification,
        verification_status=verification_status,
    )
    return {"items": items, "count": len(items)}

@router.get("/questions")
async def placement_questions(
    company: str | None = None,
    role: str | None = None,
    topic: str | None = None,
    difficulty: str | None = None,
    question_type: str | None = None,
    source_classification: str | None = None,
    verification_status: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await _list_placement_inventory(
        db,
        company=company,
        role=role,
        topic=topic,
        difficulty=difficulty,
        question_type=question_type,
        source_classification=source_classification,
        verification_status=verification_status,
    )

@router.get("/questions/inventory")
async def placement_inventory(
    company: str | None = None,
    role: str | None = None,
    topic: str | None = None,
    difficulty: str | None = None,
    question_type: str | None = None,
    source_classification: str | None = None,
    verification_status: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await _list_placement_inventory(
        db,
        company=company,
        role=role,
        topic=topic,
        difficulty=difficulty,
        question_type=question_type,
        source_classification=source_classification,
        verification_status=verification_status,
    )

@router.post("/questions/generate")
async def generate_placement_question(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    result = await placement_question_catalog_service.ingest_question(db, payload)
    return {"status": result["status"], "question": placement_question_catalog_service.serialize_question(result["question"]) }

@router.post("/questions/validate")
async def validate_placement_question(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    result = await placement_question_catalog_service.ingest_question(db, payload)
    return {"status": result["status"], "validation": result["validation"], "question": placement_question_catalog_service.serialize_question(result["question"]) }

@router.post("/questions/{question_id}/approve")
async def approve_placement_question(
    question_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    question = await db.get(Question, question_id)
    if question is None:
        raise HTTPException(404, "Question not found")
    question.approval_status = "approved"
    question.verification_status = "approved"
    question.lifecycle_state = "APPROVED"
    question.is_validated = True
    question.is_active = True
    await db.commit()
    await db.refresh(question)
    return {"status": "approved", "question": placement_question_catalog_service.serialize_question(question)}

@router.post("/questions/{question_id}/reject")
async def reject_placement_question(
    question_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    question = await db.get(Question, question_id)
    if question is None:
        raise HTTPException(404, "Question not found")
    question.approval_status = "rejected"
    question.verification_status = "rejected"
    question.lifecycle_state = "REJECTED"
    question.is_validated = False
    question.is_active = False
    await db.commit()
    await db.refresh(question)
    return {"status": "rejected", "question": placement_question_catalog_service.serialize_question(question)}

@router.get("/tracks/{track_id}")
async def track(track_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    payload = await get_track(db, track_id)
    if not payload: raise HTTPException(404, "Preparation track not found")
    return payload
