"""
=========================================================
SkillBattle - Placement-Focused AI Coach Chat Router
=========================================================
"""
import logging
from fastapi import APIRouter, Depends
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
    target_role = pref.get("target_role") or (profile.bio if profile and profile.bio else "Software Engineer")
    target_company = profile.target_company if (profile and profile.target_company) else (pref.get("dream_companies", ["Top Tech Company"])[0] if pref.get("dream_companies") else "Google")
    dream_companies = pref.get("dream_companies") or ([profile.target_company] if profile and profile.target_company else ["Google", "Amazon", "Meta"])
    pref_langs = pref.get("preferred_languages") or ["Python", "C++", "Java"]
    learning_goals = pref.get("learning_goals") or ["Placement Prep", "Data Structures & Algorithms"]
    college = profile.college if profile and profile.college else "Engineering Institute"

    # Active Roadmap
    stmt_road = (
        select(Roadmap)
        .where(Roadmap.user_id == user.id, Roadmap.status == "ACTIVE")
        .options(selectinload(Roadmap.weeks).selectinload(RoadmapWeek.tasks))
    )
    res_road = await db.execute(stmt_road)
    roadmaps = res_road.scalars().all()
    active_roadmap = roadmaps[0] if roadmaps else None

    roadmap_title = active_roadmap.title if active_roadmap else "DSA & System Design Mastery"
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
    
    if not weak_topics:
        weak_topics = ["Dynamic Programming", "Graph Algorithms", "System Design"]
    if not strong_topics:
        strong_topics = ["Arrays & Strings", "Binary Search"]

    # Interview Sessions
    stmt_int = select(InterviewSession).where(InterviewSession.user_id == user.id)
    res_int = await db.execute(stmt_int)
    interviews = res_int.scalars().all()
    interview_count = len(interviews)
    avg_interview_score = round(sum(i.overall_score for i in interviews) / interview_count, 1) if interview_count > 0 else 0.0

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


