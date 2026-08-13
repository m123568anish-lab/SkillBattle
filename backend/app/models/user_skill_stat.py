from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.database.base import Base


class UserSkillStat(Base):
    """
    Tracks a user's performance across different subjects (e.g. Algorithms, SQL).
    """
    __tablename__ = "user_skill_stats"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id"),
        index=True,
        nullable=False,
    )

    subject: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    correct_attempts: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    total_attempts: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    user = relationship("User")
