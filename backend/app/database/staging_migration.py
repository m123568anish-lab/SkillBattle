from __future__ import annotations

import ast
import json
import os
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import Connection, inspect, text
from sqlalchemy.engine import URL, make_url
from sqlalchemy.exc import ArgumentError

from app.database.migration_infrastructure.epoch_state import (
    EpochControlStateError,
    assert_legacy_runner_allowed,
)
from app.database.migration_state import (
    MigrationStateError,
    inspect_migration_state,
)

EXPECTED_STAGING_BRANCH_NAME = "qubira-staging"
PLACEMENT_MIGRATION_REVISION = "f9a1b2c3d4e5"
PLACEMENT_MIGRATION_DOWN_REVISION = "d1f5a8e7c2b4"
PLACEMENT_TABLES = frozenset(
    {
        "placement_jobs",
        "placement_source_records",
        "placement_inventory_targets",
    }
)
PLACEMENT_QUESTION_COLUMNS = frozenset(
    {
        "source_url",
        "source_classification",
        "company",
        "role",
        "assessment_round",
        "question_kind",
        "topic",
        "subtopic",
        "original_publish_date",
        "license",
        "verification_status",
        "approval_status",
        "lifecycle_state",
        "duplicate_of_id",
        "failure_reasons",
        "canonical_hash",
        "reuse_permission",
    }
)
LEGACY_QUESTION_COLUMNS = frozenset(
    {"id", "question_type", "is_active", "is_validated"}
)
_ID_PATTERN = re.compile(r"^[A-Za-z0-9-]{1,128}$")
_BRANCH_ID_PATTERN = re.compile(r"^br-[A-Za-z0-9-]{1,124}$")
_DATABASE_IDENTITY_PATTERN = re.compile(r"^[A-Za-z0-9_][A-Za-z0-9_-]{0,127}$")
_REVISION_PATTERN = re.compile(r"^[A-Za-z0-9_-]{1,128}$")
_DESTRUCTIVE_SQL_PATTERN = re.compile(
    r"\b(?:DROP\s+(?:TABLE|INDEX|COLUMN|CONSTRAINT|SCHEMA)|TRUNCATE|DELETE\s+FROM)\b",
    re.IGNORECASE,
)
_DESTRUCTIVE_OPERATIONS = frozenset(
    {
        "drop_column",
        "drop_constraint",
        "drop_index",
        "drop_table",
        "drop_schema",
        "delete",
        "truncate",
    }
)
_REQUIRED_STAGING_SETTINGS = (
    "ENVIRONMENT",
    "EXPECTED_NEON_PROJECT_ID",
    "EXPECTED_NEON_BRANCH_ID",
    "EXPECTED_DATABASE_NAME",
    "EXPECTED_DATABASE_ROLE",
    "EXPECTED_MIGRATION_REVISION",
    "NEON_API_KEY",
    "DATABASE_URL",
    "MIGRATION_DATABASE_URL",
)
_PRODUCTION_MARKERS = re.compile(
    r"(?:^|[._-])(production|prod|main)(?:$|[._-])",
    re.IGNORECASE,
)


class StagingMigrationError(RuntimeError):
    """Raised when staging-only migration authorization or preflight fails."""


@dataclass(frozen=True)
class StagingMigrationAuthorization:
    project_id: str
    branch_id: str
    database_name: str
    database_role: str
    target_revision: str
    neon_api_key: str = field(repr=False)
    database_url: URL = field(repr=False)
    approved: bool


@dataclass(frozen=True)
class StagingMigrationPreflight:
    report: dict[str, Any]
    question_counts: tuple[tuple[str, bool, bool, int], ...]


def _required_value(name: str, environ: dict[str, str]) -> str:
    value = environ.get(name, "").strip()
    if not value:
        raise StagingMigrationError(f"Required staging migration setting {name} is missing.")
    return value


def validate_staging_configuration(
    environ: dict[str, str] | None = None,
) -> None:
    """Validate staging settings without opening a database connection.

    Only setting names are included in missing-setting errors. Values are
    validated later without ever being logged or returned in an error message.
    """
    values = os.environ if environ is None else environ
    if values.get("ENVIRONMENT", "").strip().casefold() != "staging":
        raise StagingMigrationError(
            "Staging migrations require ENVIRONMENT=staging explicitly."
        )

    missing = [
        name
        for name in _REQUIRED_STAGING_SETTINGS
        if not values.get(name, "").strip()
    ]
    if missing:
        raise StagingMigrationError(
            "Missing required staging migration settings: "
            + ", ".join(missing)
        )


