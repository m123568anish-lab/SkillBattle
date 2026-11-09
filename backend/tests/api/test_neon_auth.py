import base64
from datetime import datetime, timedelta, timezone
from uuid import uuid4

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
from sqlalchemy import select

from app.core.config import settings
from app.core.dependencies import _get_or_create_neon_user
from app.core.security import neon as neon_security
from app.database.session import AsyncSessionLocal
from app.models.profile import Profile
from app.models.user import User


def _b64url(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


@pytest.mark.asyncio
async def test_neon_token_verifies_against_configured_jwks(monkeypatch):
    issuer = "https://auth.example.test/neondb/auth"
    private_key = Ed25519PrivateKey.generate()
    public_key = private_key.public_key().public_bytes(Encoding.Raw, PublicFormat.Raw)
    jwks = [{
        "kty": "OKP",
        "crv": "Ed25519",
        "x": _b64url(public_key),
        "kid": "test-key",
        "alg": "EdDSA",
        "use": "sig",
    }]
    token = jwt.encode(
        {
            "iss": issuer,
            "sub": "neon-user-test",
            "email": "neon@example.test",
            "email_verified": True,
            "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
        },
        private_key,
        algorithm="EdDSA",
        headers={"kid": "test-key"},
    )

    async def get_jwks():
        return jwks

    monkeypatch.setattr(settings, "NEON_AUTH_BASE_URL", issuer)
    monkeypatch.setattr(settings, "NEON_AUTH_JWKS_URL", f"{issuer}/.well-known/jwks.json")
    monkeypatch.setattr(neon_security, "_get_jwks", get_jwks)

    claims = await neon_security.verify_neon_token(token)

    assert claims["sub"] == "neon-user-test"
    assert claims["email_verified"] is True


@pytest.mark.asyncio
async def test_neon_token_reports_missing_api_configuration(monkeypatch):
    token = jwt.encode(
        {"sub": "neon-user-test"},
        Ed25519PrivateKey.generate(),
        algorithm="EdDSA",
    )
    monkeypatch.setattr(settings, "NEON_AUTH_BASE_URL", "")
    monkeypatch.setattr(settings, "NEON_AUTH_JWKS_URL", "")

    with pytest.raises(neon_security.NeonAuthenticationConfigurationError):
        await neon_security.verify_neon_token(token)


@pytest.mark.asyncio
async def test_unconfigured_neon_token_returns_service_error(client, monkeypatch):
    token = jwt.encode(
        {"sub": "neon-user-test"},
        Ed25519PrivateKey.generate(),
        algorithm="EdDSA",
    )
    monkeypatch.setattr(settings, "NEON_AUTH_BASE_URL", "")
    monkeypatch.setattr(settings, "NEON_AUTH_JWKS_URL", "")

    response = await client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 503
    assert response.json()["detail"] == (
        "Neon Auth verification is not configured on the application API."
    )


@pytest.mark.asyncio
async def test_unverified_new_neon_identity_creates_and_reuses_local_user(client):
    unique_id = uuid4().hex[:8]
    neon_user_id = f"neon_user_{unique_id}"
    email = f"neon_{unique_id}@example.test"

    async with AsyncSessionLocal() as db:
        user = await _get_or_create_neon_user(
            db,
            {
                "sub": neon_user_id,
                "email": email,
                "email_verified": False,
                "name": "Neon Test User",
            },
        )
        assert user.neon_user_id == neon_user_id
        assert user.email == email
        assert user.is_verified is True
        assert user.is_verified is True

        profile_result = await db.execute(
            select(Profile).where(Profile.user_id == user.id)
        )
        profile = profile_result.scalar_one_or_none()
        assert profile is not None
        assert profile.onboarding_preferences == {}

        existing = await _get_or_create_neon_user(
            db,
            {
                "sub": neon_user_id,
                "email": email,
                "email_verified": False,
                "name": "Neon Test User",
            },
        )
        assert existing.id == user.id


@pytest.mark.asyncio
async def test_neon_identity_requires_verified_email_to_link_existing_user(client):
    unique_id = uuid4().hex[:8]
    email = f"existing_{unique_id}@example.com"
    response = await client.post("/auth/register", json={
        "username": f"existing_{unique_id}",
        "email": email,
        "full_name": "Existing User",
        "password": "StrongPass#123",
    })
    assert response.status_code == 201
    user_id = response.json()["id"]

    async with AsyncSessionLocal() as db:
        user = await db.get(User, user_id)
        with pytest.raises(neon_security.NeonAuthenticationError):
            await _get_or_create_neon_user(
                db,
                {
                    "sub": f"neon_user_{unique_id}",
                    "email": email,
                    "email_verified": False,
                },
            )
        assert user is not None
        assert user.neon_user_id is None


@pytest.mark.asyncio
async def test_neon_profile_error_does_not_fall_through_to_clerk(client, monkeypatch):
    unique_id = uuid4().hex[:8]
    email = f"unverified_{unique_id}@example.com"
    registration = await client.post("/auth/register", json={
        "username": f"unverified_{unique_id}",
        "email": email,
        "full_name": "Existing User",
        "password": "StrongPass#123",
    })
    assert registration.status_code == 201, registration.text

    async def verify_neon_token(token: str) -> dict:
        return {
            "sub": f"neon_user_{unique_id}",
            "email": email,
            "email_verified": False,
        }

    async def reject_clerk_fallback(token: str) -> dict:
        pytest.fail("A verified Neon token's profile error must not trigger Clerk fallback.")

    monkeypatch.setattr("app.core.dependencies.verify_neon_token", verify_neon_token)
    monkeypatch.setattr("app.core.dependencies.verify_clerk_token", reject_clerk_fallback)
    response = await client.get(
        "/auth/me",
        headers={"Authorization": "Bearer valid-neon-token"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == (
        "Verify your Neon Auth email before linking this existing account."
    )


@pytest.mark.asyncio
async def test_neon_identity_links_existing_user_with_legacy_password(client, monkeypatch):
    unique_id = uuid4().hex[:8]
    email = f"link_{unique_id}@example.com"
    password = "StrongPass#123"
    registration = await client.post("/auth/register", json={
        "username": f"link_{unique_id}",
        "email": email,
        "full_name": "Legacy Account",
        "password": password,
    })
    assert registration.status_code == 201, registration.text
    user_id = registration.json()["id"]
    neon_user_id = f"neon_link_{unique_id}"

    async def verify_token(token: str) -> dict:
        assert token == "valid-neon-token"
        return {
            "sub": neon_user_id,
            "email": email,
            "email_verified": False,
        }

    monkeypatch.setattr("app.modules.auth.router.verify_neon_token", verify_token)
    response = await client.post(
        "/auth/neon/link",
        headers={"Authorization": "Bearer valid-neon-token"},
        json={"password": password},
    )

    assert response.status_code == 200, response.text
    async with AsyncSessionLocal() as db:
        user = await db.get(User, user_id)
        assert user is not None
        assert user.neon_user_id == neon_user_id


@pytest.mark.asyncio
async def test_neon_identity_link_rejects_wrong_password_and_two_factor(client, monkeypatch):
    unique_id = uuid4().hex[:8]
    email = f"link_guard_{unique_id}@example.com"
    password = "StrongPass#123"
    registration = await client.post("/auth/register", json={
        "username": f"link_guard_{unique_id}",
        "email": email,
        "full_name": "Legacy Account",
        "password": password,
    })
    assert registration.status_code == 201, registration.text
    user_id = registration.json()["id"]

    async def verify_token(token: str) -> dict:
        return {
            "sub": f"neon_link_guard_{unique_id}",
            "email": email,
            "email_verified": False,
        }

    monkeypatch.setattr("app.modules.auth.router.verify_neon_token", verify_token)
    headers = {"Authorization": "Bearer valid-neon-token"}

    wrong_password = await client.post(
        "/auth/neon/link",
        headers=headers,
        json={"password": "OtherPass#123"},
    )
    assert wrong_password.status_code == 401

    async with AsyncSessionLocal() as db:
        user = await db.get(User, user_id)
        assert user is not None
        user.two_factor_enabled = True
        await db.commit()

    two_factor_account = await client.post(
        "/auth/neon/link",
        headers=headers,
        json={"password": password},
    )
    assert two_factor_account.status_code == 403
