"""
=========================================================

Pagination Response

=========================================================
"""

from __future__ import annotations

from .base import APIResponse


def paginated_response(

    items,

    page,

    page_size,

    total,

):

    return APIResponse(

        success=True,

        message="Success",

        data={

            "items": items,

            "page": page,

            "page_size": page_size,

            "total": total,

            "pages": (

                total + page_size - 1

            ) // page_size,

        },

    )