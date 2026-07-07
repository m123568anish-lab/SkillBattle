from fastapi import FastAPI

from app.middleware.request_id import add_request_id
from app.middleware.timer import request_timer
from app.middleware.request_logger import RequestLoggerMiddleware


def register_middleware(app: FastAPI) -> None:
    app.middleware("http")(request_timer)
    app.middleware("http")(add_request_id)
    app.add_middleware(RequestLoggerMiddleware)
