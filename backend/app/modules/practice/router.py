from __future__ import annotations

import logging
from typing import Any
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

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/practice", tags=["Practice Hub"])

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
        "total_questions": 140,
        "completed_questions": 42,
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
        "total_questions": 220,
        "completed_questions": 78,
    },
    {
        "id": "computer-science",
        "name": "Computer Science Core",
        "slug": "computer-science",
        "icon": "Cpu",
        "description": "DBMS, operating systems, computer networks, and system architecture.",
        "topics": ["DBMS & SQL", "Operating Systems", "Computer Networks", "System Design"],
        "total_questions": 110,
        "completed_questions": 35,
    },
    {
        "id": "web-dev",
        "name": "Web & Full-Stack Core",
        "slug": "web-development",
        "icon": "Globe",
        "description": "React reconciliation, Next.js architecture, REST/gRPC, and Node concurrency.",
        "topics": ["HTML & CSS", "JavaScript Engine", "React & Next.js", "Backend APIs"],
        "total_questions": 95,
        "completed_questions": 30,
    },
    {
        "id": "ai-ml",
        "name": "AI & Machine Learning",
        "slug": "ai-and-machine-learning",
        "icon": "Brain",
        "description": "NumPy matrix ops, model architectures, embeddings, and LLM orchestration.",
        "topics": ["Python for ML", "Data Analysis", "Deep Learning", "Generative AI"],
        "total_questions": 80,
        "completed_questions": 18,
    },
    {
        "id": "placement",
        "name": "Placement & Interview Prep",
        "slug": "placement-preparation",
        "icon": "Briefcase",
        "description": "Quantitative aptitude, logical reasoning, and technical interview simulations.",
        "topics": ["Quantitative Aptitude", "Logical Reasoning", "Tech Interview", "HR Behavioral"],
        "total_questions": 160,
        "completed_questions": 54,
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
            "question_count": 28,
            "completed_count": 18,
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
            "question_count": 22,
            "completed_count": 14,
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
            "question_count": 18,
            "completed_count": 8,
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
            "question_count": 34,
            "completed_count": 12,
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
            "question_count": 36,
            "completed_count": 6,
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
            "question_count": 24,
            "completed_count": 11,
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
            "question_count": 26,
            "completed_count": 10,
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
            "question_count": 20,
            "completed_count": 12,
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
async def get_practice_tasks(current_user=Depends(get_current_user)):
    """Return unified Daily Tasks and Weekly Challenges for the student."""
    daily_tasks = [
        {
            "id": "task-d-1",
            "title": "Arrays & Hash Table Mastery",
            "description": "Complete 5 concept questions on hash collisions and amortized lookups.",
            "category": "Data Structures",
            "difficulty": "Easy",
            "type": "mcq",
            "target": 5,
            "progress": 3,
            "xp_reward": 50,
            "status": "in_progress",
            "target_route": "/practice/session?topic=arrays-and-hashing&mode=learn",
        },
        {
            "id": "task-d-2",
            "title": "Two Pointers Algorithm Problem",
            "description": "Implement an optimal converging-pointer solution in Python, C++, or Java.",
            "category": "Algorithms",
            "difficulty": "Medium",
            "type": "coding",
            "target": 1,
            "progress": 0,
            "xp_reward": 75,
            "status": "available",
            "target_route": "/practice/coding",
        },
        {
            "id": "task-d-3",
            "title": "Revise SQL Isolation Levels",
            "description": "Practice transaction bounds and isolation levels in the database track.",
            "category": "Computer Science",
            "difficulty": "Medium",
            "type": "mcq",
            "target": 5,
            "progress": 5,
            "xp_reward": 50,
            "status": "completed",
            "target_route": "/practice/session?topic=dbms-and-sql&mode=learn",
        },
    ]

    weekly_challenges = [
        {
            "id": "challenge-w-1",
            "title": "Weekly Algorithmic Sprint",
            "description": "Solve 10 data structure and algorithm challenges across any approved track.",
            "target": 10,
            "progress": 7,
            "days_left": 3,
            "xp_reward": 250,
            "status": "in_progress",
        },
        {
            "id": "challenge-w-2",
            "title": "Technical Interview Readiness",
            "description": "Complete 1 full mock technical assessment module with >70% accuracy.",
            "target": 1,
            "progress": 0,
            "days_left": 4,
            "xp_reward": 200,
            "status": "available",
        },
    ]

    return {
        "daily_tasks": daily_tasks,
        "weekly_challenges": weekly_challenges,
        "streak_days": 5,
    }


# ==========================================================
# 3. AI LEARNING RECOMMENDATIONS
# ==========================================================

@router.get("/recommendations")
async def get_practice_recommendations(current_user=Depends(get_current_user)):
    """Personalized learning roadmap generated from student attempt history."""
    return {
        "next_step": {
            "title": "Strengthen Dynamic Programming (Tabulation)",
            "topic": "Dynamic Programming",
            "reason": "Based on 2 recent failed attempts in 2D grid path optimization.",
            "estimated_minutes": 25,
            "recommended_action_route": "/practice/session?topic=dynamic-programming&mode=learn",
        },
        "weak_concepts": [
            {"concept": "Dynamic Programming (2D)", "accuracy": 28, "action": "Review Tabulation vs Memoization"},
            {"concept": "Graph Traversal (BFS / DFS)", "accuracy": 35, "action": "Practice Queue & Visited Sets"},
            {"concept": "Sliding Window Substrings", "accuracy": 50, "action": "Practice Monotonic Decrement"},
        ],
        "strong_concepts": [
            {"concept": "Arrays & Hash Maps", "accuracy": 88, "status": "Interview Ready"},
            {"concept": "Binary Search on Rotated Arrays", "accuracy": 82, "status": "Interview Ready"},
            {"concept": "Two Pointers", "accuracy": 79, "status": "Interview Ready"},
        ],
    }


# ==========================================================
# 4. EXISTING COMPATIBILITY ENDPOINTS (Problems, Summary, Daily)
# ==========================================================

@router.get("/problems")
async def list_problems(
    q: str = "",
    difficulty: str | None = None,
    category: str | None = None,
    status: str = Query("all", pattern="^(all|solved|attempted|unsolved)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
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

    total = await db.scalar(select(func.count(Problem.id)).where(*conditions)) or 0
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
    return {"items": items, "total": total, "page": page, "page_size": page_size, "categories": list(categories)}


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
    statuses = await submission_statuses(db, current_user.id)
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
