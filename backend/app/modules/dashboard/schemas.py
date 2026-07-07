from pydantic import BaseModel


class DashboardResponse(BaseModel):

    profile: dict

    xp: dict

    streak: dict

    achievements: list

    challenge: dict

    weekly_stats: dict