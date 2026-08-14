from dataclasses import dataclass, field
from datetime import datetime


@dataclass(slots=True)
class InterviewSession:

    id: str

    user_id: str

    interview_type: str

    company: str | None = None

    started_at: datetime = field(
        default_factory=datetime.utcnow
    )

    completed: bool = False

    current_question: int = 0

    total_score: float = 0.0