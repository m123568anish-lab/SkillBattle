import pytest


@pytest.mark.asyncio
async def test_profile_requires_auth(

    client,

):

    response = await client.get(

        "/profile",

    )

    assert response.status_code == 401