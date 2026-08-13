"""
Global Exception Handler
"""

from fastapi import Request
from fastapi.responses import JSONResponse

from app.core.exceptions.base import (
    SkillBattleException,
)


async def skillbattle_exception_handler(

    request: Request,

    exc: SkillBattleException,

):

    return JSONResponse(

        status_code=exc.status_code,

        content={

            "success": False,

            "message": exc.message,

            "error": exc.__class__.__name__,

        },

    )