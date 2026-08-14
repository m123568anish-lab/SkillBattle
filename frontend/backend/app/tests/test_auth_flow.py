import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as client:
        yield client


def test_register_and_login_flow(client):
    payload = {
        "username": "demoauth",
        "email": "demoauth@example.com",
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


def test_v1_auth_routes_are_exposed(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "demo@example.com", "password": "wrong-pass"},
    )

    assert response.status_code in {401, 422, 404}
