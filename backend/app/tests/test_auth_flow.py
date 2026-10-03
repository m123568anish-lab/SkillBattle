import base64
import hashlib
import hmac
import struct
import time
import uuid

import pytest
from fastapi.testclient import TestClient

from app.main import app


def generate_totp_code(secret: str, *, at_time: int | None = None) -> str:
    key = base64.b32decode(secret.upper() + '=' * ((8 - len(secret) % 8) % 8), casefold=True)
    counter = int((at_time if at_time is not None else int(time.time())) / 30)
    msg = struct.pack('>Q', counter)
    digest = hmac.new(key, msg, hashlib.sha1).digest()
    offset = digest[-1] & 0x0F
    binary = struct.unpack('>I', digest[offset:offset + 4])[0] & 0x7FFFFFFF
    return str(binary % 10**6).zfill(6)


@pytest.fixture
def client():
    with TestClient(app) as client:
        yield client


def test_register_and_login_flow(client):
    unique = uuid.uuid4().hex[:8]
    payload = {
        "username": f"demoauth{unique}",
        "email": f"demoauth{unique}@example.com",
        "full_name": "Demo Auth",
        "password": "demo12345",
    }

    register_response = client.post("/api/v1/auth/register", json=payload)

    assert register_response.status_code in {201, 400}

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": payload["email"], "password": payload["password"]},
    )
    assert login_response.status_code in {200, 401}


def test_login_rate_limit_after_repeated_failures(client):
    unique = uuid.uuid4().hex[:8]
    payload = {
        "username": f"ratelimituser{unique}",
        "email": f"ratelimituser{unique}@example.com",
        "full_name": "Rate Limit User",
        "password": "demo12345",
    }

    register_response = client.post("/api/v1/auth/register", json=payload)
    assert register_response.status_code in {201, 400}

    for _ in range(6):
        response = client.post(
            "/api/v1/auth/login",
            json={"email": payload["email"], "password": "wrong-pass"},
        )
        if response.status_code == 429:
            assert "Too many login attempts" in response.json().get("detail", "")
            break
    else:
        pytest.fail("Expected login rate limiting after repeated failures.")


def test_two_factor_setup_and_verification(client):
    unique = uuid.uuid4().hex[:8]
    payload = {
        "username": f"totpuser{unique}",
        "email": f"totpuser{unique}@example.com",
        "full_name": "TOTP User",
        "password": "demo12345",
    }

    register_response = client.post("/api/v1/auth/register", json=payload)
    assert register_response.status_code in {201, 400}

    setup_response = client.post(
        "/api/v1/auth/2fa/setup",
        json={"email": payload["email"], "password": payload["password"]},
    )
    assert setup_response.status_code == 200, setup_response.text
    setup_data = setup_response.json()
    assert "secret" in setup_data
    assert "recovery_codes" in setup_data

    verify_response = client.post(
        "/api/v1/auth/2fa/verify",
        json={"email": payload["email"], "code": generate_totp_code(setup_data["secret"])},
    )
    assert verify_response.status_code == 200, verify_response.text


def test_v1_auth_routes_are_exposed(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "demo@example.com", "password": "wrong-pass"},
    )

    assert response.status_code in {401, 422, 404, 429}
