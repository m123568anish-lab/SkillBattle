import pytest


@pytest.mark.asyncio
async def test_xp_requires_auth(

    client,

):

    response = await client.get(

        "/xp",

    )

    assert response.status_code == 401