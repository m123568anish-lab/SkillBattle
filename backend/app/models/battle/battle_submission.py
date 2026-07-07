import uuid
from datetime import datetime

from sqlalchemy import (
    String,
    Integer,
    DateTime,
    ForeignKey,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from app.database.base import Base


class BattleSubmission(Base):

    __tablename__ = "battle_submissions"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    battle_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("battle_rooms.id"),
        nullable=False,
    )

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id"),
        nullable=False,
    )

    language: Mapped[str] = mapped_column(
        String(30),
    )

    verdict: Mapped[str] = mapped_column(
        String(50),
    )

    passed_tests: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    total_tests: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    submitted_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )