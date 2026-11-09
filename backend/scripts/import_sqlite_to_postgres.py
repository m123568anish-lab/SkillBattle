from __future__ import annotations

import argparse
import json
import os
import sqlite3
import sys
from datetime import date, datetime, time
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    Integer,
    JSON,
    Numeric,
    Time,
    create_engine,
    func,
    insert,
    inspect,
    select,
    text,
)
from sqlalchemy.engine import Engine, make_url
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.schema import Index, Table, UniqueConstraint
from sqlalchemy.types import TypeDecorator

from app.models import Base


PRODUCTION_BRANCH_ID = "br-dry-breeze-axnhl4r0"
BATCH_SIZE = 500
INTERNAL_SQLITE_TABLES = {"alembic_version"}


class ImportValidationError(RuntimeError):
    pass


def _quote_sqlite(identifier: str) -> str:
    return '"' + identifier.replace('"', '""') + '"'


def _base_type(column: Column[Any]) -> Any:
    column_type = column.type
    while isinstance(column_type, TypeDecorator):
        column_type = column_type.impl
    return column_type


def _adapt_value(value: Any, column: Column[Any]) -> Any:
    if value is None:
        return None

    column_type = _base_type(column)
    if isinstance(column_type, JSON):
        if isinstance(value, str):
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                raise ImportValidationError(
                    f"Invalid JSON in {column.table.name}.{column.name}."
                ) from None
        return value

    if isinstance(column_type, DateTime):
        if isinstance(value, datetime):
            return value
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value.replace("Z", "+00:00"))
            except ValueError:
                raise ImportValidationError(
                    f"Invalid datetime in {column.table.name}.{column.name}."
                ) from None
        raise ImportValidationError(
            f"Unsupported datetime value in {column.table.name}.{column.name}."
        )

    if isinstance(column_type, Date):
        if isinstance(value, datetime):
            return value.date()
        if isinstance(value, date):
            return value
        if isinstance(value, str):
            try:
                return date.fromisoformat(value)
            except ValueError:
                raise ImportValidationError(
                    f"Invalid date in {column.table.name}.{column.name}."
                ) from None
        raise ImportValidationError(
            f"Unsupported date value in {column.table.name}.{column.name}."
        )

    if isinstance(column_type, Time):
        if isinstance(value, time):
            return value
        if isinstance(value, str):
            try:
                return time.fromisoformat(value)
            except ValueError:
                raise ImportValidationError(
                    f"Invalid time in {column.table.name}.{column.name}."
                ) from None
        raise ImportValidationError(
            f"Unsupported time value in {column.table.name}.{column.name}."
        )

    if isinstance(column_type, Boolean):
        if value in (0, 1, False, True):
            return bool(value)
        if isinstance(value, str) and value.lower() in {"true", "false", "0", "1"}:
            return value.lower() in {"true", "1"}
        raise ImportValidationError(
            f"Invalid boolean in {column.table.name}.{column.name}."
        )

    if isinstance(column_type, Integer) and not isinstance(value, bool):
        try:
            converted = int(value)
        except (TypeError, ValueError, OverflowError):
            raise ImportValidationError(
                f"Invalid integer in {column.table.name}.{column.name}."
            ) from None
        if isinstance(value, float) and not value.is_integer():
            raise ImportValidationError(
                f"Non-integral number in {column.table.name}.{column.name}."
            )
        return converted

    if isinstance(column_type, Numeric):
        try:
            return Decimal(str(value))
        except (InvalidOperation, ValueError):
            raise ImportValidationError(
                f"Invalid decimal in {column.table.name}.{column.name}."
            ) from None

    if isinstance(column_type, Float):
        try:
            return float(value)
        except (TypeError, ValueError, OverflowError):
            raise ImportValidationError(
                f"Invalid floating-point number in {column.table.name}.{column.name}."
            ) from None

    return value


def _validate_target_foreign_keys(
    source: sqlite3.Connection,
    source_columns: dict[str, set[str]],
) -> None:
    for table in Base.metadata.sorted_tables:
        for foreign_key in table.foreign_keys:
            local = foreign_key.parent
            remote = foreign_key.column
            if local.name not in source_columns[table.name]:
                continue
            if remote.name not in source_columns.get(remote.table.name, set()):
                raise ImportValidationError(
                    f"Foreign-key target {remote.table.name}.{remote.name} is missing "
                    f"for {table.name}.{local.name}."
                )
            orphan_count = source.execute(
                f"SELECT COUNT(*) FROM {_quote_sqlite(table.name)} AS c "
                f"LEFT JOIN {_quote_sqlite(remote.table.name)} AS p "
                f"ON c.{_quote_sqlite(local.name)} = p.{_quote_sqlite(remote.name)} "
                f"WHERE c.{_quote_sqlite(local.name)} IS NOT NULL "
                f"AND p.{_quote_sqlite(remote.name)} IS NULL"
            ).fetchone()[0]
            if orphan_count:
                raise ImportValidationError(
                    f"Source has {orphan_count} orphan row(s) for "
                    f"{table.name}.{local.name}."
                )


