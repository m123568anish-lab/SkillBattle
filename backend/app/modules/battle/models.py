"""
=========================================================
Battle Module
=========================================================
"""

from datetime import datetime
from uuid import uuid4

from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.user import User

class Battle(Base):
    """Model representing a battle between two users.

    Fields:
        id: UUID primary key.
        creator_id: FK to User who created the battle.
        opponent_id: FK to the joined user (nullable until joined).
        status: Battle status – pending, active, completed.
        name: Optional name for the battle.
        description: Optional description.
        created_at / updated_at timestamps.
    """

    __tablename__ = "battles"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    creator_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    opponent_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="pending", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    creator: Mapped[User] = relationship("User", foreign_keys=[creator_id])
    opponent: Mapped[User] = relationship("User", foreign_keys=[opponent_id])

    def __repr__(self):
        return f"<Battle {self.id} status={self.status}>"
