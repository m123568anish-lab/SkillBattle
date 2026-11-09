from __future__ import annotations

import json
import logging
import re
import sys
from pathlib import Path
from typing import Any

from alembic.autogenerate import compare_metadata
from alembic.config import Config
from alembic.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import Connection, JSON, create_engine, inspect, text
from sqlalchemy.engine import Engine, URL
from sqlalchemy.pool import NullPool
from sqlalchemy.types import TypeDecorator

from app.database.database import engine as application_engine
from app.database.migration_state import (
    find_pending_table_conflicts,
    find_missing_applied_tables,
    MigrationState,
)
from app.models import Base

logger = logging.getLogger(__name__)

_JSON_SERVER_DEFAULT_LITERAL = re.compile(
    r"""^\s*\(?\s*'((?:''|[^'])*)'\s*\)?\s*(?:::\s*(?:pg_catalog\.)?jsonb?)?\s*$""",
    re.IGNORECASE,
)


def _column_uses_json_type(column: Any) -> bool:
    column_type = column.type
    while isinstance(column_type, TypeDecorator):
        column_type = column_type.impl
    return isinstance(column_type, JSON)


def _parse_json_server_default(rendered_default: str) -> object:
    match = _JSON_SERVER_DEFAULT_LITERAL.fullmatch(rendered_default)
    if match is None:
        raise ValueError("JSON server default is not a string literal.")
    return json.loads(match.group(1).replace("''", "'"))


def _compare_server_default(
    context: MigrationContext,
    inspected_column: Any,
    metadata_column: Any,
    rendered_inspected_default: str | None,
    metadata_default: Any,
    rendered_metadata_default: str | None,
) -> bool | None:
    if context.dialect.name != "postgresql" or not (
        _column_uses_json_type(inspected_column)
        or _column_uses_json_type(metadata_column)
    ):
        return None

    if rendered_inspected_default == rendered_metadata_default:
        return False
    if rendered_inspected_default is None or rendered_metadata_default is None:
        return True

    try:
        inspected_value = _parse_json_server_default(rendered_inspected_default)
        metadata_value = _parse_json_server_default(rendered_metadata_default)
    except (ValueError, json.JSONDecodeError):
        return True
    return inspected_value != metadata_value


def compare_model_schema(connection: Connection) -> list[dict[str, object]]:
    migration_context = MigrationContext.configure(
        connection,
        opts={
            "compare_type": True,
            "compare_server_default": _compare_server_default,
        },
    )
    raw_differences = compare_metadata(migration_context, Base.metadata)
    differences = [
        difference
        for group in raw_differences
        for difference in (group if isinstance(group, list) else [group])
    ]
    return [
        _format_schema_difference(difference)
        for difference in differences
    ]


def _format_schema_difference(difference: tuple) -> dict[str, object]:
    operation = str(difference[0])
    result: dict[str, object] = {"operation": operation}

    if operation.startswith("modify_") and len(difference) >= 7:
        result.update(
            {
                "schema": difference[1],
                "table": difference[2],
                "column": difference[3],
            }
        )
        current = difference[5]
        desired = difference[6]
        if operation == "modify_type":
            result.update({"current": str(current), "desired": str(desired)})
        elif operation == "modify_nullable":
            result.update({"current": current, "desired": desired})
        elif operation == "modify_default":
            result.update(
                {
                    "current": _render_default(current),
                    "desired": _render_default(desired),
                }
            )
        return result

    target = difference[1] if len(difference) > 1 else None
    table = getattr(target, "table", None)
    table_name = getattr(table, "name", None) or getattr(target, "name", None)
    result["table"] = table_name
    name = getattr(target, "name", None)
    if name:
        result["name"] = name
    columns = getattr(target, "columns", None)
    if columns is not None:
        result["columns"] = [column.name for column in columns]
    elements = getattr(target, "elements", None)
    if elements is not None:
        result["references"] = [
            f"{element.parent.name}->{element.target_fullname}" for element in elements
        ]
    if len(difference) > 2 and isinstance(difference[2], str):
        result.setdefault("table", difference[2])
    return result


def _render_default(value: object) -> str | None:
    if value is None:
        return None
    argument = getattr(value, "arg", value)
    return str(argument)


def _read_only_engine(source: Engine) -> Engine:
    if source.dialect.name == "sqlite":
        database = source.url.database
        if not database or database == ":memory:":
            raise RuntimeError(
                "Preflight requires a file-backed SQLite database so it can use mode=ro."
            )
        path = Path(database).resolve()
        readonly_url = URL.create(
            "sqlite+pysqlite",
            database=f"file:{path.as_posix()}",
            query={"mode": "ro", "uri": "true"},
        )
        return create_engine(
            readonly_url,
            connect_args={"check_same_thread": False},
            poolclass=NullPool,
        )

    connect_args = (
        {"connect_timeout": 10}
        if source.dialect.name == "postgresql"
        else {}
    )
    return create_engine(
        source.url,
        poolclass=NullPool,
        pool_pre_ping=True,
        connect_args=connect_args,
    )


