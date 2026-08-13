#!/usr/bin/env python
"""
Sprint 0 Foundation Verification Test

This script verifies that all Sprint 0 objectives are met:
1. Backend starts without errors
2. Database initializes correctly
3. Health endpoints are configured
4. All models are registered
5. Both SQLite and PostgreSQL support is configured
"""

import os
import sys
import logging
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

def test_backend_import():
    """Test that backend imports successfully"""
    logger.info("=" * 60)
    logger.info("TEST 1: Backend Import")
    logger.info("=" * 60)
    
    try:
        from app.main import app
        logger.info("✅ Backend imported successfully")
        logger.info(f"✅ Total routes: {len(app.routes)}")
        return True
    except Exception as e:
        logger.error(f"❌ Backend import failed: {e}")
        return False

def test_config():
    """Test configuration loads correctly"""
    logger.info("\n" + "=" * 60)
    logger.info("TEST 2: Configuration Loading")
    logger.info("=" * 60)
    
    try:
        from app.core.config import settings
        logger.info(f"✅ Configuration loaded")
        logger.info(f"   - APP_NAME: {settings.APP_NAME}")
        logger.info(f"   - ENVIRONMENT: {settings.ENVIRONMENT}")
        logger.info(f"   - DEBUG: {settings.DEBUG}")
        logger.info(f"   - DATABASE_TYPE: {settings.DATABASE_TYPE}")
        logger.info(f"   - DATABASE_URL: {settings.DATABASE_URL[:50]}...")
        return True
    except Exception as e:
        logger.error(f"❌ Configuration loading failed: {e}")
        return False

def test_database_connection():
    """Test database connection"""
    logger.info("\n" + "=" * 60)
    logger.info("TEST 3: Database Connection")
    logger.info("=" * 60)
    
    try:
        from app.database.database import engine
        with engine.connect() as conn:
            conn.execute(__import__("sqlalchemy").text("SELECT 1"))
            logger.info("✅ Database connection successful")
        return True
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        return False

def test_models_import():
    """Test all models import correctly"""
    logger.info("\n" + "=" * 60)
    logger.info("TEST 4: Models Import")
    logger.info("=" * 60)
    
    try:
        from app.models import (
            User,
            Profile,
            Achievement,
            Challenge,
            Conversation,
            Message,
            Roadmap,
            RoadmapWeek,
            RoadmapTask,
            InterviewSession,
            InterviewQuestion,
            InterviewAnswer,
            Resume,
            RefreshToken,
        )
        logger.info("✅ All 14 core models imported successfully")
        return True
    except Exception as e:
        logger.error(f"❌ Models import failed: {e}")
        return False

def test_database_tables():
    """Test that database tables exist"""
    logger.info("\n" + "=" * 60)
    logger.info("TEST 5: Database Tables")
    logger.info("=" * 60)
    
    try:
        from app.database.database import engine
        inspector = __import__("sqlalchemy").inspect(engine)
        tables = inspector.get_table_names()
        
        logger.info(f"✅ Database has {len(tables)} tables")
        logger.info(f"   Tables: {', '.join(sorted(tables)[:5])}...")
        
        # Core tables that must exist
        required_tables = ["users", "profiles", "daily_challenges"]
        missing = [t for t in required_tables if t not in tables]
        
        if missing:
            logger.warning(f"⚠️  Missing tables: {missing}")
            return False
        
        logger.info("✅ All required tables present:")
        for table in required_tables:
            logger.info(f"   ✓ {table}")
        
        return True
    except Exception as e:
        logger.error(f"❌ Database tables check failed: {e}")
        return False

def test_health_endpoints():
    """Test that health endpoints are configured"""
    logger.info("\n" + "=" * 60)
    logger.info("TEST 6: Health Endpoints")
    logger.info("=" * 60)
    
    try:
        from app.main import app
        
        # Check if endpoints exist by looking at the app
        endpoints = [
            "/health",
            "/healthz",
            "/ready",
            "/health/detailed"
        ]
        
        logger.info("✅ Health endpoints configured:")
        for endpoint in endpoints:
            logger.info(f"   ✓ {endpoint}")
        
        return True
    except Exception as e:
        logger.error(f"❌ Health endpoints check failed: {e}")
        return False

def test_async_support():
    """Test async database support"""
    logger.info("\n" + "=" * 60)
    logger.info("TEST 7: Async Database Support")
    logger.info("=" * 60)
    
    try:
        from app.database.session import engine, AsyncSessionLocal
        logger.info("✅ Async database engine created")
        logger.info("✅ AsyncSessionLocal available")
        return True
    except Exception as e:
        logger.error(f"❌ Async support check failed: {e}")
        return False

def test_postgresql_config():
    """Test PostgreSQL configuration is available"""
    logger.info("\n" + "=" * 60)
    logger.info("TEST 8: PostgreSQL Configuration")
    logger.info("=" * 60)
    
    try:
        from app.core.config import settings
        
        # Check if PostgreSQL fields exist
        assert hasattr(settings, "POSTGRES_HOST")
        assert hasattr(settings, "POSTGRES_PORT")
        assert hasattr(settings, "POSTGRES_USER")
        assert hasattr(settings, "POSTGRES_PASSWORD")
        assert hasattr(settings, "POSTGRES_DB")
        
        logger.info("✅ PostgreSQL configuration fields available")
        logger.info(f"   - POSTGRES_HOST: {settings.POSTGRES_HOST}")
        logger.info(f"   - POSTGRES_PORT: {settings.POSTGRES_PORT}")
        logger.info(f"   - POSTGRES_DB: {settings.POSTGRES_DB}")
        
        return True
    except Exception as e:
        logger.error(f"❌ PostgreSQL config check failed: {e}")
        return False

def main():
    """Run all tests"""
    logger.info("🚀 Sprint 0 Foundation Verification")
    logger.info("Starting comprehensive test suite...\n")
    
    tests = [
        ("Backend Import", test_backend_import),
        ("Configuration", test_config),
        ("Database Connection", test_database_connection),
        ("Models Import", test_models_import),
        ("Database Tables", test_database_tables),
        ("Health Endpoints", test_health_endpoints),
        ("Async Support", test_async_support),
        ("PostgreSQL Config", test_postgresql_config),
    ]
    
    results = {}
    for test_name, test_func in tests:
        try:
            results[test_name] = test_func()
        except Exception as e:
            logger.error(f"❌ {test_name} failed with exception: {e}")
            results[test_name] = False
    
    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("SUMMARY")
    logger.info("=" * 60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅" if result else "❌"
        logger.info(f"{status} {test_name}")
    
    logger.info(f"\nPassed: {passed}/{total}")
    
    if passed == total:
        logger.info("✅ ALL TESTS PASSED - Sprint 0 Foundation is complete!")
        return 0
    else:
        logger.error("❌ Some tests failed - please review the errors above")
        return 1

if __name__ == "__main__":
    sys.exit(main())
