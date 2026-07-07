from pydantic import BaseModel


class XPResponse(BaseModel):

    total_xp: int

    weekly_xp: int

    daily_xp: int

    level: int

    rank: int

    next_level_xp: int

    model_config = {
        "from_attributes": True
    }


class AddXPRequest(BaseModel):

    amount: int

    reason: str