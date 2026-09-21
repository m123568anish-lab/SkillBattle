import logging
from pathlib import Path
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
if database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)

# If using SQLite file DB with a relative path, convert to absolute path inside backend folder
if database_url.startswith("sqlite"):
    try:
        url_path = database_url.split("sqlite:///", 1)[1]
    except Exception:
        url_path = None

    if url_path and (url_path.startswith("./") or not Path(url_path).is_absolute()):
        backend_dir = Path(__file__).resolve().parents[3]
        db_path = (backend_dir / url_path.lstrip("./"))
        db_path.parent.mkdir(parents=True, exist_ok=True)
        database_url = f"sqlite:///{db_path.as_posix()}"

    engine_kwargs["connect_args"] = {"check_same_thread": False}
    logger.info("📁 Using SQLite database at %s", database_url)
else:
    # PostgreSQL configuration
    engine_kwargs.update({
        "pool_size": 10,
        "max_overflow": 20,
        "pool_timeout": 10,
        "pool_recycle": 300,
        "pool_pre_ping": True,
        "connect_args": {
            "connect_timeout": 10,
        }
    })
    logger.info("🐘 Enterprise Sync engine configured for PostgreSQL (pool_size=10, timeout=10s)")

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