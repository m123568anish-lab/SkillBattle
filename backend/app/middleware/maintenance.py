"""
=========================================================

Maintenance Middleware

=========================================================
"""

from __future__ import annotations

from fastapi.responses import JSONResponse

from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings


class MaintenanceMiddleware(

    BaseHTTPMiddleware,

):

    async def dispatch(

        self,

        request,

        call_next,

    ):

        if getattr(

            settings,

            "MAINTENANCE_MODE",

            False,

        ):

            return JSONResponse(

                status_code=503,

                content={

                    "success": False,

                    "message": "Maintenance in progress.",

                },

            )

        return await call_next(

            request,

        )