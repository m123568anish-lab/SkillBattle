import pytest
from io import BytesIO
from uuid import uuid4
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_avatar_upload_and_delete(client: AsyncClient):
    # 1. Register & Login User
    uid = uuid4().hex[:6]
    email = f"avatar_user_{uid}@example.com"
    username = f"avatar_user_{uid}"

    reg_resp = await client.post(
        "/auth/register",
        json={
            "username": username,
            "email": email,
            "full_name": "Avatar Test User",
            "password": "StrongPass#123",
        },
    )
    assert reg_resp.status_code == 201, reg_resp.text

    login_resp = await client.post(
        "/auth/login",
        json={"email": email, "password": "StrongPass#123"},
    )
    assert login_resp.status_code == 200, login_resp.text
    token = login_resp.json()["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Upload Profile Avatar (Valid Image)
    fake_png_data = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
    files = {"file": ("test_avatar.png", BytesIO(fake_png_data), "image/png")}

    upload_resp = await client.post("/profile/avatar", headers=headers, files=files)
    assert upload_resp.status_code == 200, upload_resp.text
    profile_data = upload_resp.json()
    assert "/uploads/avatars/" in profile_data["avatar"]

    # 3. Verify Profile Return
    me_resp = await client.get("/profile/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["avatar"] == profile_data["avatar"]

    # 4. Remove Avatar
    delete_resp = await client.delete("/profile/avatar", headers=headers)
    assert delete_resp.status_code == 200, delete_resp.text
    assert delete_resp.json()["avatar"] == ""


@pytest.mark.asyncio
async def test_account_deletion_flow(client: AsyncClient):
    # 1. Register & Login User
    uid = uuid4().hex[:6]
    email = f"del_user_{uid}@example.com"
    username = f"del_user_{uid}"

    reg_resp = await client.post(
        "/auth/register",
        json={
            "username": username,
            "email": email,
            "full_name": "Deletion Candidate",
            "password": "StrongPass#123",
        },
    )
    assert reg_resp.status_code == 201

    login_resp = await client.post(
        "/auth/login",
        json={"email": email, "password": "StrongPass#123"},
    )
    token = login_resp.json()["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Reject Incorrect Confirmation
    invalid_del = await client.request(
        "DELETE",
        "/auth/account",
        headers=headers,
        json={"confirmation": "WRONG_TEXT"},
    )
    assert invalid_del.status_code == 422

    # 3. Successful Deletion with 'DELETE'
    valid_del = await client.request(
        "DELETE",
        "/auth/account",
        headers=headers,
        json={"confirmation": "DELETE"},
    )
    assert valid_del.status_code == 200, valid_del.text
    assert "permanently deleted" in valid_del.json()["message"].lower()

    # 4. Verify Tokens & Protected Routes Are Rejected
    protected_resp = await client.get("/auth/me", headers=headers)
    assert protected_resp.status_code == 401
