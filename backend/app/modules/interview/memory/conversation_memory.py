from collections import defaultdict


class ConversationMemory:

    def __init__(self):

        self.sessions = defaultdict(list)

    def add(

        self,

        session_id: str,

        role: str,

        message: str,

    ):

        self.sessions[session_id].append(

            {

                "role": role,

                "message": message,

            }

        )

    def history(

        self,

        session_id: str,

    ):

        return self.sessions.get(

            session_id,

            [],

        )

    def clear(

        self,

        session_id: str,

    ):

        self.sessions.pop(

            session_id,

            None,

        )


conversation_memory = ConversationMemory()