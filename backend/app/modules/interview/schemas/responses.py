from pydantic import BaseModel


class InterviewSummary(BaseModel):

    interview_id: str

    score: float

    completed: bool

    total_questions: int