"""Clerk token verification and application-user linking helpers."""

from __future__ import annotations

import time
from typing import Any

import httpx
from jose import jwk
from jose import jwt

from app.core.config import settings


class ClerkAuthenticationError(ValueError):
    """Raised when a Clerk token or profile cannot be verified."""


_jwks_cache: dict[str, Any] = {"expires_at": 0.0, "keys": []}


def _configured_issuer() -> str:
    return settings.CLERK_ISSUER_URL.rstrip("/")


def _decode_options() -> dict[str, Any]:
    options: dict[str, Any] = {
        "verify_aud": bool(settings.CLERK_AUDIENCE),
        "verify_iss": bool(settings.CLERK_ISSUER_URL),
    }
    return options


async def _get_jwks() -> list[dict[str, Any]]:
    now = time.monotonic()
    if _jwks_cache["keys"] and _jwks_cache["expires_at"] > now:
        return _jwks_cache["keys"]

    issuer = _configured_issuer()
    jwks_url = settings.CLERK_JWKS_URL.rstrip("/") or f"{issuer}/.well-known/jwks.json"
    if not issuer and not settings.CLERK_JWKS_URL:
        raise ClerkAuthenticationError("Clerk issuer or JWKS URL is not configured.")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(jwks_url)
            response.raise_for_status()
            keys = response.json().get("keys", [])
    except (httpx.HTTPError, ValueError) as exc:
        raise ClerkAuthenticationError("Unable to retrieve Clerk signing keys.") from exc

    if not keys:
        raise ClerkAuthenticationError("Clerk returned no signing keys.")

    _jwks_cache.update({"expires_at": now + 3600, "keys": keys})
    return keys


async def verify_clerk_token(token: str) -> dict[str, Any]:
    """Verify a Clerk session token using a configured PEM key or JWKS."""
    if not settings.CLERK_JWT_KEY and not settings.CLERK_ISSUER_URL:
        raise ClerkAuthenticationError("Clerk verification is not configured.")

    try:
        header = jwt.get_unverified_header(token)
        key: Any = settings.CLERK_JWT_KEY.replace("\\n", "\n")

        if not key:
            kid = header.get("kid")
            jwks = await _get_jwks()
            jwk_data = next((item for item in jwks if item.get("kid") == kid), None)
            if jwk_data is None:
                # Refresh once when Clerk rotated keys between cache reads.
                _jwks_cache.update({"expires_at": 0.0, "keys": []})
                jwks = await _get_jwks()
                jwk_data = next((item for item in jwks if item.get("kid") == kid), None)
            if jwk_data is None:
                raise ClerkAuthenticationError("Clerk signing key was not found.")
            key = jwk.construct(jwk_data)

        decode_kwargs: dict[str, Any] = {
            "algorithms": ["RS256"],
            "options": _decode_options(),
        }
        if settings.CLERK_ISSUER_URL:
            decode_kwargs["issuer"] = _configured_issuer()
        if settings.CLERK_AUDIENCE:
            decode_kwargs["audience"] = settings.CLERK_AUDIENCE

        claims = jwt.decode(token, key, **decode_kwargs)
    except ClerkAuthenticationError:
        raise
    except Exception as exc:
        raise ClerkAuthenticationError("Invalid Clerk authentication token.") from exc

    subject = claims.get("sub")
    if not isinstance(subject, str) or not subject:
        raise ClerkAuthenticationError("Clerk token is missing its subject.")

    allowed_parties = {
        item.strip()
        for item in settings.CLERK_ALLOWED_PARTIES.split(",")
        if item.strip()
    }
    party = claims.get("azp")
    if allowed_parties and party not in allowed_parties:
        raise ClerkAuthenticationError("Clerk token was issued to an untrusted party.")

    return claims


async def get_clerk_user_profile(user_id: str) -> dict[str, Any] | None:
    """Fetch profile details needed to link a Clerk identity to a local user."""
    if not settings.CLERK_SECRET_KEY:
        return None

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"https://api.clerk.com/v1/users/{user_id}",
                headers={"Authorization": f"Bearer {settings.CLERK_SECRET_KEY}"},
            )
            response.raise_for_status()
            payload = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise ClerkAuthenticationError("Unable to retrieve the Clerk user profile.") from exc

    email_addresses = payload.get("email_addresses") or []
    primary_id = payload.get("primary_email_address_id")
    primary = next(
        (
            item
            for item in email_addresses
            if item.get("id") == primary_id
        ),
        email_addresses[0] if email_addresses else None,
    )

    return {
        "email": (primary or {}).get("email_address"),
        "email_verified": (primary or {}).get("verification", {}).get("status") == "verified",
        "first_name": payload.get("first_name") or "",
        "last_name": payload.get("last_name") or "",
        "username": payload.get("username") or "",
        "image_url": payload.get("image_url"),
        "public_metadata": payload.get("public_metadata") or {},
    }


__all__ = [
    "ClerkAuthenticationError",
    "get_clerk_user_profile",
    "verify_clerk_token",
]
