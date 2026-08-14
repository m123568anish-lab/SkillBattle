import pytest


@pytest.mark.asyncio
async def test_ai_health(

    client,

):

    response = await client.get(

        "/ai/health",

    )

    assert response.status_code == 200