from __future__ import annotations

import hashlib
import json
from collections.abc import Mapping
from typing import Any

from sqlalchemy import Connection, Engine, inspect, text


MANIFEST_FORMAT_VERSION = 2
MANIFEST_LIST_SECTIONS = (
    "tables",
    "views",
    "materialized_views",
    "materialized_view_indexes",
    "triggers",
    "sequences",
    "types",
    "routines",
    "policies",
    "row_security",
    "partitioned_tables",
    "partitions",
    "schema_ownership",
    "object_ownership",
    "privileges",
    "default_privileges",
    "cross_schema_foreign_keys",
)


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
            "options": {
                key: _stable_value(value)
                for key, value in item.items()
                if key not in {"name", "column_names"}
            },
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
            "SELECT n.nspname AS schema_name, c.relname AS name, "
            "q.seqtypid::regtype::text AS data_type, q.seqstart AS start_value, "
            "q.seqmin AS min_value, q.seqmax AS max_value, "
            "q.seqincrement AS increment, q.seqcache AS cache, q.seqcycle AS cycle, "
            "owner_table.relname AS owned_by_table, owner_column.attname AS owned_by_column, "
            "pg_get_userbyid(c.relowner) AS owner "
            "FROM pg_class AS c "
            "JOIN pg_namespace AS n ON n.oid = c.relnamespace "
            "JOIN pg_sequence AS q ON q.seqrelid = c.oid "
            "LEFT JOIN pg_depend AS d ON d.classid = 'pg_class'::regclass "
            "AND d.objid = c.oid AND d.refclassid = 'pg_class'::regclass "
            "AND d.deptype IN ('a', 'i') "
            "LEFT JOIN pg_class AS owner_table ON owner_table.oid = d.refobjid "
            "LEFT JOIN pg_attribute AS owner_column ON owner_column.attrelid = d.refobjid "
            "AND owner_column.attnum = d.refobjsubid "
            "WHERE n.nspname = :schema AND c.relkind = 'S' ORDER BY c.relname"
        ),
        {"schema": schema},
    ).mappings()
    return [dict(row) for row in rows]


def _postgres_types(
    connection: Connection,
    schema: str,
) -> list[dict[str, Any]]:
    rows = connection.execute(
        text(
            "SELECT t.typname AS name, t.typtype AS kind, "
            "CASE WHEN t.typtype = 'd' "
            "THEN pg_catalog.format_type(t.typbasetype, NULL) END AS base_type, "
            "CASE WHEN t.typtype = 'd' THEN t.typnotnull END AS domain_not_null, "
            "CASE WHEN t.typtype = 'd' THEN t.typdefault END AS domain_default, "
            "COALESCE((SELECT array_agg(e.enumlabel ORDER BY e.enumsortorder) "
            "FROM pg_enum AS e WHERE e.enumtypid = t.oid), ARRAY[]::text[]) "
            "AS enum_labels, "
            "COALESCE((SELECT array_agg(pg_get_constraintdef(c.oid, true) "
            "ORDER BY c.conname) FROM pg_constraint AS c WHERE c.contypid = t.oid), "
            "ARRAY[]::text[]) AS domain_constraints, "
            "COALESCE((SELECT array_agg(a.attname || ':' || "
            "pg_catalog.format_type(a.atttypid, a.atttypmod) || ':' || "
            "a.attnotnull::text ORDER BY a.attnum) "
            "FROM pg_attribute AS a WHERE a.attrelid = t.typrelid "
            "AND a.attnum > 0 AND NOT a.attisdropped), ARRAY[]::text[]) "
            "AS composite_attributes, "
            "CASE WHEN r.rngtypid = t.oid OR r.rngmultitypid = t.oid "
            "THEN r.rngsubtype::regtype::text END AS range_subtype, "
            "CASE WHEN t.typtype = 'b' THEN t.typcategory END AS category, "
            "CASE WHEN t.typtype = 'b' THEN t.typalign END AS alignment, "
            "CASE WHEN t.typtype = 'b' THEN t.typstorage END AS storage, "
            "CASE WHEN t.typtype = 'b' THEN t.typinput::regproc::text END AS input_routine, "
            "CASE WHEN t.typtype = 'b' THEN t.typoutput::regproc::text END AS output_routine, "
            "CASE WHEN t.typtype = 'b' THEN pg_get_userbyid(t.typowner) END AS owner "
            "FROM pg_type AS t "
            "JOIN pg_namespace AS n ON n.oid = t.typnamespace "
            "LEFT JOIN pg_class AS type_relation ON type_relation.oid = t.typrelid "
            "LEFT JOIN pg_range AS r ON r.rngtypid = t.oid OR r.rngmultitypid = t.oid "
            "WHERE n.nspname = :schema AND t.typtype IN ('b', 'e', 'd', 'c', 'r', 'm') "
            "AND (t.typtype <> 'b' OR t.typelem = 0) "
            "AND (t.typtype <> 'c' OR type_relation.relkind = 'c') "
            "ORDER BY t.typname"
        ),
        {"schema": schema},
    ).mappings()
    return [dict(row) for row in rows]


def _postgres_routines(
    connection: Connection,
    schema: str,
) -> list[dict[str, Any]]:
    rows = connection.execute(
        text(
            "SELECT p.proname AS name, "
            "pg_get_function_identity_arguments(p.oid) AS identity_arguments, "
            "pg_get_function_result(p.oid) AS result, "
            "pg_get_functiondef(p.oid) AS definition, "
            "l.lanname AS language, p.prokind AS kind, "
            "p.provolatile AS volatility, p.proisstrict AS strict, "
            "p.prosecdef AS security_definer, p.proparallel AS parallel, "
            "p.proconfig AS configuration, pg_get_userbyid(p.proowner) AS owner "
            "FROM pg_proc AS p "
            "JOIN pg_namespace AS n ON n.oid = p.pronamespace "
            "JOIN pg_language AS l ON l.oid = p.prolang "
            "WHERE n.nspname = :schema AND p.prokind IN ('f', 'p') "
            "ORDER BY p.proname, pg_get_function_identity_arguments(p.oid)"
        ),
        {"schema": schema},
    ).mappings()
    routines = []
    for row in rows:
        item = dict(row)
        item["name"] = f"{item['name']}({item['identity_arguments']})"
        routines.append(item)
    return routines


def _postgres_policies(
    connection: Connection,
    schema: str,
) -> list[dict[str, Any]]:
    rows = connection.execute(
        text(
            "SELECT schemaname AS schema, tablename AS table_name, policyname AS name, "
            "permissive, roles, cmd AS command, qual AS using_expression, "
            "with_check AS check_expression "
            "FROM pg_policies WHERE schemaname = :schema "
            "ORDER BY tablename, policyname"
        ),
        {"schema": schema},
    ).mappings()
    policies = []
    for row in rows:
        item = dict(row)
        item["roles"] = sorted(item["roles"])
        item["name"] = f"{item['table_name']}.{item['name']}"
        policies.append(item)
    return policies


def _postgres_partitions(
    connection: Connection,
    schema: str,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    partitioned_tables = connection.execute(
        text(
            "SELECT c.relname AS name, pg_get_partkeydef(c.oid) AS partition_key, "
            "pg_get_userbyid(c.relowner) AS owner "
            "FROM pg_partitioned_table AS p "
            "JOIN pg_class AS c ON c.oid = p.partrelid "
            "JOIN pg_namespace AS n ON n.oid = c.relnamespace "
            "WHERE n.nspname = :schema ORDER BY c.relname"
        ),
        {"schema": schema},
    ).mappings()
    partition_members = connection.execute(
        text(
            "SELECT parent_schema.nspname AS parent_schema, "
            "child_schema.nspname AS schema, parent.relname AS parent, "
            "child.relname AS name, "
            "pg_get_expr(child.relpartbound, child.oid, true) AS bound "
            "FROM pg_inherits AS i "
            "JOIN pg_class AS parent ON parent.oid = i.inhparent "
            "JOIN pg_class AS child ON child.oid = i.inhrelid "
            "JOIN pg_namespace AS parent_schema ON parent_schema.oid = parent.relnamespace "
            "JOIN pg_namespace AS child_schema ON child_schema.oid = child.relnamespace "
            "WHERE parent_schema.nspname = :schema AND parent.relkind = 'p' "
            "ORDER BY parent.relname, child_schema.nspname, child.relname"
        ),
        {"schema": schema},
    ).mappings()
    return (
        [dict(row) for row in partitioned_tables],
        [dict(row) for row in partition_members],
    )


def _postgres_row_security(
    connection: Connection,
    schema: str,
) -> list[dict[str, Any]]:
    rows = connection.execute(
        text(
            "SELECT c.relname AS table_name, c.relrowsecurity AS enabled, "
            "c.relforcerowsecurity AS forced "
            "FROM pg_class AS c "
            "JOIN pg_namespace AS n ON n.oid = c.relnamespace "
            "WHERE n.nspname = :schema AND c.relkind IN ('r', 'p') "
            "AND (c.relrowsecurity OR c.relforcerowsecurity) "
            "ORDER BY c.relname"
        ),
        {"schema": schema},
    ).mappings()
    return [
        {
            "name": row["table_name"],
            "enabled": row["enabled"],
            "forced": row["forced"],
        }
        for row in rows
    ]


def _postgres_materialized_view_indexes(
    connection: Connection,
    schema: str,
) -> list[dict[str, Any]]:
    rows = connection.execute(
        text(
            "SELECT view.relname AS view_name, idx_class.relname AS name, "
            "pg_get_indexdef(idx_class.oid) AS definition, "
            "metadata.indisunique AS is_unique, metadata.indisprimary AS is_primary, "
            "metadata.indisvalid AS valid, metadata.indisready AS ready "
            "FROM pg_index AS metadata "
            "JOIN pg_class AS view ON view.oid = metadata.indrelid "
            "JOIN pg_class AS idx_class ON idx_class.oid = metadata.indexrelid "
            "JOIN pg_namespace AS n ON n.oid = view.relnamespace "
            "WHERE n.nspname = :schema AND view.relkind = 'm' "
            "ORDER BY view.relname, idx_class.relname"
        ),
        {"schema": schema},
    ).mappings()
    return [
        {
            **dict(row),
            "name": f"{row['view_name']}.{row['name']}",
        }
        for row in rows
    ]


def _postgres_cross_schema_foreign_keys(
    connection: Connection,
    schema: str,
) -> list[dict[str, Any]]:
    rows = connection.execute(
        text(
            "SELECT source.relname AS source_table, con.conname AS constraint_name, "
            "target_schema.nspname AS referred_schema, target.relname AS referred_table, "
            "pg_get_constraintdef(con.oid, true) AS definition, "
            "con.condeferrable AS deferrable, "
            "con.condeferred AS initially_deferred, "
            "con.convalidated AS validated "
            "FROM pg_constraint AS con "
            "JOIN pg_class AS source ON source.oid = con.conrelid "
            "JOIN pg_namespace AS source_schema ON source_schema.oid = source.relnamespace "
            "JOIN pg_class AS target ON target.oid = con.confrelid "
            "JOIN pg_namespace AS target_schema ON target_schema.oid = target.relnamespace "
            "WHERE con.contype = 'f' AND source_schema.nspname = :schema "
            "AND target_schema.nspname <> :schema "
            "ORDER BY source.relname, con.conname"
        ),
        {"schema": schema},
    ).mappings()
    return [
        {
            **dict(row),
            "name": f"{row['source_table']}.{row['constraint_name']}",
        }
        for row in rows
    ]


def _postgres_ownership(
    connection: Connection,
    schema: str,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    schema_rows = connection.execute(
        text(
            "SELECT n.nspname AS name, pg_get_userbyid(n.nspowner) AS owner "
            "FROM pg_namespace AS n WHERE n.nspname = :schema"
        ),
        {"schema": schema},
    ).mappings()
    object_rows = connection.execute(
        text(
            "SELECT c.relkind::text AS kind, c.relname AS name, "
            "pg_get_userbyid(c.relowner) AS owner "
            "FROM pg_class AS c "
            "JOIN pg_namespace AS n ON n.oid = c.relnamespace "
            "WHERE n.nspname = :schema AND c.relkind IN "
            "('r', 'p', 'v', 'm', 'S', 'f', 'i', 'I') "
            "UNION ALL "
            "SELECT CASE WHEN p.prokind = 'p' THEN 'procedure' ELSE 'function' END "
            "AS kind, p.proname || '(' || "
            "pg_get_function_identity_arguments(p.oid) || ')' AS name, "
            "pg_get_userbyid(p.proowner) AS owner "
            "FROM pg_proc AS p JOIN pg_namespace AS n ON n.oid = p.pronamespace "
            "WHERE n.nspname = :schema AND p.prokind IN ('f', 'p') "
            "UNION ALL "
            "SELECT 'type' AS kind, t.typname AS name, "
            "pg_get_userbyid(t.typowner) AS owner "
            "FROM pg_type AS t JOIN pg_namespace AS n ON n.oid = t.typnamespace "
            "WHERE n.nspname = :schema AND t.typtype IN ('b', 'e', 'd', 'c', 'r', 'm') "
            "AND (t.typtype <> 'b' OR t.typelem = 0) "
            "AND (t.typtype <> 'c' OR NOT EXISTS ("
            "SELECT 1 FROM pg_class AS type_relation "
            "WHERE type_relation.oid = t.typrelid AND type_relation.relkind <> 'c')) "
            "ORDER BY kind, name"
        ),
        {"schema": schema},
    ).mappings()
    return (
        [dict(row) for row in schema_rows],
        [dict(row) for row in object_rows],
    )


def _postgres_privileges(
    connection: Connection,
    schema: str,
) -> list[dict[str, Any]]:
    rows = connection.execute(
        text(
            "SELECT object_kind, object_name, grantee, grantor, privilege_type, "
            "is_grantable FROM ("
            "SELECT 'schema'::text AS object_kind, n.nspname AS object_name, "
            "CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END "
            "AS grantee, pg_get_userbyid(a.grantor) AS grantor, "
            "a.privilege_type, a.is_grantable "
            "FROM pg_namespace AS n "
            "CROSS JOIN LATERAL aclexplode("
            "COALESCE(n.nspacl, acldefault('n'::\"char\", n.nspowner))) AS a "
            "WHERE n.nspname = :schema "
            "UNION ALL "
            "SELECT CASE c.relkind WHEN 'S' THEN 'sequence' ELSE 'relation' END, "
            "c.relname, "
            "CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END, "
            "pg_get_userbyid(a.grantor), a.privilege_type, a.is_grantable "
            "FROM pg_class AS c "
            "JOIN pg_namespace AS n ON n.oid = c.relnamespace "
            "CROSS JOIN LATERAL aclexplode(COALESCE(c.relacl, "
            "acldefault(CASE WHEN c.relkind = 'S' THEN 'S'::\"char\" "
            "ELSE 'r'::\"char\" END, "
            "c.relowner))) AS a "
            "WHERE n.nspname = :schema "
            "UNION ALL "
            "SELECT 'column', c.relname || '.' || a.attname, "
            "CASE WHEN acl.grantee = 0 THEN 'PUBLIC' "
            "ELSE pg_get_userbyid(acl.grantee) END, "
            "pg_get_userbyid(acl.grantor), acl.privilege_type, acl.is_grantable "
            "FROM pg_attribute AS a "
            "JOIN pg_class AS c ON c.oid = a.attrelid "
            "JOIN pg_namespace AS n ON n.oid = c.relnamespace "
            "CROSS JOIN LATERAL aclexplode(a.attacl) AS acl "
            "WHERE n.nspname = :schema AND a.attnum > 0 "
            "AND NOT a.attisdropped AND a.attacl IS NOT NULL "
            "UNION ALL "
            "SELECT 'routine', p.proname || '(' || "
            "pg_get_function_identity_arguments(p.oid) || ')', "
            "CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END, "
            "pg_get_userbyid(a.grantor), a.privilege_type, a.is_grantable "
            "FROM pg_proc AS p "
            "JOIN pg_namespace AS n ON n.oid = p.pronamespace "
            "CROSS JOIN LATERAL aclexplode("
            "COALESCE(p.proacl, acldefault('f'::\"char\", p.proowner))) AS a "
            "WHERE n.nspname = :schema "
            "UNION ALL "
            "SELECT 'type', t.typname, "
            "CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END, "
            "pg_get_userbyid(a.grantor), a.privilege_type, a.is_grantable "
            "FROM pg_type AS t "
            "JOIN pg_namespace AS n ON n.oid = t.typnamespace "
            "CROSS JOIN LATERAL aclexplode("
            "COALESCE(t.typacl, acldefault('T'::\"char\", t.typowner))) AS a "
            "WHERE n.nspname = :schema"
            ") AS privileges "
            "ORDER BY object_kind, object_name, grantee, privilege_type, grantor"
        ),
        {"schema": schema},
    ).mappings()
    privileges = []
    for row in rows:
        item = dict(row)
        item["name"] = ".".join(
            (
                item["object_kind"],
                item["object_name"],
                item["grantee"],
                item["privilege_type"],
                item["grantor"],
            )
        )
        privileges.append(item)
    return privileges


def _postgres_default_privileges(
    connection: Connection,
    schema: str,
) -> list[dict[str, Any]]:
    rows = connection.execute(
        text(
            "SELECT CASE d.defaclobjtype "
            "WHEN 'r' THEN 'relation' WHEN 'S' THEN 'sequence' "
            "WHEN 'f' THEN 'routine' WHEN 'T' THEN 'type' "
            "WHEN 'n' THEN 'schema' ELSE d.defaclobjtype::text END AS object_kind, "
            "COALESCE(n.nspname, '*') AS schema, "
            "pg_get_userbyid(d.defaclrole) AS owner, "
            "CASE WHEN acl.grantee = 0 THEN 'PUBLIC' "
            "ELSE pg_get_userbyid(acl.grantee) END AS grantee, "
            "pg_get_userbyid(acl.grantor) AS grantor, acl.privilege_type, "
            "acl.is_grantable "
            "FROM pg_default_acl AS d "
            "LEFT JOIN pg_namespace AS n ON n.oid = d.defaclnamespace "
            "CROSS JOIN LATERAL aclexplode(d.defaclacl) AS acl "
            "WHERE d.defaclnamespace = 0 OR n.nspname = :schema "
            "ORDER BY object_kind, schema, owner, grantee, privilege_type, grantor"
        ),
        {"schema": schema},
    ).mappings()
    result = []
    for row in rows:
        item = dict(row)
        item["name"] = ".".join(
            (
                item["object_kind"],
                item["schema"],
                item["owner"],
                item["grantee"],
                item["privilege_type"],
                item["grantor"],
            )
        )
        result.append(item)
    return result


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
                        "available.default_version AS default_version, "
                        "e.extrelocatable AS relocatable, "
                        "n.nspname AS schema FROM pg_extension AS e "
                        "JOIN pg_namespace AS n ON n.oid = e.extnamespace "
                        "LEFT JOIN pg_available_extensions AS available "
                        "ON available.name = e.extname "
                        "ORDER BY e.extname"
                    )
                ).mappings()
            ],
        }
    else:
        raise ValueError(f"Unsupported schema-manifest dialect: {dialect!r}")
    return properties