def load_staging_migration_authorization(
    environ: dict[str, str] | None = None,
) -> StagingMigrationAuthorization:
    values = os.environ if environ is None else environ
    validate_staging_configuration(values)

    project_id = _required_value("EXPECTED_NEON_PROJECT_ID", values)
    branch_id = _required_value("EXPECTED_NEON_BRANCH_ID", values)
    database_name = _required_value("EXPECTED_DATABASE_NAME", values)
    database_role = _required_value("EXPECTED_DATABASE_ROLE", values)
    target_revision = _required_value("EXPECTED_MIGRATION_REVISION", values)
    neon_api_key = _required_value("NEON_API_KEY", values)
    migration_url = _required_value("MIGRATION_DATABASE_URL", values)

    if not _ID_PATTERN.fullmatch(project_id):
        raise StagingMigrationError("EXPECTED_NEON_PROJECT_ID has an invalid format.")
    if not _BRANCH_ID_PATTERN.fullmatch(branch_id):
        raise StagingMigrationError("EXPECTED_NEON_BRANCH_ID has an invalid format.")
    if not _DATABASE_IDENTITY_PATTERN.fullmatch(
        database_name
    ) or not _DATABASE_IDENTITY_PATTERN.fullmatch(database_role):
        raise StagingMigrationError("Expected database identity settings have an invalid format.")
    if not _REVISION_PATTERN.fullmatch(target_revision):
        raise StagingMigrationError("EXPECTED_MIGRATION_REVISION has an invalid format.")
    if target_revision != PLACEMENT_MIGRATION_REVISION:
        raise StagingMigrationError(
            "The authorized target must be the reviewed placement migration revision "
            f"{PLACEMENT_MIGRATION_REVISION}."
        )

    if migration_url.startswith("postgres://"):
        migration_url = migration_url.replace("postgres://", "postgresql://", 1)
    try:
        database_url = make_url(migration_url)
    except (ArgumentError, ValueError) as error:
        raise StagingMigrationError("MIGRATION_DATABASE_URL is not a valid database URL.") from error
    if database_url.get_backend_name() != "postgresql":
        raise StagingMigrationError("Staging migrations require PostgreSQL.")
    if database_url.drivername in {"postgresql", "postgresql+psycopg2"}:
        database_url = database_url.set(drivername="postgresql+psycopg")
    elif database_url.drivername != "postgresql+psycopg":
        raise StagingMigrationError(
            "MIGRATION_DATABASE_URL must use the synchronous psycopg driver."
        )
    host = (database_url.host or "").casefold()
    if not host or "-pooler" in host:
        raise StagingMigrationError(
            "Staging migrations require a direct, unpooled PostgreSQL endpoint."
        )
    if _PRODUCTION_MARKERS.search(host) or _PRODUCTION_MARKERS.search(
        database_url.database or ""
    ):
        raise StagingMigrationError(
            "MIGRATION_DATABASE_URL appears to target a production-like database."
        )
    if database_url.port not in (None, 5432):
        raise StagingMigrationError(
            "Staging migrations require the verified Neon PostgreSQL endpoint port."
        )
    if database_url.database != database_name:
        raise StagingMigrationError(
            "MIGRATION_DATABASE_URL does not match EXPECTED_DATABASE_NAME."
        )
    if database_url.username != database_role:
        raise StagingMigrationError(
            "MIGRATION_DATABASE_URL does not match EXPECTED_DATABASE_ROLE."
        )

    application_url_value = values.get("DATABASE_URL", "").strip()
    if application_url_value.startswith("postgres://"):
        application_url_value = application_url_value.replace(
            "postgres://", "postgresql://", 1
        )
    try:
        application_url = make_url(application_url_value)
    except (ArgumentError, ValueError) as error:
        raise StagingMigrationError("DATABASE_URL is not a valid database URL.") from error
    if application_url.get_backend_name() != "postgresql":
        raise StagingMigrationError(
            "Staging preflight requires a PostgreSQL DATABASE_URL."
        )
    application_host = (application_url.host or "").casefold().replace(
        "-pooler.", "."
    )
    if _PRODUCTION_MARKERS.search(application_host) or _PRODUCTION_MARKERS.search(
        application_url.database or ""
    ):
        raise StagingMigrationError(
            "DATABASE_URL appears to target a production-like database."
        )
    if (
        application_host != host.replace("-pooler.", ".")
        or (application_url.port or 5432) != (database_url.port or 5432)
        or application_url.database != database_name
        or application_url.username != database_role
    ):
        raise StagingMigrationError(
            "DATABASE_URL and MIGRATION_DATABASE_URL do not identify the same staging database."
        )

    approval = values.get("STAGING_MIGRATION_APPROVED", "").strip().casefold()
    if approval not in {"", "0", "1", "false", "true", "no", "yes"}:
        raise StagingMigrationError(
            "STAGING_MIGRATION_APPROVED must be an explicit boolean value."
        )

    return StagingMigrationAuthorization(
        project_id=project_id,
        branch_id=branch_id,
        database_name=database_name,
        database_role=database_role,
        target_revision=target_revision,
        neon_api_key=neon_api_key,
        database_url=database_url,
        approved=approval in {"1", "true", "yes"},
    )


