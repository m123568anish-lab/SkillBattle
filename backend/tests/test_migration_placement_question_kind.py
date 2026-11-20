import importlib.util
from pathlib import Path

from alembic.operations import Operations
from alembic.runtime.migration import MigrationContext
from sqlalchemy import create_engine, text


def test_placement_migration_backfills_question_kind_from_legacy_question_type():
    migration_path = (
        Path(__file__).parents[1]
        / "alembic"
        / "versions"
        / "f9a1b2c3d4e5_add_placement_jobs_and_question_provenance.py"
    )
    spec = importlib.util.spec_from_file_location("placement_migration", migration_path)
    assert spec is not None and spec.loader is not None
    migration = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(migration)

    engine = create_engine("sqlite:///:memory:")
    try:
        with engine.begin() as connection:
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
                "(2, 'mcq', TRUE, TRUE), "
                "(3, '', TRUE, FALSE), "
                "(4, 'coding', FALSE, TRUE)"
            )
            context = MigrationContext.configure(connection)
            with Operations.context(context):
                migration.upgrade()

            rows = connection.execute(
                text(
                    "SELECT id, question_kind, verification_status, approval_status, lifecycle_state "
                    "FROM questions ORDER BY id"
                )
            ).all()

        assert rows == [
            (1, "coding", "approved", "approved", "PUBLISHED"),
            (2, "mcq", "approved", "approved", "PUBLISHED"),
            (3, "mcq", "needs_review", "needs_review", "NEEDS_REVIEW"),
            (4, "coding", "needs_review", "needs_review", "NEEDS_REVIEW"),
        ]
    finally:
        engine.dispose()
