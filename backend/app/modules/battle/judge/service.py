from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.battle import (
    BattleSubmission,
)

from app.modules.compiler.judge import (
    judge_engine,
)
from app.models.question import Question

from app.modules.battle.repository import (
    battle_repository,
)

from app.modules.battle.websocket import (
    battle_ws,
    BattleEvent,
)
from app.modules.battle.leaderboard import (
    battle_leaderboard_service,
)

class BattleJudgeService:

    """
    Executes and judges battle submissions.
    """

    async def evaluate(
        self,
        language: str,
        source_code: str,
        question: Question,
    ) -> dict:
        cases = question.hidden_test_cases or question.examples or []
        test_cases = [
            {"input": case["input"], "output": case["output"]}
            for case in cases
            if isinstance(case, dict) and "input" in case and "output" in case
        ]
        if not test_cases:
            raise ValueError("This coding question does not have valid test cases.")
        result = judge_engine.judge(
            language=language.lower(),
            source_code=source_code,
            testcases=test_cases,
        )
        return {
            "verdict": result.verdict,
            "passed_tests": result.passed_tests,
            "total_tests": result.total_tests,
            "runtime_ms": result.runtime_ms,
            "memory_mb": result.memory_mb,
        }

    async def submit(
        self,
        db: AsyncSession,
        battle,
        current_user: User,
        language: str,
        source_code: str,
        test_cases,
    ):
        normalized_cases = []
        for test_case in test_cases:
            if isinstance(test_case, dict):
                input_data = test_case.get("input", test_case.get("input_data"))
                expected_output = test_case.get("output", test_case.get("expected_output"))
            else:
                input_data = getattr(test_case, "input_data", None)
                expected_output = getattr(test_case, "expected_output", None)
            if input_data is not None and expected_output is not None:
                normalized_cases.append({
                    "input": str(input_data),
                    "output": str(expected_output),
                })
        if not normalized_cases:
            raise ValueError("At least one valid test case is required.")

        judge_result = judge_engine.judge(
            language=language.lower(),
            source_code=source_code,
            testcases=normalized_cases,
        )
        submission = BattleSubmission(
            battle_id=battle.id,
            user_id=current_user.id,
            language=language,
            verdict=judge_result.verdict,
            passed_tests=judge_result.passed_tests,
            total_tests=judge_result.total_tests,
            runtime_ms=judge_result.runtime_ms,
            memory_mb=judge_result.memory_mb,
            score=judge_result.score,
            score_earned=judge_result.score,
        )
        await battle_repository.create_submission(db, submission)
        await db.commit()

        participant = await battle_repository.get_participant(
            db,
            battle.id,
            current_user.id,
        )
        if participant:
            participant.score += judge_result.score
            await battle_repository.update_participant(db, participant)
            await db.commit()

        await battle_leaderboard_service.update(db, battle.id)
        return {"submission": submission, "judge": judge_result}


battle_judge_service = BattleJudgeService()