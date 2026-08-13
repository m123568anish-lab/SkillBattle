"""
Authentication Exceptions
"""

from .base import SkillBattleException


class InvalidCredentials(

    SkillBattleException,

):

    status_code = 401

    message = "Invalid email or password."


class InvalidToken(

    SkillBattleException,

):

    status_code = 401

    message = "Invalid authentication token."


class UserAlreadyExists(

    SkillBattleException,

):

    status_code = 409

    message = "User already exists."


class UserNotFound(

    SkillBattleException,

):

    status_code = 404

    message = "User not found."