from __future__ import annotations

import hashlib
import json
from collections.abc import Callable, Mapping
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from alembic.config import Config
from alembic.script import ScriptDirectory
from alembic.util.exc import CommandError
from sqlalchemy import Connection, inspect, text
from app.database.migration_infrastructure.migration_coordinator import (
    PostgreSQLMigrationOwnership,
)
from app.database.migration_infrastructure.schema_manifest import (
    build_schema_manifest,
    compare_schema_manifests,
    manifest_fingerprint,
)

CURRENT_TARGET_REVISION = "d1f5a8e7c2b4"


class CompatibilityHarnessError(RuntimeError):
    """Raised when a schema profile or database is not explicitly supported."""


@dataclass(frozen=True)
class VerifiedSchemaProfile:
    profile_id: str
    fixture_id: str
    supported_starting_revision: str
    target_revision: str
    server_version: str
    schema_name: str
    source_manifest: Mapping[str, Any]
    target_manifest: Mapping[str, Any]
    preservation_tables: tuple[str, ...]


@dataclass(frozen=True)
class PreservationSnapshot:
    database_identity: tuple[str, int, str, str]
    server_version: str
    revision: str
    schema_manifest: Mapping[str, Any]
    row_counts: Mapping[str, int]
    record_checksums: Mapping[str, str]


def load_verified_profile(
    path: Path,
    *,
    expected_profile_sha256: str,
) -> VerifiedSchemaProfile:
    """Load a reviewed profile only when its digest is supplied out of band."""
    try:
        raw = path.read_bytes()
    except OSError as error:
        raise CompatibilityHarnessError("Could not read the schema profile.") from error
    actual_profile_sha256 = hashlib.sha256(raw).hexdigest()
    if (
        len(expected_profile_sha256) != 64
        or actual_profile_sha256 != expected_profile_sha256.lower()
    ):
        raise CompatibilityHarnessError(
            "Schema profile digest does not match the operator-approved digest."
        )
    try:
        document = json.loads(raw)
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise CompatibilityHarnessError("Schema profile is not valid JSON.") from error
    if not isinstance(document, dict) or document.get("format_version") != 1:
        raise CompatibilityHarnessError("Unsupported schema profile format.")
    if document.get("synthetic_data_only") is not True:
        raise CompatibilityHarnessError(
            "Compatibility tests require a profile explicitly limited to synthetic data."
        )
    if not document.get("review_evidence_id") or not document.get("profile_id"):
        raise CompatibilityHarnessError(
            "Schema profile requires an operator review evidence ID and profile ID."
        )

    source_manifest = document.get("source_manifest")
    target_manifest = document.get("target_manifest")
    if not isinstance(source_manifest, dict) or not isinstance(target_manifest, dict):
        raise CompatibilityHarnessError(
            "Schema profile must include source and target schema manifests."
        )
    for label, manifest in (
        ("source", source_manifest),
        ("target", target_manifest),
    ):
        recorded_fingerprint = document.get(f"{label}_manifest_sha256")
        if (
            not isinstance(recorded_fingerprint, str)
            or manifest_fingerprint(manifest) != recorded_fingerprint.lower()
        ):
            raise CompatibilityHarnessError(
                f"The {label} schema manifest fingerprint is missing or invalid."
            )
        engine = manifest.get("engine")
        if not isinstance(engine, dict) or engine.get("dialect") != "postgresql":
            raise CompatibilityHarnessError(
                f"The {label} schema manifest must target PostgreSQL."
            )

    source_revision = document.get("supported_starting_revision")
    target_revision = document.get("target_revision")
    server_version = document.get("server_version")
    schema_name = document.get("schema_name")
    fixture_id = document.get("fixture_id")
    preservation_tables = document.get("preservation_tables")
    if not all(
        isinstance(value, str) and value.strip()
        for value in (
            source_revision,
            target_revision,
            server_version,
            schema_name,
            fixture_id,
        )
    ):
        raise CompatibilityHarnessError(
            "Schema profile is missing its revision, server, schema, or fixture identity."
        )
    if target_revision != CURRENT_TARGET_REVISION:
        raise CompatibilityHarnessError(
            f"Schema profile target must be {CURRENT_TARGET_REVISION}."
        )
    script = ScriptDirectory.from_config(
        Config(str(Path(__file__).resolve().parents[2] / "alembic.ini"))
    )
    if script.get_current_head() != target_revision:
        raise CompatibilityHarnessError(
            "Schema profile target is not the current single Alembic head."
        )
    try:
        source_revision_object = script.get_revision(source_revision)
    except CommandError as error:
        raise CompatibilityHarnessError(
            "Schema profile starting revision is not present in the repository graph."
        ) from error
    if source_revision_object is None:
        raise CompatibilityHarnessError(
            "Schema profile starting revision is not present in the repository graph."
        )
    target_ancestors = {
        revision.revision
        for revision in script.iterate_revisions(target_revision, "base")
    }
    if source_revision not in target_ancestors:
        raise CompatibilityHarnessError(
            "Schema profile starting revision is not an ancestor of the target head."
        )
    for label, manifest in (
        ("source", source_manifest),
        ("target", target_manifest),
    ):
        engine = manifest["engine"]
        version = engine.get("server_version")
        default_schema = engine.get("default_schema")
        if (
            not isinstance(version, list)
            or len(version) < 2
            or f"{version[0]}.{version[1]}" != server_version
            or default_schema != schema_name
        ):
            raise CompatibilityHarnessError(
                f"The {label} manifest does not match the profile server and schema."
            )
    if not isinstance(preservation_tables, list) or not preservation_tables:
        raise CompatibilityHarnessError(
            "Schema profile must list tables whose synthetic records are preserved."
        )

    source_table_items = source_manifest.get("tables")
    if not isinstance(source_table_items, list) or not all(
        isinstance(table, dict) for table in source_table_items
    ):
        raise CompatibilityHarnessError(
            "Source manifest must contain a structured tables inventory."
        )
    source_tables = {table.get("name"): table for table in source_table_items}
    if len(set(preservation_tables)) != len(preservation_tables):
        raise CompatibilityHarnessError(
            "Preservation table names must be unique."
        )
    if any(
        not isinstance(table_name, str) or table_name not in source_tables
        for table_name in preservation_tables
    ):
        raise CompatibilityHarnessError(
            "Preservation tables must exist in the reviewed source manifest."
        )
    for table_name in preservation_tables:
        primary_key = source_tables[table_name].get("primary_key", {}).get("columns", [])
        if not primary_key:
            raise CompatibilityHarnessError(
                f"Preservation table {table_name!r} must have a primary key."
            )

    return VerifiedSchemaProfile(
        profile_id=document["profile_id"],
        fixture_id=fixture_id,
        supported_starting_revision=source_revision,
        target_revision=target_revision,
        server_version=server_version,
        schema_name=schema_name,
        source_manifest=source_manifest,
        target_manifest=target_manifest,
        preservation_tables=tuple(sorted(preservation_tables)),
    )


