"""
=========================================================
SkillBattle - Career Roadmap Router & Placement Track Engine
=========================================================
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, ValidationError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.database.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.roadmap import Roadmap, RoadmapWeek, RoadmapTask
from app.modules.xp.service import xp_service
from app.modules.profile.service import profile_service
from app.modules.profile.schemas import ProfileUpdateRequest
from app.modules.career.ai.llm_client import llm_client

router = APIRouter(prefix="/roadmap", tags=["Career Roadmap"])
logger = logging.getLogger(__name__)


# --- Schemas ---

class TaskSchema(BaseModel):
    id: int
    day: int
    topic: str
    difficulty: str
    estimated_minutes: int
    reward_xp: int
    completed: bool
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class WeekSchema(BaseModel):
    id: int
    week_number: int
    title: str
    objective: str
    completion: int
    tasks: List[TaskSchema] = []

    class Config:
        from_attributes = True


class RoadmapSchema(BaseModel):
    id: int
    user_id: str
    title: str
    target_company: str
    duration_weeks: int
    estimated_hours: int
    progress: int
    status: str
    created_at: datetime
    weeks: List[WeekSchema] = []

    class Config:
        from_attributes = True


class CreateRoadmapRequest(BaseModel):
    title: str = Field(..., example="FAANG Coding Preparation")
    target_company: str = Field(..., example="Google")
    duration_weeks: int = Field(default=4, ge=1, le=12)


class OnboardingRoadmapRequest(BaseModel):
    languages: List[str] = Field(min_length=1, max_length=20)
    companies: List[str] = Field(min_length=1, max_length=20)
    level: str = Field(min_length=1, max_length=30)
    confidence: int = Field(ge=0, le=100)
    placement_goal: str = Field(min_length=1, max_length=100)
    graduation_year: int = Field(ge=2000, le=2100)
    goals: List[str] = Field(min_length=1, max_length=20)
    daily_hours: int = Field(ge=1, le=10)

    def preferences(self) -> dict[str, Any]:
        return self.model_dump()


class GeneratedTask(BaseModel):
    day: int = Field(ge=1, le=7)
    topic: str = Field(min_length=3, max_length=200)
    difficulty: str = Field(pattern="^(Easy|Medium|Hard)$")
    estimated_minutes: int = Field(ge=10, le=480)
    reward_xp: int = Field(ge=0, le=1000)


class GeneratedWeek(BaseModel):
    week_number: int = Field(ge=1, le=12)
    title: str = Field(min_length=3, max_length=150)
    objective: str = Field(min_length=3, max_length=500)
    tasks: List[GeneratedTask] = Field(min_length=1, max_length=7)


class GeneratedRoadmap(BaseModel):
    weeks: List[GeneratedWeek] = Field(min_length=1, max_length=12)


class OnboardingRoadmapResponse(BaseModel):
    preferences_saved: bool
    generation_status: str
    roadmap: Optional[RoadmapSchema] = None
    message: Optional[str] = None


# --- Curated Placement Track Generator ---

TRACK_TOPICS = {
    "dsa": [
        ("Arrays & Two Pointers", "Easy", 45, 50),
        ("Sliding Window & Subarrays", "Medium", 60, 75),
        ("Binary Search & Search Space Reduction", "Medium", 60, 75),
        ("Fast & Slow Pointers (Linked Lists)", "Medium", 60, 75),
        ("Monotonic Stack & Priority Queue", "Medium", 75, 80),
        ("Binary Tree Traversals (BFS/DFS)", "Medium", 75, 90),
        ("Binary Search Tree & Lowest Common Ancestor", "Hard", 90, 100),
        ("Graph Topological Sort & Cycle Detection", "Hard", 90, 100),
        ("Shortest Path (Dijkstra) & Disjoint Sets", "Hard", 100, 120),
        ("Dynamic Programming: 1D & 2D Grids", "Hard", 120, 150)
    ],
    "backend": [
        ("RESTful API Architecture & HTTP Status Codes", "Easy", 45, 50),
        ("Database Normalization & Indexing (B-Tree)", "Medium", 60, 75),
        ("Async Programming & Concurrency Control", "Medium", 60, 75),
        ("Authentication: JWT, OAuth2 & Sessions", "Medium", 60, 75),
        ("Caching Strategies: Redis & Cache Invalidation", "Medium", 75, 80),
        ("System Architecture: Microservices & API Gateway", "Hard", 90, 100),
        ("Distributed Rate Limiter & Token Bucket", "Hard", 100, 120)
    ],
    "general": [
        ("Object-Oriented Design & SOLID Principles", "Easy", 45, 50),
        ("SQL Masterclass: Joins, Group By, Subqueries", "Medium", 60, 75),
        ("Operating System: Process vs Thread & Deadlocks", "Medium", 60, 75),
        ("Computer Networks: TCP vs UDP & OSI Model", "Medium", 60, 75),
        ("Behavioral Round: STAR Method & Project Storytelling", "Easy", 45, 50)
    ]
}


def build_roadmap_template(title: str, company: str, weeks_count: int) -> list[dict]:
    title_lower = title.lower()
    if "backend" in title_lower or "system" in title_lower:
        selected_pool = TRACK_TOPICS["backend"] + TRACK_TOPICS["dsa"]
    elif "dsa" in title_lower or "algo" in title_lower or "faang" in title_lower:
        selected_pool = TRACK_TOPICS["dsa"]
    else:
        selected_pool = TRACK_TOPICS["general"] + TRACK_TOPICS["dsa"]
    
    weeks = []
    topic_idx = 0
    for w in range(1, weeks_count + 1):
        w_title = f"Week {w}: {company} Placement Preparation & Drills"
        w_obj = f"Master targeted problem-solving patterns and technical fundamentals required for {company} interviews."
        
        tasks = []
        for day in range(1, 6):  # 5 days per week
            topic_name, diff, est_min, xp = selected_pool[topic_idx % len(selected_pool)]
            tasks.append({
                "day": day,
                "topic": f"Day {day}: {topic_name}",
                "difficulty": diff,
                "estimated_minutes": est_min,
                "reward_xp": xp
            })
            topic_idx += 1
            
        weeks.append({
            "week_number": w,
            "title": w_title,
            "objective": w_obj,
            "tasks": tasks
        })
    return weeks


async def generate_personalized_weeks(
    preferences: dict[str, Any],
    duration_weeks: int,
) -> list[dict[str, Any]]:
    prompt = f"""
