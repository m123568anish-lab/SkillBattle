from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    String,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from app.database.base import Base


class Achievement(Base):
    __tablename__ = "achievements"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id"),
        index=True,
        nullable=False,
    )

    title: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
    )

    description: Mapped[str] = mapped_column(
        String(300),
        default="",
    )

    icon: Mapped[str] = mapped_column(
        String(50),
        default="trophy",
    )

    unlocked: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    earned_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )
