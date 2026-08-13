from dataclasses import dataclass, field
from datetime import datetime


@dataclass(slots=True)
class QueuePlayer:

    user_id: str

    username: str

    rating: int

    region: str

    mode: str

    waiting_since: datetime = field(
        default_factory=datetime.utcnow
    )