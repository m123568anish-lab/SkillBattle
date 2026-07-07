from urllib import request

from sqlalchemy.orm import Session

from app.models.user import User
from app.models.compiler import CodeSubmission

from app.modules.compiler.repository import compiler_repository
from app.modules.compiler.executors.manager import (
    execution_manager,
)
from app.modules.compiler.judge import judge_engine
from app.modules.compiler.schemas import RunCodeRequest, SubmitCodeRequest
from app.modules.xp.service import xp_service
from app.modules.achievements.service import achievement_service


class CompilerService:
    """
    Handles compiler execution logic.
    """

    # ==========================================================
    # Run Code
    # ==========================================================

    def run_code(
    self,
    request: RunCodeRequest,
):

     result = execution_manager.execute(

        language=request.language,

        source_code=request.source_code,

        stdin=request.stdin,

    )

     if result.return_code == 0:

        status = "Success"

     elif result.stderr:

        stderr = result.stderr.lower()

        if "time limit" in stderr:

            status = "Time Limit Exceeded"

        elif "compiler" in stderr:

            status = "Compilation Error"

        else:

            status = "Runtime Error"

     else:

        status = "Failed"

     return {

        "stdout": result.stdout,

        "stderr": result.stderr,

        "status": status,

        "execution_time": result.execution_time,

        "memory_used": result.memory_used,

    }

    # ==========================================================
    # Problems
    # ==========================================================

    def get_problems(
        self,
        db: Session,
    ):
        return compiler_repository.get_all_problems(db)

    def get_problem(
        self,
        db: Session,
        problem_id: int,
    ):
        return compiler_repository.get_problem(db, problem_id)

    # ==========================================================
    # Submit Solution
    # ==========================================================

    def submit_solution(
        self,
        db: Session,
        current_user: User,
        request: SubmitCodeRequest,
    ):
        problem = compiler_repository.get_problem(db, request.problem_id)
        if problem is None:
            raise ValueError("Problem not found.")

        test_cases = compiler_repository.get_test_cases(db, request.problem_id)
        execution_results = []

        for test in test_cases:
            result = execution_manager.execute(

                language=request.language,

                source_code=request.source_code,

                stdin=test.input_data,

          )

            status = "SUCCESS"
            if result.return_code != 0:
                status = "Runtime Error"

            execution_results.append({
                "status": status,
                "expected_output": test.expected_output,
                "actual_output": result.stdout,
                "execution_time": result.execution_time,
                "memory_used": result.memory_used,
            })

        judge_result = judge_engine.judge(
           language=request.language,
           source_code=request.source_code,
           test_cases=test_cases,
         )

        stats = judge_result["statistics"]

        submission.verdict = stats.verdict
        submission.execution_time = stats.execution_time
        submission.memory_used = stats.memory_used
        submission.passed_tests = stats.passed_tests
        submission.total_tests = stats.total_tests

        compiler_repository.create_submission(db, submission)
        compiler_repository.commit(db)
        compiler_repository.refresh(db, submission)

        xp_earned = 0
        if submission.verdict == "Accepted":
            xp_earned = problem.xp_reward
            try:
                xp_service.add_xp(db, current_user, xp_earned)
            except Exception:
                pass

            try:
                achievement_service.check_achievements(db, current_user)
            except Exception:
                pass

        return {
            "submission": submission,
            "xp_earned": xp_earned,
        }

    # ==========================================================
    # Submission History
    # ==========================================================

    def get_submission_history(
        self,
        db: Session,
        current_user: User,
    ):
        return compiler_repository.get_user_submissions(db, current_user.id)

    # ==========================================================
    # Submission Details
    # ==========================================================

    def get_submission(
        self,
        db: Session,
        submission_id: int,
    ):
        return compiler_repository.get_submission(db, submission_id)

    # ==========================================================
    # Statistics
    # ==========================================================

    def get_statistics(
        self,
        db: Session,
        current_user: User,
    ):
        submissions = compiler_repository.get_user_submissions(db, current_user.id)
        total = len(submissions)
        accepted = sum(1 for s in submissions if s.verdict == "Accepted")

        if total == 0:
            rate = 0
        else:
            rate = round(accepted * 100 / total, 2)

        return {
            "total_submissions": total,
            "accepted": accepted,
            "success_rate": rate,
        }


compiler_service = CompilerService()
