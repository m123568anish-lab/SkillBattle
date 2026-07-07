import time

from starlette.middleware.base import BaseHTTPMiddleware


class RequestLoggerMiddleware(BaseHTTPMiddleware):

    async def dispatch(
        self,
        request,
        call_next,
    ):

        start = time.perf_counter()

        response = await call_next(request)

        elapsed = (
            time.perf_counter() - start
        ) * 1000

        print(
            f"{request.method} "
            f"{request.url.path} "
            f"{response.status_code} "
            f"{elapsed:.2f} ms"
        )

        return response