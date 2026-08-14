from pydantic import BaseModel


class MentorRequest(BaseModel):
    resume_id: str
    question: str


class MentorResponse(BaseModel):
    answer: str