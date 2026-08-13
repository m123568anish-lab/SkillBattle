from fastapi import FastAPI

from app.middleware.request_logger import RequestLoggerMiddleware


def register_middleware(app: FastAPI) -> None:
    app.add_middleware(RequestLoggerMiddleware)
