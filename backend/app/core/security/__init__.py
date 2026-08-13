"""
=========================================================

SkillBattle

Security Package

=========================================================
"""

from .password import hash_password, password_manager, verify_password
from .jwt import JWTManager, jwt_manager

# Token helpers
create_access_token = jwt_manager.create_access_token
create_refresh_token = jwt_manager.create_refresh_token


def decode_token(token: str):
    return jwt_manager.decode(token)


# Forward the dependency helper from app.core.dependencies for convenience.
# Import lazily to avoid circular imports during package initialization.

def get_current_user(*args, **kwargs):
    from app.core.dependencies import get_current_user as _get_current_user

    return _get_current_user(*args, **kwargs)

__all__ = [
    "JWTManager",
    "create_access_token",
    "create_refresh_token",
    "decode_token",
    "hash_password",
    "password_manager",
    "jwt_manager",
    "verify_password",
]