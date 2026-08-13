"""
=========================================================

Error Response

=========================================================
"""

from __future__ import annotations

from .base import APIResponse


def error_response(

    message: str,

):

    return APIResponse(

        success=False,

        message=message,

        data=None,

    )