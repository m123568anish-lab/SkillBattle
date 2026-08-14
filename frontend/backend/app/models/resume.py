"""
=========================================================

SkillBattle

Resume Database Model

=========================================================
"""

from __future__ import annotations

from sqlalchemy import Boolean
from sqlalchemy import ForeignKey
from sqlalchemy import Integer
from sqlalchemy import JSON
from sqlalchemy import String
from sqlalchemy import Text

from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship

from app.database.base import Base
from app.database.models.base_mixins import (
    TimestampMixin,
    UUIDMixin,
)


class Resume(

    Base,

    UUIDMixin,

    TimestampMixin,

):

    __tablename__ = "resumes"

    # ---------------------------------------------------
    # Owner
    # ---------------------------------------------------

    user_id: Mapped[str] = mapped_column(

        ForeignKey("users.id"),

        nullable=False,

        index=True,

    )

    # ---------------------------------------------------
    # File Information
    # ---------------------------------------------------

    title: Mapped[str] = mapped_column(

        String(255),

        nullable=False,

    )

    original_filename: Mapped[str] = mapped_column(

        String(255),

        nullable=False,

    )

    stored_filename: Mapped[str] = mapped_column(

        String(255),

        nullable=False,

    )

    file_path: Mapped[str] = mapped_column(

        String(500),

        nullable=False,

    )

    file_size: Mapped[int] = mapped_column(

        Integer,

        nullable=False,

    )

    mime_type: Mapped[str] = mapped_column(

        String(100),

        nullable=False,

    )

    # ---------------------------------------------------
    # Extracted Resume Data
    # ---------------------------------------------------

    full_name: Mapped[str | None] = mapped_column(

        String(255),

    )

    email: Mapped[str | None] = mapped_column(

        String(255),

        index=True,

    )

    phone: Mapped[str | None] = mapped_column(

        String(50),

    )

    location: Mapped[str | None] = mapped_column(

        String(255),

    )

    linkedin: Mapped[str | None] = mapped_column(

        String(500),

    )

    github: Mapped[str | None] = mapped_column(

        String(500),

    )

    portfolio: Mapped[str | None] = mapped_column(

        String(500),

    )

    # ---------------------------------------------------
    # Structured Sections
    # ---------------------------------------------------

    skills: Mapped[list] = mapped_column(

        JSON,

        default=list,

    )

    education: Mapped[list] = mapped_column(

        JSON,

        default=list,

    )

    experience: Mapped[list] = mapped_column(

        JSON,

        default=list,

    )

    projects: Mapped[list] = mapped_column(

        JSON,

        default=list,

    )

    certifications: Mapped[list] = mapped_column(

        JSON,

        default=list,

    )

    # ---------------------------------------------------
    # Raw Resume
    # ---------------------------------------------------

    raw_text: Mapped[str] = mapped_column(

        Text,

        nullable=False,

    )

    metadata_json: Mapped[dict] = mapped_column(

        JSON,

        default=dict,

    )

    # ---------------------------------------------------
    # AI Analysis
    # ---------------------------------------------------

    ats_score: Mapped[int] = mapped_column(

        Integer,

        default=0,

    )

    placement_score: Mapped[int] = mapped_column(

        Integer,

        default=0,

    )

    ai_summary: Mapped[str | None] = mapped_column(

        Text,

    )

    ai_strengths: Mapped[list] = mapped_column(

        JSON,

        default=list,

    )

    ai_weaknesses: Mapped[list] = mapped_column(

        JSON,

        default=list,

    )

    ai_recommendations: Mapped[list] = mapped_column(

        JSON,

        default=list,

    )

    # ---------------------------------------------------
    # Status
    # ---------------------------------------------------

    parsed: Mapped[bool] = mapped_column(

        Boolean,

        default=False,

    )

    ai_processed: Mapped[bool] = mapped_column(

        Boolean,

        default=False,

    )

    active: Mapped[bool] = mapped_column(

        Boolean,

        default=True,

    )

