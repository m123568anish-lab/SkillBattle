"""
=========================================================

SkillBattle

Base API Response

=========================================================
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class APIResponse(BaseModel):

    success: bool

    message: str

    data: dict | list | None = None

    timestamp: datetime = datetime.utcnow()

    version: str = "v1"