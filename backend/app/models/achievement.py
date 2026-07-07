from datetime import datetime

from sqlalchemy import (
    String,
    Boolean,
    DateTime,
)

from sqlalchemy.orm import (
    mapped_column,
    Mapped,
)

from app.database.base import Base


class Achievement(Base):
    __tablename__ = "achievements"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    user_id: Mapped[str]

    title: Mapped[str] = mapped_column(
        String(120),
    )

    description: Mapped[str] = mapped_column(
        String(300),
    )

    icon: Mapped[str] = mapped_column(
        String(50),
    )

    unlocked: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    earned_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )