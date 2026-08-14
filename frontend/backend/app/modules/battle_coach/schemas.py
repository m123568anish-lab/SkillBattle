from pydantic import BaseModel


class BattleCoachRequest(BaseModel):

    problem_statement: str

    user_code: str

    opponent_code: str

    user_result: str

    opponent_result: str

    user_execution_time: float

    opponent_execution_time: float


class BattleCoachResponse(BaseModel):

    winner_analysis: str

    loser_analysis: str

    comparison: str

    strengths: list[str]

    weaknesses: list[str]

    time_management: str

    optimization: list[str]

    recommended_topics: list[str]

    practice_plan: list[str]

    interview_readiness: str

    confidence_score: int