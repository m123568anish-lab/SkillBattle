from types import SimpleNamespace

import pytest
from sqlalchemy import create_engine, inspect, text

from app.database import init_db


def test_legacy_users_table_repair_adds_neon_user_id(tmp_path, monkeypatch):
    database_path = tmp_path / "legacy_skillbattle.sqlite"
    legacy_engine = create_engine(f"sqlite:///{database_path}")
    monkeypatch.setattr(init_db, "engine", legacy_engine)
    monkeypatch.setattr(
        "app.core.config.get_settings",
        lambda: SimpleNamespace(
            ENVIRONMENT="development",
            DATABASE_READINESS_MODE="legacy",
        ),
    )

    with legacy_engine.begin() as connection:
        connection.execute(
            text(
                """
                CREATE TABLE users (
                    id VARCHAR(36) PRIMARY KEY,
                    username VARCHAR(30) NOT NULL,
                    full_name VARCHAR(120) NOT NULL,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    password_hash VARCHAR(255) NOT NULL,
                    role VARCHAR(50) NOT NULL DEFAULT 'user',
                    account_type VARCHAR(30) NOT NULL DEFAULT 'STUDENT',
                    requested_role VARCHAR(50),
                    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
                    avatar_url VARCHAR(500),
                    bio VARCHAR(1000),
                    country VARCHAR(100),
                    city VARCHAR(100),
                    website VARCHAR(500),
                    github_url VARCHAR(500),
                    linkedin_url VARCHAR(500),
                    login_count INTEGER NOT NULL DEFAULT 0,
                    coding_rating INTEGER NOT NULL DEFAULT 0,
                    placement_score INTEGER NOT NULL DEFAULT 0,
                    resume_score INTEGER NOT NULL DEFAULT 0,
                    is_active BOOLEAN NOT NULL DEFAULT 1,
                    is_verified BOOLEAN NOT NULL DEFAULT 1,
                    two_factor_enabled BOOLEAN NOT NULL DEFAULT 0,
                    two_factor_secret VARCHAR(255),
                    two_factor_recovery_hashes VARCHAR(2000),
                    onboarding_completed BOOLEAN NOT NULL DEFAULT 1,
                    last_login DATETIME,
                    is_superuser BOOLEAN NOT NULL DEFAULT 0,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    clerk_user_id VARCHAR(64)
                )
                """
            )
        )

    init_db.ensure_database_compatibility()

    columns = {column["name"] for column in inspect(legacy_engine).get_columns("users")}
    assert "neon_user_id" in columns


def test_postgresql_startup_fails_closed_without_schema_repair(monkeypatch):
    from app.database import migration_preflight

    postgres_engine = SimpleNamespace(
        dialect=SimpleNamespace(name="postgresql"),
    )
    monkeypatch.setattr(init_db, "engine", postgres_engine)
    monkeypatch.setattr(
        "app.core.config.get_settings",
        lambda: SimpleNamespace(
            ENVIRONMENT="production",
            DATABASE_READINESS_MODE="legacy",
        ),
    )
    monkeypatch.setattr(
        migration_preflight,
        "build_preflight_report",
        lambda engine: {
            "eligible_for_migration": False,
            "current_revision": "b8f2d4e6a901",
            "schema_difference_count": 34,
            "state_errors": [],
        },
    )

    def fail_if_mutating(*_args, **_kwargs):
        pytest.fail("PostgreSQL startup must not create or repair schema.")

    monkeypatch.setattr(init_db.Base.metadata, "create_all", fail_if_mutating)
    for repair in (
        "_repair_users_table",
        "_repair_achievements_table",
        "_repair_profile_preferences",
        "_repair_dashboard_tables",
        "_repair_college_tables",
        "_repair_company_tables",
        "_repair_battle_tables",
        "_repair_streak_table",
    ):
        monkeypatch.setattr(init_db, repair, fail_if_mutating)

    with pytest.raises(RuntimeError, match="Automatic schema creation and repair are disabled"):
        init_db.ensure_database_compatibility()


def test_compatible_postgresql_startup_is_preflight_only(monkeypatch):
    from app.database import migration_preflight

    postgres_engine = SimpleNamespace(
        dialect=SimpleNamespace(name="postgresql"),
    )
    monkeypatch.setattr(init_db, "engine", postgres_engine)
    monkeypatch.setattr(
        "app.core.config.get_settings",
        lambda: SimpleNamespace(
            ENVIRONMENT="production",
            DATABASE_READINESS_MODE="legacy",
        ),
    )
    monkeypatch.setattr(
        migration_preflight,
        "build_preflight_report",
        lambda engine: {
            "eligible_for_migration": True,
            "current_revision": "d1f5a8e7c2b4",
            "schema_difference_count": 0,
            "state_errors": [],
        },
    )

    def fail_if_mutating(*_args, **_kwargs):
        pytest.fail("Compatible PostgreSQL startup must remain preflight-only.")

    monkeypatch.setattr(init_db.Base.metadata, "create_all", fail_if_mutating)
    for repair in (
        "_repair_users_table",
        "_repair_achievements_table",
        "_repair_profile_preferences",
        "_repair_dashboard_tables",
        "_repair_college_tables",
        "_repair_company_tables",
        "_repair_battle_tables",
        "_repair_streak_table",
    ):
        monkeypatch.setattr(init_db, repair, fail_if_mutating)

    init_db.ensure_database_compatibility()
