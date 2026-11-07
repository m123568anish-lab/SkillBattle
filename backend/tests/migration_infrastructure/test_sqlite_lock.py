from __future__ import annotations

import asyncio
import ctypes
import os
import sqlite3
import subprocess
import sys
import time
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine

from app.database.migration_infrastructure.epoch_state import (
    EpochControlStateError,
    EpochObjectState,
    classify_epoch_objects,
    require_epoch_objects,
)
from app.database.migration_infrastructure.sqlite_lock import (
    SQLiteFileLock,
    SQLiteLockTimeout,
    UnsupportedSQLiteLockPlatform,
    _reject_reparse_point_aliases,
    canonical_database_path,
)


BACKEND_ROOT = Path(__file__).resolve().parents[2]
WINDOWS_ONLY = pytest.mark.skipif(
    sys.platform != "win32",
    reason="The current implementation uses the Windows LockFileEx API.",
)


def _lock_process(
    database_path: Path,
    mode: str,
    marker_path: Path,
    write_value: int | None = None,
) -> subprocess.Popen[str]:
    code = """
import sqlite3
import sys
from pathlib import Path
from app.database.migration_infrastructure.sqlite_lock import SQLiteFileLock

lock = SQLiteFileLock(sys.argv[1], sys.argv[2], timeout=10)
lock.acquire()
if len(sys.argv) > 4:
    with sqlite3.connect(sys.argv[1], timeout=5) as connection:
        connection.execute("INSERT INTO coordinated_writes (value) VALUES (?)", (int(sys.argv[4]),))
Path(sys.argv[3]).write_text("acquired", encoding="utf-8")
print("acquired", flush=True)
sys.stdin.readline()
lock.release()
"""
    return subprocess.Popen(
        [
            sys.executable,
            "-c",
            code,
            str(database_path),
            mode,
            str(marker_path),
            *([str(write_value)] if write_value is not None else []),
        ],
        cwd=BACKEND_ROOT,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )


def _wait_for_marker(marker: Path, process: subprocess.Popen[str]) -> None:
    deadline = time.monotonic() + 5
    while time.monotonic() < deadline:
        if marker.exists():
            return
        if process.poll() is not None:
            stdout, stderr = process.communicate()
            raise AssertionError(
                f"Lock subprocess exited {process.returncode}: {stdout}\n{stderr}"
            )
        time.sleep(0.01)
    raise AssertionError(f"Lock subprocess did not acquire before timeout: {marker}")


def _release_process(process: subprocess.Popen[str]) -> None:
    if process.poll() is None and process.stdin is not None:
        process.stdin.write("release\n")
        process.stdin.flush()
    process.wait(timeout=5)


@WINDOWS_ONLY
def test_two_independent_migration_processes_serialize(tmp_path: Path) -> None:
    database_path = tmp_path / "process-lock.db"
    first_marker = tmp_path / "first.ready"
    second_marker = tmp_path / "second.ready"
    first = _lock_process(database_path, "exclusive", first_marker)
    second = None
    try:
        _wait_for_marker(first_marker, first)
        second = _lock_process(database_path, "exclusive", second_marker)
        time.sleep(0.15)
        assert not second_marker.exists()

        _release_process(first)
        _wait_for_marker(second_marker, second)
        _release_process(second)
    finally:
        if first.poll() is None:
            first.kill()
            first.wait(timeout=5)
        if second is not None and second.poll() is None:
            second.kill()
            second.wait(timeout=5)


@WINDOWS_ONLY
def test_exclusive_lock_waits_for_shared_users(tmp_path: Path) -> None:
    database_path = tmp_path / "shared-lock.db"
    marker = tmp_path / "shared.ready"
    holder = _lock_process(database_path, "shared", marker)
    try:
        _wait_for_marker(marker, holder)
        with pytest.raises(SQLiteLockTimeout):
            SQLiteFileLock(database_path, "exclusive", timeout=0.1).acquire()
        _release_process(holder)
        with SQLiteFileLock(database_path, "exclusive", timeout=1):
            pass
    finally:
        if holder.poll() is None:
            holder.kill()
            holder.wait(timeout=5)


