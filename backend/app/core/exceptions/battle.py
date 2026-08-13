"""
Battle Exceptions
"""

from .base import SkillBattleException


class BattleAlreadyStarted(

    SkillBattleException,

):

    status_code = 400

    message = "Battle already started."


class BattleNotFound(

    SkillBattleException,

):

    status_code = 404

    message = "Battle not found."


class BattleAlreadyFinished(

    SkillBattleException,

):

    status_code = 400

    message = "Battle already finished."