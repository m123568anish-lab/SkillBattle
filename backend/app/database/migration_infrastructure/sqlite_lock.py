from __future__ import annotations

import asyncio
import ctypes
import hashlib
import os
import sys
import time
from ctypes import wintypes
from pathlib import Path
from typing import Literal


LockMode = Literal["shared", "exclusive"]


class SQLiteLockError(RuntimeError):
    """Base error for SQLite lock acquisition and platform failures."""


class UnsupportedSQLiteLockPlatform(SQLiteLockError):
    """Raised when the SQLite lock cannot guarantee local filesystem semantics."""


class SQLiteLockTimeout(SQLiteLockError, TimeoutError):
    """Raised when a cooperative SQLite lock is not acquired before the deadline."""


class _Overlapped(ctypes.Structure):
    _fields_ = [
        ("Internal", ctypes.c_size_t),
        ("InternalHigh", ctypes.c_size_t),
        ("Offset", wintypes.DWORD),
        ("OffsetHigh", wintypes.DWORD),
        ("hEvent", wintypes.HANDLE),
    ]


def canonical_database_path(database_path: str | os.PathLike[str]) -> Path:
    raw_path = os.fspath(database_path)
    if raw_path == ":memory:" or raw_path.startswith("file:"):
        raise UnsupportedSQLiteLockPlatform(
            "The coordinated SQLite lock requires a file-backed database path."
        )
    path = Path(raw_path).expanduser().resolve(strict=False)
    if not path.is_absolute():
        raise UnsupportedSQLiteLockPlatform("The SQLite database path must be absolute.")
    return path


def _absolute_unresolved_path(database_path: str | os.PathLike[str]) -> Path:
    raw_path = os.fspath(database_path)
    if raw_path == ":memory:" or raw_path.startswith("file:"):
        raise UnsupportedSQLiteLockPlatform(
            "The coordinated SQLite lock requires a file-backed database path."
        )
    path = Path(raw_path).expanduser()
    if not path.is_absolute():
        path = Path.cwd() / path
    return Path(os.path.abspath(path))


def assert_database_identity_supported(
    database_path: str | os.PathLike[str],
) -> Path:
    """Reject unresolved path aliases and hard-linked database files."""
    unresolved_path = _absolute_unresolved_path(database_path)
    _ensure_supported_local_filesystem(unresolved_path)
    canonical_path = canonical_database_path(unresolved_path)
    if canonical_path.exists():
        if not canonical_path.is_file():
            raise UnsupportedSQLiteLockPlatform(
                "The SQLite database path is not a regular file."
            )
        try:
            link_count = canonical_path.stat().st_nlink
        except OSError as error:
            raise UnsupportedSQLiteLockPlatform(
                "The SQLite database file identity could not be verified."
            ) from error
        if link_count != 1:
            raise UnsupportedSQLiteLockPlatform(
                "Hard-linked SQLite database files are not supported."
            )
    return canonical_path


def _lock_file_path(database_path: Path) -> Path:
    identity = os.path.normcase(str(database_path)).casefold().encode("utf-8")
    suffix = hashlib.sha256(identity).hexdigest()
    return database_path.parent / f".qubira-sqlite-{suffix}.lock"


