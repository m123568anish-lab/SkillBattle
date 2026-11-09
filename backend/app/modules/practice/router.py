from __future__ import annotations

import logging
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import and_, case, exists, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies import get_current_user
from app.database.session import get_db
from app.models.compiler import CodeSubmission
from app.models.problem import Problem
from app.models.problem_tag import ProblemTag
from app.models.question import Question, UserSubmission
from app.models.streak import Streak
from app.models.user import User
from app.models.user_skill_stat import UserSkillStat
from app.modules.practice.service import get_or_start_daily, public_problem, submission_statuses
from app.modules.problem.quality import problem_can_be_solved_clause
from app.modules.streak.service import streak_service
from app.modules.xp.service import xp_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/practice", tags=["Practice Hub"])


class MCQAnswerRequest(BaseModel):
    question_id: int = Field(gt=0)
    selected_index: int = Field(ge=0)


# ==========================================================
# 1. PRACTICE CATALOG & TOPIC TAXONOMY
# ==========================================================

PRACTICE_CATEGORIES = [
    {
        "id": "programming",
        "name": "Programming Languages",
        "slug": "programming",
        "icon": "Code2",
        "description": "Core syntax, memory models, pointers, and runtime internals.",
        "topics": ["Python", "C++", "Java", "JavaScript", "C"],
    },
    {
        "id": "dsa",
        "name": "Data Structures & Algorithms",
        "slug": "data-structures-and-algorithms",
        "icon": "Layers",
        "description": "Arrays, trees, graphs, dynamic programming, and complexity bounds.",
        "topics": [
            "Arrays & Hashing",
            "Two Pointers",
            "Sliding Window",
            "Linked Lists",
            "Trees & Graphs",
            "Dynamic Programming",
            "Binary Search",
        ],
    },
    {
        "id": "computer-science",
        "name": "Computer Science Core",
        "slug": "computer-science",
        "icon": "Cpu",
        "description": "DBMS, operating systems, computer networks, and system architecture.",
        "topics": ["DBMS & SQL", "Operating Systems", "Computer Networks", "System Design"],
    },
    {
        "id": "web-dev",
        "name": "Web & Full-Stack Core",
        "slug": "web-development",
        "icon": "Globe",
        "description": "React reconciliation, Next.js architecture, REST/gRPC, and Node concurrency.",
        "topics": ["HTML & CSS", "JavaScript Engine", "React & Next.js", "Backend APIs"],
    },
    {
        "id": "ai-ml",
        "name": "AI & Machine Learning",
        "slug": "ai-and-machine-learning",
        "icon": "Brain",
        "description": "NumPy matrix ops, model architectures, embeddings, and LLM orchestration.",
        "topics": ["Python for ML", "Data Analysis", "Deep Learning", "Generative AI"],
    },
    {
        "id": "placement",
        "name": "Placement & Interview Prep",
        "slug": "placement-preparation",
        "icon": "Briefcase",
        "description": "Quantitative aptitude, logical reasoning, and technical interview simulations.",
        "topics": ["Quantitative Aptitude", "Logical Reasoning", "Tech Interview", "HR Behavioral"],
    },
]


@router.get("/categories")
async def get_practice_categories():
    """Return approved category taxonomy for the Practice Hub."""
    return {"categories": PRACTICE_CATEGORIES}


