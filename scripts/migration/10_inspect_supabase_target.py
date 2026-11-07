"""Read-only inspection of a configured Supabase PostgreSQL target."""

from __future__ import annotations

import os
import re
import socket
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

from common import BACKEND_DIR, REPO_ROOT, TOPOLOGICAL_MIGRATION_ORDER

ENV_FILE = BACKEND_DIR / ".env.migration"
REPORT_FILE = REPO_ROOT / "PHASE_3A_SUPABASE_TARGET_INSPECTION.md"
SUPABASE_MANAGED_SCHEMAS = {
    "auth",
    "extensions",
    "graphql",
    "graphql_public",
    "net",
    "realtime",
    "storage",
    "supabase_functions",
    "vault",
}
SUPABASE_POOLER_SUFFIX = ".pooler.supabase.com"


def load_local_env(path: Path = ENV_FILE) -> None:
    """Load only the dedicated local migration env file without printing values."""
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip("\"'")
        if key and key not in os.environ:
            os.environ[key] = value


def repository_head() -> str:
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    heads = ScriptDirectory.from_config(config).get_heads()
    if len(heads) != 1:
        raise RuntimeError("The checked-in Alembic graph must have exactly one head.")
    return heads[0]


def normalize_project_ref(value: str) -> str:
    """Accept either a Supabase project reference or its project URL."""
    candidate = value.strip()
    if "://" in candidate:
        candidate = urlparse(candidate).hostname or ""
    suffix = ".supabase.co"
    if candidate.endswith(suffix):
        candidate = candidate[: -len(suffix)]
    return candidate.removeprefix("db.")


def markdown_report(body: str) -> None:
    REPORT_FILE.write_text(
        "# Phase 3A — Supabase Target Inspection\n\n"
        f"Inspection generated: {datetime.now(timezone.utc).isoformat()}\n\n"
        + body.rstrip()
        + "\n",
        encoding="utf-8",
    )


def local_migration_readiness() -> str:
    """Report model registration and BattleRoom fields without connecting to a database."""
    try:
        backend_path = str(BACKEND_DIR)
        if backend_path not in sys.path:
            sys.path.insert(0, backend_path)
        from app.models import Base

        registered = set(Base.metadata.tables)
        expected = set(TOPOLOGICAL_MIGRATION_ORDER) - {"alembic_version"}
        battle_room_columns = set(Base.metadata.tables["battle_rooms"].columns.keys())
        required_battle_room_fields = {
            "id",
            "adaptive_owner_id",
            "adaptive_date",
            "round_status",
            "current_section_index",
            "last_transition_at",
            "sections_config",
            "questions_data",
        }
        missing_models = sorted(expected - registered)
        extra_models = sorted(registered - expected)
        missing_battle_fields = sorted(required_battle_room_fields - battle_room_columns)
        return (
            "- SQLAlchemy model registry import: passed\n"
            f"- Registered application tables: `{len(registered)}`; migration inventory: `{len(expected)}`\n"
            f"- Model/migration table inventory matches: `{not missing_models and not extra_models}`\n"
            f"- Missing registered model tables: `{', '.join(missing_models) or 'none'}`\n"
            f"- Model-only tables: `{', '.join(extra_models) or 'none'}`\n"
            f"- BattleRoom required fields present: `{not missing_battle_fields}`\n"
            f"- Missing BattleRoom fields: `{', '.join(missing_battle_fields) or 'none'}`\n"
        )
    except Exception as exc:
        return (
            f"- SQLAlchemy model registry import: failed (`{type(exc).__name__}`)\n"
            "- Table inventory and BattleRoom fields: not verified\n"
        )


def classify_connection_error(exc: BaseException) -> str:
    """Classify a driver failure without returning its potentially sensitive message."""
    messages: list[str] = []
    seen: set[int] = set()
    current: BaseException | None = exc
    while current is not None and id(current) not in seen:
        seen.add(id(current))
        messages.append(str(current).lower())
        current = getattr(current, "__cause__", None) or getattr(current, "orig", None)
    combined = " ".join(messages)
    if "password authentication failed" in combined or "authentication failed" in combined:
        return "Authentication failure"
    if "timeout" in combined or "timed out" in combined:
        return "Connection timeout"
    if "connection refused" in combined:
        return "Connection refused"
    if "no pg_hba" in combined:
        return "Server access policy rejection"
    if "ssl" in combined and ("error" in combined or "failed" in combined):
        return "TLS/SSL connection failure"
    return "Network/driver connection failure (unclassified)"


