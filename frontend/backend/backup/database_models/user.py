"""
=========================================================

SkillBattle

User ORM Model

=========================================================
"""

from __future__ import annotations

from sqlalchemy import Boolean
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship

from app.database.base import Base
from app.database.models.base_mixins import (
    TimestampMixin,
    UUIDMixin,
)


class User(

    Base,

    UUIDMixin,

    TimestampMixin,

):

    __tablename__ = "users"

    # --------------------------------------------------
    # Authentication
    # --------------------------------------------------

    username: Mapped[str] = mapped_column(

        String(50),

        unique=True,

        nullable=False,

        index=True,

    )

    email: Mapped[str] = mapped_column(

        String(255),

        unique=True,

        nullable=False,

        index=True,

    )

    password_hash: Mapped[str] = mapped_column(

        String(255),

        nullable=False,

    )

    # --------------------------------------------------
    # Profile
    # --------------------------------------------------

    full_name: Mapped[str] = mapped_column(

        String(255),

        nullable=False,

    )

    bio: Mapped[str | None] = mapped_column(

        String(1000),

    )

    avatar_url: Mapped[str | None] = mapped_column(

        String(500),

    )

    country: Mapped[str | None] = mapped_column(

        String(100),

    )

    city: Mapped[str | None] = mapped_column(

        String(100),

    )

    website: Mapped[str | None] = mapped_column(

        String(500),

    )

    github_url: Mapped[str | None] = mapped_column(

        String(500),

    )

    linkedin_url: Mapped[str | None] = mapped_column(

        String(500),

    )

    # --------------------------------------------------
    # Account
    # --------------------------------------------------

    role: Mapped[str] = mapped_column(

        String(30),

        default="user",

    )

    is_active: Mapped[bool] = mapped_column(

        Boolean,

        default=True,

    )

    is_verified: Mapped[bool] = mapped_column(

        Boolean,

        default=False,

    )

    is_superuser: Mapped[bool] = mapped_column(

        Boolean,

        default=False,

    )

    login_count: Mapped[int] = mapped_column(

        Integer,

        default=0,

    )

    # --------------------------------------------------
    # Statistics
    # --------------------------------------------------

    coding_rating: Mapped[int] = mapped_column(

        Integer,

        default=800,

    )

    placement_score: Mapped[int] = mapped_column(

        Integer,

        default=0,

    )

    resume_score: Mapped[int] = mapped_column(

        Integer,

        default=0,

    )

    # --------------------------------------------------
    # Relationships
    # --------------------------------------------------

    resumes = relationship(

        "Resume",

        back_populates="user",

        cascade="all, delete-orphan",

    )

    career_profile = relationship(

        "CareerProfile",

        back_populates="user",

        uselist=False,

        cascade="all, delete-orphan",

    )

    portfolio = relationship(

        "Portfolio",

        back_populates="user",

        uselist=False,

        cascade="all, delete-orphan",

    )

    refresh_tokens = relationship(

        "RefreshToken",

        back_populates="user",

        cascade="all, delete-orphan",

    )

    # --------------------------------------------------

    @property
    def display_name(self) -> str:

        return self.full_name or self.username

    @property
    def profile_completed(self) -> bool:

        return all(

            [

                self.full_name,

                self.email,

                self.github_url,

                self.linkedin_url,

            ]

        )

    def __repr__(self) -> str:

        return (

            f"<User "

            f"id={self.id} "

            f"username={self.username}>"

        )