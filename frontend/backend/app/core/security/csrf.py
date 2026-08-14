"""
=========================================================

SkillBattle

CSRF Middleware

=========================================================
"""

from __future__ import annotations

from fastapi import HTTPException
from starlette.middleware.base import BaseHTTPMiddleware


class CSRFMiddleware(BaseHTTPMiddleware):

    """
    Only enable this middleware if you use
    cookie/session authentication.

    JWT Bearer authentication does not require CSRF.
    """

    async def dispatch(
        self,
        request,
        call_next,
    ):

        if request.method in {

            "POST",

            "PUT",

            "PATCH",

            "DELETE",

        }:

            token = request.headers.get(

                "X-CSRF-Token",

            )

            if token is None:

                raise HTTPException(

                    status_code=403,

                    detail="Missing CSRF Token.",

                )

        return await call_next(request)