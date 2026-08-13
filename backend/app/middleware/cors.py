"""
=========================================================

CORS Middleware

=========================================================
"""

from fastapi.middleware.cors import (

    CORSMiddleware,

)


def configure_cors(

    app,

):

    from app.core.config import settings

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.effective_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )