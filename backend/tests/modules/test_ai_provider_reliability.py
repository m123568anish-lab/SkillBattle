from __future__ import annotations

import httpx
import pytest

from app.modules.ai.providers.request import request_with_retries
from app.modules.ai.providers.ollama_provider import OllamaProvider


@pytest.mark.asyncio
async def test_provider_retries_rate_limit_then_succeeds(monkeypatch):
    monkeypatch.setattr("app.modules.ai.providers.request.settings.AI_PROVIDER_MAX_ATTEMPTS", 3)
    delays = []

    async def fake_sleep(delay):
        delays.append(delay)

    monkeypatch.setattr("app.modules.ai.providers.request.asyncio.sleep", fake_sleep)
    responses = [
        httpx.Response(429, headers={"Retry-After": "0.25"}, request=httpx.Request("POST", "https://provider.test")),
        httpx.Response(200, request=httpx.Request("POST", "https://provider.test")),
    ]

    async def fake_request():
        return responses.pop(0)

    response = await request_with_retries(fake_request)

    assert response.status_code == 200
    assert delays == [0.25]


@pytest.mark.asyncio
async def test_provider_retries_timeout_with_bounded_attempts(monkeypatch):
    monkeypatch.setattr("app.modules.ai.providers.request.settings.AI_PROVIDER_MAX_ATTEMPTS", 2)
    monkeypatch.setattr("app.modules.ai.providers.request.settings.AI_PROVIDER_RETRY_BASE_SECONDS", 0.1)
    delays = []

    async def fake_sleep(delay):
        delays.append(delay)

    monkeypatch.setattr("app.modules.ai.providers.request.asyncio.sleep", fake_sleep)
    calls = 0

    async def fake_request():
        nonlocal calls
        calls += 1
        if calls == 1:
            raise httpx.ReadTimeout("provider timed out")
        return httpx.Response(200, request=httpx.Request("POST", "https://provider.test"))

    response = await request_with_retries(fake_request)

    assert response.status_code == 200
    assert calls == 2
    assert delays == [0.1]


@pytest.mark.asyncio
async def test_provider_does_not_retry_permanent_client_errors(monkeypatch):
    monkeypatch.setattr("app.modules.ai.providers.request.settings.AI_PROVIDER_MAX_ATTEMPTS", 3)
    calls = 0

    async def fake_request():
        nonlocal calls
        calls += 1
        return httpx.Response(401, request=httpx.Request("POST", "https://provider.test"))

    with pytest.raises(RuntimeError, match="HTTP 401"):
        await request_with_retries(fake_request)

    assert calls == 1


@pytest.mark.asyncio
async def test_provider_outage_error_is_sanitized(monkeypatch):
    monkeypatch.setattr("app.modules.ai.providers.request.settings.AI_PROVIDER_MAX_ATTEMPTS", 1)

    async def fake_request():
        raise httpx.ConnectError("https://user:secret-token@provider.invalid")

    with pytest.raises(RuntimeError) as error:
        await request_with_retries(fake_request)

    assert "secret-token" not in str(error.value)
    assert "ConnectError" in str(error.value)


@pytest.mark.asyncio
async def test_ollama_health_check_reports_outage_without_exposing_connection_details(monkeypatch):
    class UnavailableClient:
        def __init__(self, *, timeout):
            self.timeout = timeout

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_):
            return None

        async def get(self, url):
            raise httpx.ConnectError("connection refused: secret-token")

    monkeypatch.setattr("app.modules.ai.providers.ollama_provider.httpx.AsyncClient", UnavailableClient)
    health = await OllamaProvider(host="http://provider.invalid").health_check()

    assert health["available"] is False
    assert health["provider"] == "ollama"
    assert health["detail"] == "ConnectError"
    assert "secret-token" not in str(health)
