"""
=========================================================

Password Manager

=========================================================
"""

from __future__ import annotations

from passlib.context import CryptContext

# Ensure compatibility: some `bcrypt` builds lack a `__about__` object
# which `passlib` expects when probing the bcrypt backend. Patch it
# here before importing/using passlib so no traceback is emitted.
try:
    import bcrypt as _bcrypt_mod
    import types
    if not hasattr(_bcrypt_mod, "__about__"):
        ver = getattr(_bcrypt_mod, "__version__", None) or getattr(_bcrypt_mod, "__version_ex__", None) or "<unknown>"
        _bcrypt_mod.__about__ = types.SimpleNamespace(__version__=ver)
except Exception:
    # Best-effort only; if this fails, passlib will handle detection.
    pass


class PasswordManager:

    def __init__(self):

        self.context = CryptContext(

            schemes=["argon2"],

            deprecated="auto",

        )

    # =====================================================
    # Hash Password
    # =====================================================

    def hash(
        self,
        password: str,
    ) -> str:

        return self.context.hash(password)

    # =====================================================
    # Verify Password
    # =====================================================

    def verify(
        self,
        password: str,
        hashed_password: str,
    ) -> bool:

        return self.context.verify(

            password,

            hashed_password,

        )


password_manager = PasswordManager()


import asyncio


def hash_password(password: str) -> str:
    return password_manager.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return password_manager.verify(password, hashed_password)


async def hash_password_async(password: str) -> str:
    """Non-blocking password hashing running on asyncio threadpool."""
    return await asyncio.to_thread(hash_password, password)


async def verify_password_async(password: str, hashed_password: str) -> bool:
    """Non-blocking password verification running on asyncio threadpool."""
    return await asyncio.to_thread(verify_password, password, hashed_password)