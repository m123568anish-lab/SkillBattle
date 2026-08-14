from datetime import datetime

from pydantic import BaseModel


class ReplaySubmission(BaseModel):

    user_id: str

    language: str

    verdict: str

    passed_tests: int

    total_tests: int

    submitted_at: datetime

    class Config:

        from_attributes = True


class BattleReplay(BaseModel):

    battle_id: str

    submissions: list[ReplaySubmission]