def postgres_error_details(exc: BaseException) -> tuple[str, str]:
    """Return only a PostgreSQL SQLSTATE and a known-safe description."""
    seen: set[int] = set()
    current: BaseException | None = exc
    sqlstate = ""
    while current is not None and id(current) not in seen:
        seen.add(id(current))
        diag = getattr(current, "diag", None)
        candidate = (
            getattr(current, "sqlstate", None)
            or getattr(current, "pgcode", None)
            or getattr(diag, "sqlstate", None)
        )
        if candidate:
            sqlstate = str(candidate)
            break
        current = getattr(current, "__cause__", None) or getattr(current, "orig", None)
    safe_descriptions = {
        "28P01": "Invalid password",
        "28000": "Invalid authorization specification",
        "3D000": "Database does not exist",
        "08001": "Unable to establish SQL client connection",
        "08004": "Server rejected connection",
        "08006": "Connection failure",
        "53300": "Too many connections",
    }
    return sqlstate or "unavailable", safe_descriptions.get(
        sqlstate, "No safe PostgreSQL error description available"
    )


def empty_report(head: str, reason: str) -> int:
    markdown_report(
        "## Status: BLOCKED — credentials not configured\n\n"
        f"{reason}\n\n"
        "No database connection was attempted. No database changes were made.\n\n"
        "## Alembic approval check\n\n"
        f"- Resolved repository head: `{head}`\n"
        "- Approved revision: not verified\n\n"
        "## Local migration readiness\n\n"
        f"{local_migration_readiness()}\n"
        "## Target inspection results\n\n"
        "- Project identity: not inspected\n"
        "- PostgreSQL version: not inspected\n"
        "- Database name: not inspected\n"
        "- Schemas, application tables, and Alembic metadata: not inspected\n"
        "- Target emptiness: not confirmed\n\n"
        "## Next step\n\n"
        "Configure `SUPABASE_PROJECT_REF`, `SUPABASE_DATABASE_URL`, and "
        "`APPROVED_ALEMBIC_REVISION` in the ignored `backend/.env.migration` file, "
        "then rerun `python scripts/migration/10_inspect_supabase_target.py`. "
        "The script performs read-only queries only. It stops before any schema-changing SQL.\n"
    )
    print("Supabase inspection blocked; see PHASE_3A_SUPABASE_TARGET_INSPECTION.md.")
    return 2


def write_blocked_report(
    *,
    title: str,
    reason: str,
    project_ref: str,
    host: str,
    database: str,
    head: str,
    approved: str,
) -> int:
    markdown_report(
        f"## Status: BLOCKED — {title}\n\n"
        f"{reason}\n\n"
        "No database connection was attempted. No database changes were made.\n\n"
        "## Configured target (sanitized)\n\n"
        f"- Project reference: `{project_ref}`\n"
        f"- Host: `{host}`\n"
        f"- Database: `{database}`\n"
        "- PostgreSQL version, connected user, and SSL: not verified\n\n"
        "## Alembic\n\n"
        f"- Resolved repository head: `{head}`\n"
        f"- Approved revision: `{approved}`\n"
        f"- Revisions match: `{head == approved}`\n\n"
        "## Local migration readiness\n\n"
        f"{local_migration_readiness()}\n"
        "- Alembic graph: one repository head; no multiple-head conflict detected\n\n"
        "## Inspection/deployment safety\n\n"
        "- This inspector uses read-only catalog/data queries and sets the inspection transaction to read-only.\n"
        "- `scripts/migration/04_prepare_supabase_schema.py` is not read-only: it runs `alembic upgrade head` and additional DDL. It was not run.\n"
        "- No migration or schema-changing statement was executed.\n\n"
        "## Target state\n\n"
        "- Schemas, tables, objects, and Alembic metadata: not inspected\n"
        "- Target emptiness: not confirmed\n"
        "- Schema deployment approval: **NOT GRANTED**\n"
        "\n## Recommendation\n\n"
        "Replace the local URL with the Session Pooler endpoint and project-scoped username copied from the Supabase dashboard. "
        "Keep the password only in the ignored local env file. Rerun this inspector; it will query the target only after the pooler host, username, project reference, and port pass validation.\n"
    )
    print("Supabase inspection blocked before connecting; see inspection report.")
    return 2