def _ensure_supported_local_filesystem(database_path: Path) -> None:
    if sys.platform != "win32":
        raise UnsupportedSQLiteLockPlatform(
            "Only Windows local-filesystem locking is implemented; POSIX support is not enabled."
        )
    if str(database_path).startswith("\\\\"):
        raise UnsupportedSQLiteLockPlatform("UNC and network paths are not supported.")

    kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
    get_volume_path = kernel32.GetVolumePathNameW
    get_volume_path.argtypes = [
        wintypes.LPCWSTR,
        wintypes.LPWSTR,
        wintypes.DWORD,
    ]
    get_volume_path.restype = wintypes.BOOL
    volume_path = ctypes.create_unicode_buffer(32768)
    if not get_volume_path(str(database_path), volume_path, len(volume_path)):
        raise UnsupportedSQLiteLockPlatform(
            "The database path's local volume could not be verified."
        )

    get_drive_type = kernel32.GetDriveTypeW
    get_drive_type.argtypes = [wintypes.LPCWSTR]
    get_drive_type.restype = ctypes.c_uint
    drive_type = get_drive_type(volume_path.value)
    if drive_type != 3:  # DRIVE_FIXED
        raise UnsupportedSQLiteLockPlatform(
            "SQLite locks are supported only on a Windows fixed local drive."
        )

    get_volume_information = kernel32.GetVolumeInformationW
    get_volume_information.argtypes = [
        wintypes.LPCWSTR,
        wintypes.LPWSTR,
        wintypes.DWORD,
        ctypes.POINTER(wintypes.DWORD),
        ctypes.POINTER(wintypes.DWORD),
        ctypes.POINTER(wintypes.DWORD),
        wintypes.LPWSTR,
        wintypes.DWORD,
    ]
    get_volume_information.restype = wintypes.BOOL
    filesystem_name = ctypes.create_unicode_buffer(32)
    if not get_volume_information(
        volume_path.value,
        None,
        0,
        None,
        None,
        None,
        filesystem_name,
        len(filesystem_name),
    ):
        raise UnsupportedSQLiteLockPlatform(
            "The database filesystem type could not be verified."
        )
    if filesystem_name.value.upper() != "NTFS":
        raise UnsupportedSQLiteLockPlatform(
            "Only NTFS volumes are supported by this initial Windows lock implementation."
        )
    _reject_reparse_point_aliases(database_path, volume_path.value)


def _reject_reparse_point_aliases(database_path: Path, volume_path: str) -> None:
    get_attributes = ctypes.WinDLL("kernel32", use_last_error=True).GetFileAttributesW
    get_attributes.argtypes = [wintypes.LPCWSTR]
    get_attributes.restype = wintypes.DWORD

    relative_parts = database_path.relative_to(Path(volume_path)).parts
    current = Path(volume_path)
    for index, part in enumerate(relative_parts):
        current = current / part
        attributes = get_attributes(str(current))
        if attributes == 0xFFFFFFFF:
            error = ctypes.get_last_error()
            if error in (2, 3) and index == len(relative_parts) - 1:
                continue
            raise UnsupportedSQLiteLockPlatform(
                "The database path contains an unresolved or inaccessible alias."
            )
        if attributes & 0x00000400:  # FILE_ATTRIBUTE_REPARSE_POINT
            raise UnsupportedSQLiteLockPlatform(
                "SQLite lock paths through symlinks, junctions, or other reparse points "
                "are not supported."
            )


def _windows_lock_api():
    kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
    lock_file_ex = kernel32.LockFileEx
    lock_file_ex.argtypes = [
        wintypes.HANDLE,
        wintypes.DWORD,
        wintypes.DWORD,
        wintypes.DWORD,
        wintypes.DWORD,
        ctypes.POINTER(_Overlapped),
    ]
    lock_file_ex.restype = wintypes.BOOL
    unlock_file_ex = kernel32.UnlockFileEx
    unlock_file_ex.argtypes = [
        wintypes.HANDLE,
        wintypes.DWORD,
        wintypes.DWORD,
        wintypes.DWORD,
        ctypes.POINTER(_Overlapped),
    ]
    unlock_file_ex.restype = wintypes.BOOL
    return lock_file_ex, unlock_file_ex


