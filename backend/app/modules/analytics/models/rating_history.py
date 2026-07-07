from dataclasses import dataclass
from datetime import datetime


@dataclass(slots=True)
class RatingHistory:

    rating: int

    created_at: datetime