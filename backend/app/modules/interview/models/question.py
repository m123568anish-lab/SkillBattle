from dataclasses import dataclass


@dataclass(slots=True)
class InterviewQuestion:

    id: str

    title: str

    description: str

    difficulty: str

    topic: str

    expected_time: int