class SQLiteFileLock:
    """Cooperative Windows lock held on a persistent sidecar file.

    The lock coordinates only Qubira processes that acquire this sidecar lock.
    It does not prevent an external process from opening the SQLite file directly.
    """

    def __init__(
        self,
        database_path: str | os.PathLike[str],
        mode: LockMode,
        timeout: float = 5.0,
    ) -> None:
        if mode not in ("shared", "exclusive"):
            raise ValueError(f"Unsupported SQLite lock mode: {mode!r}")
        if timeout < 0:
            raise ValueError("Lock timeout must be non-negative.")
        self.database_path = assert_database_identity_supported(database_path)
        self.lock_path = _lock_file_path(self.database_path)
        _ensure_supported_local_filesystem(self.lock_path)
        if self.lock_path.exists() and self.lock_path.stat().st_nlink != 1:
            raise UnsupportedSQLiteLockPlatform(
                "Hard-linked SQLite lock files are not supported."
            )
        self.mode = mode
        self.timeout = timeout
        self._file = None
        self._overlapped = None
        self._acquired = False

    def acquire(self) -> None:
        if self._acquired:
            raise SQLiteLockError("This lock instance is already acquired.")
        if self._file is not None:
            raise SQLiteLockError("This lock instance is already acquiring or has failed.")
        if not self.database_path.parent.is_dir():
            raise FileNotFoundError(
                f"SQLite database directory does not exist: {self.database_path.parent}"
            )

        import msvcrt

        self._file = open(self.lock_path, "a+b", buffering=0)
        try:
            if os.fstat(self._file.fileno()).st_nlink != 1:
                raise UnsupportedSQLiteLockPlatform(
                    "Hard-linked SQLite lock files are not supported."
                )
            lock_file_ex, _ = _windows_lock_api()
            self._overlapped = _Overlapped()
            os_handle = msvcrt.get_osfhandle(self._file.fileno())
            flags = 0x00000001  # LOCKFILE_FAIL_IMMEDIATELY
            if self.mode == "exclusive":
                flags |= 0x00000002  # LOCKFILE_EXCLUSIVE_LOCK

            deadline = time.monotonic() + self.timeout
            while True:
                acquired = lock_file_ex(
                    os_handle,
                    flags,
                    0,
                    1,
                    0,
                    ctypes.byref(self._overlapped),
                )
                if acquired:
                    self._acquired = True
                    try:
                        if (
                            assert_database_identity_supported(self.database_path)
                            != self.database_path
                        ):
                            raise UnsupportedSQLiteLockPlatform(
                                "The SQLite database path identity changed during lock acquisition."
                            )
                    except BaseException:
                        self.release()
                        raise
                    return

                error = ctypes.get_last_error()
                if error not in (33, 158):  # ERROR_LOCK_VIOLATION, ERROR_LOCK_NOT_GRANTED
                    raise ctypes.WinError(error)
                if time.monotonic() >= deadline:
                    raise SQLiteLockTimeout(
                        f"Timed out acquiring {self.mode} SQLite lock after {self.timeout:.3f}s."
                    )
                time.sleep(min(0.025, max(0.0, deadline - time.monotonic())))
        except BaseException:
            if not self._acquired:
                self._close_file()
            raise

    async def acquire_async(self) -> None:
        acquisition = asyncio.create_task(asyncio.to_thread(self.acquire))
        try:
            await asyncio.shield(acquisition)
        except asyncio.CancelledError:
            try:
                await acquisition
            except (OSError, SQLiteLockError):
                pass
            if self._acquired:
                self.release()
            raise

    def release(self) -> None:
        if not self._acquired or self._file is None or self._overlapped is None:
            return
        import msvcrt

        _, unlock_file_ex = _windows_lock_api()
        os_handle = msvcrt.get_osfhandle(self._file.fileno())
        unlocked = unlock_file_ex(
            os_handle,
            0,
            1,
            0,
            ctypes.byref(self._overlapped),
        )
        if not unlocked:
            error = ctypes.get_last_error()
            raise ctypes.WinError(error)
        self._acquired = False
        self._close_file()

    def _close_file(self) -> None:
        if self._file is not None:
            self._file.close()
            self._file = None
        self._overlapped = None

    def __enter__(self) -> SQLiteFileLock:
        self.acquire()
        return self

    def __exit__(self, *_: object) -> None:
        self.release()

    async def __aenter__(self) -> SQLiteFileLock:
        await self.acquire_async()
        return self

    async def __aexit__(self, *_: object) -> None:
        await asyncio.to_thread(self.release)