def _neon_api_json(path: str, api_key: str) -> dict[str, Any]:
    request = Request(
        f"https://console.neon.tech/api/v2{path}",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Accept": "application/json",
        },
        method="GET",
    )
    try:
        with urlopen(request, timeout=10) as response:
            payload = response.read(1_000_001)
    except HTTPError as error:
        raise StagingMigrationError(
            f"Neon read-only identity check failed with HTTP {error.code}."
        ) from None
    except (URLError, TimeoutError, OSError):
        raise StagingMigrationError(
            "Neon read-only identity check could not reach the API."
        ) from None

    if len(payload) > 1_000_000:
        raise StagingMigrationError("Neon identity response exceeded the safe size limit.")
    try:
        decoded = json.loads(payload)
    except (UnicodeDecodeError, json.JSONDecodeError):
        raise StagingMigrationError("Neon identity API returned an invalid response.") from None
    if not isinstance(decoded, dict):
        raise StagingMigrationError("Neon identity API returned an unexpected response.")
    return decoded


def verify_neon_staging_branch(
    authorization: StagingMigrationAuthorization,
) -> dict[str, Any]:
    project = quote(authorization.project_id, safe="")
    branch_id = quote(authorization.branch_id, safe="")
    branch_response = _neon_api_json(
        f"/projects/{project}/branches/{branch_id}",
        authorization.neon_api_key,
    )
    branch = branch_response.get("branch")
    if not isinstance(branch, dict):
        raise StagingMigrationError("Neon did not return the expected staging branch.")

    if (
        branch.get("id") != authorization.branch_id
        or branch.get("project_id") != authorization.project_id
    ):
        raise StagingMigrationError(
            "Neon branch identity does not match the explicitly expected project and branch."
        )
    branch_name = branch.get("name")
    if (
        not isinstance(branch_name, str)
        or branch_name.casefold() != EXPECTED_STAGING_BRANCH_NAME
        or branch_name.casefold() in {"production", "main"}
        or branch.get("default") is not False
        or branch.get("current_state") != "ready"
    ):
        raise StagingMigrationError(
            "The expected branch is not a ready, non-default qubira-staging branch."
        )

    endpoints_response = _neon_api_json(
        f"/projects/{project}/branches/{branch_id}/endpoints",
        authorization.neon_api_key,
    )
    endpoints = endpoints_response.get("endpoints")
    if not isinstance(endpoints, list):
        raise StagingMigrationError("Neon did not return the expected branch endpoints.")
    write_endpoints = [
        endpoint
        for endpoint in endpoints
        if isinstance(endpoint, dict) and endpoint.get("type") == "read_write"
    ]
    configured_host = (authorization.database_url.host or "").casefold()
    matches = [
        endpoint
        for endpoint in write_endpoints
        if endpoint.get("project_id") == authorization.project_id
        and endpoint.get("branch_id") == authorization.branch_id
        and isinstance(endpoint.get("host"), str)
        and endpoint["host"].casefold() == configured_host
        and "-pooler" not in endpoint["host"].casefold()
        and endpoint.get("disabled") is False
    ]
    if len(write_endpoints) != 1 or len(matches) != 1:
        raise StagingMigrationError(
            "The direct migration endpoint is not the unique read-write endpoint "
            "for the expected staging branch."
        )

    return {
        "project_id": authorization.project_id,
        "branch_id": authorization.branch_id,
        "branch_name": EXPECTED_STAGING_BRANCH_NAME,
        "endpoint_verified": True,
    }


