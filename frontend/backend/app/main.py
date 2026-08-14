import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.middleware import register_middleware
from app.core.router_registry import register_routers
from app.database.database import engine
from app.database.init_db import init_db
from app.core.exceptions import SkillBattleException
from app.modules.battle.websocket.router import (
    router as battle_ws_router,
)
from app.core.logging.middleware import (
    LoggingMiddleware,
)
from app.core.monitoring.prometheus import router as metrics_router
from app.core.monitoring.health import router as health_router
from app.core.security.headers import (
    SecurityHeadersMiddleware,
)
from app.middleware.cors import configure_cors
from app.middleware.gzip import configure_gzip
from app.middleware.maintenance import MaintenanceMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.request_id import RequestIDMiddleware
from app.middleware.timing import TimingMiddleware
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application lifecycle:
    - Startup: Initialize database
    - Shutdown: Clean up resources
    """
    # Startup
    logger.info("🚀 SkillBattle API starting up...")
    try:
        logger.info("📦 Initializing database...")
        init_db()
        logger.info("✅ Database initialized successfully")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}", exc_info=True)
        raise

    logger.info("✅ Application startup complete")

    yield

    # Shutdown
    logger.info("🛑 Shutting down application...")
    try:
        logger.info("🔌 Closing database connection...")
        engine.dispose()
        logger.info("✅ Database connection closed")
    except Exception as e:
        logger.error(f"❌ Shutdown error: {e}", exc_info=True)

    logger.info("✅ Application shutdown complete")


settings = get_settings()

app = FastAPI(
    title="SkillBattle API",
    version="2.0.0",
    description="Enterprise AI Coding Platform Backend",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    tags_metadata=[
        {"name": "Battle", "description": "Battle Arena APIs"},
        {"name": "Tournament", "description": "Tournament APIs"},
        {"name": "AI", "description": "Artificial Intelligence APIs"},
        {"name": "Developer", "description": "Developer Platform APIs"},
    ],
)

register_middleware(app)

configure_cors(app)

configure_gzip(app)

app.add_middleware(RequestIDMiddleware)
app.add_middleware(TimingMiddleware)
app.add_middleware(MaintenanceMiddleware)
app.add_middleware(RateLimitMiddleware)

app.include_router(battle_ws_router)
app.include_router(metrics_router)
app.include_router(health_router)
app.add_middleware(
    SecurityHeadersMiddleware,
)
register_routers(app)


@app.exception_handler(SkillBattleException)
async def skillbattle_exception_handler(
    request: Request,
    exc: SkillBattleException,
):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.message,
            "path": request.url.path,
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(
    request: Request,
    exc: Exception,
):
    print(exc)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal Server Error",
            "path": request.url.path,
        },
    )


@app.get("/")
def root():
    return {
        "success": True,
        "message": "Welcome to SkillBattle API 🚀",
        "version": "2.0.0",
    }


@app.get("/health")
def health():
    """
    Liveness probe - is the app running?
    """
    return {
        "success": True,
        "status": "healthy",
        "service": "SkillBattle API",
        "version": "2.0.0",
    }


@app.get("/healthz")
def healthz():
    """
    Kubernetes-style health check
    """
    return {
        "success": True,
        "status": "ok",
        "timestamp": __import__("datetime").datetime.utcnow().isoformat(),
    }


@app.get("/ready")
def readiness():
    """
    Readiness probe - is the app ready to serve traffic?
    Checks:
    1. Database connectivity
    2. Core tables exist (User, Profile, Challenge)
    """
    try:
        with engine.connect() as conn:
            # Test basic connectivity
            conn.execute(__import__("sqlalchemy").text("SELECT 1"))
            
            # Verify core tables exist
            inspector = __import__("sqlalchemy").inspect(engine)
            tables = inspector.get_table_names()
            
            required_tables = ["user", "profile", "challenge"]
            missing_tables = [t for t in required_tables if t not in tables]
            
            if missing_tables:
                logger.warning(f"⚠️  Missing tables: {missing_tables}")
                return {
                    "success": False,
                    "status": "not_ready",
                    "database": "connected",
                    "schema": "incomplete",
                    "missing_tables": missing_tables,
                    "tables_found": len(tables),
                }
            
            return {
                "success": True,
                "status": "ready",
                "database": "connected",
                "schema": "valid",
                "tables": len(tables),
            }
    except Exception as e:
        logger.error(f"❌ Readiness check failed: {e}", exc_info=True)
        return {
            "success": False,
            "status": "not_ready",
            "database": "disconnected",
            "error": str(e),
        }


@app.get("/health/detailed")
def health_detailed():
    """
    Detailed health check for monitoring and debugging.
    Returns comprehensive information about:
    1. Application status
    2. Database connectivity and schema
    3. Configuration
    4. All registered tables
    """
    try:
        with engine.connect() as conn:
            # Test connectivity
            conn.execute(__import__("sqlalchemy").text("SELECT 1"))
            
            # Get database information
            inspector = __import__("sqlalchemy").inspect(engine)
            tables = inspector.get_table_names()
            
            database_type = settings.DATABASE_TYPE
            
            return {
                "success": True,
                "status": "healthy",
                "timestamp": __import__("datetime").datetime.utcnow().isoformat(),
                "application": {
                    "name": "SkillBattle API",
                    "version": "2.0.0",
                    "environment": settings.ENVIRONMENT,
                    "debug": settings.DEBUG,
                },
                "database": {
                    "type": database_type,
                    "status": "connected",
                    "tables": len(tables),
                    "table_names": sorted(tables),
                },
                "routes": len(app.routes),
            }
    except Exception as e:
        logger.error(f"❌ Detailed health check failed: {e}", exc_info=True)
        return {
            "success": False,
            "status": "unhealthy",
            "timestamp": __import__("datetime").datetime.utcnow().isoformat(),
            "error": str(e),
        }
