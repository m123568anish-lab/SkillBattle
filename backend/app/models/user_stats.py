from __future__ import annotations

from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class UserStats(Base):
    __tablename__ = "user_stats"
    __table_args__ = (UniqueConstraint("user_id", name="uq_user_stats_user_id"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    level: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    rating: Mapped[int] = mapped_column(Integer, default=1000, nullable=False)
    xp: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class UserSettings(Base):
    __tablename__ = "user_settings"
    __table_args__ = (UniqueConstraint("user_id", name="uq_user_settings_user_id"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    theme: Mapped[str] = mapped_column(String(20), default="dark", nullable=False)
    language: Mapped[str] = mapped_column(String(20), default="python", nullable=False)
