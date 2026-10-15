import pytest


@pytest.mark.asyncio
async def test_profile_requires_auth(

    client,

):

    response = await client.get(

        "/profile",

    )

    assert response.status_code == 401

    skill_profile_response = await client.get("/api/v1/profile/skill-profile")
    assert skill_profile_response.status_code == 401

    sharing_response = await client.get("/api/v1/profile/sharing-settings")
    assert sharing_response.status_code == 401

    preferences_response = await client.get("/profile/preferences")
    assert preferences_response.status_code == 401


@pytest.mark.asyncio
async def test_preferences_get_and_update(client):
    from uuid import uuid4
    uid = uuid4().hex[:6]
    email = f"pref_{uid}@example.com"
    username = f"pref_{uid}"

    reg_resp = await client.post(
        "/auth/register",
        json={
            "username": username,
            "email": email,
            "full_name": "Preferences Test User",
            "password": "StrongPass#123",
        },
    )
    assert reg_resp.status_code == 201

    login_resp = await client.post(
        "/auth/login",
        json={"email": email, "password": "StrongPass#123"},
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # GET preferences default
    pref_get = await client.get("/profile/preferences", headers=headers)
    assert pref_get.status_code == 200
    data = pref_get.json()
    assert data["theme"] in {"dark", "light", "system"}
    assert "email_battles" in data["notification_preferences"]

    # UPDATE preferences
    pref_put = await client.put(
        "/profile/preferences",
        headers=headers,
        json={
            "theme": "light",
            "language": "python",
            "notification_preferences": {
                "email_battles": False,
                "email_achievements": True,
                "email_marketing": True,
            },
        },
    )
    assert pref_put.status_code == 200
    updated = pref_put.json()
    assert updated["theme"] == "light"
    assert updated["notification_preferences"]["email_battles"] is False
    assert updated["notification_preferences"]["email_marketing"] is True

    # Verify persistence on re-fetch
    verify_get = await client.get("/profile/preferences", headers=headers)
    assert verify_get.status_code == 200
    assert verify_get.json()["theme"] == "light"
    assert verify_get.json()["notification_preferences"]["email_battles"] is False


@pytest.mark.asyncio
async def test_new_user_onboarding_lifecycle(client):
    from uuid import uuid4
    uid = uuid4().hex[:6]
    email = f"onboard_{uid}@example.com"
    username = f"onboard_{uid}"
    password = "StrongPass#123"

    reg = await client.post(
        "/auth/register",
        json={
            "username": username,
            "email": email,
            "full_name": "Onboarding Test User",
            "password": password,
        },
    )
    assert reg.status_code == 201
    assert reg.json()["onboarding_completed"] is False

    login = await client.post(
        "/auth/login",
        json={"email": email, "password": password},
    )
    assert login.status_code == 200
    token = login.json()["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Profile fetch must return onboarding_completed: False
    me_resp = await client.get("/profile/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["onboarding_completed"] is False

    # Update profile with onboarding preferences
    update_resp = await client.put(
        "/profile",
        headers=headers,
        json={
            "target_company": "Google",
            "graduation_year": 2026,
            "onboarding_preferences": {
                "languages": ["python", "typescript"],
                "target": "top_product",
            },
        },
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["target_company"] == "Google"
    assert update_resp.json()["onboarding_preferences"]["target"] == "top_product"

    # Explicit completion of onboarding
    complete_resp = await client.post("/profile/onboarding/complete", headers=headers)
    assert complete_resp.status_code == 200
    assert complete_resp.json()["onboarding_completed"] is True

    # Auth me and profile me must both reflect onboarding_completed: True
    verify_me = await client.get("/auth/me", headers=headers)
    assert verify_me.status_code == 200
    assert verify_me.json()["onboarding_completed"] is True

    verify_prof = await client.get("/profile/me", headers=headers)
    assert verify_prof.status_code == 200
    assert verify_prof.json()["onboarding_completed"] is True