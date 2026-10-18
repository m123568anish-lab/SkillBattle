from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import exists, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.models.compiler import CodeSubmission
from app.models.problem import Problem
from app.models.streak import Streak
from app.modules.practice.service import get_or_start_daily, public_problem, submission_statuses

router = APIRouter(prefix="/practice", tags=["Practice"])


@router.get("/problems")
async def list_problems(
    q: str = "", difficulty: str | None = None, category: str | None = None,
    status: str = Query("all", pattern="^(all|solved|attempted|unsolved)$"),
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user),
):
    conditions = [Problem.is_active.is_(True)]
    if q.strip():
        conditions.append(Problem.title.ilike(f"%{q.strip()}%"))
    if difficulty:
        conditions.append(func.lower(Problem.difficulty) == difficulty.lower())
    if category:
        conditions.append(func.lower(Problem.category) == category.lower())

    user_submissions = select(CodeSubmission.id).where(
        CodeSubmission.user_id == current_user.id,
        CodeSubmission.problem_id == Problem.id,
    )
    accepted_submissions = user_submissions.where(CodeSubmission.verdict == "Accepted")
    if status == "solved":
        conditions.append(exists(accepted_submissions))
    elif status == "attempted":
        conditions.extend((exists(user_submissions), ~exists(accepted_submissions)))
    elif status == "unsolved":
        conditions.append(~exists(user_submissions))

    total = await db.scalar(
        select(func.count(Problem.id)).where(*conditions)
    ) or 0
    page_problems = list(
        (
            await db.execute(
                select(Problem)
                .options(selectinload(Problem.tags))
                .where(*conditions)
                .order_by(Problem.id.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        ).scalars().all()
    )
    statuses = await submission_statuses(
        db,
        current_user.id,
        [problem.id for problem in page_problems],
    )
    items = [
        public_problem(problem, statuses.get(problem.id, "unsolved"))
        for problem in page_problems
    ]
    categories = (await db.execute(select(Problem.category).where(Problem.is_active.is_(True)).distinct().order_by(Problem.category))).scalars().all()
    return {"items": items, "total": total, "page": page, "page_size": page_size, "categories": list(categories)}


@router.get("/problems/{problem_id}")
async def get_problem(problem_id: int, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    problem = (await db.execute(select(Problem).options(selectinload(Problem.test_cases), selectinload(Problem.starter_codes), selectinload(Problem.tags)).where(Problem.id == problem_id, Problem.is_active.is_(True)))).scalar_one_or_none()
    if not problem: raise HTTPException(404, "Practice problem not found")
    item = public_problem(problem, (await submission_statuses(db, current_user.id)).get(problem.id, "unsolved"))
    item.update({
        "description": problem.description, "input_format": problem.input_format, "output_format": problem.output_format,
        "constraints": problem.constraints, "explanation": problem.explanation, "time_limit": problem.time_limit,
        "memory_limit": problem.memory_limit, "starter_codes": {code.language: code.code for code in problem.starter_codes},
        "samples": [{"input": case.input_data, "output": case.expected_output, "explanation": case.explanation} for case in problem.test_cases if not case.is_hidden],
    })
    return item


@router.get("/summary")
async def summary(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    statuses = await submission_statuses(db, current_user.id)
    solved = sum(value == "solved" for value in statuses.values()); attempted = len(statuses)
    return {"solved": solved, "attempted": attempted, "accuracy": round((solved / attempted) * 100) if attempted else None}


@router.get("/daily")
async def daily(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    payload = await get_or_start_daily(db, current_user.id, False)
    streak = (await db.execute(select(Streak.current_streak).where(Streak.user_id == current_user.id).order_by(Streak.id.desc()).limit(1))).scalar_one_or_none() or 0
    payload["streak"] = streak
    return payload


@router.post("/daily/start")
async def start_daily(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    payload = await get_or_start_daily(db, current_user.id, True)
    if not payload["available"]: raise HTTPException(409, payload["reason"])
    return payload
