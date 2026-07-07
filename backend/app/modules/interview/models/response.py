from dataclasses import dataclass


@dataclass(slots=True)
class CandidateResponse:

    question_id: str

    answer: str

    duration: float

    score: float = 0.0

    feedback: str = ""