"""
=========================================================

Role Based Access Control

=========================================================
"""

from __future__ import annotations

from fastapi import HTTPException
from fastapi import status


class RoleChecker:

    def __init__(

        self,

        *roles: str,

    ):

        self.roles = set(roles)

    async def __call__(

        self,

        current_user,

    ):

        role = getattr(

            current_user,

            "role",

            "user",

        )

        if role not in self.roles:

            raise HTTPException(

                status_code=status.HTTP_403_FORBIDDEN,

                detail="Permission denied.",

            )

        return current_user


AdminOnly = RoleChecker("admin")

ModeratorOnly = RoleChecker(

    "admin",

    "moderator",

)

UserOnly = RoleChecker(

    "admin",

    "moderator",

    "user",

)