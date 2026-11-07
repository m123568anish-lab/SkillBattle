"""One-shot, read-only Supabase Session Pooler diagnostic using Psycopg2."""

from __future__ import annotations

import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote, unquote, urlsplit

import psycopg2
from alembic.config import Config
from alembic.script import ScriptDirectory
from alembic.util.exc import CommandError
from sqlalchemy.engine import make_url
from sqlalchemy.exc import ArgumentError

REPO_ROOT = Path(__file__).resolve().parents[2]
ENV_FILE = REPO_ROOT / "backend" / ".env.migration"
REPORT_FILE = REPO_ROOT / "SUPABASE_AUTH_ROOT_CAUSE_REPORT.md"
EXPECTED_PROJECT_REF = "zdpsncnbavuszdcpflje"
EXPECTED_HOST = "aws-0-ap-northeast-2.pooler.supabase.com"
EXPECTED_USER = f"postgres.{EXPECTED_PROJECT_REF}"
EXPECTED_PORT = 5432
EXPECTED_DATABASE = "postgres"


def psycopg2_connection_arguments(parsed_url: object) -> dict[str, object]:
    """Build explicit driver arguments without username or endpoint fallbacks."""
    return {
        "host": parsed_url.host,
        "port": parsed_url.port,
        "dbname": parsed_url.database,
        "user": parsed_url.username,
        "password": parsed_url.password,
        "sslmode": "require",
        "connect_timeout": 10,
        "application_name": "qubira_phase3a_readonly_diagnostic",
    }


def connect_to_pooler(parsed_url: object) -> object:
    return psycopg2.connect(**psycopg2_connection_arguments(parsed_url))


def repository_head() -> str:
    config = Config(str(REPO_ROOT / "backend" / "alembic.ini"))
    heads = ScriptDirectory.from_config(config).get_heads()
    if len(heads) != 1:
        raise RuntimeError("The checked-in Alembic graph must have exactly one head.")
    return heads[0]


def read_env_file(path: Path = ENV_FILE) -> dict[str, str]:
    values: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip("\"'")
    return values


def redact_diagnostic(
    message: str | None,
    *,
    password: str,
    username: str,
    url: str,
) -> str:
    if not message:
        return "unavailable"
    safe = message
    try:
        authority = urlsplit(url).netloc
        userinfo = authority.rsplit("@", 1)[0]
        raw_password = userinfo.split(":", 1)[1] if ":" in userinfo else ""
    except ValueError:
        raw_password = ""

    safe = re.sub(
        r"(?i)\b(?:postgres(?:ql)?(?:\+\w+)?|https?)://[^\s\"'<>]+",
        "<redacted-url>",
        safe,
    )
    for secret in (password, quote(password, safe=""), raw_password, username, url):
        if secret:
            safe = safe.replace(secret, "<redacted>")
    safe = re.sub(r"(?i)\b(password|passfile)\s*=\s*[^,\s]+", r"\1=<redacted>", safe)
    safe = re.sub(r"[\r\n\t]+", " ", safe).strip()
    return safe or "unavailable"


def capture_diagnostics(
    exc: BaseException,
    *,
    password: str,
    username: str,
    url: str,
) -> dict[str, str]:
    diag = getattr(exc, "diag", None)

    def safe_attribute(obj: object | None, name: str) -> str:
        if obj is None:
            return "unavailable"
        try:
            value = getattr(obj, name, None)
        except Exception:
            return "unavailable"
        if value is None:
            return "unavailable"
        return redact_diagnostic(
            str(value),
            password=password,
            username=username,
            url=url,
        )

    pgcode = safe_attribute(exc, "pgcode")
    diag_sqlstate = safe_attribute(diag, "sqlstate")
    sqlstate = pgcode if pgcode != "unavailable" else diag_sqlstate
    try:
        exception_message = str(exc)
    except Exception:
        exception_message = "unavailable"

    return {
        "exception_class": type(exc).__name__,
        "pgcode": pgcode,
        "diag_sqlstate": diag_sqlstate,
        "sqlstate": sqlstate,
        "message_primary": safe_attribute(diag, "message_primary"),
        "message_detail": safe_attribute(diag, "message_detail"),
        "message_hint": safe_attribute(diag, "message_hint"),
        "exception_message": redact_diagnostic(
            exception_message,
            password=password,
            username=username,
            url=url,
        ),
    }


def markdown_safe(value: str) -> str:
    return value.replace("|", "\\|").replace("`", "'")


