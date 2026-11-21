from __future__ import annotations

import importlib.util
import os
import uuid
from pathlib import Path

import pytest
from alembic.config import Config
from alembic.operations import Operations
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import make_url
from sqlalchemy.pool import NullPool

from app.database.staging_migration import (
    PLACEMENT_MIGRATION_REVISION,
    StagingMigrationAuthorization,
    build_staging_preflight,
)


BACKEND_ROOT = Path(__file__).resolve().parents[2]
_POSTGRESQL_TEST_URL = os.environ.get("QUBIRA_TEST_POSTGRESQL_URL", "")
_POSTGRESQL_TEST_URL_OBJ = (
    make_url(_POSTGRESQL_TEST_URL) if _POSTGRESQL_TEST_URL else None
)
_SAFE_TEST_TARGET = (
    _POSTGRESQL_TEST_URL_OBJ is not None
    and _POSTGRESQL_TEST_URL_OBJ.get_backend_name() == "postgresql"
    and _POSTGRESQL_TEST_URL_OBJ.host in {"127.0.0.1", "localhost", "::1"}
    and (_POSTGRESQL_TEST_URL_OBJ.database or "").startswith("qubira_test_")
)

pytestmark = pytest.mark.skipif(
    not _SAFE_TEST_TARGET,
    reason="Requires a uniquely named loopback disposable PostgreSQL database.",
)


def _load_placement_migration():
    migration_path = (
        BACKEND_ROOT
        / "alembic"
        / "versions"
        / "f9a1b2c3d4e5_add_placement_jobs_and_question_provenance.py"
    )
    spec = importlib.util.spec_from_file_location(
        "placement_migration_postgresql",
        migration_path,
    )
    assert spec is not None and spec.loader is not None
    migration = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(migration)
    return migration


def test_placement_migration_upgrade_and_downgrade_preserve_legacy_questions() -> None:
    assert _POSTGRESQL_TEST_URL_OBJ is not None
    schema_name = f"placement_migration_test_{uuid.uuid4().hex}"
    engine = create_engine(_POSTGRESQL_TEST_URL_OBJ, poolclass=NullPool)
    migration = _load_placement_migration()
    try:
        with engine.begin() as connection:
            database_name = connection.execute(
                text("SELECT current_database()")
            ).scalar_one()
            assert database_name == _POSTGRESQL_TEST_URL_OBJ.database
            connection.execute(text(f'CREATE SCHEMA "{schema_name}"'))
            connection.exec_driver_sql(
                f'SET LOCAL search_path TO "{schema_name}"'
            )
            connection.exec_driver_sql(
                "CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL)"
            )
            connection.exec_driver_sql(
                "INSERT INTO alembic_version (version_num) VALUES "
                "('d1f5a8e7c2b4')"
            )
            connection.exec_driver_sql(
                "CREATE TABLE questions ("
                "id INTEGER PRIMARY KEY, "
                "question_type VARCHAR(30) NOT NULL, "
                "is_active BOOLEAN NOT NULL, "
                "is_validated BOOLEAN NOT NULL, "
                "title VARCHAR(200) NOT NULL, "
                "content TEXT NOT NULL)"
            )
            connection.exec_driver_sql(
                "INSERT INTO questions "
                "(id, question_type, is_active, is_validated, title, content) VALUES "
                "(1, 'coding', TRUE, TRUE, 'coding approved', 'original coding content'), "
                "(2, 'mcq', TRUE, TRUE, 'mcq approved', 'original mcq content'), "
                "(3, '', TRUE, FALSE, 'unvalidated', 'original unvalidated content'), "
                "(4, 'coding', FALSE, TRUE, 'inactive', 'original inactive content'), "
                "(5, 'mcq', FALSE, FALSE, 'inactive unvalidated', 'original content')"
            )

            context = MigrationContext.configure(connection)
            with Operations.context(context):
                migration.upgrade()

            rows = connection.execute(
                text(
                    "SELECT id, question_type, is_active, is_validated, title, content, "
                    "question_kind, verification_status, approval_status, lifecycle_state "
                    "FROM questions ORDER BY id"
                )
            ).all()
            assert [row[:6] for row in rows] == [
                (1, "coding", True, True, "coding approved", "original coding content"),
                (2, "mcq", True, True, "mcq approved", "original mcq content"),
                (3, "", True, False, "unvalidated", "original unvalidated content"),
                (4, "coding", False, True, "inactive", "original inactive content"),
                (5, "mcq", False, False, "inactive unvalidated", "original content"),
            ]
            assert [row[6:] for row in rows] == [
                ("coding", "approved", "approved", "PUBLISHED"),
                ("mcq", "approved", "approved", "PUBLISHED"),
                ("mcq", "needs_review", "needs_review", "NEEDS_REVIEW"),
                ("coding", "needs_review", "needs_review", "NEEDS_REVIEW"),
                ("mcq", "needs_review", "needs_review", "NEEDS_REVIEW"),
            ]

            tables = set(inspect(connection).get_table_names(schema=schema_name))
            assert {
                "placement_jobs",
                "placement_source_records",
                "placement_inventory_targets",
            } <= tables

            with Operations.context(context):
                migration.downgrade()

            tables_after_downgrade = set(
                inspect(connection).get_table_names(schema=schema_name)
            )
            assert not {
                "placement_jobs",
                "placement_source_records",
                "placement_inventory_targets",
            } & tables_after_downgrade
            question_columns = {
                column["name"]
                for column in inspect(connection).get_columns(
                    "questions",
                    schema=schema_name,
                )
            }
            assert question_columns == {
                "id",
                "question_type",
                "is_active",
                "is_validated",
                "title",
                "content",
            }
            assert connection.execute(
                text(
                    f'SELECT id, question_type, is_active, is_validated, title, content '
                    f'FROM "{schema_name}".questions ORDER BY id'
                )
            ).all() == [
                (1, "coding", True, True, "coding approved", "original coding content"),
                (2, "mcq", True, True, "mcq approved", "original mcq content"),
                (3, "", True, False, "unvalidated", "original unvalidated content"),
                (4, "coding", False, True, "inactive", "original inactive content"),
                (5, "mcq", False, False, "inactive unvalidated", "original content"),
            ]
    finally:
        with engine.begin() as connection:
            connection.execute(text(f'DROP SCHEMA IF EXISTS "{schema_name}" CASCADE'))
        engine.dispose()


