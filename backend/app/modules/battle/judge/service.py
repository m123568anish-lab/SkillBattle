from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.battle import (
    BattleSubmission,
)

from app.modules.compiler.executors.manager import (
    execution_manager,
)

from app.modules.compiler.judge import (
    judge_engine,
)

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

    async def submit(

        self,

        db: AsyncSession,

        battle,

        current_user: User,

        language: str,

        source_code: str,

        test_cases,

    ):

        execution_results = []

        for test in test_cases:

            result = execution_manager.execute(

                language=language,

                source_code=source_code,

                stdin=test.input_data,

            )

            execution_results.append({

                "status":

                "SUCCESS"

                if result.return_code == 0

                else "FAILED",

                "expected_output":

                test.expected_output,

                "actual_output":

                result.stdout,

                "execution_time":

                result.execution_time,

                "memory_used":

                result.memory_used,

            })

        judge_result = judge_engine.judge(

            execution_results,

        )

        submission = BattleSubmission(

            battle_id=battle.id,

            user_id=current_user.id,

            language=language,

            verdict=judge_result.verdict,

            passed_tests=judge_result.passed_tests,

            total_tests=judge_result.total_tests,

        )

        await battle_repository.create_submission(

            db,

            submission,

        )

        await db.commit()

        participant = await battle_repository.get_participant(

            db,

            battle.id,

            current_user.id,

        )

        if participant:

            participant.score += (

                judge_result.passed_tests * 100

            )

            await battle_repository.update_participant(

                db,

                participant,

            )

            await db.commit()

        await battle_leaderboard_service.update(

        db,

        battle.id,

      )

        return {

            "submission": submission,

            "judge": judge_result,

        }


battle_judge_service = BattleJudgeService()