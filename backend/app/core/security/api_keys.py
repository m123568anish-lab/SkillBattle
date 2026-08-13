"""
=========================================================

API Key Authentication

=========================================================
"""

from __future__ import annotations

from fastapi import Header
from fastapi import HTTPException

from app.core.config import settings


async def verify_api_key(

    x_api_key: str | None = Header(

        default=None,

    ),

):

    if x_api_key != settings.API_KEY:

        raise HTTPException(

            status_code=401,

            detail="Invalid API Key",

        )