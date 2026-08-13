"""
=========================================================

Register Middlewares

=========================================================
"""

from __future__ import annotations

from fastapi import FastAPI

from app.core.logging.middleware import (
    LoggingMiddleware,
)

from app.core.security.headers import (
    SecurityHeadersMiddleware,
)


def register_all_middlewares(
    app: FastAPI,
):

    app.add_middleware(

        LoggingMiddleware,

    )

    app.add_middleware(

        SecurityHeadersMiddleware,

    )