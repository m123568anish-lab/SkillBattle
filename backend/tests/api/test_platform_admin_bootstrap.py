from types import SimpleNamespace
from uuid import uuid4

import pytest
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
        assert admin.role in {"admin", "platform_admin"}
        assert admin.is_superuser is True
        assert admin.is_active is True
        assert await verify_password_async(password, admin.password_hash)
