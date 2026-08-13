"""
=========================================================
SkillBattle - Career Roadmap Router & Placement Track Engine
=========================================================
"""

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.roadmap import Roadmap, RoadmapWeek, RoadmapTask
from app.modules.xp.service import xp_service

router = APIRouter(prefix="/roadmap", tags=["Career Roadmap"])


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
    stmt = select(RoadmapTask).where(RoadmapTask.id == task_id)
    res = await db.execute(stmt)
    task = res.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if not task.completed:
        task.completed = True
        task.completed_at = datetime.utcnow()
        await db.commit()

        # Award XP
        try:
            await xp_service.add_xp(db, current_user, task.reward_xp)
        except Exception:
            pass

    return {"status": "success", "task_id": task_id, "completed": True, "reward_xp": task.reward_xp}