def _unique_key_sets(table: Table) -> list[tuple[str, ...]]:
    keys: set[tuple[str, ...]] = set()
    for constraint in table.constraints:
        if isinstance(constraint, UniqueConstraint):
            keys.add(tuple(column.name for column in constraint.columns))
    for index in table.indexes:
        if index.unique and all(isinstance(item, Column) for item in index.expressions):
            keys.add(tuple(item.name for item in index.expressions))
    return sorted(keys)


def _validate_target_unique_constraints(
    source: sqlite3.Connection,
    source_columns: dict[str, set[str]],
) -> None:
    for table in Base.metadata.sorted_tables:
        columns = source_columns[table.name]
        for key in _unique_key_sets(table):
            if any(column not in columns for column in key):
                continue
            quoted = ", ".join(_quote_sqlite(column) for column in key)
            nonnull = " AND ".join(
                f"{_quote_sqlite(column)} IS NOT NULL" for column in key
            )
            duplicates = source.execute(
                "SELECT COUNT(*) FROM ("
                f"SELECT {quoted} FROM {_quote_sqlite(table.name)} "
                f"WHERE {nonnull} GROUP BY {quoted} HAVING COUNT(*) > 1)"
            ).fetchone()[0]
            if duplicates:
                raise ImportValidationError(
                    f"Source has {duplicates} duplicate key group(s) for "
                    f"{table.name}({', '.join(key)})."
                )


def _validate_source(
    source: sqlite3.Connection,
) -> tuple[dict[str, int], dict[str, set[str]]]:
    source_tables = {
        row[0]
        for row in source.execute(
            "SELECT name FROM sqlite_master "
            "WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
        )
    }
    modeled_tables = set(Base.metadata.tables)
    unmodeled = source_tables - modeled_tables - INTERNAL_SQLITE_TABLES
    populated_unmodeled = [
        name
        for name in sorted(unmodeled)
        if source.execute(
            f"SELECT EXISTS(SELECT 1 FROM {_quote_sqlite(name)} LIMIT 1)"
        ).fetchone()[0]
    ]
    if populated_unmodeled:
        raise ImportValidationError(
            "Populated source tables lack application models: "
            + ", ".join(populated_unmodeled)
        )

    counts: dict[str, int] = {}
    source_columns: dict[str, set[str]] = {}
    for name, table in Base.metadata.tables.items():
        if name not in source_tables:
            counts[name] = 0
            source_columns[name] = set()
            continue

        columns = {
            row[1]
            for row in source.execute(f"PRAGMA table_info({_quote_sqlite(name)})")
        }
        source_columns[name] = columns
        for extra in columns - set(table.columns.keys()):
            nonnull = source.execute(
                f"SELECT COUNT(*) FROM {_quote_sqlite(name)} "
                f"WHERE {_quote_sqlite(extra)} IS NOT NULL"
            ).fetchone()[0]
            if nonnull:
                raise ImportValidationError(
                    f"Source column {name}.{extra} contains data with no target field."
                )
        for column in table.columns:
            if (
                column.name not in columns
                and not column.nullable
                and not column.primary_key
                and column.default is None
                and column.server_default is None
                and not column.autoincrement
            ):
                raise ImportValidationError(
                    f"Required target field {name}.{column.name} is absent from source."
                )
        counts[name] = int(
            source.execute(
                f"SELECT COUNT(*) FROM {_quote_sqlite(name)}"
            ).fetchone()[0]
        )

    declared_fk_violations = source.execute("PRAGMA foreign_key_check").fetchall()
    if declared_fk_violations:
        raise ImportValidationError(
            f"SQLite source has {len(declared_fk_violations)} declared foreign-key violation(s)."
        )
    _validate_target_foreign_keys(source, source_columns)
    _validate_target_unique_constraints(source, source_columns)
    return counts, source_columns


def _target_engine_from_environment() -> Engine:
    raw_url = os.environ.get("MIGRATION_DATABASE_URL", "").strip()
    if not raw_url:
        raise ImportValidationError(
            "MIGRATION_DATABASE_URL must contain the direct Neon PostgreSQL URL."
        )
    if raw_url.startswith("postgres://"):
        raw_url = raw_url.replace("postgres://", "postgresql+psycopg://", 1)
    elif raw_url.startswith("postgresql://"):
        raw_url = raw_url.replace("postgresql://", "postgresql+psycopg://", 1)
    url = make_url(raw_url)
    if url.get_backend_name() != "postgresql":
        raise ImportValidationError("Import target must be PostgreSQL.")
    if "-pooler" in (url.host or ""):
        raise ImportValidationError("Import target must use a direct, unpooled URL.")
    return create_engine(url, pool_pre_ping=True, connect_args={"connect_timeout": 10})


def _validate_target_is_empty(connection: Any, tables: list[Table]) -> None:
    populated = [
        table.name
        for table in tables
        if connection.execute(select(func.count()).select_from(table)).scalar_one()
    ]
    if populated:
        raise ImportValidationError(
            "Target application tables must be empty before import: "
            + ", ".join(populated)
        )


