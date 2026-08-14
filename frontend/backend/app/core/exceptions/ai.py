"""
AI Exceptions
"""

from .base import SkillBattleException


class AIProviderUnavailable(

    SkillBattleException,

):

    status_code = 503

    message = "AI Provider unavailable."


class PromptTooLarge(

    SkillBattleException,

):

    status_code = 400

    message = "Prompt exceeds maximum size."