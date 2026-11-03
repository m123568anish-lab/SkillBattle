import logging
import os
import platform
import sys
import traceback
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.bootstrap.startup import ensure_platform_admin
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
from app.middleware.xss_guard import XSSGuardMiddleware
logger = logging.getLogger(__name__)


def _safe_traceback_frames(exc: BaseException) -> str:
    chain = []
    seen = set()
    current = exc
    while current is not None and id(current) not in seen:
        seen.add(id(current))
        chain.append(current)
        current = current.__cause__ or (
            None if current.__suppress_context__ else current.__context__
        )

    formatted = []
    for chained_exception in reversed(chain):
        frames = traceback.extract_tb(chained_exception.__traceback__)
        frame_lines = [
            f'  File "{frame.filename}", line {frame.lineno}, in {frame.name}'
            for frame in frames
        ]
        formatted.append(
            f"{type(chained_exception).__name__} traceback:\n"
            + ("\n".join(frame_lines) if frame_lines else "  <no traceback frames>")
        )

    return "\nCaused by:\n".join(formatted)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application lifecycle:
    - Startup: Initialize database
    - Shutdown: Clean up resources
    """
    # Startup
    logger.info("🚀 Qubira API starting up...")
    
    # Initialize Sentry error tracking if configured
    if settings.SENTRY_DSN and not settings.SENTRY_DSN.startswith("https://placeholder"):
        try:
            import sentry_sdk
            sentry_sdk.init(
                dsn=settings.SENTRY_DSN,
                traces_sample_rate=0.2,
                environment=settings.ENVIRONMENT,
            )
            logger.info("📡 Sentry error monitoring initialized")
        except Exception as sentry_err:
            logger.warning(f"⚠️ Could not initialize Sentry: {sentry_err}")

    try:
        logger.info("📦 Initializing database...")
        init_db()
        logger.info("✅ Database initialized successfully")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}", exc_info=True)
        raise

    try:
        logger.info("🔐 Ensuring platform admin bootstrap...")
        await ensure_platform_admin()
        logger.info("✅ Platform admin bootstrap checked")
    except Exception as e:
        logger.error(f"❌ Platform admin bootstrap failed: {e}", exc_info=True)
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
    title="Qubira API",
    version="2.0.0",
    description="Qubira — Learn. Build. Compete. AI-Powered Technical Learning & Arena Platform",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    tags_metadata=[
        {"name": "Battle", "description": "Qubira Arena APIs"},
        {"name": "Tournament", "description": "Championship APIs"},
        {"name": "AI", "description": "Qubira Mentor & Artificial Intelligence APIs"},
        {"name": "Developer", "description": "Developer Platform APIs"},
    ],
)

register_middleware(app)
configure_gzip(app)

app.add_middleware(RequestIDMiddleware)
app.add_middleware(TimingMiddleware)
app.add_middleware(MaintenanceMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(XSSGuardMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
configure_cors(app)

# CORS must be added LAST so it wraps all inner middlewares and exception responses
from fastapi.staticfiles import StaticFiles

os.makedirs("uploads/avatars", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(battle_ws_router)
app.include_router(metrics_router)
app.include_router(health_router)
register_routers(app)

# TEMPORARY: Remove after verifying the Render production route graph.
logger.warning("========== QUBIRA PRODUCTION ROUTE DIAGNOSTICS ==========")
try:
    logger.warning(
        "Runtime cwd=%s python=%s main_file=%s render_commit=%s",
        os.getcwd(),
        platform.python_version(),
        Path(__file__).resolve(),
        os.environ.get("RENDER_GIT_COMMIT", "Not exposed"),
    )
    logger.warning("FastAPI title=%s version=%s", app.title, app.version)

    route_paths = app.openapi().get("paths", {})
    logger.warning("OpenAPI path_count=%d", len(route_paths))
    for path in sorted(route_paths):
        if any(group in path.lower() for group in ("xp", "streak", "skills", "leaderboard")):
            logger.warning("Registered route path=%s", path)

    expected_routes = (
        "/api/v1/xp",
        "/api/v1/streak",
        "/api/v1/skills/profile",
        "/api/v1/skills/gaps",
        "/api/v1/skills/placement-readiness",
        "/api/v1/leaderboard",
        "/api/v1/leaderboard/me",
    )
    for path in expected_routes:
        status = "FOUND" if path in route_paths else "MISSING"
        logger.warning("Expected route status=%s path=%s", status, path)

    source_modules = (
        "app.api.v1.router",
        "app.core.router_registry",
        "app.modules.xp.router",
        "app.modules.streak.router",
        "app.modules.leaderboard.router",
        "app.modules.assessment_engine.routers.assessment_router",
    )
    for module_name in source_modules:
        module = sys.modules.get(module_name)
        source_path = getattr(module, "__file__", None) if module else None
        logger.warning(
            "Imported module=%s source_file=%s",
            module_name,
            Path(source_path).resolve() if source_path else "NOT_LOADED",
        )
except Exception:
    logger.exception("Temporary production route diagnostics failed")
finally:
    logger.warning("========== END QUBIRA PRODUCTION ROUTE DIAGNOSTICS ==========")


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
    request_id = getattr(request.state, "request_id", "unavailable")
    logger.error(
        "Unhandled request exception request_id=%s method=%s path=%s "
        "exception_type=%s\n%s",
        request_id,
        request.method,
        request.url.path,
        type(exc).__name__,
        _safe_traceback_frames(exc),
    )
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
            
            required_tables = ["users", "profiles", "questions"]
            table_set = set(tables)
            missing_tables = [t for t in required_tables if t not in table_set]
            
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
    except Exception as exc:
        logger.error("Readiness check failed (%s)", type(exc).__name__)
        return {
            "success": False,
            "status": "not_ready",
            "database": "disconnected",
            "error": "Database readiness check failed.",
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
    except Exception as exc:
        logger.error("Detailed health check failed (%s)", type(exc).__name__)
        return {
            "success": False,
            "status": "unhealthy",
            "timestamp": __import__("datetime").datetime.utcnow().isoformat(),
            "error": "Detailed health check failed.",
        }
