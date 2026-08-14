from pydantic import BaseModel


class DashboardResponse(BaseModel):

    name: str

    level: int

    total_xp: int

    rank: int

    streak: int

    weekly_xp: int

    challenge: str