@router.get("/topics")
async def list_practice_topics(
    category: str | None = None,
    difficulty: str | None = None,
    q: str | None = None,
):
    """Return curated topics with question metrics and interview relevance."""
    all_topics = [
        {
            "id": "arrays-hashing",
            "slug": "arrays-and-hashing",
            "name": "Arrays & Hashing",
            "category": "Data Structures & Algorithms",
            "difficulty": "Easy",
            "interview_relevance": "Essential",
            "description": "Hash maps, prefix sums, frequency counting, and linear amortized search.",
            "tags": ["Arrays", "Hash Table", "Prefix Sum"],
        },
        {
            "id": "two-pointers",
            "slug": "two-pointers",
            "name": "Two Pointers Technique",
            "category": "Data Structures & Algorithms",
            "difficulty": "Easy",
            "interview_relevance": "High",
            "description": "Converging bounds, palindrome verification, and fast/slow cyclic detection.",
            "tags": ["Two Pointers", "Sorting", "Strings"],
        },
        {
            "id": "sliding-window",
            "slug": "sliding-window",
            "name": "Sliding Window",
            "category": "Data Structures & Algorithms",
            "difficulty": "Medium",
            "interview_relevance": "High",
            "description": "Fixed and dynamic window optimizations, longest substring, and subarray sums.",
            "tags": ["Sliding Window", "Subarrays", "Optimization"],
        },
        {
            "id": "trees-graphs",
            "slug": "trees-and-graphs",
            "name": "Binary Trees & BST",
            "category": "Data Structures & Algorithms",
            "difficulty": "Medium",
            "interview_relevance": "Essential",
            "description": "Traversals (DFS/BFS), lowest common ancestor, diameter, and BST validation.",
            "tags": ["Trees", "DFS", "BFS", "Recursion"],
        },
        {
            "id": "dynamic-programming",
            "slug": "dynamic-programming",
            "name": "Dynamic Programming (1D & 2D)",
            "category": "Data Structures & Algorithms",
            "difficulty": "Hard",
            "interview_relevance": "High",
            "description": "Memoization, tabulation, state transitions, knapsack, and sequence alignments.",
            "tags": ["DP", "Memoization", "Tabulation"],
        },
        {
            "id": "dbms-sql",
            "slug": "dbms-and-sql",
            "name": "DBMS, SQL & Indexing",
            "category": "Computer Science Core",
            "difficulty": "Medium",
            "interview_relevance": "Essential",
            "description": "B-Tree scans, transaction isolation levels, ACID, and query optimization.",
            "tags": ["SQL", "Indexes", "ACID", "Transactions"],
        },
        {
            "id": "operating-systems",
            "slug": "operating-systems",
            "name": "Operating Systems & Concurrency",
            "category": "Computer Science Core",
            "difficulty": "Medium",
            "interview_relevance": "High",
            "description": "Deadlocks, virtual memory paging, process scheduling, and mutex synchronization.",
            "tags": ["Threads", "Paging", "Deadlock", "Virtual Memory"],
        },
        {
            "id": "react-internals",
            "slug": "react-internals",
            "name": "React Internals & Concurrency",
            "category": "Web & Full-Stack Core",
            "difficulty": "Medium",
            "interview_relevance": "High",
            "description": "Fiber reconciliation, state batching, server components, and lifecycle hooks.",
            "tags": ["React", "JavaScript", "Fiber", "Virtual DOM"],
        },
    ]

    filtered = all_topics
    if category:
        filtered = [t for t in filtered if category.lower() in t["category"].lower()]
    if difficulty:
        filtered = [t for t in filtered if t["difficulty"].lower() == difficulty.lower()]
    if q:
        filtered = [t for t in filtered if q.lower() in t["name"].lower() or q.lower() in t["description"].lower()]

    return {"topics": filtered, "total": len(filtered)}


# ==========================================================
# 2. PRACTICE TASKS & WEEKLY CHALLENGES (MERGED)
# ==========================================================