def build_schema_manifest(
    engine: Engine | Connection,
    schema: str | None = None,
) -> dict[str, Any]:
    """Inspect schema objects without changing the database."""
    if isinstance(engine, Connection):
        return _build_schema_manifest(engine, schema)
    with engine.connect() as connection:
        return _build_schema_manifest(connection, schema)


def _build_schema_manifest(
    connection: Connection,
    schema: str | None,
) -> dict[str, Any]:
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
        types: list[dict[str, Any]] = []
        routines: list[dict[str, Any]] = []
        policies: list[dict[str, Any]] = []
        partitioned_tables: list[dict[str, Any]] = []
        partitions: list[dict[str, Any]] = []
        materialized_view_indexes: list[dict[str, Any]] = []
        row_security: list[dict[str, Any]] = []
        schema_ownership: list[dict[str, Any]] = []
        object_ownership: list[dict[str, Any]] = []
        privileges: list[dict[str, Any]] = []
        default_privileges: list[dict[str, Any]] = []
        cross_schema_foreign_keys: list[dict[str, Any]] = []
    elif dialect == "postgresql":
        effective_schema = schema or inspector.default_schema_name
        if not effective_schema:
            raise ValueError("PostgreSQL schema inspection requires a schema name.")
        triggers = _postgres_triggers(connection, effective_schema)
        sequences = _postgres_sequences(connection, effective_schema)
        types = _postgres_types(connection, effective_schema)
        routines = _postgres_routines(connection, effective_schema)
        policies = _postgres_policies(connection, effective_schema)
        row_security = _postgres_row_security(connection, effective_schema)
        partitioned_tables, partitions = _postgres_partitions(
            connection,
            effective_schema,
        )
        materialized_view_indexes = _postgres_materialized_view_indexes(
            connection,
            effective_schema,
        )
        schema_ownership, object_ownership = _postgres_ownership(
            connection,
            effective_schema,
        )
        privileges = _postgres_privileges(connection, effective_schema)
        default_privileges = _postgres_default_privileges(
            connection,
            effective_schema,
        )
        cross_schema_foreign_keys = _postgres_cross_schema_foreign_keys(
            connection,
            effective_schema,
        )
    else:
        raise ValueError(f"Unsupported schema-manifest dialect: {dialect!r}")

    manifest: dict[str, Any] = {
        "format_version": MANIFEST_FORMAT_VERSION,
        "engine": _engine_properties(connection),
        "schema": schema or inspector.default_schema_name,
        "tables": tables,
        "views": views,
        "materialized_views": materialized_views,
        "materialized_view_indexes": materialized_view_indexes,
        "triggers": triggers,
        "sequences": sequences,
        "types": types,
        "routines": routines,
        "policies": policies,
        "row_security": row_security,
        "partitioned_tables": partitioned_tables,
        "partitions": partitions,
        "schema_ownership": schema_ownership,
        "object_ownership": object_ownership,
        "privileges": privileges,
        "default_privileges": default_privileges,
        "cross_schema_foreign_keys": cross_schema_foreign_keys,
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
    top_level_sections = {
        "format_version",
        "engine",
        "schema",
        *MANIFEST_LIST_SECTIONS,
        "sha256",
    }
    for label, manifest in (("expected", expected), ("actual", actual)):
        if manifest.get("format_version") != MANIFEST_FORMAT_VERSION:
            differences.append(
                {
                    "classification": "conflict",
                    "path": f"{label}.format_version",
                    "expected": MANIFEST_FORMAT_VERSION,
                    "actual": manifest.get("format_version"),
                }
            )
        for section in top_level_sections - {"format_version", "sha256"}:
            if section not in manifest:
                differences.append(
                    {
                        "classification": "conflict",
                        "path": f"{label}.{section}",
                        "expected": "required manifest section",
                        "actual": None,
                    }
                )
        for section in set(manifest) - top_level_sections:
            differences.append(
                {
                    "classification": "conflict",
                    "path": f"{label}.{section}",
                    "expected": "known manifest section",
                    "actual": "unsupported manifest section",
                }
            )
        if not isinstance(manifest.get("engine"), Mapping):
            differences.append(
                {
                    "classification": "conflict",
                    "path": f"{label}.engine",
                    "expected": "engine mapping",
                    "actual": manifest.get("engine"),
                }
            )
        for section in MANIFEST_LIST_SECTIONS:
            if section in manifest and not isinstance(manifest[section], list):
                differences.append(
                    {
                        "classification": "conflict",
                        "path": f"{label}.{section}",
                        "expected": "list",
                        "actual": type(manifest[section]).__name__,
                    }
                )
    for section in ("engine", "schema", "format_version"):
        if expected.get(section) != actual.get(section):
            differences.append(
                {
                    "classification": "conflict",
                    "path": section,
                    "expected": expected.get(section),
                    "actual": actual.get(section),
                }
            )

    for section in MANIFEST_LIST_SECTIONS:
        expected_items = _named_objects(expected.get(section, []))
        actual_items = _named_objects(actual.get(section, []))
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
        if not isinstance(item, Mapping):
            raise ValueError("Schema manifest object entries must be mappings.")
        name = item.get("name")
        if name is None:
            key = _object_sort_key(item)
        elif item.get("schema"):
            key = f"{item['schema']}.{name}"
        else:
            key = str(name)
        if key in result:
            raise ValueError(f"Schema manifest contains duplicate object key {key!r}.")
        result[key] = item
    return result
