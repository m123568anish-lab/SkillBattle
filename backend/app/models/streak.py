from datetime import datetime

from sqlalchemy import (
    Integer,
    DateTime,
)

from sqlalchemy.orm import (
    mapped_column,
    Mapped,
)

from app.database.base import Base


class Streak(Base):
    __tablename__ = "streak"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    user_id: Mapped[str]

    current_streak: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    best_streak: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    last_active: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )