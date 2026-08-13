"""
=========================================================

Rate Limiting Middleware

=========================================================
"""

from __future__ import annotations

from fastapi.responses import JSONResponse

from starlette.middleware.base import BaseHTTPMiddleware

from app.core.redis.rate_limiter import (

    rate_limiter,

)


class RateLimitMiddleware(

    BaseHTTPMiddleware,

):

    LIMIT = 120

    WINDOW = 60

    async def dispatch(

        self,

        request,

        call_next,

    ):

        client = (

            request.client.host

            if request.client

            else "unknown"

        )

        allowed = await rate_limiter.allow(

            client,

            self.LIMIT,

            self.WINDOW,

        )

        if not allowed:

            return JSONResponse(

                status_code=429,

                content={

                    "success": False,

                    "message": "Too many requests.",

                },

            )

        return await call_next(

            request,

        )