def write_report(body: str) -> None:
    REPORT_FILE.write_text(
        "# Supabase Session Pooler Authentication Root-Cause Report\n\n"
        f"Generated: {datetime.now(timezone.utc).isoformat()}\n\n"
        + body.rstrip()
        + "\n",
        encoding="utf-8",
    )


def main() -> int:
    try:
        values = read_env_file()
    except OSError as exc:
        write_report(
            "## Status: BLOCKED — local env file unavailable\n\n"
            f"- Read error type: `{type(exc).__name__}`\n"
            "- No connection attempt was made.\n"
        )
        print("Blocked: local Supabase env file could not be read.")
        return 2

    raw_url = values.get("SUPABASE_DATABASE_URL", "")
    project_ref = values.get("SUPABASE_PROJECT_REF", "")
    approved_revision = values.get("APPROVED_ALEMBIC_REVISION", "")
    try:
        current_head = repository_head()
    except (OSError, RuntimeError, CommandError) as exc:
        write_report(
            "## Status: BLOCKED — checked-in Alembic graph is invalid\n\n"
            f"- Graph error type: `{type(exc).__name__}`\n"
            "- No connection attempt was made.\n"
        )
        print("Blocked: the checked-in Alembic graph did not resolve to one head.")
        return 2
    try:
        parsed = make_url(raw_url)
    except (ArgumentError, TypeError) as exc:
        write_report(
            "## Status: BLOCKED — SQLAlchemy URL parsing failed\n\n"
            f"- Parse exception type: `{type(exc).__name__}`\n"
            "- No connection attempt was made.\n"
            "- The connection string and credentials are omitted.\n"
        )
        print("Blocked: SQLAlchemy could not parse the local URL.")
        return 2

    password = parsed.password or ""
    checks = {
        "project_reference": project_ref == EXPECTED_PROJECT_REF,
        "approved_revision_matches_repository_head": approved_revision == current_head,
        "postgresql_scheme": parsed.drivername in {"postgres", "postgresql", "postgresql+psycopg2"},
        "pooler_host": parsed.host == EXPECTED_HOST,
        "project_scoped_username": parsed.username == EXPECTED_USER,
        "port": parsed.port == EXPECTED_PORT,
        "database": parsed.database == EXPECTED_DATABASE,
        "password_present": bool(password),
        "password_no_edge_whitespace": bool(password) and password == password.strip(),
    }
    if not all(checks.values()):
        check_lines = "\n".join(f"- {name}: `{result}`" for name, result in checks.items())
        write_report(
            "## Status: BLOCKED — safe configuration guard failed\n\n"
            f"{check_lines}\n\n"
            "- No connection attempt was made.\n"
            "- Password, URL, and other credential values are omitted.\n"
        )
        print("Blocked: one or more local endpoint guards failed; see report.")
        return 2

    expected_encoded_password = quote(password, safe="")
    raw_userinfo = raw_url.split("://", 1)[-1].rsplit("@", 1)[0]
    encoded_password = raw_userinfo.split(":", 1)[1] if ":" in raw_userinfo else ""
    canonical_encoding_match = encoded_password.lower() == expected_encoded_password.lower()
    decoded_once_match = unquote(encoded_password) == password
    decoded_password_has_escape_token = bool(re.search(r"%[0-9a-fA-F]{2}", password))

    if "--validate-config-only" in sys.argv[1:]:
        print(
            f"Local configuration guards passed: {all(checks.values())}; "
            f"approved revision matches repository head: {checks['approved_revision_matches_repository_head']}; "
            f"one-layer decoding match: {decoded_once_match}; "
            f"canonical URL encoding match: {canonical_encoding_match}; "
            f"parsed value has residual escape token: {decoded_password_has_escape_token}; "
            f"URL username: {parsed.username}; "
            f"SQLAlchemy URL username: {parsed.username}; "
            f"Psycopg2 user argument: {parsed.username}; "
            f"URL host: {parsed.host}; Psycopg2 host argument: {parsed.host}; "
            f"URL port: {parsed.port}; Psycopg2 port argument: {parsed.port}; "
            f"PGUSER environment override set: {bool(os.environ.get('PGUSER'))}; "
            "explicit Psycopg2 user argument takes precedence over PGUSER; "
            "username/host fallback applied: False; "
            "no connection attempted."
        )
        return 0

    connection = None
    try:
        connection = connect_to_pooler(parsed)
        connection.set_session(readonly=True, autocommit=False)
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT current_database(),
                       current_user,
                       version(),
                       inet_server_addr()::text,
                       inet_server_port()
                """
            )
            database, user, version, server_address, server_port = cursor.fetchone()
            try:
                cursor.execute(
                    """
                    SELECT ssl, version, cipher
                    FROM pg_catalog.pg_stat_ssl
                    WHERE pid = pg_backend_pid()
                    """
                )
                ssl_status = cursor.fetchone()
                ssl_query_sqlstate = None
            except psycopg2.Error as exc:
                ssl_status = None
                ssl_query_sqlstate = getattr(exc, "pgcode", None) or "unavailable"
                connection.rollback()
                connection.set_session(readonly=True, autocommit=False)

        identity_matches = (
            database == EXPECTED_DATABASE
            and user == EXPECTED_USER
            and parsed.host == EXPECTED_HOST
        )
        ssl_summary = (
            f"enabled; TLS `{ssl_status[1]}`; cipher `{ssl_status[2]}`"
            if ssl_status and ssl_status[0]
            else "connection required SSL; pg_stat_ssl unavailable or returned no row"
        )
        write_report(
            "## Status: connected — read-only identity check succeeded\n\n"
            "- Connection method: direct Psycopg2 keyword connection, using the password decoded once by SQLAlchemy `make_url`.\n"
            "- SSL mode: `require`.\n"
            "- Transaction: read-only.\n"
            f"- Configured project reference matches expected: `{checks['project_reference']}`\n"
            f"- Session Pooler host: `{parsed.host}`\n"
            f"- Connected database: `{database}`\n"
            f"- Connected user: `{user}`\n"
            f"- Connected endpoint/database/user identity matches expected: `{identity_matches}`\n"
            f"- PostgreSQL version: `{str(version).splitlines()[0]}`\n"
            f"- Server address: `{server_address}`\n"
            f"- Server port: `{server_port}`\n"
            f"- SSL status: {ssl_summary}\n"
            f"- Encoded URL password matches canonical re-encoding of SQLAlchemy's parsed password: `{canonical_encoding_match}`\n"
            f"- `pg_stat_ssl` query SQLSTATE: `{ssl_query_sqlstate or 'none'}`\n"
            "- Canonical re-encoding confirms URL decoding behavior only; it cannot establish that the credential is current or rule out an intentionally double-encoded password.\n"
            "- No DDL or data modifications were performed.\n"
        )
        print("Read-only Psycopg2 connection succeeded; see SUPABASE_AUTH_ROOT_CAUSE_REPORT.md.")
        return 0
    except psycopg2.Error as exc:
        diagnostics = capture_diagnostics(
            exc,
            password=password,
            username=parsed.username or "",
            url=raw_url,
        )
        diagnostic_lines = "\n".join(
            f"- `{label}`: `{markdown_safe(diagnostics[key])}`"
            for label, key in (
                ("Exception class", "exception_class"),
                ("pgcode", "pgcode"),
                ("diag.sqlstate", "diag_sqlstate"),
                ("Effective SQLSTATE", "sqlstate"),
                ("diag.message_primary", "message_primary"),
                ("diag.message_detail", "message_detail"),
                ("diag.message_hint", "message_hint"),
                ("Sanitized exception message", "exception_message"),
            )
        )
        write_report(
            "## Status: connection failed — no retry performed\n\n"
            "- Connection method: direct Psycopg2 keyword connection, using the password decoded once by SQLAlchemy `make_url`.\n"
            "- SSL mode: `require`.\n"
            f"{diagnostic_lines}\n"
            f"- Configured endpoint/user guards passed: `{all(checks.values())}`\n"
            f"- Encoded URL password matches canonical re-encoding of SQLAlchemy's parsed password: `{canonical_encoding_match}`\n"
            "- Canonical re-encoding cannot establish that the credential is current or rule out an intentionally double-encoded password.\n"
            f"- SQLAlchemy password parse agrees with direct one-layer URL decoding: `{decoded_once_match}`\n"
            f"- Parsed password contains a residual `%XX` sequence: `{decoded_password_has_escape_token}`\n"
            "- Connected server identity: not verified.\n"
            "- No retry, DDL, or data modifications were performed.\n"
        )
        print(
            "Connection failed; sanitized exception details written to "
            "SUPABASE_AUTH_ROOT_CAUSE_REPORT.md. No retry performed."
        )
        return 1
    finally:
        if connection is not None:
            connection.close()


if __name__ == "__main__":
    sys.exit(main())
