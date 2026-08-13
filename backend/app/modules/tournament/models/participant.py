from dataclasses import dataclass


@dataclass(slots=True)
class Participant:

    user_id: str

    username: str

    rating: int

    seed: int = 0