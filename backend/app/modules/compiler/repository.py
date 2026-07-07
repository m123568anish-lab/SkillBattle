from typing import Optional

from sqlalchemy.orm import (
    Session,
    joinedload,
)

from app.models.compiler import (
    Problem,
    TestCase,
    CodeSubmission,
)


class CompilerRepository:
    """
    Repository responsible for all compiler database operations.
    """

    # ==========================================================
    # Problems
    # ==========================================================

    def get_all_problems(
        self,
        db: Session,
    ):

        return (
            db.query(Problem)
            .order_by(
                Problem.id.asc()
            )
            .all()
        )

    def get_problem(
        self,
        db: Session,
        problem_id: int,
    ) -> Optional[Problem]:

        return (
            db.query(Problem)
            .options(
                joinedload(Problem.test_cases)
            )
            .filter(
                Problem.id == problem_id
            )
            .first()
        )

    def get_problem_by_slug(
        self,
        db: Session,
        slug: str,
    ) -> Optional[Problem]:

        return (
            db.query(Problem)
            .options(
                joinedload(Problem.test_cases)
            )
            .filter(
                Problem.slug == slug
            )
            .first()
        )

    # ==========================================================
    # Test Cases
    # ==========================================================

    def get_test_cases(
        self,
        db: Session,
        problem_id: int,
    ):

        return (
            db.query(TestCase)
            .filter(
                TestCase.problem_id == problem_id
            )
            .all()
        )

    def get_hidden_test_cases(
        self,
        db: Session,
        problem_id: int,
    ):

        return (
            db.query(TestCase)
            .filter(
                TestCase.problem_id == problem_id,
                TestCase.is_sample == False,
            )
            .all()
        )

    # ==========================================================
    # Submission
    # ==========================================================

    def create_submission(
        self,
        db: Session,
        submission: CodeSubmission,
    ) -> CodeSubmission:

        db.add(submission)
        db.flush()

        return submission

    def get_submission(
        self,
        db: Session,
        submission_id: int,
    ) -> Optional[CodeSubmission]:

        return (
            db.query(CodeSubmission)
            .options(
                joinedload(CodeSubmission.problem)
            )
            .filter(
                CodeSubmission.id == submission_id
            )
            .first()
        )

    def get_user_submissions(
        self,
        db: Session,
        user_id: str,
    ):

        return (
            db.query(CodeSubmission)
            .options(
                joinedload(CodeSubmission.problem)
            )
            .filter(
                CodeSubmission.user_id == user_id
            )
            .order_by(
                CodeSubmission.submitted_at.desc()
            )
            .all()
        )

    def update_submission(
        self,
        db: Session,
        submission: CodeSubmission,
    ):

        db.add(submission)

        db.flush()

        return submission

    # ==========================================================
    # Database Helpers
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


compiler_repository = CompilerRepository()