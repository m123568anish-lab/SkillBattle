class InterviewManager:

    def __init__(self):

        self.sessions = {}

    def register(

        self,

        session,

    ):

        self.sessions[

            session.id

        ] = session

    def get(

        self,

        session_id,

    ):

        return self.sessions.get(

            session_id,

        )


interview_manager = InterviewManager()