Create a practical interview preparation roadmap personalized to this student.
Return ONLY valid JSON with this exact structure:
{{"weeks":[{{"week_number":1,"title":"...","objective":"...","tasks":[{{"day":1,"topic":"...","difficulty":"Easy|Medium|Hard","estimated_minutes":45,"reward_xp":50}}]}}]}}
Return exactly {duration_weeks} weeks, numbered consecutively from 1. Provide five tasks per week, use the student's selected languages and goals, and target their selected companies and placement goal. Respect their current level, confidence, graduation year, and daily study hours. Do not include markdown fences or extra properties.
Student preferences:
{json.dumps(preferences, ensure_ascii=True)}
"""
    last_error: Exception | None = None
    for attempt in range(2):
        try:
            async with asyncio.timeout(25):
                response = await llm_client.generate(prompt, temperature=0.2)
            content = response.strip()
            if content.startswith("```"):
                content = content.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            if not content:
                raise ValueError("AI provider returned an empty roadmap")
            result = GeneratedRoadmap.model_validate_json(content)
            if len(result.weeks) != duration_weeks:
                raise ValueError("AI roadmap has an unexpected number of weeks")
            if [week.week_number for week in result.weeks] != list(range(1, duration_weeks + 1)):
                raise ValueError("AI roadmap week numbers are not consecutive")
            return [week.model_dump() for week in result.weeks]
        except (Exception, ValidationError) as exc:
            last_error = exc
            logger.warning("Roadmap generation attempt %s failed: %s", attempt + 1, exc)

    raise RuntimeError("Roadmap generation failed validation or timed out") from last_error


async def persist_roadmap(
    db: AsyncSession,
    user_id: str,
    title: str,
    company: str,
    duration_weeks: int,
    weeks: list[dict[str, Any]],
    daily_hours: int,
) -> Roadmap:
    roadmap = Roadmap(
        user_id=user_id,
        title=title,
        target_company=company,
        duration_weeks=duration_weeks,
        estimated_hours=duration_weeks * daily_hours * 5,
        progress=0,
        status="ACTIVE",
    )
    db.add(roadmap)
    await db.flush()

    for week_data in weeks:
        week = RoadmapWeek(
            roadmap_id=roadmap.id,
            week_number=week_data["week_number"],
            title=week_data["title"],
            objective=week_data["objective"],
            completion=0,
        )
        db.add(week)
        await db.flush()
        db.add_all(
            [
                RoadmapTask(
                    week_id=week.id,
                    day=task["day"],
                    topic=task["topic"],
                    difficulty=task["difficulty"],
                    estimated_minutes=task["estimated_minutes"],
                    reward_xp=task["reward_xp"],
                    completed=False,
                )
                for task in week_data["tasks"]
            ]
        )

    await db.commit()
    result = await db.execute(
        select(Roadmap)
        .where(Roadmap.id == roadmap.id)
        .options(selectinload(Roadmap.weeks).selectinload(RoadmapWeek.tasks))
    )
    return result.scalar_one()


# --- Endpoints ---

@router.post("/generate", response_model=RoadmapSchema)
async def generate_roadmap(
    req: CreateRoadmapRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    template_weeks = build_roadmap_template(req.title, req.target_company, req.duration_weeks)
    total_hours = req.duration_weeks * 5 * 1.5

    new_roadmap = Roadmap(
        user_id=current_user.id,
        title=req.title,
        target_company=req.target_company,
        duration_weeks=req.duration_weeks,
        estimated_hours=int(total_hours),
        progress=0,
        status="ACTIVE",
    )
    db.add(new_roadmap)
    await db.flush()

    for w_data in template_weeks:
        week_obj = RoadmapWeek(
            roadmap_id=new_roadmap.id,
            week_number=w_data["week_number"],
            title=w_data["title"],
            objective=w_data["objective"],
            completion=0
        )
        db.add(week_obj)
        await db.flush()

        for t_data in w_data["tasks"]:
            task_obj = RoadmapTask(
                week_id=week_obj.id,
                day=t_data["day"],
                topic=t_data["topic"],
                difficulty=t_data["difficulty"],
                estimated_minutes=t_data["estimated_minutes"],
                reward_xp=t_data["reward_xp"],
                completed=False
            )
            db.add(task_obj)

    await db.commit()

    # Re-fetch with relationships
    stmt = (
        select(Roadmap)
        .where(Roadmap.id == new_roadmap.id)
        .options(selectinload(Roadmap.weeks).selectinload(RoadmapWeek.tasks))
    )
    res = await db.execute(stmt)
    return res.scalar_one()


@router.get("/user", response_model=List[RoadmapSchema])
async def get_user_roadmaps(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(Roadmap)
        .where(Roadmap.user_id == current_user.id)
        .options(selectinload(Roadmap.weeks).selectinload(RoadmapWeek.tasks))
        .order_by(Roadmap.created_at.desc())
    )
    res = await db.execute(stmt)
    return res.scalars().all()


@router.post("/onboarding", response_model=OnboardingRoadmapResponse)
async def create_onboarding_roadmap(
    payload: OnboardingRoadmapRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    preferences = payload.preferences()
    company = payload.companies[0]
    profile = await profile_service.update_profile(
        db,
        current_user,
        ProfileUpdateRequest(
            graduation_year=payload.graduation_year,
            target_company=company,
            onboarding_preferences=preferences,
        ),
    )

    existing_result = await db.execute(
        select(Roadmap)
        .where(Roadmap.user_id == current_user.id, Roadmap.status == "ACTIVE")
        .options(selectinload(Roadmap.weeks).selectinload(RoadmapWeek.tasks))
        .order_by(Roadmap.created_at.desc())
        .limit(1)
    )
    existing = existing_result.scalar_one_or_none()
    if existing:
        return OnboardingRoadmapResponse(
            preferences_saved=True,
            generation_status="ready",
            roadmap=RoadmapSchema.model_validate(existing),
        )

    duration_weeks = max(1, min(12, round(20 / payload.daily_hours)))
    title = f"{payload.level} {payload.goals[0]} Preparation"
    try:
        weeks = await generate_personalized_weeks(preferences, duration_weeks)
        roadmap = await persist_roadmap(
            db,
            str(current_user.id),
            title,
            company,
            duration_weeks,
            weeks,
            payload.daily_hours,
        )
    except Exception:
        await db.rollback()
        logger.exception("Could not generate onboarding roadmap for user_id=%s", current_user.id)
        return OnboardingRoadmapResponse(
            preferences_saved=True,
            generation_status="pending",
            message="Your preferences are saved. Roadmap generation is temporarily unavailable; retry when the AI service is available.",
        )

    return OnboardingRoadmapResponse(
        preferences_saved=True,
        generation_status="ready",
        roadmap=RoadmapSchema.model_validate(roadmap),
    )


@router.get("/{roadmap_id}", response_model=RoadmapSchema)
async def get_roadmap(
    roadmap_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(Roadmap)
        .where(Roadmap.id == roadmap_id, Roadmap.user_id == current_user.id)
        .options(selectinload(Roadmap.weeks).selectinload(RoadmapWeek.tasks))
    )
    res = await db.execute(stmt)
    roadmap = res.scalar_one_or_none()
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    return roadmap


@router.put("/task/{task_id}/complete")
async def complete_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(RoadmapTask)
        .join(RoadmapWeek, RoadmapTask.week_id == RoadmapWeek.id)
        .join(Roadmap, RoadmapWeek.roadmap_id == Roadmap.id)
        .where(RoadmapTask.id == task_id, Roadmap.user_id == current_user.id)
        .options(
            selectinload(RoadmapTask.week)
            .selectinload(RoadmapWeek.roadmap)
            .selectinload(Roadmap.weeks)
            .selectinload(RoadmapWeek.tasks)
        )
    )
    res = await db.execute(stmt)
    task = res.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    newly_completed = not task.completed
    if not task.completed:
        task.completed = True
        task.completed_at = datetime.utcnow()
        week = task.week
        week_total = len(week.tasks)
        week_done = sum(1 for week_task in week.tasks if week_task.completed)
        week.completion = round(week_done * 100 / week_total) if week_total else 0

        roadmap = week.roadmap
        roadmap_tasks = [roadmap_task for roadmap_week in roadmap.weeks for roadmap_task in roadmap_week.tasks]
        completed_count = sum(1 for roadmap_task in roadmap_tasks if roadmap_task.completed)
        roadmap.progress = round(completed_count * 100 / len(roadmap_tasks)) if roadmap_tasks else 0
        if roadmap.progress == 100:
            roadmap.status = "COMPLETED"

        await db.commit()

        try:
            await xp_service.add_xp(db, current_user, task.reward_xp)
        except Exception:
            logger.exception("Could not award roadmap task XP for task_id=%s", task_id)

    return {
        "status": "success",
        "task_id": task_id,
        "completed": True,
        "newly_completed": newly_completed,
        "reward_xp": task.reward_xp if newly_completed else 0,
    }