def _reset_sequences(connection: Any, tables: list[Table]) -> None:
    for table in tables:
        if len(table.primary_key.columns) != 1:
            continue
        primary_key = next(iter(table.primary_key.columns))
        if not isinstance(_base_type(primary_key), Integer):
            continue
        sequence = connection.execute(
            text("SELECT pg_get_serial_sequence(:table_name, :column_name)"),
            {"table_name": f"public.{table.name}", "column_name": primary_key.name},
        ).scalar_one_or_none()
        if not sequence:
            continue
        maximum = connection.execute(
            select(func.max(primary_key)).select_from(table)
        ).scalar_one()
        if maximum is not None:
            connection.execute(
                text("SELECT setval(CAST(:sequence AS regclass), :value, true)"),
                {"sequence": sequence, "value": maximum},
            )


def import_data(source_path: Path, target_engine: Engine, *, apply: bool) -> dict[str, int]:
    source_path = source_path.resolve(strict=True)
    if not source_path.is_file():
        raise ImportValidationError("SQLite source path is not a file.")

    source = sqlite3.connect(
        f"file:{source_path.as_posix()}?mode=ro",
        uri=True,
    )
    source.row_factory = sqlite3.Row
    try:
        counts, source_columns = _validate_source(source)
        tables = list(Base.metadata.sorted_tables)
        missing_tables = set(Base.metadata.tables) - set(
            inspect(target_engine).get_table_names()
        )
        if missing_tables:
            raise ImportValidationError(
                "Target schema is missing application tables: "
                + ", ".join(sorted(missing_tables))
            )
        with target_engine.connect() as connection:
            _validate_target_is_empty(connection, tables)
        if not apply:
            return counts

        with target_engine.begin() as connection:
            for table in tables:
                connection.execute(
                    text(
                        f'LOCK TABLE "public"."{table.name}" '
                        "IN SHARE ROW EXCLUSIVE MODE"
                    )
                )
            _validate_target_is_empty(connection, tables)

            for table in tables:
                if not counts[table.name]:
                    continue
                columns = [
                    column
                    for column in table.columns
                    if column.name in source_columns[table.name]
                ]
                projection = ", ".join(
                    _quote_sqlite(column.name) for column in columns
                )
                cursor = source.execute(
                    f"SELECT {projection} FROM {_quote_sqlite(table.name)}"
                )
                while rows := cursor.fetchmany(BATCH_SIZE):
                    records = [
                        {
                            column.name: _adapt_value(row[column.name], column)
                            for column in columns
                        }
                        for row in rows
                    ]
                    connection.execute(insert(table), records)

            connection.execute(text("SET CONSTRAINTS ALL IMMEDIATE"))
            _reset_sequences(connection, tables)
            for table in tables:
                target_count = connection.execute(
                    select(func.count()).select_from(table)
                ).scalar_one()
                if target_count != counts[table.name]:
                    raise ImportValidationError(
                        f"Row-count verification failed for {table.name}: "
                        f"source={counts[table.name]}, target={target_count}."
                    )
        return counts
    finally:
        source.close()


def _parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Import modeled application tables from SQLite into Neon PostgreSQL."
    )
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--target-branch-id", required=True)
    parser.add_argument(
        "--environment",
        choices=("validation", "production"),
        default="validation",
    )
    parser.add_argument("--apply", action="store_true", help="Commit the import.")
    parser.add_argument(
        "--allow-production",
        action="store_true",
        help="Required in addition to --environment production.",
    )
    args = parser.parse_args(argv)
    if args.target_branch_id == PRODUCTION_BRANCH_ID and not args.allow_production:
        parser.error("Production branch requires --allow-production.")
    if args.environment == "production" and not args.allow_production:
        parser.error("Production import requires --allow-production.")
    if args.environment == "validation" and args.allow_production:
        parser.error("--allow-production cannot be used with validation.")
    if not args.apply:
        print("Preflight only; no rows will be written.")
    return args


def main(argv: list[str] | None = None) -> int:
    args = _parse_args(argv)
    engine: Engine | None = None
    try:
        engine = _target_engine_from_environment()
        counts = import_data(args.source, engine, apply=args.apply)
        print(
            json.dumps(
                {
                    "target_branch_id": args.target_branch_id,
                    "environment": args.environment,
                    "applied": args.apply,
                    "table_count": len(counts),
                    "total_rows": sum(counts.values()),
                    "table_row_counts": counts,
                },
                indent=2,
                sort_keys=True,
            )
        )
        return 0
    except (ImportValidationError, OSError, sqlite3.Error, SQLAlchemyError) as exc:
        print(
            f"Import preflight or transfer failed ({type(exc).__name__}); "
            "no success was reported.",
            file=sys.stderr,
        )
        return 1
    finally:
        if engine is not None:
            engine.dispose()


if __name__ == "__main__":
    raise SystemExit(main())
