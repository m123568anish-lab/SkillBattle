import pytest


@pytest.mark.asyncio
async def test_battle_health(

    client,

):

    response = await client.get(

        "/battle/health",

    )

    assert response.status_code == 200