@router.get("/tasks")
async def get_practice_tasks(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Return the authenticated user's persisted daily assignment."""
    daily = await get_or_start_daily(db, current_user.id, False)
    if daily.get("session"):
        session = daily["session"]
        daily["session"] = {
            "id": session.id,
            "status": session.status,
            "completed_at": session.completed_at,
            "submission_id": session.submission_id,
        }
    return {"daily_assignment": daily, "weekly_challenges": []}


# ==========================================================
# 3. AI LEARNING RECOMMENDATIONS
# ==========================================================

@router.get("/recommendations")
async def get_practice_recommendations(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Recommend an active problem based on this user's recorded attempts."""
    aggregates = (
        await db.execute(
            select(
                Problem.category,
                func.count(CodeSubmission.id),
                func.sum(
                    case((CodeSubmission.verdict == "Accepted", 1), else_=0)
                ),
            )
            .join(CodeSubmission, CodeSubmission.problem_id == Problem.id)
            .where(
                CodeSubmission.user_id == current_user.id,
                Problem.is_active.is_(True),
            )
            .group_by(Problem.category)
        )
    ).all()
    if not aggregates:
        return {"recommendations": [], "message": "Complete a practice submission to receive a recommendation."}

    accepted_problem = select(CodeSubmission.id).where(
        CodeSubmission.user_id == current_user.id,
        CodeSubmission.problem_id == Problem.id,
        CodeSubmission.verdict == "Accepted",
    )
    ranked_categories = sorted(
        aggregates,
        key=lambda row: (int(row[2] or 0) / int(row[1]), -int(row[1])),
    )
    recommendation = None
    for category, attempt_count, accepted_count in ranked_categories:
        recommendation = (
            await db.execute(
                select(Problem)
                .where(
                    Problem.is_active.is_(True),
                    Problem.category == category,
                    ~exists(accepted_problem),
                    problem_can_be_solved_clause(),
                )
                .order_by(Problem.id)
                .limit(1)
            )
        ).scalar_one_or_none()
        if recommendation is not None:
            break
    if recommendation is None:
        return {"recommendations": [], "message": "No unsolved active problems are available in categories with recorded attempts."}

    problem = recommendation
    category, attempt_count, accepted_count = next(
        row for row in ranked_categories if row[0] == problem.category
    )
    accuracy = round(int(accepted_count or 0) / int(attempt_count) * 100)
    return {
        "recommendations": [
            {
                "id": str(problem.id),
                "type": "coding",
                "title": problem.title,
                "category": category or "Uncategorized",
                "difficulty": problem.difficulty,
                "reason": (
                    f"Your recorded acceptance rate in {category or 'this category'} "
                    f"is {accuracy}% across {attempt_count} submissions."
                ),
                "href": f"/practice/coding?problem={problem.id}",
            }
        ],
        "message": None,
    }


# ==========================================================
# 4. EXISTING COMPATIBILITY ENDPOINTS (Problems, Summary, Daily)
# ==========================================================


@router.get("/mcq/questions")
async def list_mcq_questions(
    count: int = Query(5, ge=1, le=20),
    difficulty: str | None = None,
    topic: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    filters = [
        Question.is_active.is_(True),
        Question.question_type == "mcq",
    ]
    if difficulty and difficulty.lower() in {"easy", "medium", "hard"}:
        filters.append(func.lower(Question.difficulty) == difficulty.lower())
    if topic and topic.lower() != "all":
        filters.append(func.lower(Question.skill_category).contains(topic.lower()))

    solved = exists(
        select(UserSubmission.id).where(
            UserSubmission.user_id == current_user.id,
            UserSubmission.question_id == Question.id,
            UserSubmission.solved.is_(True),
        )
    )
    questions = (
        await db.execute(
            select(Question)
            .where(*filters, ~solved)
            .order_by(func.random())
            .limit(count)
        )
    ).scalars().all()
    def option_text(option: Any) -> str:
        if isinstance(option, dict):
            return str(option.get("text") or option.get("key") or "")
        return str(option) if isinstance(option, str) else ""

    return {
        "questions": [
            {
                "id": question.id,
                "question": question.title,
                "code_snippet": None,
                "options": [
                    text for option in (question.options or [])
                    if (text := option_text(option))
                ],
                "concept": question.skill_category,
                "difficulty": question.difficulty,
            }
            for question in questions
        ]
    }


@router.post("/mcq/answer")
async def submit_mcq_answer(
    request: MCQAnswerRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    await db.execute(
        select(User.id).where(User.id == current_user.id).with_for_update()
    )
    question = (
        await db.execute(
            select(Question).where(
                Question.id == request.question_id,
                Question.is_active.is_(True),
                Question.question_type == "mcq",
            )
        )
    ).scalar_one_or_none()
    if question is None:
        raise HTTPException(status_code=404, detail="Practice question not found.")

    options = []
    for index, option in enumerate(question.options or []):
        if isinstance(option, dict):
            text = str(option.get("text") or option.get("key") or "")
            key = str(option.get("key") or index)
        elif isinstance(option, str):
            text = option
            key = chr(65 + index)
        else:
            continue
        if text:
            options.append({"key": key, "text": text})
    if request.selected_index >= len(options):
        raise HTTPException(status_code=422, detail="Selected answer is not available.")

    selected_option = options[request.selected_index]
    correct_value = str(question.correct_option or "").strip().casefold()
    is_correct = correct_value in {
        str(request.selected_index).casefold(),
        str(selected_option.get("key") or "").strip().casefold(),
        str(selected_option.get("text") or "").strip().casefold(),
    }
    existing = (
        await db.execute(
            select(UserSubmission)
            .where(
                UserSubmission.user_id == current_user.id,
                UserSubmission.question_id == question.id,
            )
            .with_for_update()
        )
    ).scalar_one_or_none()
    solved_before = bool(existing and existing.solved)
    if existing is None:
        existing = UserSubmission(
            user_id=current_user.id,
            question_id=question.id,
            language="mcq",
            source_code=str(request.selected_index),
        )
        db.add(existing)
    existing.language = "mcq"
    existing.source_code = str(request.selected_index)
    existing.solved = solved_before or is_correct
    existing.passed_tests = int(existing.passed_tests or 0) + int(is_correct)
    existing.total_tests = int(existing.total_tests or 0) + 1
    existing.execution_time_ms = 0

    skill_stat = (
        await db.execute(
            select(UserSkillStat)
            .where(
                UserSkillStat.user_id == current_user.id,
                UserSkillStat.subject == (question.skill_category or "Uncategorized"),
            )
            .with_for_update()
        )
    ).scalar_one_or_none()
    if skill_stat is None:
        skill_stat = UserSkillStat(
            user_id=current_user.id,
            subject=question.skill_category or "Uncategorized",
            correct_attempts=0,
            total_attempts=0,
        )
        db.add(skill_stat)
    skill_stat.total_attempts += 1
    if is_correct:
        skill_stat.correct_attempts += 1

    xp_earned = 0
    if is_correct:
        if not solved_before:
            xp_earned = 25
            await xp_service.add_xp(
                db,
                current_user,
                xp_earned,
                commit=False,
                source="mcq_correct",
                reference_id=str(question.id),
                description=f"MCQ question {question.id} answered correctly",
            )
        await streak_service.record_activity(
            db,
            current_user.id,
            activity_type="mcq_answer",
            reference_id=str(question.id),
            xp_earned=xp_earned,
            commit=False,
        )

    await db.commit()
    return {
        "correct": is_correct,
        "correct_index": next(
            (
                index for index, option in enumerate(options)
                if str(question.correct_option or "").strip().casefold()
                in {
                    str(index).casefold(),
                    str(option.get("key") or "").strip().casefold(),
                    str(option.get("text") or "").strip().casefold(),
                }
            ),
            -1,
        ),
        "explanation": question.explanation,
        "xp_earned": xp_earned,
        "already_solved": solved_before,
    }


@router.get("/problems")
async def list_problems(
    q: str = "",
    difficulty: str | None = None,
    category: str | None = None,
    topic: str | None = None,
    status: str = Query("all", pattern="^(all|solved|attempted|unsolved)$"),
    sort_by: str = Query("problem_id", pattern="^(problem_id|difficulty)$"),
    ready_only: bool = False,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    conditions = [Problem.is_active.is_(True)]
    if q.strip():
        search_term = f"%{q.strip()}%"
        conditions.append(
            or_(
                and_(
                    problem_can_be_solved_clause(),
                    Problem.title.ilike(search_term),
                ),
                Problem.category.ilike(search_term),
                exists(
                    select(1).where(
                        ProblemTag.problem_id == Problem.id,
                        ProblemTag.tag.ilike(search_term),
                    )
                ),
            )
        )
    if difficulty:
        conditions.append(func.lower(Problem.difficulty) == difficulty.lower())
    if category:
        conditions.append(func.lower(Problem.category) == category.lower())
    if topic:
        conditions.append(
            or_(
                func.lower(Problem.category) == topic.lower(),
                exists(
                    select(1).where(
                        ProblemTag.problem_id == Problem.id,
                        func.lower(ProblemTag.tag) == topic.lower(),
                    )
                ),
            )
        )
    if ready_only:
        conditions.append(problem_can_be_solved_clause())

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
        conditions.append(~exists(accepted_submissions))

    total = await db.scalar(select(func.count(Problem.id)).where(*conditions)) or 0
    active_total = await db.scalar(
        select(func.count(Problem.id)).where(Problem.is_active.is_(True))
    ) or 0
    available_total = await db.scalar(
        select(func.count(Problem.id)).where(
            Problem.is_active.is_(True),
            problem_can_be_solved_clause(),
        )
    ) or 0
    difficulty_order = case(
        (func.lower(Problem.difficulty) == "easy", 1),
        (func.lower(Problem.difficulty) == "medium", 2),
        (func.lower(Problem.difficulty) == "hard", 3),
        else_=4,
    )
    ordering = (
        (difficulty_order.asc(), Problem.id.desc())
        if sort_by == "difficulty"
        else (Problem.id.desc(),)
    )
    page_problems = list(
        (
            await db.execute(
                select(Problem)
                .options(selectinload(Problem.tags))
                .where(*conditions)
                .order_by(*ordering)
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        )
        .scalars()
        .all()
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
    categories = (
        await db.execute(
            select(Problem.category).where(Problem.is_active.is_(True)).distinct().order_by(Problem.category)
        )
    ).scalars().all()
    topics = (
        await db.execute(
            select(ProblemTag.tag)
            .join(Problem, ProblemTag.problem_id == Problem.id)
            .where(Problem.is_active.is_(True))
            .distinct()
            .order_by(ProblemTag.tag)
        )
    ).scalars().all()
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "categories": list(categories),
        "topics": list(topics),
        "available_total": available_total,
        "needs_repair_total": max(active_total - available_total, 0),
    }


@router.get("/problems/{problem_id}")
async def get_problem(
    problem_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    problem = (
        await db.execute(
            select(Problem)
            .options(
                selectinload(Problem.test_cases),
                selectinload(Problem.starter_codes),
                selectinload(Problem.tags),
            )
            .where(Problem.id == problem_id, Problem.is_active.is_(True))
        )
    ).scalar_one_or_none()
    if not problem:
        raise HTTPException(404, "Practice problem not found")
    item = public_problem(problem, (await submission_statuses(db, current_user.id)).get(problem.id, "unsolved"))
    item.update(
        {
            "description": problem.description,
            "input_format": problem.input_format,
            "output_format": problem.output_format,
            "constraints": problem.constraints,
            "explanation": problem.explanation,
            "time_limit": problem.time_limit,
            "memory_limit": problem.memory_limit,
            "starter_codes": {code.language: code.code for code in problem.starter_codes},
            "samples": [
                {
                    "input": case.input_data,
                    "output": case.expected_output,
                    "explanation": case.explanation,
                }
                for case in problem.test_cases
                if not case.is_hidden
            ],
        }
    )
    return item


@router.get("/summary")
async def summary(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    rows = (
        await db.execute(
            select(CodeSubmission.problem_id, CodeSubmission.verdict)
            .join(Problem, Problem.id == CodeSubmission.problem_id)
            .where(
                CodeSubmission.user_id == current_user.id,
                Problem.is_active.is_(True),
                problem_can_be_solved_clause(),
            )
        )
    ).all()
    statuses: dict[int, str] = {}
    for problem_id, verdict in rows:
        statuses[problem_id] = "solved" if verdict == "Accepted" else statuses.get(problem_id, "attempted")
    solved = sum(value == "solved" for value in statuses.values())
    attempted = len(statuses)
    return {
        "solved": solved,
        "attempted": attempted,
        "accuracy": round((solved / attempted) * 100) if attempted else None,
    }


@router.get("/daily")
async def daily(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    payload = await get_or_start_daily(db, current_user.id, False)
    streak = (
        await db.execute(
            select(Streak.current_streak)
            .where(Streak.user_id == current_user.id)
            .order_by(Streak.id.desc())
            .limit(1)
        )
    ).scalar_one_or_none() or 0
    payload["streak"] = streak
    return payload


@router.post("/daily/start")
async def start_daily(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    payload = await get_or_start_daily(db, current_user.id, True)
    if not payload["available"]:
        raise HTTPException(409, payload["reason"])
    return payload
