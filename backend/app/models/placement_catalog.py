from __future__ import annotations
import uuid
from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base import Base
from app.models.question import SafeJSON

class PlacementCompany(Base):
    __tablename__ = "placement_companies"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(160), unique=True, index=True, nullable=False)
    category: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    source_url: Mapped[str] = mapped_column(String(500), default="", nullable=False)
    last_verified_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

class PlacementTrack(Base):
    __tablename__ = "placement_tracks"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id: Mapped[str] = mapped_column(ForeignKey("placement_companies.id", ondelete="CASCADE"), index=True, nullable=False)
    role: Mapped[str] = mapped_column(String(120), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    template_kind: Mapped[str] = mapped_column(String(30), default="GENERAL", nullable=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

class PlacementTrackRound(Base):
    __tablename__ = "placement_track_rounds"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    track_id: Mapped[str] = mapped_column(ForeignKey("placement_tracks.id", ondelete="CASCADE"), index=True, nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    assessment_type: Mapped[str] = mapped_column(String(40), nullable=False)
    topic: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    assessment_id: Mapped[str | None] = mapped_column(ForeignKey("unified_assessments.id", ondelete="SET NULL"), nullable=True)