@WINDOWS_ONLY
def test_coordinated_concurrent_process_writes_are_preserved(tmp_path: Path) -> None:
    database_path = tmp_path / "concurrent-writes.db"
    with sqlite3.connect(database_path) as connection:
        connection.execute("CREATE TABLE coordinated_writes (value INTEGER NOT NULL)")

    first_marker = tmp_path / "writer-one.ready"
    second_marker = tmp_path / "writer-two.ready"
    first = _lock_process(database_path, "shared", first_marker, 1)
    second = _lock_process(database_path, "shared", second_marker, 2)
    try:
        _wait_for_marker(first_marker, first)
        _wait_for_marker(second_marker, second)
        _release_process(first)
        _release_process(second)

        with sqlite3.connect(database_path) as connection:
            values = connection.execute(
                "SELECT value FROM coordinated_writes ORDER BY value"
            ).fetchall()
        assert values == [(1,), (2,)]
    finally:
        for process in (first, second):
            if process.poll() is None:
                process.kill()
                process.wait(timeout=5)


@WINDOWS_ONLY
def test_shared_application_access_is_blocked_by_exclusive_transition(
    tmp_path: Path,
) -> None:
    database_path = tmp_path / "transition-lock.db"
    marker = tmp_path / "exclusive.ready"
    migration = _lock_process(database_path, "exclusive", marker)
    try:
        _wait_for_marker(marker, migration)
        with pytest.raises(SQLiteLockTimeout):
            SQLiteFileLock(database_path, "shared", timeout=0.1).acquire()
    finally:
        _release_process(migration)


@WINDOWS_ONLY
def test_process_termination_releases_kernel_lock_and_preserves_transition_state(
    tmp_path: Path,
) -> None:
    database_path = tmp_path / "crash-recovery.db"
    with sqlite3.connect(database_path) as connection:
        connection.execute("CREATE TABLE transition_state (value TEXT NOT NULL)")
        connection.execute("INSERT INTO transition_state VALUES ('started')")

    marker = tmp_path / "crash-holder.ready"
    holder = _lock_process(database_path, "exclusive", marker)
    try:
        _wait_for_marker(marker, holder)
        holder.kill()
        holder.wait(timeout=5)

        with SQLiteFileLock(database_path, "exclusive", timeout=1):
            with sqlite3.connect(database_path) as connection:
                state = connection.execute(
                    "SELECT value FROM transition_state"
                ).fetchone()[0]
        assert state == "started"
    finally:
        if holder.poll() is None:
            holder.kill()
            holder.wait(timeout=5)


@WINDOWS_ONLY
def test_stale_pid_metadata_does_not_block_released_kernel_lock(tmp_path: Path) -> None:
    database_path = tmp_path / "stale-owner.db"
    lock = SQLiteFileLock(database_path, "exclusive", timeout=1)
    lock.lock_path.write_text("owner_pid=99999999\n", encoding="utf-8")

    with lock:
        assert lock.lock_path.exists()
    assert lock.lock_path.exists()


@WINDOWS_ONLY
def test_live_lock_times_out_without_bypassing_owner(tmp_path: Path) -> None:
    database_path = tmp_path / "timeout.db"
    marker = tmp_path / "timeout-holder.ready"
    holder = _lock_process(database_path, "exclusive", marker)
    try:
        _wait_for_marker(marker, holder)
        started = time.monotonic()
        with pytest.raises(SQLiteLockTimeout):
            SQLiteFileLock(database_path, "exclusive", timeout=0.1).acquire()
        assert time.monotonic() - started >= 0.09
        assert holder.poll() is None
    finally:
        _release_process(holder)