def generate_context_aware_fallback(message: str, ctx: dict) -> str:
    """
    Intelligent rule-based fallback response engine grounded in exact student metrics.
    """
    m = message.lower().strip()
    name = ctx["name"]
    role = ctx["target_role"]
    company = ctx["target_company"]
    progress = ctx["roadmap_progress"]
    weak_str = ", ".join(ctx["weak_topics"])
    strong_str = ", ".join(ctx["strong_topics"])
    langs_str = ", ".join(ctx["preferred_languages"])
    tasks_str = "\n".join([f"• {t}" for t in ctx["current_tasks"]]) if ctx["current_tasks"] else "• Practice Dynamic Programming (0/1 Knapsack)\n• Implement Graphs (BFS/DFS)\n• Review SQL Window Functions"

    if "study today" in m or "what should i study" in m or "today" in m:
        return (
            f"### 📅 Today's Personal Study Plan for {name}\n\n"
            f"Target Role: **{role}** | Target Company: **{company}**\n\n"
            f"Based on your active roadmap (**{ctx['roadmap_title']}** - **{progress}% complete**), here are your top priorities for today:\n\n"
            f"#### 🎯 Active Roadmap Tasks\n{tasks_str}\n\n"
            f"#### ⚠️ Focus Weak Areas\n"
            f"Your current lower-accuracy topics: **{weak_str}**. We recommend allocating 45 minutes to solve 2 practice problems on these topics.\n\n"
            f"💡 *Tip:* Write clean code in **{langs_str}** and analyze Time/Space complexity before submitting!"
        )

    if "weak" in m or "why am i weak" in m or "improve" in m:
        return (
            f"### 🔍 Weak Topic Analysis for {name}\n\n"
            f"According to your SkillBattle analytics, your weak areas are: **{weak_str}**.\n\n"
            f"#### 💡 Why students struggle with these topics:\n"
            f"1. **State Definition in DP:** Difficulty identifying subproblems and transition formulas `dp[i][j]`.\n"
            f"2. **Graph Traversal Edge Cases:** Forgetting cycle detection (in-degree array in Kahn's algo or visited sets).\n"
            f"3. **Complexity Trade-offs:** Overusing memory instead of in-place algorithms.\n\n"
            f"#### 🚀 Recommended Action Plan:\n"
            f"• Complete 3 Easy-Medium problems on **{ctx['weak_topics'][0]}**.\n"
            f"• Take an **AI Mock Interview** tailored to **{company}** to practice explaining your logic out loud.\n"
            f"• Review past submissions and check optimal $O(N)$ solutions."
        )

    if "practice next" in m or "what next" in m or "next step" in m:
        return (
            f"### 🚀 Next Practice Recommendations for {name}\n\n"
            f"To maximize your readiness for **{company} ({role})**:\n\n"
            f"1. **Top Priority Topic:** Focus on **{ctx['weak_topics'][0]}**.\n"
            f"2. **Daily Drill:** Solve 2 Medium problems using **{langs_str}**.\n"
            f"3. **Mock Interview:** Conduct a 30-minute AI Technical Interview round to test speed and accuracy under pressure.\n"
            f"4. **Roadmap Milestone:** Progress your roadmap **{ctx['roadmap_title']}** beyond current **{progress}%**."
        )

    if "progress" in m or "how am i progressing" in m or "stats" in m:
        return (
            f"### 📊 Student Progress Report: {name}\n\n"
            f"• **Current Level:** Level {ctx['level']} ({ctx['xp']} XP)\n"
            f"• **Target Role & Company:** {role} @ {company}\n"
            f"• **Roadmap Completion:** {progress}% ({ctx['roadmap_title']})\n"
            f"• **AI Mock Interviews Completed:** {ctx['interview_count']} session(s) (Avg Score: {ctx['avg_interview_score']}/100)\n"
            f"• **Strong Topics:** {strong_str}\n"
            f"• **Areas Needing Practice:** {weak_str}\n\n"
            f"🔥 *Keep up your daily streak to climb the SkillBattle Leaderboard!*"
        )

    if "prepare me for" in m or "target company" in m or company.lower() in m:
        return (
            f"### 🎯 Tailored Preparation Strategy for {company}\n\n"
            f"Candidate: **{name}** | Role: **{role}**\n\n"
            f"#### 🏢 {company} Technical Interview Structure:\n"
            f"1. **Online Assessment (OA):** 2 Data Structure & Algorithm questions (90 mins). Focus: Monotonic Stack, Sliding Window, DP.\n"
            f"2. **Technical Round 1 & 2:** Live coding + Data Structure optimization in **{langs_str}**.\n"
            f"3. **System Design / Architecture:** Distributed caching, rate limiters, DB indexing, and microservices.\n"
            f"4. **Behavioral Round:** Leadership principles and STAR method storytelling.\n\n"
            f"#### 📌 Your Immediate Focus:\n"
            f"• Strengthen weak areas: **{weak_str}**.\n"
            f"• Run an **AI Mock Interview** configured for **{company}** in the Interview Room."
        )

    # General structured context-aware breakdown
    return (
        f"### 🤖 SkillBattle AI Coach Response for {name}\n\n"
        f"Here is your personalized guidance for: **\"{message}\"**\n\n"
        f"#### 1. Context & Profile Alignment\n"
        f"• **Target Role:** {role} @ **{company}**\n"
        f"• **Current Progress:** Level {ctx['level']} | Roadmap: {progress}%\n"
        f"• **Preferred Stack:** {langs_str}\n\n"
        f"#### 2. Technical Recommendation\n"
        f"To solve query concepts effectively, always structure your approach into:\n"
        f"1. **Brute Force & Constraints:** Check constraints ($N \\le 10^5$ requires $O(N)$ or $O(N \\log N)$).\n"
        f"2. **Optimal Data Structures:** Select appropriate structures (HashMap $O(1)$, Heap $O(\\log N)$, Graph BFS/DFS).\n"
        f"3. **Complexity & Edge Cases:** Explicitly state Time & Space complexity.\n\n"
        f"#### 3. Recommended Next Step\n"
        f"Work on **{ctx['weak_topics'][0]}** or ask me: *\"What should I study today?\"* or *\"Prepare me for {company}\"*!"
    )


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
- Target Role: {ctx['target_role']}
- Target Company: {ctx['target_company']}
- Dream Companies: {ctx['dream_companies']}
- Preferred Languages: {ctx['preferred_languages']}
- XP: {ctx['xp']} (Level {ctx['level']})
- Active Roadmap: {ctx['roadmap_title']} ({ctx['roadmap_progress']}% complete)
- Current Pending Tasks: {ctx['current_tasks']}
- Weak Areas: {ctx['weak_topics']}
- Strong Areas: {ctx['strong_topics']}
- Mock Interviews Completed: {ctx['interview_count']} (Average Score: {ctx['avg_interview_score']}/100)

Student Question:
"{req.message}"

Respond using Markdown with bullet points, code snippets where helpful, and directly address the student's question using their real context.
"""

    try:
        reply = await ai_provider.generate(prompt)
        if not reply or len(reply.strip()) < 10:
            raise ValueError("Empty or invalid AI provider response")
    except Exception as err:
        logger.warning(f"AI Provider unavailable ({err}). Using context-aware fallback engine.")
        reply = generate_context_aware_fallback(req.message, ctx)

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

