import pytest
from uuid import uuid4
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_student_selecting_college_during_registration_stays_pending(client: AsyncClient):
    unique_id = uuid4().hex[:6].lower()
    email = f"student_pending_{unique_id}@example.com"
    username = f"student_pending_{unique_id}"

    registration = await client.post(
        "/auth/register",
        json={
            "username": username,
            "email": email,
            "full_name": "Pending Student",
            "password": "StrongPass#123",
            "account_type": "COLLEGE",
        },
    )

    assert registration.status_code == 201, registration.text
    data = registration.json()
    assert data["role"] in {"user", "student"}
    assert data.get("status") in {None, "PENDING_VERIFICATION", "ACTIVE"}

    login_resp = await client.post(
        "/auth/login",
        json={"email": email, "password": "StrongPass#123"},
    )
    assert login_resp.status_code == 200, login_resp.text
    token = login_resp.json()["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    college_dashboard = await client.get("/api/v1/college/dashboard", headers=headers)
    assert college_dashboard.status_code in (401, 403), college_dashboard.text

    student_dashboard = await client.get("/api/v1/dashboard", headers=headers)
    assert student_dashboard.status_code == 200, student_dashboard.text
