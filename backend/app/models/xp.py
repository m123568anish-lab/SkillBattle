from sqlalchemy import Integer
from sqlalchemy.orm import (
    mapped_column,
    Mapped,
)

from app.database.base import Base


class XP(Base):
    __tablename__ = "xp"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    user_id: Mapped[str]

    total_xp: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    weekly_xp: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    level: Mapped[int] = mapped_column(
        Integer,
        default=1,
    )

    rank: Mapped[int] = mapped_column(
        Integer,
        default=99999,
    )