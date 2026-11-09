from __future__ import annotations

import pytest
from sqlalchemy import create_engine, inspect, text

from app.core.config import settings
from app.core.monitoring import health
from app.database.migration_infrastructure.epoch_control import (
    EpochTransition,
    EpochTransitionState,
    create_epoch_control_schema,
    record_epoch_transition,
)
from app.database.migration_preflight import build_epoch_preflight_report


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


@pytest.mark.asyncio
async def test_epoch_readiness_mode_uses_epoch_report_without_legacy_approval(
    client,
    monkeypatch,
):
    monkeypatch.setattr(settings, "DATABASE_READINESS_MODE", "epoch")
    monkeypatch.setattr(
        health,
        "build_epoch_preflight_report",
        lambda: {
            "eligible_for_migration": False,
            "current_revision": None,
            "repository_head": None,
            "schema_difference_count": 1,
            "state_errors": ["Epoch state is incomplete."],
        },
    )
    monkeypatch.setattr(
        health,
        "build_preflight_report",
        lambda: pytest.fail("Legacy readiness must not run in epoch mode."),
    )

    response = await client.get("/ready")

    assert response.status_code == 503
    assert response.json()["connection_ready"] is False


def test_epoch_preflight_is_read_only_for_an_uninitialized_database(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'epoch-readiness.db'}")
    try:
        with engine.connect() as connection:
            before = inspect(connection).get_table_names()

        report = build_epoch_preflight_report(engine)

        with engine.connect() as connection:
            after = inspect(connection).get_table_names()
        assert report["eligible_for_migration"] is False
        assert report["state_errors"]
        assert before == after == []
    finally:
        engine.dispose()


def test_epoch_preflight_refuses_recovery_state_without_mutating_revision_rows(
    tmp_path,
):
    engine = create_engine(f"sqlite:///{tmp_path / 'epoch-recovery-readiness.db'}")
    try:
        with engine.connect() as connection:
            create_epoch_control_schema(connection)
            connection.commit()
            connection.execute(
                text(
                    "CREATE TABLE alembic_version_epoch "
                    "(version_num VARCHAR(128) PRIMARY KEY)"
                )
            )
            connection.execute(
                text(
                    "INSERT INTO alembic_version_epoch (version_num) "
                    "VALUES ('unknown_epoch_revision')"
                )
            )
            connection.commit()
            record_epoch_transition(
                connection,
                EpochTransitionState.UNCLASSIFIED,
                EpochTransition(
                    to_state=EpochTransitionState.FRESH_PREFLIGHT,
                    idempotency_key="preflight-recovery-test",
                    actor_role="test_operator",
                ),
            )
            connection.commit()
            record_epoch_transition(
                connection,
                EpochTransitionState.FRESH_PREFLIGHT,
                EpochTransition(
                    to_state=EpochTransitionState.STARTED,
                    idempotency_key="start-recovery-test",
                    actor_role="test_operator",
                    plan_digest="a" * 64,
                    target_fingerprint_digest="b" * 64,
                    database_identity_digest="c" * 64,
                ),
            )
            connection.commit()
            record_epoch_transition(
                connection,
                EpochTransitionState.STARTED,
                EpochTransition(
                    to_state=EpochTransitionState.APPLYING,
                    idempotency_key="apply-recovery-test",
                    actor_role="test_operator",
                ),
            )
            connection.commit()
            record_epoch_transition(
                connection,
                EpochTransitionState.APPLYING,
                EpochTransition(
                    to_state=EpochTransitionState.RECOVERY_REQUIRED,
                    idempotency_key="recover-recovery-test",
                    actor_role="test_operator",
                ),
            )
            connection.commit()
            before_tables = inspect(connection).get_table_names()
            before_revisions = connection.execute(
                text("SELECT version_num FROM alembic_version_epoch")
            ).scalars().all()

        report = build_epoch_preflight_report(engine)

        with engine.connect() as connection:
            assert inspect(connection).get_table_names() == before_tables
            assert connection.execute(
                text("SELECT version_num FROM alembic_version_epoch")
            ).scalars().all() == before_revisions
        assert report["eligible_for_migration"] is False
        assert report["control_state"] == "recovery_required"
        assert any("not 'verified'" in error for error in report["state_errors"])
    finally:
        engine.dispose()
