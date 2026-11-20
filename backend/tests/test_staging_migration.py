from __future__ import annotations

import json
import os
from contextlib import contextmanager
from pathlib import Path
from types import SimpleNamespace

import pytest

from app.database import staging_migration
from app.core.config import load_environment_file_values
from app.database.staging_migration import (
    PLACEMENT_MIGRATION_REVISION,
    StagingMigrationError,
    load_staging_migration_authorization,
    validate_staging_configuration,
    verify_neon_staging_branch,
)
import run_migrations


BACKEND_ROOT = Path(__file__).resolve().parents[1]


def _environment(**overrides: str) -> dict[str, str]:
    values = {
        "ENVIRONMENT": "staging",
        "EXPECTED_NEON_PROJECT_ID": "qubira-project-123",
        "EXPECTED_NEON_BRANCH_ID": "br-dark-lake-axm12r04",
        "EXPECTED_DATABASE_NAME": "neondb",
        "EXPECTED_DATABASE_ROLE": "neondb_owner",
        "EXPECTED_MIGRATION_REVISION": PLACEMENT_MIGRATION_REVISION,
        "NEON_API_KEY": "not-a-real-api-key",
        "DATABASE_URL": (
            "postgresql+psycopg://neondb_owner:placeholder@"
            "ep-staging.example.neon.tech/neondb?sslmode=require"
        ),
        "MIGRATION_DATABASE_URL": (
            "postgresql://neondb_owner:placeholder@"
            "ep-staging.example.neon.tech/neondb?sslmode=require"
        ),
        "STAGING_MIGRATION_APPROVED": "false",
    }
    values.update(overrides)
    return values


def test_staging_authorization_requires_explicit_environment_and_identity() -> None:
    with pytest.raises(StagingMigrationError, match="ENVIRONMENT=staging"):
        load_staging_migration_authorization(
            _environment(ENVIRONMENT="production")
        )

    with pytest.raises(StagingMigrationError, match="EXPECTED_NEON_PROJECT_ID"):
        load_staging_migration_authorization(
            _environment(EXPECTED_NEON_PROJECT_ID="")
        )


def test_configuration_validation_reports_all_missing_names_without_values() -> None:
    with pytest.raises(StagingMigrationError, match="EXPECTED_NEON_PROJECT_ID") as error:
        validate_staging_configuration({"ENVIRONMENT": "staging"})

    message = str(error.value)
    assert "MIGRATION_DATABASE_URL" in message
    assert "DATABASE_URL" in message
    assert "postgres" not in message.lower()


def test_configuration_validation_rejects_non_staging_environment() -> None:
    with pytest.raises(StagingMigrationError, match="ENVIRONMENT=staging"):
        validate_staging_configuration({"ENVIRONMENT": "production"})