def _destructive_operations_in_function(
    revision_path: str,
    function_name: str,
) -> tuple[str, ...]:
    try:
        source = Path(revision_path).read_text(encoding="utf-8")
        tree = ast.parse(source, filename=revision_path)
    except (OSError, SyntaxError) as error:
        raise StagingMigrationError(
            "The authorized migration source could not be inspected."
        ) from error

    upgrade = next(
        (
            node
            for node in tree.body
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))
            and node.name == function_name
        ),
        None,
    )
    if upgrade is None:
        raise StagingMigrationError(
            f"The authorized migration has no {function_name} function."
        )

    operations: set[str] = set()
    for node in ast.walk(upgrade):
        if isinstance(node, ast.Call):
            operation = (
                node.func.attr
                if isinstance(node.func, ast.Attribute)
                else ""
            )
            if operation in _DESTRUCTIVE_OPERATIONS:
                operations.add(operation)
        if isinstance(node, ast.Constant) and isinstance(node.value, str):
            if _DESTRUCTIVE_SQL_PATTERN.search(node.value):
                operations.add("destructive_sql")
    return tuple(sorted(operations))


def _assert_non_destructive_upgrade(revision_path: str) -> None:
    operations = _destructive_operations_in_function(revision_path, "upgrade")
    if operations:
        raise StagingMigrationError(
            "The authorized migration upgrade contains destructive operations: "
            + ", ".join(operations)
        )


def _question_counts(connection: Connection) -> tuple[tuple[str, bool, bool, int], ...]:
    rows = connection.execute(
        text(
            "SELECT COALESCE(NULLIF(lower(trim(question_type)), ''), '<blank>'), "
            "is_active, is_validated, COUNT(*) "
            "FROM questions "
            "GROUP BY 1, 2, 3 "
            "ORDER BY 1, 2, 3"
        )
    ).all()
    return tuple(
        (str(question_type), bool(is_active), bool(is_validated), int(count))
        for question_type, is_active, is_validated, count in rows
    )


def build_staging_preflight(
    connection: Connection,
    authorization: StagingMigrationAuthorization,
    script: ScriptDirectory,
    *,
    expected_schema: str = "public",
) -> StagingMigrationPreflight:
    connection.exec_driver_sql("SET TRANSACTION READ ONLY")
    database_name, database_role, current_schema, is_replica = connection.execute(
        text(
            "SELECT current_database(), current_user, current_schema(), "
            "pg_is_in_recovery()"
        )
    ).one()
    if (
        database_name != authorization.database_name
        or database_role != authorization.database_role
        or current_schema != expected_schema
        or is_replica
    ):
        raise StagingMigrationError(
            "Connected PostgreSQL identity does not match the expected writable staging database."
        )

    try:
        state = inspect_migration_state(connection, script)
        assert_legacy_runner_allowed(set(state.table_names))
    except (EpochControlStateError, MigrationStateError) as error:
        raise StagingMigrationError(
            f"Migration state or epoch-control preflight refused: {error}"
        ) from error

    if (
        state.current_revision != PLACEMENT_MIGRATION_DOWN_REVISION
        or state.expected_head != authorization.target_revision
    ):
        raise StagingMigrationError(
            "Staging revision state must be exactly "
            f"{PLACEMENT_MIGRATION_DOWN_REVISION} before target "
            f"{authorization.target_revision}."
        )
    target = script.get_revision(authorization.target_revision)
    if (
        target is None
        or target.revision != PLACEMENT_MIGRATION_REVISION
        or target.down_revision != PLACEMENT_MIGRATION_DOWN_REVISION
        or script.get_heads() != [PLACEMENT_MIGRATION_REVISION]
    ):
        raise StagingMigrationError(
            "Repository migration target is not the reviewed placement revision."
        )
    _assert_non_destructive_upgrade(target.path)
    downgrade_operations = _destructive_operations_in_function(
        target.path,
        "downgrade",
    )

    inspector = inspect(connection)
    if "questions" not in state.table_names:
        raise StagingMigrationError("Expected legacy questions table is missing.")
    question_columns = {
        column["name"] for column in inspector.get_columns("questions")
    }
    if not LEGACY_QUESTION_COLUMNS <= question_columns:
        raise StagingMigrationError(
            "The legacy questions table does not match the reviewed source schema."
        )
    if PLACEMENT_QUESTION_COLUMNS & question_columns:
        raise StagingMigrationError(
            "Placement question columns already exist before the expected migration."
        )
    if PLACEMENT_TABLES & set(state.table_names):
        raise StagingMigrationError(
            "Placement tables already exist before the expected migration."
        )

    counts = _question_counts(connection)
    report: dict[str, Any] = {
        "environment": "staging",
        "project_id": authorization.project_id,
        "branch_id": authorization.branch_id,
        "branch_name": EXPECTED_STAGING_BRANCH_NAME,
        "database": database_name,
        "database_role": database_role,
        "direct_endpoint_verified": True,
        "current_revision": state.current_revision,
        "target_revision": authorization.target_revision,
        "legacy_question_counts": [
            {
                "question_type": kind,
                "active": active,
                "validated": validated,
                "count": count,
            }
            for kind, active, validated, count in counts
        ],
        "placement_tables_absent": True,
        "placement_columns_absent": True,
        "upgrade_destructive_operations": [],
        "downgrade_destructive_operations": list(downgrade_operations),
        "read_only": True,
        "execution_approved": authorization.approved,
    }
    return StagingMigrationPreflight(report=report, question_counts=counts)


