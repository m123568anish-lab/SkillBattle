from sqlalchemy import (
    String,
)

from sqlalchemy.orm import (
    mapped_column,
    Mapped,
)

from app.database.base import Base


class Challenge(Base):
    __tablename__ = "daily_challenges"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    title: Mapped[str] = mapped_column(
        String(200),
    )

    difficulty: Mapped[str] = mapped_column(
        String(50),
    )

    category: Mapped[str] = mapped_column(
        String(100),
    )