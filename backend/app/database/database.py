import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

logger = logging.getLogger(__name__)

# Prepare database configuration
engine_kwargs = {
    "pool_pre_ping": True,
    "echo": settings.DEBUG,
}

# Get the database URL
database_url = str(settings.DATABASE_URL)

# Handle SQLite special configuration
if database_url.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
    logger.info("📁 Using SQLite database")
else:
    # PostgreSQL configuration
    engine_kwargs["pool_size"] = 20
    engine_kwargs["max_overflow"] = 10
    logger.info("🐘 Using PostgreSQL database")

logger.info(f"Database URL: {database_url[:50]}...")

# Create engine
engine = create_engine(database_url, **engine_kwargs)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()