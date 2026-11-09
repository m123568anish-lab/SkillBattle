from pathlib import Path

import pytest
from alembic.script import ScriptDirectory
from sqlalchemy import create_engine, text

from app.database.migration_state import (
    MigrationStateError,
    find_missing_applied_tables,
    find_pending_table_conflicts,
    inspect_migration_state,
)


BACKEND_DIR = Path(__file__).resolve().parents[1]


@pytest.fixture
def script():
    return ScriptDirectory(str(BACKEND_DIR / "alembic"))


@pytest.fixture
def connection():
    engine = create_engine("sqlite:///:memory:")
    try:
        with engine.connect() as conn:
            yield conn
    finally:
        engine.dispose()


def set_revision(connection, revision: str) -> None:
    connection.execute(text("CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL)"))
    connection.execute(
        text("INSERT INTO alembic_version (version_num) VALUES (:revision)"),
        {"revision": revision},
    )
    connection.commit()


def test_empty_database_is_reported_without_stamping(connection, script):
    state = inspect_migration_state(connection, script)

    assert state.current_revision is None
    assert state.expected_head == script.get_heads()[0]
    assert state.table_names == frozenset()


def test_application_tables_without_revision_metadata_are_rejected(connection, script):
    connection.execute(text("CREATE TABLE users (id INTEGER PRIMARY KEY)"))
    connection.commit()

    with pytest.raises(MigrationStateError, match="without Alembic revision metadata"):
        inspect_migration_state(connection, script)


def test_empty_revision_metadata_is_rejected(connection, script):
    connection.execute(text("CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL)"))
    connection.commit()

    with pytest.raises(MigrationStateError, match="found 0"):
        inspect_migration_state(connection, script)


def test_unknown_revision_is_rejected(connection, script):
    set_revision(connection, "unknown-revision")

    with pytest.raises(MigrationStateError, match="not present in the repository"):
        inspect_migration_state(connection, script)


def test_known_revision_on_repository_path_is_accepted(connection, script):
    set_revision(connection, "b8f2d4e6a901")

    state = inspect_migration_state(connection, script)

    assert state.current_revision == "b8f2d4e6a901"
    assert state.expected_head == script.get_heads()[0]


def test_missing_table_from_applied_revision_is_detected(connection, script):
    set_revision(connection, "b8f2d4e6a901")

    state = inspect_migration_state(connection, script)

    assert "refresh_tokens" in find_missing_applied_tables(script, state)


def test_multiple_database_revision_rows_are_rejected(connection, script):
    connection.execute(text("CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL)"))
    connection.execute(
        text("INSERT INTO alembic_version (version_num) VALUES ('b8f2d4e6a901'), ('7a2b1c4d9e8f')")
    )
    connection.commit()

    with pytest.raises(MigrationStateError, match="found 2"):
        inspect_migration_state(connection, script)


def test_multiple_repository_heads_are_rejected(connection, tmp_path: Path):
    versions = tmp_path / "versions"
    versions.mkdir()
    for revision in ("firstrevision1", "secondrevision2"):
        (versions / f"{revision}.py").write_text(
            "revision = {!r}\n"
            "down_revision = None\n"
            "branch_labels = None\n"
            "depends_on = None\n"
            "def upgrade(): pass\n"
            "def downgrade(): pass\n".format(revision),
            encoding="utf-8",
        )
    script = ScriptDirectory(str(tmp_path))

    with pytest.raises(MigrationStateError, match="exactly one repository Alembic head"):
        inspect_migration_state(connection, script)


def test_fresh_migration_conflicts_are_detected_before_execution(connection, script):
    state = inspect_migration_state(connection, script)

    conflicts = find_pending_table_conflicts(script, state)

    assert any("drop_table('interview_questions')" in conflict for conflict in conflicts)


def test_existing_placement_tables_conflict_with_pending_revision(connection, script):
    set_revision(connection, "b8f2d4e6a901")
    connection.execute(text("CREATE TABLE placement_companies (id VARCHAR(36) PRIMARY KEY)"))
    connection.commit()

    state = inspect_migration_state(connection, script)
    conflicts = find_pending_table_conflicts(script, state)

    assert any("create_table('placement_companies')" in conflict for conflict in conflicts)
