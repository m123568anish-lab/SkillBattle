from __future__ import annotations

from types import SimpleNamespace
from uuid import uuid4

import pytest
from sqlalchemy import delete

from app.core.dependencies import get_current_user
from app.database.session import AsyncSessionLocal, get_db
from app.main import app
from app.models.user import User
from app.modules.audit.model import AuditLog
from app.modules.audit.service import audit_service


@pytest.mark.asyncio
async def test_activity_feed_is_user_scoped_and_sanitizes_nested_secrets(client):
    owner_id = str(uuid4())
    other_user_id = str(uuid4())

    async def override_db():
        async with AsyncSessionLocal() as session:
            yield session

    async def override_current_user():
        return SimpleNamespace(id=owner_id, role="student", is_superuser=False)

    previous_overrides = app.dependency_overrides.copy()
    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = override_current_user

    try:
        async with AsyncSessionLocal() as session:
            session.add_all(
                [
                    User(
                        id=owner_id,
                        username=f"activity-{owner_id[:12]}",
                        full_name="Activity Owner",
                        email=f"{owner_id}@example.test",
                        password_hash="test-only-hash",
                    ),
                    User(
                        id=other_user_id,
                        username=f"activity-{other_user_id[:12]}",
                        full_name="Other Activity User",
                        email=f"{other_user_id}@example.test",
                        password_hash="test-only-hash",
                    ),
                ]
            )
            audit_service.enqueue(
                session,
                action="battle_completed",
                module="battle",
                user_id=owner_id,
                organization_type="college",
                organization_id=17,
                entity_type="battle",
                entity_id="battle-321",
                metadata={
                    "outcome": "won",
                    "api_token": "must-not-persist",
                    "result": {"score": 95, "password": "must-not-persist"},
                },
            )
            session.add(
                AuditLog(
                    user_id=other_user_id,
                    action="private_action",
                    module="profile",
                    metadata_json={"visible_to_owner_only": True},
                )
            )
            await session.commit()

        response = await client.get("/api/v1/audit/me")
        assert response.status_code == 200
        entries = response.json()
        assert len(entries) == 1
        assert entries[0]["user_id"] == owner_id
        assert entries[0]["organization_id"] == "17"
        assert "api_token" not in entries[0]["metadata_json"]
        assert "password" not in entries[0]["metadata_json"]["result"]

        forbidden = await client.get("/api/v1/audit")
        assert forbidden.status_code == 403
        organization_forbidden = await client.get("/api/v1/audit/organization")
        assert organization_forbidden.status_code == 403
    finally:
        async with AsyncSessionLocal() as session:
            await session.execute(delete(AuditLog).where(AuditLog.user_id.in_([owner_id, other_user_id])))
            await session.execute(delete(User).where(User.id.in_([owner_id, other_user_id])))
            await session.commit()
        app.dependency_overrides.clear()
        app.dependency_overrides.update(previous_overrides)