def test_staging_does_not_auto_load_generic_environment_files(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    (tmp_path / ".env").write_text(
        "ENVIRONMENT=production\nDATABASE_URL=postgresql://production.example/neondb\n",
        encoding="utf-8",
    )
    monkeypatch.chdir(tmp_path)
    monkeypatch.setenv("ENVIRONMENT", "staging")
    monkeypatch.delenv("DATABASE_URL", raising=False)

    load_environment_file_values()

    assert "DATABASE_URL" not in os.environ


def test_configuration_validation_rejects_production_like_migration_target() -> None:
    with pytest.raises(StagingMigrationError, match="production-like"):
        load_staging_migration_authorization(
            _environment(
                DATABASE_URL="postgresql+psycopg://neondb_owner@ep-staging.neon.tech/neondb",
                MIGRATION_DATABASE_URL=(
                    "postgresql+psycopg://neondb_owner@ep-production.neon.tech/neondb"
                ),
            )
        )


def test_configuration_validation_rejects_pooled_migration_target() -> None:
    with pytest.raises(StagingMigrationError, match="direct, unpooled"):
        load_staging_migration_authorization(
            _environment(
                MIGRATION_DATABASE_URL=(
                    "postgresql+psycopg://neondb_owner@ep-staging-pooler.neon.tech/neondb"
                )
            )
        )

    with pytest.raises(StagingMigrationError, match="reviewed placement migration"):
        load_staging_migration_authorization(
            _environment(EXPECTED_MIGRATION_REVISION="head")
        )


def test_staging_authorization_rejects_pooled_or_mismatched_database_urls() -> None:
    with pytest.raises(StagingMigrationError, match="direct, unpooled"):
        load_staging_migration_authorization(
            _environment(
                MIGRATION_DATABASE_URL=(
                    "postgresql+psycopg://neondb_owner:placeholder@"
                    "ep-staging-pooler.example.neon.tech/neondb"
                )
            )
        )

    with pytest.raises(StagingMigrationError, match="endpoint port"):
        load_staging_migration_authorization(
            _environment(
                MIGRATION_DATABASE_URL=(
                    "postgresql+psycopg://neondb_owner:placeholder@"
                    "ep-staging.example.neon.tech:5433/neondb"
                )
            )
        )

    with pytest.raises(StagingMigrationError, match="EXPECTED_DATABASE_NAME"):
        load_staging_migration_authorization(
            _environment(
                MIGRATION_DATABASE_URL=(
                    "postgresql+psycopg://neondb_owner:placeholder@"
                    "ep-staging.example.neon.tech/otherdb"
                )
            )
        )

    with pytest.raises(StagingMigrationError, match="EXPECTED_DATABASE_ROLE"):
        load_staging_migration_authorization(
            _environment(
                MIGRATION_DATABASE_URL=(
                    "postgresql+psycopg://other:placeholder@"
                    "ep-staging.example.neon.tech/neondb"
                )
            )
        )


def test_staging_approval_is_explicit_and_boolean() -> None:
    denied = load_staging_migration_authorization(_environment())
    approved = load_staging_migration_authorization(
        _environment(STAGING_MIGRATION_APPROVED="true")
    )
    assert denied.approved is False
    assert approved.approved is True
    assert denied.database_url.drivername == "postgresql+psycopg"
    with pytest.raises(StagingMigrationError, match="explicit boolean"):
        load_staging_migration_authorization(
            _environment(STAGING_MIGRATION_APPROVED="maybe")
        )


def test_neon_branch_and_direct_endpoint_must_match_expected_staging_identity(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    authorization = load_staging_migration_authorization(_environment())
    responses = iter(
        [
            {
                "branch": {
                    "id": authorization.branch_id,
                    "project_id": authorization.project_id,
                    "name": "qubira-staging",
                    "default": False,
                    "current_state": "ready",
                }
            },
            {
                "endpoints": [
                    {
                        "id": "ep-staging",
                        "project_id": authorization.project_id,
                        "branch_id": authorization.branch_id,
                        "type": "read_write",
                        "host": authorization.database_url.host,
                        "disabled": False,
                    }
                ]
            },
        ]
    )
    monkeypatch.setattr(
        staging_migration,
        "_neon_api_json",
        lambda _path, _key: next(responses),
    )

    identity = verify_neon_staging_branch(authorization)
    assert identity["branch_name"] == "qubira-staging"
    assert identity["endpoint_verified"] is True


@pytest.mark.parametrize(
    "branch_changes",
    [
        {"name": "production"},
        {"default": True},
        {"current_state": "suspended"},
        {"project_id": "different-project"},
        {"id": "br-production"},
    ],
)
def test_neon_identity_rejects_non_staging_branch(
    monkeypatch: pytest.MonkeyPatch,
    branch_changes: dict[str, object],
) -> None:
    authorization = load_staging_migration_authorization(_environment())
    branch = {
        "id": authorization.branch_id,
        "project_id": authorization.project_id,
        "name": "qubira-staging",
        "default": False,
        "current_state": "ready",
    }
    branch.update(branch_changes)
    monkeypatch.setattr(
        staging_migration,
        "_neon_api_json",
        lambda _path, _key: {"branch": branch},
    )

    with pytest.raises(StagingMigrationError):
        verify_neon_staging_branch(authorization)


def test_neon_identity_rejects_mismatched_or_pooled_endpoint(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    authorization = load_staging_migration_authorization(_environment())
    responses = iter(
        [
            {
                "branch": {
                    "id": authorization.branch_id,
                    "project_id": authorization.project_id,
                    "name": "qubira-staging",
                    "default": False,
                    "current_state": "ready",
                }
            },
            {
                "endpoints": [
                    {
                        "project_id": authorization.project_id,
                        "branch_id": authorization.branch_id,
                        "type": "read_write",
                        "host": "ep-staging-pooler.example.neon.tech",
                        "disabled": False,
                    }
                ]
            },
        ]
    )
    monkeypatch.setattr(
        staging_migration,
        "_neon_api_json",
        lambda _path, _key: next(responses),
    )

    with pytest.raises(StagingMigrationError, match="unique read-write endpoint"):
        verify_neon_staging_branch(authorization)


def test_only_the_reviewed_upgrade_is_checked_for_destructive_operations() -> None:
    migration_path = (
        BACKEND_ROOT
        / "alembic"
        / "versions"
        / "f9a1b2c3d4e5_add_placement_jobs_and_question_provenance.py"
    )
    staging_migration._assert_non_destructive_upgrade(str(migration_path))
    assert set(
        staging_migration._destructive_operations_in_function(
            str(migration_path),
            "downgrade",
        )
    ) == {"drop_column", "drop_index", "drop_table"}


def test_staging_execute_requires_approval_before_external_access(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    authorization = load_staging_migration_authorization(_environment())
    monkeypatch.setattr(
        staging_migration,
        "load_staging_migration_authorization",
        lambda: authorization,
    )
    monkeypatch.setattr(
        staging_migration,
        "verify_neon_staging_branch",
        lambda _authorization: pytest.fail("Neon API must not be called without approval."),
    )
    monkeypatch.setattr(
        run_migrations,
        "acquire_postgresql_migration_ownership",
        lambda *_args, **_kwargs: pytest.fail(
            "The database must not be contacted without approval."
        ),
    )

    assert run_migrations.run_staging_migration(execute=True) == 1


def test_staging_preflight_commits_identity_read_before_starting_read_only_transaction(
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    authorization = load_staging_migration_authorization(_environment())

    class Connection:
        transaction_active = False

        def commit(self) -> None:
            self.transaction_active = False

    class Ownership:
        connection = Connection()

        def assert_connection(self, connection: Connection) -> None:
            assert connection is self.connection
            connection.transaction_active = True

    ownership = Ownership()

    @contextmanager
    def ownership_context(_database_url):
        yield ownership

    def build_preflight(connection, *_args, **_kwargs):
        assert connection.transaction_active is False
        connection.transaction_active = True
        return SimpleNamespace(report={"read_only": True})

    monkeypatch.setattr(
        run_migrations,
        "engine",
        SimpleNamespace(dialect=SimpleNamespace(name="postgresql")),
    )
    monkeypatch.setattr(
        run_migrations.settings,
        "DATABASE_URL",
        str(authorization.database_url),
    )
    monkeypatch.setattr(
        staging_migration,
        "load_staging_migration_authorization",
        lambda: authorization,
    )
    monkeypatch.setattr(
        staging_migration,
        "verify_neon_staging_branch",
        lambda _authorization: {"branch_name": "qubira-staging"},
    )
    monkeypatch.setattr(
        staging_migration,
        "build_staging_preflight",
        build_preflight,
    )
    monkeypatch.setattr(
        run_migrations,
        "acquire_postgresql_migration_ownership",
        ownership_context,
    )

    assert run_migrations.run_staging_migration(execute=False) == 0
    report = json.loads(capsys.readouterr().out)
    assert report["read_only"] is True
    assert report["execution_requested"] is False
