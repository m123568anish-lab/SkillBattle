"""
=========================================================

Request Timing Middleware

=========================================================
"""

from __future__ import annotations

import time

from starlette.middleware.base import BaseHTTPMiddleware


class TimingMiddleware(BaseHTTPMiddleware):

    async def dispatch(

        self,

        request,

        call_next,

    ):

        start = time.perf_counter()

        response = await call_next(request)

        duration = (

            time.perf_counter()

            - start

        ) * 1000

        response.headers[

            "X-Process-Time"

        ] = f"{duration:.2f}ms"

        return response