"""
=========================================================

SkillBattle

User Model

Production-ready user model for authentication.

=========================================================
"""

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Integer,
    String,
)

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class User(Base):
    """
    User model for authentication and profile management.
    
    Core authentication fields:
    - email: Unique email address (login credential)
    - username: Unique username
    - password_hash: Bcrypt/Argon2 hashed password
    - is_active: Account enabled/disabled
    - is_verified: Email verified
    
    Profile fields:
    - full_name: User's display name
    - avatar_url: Profile picture URL
    - role: User role (user, mentor, admin)
    
    Tracking fields:
    - last_login: Last authentication time
    - created_at: Account creation
    - updated_at: Last profile update
    """
    
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    username: Mapped[str] = mapped_column(
        String(30),
        unique=True,
        index=True,
        nullable=False,
    )

    full_name: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    role: Mapped[str] = mapped_column(
        String(50),
        default="user",
        nullable=False,
    )

    avatar_url: Mapped[str | None] = mapped_column(
        String(500),
        default=None,
        nullable=True,
    )

    bio: Mapped[str | None] = mapped_column(
        String(1000),
        default="",
        nullable=True,
    )

    country: Mapped[str | None] = mapped_column(
        String(100),
        default="",
        nullable=True,
    )

    city: Mapped[str | None] = mapped_column(
        String(100),
        default="",
        nullable=True,
    )

    website: Mapped[str | None] = mapped_column(
        String(500),
        default="",
        nullable=True,
    )

    github_url: Mapped[str | None] = mapped_column(
        String(500),
        default="",
        nullable=True,
    )

    linkedin_url: Mapped[str | None] = mapped_column(
        String(500),
        default="",
        nullable=True,
    )

    login_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    coding_rating: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    placement_score: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    resume_score: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
    )

    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
    )

    last_login: Mapped[datetime | None] = mapped_column(
        DateTime,
        default=None,
        nullable=True,
    )

    is_superuser: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    refresh_tokens = relationship(
        "RefreshToken",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    def update_last_login(self) -> None:
        """Update last_login timestamp to current UTC time."""
        self.last_login = datetime.utcnow()

    def __repr__(self):
        return f"<User {self.email}>"