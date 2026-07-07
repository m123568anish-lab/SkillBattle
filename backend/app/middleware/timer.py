import time

from fastapi import Request


async def request_timer(
    request: Request,
    call_next,
):
    start = time.time()

    response = await call_next(
        request
    )

    response.headers[
        "X-Process-Time"
    ] = str(
        round(
            time.time() - start,
            4,
        )
    )

    return response