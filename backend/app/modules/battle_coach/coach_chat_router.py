"""
=========================================================
SkillBattle - Placement-Focused AI Coach Chat Router
=========================================================
"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.profile import Profile
from app.models.roadmap import Roadmap, RoadmapWeek, RoadmapTask
from app.models.user_skill_stat import UserSkillStat
from app.models.interview import InterviewSession
from app.modules.ai.provider import ai_provider

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/coach", tags=["AI Coach Chat"])


class ChatRequest(BaseModel):
    message: str


async def get_student_context(db: AsyncSession, user: User) -> dict:
    """
    Aggregates comprehensive student context from Profile, Roadmap, Skill Stats, and Interviews.
    """
    # Profile & Onboarding Preferences
    stmt_prof = select(Profile).where(Profile.user_id == user.id)
    res_prof = await db.execute(stmt_prof)
    profile = res_prof.scalar_one_or_none()

    pref = profile.onboarding_preferences if profile and profile.onboarding_preferences else {}
    target_role = pref.get("target_role") or ""
    target_company = profile.target_company if profile and profile.target_company else ""
    dream_companies = pref.get("dream_companies") or ([target_company] if target_company else [])
    pref_langs = pref.get("preferred_languages") or []
    learning_goals = pref.get("learning_goals") or []
    college = profile.college if profile and profile.college else ""

    # Active Roadmap
    stmt_road = (
        select(Roadmap)
        .where(Roadmap.user_id == user.id, Roadmap.status == "ACTIVE")
        .options(selectinload(Roadmap.weeks).selectinload(RoadmapWeek.tasks))
    )
    res_road = await db.execute(stmt_road)
    roadmaps = res_road.scalars().all()
    active_roadmap = roadmaps[0] if roadmaps else None

    roadmap_title = active_roadmap.title if active_roadmap else ""
    roadmap_progress = active_roadmap.progress if active_roadmap else 0
    
    current_tasks = []
    if active_roadmap and active_roadmap.weeks:
        for week in active_roadmap.weeks:
            for task in week.tasks:
                if not task.completed:
                    current_tasks.append(f"Day {task.day}: {task.topic} ({task.difficulty})")
                if len(current_tasks) >= 3:
                    break
            if len(current_tasks) >= 3:
                break

    # Skill Stats (Weak vs Strong Areas)
    stmt_skills = select(UserSkillStat).where(UserSkillStat.user_id == user.id)
    res_skills = await db.execute(stmt_skills)
    skills = res_skills.scalars().all()

    weak_topics = []
    strong_topics = []
    if skills:
        for s in skills:
            acc = (s.correct_attempts / s.total_attempts * 100) if s.total_attempts > 0 else 0
            if acc < 60:
                weak_topics.append(f"{s.subject} ({acc:.0f}% accuracy)")
            else:
                strong_topics.append(f"{s.subject} ({acc:.0f}% accuracy)")
    
    # Interview Sessions
    stmt_int = select(InterviewSession).where(InterviewSession.user_id == user.id)
    res_int = await db.execute(stmt_int)
    interviews = res_int.scalars().all()
    interview_count = len(interviews)
    avg_interview_score = round(sum(i.overall_score for i in interviews) / interview_count, 1) if interview_count else None

    return {
        "name": user.full_name or user.username,
        "username": user.username,
        "xp": user.xp,
        "level": user.level,
        "college": college,
        "target_role": target_role,
        "target_company": target_company,
        "dream_companies": dream_companies,
        "preferred_languages": pref_langs,
        "learning_goals": learning_goals,
        "roadmap_title": roadmap_title,
        "roadmap_progress": roadmap_progress,
        "current_tasks": current_tasks,
        "weak_topics": weak_topics,
        "strong_topics": strong_topics,
        "interview_count": interview_count,
        "avg_interview_score": avg_interview_score,
    }


@router.post("/chat")
async def chat(
    req: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ctx = await get_student_context(db, current_user)
    
    # Construct AI Provider Prompt with full student context
    prompt = f"""
You are SkillBattle's AI Placement Coach. You provide concise, actionable, highly structured advice to students preparing for software engineering placements.

Student Context:
- Name: {ctx['name']}
- Target Role: {ctx['target_role'] or 'Not specified'}
- Target Company: {ctx['target_company'] or 'Not specified'}
- Dream Companies: {ctx['dream_companies']}
- Preferred Languages: {ctx['preferred_languages']}
- XP: {ctx['xp']} (Level {ctx['level']})
- Active Roadmap: {ctx['roadmap_title'] or 'None'} ({ctx['roadmap_progress']}% complete)
- Current Pending Tasks: {ctx['current_tasks']}
- Weak Areas: {ctx['weak_topics']}
- Strong Areas: {ctx['strong_topics']}
- Mock Interviews Completed: {ctx['interview_count']} (Average Score: {ctx['avg_interview_score'] if ctx['avg_interview_score'] is not None else 'No interviews recorded'})

Only treat listed profile and activity values as known. Do not invent missing student details, skill metrics, or employer hiring processes.

Student Question:
"{req.message}"

Respond using Markdown with bullet points, code snippets where helpful, and directly address the student's question using their real context.
"""

    try:
        reply = await ai_provider.generate(prompt)
        if not reply or len(reply.strip()) < 10:
            raise ValueError("Empty or invalid AI provider response")
    except Exception as err:
        logger.exception("AI Coach provider is unavailable")
        raise HTTPException(
            status_code=503,
            detail="AI Coach is currently unavailable because no working AI provider responded.",
        ) from err

    return {
        "reply": reply,
        "user": current_user.username,
        "student_context": {
            "target_role": ctx["target_role"],
            "target_company": ctx["target_company"],
            "roadmap_progress": ctx["roadmap_progress"],
            "weak_topics": ctx["weak_topics"],
        }
    }