def _database_identity(engine: Engine) -> str:
    if engine.dialect.name == "sqlite":
        database = engine.url.database or "<unknown>"
        return f"sqlite:///{Path(database).name}"
    host = engine.url.host or "<default-host>"
    port = engine.url.port or 5432
    database = engine.url.database or "<default-database>"
    return f"{engine.dialect.name}://{host}:{port}/{database}"


def build_preflight_report(source_engine: Engine = application_engine) -> dict[str, object]:
    config = Config(str(Path(__file__).resolve().parents[2] / "alembic.ini"))
    script = ScriptDirectory.from_config(config)
    repository_heads = script.get_heads()
    expected_head = repository_heads[0] if len(repository_heads) == 1 else None
    readonly_engine = _read_only_engine(source_engine)
    try:
        with readonly_engine.connect() as connection:
            if source_engine.dialect.name != "sqlite":
                connection.execute(text("SET TRANSACTION READ ONLY"))
            table_names = frozenset(inspect(connection).get_table_names())
            state_errors: list[str] = []
            if len(repository_heads) != 1:
                state_errors.append(
                    f"Repository has {len(repository_heads)} Alembic heads: {repository_heads}"
                )

            current_revision = None
            revision_rows: list[str] = []
            if "alembic_version" not in table_names:
                if table_names - {"sqlite_sequence"}:
                    state_errors.append(
                        "Application tables exist without Alembic revision metadata."
                    )
            else:
                try:
                    revision_rows = connection.execute(
                        text("SELECT version_num FROM alembic_version")
                    ).scalars().all()
                except Exception:
                    state_errors.append("The alembic_version table is malformed or unreadable.")
                if len(revision_rows) != 1:
                    state_errors.append(
                        f"Expected one applied Alembic revision; found {len(revision_rows)}."
                    )
                else:
                    current_revision = revision_rows[0]
                    if not isinstance(current_revision, str) or not re.fullmatch(
                        r"[A-Za-z0-9_-]{1,128}", current_revision
                    ):
                        current_revision = "<invalid>"
                        state_errors.append(
                            "Database revision identifier contains invalid characters."
                        )
                    else:
                        try:
                            revision = script.get_revision(current_revision)
                        except Exception:
                            revision = None
                        if revision is None:
                            state_errors.append(
                                f"Database revision {current_revision!r} is not in the repository."
                            )
                        elif expected_head:
                            try:
                                list(script.iterate_revisions(expected_head, current_revision))
                            except Exception:
                                state_errors.append(
                                    f"Database revision {current_revision!r} is not an ancestor "
                                    f"of repository head {expected_head!r}."
                                )

            state = MigrationState(
                current_revision,
                expected_head or "",
                table_names,
            )
            schema_differences = compare_model_schema(connection)
            missing_applied_tables = (
                find_missing_applied_tables(script, state)
                if current_revision and not state_errors
                else ()
            )
            table_conflicts = (
                find_pending_table_conflicts(script, state)
                if expected_head and not state_errors
                else ()
            )
    finally:
        readonly_engine.dispose()

    differences = schema_differences
    eligible = (
        not state_errors
        and expected_head is not None
        and not missing_applied_tables
        and state.current_revision == expected_head
        and not differences
        and not table_conflicts
    )
    if state.current_revision is None:
        eligible = False

    return {
        "database": _database_identity(source_engine),
        "dialect": source_engine.dialect.name,
        "current_revision": state.current_revision,
        "repository_head": expected_head,
        "repository_heads": repository_heads,
        "repository_head_count": len(repository_heads),
        "state_errors": state_errors,
        "table_count": len(state.table_names),
        "schema_difference_count": len(differences),
        "schema_differences": differences,
        "missing_applied_tables": list(missing_applied_tables),
        "pending_table_conflicts": list(table_conflicts),
        "eligible_for_migration": eligible,
    }


def main() -> int:
    try:
        report = build_preflight_report()
    except Exception as exc:
        # Database exception messages can contain connection details. Report
        # only the error class; schema and revision diagnostics remain explicit.
        logger.error("Migration preflight failed: %s", type(exc).__name__)
        return 1
    print(json.dumps(report, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    logging.basicConfig(level=logging.WARNING, stream=sys.stderr)
    raise SystemExit(main())
