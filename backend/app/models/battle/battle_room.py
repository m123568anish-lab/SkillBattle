import uuid
from datetime import datetime

from sqlalchemy import (
    String,
    DateTime,
    Integer,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from app.database.base import Base


class BattleRoom(Base):

    __tablename__ = "battle_rooms"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    title: Mapped[str] = mapped_column(
        String(120),
    )

    difficulty: Mapped[str] = mapped_column(
        String(30),
    )

    problem_id: Mapped[int] = mapped_column(
        Integer,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="waiting",
    )

    max_players: Mapped[int] = mapped_column(
        Integer,
        default=2,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )