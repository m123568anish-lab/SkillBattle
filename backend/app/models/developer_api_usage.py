import uuid

from datetime import datetime

from sqlalchemy import (
	String,
	Integer,
	DateTime,
	ForeignKey,
)

from sqlalchemy.orm import (
	Mapped,
	mapped_column,
)

from app.database.base import Base


class DeveloperApiUsage(Base):

	__tablename__ = "developer_api_usages"

	id: Mapped[str] = mapped_column(
		String(36),
		primary_key=True,
		default=lambda: str(uuid.uuid4()),
	)

	developer_api_key_id: Mapped[str] = mapped_column(
		String(36),
		ForeignKey("developer_api_keys.id"),
	)

	usage_count: Mapped[int] = mapped_column(
		Integer,
		default=0,
	)

	last_used: Mapped[datetime] = mapped_column(
		DateTime,
		default=datetime.utcnow,
	)

	created_at: Mapped[datetime] = mapped_column(
		DateTime,
		default=datetime.utcnow,
	)

