import pytest


@pytest.mark.asyncio
async def test_login_invalid(client):

    response = await client.post(

        "/auth/login",

        json={

            "email": "wrong@test.com",

            "password": "123456",

        },

    )

    assert response.status_code in (

        400,

        401,

    )