@WINDOWS_ONLY
def test_canonical_paths_resolve_dot_segments_and_symlink_aliases(
    tmp_path: Path,
) -> None:
    database_path = tmp_path / "canonical.db"
    alias_path = tmp_path / "nested" / ".." / "canonical.db"
    alias_path.parent.mkdir(exist_ok=True)
    assert canonical_database_path(database_path) == canonical_database_path(alias_path)

    symlink_path = tmp_path / "alias.db"
    try:
        symlink_path.symlink_to(database_path)
    except OSError as error:
        pytest.skip(f"Symlink creation is unavailable: {error}")
    assert canonical_database_path(database_path) == canonical_database_path(symlink_path)
    with pytest.raises(UnsupportedSQLiteLockPlatform):
        SQLiteFileLock(symlink_path, "shared")


@WINDOWS_ONLY
def test_hard_linked_database_identity_is_rejected(tmp_path: Path) -> None:
    database_path = tmp_path / "hardlink-source.db"
    hard_link_path = tmp_path / "hardlink-alias.db"
    with sqlite3.connect(database_path) as connection:
        connection.execute("CREATE TABLE sample (id INTEGER)")
    try:
        os.link(database_path, hard_link_path)
    except OSError as error:
        pytest.skip(f"Hard-link creation is unavailable: {error}")

    with pytest.raises(UnsupportedSQLiteLockPlatform, match="Hard-linked"):
        SQLiteFileLock(database_path, "exclusive")


@WINDOWS_ONLY
@pytest.mark.asyncio
async def test_async_acquisition_does_not_block_event_loop(tmp_path: Path) -> None:
    database_path = tmp_path / "async-lock.db"
    marker = tmp_path / "async-holder.ready"
    holder = _lock_process(database_path, "exclusive", marker)
    ticks = 0

    async def tick() -> None:
        nonlocal ticks
        for _ in range(10):
            ticks += 1
            await asyncio.sleep(0.01)

    try:
        _wait_for_marker(marker, holder)
        shared = SQLiteFileLock(database_path, "shared", timeout=0.15)
        try:
            await asyncio.gather(shared.acquire_async(), tick())
        except SQLiteLockTimeout:
            pass
        else:
            raise AssertionError("Shared acquisition unexpectedly bypassed the owner.")
        assert ticks == 10
    finally:
        _release_process(holder)

    async with SQLiteFileLock(database_path, "shared", timeout=1):
        pass


@WINDOWS_ONLY
@pytest.mark.parametrize("journal_mode", ["delete", "wal"])
def test_disposable_sqlite_database_with_supported_journal_modes(
    tmp_path: Path,
    journal_mode: str,
) -> None:
    database_path = tmp_path / f"journal-{journal_mode}.db"
    with sqlite3.connect(database_path) as connection:
        actual_mode = connection.execute(
            f"PRAGMA journal_mode = {journal_mode.upper()}"
        ).fetchone()[0]
        assert actual_mode.lower() == journal_mode
        connection.execute("CREATE TABLE values_table (value INTEGER NOT NULL)")

    with SQLiteFileLock(database_path, "exclusive"):
        with sqlite3.connect(database_path) as connection:
            connection.execute("INSERT INTO values_table VALUES (1)")
    with sqlite3.connect(database_path) as connection:
        assert connection.execute("SELECT value FROM values_table").fetchall() == [(1,)]


@WINDOWS_ONLY
def test_uncoordinated_direct_writer_is_not_blocked_by_sidecar_lock(
    tmp_path: Path,
) -> None:
    database_path = tmp_path / "uncoordinated-writer.db"
    with sqlite3.connect(database_path) as connection:
        connection.execute("CREATE TABLE direct_writes (value INTEGER NOT NULL)")

    with SQLiteFileLock(database_path, "exclusive"):
        with sqlite3.connect(database_path) as connection:
            connection.execute("INSERT INTO direct_writes VALUES (7)")
    with sqlite3.connect(database_path) as connection:
        assert connection.execute("SELECT value FROM direct_writes").fetchone() == (7,)


@WINDOWS_ONLY
def test_unintegrated_sqlalchemy_sync_pool_can_bypass_sidecar_lock(
    tmp_path: Path,
) -> None:
    database_path = tmp_path / "sync-pool-bypass.db"
    engine = create_engine(f"sqlite:///{database_path}")
    try:
        with SQLiteFileLock(database_path, "exclusive"):
            with engine.connect() as connection:
                assert connection.exec_driver_sql("SELECT 1").scalar_one() == 1
    finally:
        engine.dispose()


