"""
=========================================================

GZip Middleware

=========================================================
"""

from fastapi.middleware.gzip import (

    GZipMiddleware,

)


def configure_gzip(

    app,

):

    app.add_middleware(

        GZipMiddleware,

        minimum_size=1024,

    )