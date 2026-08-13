import pytest


@pytest.mark.asyncio
async def test_tournament_health(

    client,

):

    response = await client.get(

        "/tournament/health",

    )

    assert response.status_code == 200