@WINDOWS_ONLY
@pytest.mark.asyncio
async def test_unintegrated_sqlalchemy_async_pool_can_bypass_sidecar_lock(
    tmp_path: Path,
) -> None:
    database_path = tmp_path / "async-pool-bypass.db"
    engine = create_async_engine(f"sqlite+aiosqlite:///{database_path}")
    try:
        with SQLiteFileLock(database_path, "exclusive"):
            async with engine.connect() as connection:
                result = await connection.exec_driver_sql("SELECT 1")
                assert result.scalar_one() == 1
    finally:
        await engine.dispose()


def test_network_paths_are_rejected_without_opening_a_lock_file() -> None:
    if sys.platform != "win32":
        pytest.skip("UNC paths are a Windows-specific filesystem case.")
    with pytest.raises(UnsupportedSQLiteLockPlatform):
        SQLiteFileLock(r"\\server\share\database.db", "exclusive")


@WINDOWS_ONLY
def test_reparse_point_path_aliases_are_rejected_without_symlink_privilege(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    class FakeFunction:
        argtypes = None
        restype = None

        def __init__(self, callback):
            self.callback = callback

        def __call__(self, path):
            return self.callback(path)

    class FakeKernel:
        GetFileAttributesW = FakeFunction(
            lambda path: (
                0x00000400
                if Path(path).name == "alias"
                else 0x00000080
            )
        )

    volume_root = Path(tmp_path.anchor)
    alias_path = tmp_path / "alias" / "database.db"
    monkeypatch.setattr(ctypes, "WinDLL", lambda *_args, **_kwargs: FakeKernel())

    with pytest.raises(UnsupportedSQLiteLockPlatform, match="reparse points"):
        _reject_reparse_point_aliases(alias_path, str(volume_root))


def test_partial_epoch_control_objects_are_refused() -> None:
    assert classify_epoch_objects(set()) == EpochObjectState.ABSENT
    assert classify_epoch_objects(
        {"qubira_epoch_control", "qubira_epoch_audit"}
    ) == EpochObjectState.CONTROL_BOOTSTRAPPED
    assert classify_epoch_objects(
        {
            "qubira_epoch_control",
            "qubira_epoch_audit",
            "alembic_version_epoch",
        }
    ) == EpochObjectState.COMPLETE
    with pytest.raises(EpochControlStateError):
        classify_epoch_objects({"qubira_epoch_control"})
    with pytest.raises(EpochControlStateError):
        require_epoch_objects(
            {"qubira_epoch_control", "alembic_version_epoch"},
            EpochObjectState.CONTROL_BOOTSTRAPPED,
        )


def test_legacy_runner_gate_refuses_epoch_state_in_disposable_sqlite(
    tmp_path: Path,
) -> None:
    from app.database.migration_infrastructure.epoch_state import (
        assert_legacy_runner_allowed,
    )

    database_path = tmp_path / "legacy-gate.db"
    with sqlite3.connect(database_path) as connection:
        tables = {
            row[0]
            for row in connection.execute(
                "SELECT name FROM sqlite_master WHERE type = 'table'"
            )
        }
        assert_legacy_runner_allowed(tables) is None

        connection.execute("CREATE TABLE qubira_epoch_control (id INTEGER)")
        connection.execute("CREATE TABLE qubira_epoch_audit (id INTEGER)")
        tables = {
            row[0]
            for row in connection.execute(
                "SELECT name FROM sqlite_master WHERE type = 'table'"
            )
        }
        with pytest.raises(EpochControlStateError):
            assert_legacy_runner_allowed(tables)

        connection.execute("CREATE TABLE alembic_version_epoch (version_num TEXT)")
        tables = {
            row[0]
            for row in connection.execute(
                "SELECT name FROM sqlite_master WHERE type = 'table'"
            )
        }
        with pytest.raises(EpochControlStateError):
            assert_legacy_runner_allowed(tables)
