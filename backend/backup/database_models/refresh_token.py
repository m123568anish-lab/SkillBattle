"""
=========================================================

SkillBattle

Refresh Token ORM Model

Stores active refresh tokens for users.

=========================================================
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean
from sqlalchemy import DateTime
from sqlalchemy import ForeignKey
from sqlalchemy import String

from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship

from app.database.base import Base
from app.database.models.base_mixins import (
    TimestampMixin,
    UUIDMixin,
)


class RefreshToken(

    Base,

    UUIDMixin,

    TimestampMixin,

):

    __tablename__ = "refresh_tokens"

    # --------------------------------------------------
    # Owner
    # --------------------------------------------------

    user_id: Mapped[str] = mapped_column(

        ForeignKey(

            "users.id",

            ondelete="CASCADE",

        ),

        nullable=False,

        index=True,

    )

    # --------------------------------------------------
    # Token
    # --------------------------------------------------

    token: Mapped[str] = mapped_column(

        String(1000),

        unique=True,

        nullable=False,

    )

    # --------------------------------------------------
    # Device
    # --------------------------------------------------

    device_name: Mapped[str | None] = mapped_column(

        String(255),

    )

    device_os: Mapped[str | None] = mapped_column(

        String(100),

    )

    browser: Mapped[str | None] = mapped_column(

        String(100),

    )

    ip_address: Mapped[str | None] = mapped_column(

        String(100),

    )

    user_agent: Mapped[str | None] = mapped_column(

        String(1000),

    )

    # --------------------------------------------------
    # Token Status
    # --------------------------------------------------

    expires_at: Mapped[datetime] = mapped_column(

        DateTime,

        nullable=False,

    )

    last_used_at: Mapped[datetime | None] = mapped_column(

        DateTime,

    )

    revoked: Mapped[bool] = mapped_column(

        Boolean,

        default=False,

    )

    revoked_at: Mapped[datetime | None] = mapped_column(

        DateTime,

    )

    revoke_reason: Mapped[str | None] = mapped_column(

        String(255),

    )

    # --------------------------------------------------
    # Relationship
    # --------------------------------------------------

    user = relationship(

        "User",

        back_populates="refresh_tokens",

    )

    # --------------------------------------------------

    @property
    def expired(self) -> bool:

        return datetime.utcnow() >= self.expires_at

    @property
    def active(self) -> bool:

        return (

            not self.revoked

            and

            not self.expired

        )

    def revoke(

        self,

        reason: str = "Manual Logout",

    ) -> None:

        self.revoked = True

        self.revoked_at = datetime.utcnow()

        self.revoke_reason = reason

    def __repr__(self) -> str:

        return (

            f"<RefreshToken "

            f"user={self.user_id} "

            f"active={self.active}>"

        )