from pydantic import BaseModel


class StartInterviewRequest(BaseModel):

    interview_type: str

    company: str | None = None

    difficulty: str = "medium"

    language: str = "python"