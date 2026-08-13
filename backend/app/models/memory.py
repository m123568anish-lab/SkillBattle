from datetime import datetime

from sqlalchemy import (
    String,
    DateTime,
    ForeignKey,
    Text,
)

from sqlalchemy.orm import (
    mapped_column,
    Mapped,
)

from app.database.base import Base


class Memory(Base):

    __tablename__ = "memory"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id")
    )

    category: Mapped[str] = mapped_column(
        String(80)
    )

    title: Mapped[str] = mapped_column(
        String(200)
    )

    content: Mapped[str] = mapped_column(
        Text
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )