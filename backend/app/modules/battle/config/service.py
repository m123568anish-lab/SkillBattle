import random


class BattleConfigService:

    """
    Responsible for selecting battle
    configuration based on player skill.
    """

    DEFAULT_TIME_LIMIT = 1800

    DEFAULT_MAX_PLAYERS = 2

    def select_problem(
        self,
        rating: int,
    ):

        if rating < 1200:

            return {

                "problem_id": 1,

                "difficulty": "Easy",

            }

        elif rating < 1700:

            return {

                "problem_id": 2,

                "difficulty": "Medium",

            }

        else:

            return {

                "problem_id": 3,

                "difficulty": "Hard",

            }

    # ==============================================

    def build_config(
        self,
        rating: int,
    ):

        config = self.select_problem(
            rating,
        )

        return {

            "problem_id": config["problem_id"],

            "difficulty": config["difficulty"],

            "max_players": self.DEFAULT_MAX_PLAYERS,

            "duration": self.DEFAULT_TIME_LIMIT,

            "title": f"{config['difficulty']} Ranked Battle",

        }


battle_config_service = BattleConfigService()