def run_existing_schema_upgrade(
    ownership: PostgreSQLMigrationOwnership,
    profile: VerifiedSchemaProfile,
    upgrade: Callable[[Connection], None],
) -> tuple[PreservationSnapshot, PreservationSnapshot]:
    """Run a caller-supplied coordinated upgrade and fail closed on any drift."""
    connection = ownership.connection
    if not ownership.is_active:
        raise CompatibilityHarnessError("PostgreSQL migration ownership is inactive.")
    ownership.assert_connection(connection)
    database_identity, server_version = _verify_database_identity(
        connection,
        profile,
    )
    before = _capture_snapshot(
        connection,
        profile,
        database_identity,
        server_version,
    )

    source_comparison = compare_schema_manifests(
        profile.source_manifest,
        before.schema_manifest,
    )
    if not source_comparison["compatible"]:
        raise CompatibilityHarnessError(
            "Disposable database does not match the reviewed historical source manifest: "
            + _format_schema_differences(source_comparison)
        )
    if before.revision != profile.supported_starting_revision:
        raise CompatibilityHarnessError(
            "Database revision does not match the explicitly supported starting revision."
        )
    if database_identity != ownership.database_identity:
        raise CompatibilityHarnessError(
            "Inspected PostgreSQL identity differs from the active ownership lease."
        )

    connection.commit()
    upgrade(connection)
    ownership.assert_connection(connection)
    after_identity, after_server_version = _verify_database_identity(
        connection,
        profile,
    )
    after = _capture_snapshot(
        connection,
        profile,
        after_identity,
        after_server_version,
    )
    if after_identity != ownership.database_identity:
        raise CompatibilityHarnessError(
            "Post-migration PostgreSQL identity differs from the active ownership lease."
        )
    target_comparison = compare_schema_manifests(
        profile.target_manifest,
        after.schema_manifest,
    )
    if not target_comparison["compatible"]:
        raise CompatibilityHarnessError(
            "Post-migration schema differs from the reviewed target manifest: "
            + _format_schema_differences(target_comparison)
        )
    if after.revision != profile.target_revision:
        raise CompatibilityHarnessError(
            "Migration did not reach the explicitly reviewed target revision."
        )
    if before.row_counts != after.row_counts:
        changed_counts = [
            f"{table}: {before.row_counts.get(table)} -> {after.row_counts.get(table)}"
            for table in sorted(before.row_counts.keys() | after.row_counts.keys())
            if before.row_counts.get(table) != after.row_counts.get(table)
        ]
        raise CompatibilityHarnessError(
            "Migration changed row counts in preservation tables: "
            + ", ".join(changed_counts)
        )
    if before.record_checksums != after.record_checksums:
        changed_tables = sorted(
            table
            for table in before.record_checksums.keys() | after.record_checksums.keys()
            if before.record_checksums.get(table) != after.record_checksums.get(table)
        )
        raise CompatibilityHarnessError(
            "Migration changed records in preservation tables: "
            + ", ".join(changed_tables)
        )
    return before, after


