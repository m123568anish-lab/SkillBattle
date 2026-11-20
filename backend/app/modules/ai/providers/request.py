from __future__ import annotations

import asyncio
import logging
from collections.abc import Awaitable, Callable

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


async def request_with_retries(
    request: Callable[[], Awaitable[httpx.Response]],
) -> httpx.Response:
    attempts = max(1, settings.AI_PROVIDER_MAX_ATTEMPTS)
    base_delay = max(0.0, settings.AI_PROVIDER_RETRY_BASE_SECONDS)

    for attempt in range(attempts):
        try:
            response = await request()
            if response.status_code != 429 and response.status_code < 500:
                try:
                    response.raise_for_status()
                except httpx.HTTPStatusError as exc:
                    raise RuntimeError(
                        f"AI provider returned HTTP {exc.response.status_code}."
                    ) from exc
                return response
            if attempt == attempts - 1:
                try:
                    response.raise_for_status()
                except httpx.HTTPStatusError as exc:
                    raise RuntimeError(
                        f"AI provider returned HTTP {exc.response.status_code} after retries."
                    ) from exc
            retry_after = response.headers.get("Retry-After")
            try:
                delay = min(float(retry_after), 10.0) if retry_after else base_delay * (2**attempt)
            except ValueError:
                delay = base_delay * (2**attempt)
        except (httpx.TimeoutException, httpx.TransportError) as exc:
            if attempt == attempts - 1:
                raise RuntimeError(
                    f"AI provider request failed: {type(exc).__name__}."
                ) from exc
            delay = base_delay * (2**attempt)

        logger.warning(
            "AI provider request failed transiently; retry %s/%s in %.2fs",
            attempt + 1,
            attempts - 1,
            delay,
        )
        await asyncio.sleep(min(delay, 10.0))

    raise RuntimeError("AI provider request exhausted its retry limit.")