def inspect_target() -> int:
    load_local_env()
    head = repository_head()
    approved = os.getenv("APPROVED_ALEMBIC_REVISION", "").strip()
    if not approved:
        return empty_report(head, "The approved Alembic revision is missing.")
    if approved != head:
        markdown_report(
            "## Status: BLOCKED — Alembic approval mismatch\n\n"
            f"- Resolved repository head: `{head}`\n"
            f"- Configured approved revision: `{approved}`\n\n"
            "No database connection was attempted because the approved revision does not "
            "match the checked-in graph. No database changes were made.\n"
        )
        print("Supabase inspection blocked by Alembic approval mismatch.")
        return 2

    configured_project_ref = os.getenv("SUPABASE_PROJECT_REF", "").strip()
    project_ref = normalize_project_ref(configured_project_ref)
    database_url = os.getenv("SUPABASE_DATABASE_URL", "").strip()
    missing = [
        name
        for name, value in (
            ("SUPABASE_PROJECT_REF", project_ref),
            ("SUPABASE_DATABASE_URL", database_url),
        )
        if not value
    ]
    if missing:
        return empty_report(head, "Missing required local settings: " + ", ".join(missing) + ".")

    try:
        parsed_url = make_url(database_url)
    except Exception:
        return empty_report(head, "SUPABASE_DATABASE_URL is not a valid PostgreSQL URL.")
    if parsed_url.drivername not in {"postgres", "postgresql", "postgresql+psycopg", "postgresql+psycopg2"}:
        return empty_report(head, "SUPABASE_DATABASE_URL must use a PostgreSQL driver.")

    host = parsed_url.host or ""
    if not re.fullmatch(r"[a-zA-Z0-9.-]+", host):
        markdown_report(
            "## Status: BLOCKED — PostgreSQL URL could not be safely parsed\n\n"
            "The host parsed from `SUPABASE_DATABASE_URL` contains characters that are not valid "
            "in a DNS hostname. The connection was not attempted. The URL was not included in "
            "this report to protect credentials.\n\n"
            "If the database username or password contains URL-reserved characters (for example "
            "`@`, `:`, `/`, or `%`), percent-encode those characters in the URL credentials, "
            "or use the exact connection string copied from Supabase without editing it.\n\n"
            "## Target inspection\n\n"
            f"- Configured project reference: `{project_ref}`\n"
            f"- Resolved repository head: `{head}`\n"
            f"- Approved revision: `{approved}`\n"
            "- PostgreSQL version/database identity: not verified\n"
            "- Schemas, application tables, and Alembic metadata: not inspected\n"
            "- Target emptiness: not confirmed\n"
            "- Schema deployment approval: **NOT GRANTED**\n"
        )
        print("Supabase inspection blocked: PostgreSQL URL could not be safely parsed.")
        return 2

    if not host.endswith(SUPABASE_POOLER_SUFFIX):
        return write_blocked_report(
            title="Session Pooler endpoint required",
            reason=(
                "The configured host is not a Supabase Session Pooler endpoint. "
                "This workflow was requested to use Session Pooler; no direct-database "
                "connection was attempted."
            ),
            project_ref=project_ref,
            host=host,
            database=parsed_url.database or "",
            head=head,
            approved=approved,
        )

    username = parsed_url.username or ""
    expected_pooler_username = f"postgres.{project_ref}"
    if username != expected_pooler_username:
        return write_blocked_report(
            title="Session Pooler username mismatch",
            reason=(
                "The configured pooler username does not match the expected project-scoped "
                "PostgreSQL user. The username and password were not included in this report."
            ),
            project_ref=project_ref,
            host=host,
            database=parsed_url.database or "",
            head=head,
            approved=approved,
        )

    if (parsed_url.port or 5432) != 5432:
        return write_blocked_report(
            title="Unexpected Session Pooler port",
            reason="This inspection expects the Supabase Session Pooler port 5432.",
            project_ref=project_ref,
            host=host,
            database=parsed_url.database or "",
            head=head,
            approved=approved,
        )

    try:
        socket.getaddrinfo(host, parsed_url.port or 5432, type=socket.SOCK_STREAM)
    except socket.gaierror:
        markdown_report(
            "## Status: FAILED — target host did not resolve\n\n"
            "The configured PostgreSQL host could not be resolved by DNS from this environment. "
            "The database connection was not attempted. No database changes were made.\n\n"
            "## Target identity\n\n"
            f"- Configured project reference: `{project_ref}`\n"
            f"- Configured database host: `{host}`\n"
            "- DNS resolution: failed\n"
            "- PostgreSQL version/database identity: not verified\n\n"
            "## Alembic\n\n"
            f"- Resolved repository head: `{head}`\n"
            f"- Approved revision: `{approved}`\n\n"
            "## Target state\n\n"
            "- Schemas, application tables, and Alembic metadata: not inspected\n"
            "- Target emptiness: not confirmed\n"
            "- Schema deployment approval: **NOT GRANTED**\n\n"
            "Check that the configured project reference and database endpoint are correct and "
            "that DNS/network access is available, then rerun this read-only inspection.\n"
        )
        print("Supabase target host did not resolve; see inspection report.")
        return 1

    engine = None
    try:
        engine = create_engine(
            database_url,
            pool_pre_ping=True,
            pool_size=1,
            max_overflow=0,
            hide_parameters=True,
            connect_args={"connect_timeout": 10},
        )
        with engine.connect() as connection:
            connection.execute(text("SET TRANSACTION READ ONLY"))
            identity = connection.execute(
                text(
                    "SELECT current_database() AS database_name, "
                    "current_user AS connected_user, version() AS postgres_version, "
                    "inet_server_addr()::text AS server_address, "
                    "inet_server_port() AS server_port"
                )
            ).mappings().one()
            ssl_status = connection.execute(
                text(
                    "SELECT ssl, version, cipher "
                    "FROM pg_catalog.pg_stat_ssl "
                    "WHERE pid = pg_backend_pid()"
                )
            ).mappings().first()
            schemas = connection.execute(
                text(
                    "SELECT schema_name FROM information_schema.schemata "
                    "ORDER BY schema_name"
                )
            ).scalars().all()
            relation_rows = connection.execute(
                text(
                    "SELECT n.nspname AS schema_name, c.relname AS object_name, "
                    "c.relkind AS object_kind, COALESCE(e.extname, '') AS extension_name "
                    "FROM pg_catalog.pg_class AS c "
                    "JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace "
                    "LEFT JOIN pg_catalog.pg_depend AS d "
                    "ON d.classid = 'pg_catalog.pg_class'::regclass "
                    "AND d.objid = c.oid "
                    "AND d.refclassid = 'pg_catalog.pg_extension'::regclass "
                    "AND d.deptype = 'e' "
                    "LEFT JOIN pg_catalog.pg_extension AS e ON e.oid = d.refobjid "
                    "WHERE c.relkind IN ('r', 'p', 'v', 'm', 'S', 'f') "
                    "AND n.nspname NOT IN ('pg_catalog', 'information_schema') "
                    "ORDER BY n.nspname, c.relkind, c.relname"
                )
            ).mappings().all()
            routine_rows = connection.execute(
                text(
                    "SELECT n.nspname AS schema_name, p.proname AS object_name, "
                    "pg_catalog.pg_get_function_identity_arguments(p.oid) AS arguments, "
                    "COALESCE(e.extname, '') AS extension_name "
                    "FROM pg_catalog.pg_proc AS p "
                    "JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace "
                    "LEFT JOIN pg_catalog.pg_depend AS d "
                    "ON d.classid = 'pg_catalog.pg_proc'::regclass "
                    "AND d.objid = p.oid "
                    "AND d.refclassid = 'pg_catalog.pg_extension'::regclass "
                    "AND d.deptype = 'e' "
                    "LEFT JOIN pg_catalog.pg_extension AS e ON e.oid = d.refobjid "
                    "WHERE n.nspname NOT IN ('pg_catalog', 'information_schema') "
                    "ORDER BY n.nspname, p.proname"
                )
            ).mappings().all()

            table_rows = []
            for relation in relation_rows:
                schema = relation["schema_name"]
                if relation["object_kind"] not in {"r", "p", "f"}:
                    continue
                if schema in SUPABASE_MANAGED_SCHEMAS or schema.startswith("pg_"):
                    table_rows.append((schema, relation["object_name"], None))
                    continue
                quoted_schema = connection.dialect.identifier_preparer.quote(schema)
                quoted_table = connection.dialect.identifier_preparer.quote(relation["object_name"])
                count = connection.exec_driver_sql(
                    f"SELECT count(*) FROM {quoted_schema}.{quoted_table}"
                ).scalar_one()
                table_rows.append((schema, relation["object_name"], count))

            alembic_exists = any(
                row["schema_name"] == "public"
                and row["object_name"] == "alembic_version"
                and row["object_kind"] in {"r", "p"}
                for row in relation_rows
            )
            revisions: list[str] = []
            if alembic_exists:
                revisions = connection.execute(
                    text("SELECT version_num FROM public.alembic_version ORDER BY version_num")
                ).scalars().all()

            application_tables = [
                row for row in relation_rows
                if row["schema_name"] not in SUPABASE_MANAGED_SCHEMAS
                and not row["schema_name"].startswith("pg_")
                and row["object_name"] != "alembic_version"
                and row["extension_name"] == ""
            ]
            unexpected_schemas = [
                schema for schema in schemas
                if schema not in {"public", "information_schema"}
                and not schema.startswith("pg_")
                and schema not in SUPABASE_MANAGED_SCHEMAS
            ]
            public_objects = [
                row for row in relation_rows + routine_rows
                if row["schema_name"] == "public" and row["extension_name"] == ""
            ]
            target_empty = (
                not public_objects
                and not application_tables
                and not alembic_exists
                and not unexpected_schemas
            )

            expected_ref = project_ref
            host_ref = username.rsplit(".", 1)[-1]
            project_identity_match = host_ref == expected_ref

            table_lines = (
                "\n".join(
                    f"| `{schema}` | `{table}` | {count if count is not None else 'managed; not counted'} |"
                    for schema, table, count in table_rows
                )
                if table_rows
                else "| — | — | No tables found |"
            )
            object_lines = "\n".join(
                f"- `{row['schema_name']}.{row['object_name']}` "
                f"({row['object_kind']}; "
                f"{'extension ' + row['extension_name'] if row['extension_name'] else 'not extension-owned'})"
                for row in relation_rows
            ) or "- No non-system relation objects found"
            routine_lines = "\n".join(
                f"- `{row['schema_name']}.{row['object_name']}({row['arguments']})`"
                f"{' (extension ' + row['extension_name'] + ')' if row['extension_name'] else ''}"
                for row in routine_rows
                if row["schema_name"] in {"public", *SUPABASE_MANAGED_SCHEMAS}
            ) or "- No routines in public or Supabase-managed schemas"
            schema_lines = "\n".join(f"- `{schema}`" for schema in schemas) or "- None"
            revision_lines = "\n".join(f"- `{revision}`" for revision in revisions) or "- No Alembic revision found"
            auth_tables = sorted(
                row["object_name"] for row in relation_rows
                if row["schema_name"] == "auth" and row["object_kind"] in {"r", "p"}
            )
            ssl_text = (
                f"enabled (`{ssl_status['version']}`, cipher `{ssl_status['cipher']}`)"
                if ssl_status and ssl_status["ssl"]
                else "not enabled or not visible in pg_stat_ssl"
            )
            status = (
                "READY FOR OWNER REVIEW"
                if target_empty and project_identity_match and identity["database_name"] == "postgres"
                else "STOP — TARGET NOT CONFIRMED EMPTY OR IDENTITY MISMATCH"
            )
            markdown_report(
                f"## Status: {status}\n\n"
                "Read-only inspection completed. No schema-changing SQL was executed.\n\n"
                "## Target identity\n\n"
                f"- Configured project reference: `{expected_ref}`\n"
                f"- Connected project reference from pooler username: `{host_ref}`\n"
                f"- Connected database: `{identity['database_name']}`\n"
                f"- Connected user: `{identity['connected_user']}`\n"
                f"- Project identity match: `{project_identity_match}`\n"
                f"- PostgreSQL version: `{str(identity['postgres_version']).splitlines()[0]}`\n"
                f"- SSL: {ssl_text}\n\n"
                "## Alembic\n\n"
                f"- Resolved repository head: `{head}`\n"
                f"- Approved revision: `{approved}`\n"
                f"- Target `alembic_version` exists: `{alembic_exists}`\n"
                f"- Target revisions:\n{revision_lines}\n\n"
                "## Schemas\n\n"
                f"{schema_lines}\n\n"
                "## Supabase-managed Auth objects\n\n"
                f"- `auth` schema present: `{'auth' in schemas}`\n"
                f"- Auth tables discovered (names only; no Auth data queried): "
                f"{', '.join(f'`{name}`' for name in auth_tables) or 'none'}\n\n"
                "## Non-system database relation objects\n\n"
                f"{object_lines}\n\n"
                "## Public and managed routines\n\n"
                f"{routine_lines}\n\n"
                "## Existing tables and row counts\n\n"
                "| Schema | Table | Rows |\n|---|---|---:|\n"
                f"{table_lines}\n\n"
                "## Deployment gate\n\n"
                f"- Public schema has no non-extension objects: `{not public_objects}`\n"
                f"- Target confirmed empty of application objects: `{target_empty}`\n"
                f"- Unexpected application schemas found: `{', '.join(unexpected_schemas) or 'none'}`\n"
                f"- Existing application objects found: `{len(application_tables)}`\n"
                "- Schema deployment approval: **NOT GRANTED**\n\n"
                "Do not run Alembic or execute schema-changing SQL until the owner reviews this report "
                "and explicitly approves deployment.\n"
            )
            print("Read-only Supabase inspection completed; see PHASE_3A_SUPABASE_TARGET_INSPECTION.md.")
            return 0 if target_empty and project_identity_match else 3
    except Exception as exc:
        # Never include raw driver messages; they can contain sensitive connection details.
        failure_category = classify_connection_error(exc)
        sqlstate, safe_description = postgres_error_details(exc)
        expected_pooler_username = f"postgres.{project_ref}"
        configured_username = parsed_url.username or ""
        project_identity_match = (
            configured_username == expected_pooler_username
            and host.endswith(SUPABASE_POOLER_SUFFIX)
        )
        markdown_report(
            "## Status: FAILED — read-only connection\n\n"
            "Connection could not be established. The failure category is recorded without "
            "including raw database-driver text or credentials. No schema-changing SQL was executed.\n\n"
            "## Connection validation\n\n"
            f"- Exception class: `{type(exc).__name__}`\n"
            f"- Failure category: `{failure_category}`\n"
            f"- PostgreSQL SQLSTATE: `{sqlstate}`\n"
            f"- Safe error description: `{safe_description}`\n"
            f"- Session Pooler endpoint: `{host}`\n"
            f"- Session Pooler hostname validated: `{host.endswith(SUPABASE_POOLER_SUFFIX)}`\n"
            f"- Port: `{parsed_url.port or 5432}`\n"
            f"- Database configured: `{parsed_url.database or 'not set'}`\n"
            f"- Connected user: not established (configured username validated: `{configured_username == expected_pooler_username}`)\n"
            f"- DNS resolution: succeeded before connection attempt\n"
            f"- SSL status: not established\n"
            f"- Configured endpoint/user match requested project reference: `{project_identity_match}`\n"
            "- Connected server identity: not verified (authentication failed)\n"
            "- PostgreSQL version: not available\n\n"
            "## Alembic\n\n"
            f"- Resolved repository head: `{head}`\n"
            f"- Approved revision: `{approved}`\n"
            f"- Revisions match: `{head == approved}`\n\n"
            "## Local migration readiness\n\n"
            f"{local_migration_readiness()}\n"
            "- Alembic graph: one repository head; no multiple-head conflict detected\n\n"
            "## Target state\n\n"
            "- Schemas, existing objects, Auth objects, and Alembic metadata: not inspected because authentication failed\n"
            "- Target emptiness: not confirmed\n"
            "- Schema deployment approval: **NOT GRANTED**\n"
            "\n## Recommendation\n\n"
            "Verify the database password and connection details in the Supabase Session Pooler settings, "
            "update only the ignored local `backend/.env.migration`, and rerun this read-only inspection. "
            "Do not proceed to schema deployment until a successful report confirms the target state.\n"
        )
        print("Read-only Supabase inspection failed; details omitted to protect credentials.")
        return 1
    finally:
        if engine is not None:
            engine.dispose()


if __name__ == "__main__":
    sys.exit(inspect_target())
