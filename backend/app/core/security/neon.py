"""Neon Auth JWT verification helpers."""

from __future__ import annotations

import logging
import time
from typing import Any
from urllib.parse import urlsplit

import httpx
import jwt

from app.core.config import settings

logger = logging.getLogger(__name__)


class NeonAuthenticationError(ValueError):
    """Raised when a Neon Auth token cannot be verified."""


class NeonAuthenticationConfigurationError(NeonAuthenticationError):
    """Raised when the API lacks the configuration required to verify Neon tokens."""


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
        raise NeonAuthenticationConfigurationError("Neon Auth JWKS URL is not configured.")

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
    try:
        header = jwt.get_unverified_header(token)
        if header.get("alg") != "EdDSA":
            raise NeonAuthenticationError("Neon Auth token uses an unsupported algorithm.")

        auth_base_url = settings.NEON_AUTH_BASE_URL.strip().rstrip("/")
        if not auth_base_url:
            raise NeonAuthenticationConfigurationError("Neon Auth issuer is not configured.")
        parsed_auth_base_url = urlsplit(auth_base_url)
        if (
            parsed_auth_base_url.scheme not in {"http", "https"}
            or not parsed_auth_base_url.netloc
            or parsed_auth_base_url.username
            or parsed_auth_base_url.password
            or parsed_auth_base_url.query
            or parsed_auth_base_url.fragment
        ):
            raise NeonAuthenticationConfigurationError("Neon Auth base URL is invalid.")
        # Neon JWTs use the Auth host as iss; the configured base URL includes the database path.
        issuer = f"{parsed_auth_base_url.scheme}://{parsed_auth_base_url.netloc}"

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
        try:
            claims = jwt.decode(
                token,
                signing_key,
                algorithms=["EdDSA"],
                issuer=issuer,
                options={"verify_aud": False},
            )
        except jwt.InvalidIssuerError:
            try:
                issuer_diagnostic = jwt.decode(
                    token,
                    signing_key,
                    algorithms=["EdDSA"],
                    options={"verify_iss": False, "verify_aud": False},
                )
            except jwt.InvalidTokenError:
                pass
            else:
                token_issuer = issuer_diagnostic.get("iss")
                if isinstance(token_issuer, str):
                    logger.warning(
                        "Neon Auth issuer mismatch (configured=%r, signed token=%r)",
                        issuer[:256],
                        token_issuer[:256],
                    )
            raise
    except NeonAuthenticationError:
        raise
    except (httpx.HTTPError, jwt.InvalidTokenError, ValueError) as exc:
        logger.warning("Neon Auth token verification failed (%s)", type(exc).__name__)
        raise NeonAuthenticationError("Invalid Neon Auth token.") from exc

    if not isinstance(claims.get("sub"), str) or not claims["sub"]:
        raise NeonAuthenticationError("Neon Auth token is missing its subject.")

    return claims


__all__ = ["NeonAuthenticationError", "verify_neon_token"]
