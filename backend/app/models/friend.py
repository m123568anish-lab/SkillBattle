"""
SkillBattle Friendship Model
"""

from __future__ import annotations
from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, String, UniqueConstraint, Integer
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.database.base import Base

class Friendship(Base):
    """Simple many‑to‑many friendship table.
    Each row stores a unique pair of user IDs.
    """

    __tablename__ = "friendships"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    friend_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (UniqueConstraint("user_id", "friend_id", name="uq_friendship_pair"),)

    # Optional relationships for convenience
    user = relationship("User", foreign_keys=[user_id], backref="friendships_sent")
    friend = relationship("User", foreign_keys=[friend_id], backref="friendships_received")
