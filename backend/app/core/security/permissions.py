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

        self.roles = {str(role).strip().upper() for role in roles}

    async def __call__(

        self,

        current_user,

    ):

        role = str(getattr(current_user, "role", "user") or "user").strip().upper()

        if role not in self.roles:

            raise HTTPException(

                status_code=status.HTTP_403_FORBIDDEN,

                detail="Permission denied.",

            )

        return current_user


AdminOnly = RoleChecker("admin", "PLATFORM_ADMIN")

ModeratorOnly = RoleChecker(

    "admin",

    "PLATFORM_ADMIN",

    "moderator",

)

UserOnly = RoleChecker(

    "admin",

    "PLATFORM_ADMIN",

    "moderator",

    "user",

)