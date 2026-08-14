import uuid
from datetime import datetime

from sqlalchemy import (
    String,
    Integer,
    Float,
    DateTime,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from app.database.base import Base


class ApiRequestLog(Base):

    __tablename__ = "api_request_logs"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    api_key: Mapped[str] = mapped_column(
        String(128),
    )

    endpoint: Mapped[str] = mapped_column(
        String(255),
    )

    method: Mapped[str] = mapped_column(
        String(10),
    )

    status_code: Mapped[int] = mapped_column(
        Integer,
    )

    response_time: Mapped[float] = mapped_column(
        Float,
    )

    client_ip: Mapped[str] = mapped_column(
        String(64),
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )