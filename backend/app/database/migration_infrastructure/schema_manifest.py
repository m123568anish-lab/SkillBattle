from __future__ import annotations

import hashlib
import json
from collections.abc import Mapping
from typing import Any

from sqlalchemy import Connection, Engine, inspect, text


MANIFEST_FORMAT_VERSION = 1


def _stable_value(value: object) -> str | int | float | bool | None:
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    return str(value).strip()


def _column_manifest(column: Mapping[str, Any]) -> dict[str, Any]:
    return {
        "name": column["name"],
        "type": str(column["type"]),
        "nullable": bool(column["nullable"]),
        "default": _stable_value(column.get("default")),
        "autoincrement": _stable_value(column.get("autoincrement")),
        "computed": _stable_value(column.get("computed")),
        "identity": _stable_value(column.get("identity")),
    }


def _constraint_manifest(
    connection: Connection,
    schema: str | None,
    table_name: str,
) -> dict[str, Any]:
    inspector = inspect(connection)

    primary_key = inspector.get_pk_constraint(table_name, schema=schema) or {}
    foreign_keys = [
        {
            "name": item.get("name"),
            "columns": list(item.get("constrained_columns") or ()),
            "referred_schema": item.get("referred_schema"),
            "referred_table": item.get("referred_table"),
            "referred_columns": list(item.get("referred_columns") or ()),
            "options": dict(sorted((item.get("options") or {}).items())),
        }
        for item in inspector.get_foreign_keys(table_name, schema=schema)
    ]
    unique_constraints = [
        {
            "name": item.get("name"),
            "columns": list(item.get("column_names") or ()),
        }
        for item in inspector.get_unique_constraints(table_name, schema=schema)
    ]
    if connection.dialect.name == "sqlite":
        unique_constraints.extend(
            _sqlite_unique_constraints(connection, schema, table_name)
        )
    unique_constraints = list(
        {
            _object_sort_key(item): item
            for item in unique_constraints
        }.values()
    )
    check_constraints = [
        {"name": item.get("name"), "sqltext": _stable_value(item.get("sqltext"))}
        for item in inspector.get_check_constraints(table_name, schema=schema)
    ]
    indexes = [
        {
            "name": item.get("name"),
            "columns": list(item.get("column_names") or ()),
            "unique": bool(item.get("unique")),
            "expressions": list(item.get("expressions") or ()),
            "dialect_options": dict(sorted((item.get("dialect_options") or {}).items())),
        }
        for item in inspector.get_indexes(table_name, schema=schema)
    ]
    return {
        "primary_key": {
            "name": primary_key.get("name"),
            "columns": list(primary_key.get("constrained_columns") or ()),
        },
        "foreign_keys": sorted(foreign_keys, key=_object_sort_key),
        "unique_constraints": sorted(unique_constraints, key=_object_sort_key),
        "check_constraints": sorted(check_constraints, key=_object_sort_key),
        "indexes": sorted(indexes, key=_object_sort_key),
    }


def _quote_identifier(identifier: str) -> str:
    return '"' + identifier.replace('"', '""') + '"'


def _sqlite_unique_constraints(
    connection: Connection,
    schema: str | None,
    table_name: str,
) -> list[dict[str, Any]]:
    schema_prefix = (
        f"{_quote_identifier(schema)}." if schema is not None else ""
    )
    index_rows = connection.exec_driver_sql(
        f"PRAGMA {schema_prefix}index_list({_quote_identifier(table_name)})"
    ).mappings()
    constraints = []
    for row in index_rows:
        if not row["unique"] or row["origin"] != "u":
            continue
        columns = connection.exec_driver_sql(
            f"PRAGMA {schema_prefix}index_info({_quote_identifier(row['name'])})"
        ).mappings()
        constraints.append(
            {
                "name": row["name"],
                "columns": [column["name"] for column in columns],
            }
        )
    return constraints


def _object_sort_key(value: Mapping[str, Any]) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), default=str)


def _view_manifest(connection: Connection, schema: str | None) -> list[dict[str, Any]]:
    inspector = inspect(connection)
    views = [
        {
            "name": name,
            "definition": _stable_value(inspector.get_view_definition(name, schema=schema)),
        }
        for name in inspector.get_view_names(schema=schema)
    ]
    return sorted(views, key=lambda item: item["name"])


def _materialized_view_manifest(
    connection: Connection,
    schema: str | None,
) -> list[dict[str, Any]]:
    inspector = inspect(connection)
    if connection.dialect.name != "postgresql":
        return []
    materialized_views = [
        {
            "name": name,
            "definition": _stable_value(
                inspector.get_view_definition(name, schema=schema)
            ),
        }
        for name in inspector.get_materialized_view_names(schema=schema)
    ]
    return sorted(materialized_views, key=lambda item: item["name"])


def _sqlite_triggers(connection: Connection) -> list[dict[str, Any]]:
    rows = connection.execute(
        text(
            "SELECT name, tbl_name, sql FROM sqlite_master "
            "WHERE type = 'trigger' AND sql IS NOT NULL "
            "AND name NOT LIKE 'sqlite_%' ORDER BY name"
        )
    ).mappings()
    return [
        {
            "name": row["name"],
            "table": row["tbl_name"],
            "definition": _stable_value(row["sql"]),
        }
        for row in rows
    ]


def _postgres_triggers(
    connection: Connection,
    schema: str,
) -> list[dict[str, Any]]:
    rows = connection.execute(
        text(
            "SELECT n.nspname AS schema_name, c.relname AS table_name, "
            "t.tgname AS name, pg_get_triggerdef(t.oid, true) AS definition "
            "FROM pg_trigger AS t "
            "JOIN pg_class AS c ON c.oid = t.tgrelid "
            "JOIN pg_namespace AS n ON n.oid = c.relnamespace "
            "WHERE NOT t.tgisinternal AND n.nspname = :schema "
            "ORDER BY c.relname, t.tgname"
        ),
        {"schema": schema},
    ).mappings()
    return [
        {
            "schema": row["schema_name"],
            "table": row["table_name"],
            "name": row["name"],
            "definition": _stable_value(row["definition"]),
        }
        for row in rows
    ]


def _postgres_sequences(
    connection: Connection,
    schema: str,
) -> list[dict[str, Any]]:
    rows = connection.execute(
        text(
            "SELECT s.schemaname AS schema_name, s.sequencename AS name, "
            "q.seqtypid::regtype::text AS data_type, q.seqstart AS start_value, "
            "q.seqmin AS min_value, q.seqmax AS max_value, "
            "q.seqincrement AS increment, q.seqcache AS cache, q.seqcycle AS cycle "
            "FROM pg_sequences AS s "
            "JOIN pg_namespace AS n ON n.nspname = s.schemaname "
            "JOIN pg_class AS c ON c.relname = s.sequencename AND c.relnamespace = n.oid "
            "JOIN pg_sequence AS q ON q.seqrelid = c.oid "
            "WHERE s.schemaname = :schema ORDER BY s.sequencename"
        ),
        {"schema": schema},
    ).mappings()
    return [dict(row) for row in rows]


def _engine_properties(connection: Connection) -> dict[str, Any]:
    dialect = connection.dialect.name
    properties: dict[str, Any] = {
        "dialect": dialect,
        "server_version": list(connection.dialect.server_version_info or ()),
        "default_schema": inspect(connection).default_schema_name,
    }
    if dialect == "sqlite":
        properties["sqlite"] = {
            name: _stable_value(connection.exec_driver_sql(f"PRAGMA {name}").scalar())
            for name in (
                "foreign_keys",
                "journal_mode",
                "page_size",
                "user_version",
                "application_id",
                "auto_vacuum",
            )
        }
    elif dialect == "postgresql":
        properties["postgresql"] = {
            "server_version_num": _stable_value(
                connection.exec_driver_sql("SHOW server_version_num").scalar()
            ),
            "standard_conforming_strings": _stable_value(
                connection.exec_driver_sql("SHOW standard_conforming_strings").scalar()
            ),
            "extensions": [
                dict(row)
                for row in connection.execute(
                    text(
                        "SELECT e.extname AS name, e.extversion AS version, "
                        "n.nspname AS schema FROM pg_extension AS e "
                        "JOIN pg_namespace AS n ON n.oid = e.extnamespace "
                        "ORDER BY e.extname"
                    )
                ).mappings()
            ],
        }
    else:
        raise ValueError(f"Unsupported schema-manifest dialect: {dialect!r}")
    return properties


def build_schema_manifest(engine: Engine, schema: str | None = None) -> dict[str, Any]:
    """Inspect schema objects without changing the database."""
    with engine.connect() as connection:
        if connection.dialect.name == "sqlite" and schema not in (None, "main"):
            raise ValueError(
                "SQLite manifest generation supports only the main database schema."
            )
        inspector = inspect(connection)
        table_names = inspector.get_table_names(schema=schema)
        tables = []
        for table_name in sorted(table_names):
            columns = [
                _column_manifest(column)
                for column in inspector.get_columns(table_name, schema=schema)
            ]
            tables.append(
                {
                    "name": table_name,
                    "columns": columns,
                    **_constraint_manifest(connection, schema, table_name),
                }
            )

        dialect = connection.dialect.name
        views = _view_manifest(connection, schema)
        materialized_views = _materialized_view_manifest(connection, schema)
        if dialect == "sqlite":
            triggers = _sqlite_triggers(connection)
            sequences: list[dict[str, Any]] = []
        elif dialect == "postgresql":
            effective_schema = schema or inspector.default_schema_name
            if not effective_schema:
                raise ValueError("PostgreSQL schema inspection requires a schema name.")
            triggers = _postgres_triggers(connection, effective_schema)
            sequences = _postgres_sequences(connection, effective_schema)
        else:
            raise ValueError(f"Unsupported schema-manifest dialect: {dialect!r}")

        manifest: dict[str, Any] = {
            "format_version": MANIFEST_FORMAT_VERSION,
            "engine": _engine_properties(connection),
            "tables": tables,
            "views": views,
            "materialized_views": materialized_views,
            "triggers": triggers,
            "sequences": sequences,
        }
    manifest["sha256"] = manifest_fingerprint(manifest)
    return manifest


def canonical_manifest_json(manifest: Mapping[str, Any]) -> str:
    content = {key: value for key, value in manifest.items() if key != "sha256"}
    return json.dumps(content, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def manifest_fingerprint(manifest: Mapping[str, Any]) -> str:
    return hashlib.sha256(canonical_manifest_json(manifest).encode("utf-8")).hexdigest()


def compare_schema_manifests(
    expected: Mapping[str, Any],
    actual: Mapping[str, Any],
) -> dict[str, Any]:
    differences: list[dict[str, Any]] = []
    for section in ("engine", "format_version"):
        if expected.get(section) != actual.get(section):
            differences.append(
                {
                    "classification": "conflict",
                    "path": section,
                    "expected": expected.get(section),
                    "actual": actual.get(section),
                }
            )

    for section in (
        "tables",
        "views",
        "materialized_views",
        "triggers",
        "sequences",
    ):
        expected_items = _named_objects(expected.get(section, ()))
        actual_items = _named_objects(actual.get(section, ()))
        for name in sorted(expected_items.keys() | actual_items.keys()):
            expected_item = expected_items.get(name)
            actual_item = actual_items.get(name)
            if expected_item is None:
                differences.append(
                    {
                        "classification": "extra",
                        "path": f"{section}.{name}",
                        "expected": None,
                        "actual": actual_item,
                    }
                )
            elif actual_item is None:
                differences.append(
                    {
                        "classification": "missing",
                        "path": f"{section}.{name}",
                        "expected": expected_item,
                        "actual": None,
                    }
                )
            elif expected_item != actual_item:
                differences.append(
                    {
                        "classification": "conflict",
                        "path": f"{section}.{name}",
                        "expected": expected_item,
                        "actual": actual_item,
                    }
                )

    differences.sort(key=lambda item: (item["path"], item["classification"]))
    return {"compatible": not differences, "differences": differences}


def _named_objects(items: Any) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for item in items:
        name = item.get("name")
        key = str(name) if name is not None else _object_sort_key(item)
        result[key] = item
    return result
