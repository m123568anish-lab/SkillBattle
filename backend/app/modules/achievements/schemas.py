from datetime import datetime

from pydantic import BaseModel


class AchievementResponse(BaseModel):

    id: int

    title: str

    description: str

    icon: str

    unlocked: bool

    reward_xp: int

    earned_at: datetime | None

    model_config = {
        "from_attributes": True
    }