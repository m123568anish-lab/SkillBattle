import httpx

from .api.battle import BattleAPI
from .api.tournament import TournamentAPI
from .api.leaderboard import LeaderboardAPI
from .api.interview import InterviewAPI
from .api.ai import AIAPI


class SkillBattle:

    def __init__(

        self,

        api_key: str,

        base_url="http://localhost:8001/api/v1",

    ):

        self.client = httpx.Client(

            base_url=base_url,

            headers={

                "X-API-Key": api_key,

            },

            timeout=30,

        )

        self.battle = BattleAPI(self.client)

        self.tournament = TournamentAPI(self.client)

        self.leaderboard = LeaderboardAPI(self.client)

        self.interview = InterviewAPI(self.client)

        self.ai = AIAPI(self.client)