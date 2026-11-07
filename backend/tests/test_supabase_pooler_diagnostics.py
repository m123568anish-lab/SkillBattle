import importlib.util
from pathlib import Path


SCRIPT_PATH = (
    Path(__file__).resolve().parents[2]
    / "scripts"
    / "migration"
    / "test_supabase_pooler_connection.py"
)
SPEC = importlib.util.spec_from_file_location("supabase_pooler_probe", SCRIPT_PATH)
assert SPEC is not None and SPEC.loader is not None
PROBE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(PROBE)


class FakeDiagnostic:
    sqlstate = None
    message_primary = "password authentication failed for user probe-user"
    message_detail = "connection URL: postgresql://probe-user:probe-secret@host/db"
    message_hint = "Do not disclose probe-secret"


class FakeDriverError(Exception):
    pgcode = "28P01"
    diag = FakeDiagnostic()


def test_capture_diagnostics_collects_fields_and_redacts_secrets():
    url = "postgresql://probe-user:probe-secret@host/db"
    error = FakeDriverError(f"failed to connect using {url}")

    details = PROBE.capture_diagnostics(
        error,
        password="probe-secret",
        username="probe-user",
        url=url,
    )

    assert details["exception_class"] == "FakeDriverError"
    assert details["pgcode"] == "28P01"
    assert details["diag_sqlstate"] == "unavailable"
    assert details["sqlstate"] == "28P01"
    assert details["message_primary"] == "password authentication failed for user <redacted>"
    assert details["message_detail"] == "connection URL: <redacted-url>"
    assert details["message_hint"] == "Do not disclose <redacted>"
    for value in details.values():
        assert "probe-secret" not in value
        assert "probe-user" not in value
        assert url not in value


def test_capture_diagnostics_uses_diag_sqlstate_when_pgcode_is_missing():
    class DiagnosticOnlyError(Exception):
        diag = type("Diag", (), {"sqlstate": "08006"})()

    details = PROBE.capture_diagnostics(
        DiagnosticOnlyError("connection failed"),
        password="probe-secret",
        username="probe-user",
        url="postgresql://probe-user:probe-secret@host/db",
    )

    assert details["pgcode"] == "unavailable"
    assert details["diag_sqlstate"] == "08006"
    assert details["sqlstate"] == "08006"


def test_capture_diagnostics_marks_missing_server_fields_unavailable():
    details = PROBE.capture_diagnostics(
        RuntimeError("local failure"),
        password="probe-secret",
        username="probe-user",
        url="postgresql://probe-user:probe-secret@host/db",
    )

    assert details["exception_class"] == "RuntimeError"
    assert details["pgcode"] == "unavailable"
    assert details["diag_sqlstate"] == "unavailable"
    assert details["message_primary"] == "unavailable"
    assert details["exception_message"] == "local failure"


def test_project_scoped_username_and_pooler_host_reach_psycopg2(monkeypatch):
    parsed = PROBE.make_url(
        "postgresql://postgres.zdpsncnbavuszdcpflje:test-password"
        "@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"
    )
    received = {}
    sentinel = object()

    def fake_connect(**kwargs):
        received.update(kwargs)
        return sentinel

    monkeypatch.setattr(PROBE.psycopg2, "connect", fake_connect)
    monkeypatch.setenv("PGUSER", "postgres")

    connection = PROBE.connect_to_pooler(parsed)

    assert connection is sentinel
    assert parsed.username == "postgres.zdpsncnbavuszdcpflje"
    assert received["user"] == parsed.username
    assert received["user"] == PROBE.EXPECTED_USER
    assert received["user"] != "postgres"
    assert received["host"] == PROBE.EXPECTED_HOST
    assert received["host"] == parsed.host
    assert received["port"] == PROBE.EXPECTED_PORT
    assert received["sslmode"] == "require"


def test_connection_arguments_do_not_fallback_to_default_username():
    parsed = PROBE.make_url(
        "postgresql://postgres.zdpsncnbavuszdcpflje:test-password"
        "@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"
    )

    arguments = PROBE.psycopg2_connection_arguments(parsed)

    assert arguments["user"] == "postgres.zdpsncnbavuszdcpflje"
    assert arguments["user"] != "postgres"
    assert arguments["host"] == "aws-0-ap-northeast-2.pooler.supabase.com"
