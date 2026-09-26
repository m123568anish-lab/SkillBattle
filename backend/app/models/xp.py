from sqlalchemy import ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import (
    mapped_column,
    Mapped,
)

from app.database.base import Base


class XP(Base):
    __tablename__ = "xp"
    __table_args__ = (UniqueConstraint("user_id", name="uq_xp_user_id"),)

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    total_xp: Mapped[int] = mapped_column(
        Integer,
        default=0,
        index=True,
    )

    weekly_xp: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    daily_xp: Mapped[int] = mapped_column(
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

    @property
    def next_level_xp(self) -> int:
        return self.level * 500