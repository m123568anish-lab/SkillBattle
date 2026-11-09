"""Neon Auth JWT verification helpers."""

from __future__ import annotations

import time
from typing import Any

import httpx
import jwt

from app.core.config import settings


class NeonAuthenticationError(ValueError):
    """Raised when a Neon Auth token cannot be verified."""


_jwks_cache: dict[str, Any] = {"expires_at": 0.0, "keys": []}
_shared_client: httpx.AsyncClient | None = None


def _get_http_client() -> httpx.AsyncClient:
    global _shared_client
    if _shared_client is None or _shared_client.is_closed:
        _shared_client = httpx.AsyncClient(
            timeout=5.0,
            limits=httpx.Limits(max_keepalive_connections=10, max_connections=20),
        )
    return _shared_client


async def _get_jwks() -> list[dict[str, Any]]:
    now = time.monotonic()
    if _jwks_cache["keys"] and _jwks_cache["expires_at"] > now:
        return _jwks_cache["keys"]

    jwks_url = settings.NEON_AUTH_JWKS_URL.strip()
    if not jwks_url:
        raise NeonAuthenticationError("Neon Auth JWKS URL is not configured.")

    try:
        response = await _get_http_client().get(jwks_url)
        response.raise_for_status()
        keys = response.json().get("keys", [])
    except (httpx.HTTPError, ValueError) as exc:
        raise NeonAuthenticationError("Unable to retrieve Neon Auth signing keys.") from exc

    if not keys:
        raise NeonAuthenticationError("Neon Auth returned no signing keys.")

    _jwks_cache.update({"expires_at": now + 3600, "keys": keys})
    return keys


async def verify_neon_token(token: str) -> dict[str, Any]:
    """Verify a Managed Better Auth EdDSA token against Neon Auth's JWKS."""
    issuer = settings.NEON_AUTH_BASE_URL.rstrip("/")
    if not issuer:
        raise NeonAuthenticationError("Neon Auth issuer is not configured.")

    try:
        header = jwt.get_unverified_header(token)
        if header.get("alg") != "EdDSA":
            raise NeonAuthenticationError("Neon Auth token uses an unsupported algorithm.")

        jwk_data = None
        for key in await _get_jwks():
            if key.get("kid") == header.get("kid"):
                jwk_data = key
                break
        if jwk_data is None:
            _jwks_cache.update({"expires_at": 0.0, "keys": []})
            for key in await _get_jwks():
                if key.get("kid") == header.get("kid"):
                    jwk_data = key
                    break
        if jwk_data is None:
            raise NeonAuthenticationError("Neon Auth signing key was not found.")

        signing_key = jwt.PyJWK.from_dict(jwk_data, algorithm="EdDSA").key
        claims = jwt.decode(
            token,
            signing_key,
            algorithms=["EdDSA"],
            issuer=issuer,
            options={"verify_aud": False},
        )
    except NeonAuthenticationError:
        raise
    except (httpx.HTTPError, jwt.InvalidTokenError, ValueError) as exc:
        raise NeonAuthenticationError("Invalid Neon Auth token.") from exc

    if not isinstance(claims.get("sub"), str) or not claims["sub"]:
        raise NeonAuthenticationError("Neon Auth token is missing its subject.")

    return claims


__all__ = ["NeonAuthenticationError", "verify_neon_token"]
