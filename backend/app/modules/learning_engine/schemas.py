from pydantic import BaseModel


class LearningEngineRequest(BaseModel):

    interview_score: int

    battle_rating: int

    solved_problems: int

    accepted_submissions: int

    weak_topics: list[str]

    strong_topics: list[str]

    recent_reviews: list[str]

    battle_feedback: list[str]


class LearningPlan(BaseModel):

    overall_assessment: str

    strengths: list[str]

    weaknesses: list[str]

    recommended_topics: list[str]

    daily_plan: list[str]

    weekly_plan: list[str]

    monthly_goal: str

    interview_readiness: str

    next_battle_difficulty: str

    confidence_score: int