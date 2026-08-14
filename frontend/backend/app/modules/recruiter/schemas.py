from pydantic import BaseModel


class RecruiterReportRequest(BaseModel):

    user_id: str


class RecruiterReportResponse(BaseModel):

    overall_summary: str

    technical_strengths: list[str]

    technical_weaknesses: list[str]

    problem_solving: str

    communication: str

    coding_style: str

    interview_readiness: str

    recommended_role: str

    risk_level: str

    hire_recommendation: str

    confidence_score: int