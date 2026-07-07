from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    String,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.database.base import Base


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id"),
        unique=True,
    )

    avatar: Mapped[str] = mapped_column(
        String(500),
        default="",
    )

    bio: Mapped[str] = mapped_column(
        String(1000),
        default="",
    )

    college: Mapped[str] = mapped_column(
        String(200),
        default="",
    )

    branch: Mapped[str] = mapped_column(
        String(100),
        default="",
    )

    graduation_year: Mapped[int] = mapped_column(
        default=2027,
    )

    target_company: Mapped[str] = mapped_column(
        String(120),
        default="",
    )

    target_package: Mapped[str] = mapped_column(
        String(50),
        default="",
    )

    github: Mapped[str] = mapped_column(
        String(300),
        default="",
    )

    linkedin: Mapped[str] = mapped_column(
        String(300),
        default="",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    user = relationship("User")