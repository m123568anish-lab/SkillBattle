"""
=========================================================

SkillBattle

Base Exception

=========================================================
"""

from __future__ import annotations


class SkillBattleException(Exception):

    status_code = 400

    message = "Application Error"

    def __init__(

        self,

        message: str | None = None,

    ):

        if message:

            self.message = message

        super().__init__(self.message)