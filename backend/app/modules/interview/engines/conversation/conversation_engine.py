from app.modules.interview.memory.conversation_memory import (
    conversation_memory,
)


class ConversationEngine:

    def respond(

        self,

        session_id,

        candidate_answer,

    ):

        conversation_memory.add(

            session_id,

            "candidate",

            candidate_answer,

        )

        return {

            "continue": True,

            "follow_up": True,

        }


conversation_engine = ConversationEngine()