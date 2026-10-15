from datetime import datetime
from pydantic import BaseModel, Field


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

    amount: int = Field(..., gt=0)

    reason: str


class XPLedgerEntryResponse(BaseModel):

    id: int
    user_id: str
    amount: int
    source: str
    reference_id: str | None = None
    description: str | None = None
    created_at: datetime

    model_config = {
        "from_attributes": True
    }