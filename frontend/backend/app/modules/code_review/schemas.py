from pydantic import BaseModel


class CodeReviewRequest(BaseModel):

    language: str

    source_code: str

    problem_statement: str


class CodeReviewResponse(BaseModel):

    correctness: str

    time_complexity: str

    space_complexity: str

    readability: str

    maintainability: str

    security: str

    edge_cases: list[str]

    optimization: list[str]

    interview_feedback: str

    score: int