def verify_staging_postflight(
    connection: Connection,
    authorization: StagingMigrationAuthorization,
    script: ScriptDirectory,
    preflight: StagingMigrationPreflight,
) -> dict[str, Any]:
    connection.exec_driver_sql("SET TRANSACTION READ ONLY")
    database_name, database_role, current_schema, is_replica = connection.execute(
        text(
            "SELECT current_database(), current_user, current_schema(), "
            "pg_is_in_recovery()"
        )
    ).one()
    if (
        database_name != authorization.database_name
        or database_role != authorization.database_role
        or current_schema != "public"
        or is_replica
    ):
        raise StagingMigrationError(
            "Post-migration PostgreSQL identity differs from the verified staging target."
        )
    try:
        state = inspect_migration_state(connection, script)
        assert_legacy_runner_allowed(set(state.table_names))
    except (EpochControlStateError, MigrationStateError) as error:
        raise StagingMigrationError(
            "Post-migration revision verification failed."
        ) from error
    inspector = inspect(connection)
    tables = set(state.table_names)
    if (
        state.current_revision != authorization.target_revision
        or not PLACEMENT_TABLES <= tables
    ):
        raise StagingMigrationError(
            "Post-migration revision or placement table verification failed."
        )
    question_columns = {
        column["name"] for column in inspector.get_columns("questions")
    }
    if not PLACEMENT_QUESTION_COLUMNS <= question_columns:
        raise StagingMigrationError(
            "Post-migration placement question columns are incomplete."
        )
    if _question_counts(connection) != preflight.question_counts:
        raise StagingMigrationError(
            "Legacy question type, active, or validation counts changed during migration."
        )
    invalid_rows = connection.execute(
        text(
            "SELECT COUNT(*) FROM questions WHERE "
            "question_kind IS DISTINCT FROM "
            "COALESCE(NULLIF(lower(trim(question_type)), ''), 'mcq') "
            "OR verification_status IS DISTINCT FROM CASE "
            "WHEN is_active IS TRUE AND is_validated IS TRUE THEN 'approved' "
            "ELSE 'needs_review' END "
            "OR approval_status IS DISTINCT FROM CASE "
            "WHEN is_active IS TRUE AND is_validated IS TRUE THEN 'approved' "
            "ELSE 'needs_review' END "
            "OR lifecycle_state IS DISTINCT FROM CASE "
            "WHEN is_active IS TRUE AND is_validated IS TRUE THEN 'PUBLISHED' "
            "ELSE 'NEEDS_REVIEW' END"
        )
    ).scalar_one()
    if invalid_rows:
        raise StagingMigrationError(
            "Post-migration question provenance or approval backfill verification failed."
        )
    return {
        "current_revision": state.current_revision,
        "placement_tables_present": sorted(PLACEMENT_TABLES),
        "placement_question_columns_present": sorted(PLACEMENT_QUESTION_COLUMNS),
        "legacy_question_counts_preserved": True,
        "question_kind_and_approval_backfills_valid": True,
        "read_only": True,
    }
