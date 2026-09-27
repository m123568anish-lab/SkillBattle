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