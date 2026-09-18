from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import exists, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.models.question import Question, UserSubmission
from app.models.user import User

logger = logging.getLogger("uvicorn.error")
router = APIRouter(prefix="/api/battle", tags=["Battle Questions"])


def _public_question(question: Question) -> dict:
    return {
        "id": question.id,
        "title": question.title,
        "slug": question.slug,
        "description": question.description,
        "difficulty": question.difficulty,
        "constraints": question.constraints,
        "examples": question.examples or [],
        "company_tags": question.company_tags or [],
    }


@router.get("/next-question")
async def next_question(
    difficulty: str = Query(default="Easy", pattern="^(Easy|Medium|Hard)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    try:
        solved = exists(
            select(UserSubmission.id).where(
                UserSubmission.user_id == current_user.id,
                UserSubmission.question_id == Question.id,
                UserSubmission.solved.is_(True),
            )
        )
        query = (
            select(Question)
            .where(Question.is_active.is_(True), Question.difficulty == difficulty, ~solved)
            .order_by(func.random())
            .limit(1)
        )
        question = (await db.execute(query)).scalar_one_or_none()

        if question is None:
            question = (
                await db.execute(
                    select(Question)
                    .where(Question.is_active.is_(True), ~solved)
                    .order_by(func.random())
                    .limit(1)
                )
            ).scalar_one_or_none()

        if question is None:
            question = (
                await db.execute(
                    select(Question)
                    .where(Question.is_active.is_(True))
                    .order_by(Question.created_at.desc(), func.random())
                    .limit(1)
                )
            ).scalar_one_or_none()

        if question is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active questions are available.")
        return _public_question(question)
    except HTTPException:
        raise
    except Exception:
        logger.exception("Failed to select next question for user_id=%s", current_user.id)
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Question service unavailable.")
