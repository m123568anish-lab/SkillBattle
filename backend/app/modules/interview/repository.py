from typing import Optional

from sqlalchemy.orm import (
    Session,
    joinedload,
)

from app.models.interview import (
    InterviewSession,
    InterviewQuestion,
    InterviewAnswer,
)


class InterviewRepository:
    """
    Repository responsible for all Interview database operations.
    """

    # ==========================================================
    # SESSION
    # ==========================================================

    def create_session(
        self,
        db: Session,
        session: InterviewSession,
    ) -> InterviewSession:

        db.add(session)
        db.flush()

        return session

    def get_session(
        self,
        db: Session,
        session_id: int,
    ) -> Optional[InterviewSession]:

        return (
            db.query(InterviewSession)
            .options(
                joinedload(
                    InterviewSession.questions
                ).joinedload(
                    InterviewQuestion.answers
                )
            )
            .filter(
                InterviewSession.id == session_id
            )
            .first()
        )

    def get_active_session(
        self,
        db: Session,
        user_id: str,
    ) -> Optional[InterviewSession]:

        return (
            db.query(InterviewSession)
            .options(
                joinedload(
                    InterviewSession.questions
                ).joinedload(
                    InterviewQuestion.answers
                )
            )
            .filter(
                InterviewSession.user_id == user_id,
                InterviewSession.status == "IN_PROGRESS",
            )
            .first()
        )

    # ==========================================================
    # QUESTION
    # ==========================================================

    def create_question(
        self,
        db: Session,
        question: InterviewQuestion,
    ) -> InterviewQuestion:

        db.add(question)
        db.flush()

        return question

    def get_question(
        self,
        db: Session,
        question_id: int,
    ) -> Optional[InterviewQuestion]:

        return (
            db.query(InterviewQuestion)
            .filter(
                InterviewQuestion.id == question_id
            )
            .first()
        )

    def get_next_question(
        self,
        db: Session,
        session_id: int,
    ) -> Optional[InterviewQuestion]:

        questions = (
            db.query(InterviewQuestion)
            .options(
                joinedload(
                    InterviewQuestion.answers
                )
            )
            .filter(
                InterviewQuestion.session_id == session_id
            )
            .order_by(
                InterviewQuestion.sequence.asc()
            )
            .all()
        )

        for question in questions:

            if len(question.answers) == 0:
                return question

        return None

    # ==========================================================
    # ANSWER
    # ==========================================================

    def create_answer(
        self,
        db: Session,
        answer: InterviewAnswer,
    ) -> InterviewAnswer:

        db.add(answer)
        db.flush()

        return answer

    # ==========================================================
    # HISTORY
    # ==========================================================

    def get_history(
        self,
        db: Session,
        user_id: str,
    ):

        return (
            db.query(InterviewSession)
            .filter(
                InterviewSession.user_id == user_id
            )
            .order_by(
                InterviewSession.started_at.desc()
            )
            .all()
        )

    # ==========================================================
    # SCORING
    # ==========================================================

    def calculate_score(
        self,
        session: InterviewSession,
    ) -> float:

        scores = []

        for question in session.questions:

            for answer in question.answers:

                scores.append(answer.score)

        if len(scores) == 0:
            return 0

        return round(
            sum(scores) / len(scores),
            2,
        )

    # ==========================================================
    # SAVE
    # ==========================================================

    def commit(
        self,
        db: Session,
    ):

        db.commit()

    def rollback(
        self,
        db: Session,
    ):

        db.rollback()

    def refresh(
        self,
        db: Session,
        obj,
    ):

        db.refresh(obj)


interview_repository = InterviewRepository()