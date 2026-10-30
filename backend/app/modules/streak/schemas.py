from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel


class StreakResponse(BaseModel):
    current_streak: int
    best_streak: int
    last_active: datetime
    longest_streak: int | None = None
    is_active_today: bool | None = None

    model_config = {
        "from_attributes": True,
    }
