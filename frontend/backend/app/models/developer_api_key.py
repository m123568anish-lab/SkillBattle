import secrets
import uuid

from datetime import datetime

from sqlalchemy import (
    String,
    DateTime,
    ForeignKey,
    Boolean,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from app.database.base import Base


class DeveloperApiKey(Base):

    __tablename__ = "developer_api_keys"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id"),
    )

    api_key: Mapped[str] = mapped_column(
        String(128),
        default=lambda: secrets.token_hex(32),
        unique=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
    )

    scope: Mapped[str] = mapped_column(
    String(30),
    default="read",
)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )