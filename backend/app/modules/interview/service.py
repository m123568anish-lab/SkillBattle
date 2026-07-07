import json
from datetime import datetime

from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.models.interview import InterviewAnswer, InterviewQuestion, InterviewSession
from app.models.user import User
from app.modules.achievements.service import achievement_service
from app.modules.ai.service import ai_service
from app.modules.interview.builder import InterviewPromptBuilder
from app.modules.interview.repository import interview_repository
from app.modules.interview.schemas import AIInterview, AIEvaluation, StartInterviewRequest
from app.modules.memory.service import memory_service
from app.modules.profile.service import profile_service
from app.modules.roadmap.service import roadmap_service
from app.modules.xp.service import xp_service


class InterviewService:
    """Core business logic for Interview Coach."""

    def generate_ai_questions(
        self,
        db: Session,
        current_user: User,
        company: str,
        role: str,
        interview_type: str,
        difficulty: str,
        total_questions: int,
    ) -> AIInterview:
        profile = profile_service.get_profile(db, current_user)
        xp = xp_service.get_user_xp(db, current_user)
        roadmap = roadmap_service.get_current_week(db, current_user)
        memory = memory_service.build_context(db, current_user.id)

        prompt = InterviewPromptBuilder.build_interview_prompt(
            profile={
                "name": current_user.full_name,
                "college": profile.college,
            },
            roadmap={
                "title": "SkillBattle Roadmap",
                "week": roadmap.week_number if roadmap else 1,
            },
            xp={
                "level": xp.level,
                "total_xp": xp.total_xp,
            },
            memory=memory,
            company=company,
            role=role,
            interview_type=interview_type,
            difficulty=difficulty,
            total_questions=total_questions,
        )

        response = ai_service.generate_json(prompt)

        try:
            interview_json = json.loads(response)
            return AIInterview.model_validate(interview_json)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON from Gemini:\n{e}") from e
        except ValidationError as e:
            raise ValueError(f"Interview validation failed:\n{e}") from e

    def save_interview(
        self,
        db: Session,
        current_user: User,
        request: StartInterviewRequest,
        interview_data: AIInterview,
    ) -> InterviewSession:
        try:
            existing = interview_repository.get_active_session(db, current_user.id)
            if existing:
                return existing

            session = InterviewSession(
                user_id=current_user.id,
                company=request.company,
                role=request.role,
                interview_type=request.interview_type,
                difficulty=request.difficulty,
                total_questions=request.total_questions,
                overall_score=0,
                status="IN_PROGRESS",
            )

            session = interview_repository.create_session(db, session)

            for question_data in interview_data.questions:
                question = InterviewQuestion(
                    session_id=session.id,
                    sequence=question_data.sequence,
                    question=question_data.question,
                    expected_topics=question_data.expected_topics,
                    difficulty=question_data.difficulty,
                )
                interview_repository.create_question(db, question)

            interview_repository.commit(db)
            interview_repository.refresh(db, session)
            return session
        except Exception:
            interview_repository.rollback(db)
            raise

    def start_interview(
        self,
        db: Session,
        current_user: User,
        request: StartInterviewRequest,
    ) -> InterviewSession:
        interview = self.generate_ai_questions(
            db=db,
            current_user=current_user,
            company=request.company,
            role=request.role,
            interview_type=request.interview_type,
            difficulty=request.difficulty,
            total_questions=request.total_questions,
        )

        return self.save_interview(
            db=db,
            current_user=current_user,
            request=request,
            interview_data=interview,
        )

    def get_active_interview(self, db: Session, current_user: User):
        return interview_repository.get_active_session(db, current_user.id)

    def get_next_question(self, db: Session, current_user: User):
        session = self.get_active_interview(db, current_user)
        if session is None:
            return None
        return interview_repository.get_next_question(db, session.id)

    def get_history(self, db: Session, current_user: User):
        return interview_repository.get_history(db, current_user.id)

    def get_report(self, db: Session, session_id: int):
        session = interview_repository.get_session(db, session_id)
        if session is None:
            return None

        total_questions = len(session.questions)
        answered = sum(len(question.answers) for question in session.questions)
        overall_score = interview_repository.calculate_score(session)

        return {
            "session_id": session.id,
            "company": session.company,
            "role": session.role,
            "type": session.interview_type,
            "difficulty": session.difficulty,
            "status": session.status,
            "overall_score": overall_score,
            "total_questions": total_questions,
            "answered_questions": answered,
            "remaining_questions": total_questions - answered,
            "started_at": session.started_at,
            "finished_at": session.finished_at,
        }

    def evaluate_answer(self, question, answer: str) -> AIEvaluation:
        prompt = InterviewPromptBuilder.build_evaluation_prompt(
            question=question.question,
            expected_topics=question.expected_topics,
            answer=answer,
        )

        response = ai_service.generate_json(prompt)

        try:
            data = json.loads(response)
            return AIEvaluation.model_validate(data)
        except Exception as e:
            raise ValueError(f"Evaluation failed: {e}") from e

    def submit_answer(self, db: Session, current_user: User, question_id: int, answer: str):
        question = interview_repository.get_question(db, question_id)

        if question is None:
            raise HTTPException(status_code=404, detail="Question not found")

        if len(question.answers) > 0:
            raise HTTPException(status_code=400, detail="Answer already submitted")

        evaluation = self.evaluate_answer(question, answer)
        interview_answer = InterviewAnswer(
            question_id=question.id,
            answer=answer,
            feedback=evaluation.feedback,
            score=evaluation.score,
        )

        interview_repository.create_answer(db, interview_answer)
        interview_repository.commit(db)

        return evaluation

    def finish_interview(self, db: Session, current_user: User):
        session = self.get_active_interview(db, current_user)

        if session is None:
            raise HTTPException(status_code=404, detail="No active interview.")

        session.overall_score = interview_repository.calculate_score(session)
        session.finished_at = datetime.utcnow()
        session.status = "COMPLETED"

        interview_repository.commit(db)

        xp = int(session.overall_score * 5)

        try:
            xp_service.add_xp(db, current_user, xp)
        except Exception:
            pass

        try:
            achievement_service.check_achievements(db, current_user)
        except Exception:
            pass

        try:
            memory_service.save_memory(
                db=db,
                user_id=current_user.id,
                category="INTERVIEW",
                title=f"{session.company} Interview",
                content=f"Score: {session.overall_score}",
            )
        except Exception:
            pass

        return {
            "session_id": session.id,
            "overall_score": session.overall_score,
            "xp_earned": xp,
            "status": session.status,
            "message": "Interview completed successfully.",
        }


interview_service = InterviewService()
