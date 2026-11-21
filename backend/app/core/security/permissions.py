"""
=========================================================

Role Based Access Control & Ownership Verification
Enforces server-side permissions and BOLA/IDOR protection.

=========================================================
"""

from __future__ import annotations

from typing import Any
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
        current_user: Any,
    ):
        # 1. Superuser bypass
        if getattr(current_user, "is_superuser", False) is True:
            return current_user

        # 2. Check role
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


def check_resource_ownership(
    current_user: Any,
    owner_id: str | int,
    allow_admin: bool = True,
) -> bool:
    """
    Verifies that the authenticated user owns the resource, or is a privileged administrator.
    Protects against Broken Object Level Authorization (BOLA / IDOR).
    """
    if current_user is None:
        return False

    if allow_admin:
        if getattr(current_user, "is_superuser", False) is True:
            return True
        user_role = str(getattr(current_user, "role", "") or "").strip().upper()
        if user_role in {"ADMIN", "PLATFORM_ADMIN"}:
            return True

    current_uid = str(getattr(current_user, "id", ""))
    target_uid = str(owner_id)
    return bool(current_uid and current_uid == target_uid)


def require_resource_ownership(
    current_user: Any,
    owner_id: str | int,
    allow_admin: bool = True,
    detail: str = "Access denied: you do not have permission to access or modify this resource.",
) -> None:
    """Raises HTTP 403 Forbidden if ownership check fails."""
    if not check_resource_ownership(current_user, owner_id, allow_admin=allow_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
        )
