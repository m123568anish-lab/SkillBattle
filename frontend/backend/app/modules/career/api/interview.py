"""
=========================================================
SkillBattle - AI Mock Interview Router & Evaluation Engine
=========================================================
"""

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.interview import InterviewSession, InterviewQuestion, InterviewAnswer
from app.modules.xp.service import xp_service

router = APIRouter(prefix="/interview", tags=["Career AI Mock Interview"])


# --- Schemas ---

class StartInterviewRequest(BaseModel):
    company: str = Field(default="General", example="General")
    role: str = Field(default="Software Engineer", example="Backend Engineer")
    interview_type: str = Field(default="Technical", example="Technical")
    difficulty: str = Field(default="Medium", example="Medium")


class SubmitAnswerRequest(BaseModel):
    question_id: int
    answer: str


class AnswerSchema(BaseModel):
    id: int
    question_id: int
    answer: str
    feedback: str
    score: float
    created_at: datetime

    class Config:
        from_attributes = True


class QuestionSchema(BaseModel):
    id: int
    sequence: int
    question: str
    expected_topics: str
    difficulty: str
    answers: List[AnswerSchema] = []

    class Config:
        from_attributes = True


class InterviewSessionSchema(BaseModel):
    id: int
    user_id: str
    company: str
    role: str
    interview_type: str
    difficulty: str
    total_questions: int
    overall_score: float
    status: str
    started_at: datetime
    finished_at: Optional[datetime] = None
    questions: List[QuestionSchema] = []

    class Config:
        from_attributes = True


# --- Placement Questions Bank Generator ---

DEFAULT_QUESTIONS = [
    {
        "sequence": 1,
        "question": "Explain how you would optimize a slow database query with millions of rows. Discuss indexing, EXPLAIN, and partitioning.",
        "expected_topics": "B-Tree Indexing, Composite Index, Query Execution Plan, Sharding, Caching",
        "difficulty": "Medium"
    },
    {
        "sequence": 2,
        "question": "Explain Kadane's Algorithm for Maximum Subarray Sum. What is the time and space complexity?",
        "expected_topics": "Dynamic Programming, Sliding Window, O(N) Time, O(1) Space",
        "difficulty": "Easy"
    },
    {
        "sequence": 3,
        "question": "Compare Process vs Thread in Operating Systems. How does context switching differ?",
        "expected_topics": "Process Isolation, Shared Memory, Stack vs Heap, Context Switch Overhead",
        "difficulty": "Medium"
    }
]


def generate_interview_questions(company: str, role: str, difficulty: str) -> list[dict]:
    # The available question set is general practice content, not an employer's
    # official or verified interview question bank.
    return DEFAULT_QUESTIONS


# --- Placement Answer Evaluation Engine ---

def evaluate_answer_accurately(question: str, expected_topics_str: str, student_answer: str) -> tuple[float, str]:
    text = student_answer.lower().strip()
    words = text.split()
    word_count = len(words)

    if word_count < 10:
        return 35.0, "Answer is too brief. In placement interviews, provide clear problem definition, step-by-step logic, complexity analysis, and code snippets."

    expected_topics = [t.strip().lower() for t in expected_topics_str.split(",") if t.strip()]
    
    # 1. Topic Match Score (40 points)
    matched_topics = [t for t in expected_topics if t in text]
    topic_score = (len(matched_topics) / max(1, len(expected_topics))) * 40.0

    # 2. Technical Depth & Structure (30 points)
    has_complexity = any(c in text for c in ["o(n)", "o(1)", "o(log", "o(n^2)", "complexity", "space", "time"])
    has_code_or_logic = any(c in text for c in ["def ", "function", "while", "for ", "if ", "return", "class", "select", "where", "node", "array"])
    has_edge_cases = any(c in text for c in ["edge case", "null", "empty", "boundary", "overflow", "trade-off", "scalability"])

    structure_score = 0.0
    if has_complexity: structure_score += 10.0
    if has_code_or_logic: structure_score += 10.0
    if has_edge_cases: structure_score += 10.0

    # 3. Length & Explanation Depth (30 points)
    depth_score = min(30.0, (word_count / 120.0) * 30.0)

    total_score = round(min(100.0, topic_score + structure_score + depth_score), 1)

    # Feedback generation
    feedback_parts = [f"**Score Breakdown:** Scored **{total_score}/100** based on technical completeness."]
    
    if matched_topics:
        feedback_parts.append(f"✅ **Strong Points:** Successfully covered key concepts: *{', '.join(matched_topics)}*.")
    else:
        feedback_parts.append("⚠️ **Key Topics Missing:** Ensure you address core concepts such as: *" + expected_topics_str + "*.")

    missing_topics = [t for t in expected_topics if t not in matched_topics]
    if missing_topics:
        feedback_parts.append(f"💡 **Areas for Improvement:** Incorporate discussion on *{', '.join(missing_topics)}*.")

    if not has_complexity:
        feedback_parts.append("📌 **Pro Tip:** Always explicitly state both Time Complexity (e.g. O(N log N)) and Space Complexity in your interview responses.")

    return total_score, "\n\n".join(feedback_parts)


# --- Endpoints ---

@router.post("/start", response_model=InterviewSessionSchema)
async def start_interview(
    req: StartInterviewRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q_data_list = generate_interview_questions(req.company, req.role, req.difficulty)

    session = InterviewSession(
        user_id=current_user.id,
        company=req.company,
        role=req.role,
        interview_type=req.interview_type,
        difficulty=req.difficulty,
        total_questions=len(q_data_list),
        overall_score=0.0,
        status="IN_PROGRESS",
    )
    db.add(session)
    await db.flush()

    for q_item in q_data_list:
        q_obj = InterviewQuestion(
            session_id=session.id,
            sequence=q_item["sequence"],
            question=q_item["question"],
            expected_topics=q_item["expected_topics"],
            difficulty=q_item["difficulty"]
        )
        db.add(q_obj)

    await db.commit()

    # Re-fetch session
    stmt = (
        select(InterviewSession)
        .where(InterviewSession.id == session.id)
        .options(selectinload(InterviewSession.questions).selectinload(InterviewQuestion.answers))
    )
    res = await db.execute(stmt)
    return res.scalar_one()


@router.post("/answer")
async def submit_answer(
    req: SubmitAnswerRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(InterviewQuestion).where(InterviewQuestion.id == req.question_id)
    res = await db.execute(stmt)
    q_obj = res.scalar_one_or_none()
    if not q_obj:
        raise HTTPException(status_code=404, detail="Question not found")

    # Evaluate answer score & feedback using evaluation engine
    score, feedback = evaluate_answer_accurately(q_obj.question, q_obj.expected_topics, req.answer)

    ans_obj = InterviewAnswer(
        question_id=q_obj.id,
        answer=req.answer,
        feedback=feedback,
        score=score,
    )
    db.add(ans_obj)
    await db.commit()

    # Grant XP for answering
    try:
        await xp_service.add_xp(db, current_user, 50)
    except Exception:
        pass

    return {
        "status": "success",
        "question_id": req.question_id,
        "score": score,
        "feedback": feedback,
        "xp_earned": 50
    }


@router.get("/user", response_model=List[InterviewSessionSchema])
async def get_user_interviews(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(InterviewSession)
        .where(InterviewSession.user_id == current_user.id)
        .options(selectinload(InterviewSession.questions).selectinload(InterviewQuestion.answers))
        .order_by(InterviewSession.started_at.desc())
    )
    res = await db.execute(stmt)
    return res.scalars().all()
