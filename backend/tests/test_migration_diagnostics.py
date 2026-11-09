from __future__ import annotations

from sqlalchemy.exc import ProgrammingError

from app.database.migration_diagnostics import (
    database_error_diagnostics,
    redact_sql_statement,
    safe_traceback_frames,
)


class FakePostgresError(Exception):
    sqlstate = "42P01"


def test_database_diagnostics_capture_sqlstate_without_parameters() -> None:
    statement = (
        "ALTER TABLE assessment_question_submissions "
        "DROP INDEX ix_assessment_q_sub_user_created "
        "WHERE note = 'private user value'"
    )
    error = ProgrammingError(
        statement,
        {"password": "do-not-log"},
        FakePostgresError("driver detail must not be logged"),
    )

    details = database_error_diagnostics(error)

    assert details["sqlalchemy_error_type"] == "ProgrammingError"
    assert details["driver_error_type"] == "FakePostgresError"
    assert details["sqlstate"] == "42P01"
    assert "ix_assessment_q_sub_user_created" in details["statement"]
    assert "private user value" not in details["statement"]
    assert "do-not-log" not in str(details)
    assert "driver detail must not be logged" not in str(details)


def test_sql_statement_redacts_urls_secrets_and_limits_length() -> None:
    statement = (
        "SELECT * FROM t WHERE password='secret' "
        "/* postgresql://operator:secret@db.internal/app */ "
        + ("x" * 2500)
    )

    safe_statement = redact_sql_statement(statement)

    assert safe_statement is not None
    assert "operator" not in safe_statement
    assert "secret" not in safe_statement
    assert len(safe_statement) < len(statement)
    assert safe_statement.endswith("...[TRUNCATED]")


def test_safe_traceback_frames_do_not_include_exception_messages() -> None:
    try:
        raise RuntimeError("sensitive exception detail")
    except RuntimeError as error:
        frames = safe_traceback_frames(error)

    assert "test_safe_traceback_frames" in frames
    assert "sensitive exception detail" not in frames
