"""
=========================================================

Request Logging Middleware

=========================================================
"""

from __future__ import annotations

import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware

from app.core.logging.logger import logger


class LoggingMiddleware(BaseHTTPMiddleware):

    async def dispatch(

        self,

        request,

        call_next,

    ):

        request_id = str(uuid.uuid4())

        start = time.perf_counter()

        response = await call_next(request)

        duration = (

            time.perf_counter() - start

        ) * 1000

        logger.info(

            "[%s] %s %s -> %s (%.2f ms)",

            request_id,

            request.method,

            request.url.path,

            response.status_code,

            duration,

        )

        response.headers["X-Request-ID"] = request_id

        return response