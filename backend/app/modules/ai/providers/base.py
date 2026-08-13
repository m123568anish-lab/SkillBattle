"""
=========================================================

SkillBattle

Base AI Provider

=========================================================
"""

from __future__ import annotations

from abc import ABC
from abc import abstractmethod


class AIProvider(ABC):

    @abstractmethod
    async def generate(
        self,
        prompt: str,
    ) -> str:
        """
        Generate AI response.
        """
        raise NotImplementedError