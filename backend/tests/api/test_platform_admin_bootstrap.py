import os
from types import SimpleNamespace
from uuid import uuid4

import pytest
from pydantic_settings import BaseSettings
from sqlalchemy import select

from app.bootstrap.startup import ensure_platform_admin
from app.core.dependencies import get_current_admin
from app.core.security import verify_password_async
from app.database.session import AsyncSessionLocal
from app.models.user import User


@pytest.mark.asyncio
async def test_platform_admin_role_alias_is_authorized():
    user = SimpleNamespace(id="platform-admin-1", role="platform_admin", is_superuser=False)

    result = await get_current_admin(current_user=user)

    assert result is user


def test_settings_loads_platform_admin_env_file(tmp_path, monkeypatch):
    email = f"bootstrap_file_{uuid4().hex[:8]}@example.com"
    password = "BootstrapFilePass#123"
    username = f"bootstrap_file_{uuid4().hex[:8]}"

    env_file = tmp_path / ".env.admin"
    env_file.write_text(
        f"PLATFORM_ADMIN_EMAIL={email}\n"
        f"PLATFORM_ADMIN_PASSWORD={password}\n"
        f"PLATFORM_ADMIN_USERNAME={username}\n",
        encoding="utf-8",
    )

    monkeypatch.chdir(tmp_path)
    monkeypatch.delenv("PLATFORM_ADMIN_EMAIL", raising=False)
    monkeypatch.delenv("PLATFORM_ADMIN_PASSWORD", raising=False)
    monkeypatch.delenv("PLATFORM_ADMIN_USERNAME", raising=False)

    from app.core.config import Settings

    Settings()

    assert os.getenv("PLATFORM_ADMIN_EMAIL") == email
    assert os.getenv("PLATFORM_ADMIN_USERNAME") == username
    assert os.getenv("PLATFORM_ADMIN_PASSWORD") == password


@pytest.mark.asyncio
async def test_ensure_platform_admin_bootstraps_persistent_admin(monkeypatch):
    email = f"bootstrap_{uuid4().hex[:8]}@example.com"
    password = "BootstrapPass#123"
    username = f"bootstrap_{uuid4().hex[:8]}"

    monkeypatch.setenv("PLATFORM_ADMIN_EMAIL", email)
    monkeypatch.setenv("PLATFORM_ADMIN_PASSWORD", password)
    monkeypatch.setenv("PLATFORM_ADMIN_USERNAME", username)

    await ensure_platform_admin()

    async with AsyncSessionLocal() as db:
        admin = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
        assert admin is not None
        assert admin.role.upper() == "PLATFORM_ADMIN"
        assert admin.account_type.upper() == "PLATFORM_ADMIN"
        assert admin.is_superuser is True
        assert admin.is_active is True
        assert await verify_password_async(password, admin.password_hash)


@pytest.mark.asyncio
async def test_ensure_platform_admin_reuses_existing_platform_admin(monkeypatch):
    email = f"bootstrap_existing_{uuid4().hex[:8]}@example.com"
    password = "BootstrapPass#123"
    username = f"bootstrap_existing_{uuid4().hex[:8]}"

    async with AsyncSessionLocal() as db:
        user = User(
            username=username,
            email=email,
            full_name="Platform Administrator",
            password_hash="hashed-password",
            role="PLATFORM_ADMIN",
            account_type="PLATFORM_ADMIN",
            status="ACTIVE",
            is_active=True,
            is_verified=True,
            is_superuser=True,
            onboarding_completed=True,
        )
        db.add(user)
        await db.commit()
        user_id = user.id

    monkeypatch.setenv("PLATFORM_ADMIN_EMAIL", email)
    monkeypatch.setenv("PLATFORM_ADMIN_PASSWORD", password)
    monkeypatch.setenv("PLATFORM_ADMIN_USERNAME", username)

    result = await ensure_platform_admin()

    assert result is not None
    assert result.id == user_id
    assert result.role.upper() == "PLATFORM_ADMIN"
    assert result.account_type.upper() == "PLATFORM_ADMIN"


@pytest.mark.asyncio
async def test_ensure_platform_admin_rejects_non_platform_admin_account(monkeypatch):
    email = f"bootstrap_conflict_{uuid4().hex[:8]}@example.com"
    password = "BootstrapPass#123"
    username = f"bootstrap_conflict_{uuid4().hex[:8]}"

    async with AsyncSessionLocal() as db:
        user = User(
            username=username,
            email=email,
            full_name="Regular Student",
            password_hash="hashed-password",
            role="student",
            account_type="STUDENT",
            status="ACTIVE",
            is_active=True,
            is_verified=True,
            is_superuser=False,
            onboarding_completed=True,
        )
        db.add(user)
        await db.commit()
        user_id = user.id

    monkeypatch.setenv("PLATFORM_ADMIN_EMAIL", email)
    monkeypatch.setenv("PLATFORM_ADMIN_PASSWORD", password)
    monkeypatch.setenv("PLATFORM_ADMIN_USERNAME", username)

    with pytest.raises(ValueError, match="already exists"):
        await ensure_platform_admin()

    async with AsyncSessionLocal() as db:
        refreshed = await db.get(User, user_id)
        assert refreshed is not None
        assert refreshed.role.lower() == "student"
        assert refreshed.account_type.upper() == "STUDENT"