def _verify_database_identity(
    connection: Connection,
    profile: VerifiedSchemaProfile,
) -> tuple[tuple[str, int, str, str], str]:
    url = connection.engine.url
    if url.get_backend_name() != "postgresql":
        raise CompatibilityHarnessError("Compatibility tests require PostgreSQL.")
    host = (url.host or "").strip("[]").lower()
    if host not in {"127.0.0.1", "localhost", "::1"}:
        raise CompatibilityHarnessError(
            "Compatibility tests require a loopback PostgreSQL host."
        )
    if not (url.database or "").startswith("qubira_test_"):
        raise CompatibilityHarnessError(
            "Compatibility tests require a uniquely named qubira_test_ database."
        )

    identity_row = connection.execute(
        text(
            "SELECT current_database(), current_user, host(inet_server_addr()), "
            "current_setting('server_version'), current_setting('server_version_num'), "
            "current_setting('data_directory')"
        )
    ).one()
    database, user, server_address, server_version, version_num, _data_directory = (
        identity_row
    )
    server_host = (server_address or "").strip("[]").lower()
    expected_host = host
    if (
        database != url.database
        or user != url.username
        or server_host not in {"127.0.0.1", "::1"}
        or expected_host not in {"127.0.0.1", "localhost", "::1"}
        or str(url.port or 5432) != str(
            connection.execute(text("SELECT inet_server_port()")).scalar_one()
        )
        or server_version != profile.server_version
        or not version_num.startswith("18")
    ):
        raise CompatibilityHarnessError(
            "Connected PostgreSQL identity differs from the approved disposable target."
        )
    return (
        (
            expected_host,
            int(url.port or 5432),
            database,
            user,
        ),
        server_version,
    )


def _read_revision(connection: Connection, schema_name: str) -> str:
    inspector = inspect(connection)
    if "alembic_version" not in inspector.get_table_names(schema=schema_name):
        raise CompatibilityHarnessError(
            "Database has no Alembic revision table; no history will be inferred."
        )
    preparer = connection.dialect.identifier_preparer
    revision_table = (
        f"{preparer.quote_schema(schema_name)}."
        f"{preparer.quote('alembic_version')}"
    )
    rows = connection.execute(
        text(f"SELECT version_num FROM {revision_table}")
    ).scalars().all()
    if len(rows) != 1 or not rows[0]:
        raise CompatibilityHarnessError(
            "Database must have exactly one known Alembic revision."
        )
    return str(rows[0])


def _capture_snapshot(
    connection: Connection,
    profile: VerifiedSchemaProfile,
    database_identity: tuple[str, int, str, str],
    server_version: str,
) -> PreservationSnapshot:
    manifest = build_schema_manifest(connection, schema=profile.schema_name)
    table_definitions = {
        table["name"]: table for table in manifest.get("tables", ())
    }
    row_counts: dict[str, int] = {}
    record_checksums: dict[str, str] = {}
    preparer = connection.dialect.identifier_preparer
    quoted_schema = preparer.quote_schema(profile.schema_name)

    for table_name in profile.preservation_tables:
        table_definition = table_definitions.get(table_name)
        if table_definition is None:
            raise CompatibilityHarnessError(
                f"Preservation table {table_name!r} is missing."
            )
        primary_key = table_definition.get("primary_key", {}).get("columns", [])
        if not primary_key:
            raise CompatibilityHarnessError(
                f"Preservation table {table_name!r} has no primary key."
            )
        quoted_table = preparer.quote(table_name)
        ordering = ", ".join(preparer.quote(column) for column in primary_key)
        rows = connection.exec_driver_sql(
            f"SELECT * FROM {quoted_schema}.{quoted_table} ORDER BY {ordering}"
        ).mappings()
        digest = hashlib.sha256()
        row_count = 0
        for row in rows:
            canonical_row = json.dumps(
                list(row.values()),
                sort_keys=True,
                separators=(",", ":"),
                ensure_ascii=False,
                default=_stable_data_value,
            ).encode("utf-8")
            digest.update(len(canonical_row).to_bytes(8, "big"))
            digest.update(canonical_row)
            row_count += 1
        row_counts[table_name] = row_count
        record_checksums[table_name] = digest.hexdigest()

    return PreservationSnapshot(
        database_identity=database_identity,
        server_version=server_version,
        revision=_read_revision(connection, profile.schema_name),
        schema_manifest=manifest,
        row_counts=row_counts,
        record_checksums=record_checksums,
    )


def _stable_data_value(value: object) -> str:
    if isinstance(value, bytes):
        return value.hex()
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def _format_schema_differences(comparison: Mapping[str, Any]) -> str:
    differences = comparison.get("differences", ())
    summarized = [
        f"{item.get('classification')}:{item.get('path')}"
        for item in differences[:20]
    ]
    remaining = len(differences) - len(summarized)
    if remaining > 0:
        summarized.append(f"and {remaining} more")
    return "; ".join(summarized) or "unknown schema difference"
