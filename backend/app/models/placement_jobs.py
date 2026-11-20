from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy import Boolean, DateTime, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base
from app.models.question import SafeJSON


class PlacementJob(Base):
    __tablename__ = "placement_jobs"
    __table_args__ = (
        UniqueConstraint("idempotency_key", name="uq_placement_jobs_idempotency_key"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    job_type: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="queued", nullable=False, index=True)
    idempotency_key: Mapped[str] = mapped_column(String(200), unique=True, index=True, nullable=False)
    payload: Mapped[dict] = mapped_column(SafeJSON, default=dict)
    result: Mapped[dict] = mapped_column(SafeJSON, default=dict)
    error_details: Mapped[str] = mapped_column(Text, default="", nullable=False)
    retry_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    max_retries: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    worker_name: Mapped[str] = mapped_column(String(120), default="", nullable=False)
    worker_lock_token: Mapped[str] = mapped_column(String(80), default="", nullable=False)
    lock_expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    @property
    def is_active(self) -> bool:
        return self.status in {"queued", "running"}


class PlacementSourceRecord(Base):
    __tablename__ = "placement_source_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source_url: Mapped[str] = mapped_column(String(500), unique=True, index=True, nullable=False)
    source_classification: Mapped[str] = mapped_column(String(60), default="official-public-material", nullable=False)
    company: Mapped[str] = mapped_column(String(120), default="", nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(120), default="", nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(220), default="", nullable=False)
    summary: Mapped[str] = mapped_column(Text, default="", nullable=False)
    topics: Mapped[list] = mapped_column(SafeJSON, default=list)
    extracted_topics: Mapped[list] = mapped_column(SafeJSON, default=list)
    license: Mapped[str] = mapped_column(String(220), default="", nullable=False)
    raw_content: Mapped[str] = mapped_column(Text, default="", nullable=False)
    discovered_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    last_processed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    processed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class PlacementInventoryTarget(Base):
    __tablename__ = "placement_inventory_targets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    company: Mapped[str] = mapped_column(String(120), default="", nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(120), default="", nullable=False, index=True)
    topic: Mapped[str] = mapped_column(String(120), default="", nullable=False, index=True)
    difficulty: Mapped[str] = mapped_column(String(30), default="medium", nullable=False, index=True)
    question_type: Mapped[str] = mapped_column(String(40), default="mcq", nullable=False, index=True)
    target_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    current_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
