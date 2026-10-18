from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.challenge import Challenge
from app.models.compiler import CodeSubmission
from app.models.daily_practice import DailyPracticeSession
from app.models.problem import Problem
from app.modules.dashboard.repository import dashboard_repository


def public_problem(problem: Problem, status: str = "unsolved") -> dict:
    return {
        "id": problem.id, "title": problem.title, "slug": problem.slug,
        "difficulty": problem.difficulty, "category": problem.category,
        "xp_reward": problem.xp_reward, "status": status,
        "tags": [tag.tag for tag in getattr(problem, "tags", [])],
    }


async def submission_statuses(
    db: AsyncSession,
    user_id: str,
    problem_ids: list[int] | None = None,
) -> dict[int, str]:
    if problem_ids is not None and not problem_ids:
        return {}

    stmt = select(CodeSubmission.problem_id, CodeSubmission.verdict).where(
        CodeSubmission.user_id == user_id
    )
    if problem_ids is not None:
        stmt = stmt.where(CodeSubmission.problem_id.in_(problem_ids))
    rows = (await db.execute(stmt)).all()
    statuses: dict[int, str] = {}
    for problem_id, verdict in rows:
        statuses[problem_id] = "solved" if verdict == "Accepted" else statuses.get(problem_id, "attempted")
    return statuses


async def choose_daily_problem(db: AsyncSession, user_id: str, challenge: Challenge) -> tuple[Problem | None, bool]:
    base = select(Problem).options(selectinload(Problem.tags)).where(Problem.is_active.is_(True))
    preferred = base.where(
        func.lower(Problem.difficulty) == challenge.difficulty.lower(),
        func.lower(Problem.category) == challenge.category.lower(),
    )
    problems = list((await db.execute(preferred.order_by(Problem.id))).scalars().all())
    if not problems:
        problems = list((await db.execute(base.order_by(Problem.id))).scalars().all())
    if not problems:
        return None, False
    statuses = await submission_statuses(db, user_id)
    unsolved = [problem for problem in problems if statuses.get(problem.id) != "solved"]
    candidates = unsolved or problems
    selected = candidates[date.today().toordinal() % len(candidates)]
    return selected, not bool(unsolved)


async def get_or_start_daily(db: AsyncSession, user_id: str, start: bool) -> dict:
    today = date.today()
    existing = (await db.execute(
        select(DailyPracticeSession).where(
            DailyPracticeSession.user_id == user_id, DailyPracticeSession.session_date == today
        )
    )).scalar_one_or_none()
    if existing:
        problem = (await db.execute(select(Problem).options(selectinload(Problem.tags)).where(Problem.id == existing.problem_id))).scalar_one_or_none()
        return {"available": problem is not None, "session": existing, "problem": public_problem(problem) if problem else None, "is_revision": False}

    challenge = await dashboard_repository.get_daily_challenge(db)
    if not challenge:
        return {"available": False, "reason": "No daily challenge has been configured yet."}
    problem, is_revision = await choose_daily_problem(db, user_id, challenge)
    if not problem:
        return {"available": False, "reason": "No active practice problem matches the current challenge."}
    if not start:
        return {"available": True, "challenge": challenge, "problem": public_problem(problem), "is_revision": is_revision}
    session = DailyPracticeSession(user_id=user_id, session_date=today, challenge_id=challenge.id, problem_id=problem.id)
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return {"available": True, "challenge": challenge, "session": session, "problem": public_problem(problem), "is_revision": is_revision}


async def mark_daily_complete(db: AsyncSession, user_id: str, problem_id: int, submission_id: int) -> None:
    session = (await db.execute(
        select(DailyPracticeSession).where(
            DailyPracticeSession.user_id == user_id,
            DailyPracticeSession.session_date == date.today(),
            DailyPracticeSession.problem_id == problem_id,
            DailyPracticeSession.status == "IN_PROGRESS",
        )
    )).scalar_one_or_none()
    if session:
        session.status = "COMPLETED"
        session.submission_id = submission_id
        session.completed_at = datetime.utcnow()
        await db.commit()
