import logging
import re

from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
import pytest

from app.main import global_exception_handler
from app.middleware.request_id import RequestIDMiddleware


@pytest.mark.asyncio
async def test_global_exception_handler_logs_correlated_safe_traceback(caplog):
    test_app = FastAPI()
    test_app.add_middleware(RequestIDMiddleware)
    test_app.add_exception_handler(Exception, global_exception_handler)

    @test_app.get("/api/v1/leaderboard")
    def raise_database_error():
        raise RuntimeError("sensitive SQL parameter value")

    with caplog.at_level(logging.ERROR, logger="app.main"):
        async with AsyncClient(
            transport=ASGITransport(app=test_app, raise_app_exceptions=False),
            base_url="http://test",
        ) as client:
            response = await client.get(
                "/api/v1/leaderboard",
                params={"token": "sensitive query value"},
            )

    assert response.status_code == 500
    assert response.json() == {
        "success": False,
        "message": "Internal Server Error",
        "path": "/api/v1/leaderboard",
    }

    assert re.search(
        r"request_id=[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}",
        caplog.text,
    )
    assert "method=GET" in caplog.text
    assert "path=/api/v1/leaderboard" in caplog.text
    assert "exception_type=RuntimeError" in caplog.text
    assert "raise_database_error" in caplog.text
    assert "sensitive SQL parameter value" not in caplog.text
    assert "sensitive query value" not in caplog.text
    assert all(record.exc_info is None for record in caplog.records)
