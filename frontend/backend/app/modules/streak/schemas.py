from datetime import datetime

from pydantic import BaseModel


class StreakResponse(BaseModel):

    current_streak: int

    best_streak: int

    last_active: datetime

    model_config = {
        "from_attributes": True
    }