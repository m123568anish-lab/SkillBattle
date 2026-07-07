from app.modules.interview.engines.conversation.conversation_engine import (
    conversation_engine,
)

from app.modules.interview.engines.evaluation.evaluation_engine import (
    evaluation_engine,
)


class InterviewService:

    def answer(

        self,

        session_id,

        answer,

    ):

        conversation = (

            conversation_engine.respond(

                session_id,

                answer,

            )

        )

        evaluation = (

            evaluation_engine.evaluate(

                answer,

            )

        )

        return {

            "conversation":

            conversation,

            "evaluation":

            evaluation,

        }


interview_service = InterviewService()