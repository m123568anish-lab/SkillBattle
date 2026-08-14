"""
Database Exceptions
"""

from .base import SkillBattleException


class DatabaseError(

    SkillBattleException,

):

    status_code = 500

    message = "Database error."


class TransactionError(

    SkillBattleException,

):

    status_code = 500

    message = "Transaction failed."