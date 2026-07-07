from pydantic import BaseModel


class AIRequest(BaseModel):
    prompt: str


class AIResponse(BaseModel):
    response: str


class AICoachResponse(BaseModel):
    study_plan: list[str]
    weak_topics: list[str]
    coding_challenge: str
    motivation: str
    company_strategy: str
    next_milestone: str