def test_staging_migration_preflight_is_read_only_and_reports_legacy_counts() -> None:
    assert _POSTGRESQL_TEST_URL_OBJ is not None
    schema_name = f"placement_preflight_test_{uuid.uuid4().hex}"
    engine = create_engine(_POSTGRESQL_TEST_URL_OBJ, poolclass=NullPool)
    authorization = StagingMigrationAuthorization(
        project_id="qubira-project-test",
        branch_id="br-qubira-staging-test",
        database_name=_POSTGRESQL_TEST_URL_OBJ.database or "",
        database_role=_POSTGRESQL_TEST_URL_OBJ.username or "",
        expected_current_revision="d1f5a8e7c2b4",
        target_revision=PLACEMENT_MIGRATION_REVISION,
        neon_api_key="not-used-by-preflight-test",
        database_url=_POSTGRESQL_TEST_URL_OBJ,
        approved=False,
    )
    script = ScriptDirectory.from_config(
        Config(str(BACKEND_ROOT / "alembic.ini"))
    )
    try:
        with engine.begin() as connection:
            connection.execute(text(f'CREATE SCHEMA "{schema_name}"'))
            connection.exec_driver_sql(
                f'SET LOCAL search_path TO "{schema_name}"'
            )
            connection.exec_driver_sql(
                "CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL)"
            )
            connection.exec_driver_sql(
                "INSERT INTO alembic_version (version_num) VALUES "
                "('d1f5a8e7c2b4')"
            )
            connection.exec_driver_sql(
                "CREATE TABLE questions ("
                "id INTEGER PRIMARY KEY, "
                "question_type VARCHAR(30) NOT NULL, "
                "is_active BOOLEAN NOT NULL, "
                "is_validated BOOLEAN NOT NULL)"
            )
            connection.exec_driver_sql(
                "INSERT INTO questions (id, question_type, is_active, is_validated) VALUES "
                "(1, 'coding', TRUE, TRUE), "
                "(2, 'mcq', TRUE, FALSE), "
                "(3, 'coding', FALSE, TRUE)"
            )

        with engine.connect() as connection:
            connection.exec_driver_sql(f'SET search_path TO "{schema_name}"')
            connection.commit()
            preflight = build_staging_preflight(
                connection,
                authorization,
                script,
                expected_schema=schema_name,
            )
            assert connection.exec_driver_sql(
                "SHOW transaction_read_only"
            ).scalar_one() == "on"
            assert preflight.report["current_revision"] == "d1f5a8e7c2b4"
            assert preflight.report["target_revision"] == PLACEMENT_MIGRATION_REVISION
            assert preflight.report["read_only"] is True
            assert preflight.question_counts == (
                ("coding", False, True, 1),
                ("coding", True, True, 1),
                ("mcq", True, False, 1),
            )
            assert set(inspect(connection).get_table_names()) == {
                "alembic_version",
                "questions",
            }
    finally:
        with engine.begin() as connection:
            connection.execute(text(f'DROP SCHEMA IF EXISTS "{schema_name}" CASCADE'))
        engine.dispose()
