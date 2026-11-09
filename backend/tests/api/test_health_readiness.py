from __future__ import annotations

import pytest

from app.core.monitoring import health


@pytest.mark.asyncio
async def test_readiness_returns_success_only_for_compatible_schema(
    client,
    monkeypatch,
):
    monkeypatch.setattr(
        health,
        "build_preflight_report",
        lambda: {
            "eligible_for_migration": True,
            "current_revision": "head",
            "repository_head": "head",
            "schema_difference_count": 0,
            "state_errors": [],
        },
    )

    response = await client.get("/ready")

    assert response.status_code == 200
    assert response.json()["connection_ready"] is True
    assert response.json()["migration_status"] == "current"


@pytest.mark.asyncio
async def test_readiness_fails_closed_for_schema_drift(client, monkeypatch):
    monkeypatch.setattr(
        health,
        "build_preflight_report",
        lambda: {
            "eligible_for_migration": False,
            "current_revision": "head",
            "repository_head": "head",
            "schema_difference_count": 1,
            "state_errors": [],
        },
    )

    response = await client.get("/ready")

    assert response.status_code == 503
    assert response.json()["connection_ready"] is False
    assert response.json()["migration_status"] == "incompatible"


@pytest.mark.asyncio
async def test_readiness_reports_unknown_revision_as_incompatible(client, monkeypatch):
    monkeypatch.setattr(
        health,
        "build_preflight_report",
        lambda: {
            "eligible_for_migration": False,
            "current_revision": "unknown-revision",
            "repository_head": "head",
            "schema_difference_count": 0,
            "state_errors": ["Database revision is not in the repository."],
        },
    )

    response = await client.get("/ready")

    assert response.status_code == 503
    assert response.json()["migration_status"] == "incompatible"


@pytest.mark.asyncio
async def test_readiness_reports_known_ancestor_as_pending(client, monkeypatch):
    monkeypatch.setattr(
        health,
        "build_preflight_report",
        lambda: {
            "eligible_for_migration": False,
            "current_revision": "known-ancestor",
            "repository_head": "head",
            "schema_difference_count": 0,
            "state_errors": [],
        },
    )

    response = await client.get("/ready")

    assert response.status_code == 503
    assert response.json()["migration_status"] == "pending"
