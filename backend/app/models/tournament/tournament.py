import uuid
from datetime import datetime

from sqlalchemy import (
    String,
    Integer,
    DateTime,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from app.database.base import Base


class Tournament(Base):

    __tablename__ = "tournaments"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    title: Mapped[str] = mapped_column(
        String(150),
    )

    description: Mapped[str] = mapped_column(
        String(500),
    )

    difficulty: Mapped[str] = mapped_column(
        String(30),
    )

    max_players: Mapped[int] = mapped_column(
        Integer,
        default=16,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="registration",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )