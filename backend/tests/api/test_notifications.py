from __future__ import annotations

from types import SimpleNamespace
from uuid import uuid4

import pytest
from sqlalchemy import delete

from app.core.dependencies import get_current_user
from app.database.session import AsyncSessionLocal, get_db
from app.main import app
from app.models.notification import Notification
from app.models.user import User


@pytest.mark.asyncio
async def test_notification_reads_are_scoped_to_authenticated_user(client):
    owner_id = str(uuid4())
    other_user_id = str(uuid4())
    owner_notification_id = str(uuid4())
    second_owner_notification_id = str(uuid4())
    other_notification_id = str(uuid4())

    async def override_db():
        async with AsyncSessionLocal() as session:
            yield session

    async def override_current_user():
        return SimpleNamespace(id=owner_id)

    previous_overrides = app.dependency_overrides.copy()
    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = override_current_user

    try:
        async with AsyncSessionLocal() as session:
            session.add_all(
                [
                    User(
                        id=owner_id,
                        username=f"notify-{owner_id[:12]}",
                        full_name="Notification Owner",
                        email=f"{owner_id}@example.test",
                        password_hash="test-only-hash",
                    ),
                    User(
                        id=other_user_id,
                        username=f"notify-{other_user_id[:12]}",
                        full_name="Other User",
                        email=f"{other_user_id}@example.test",
                        password_hash="test-only-hash",
                    ),
                ]
            )
            session.add_all(
                [
                    Notification(
                        id=owner_notification_id,
                        user_id=owner_id,
                        title="Battle result ready",
                        message="Your battle result is ready.",
                        notification_type="battle",
                        related_entity_type="battle",
                        related_entity_id="battle-123",
                    ),
                    Notification(
                        id=second_owner_notification_id,
                        user_id=owner_id,
                        title="Application update",
                        message="Your application status changed.",
                        notification_type="application",
                        related_entity_type="application",
                        related_entity_id="42",
                    ),
                    Notification(
                        id=other_notification_id,
                        user_id=other_user_id,
                        title="Private notification",
                        message="This belongs to another user.",
                    ),
                ]
            )
            await session.commit()

        response = await client.get("/api/v1/notifications")
        assert response.status_code == 200
        notifications = response.json()
        assert {item["id"] for item in notifications} == {
            owner_notification_id,
            second_owner_notification_id,
        }
        assert notifications[0]["related_entity_type"] in {"battle", "application"}

        count_response = await client.get("/api/v1/notifications/unread-count")
        assert count_response.status_code == 200
        assert count_response.json()["unread_count"] == 2

        forbidden_read = await client.put(
            f"/api/v1/notifications/{other_notification_id}/read"
        )
        assert forbidden_read.status_code == 404

        mark_read = await client.put(
            f"/api/v1/notifications/{owner_notification_id}/read"
        )
        assert mark_read.status_code == 200

        mark_all = await client.put("/api/v1/notifications/read-all")
        assert mark_all.status_code == 200
        assert mark_all.json()["updated_count"] == 1

        final_count = await client.get("/api/v1/notifications/unread-count")
        assert final_count.json()["unread_count"] == 0
    finally:
        async with AsyncSessionLocal() as session:
            await session.execute(
                delete(Notification).where(
                    Notification.user_id.in_([owner_id, other_user_id])
                )
            )
            await session.execute(
                delete(User).where(User.id.in_([owner_id, other_user_id]))
            )
            await session.commit()
        app.dependency_overrides.clear()
        app.dependency_overrides.update(previous_overrides)