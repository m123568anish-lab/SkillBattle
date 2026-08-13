"""
=========================================================

Success Response

=========================================================
"""

from __future__ import annotations

from .base import APIResponse


def success_response(

    message: str,

    data=None,

):

    return APIResponse(

        success=True,

        message=message,

        data=data,

    )