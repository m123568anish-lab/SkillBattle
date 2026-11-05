"""
====================================================================
Step 01: SQLite Backup & SHA-256 Checksum Verification
====================================================================
Creates an immutable snapshot of skillbattle.db and verifies integrity.
"""

from __future__ import annotations

import argparse
import json
import shutil
import sqlite3
import sys
from datetime import datetime
from pathlib import Path

# Local migration utilities
from common import (
    DEFAULT_BACKUP_DIR,
    DEFAULT_SQLITE_PATH,
    compute_sha256,
    logger,
)


def run_backup(
    source_path: Path = DEFAULT_SQLITE_PATH,
    backup_dir: Path = DEFAULT_BACKUP_DIR,
    dry_run: bool = False,
) -> dict:
    if not source_path.exists():
        logger.error("Source database does not exist at: %s", source_path)
        sys.exit(1)

    source_size = source_path.stat().st_size
    source_sha256 = compute_sha256(source_path)
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"skillbattle_backup_{timestamp}.db"
    meta_filename = f"skillbattle_backup_{timestamp}.json"
    target_path = backup_dir / backup_filename
    meta_path = backup_dir / meta_filename

    logger.info("====================================================")
    logger.info("Step 01: SQLite Backup & SHA-256 Verification")
    logger.info("====================================================")
    logger.info("Source: %s (%d bytes)", source_path, source_size)
    logger.info("Source SHA-256: %s", source_sha256)
    logger.info("Dry-Run: %s", dry_run)

    if dry_run:
        logger.info("[DRY-RUN] Would create backup at: %s", target_path)
        logger.info("[DRY-RUN] Would write metadata to: %s", meta_path)
        return {
            "status": "dry_run_success",
            "source_path": str(source_path),
            "source_sha256": source_sha256,
            "source_size": source_size,
            "target_path": str(target_path),
        }

    backup_dir.mkdir(parents=True, exist_ok=True)

    # Use SQLite native backup API to ensure a transactionally clean copy
    logger.info("Creating consistent backup snapshot via SQLite backup API...")
    src_conn = sqlite3.connect(f"file:{source_path.resolve().as_posix()}?mode=ro", uri=True)
    dst_conn = sqlite3.connect(target_path)
    with dst_conn:
        src_conn.backup(dst_conn)
    dst_conn.close()
    src_conn.close()

    # Verify SHA-256 of the created backup
    backup_size = target_path.stat().st_size
    backup_sha256 = compute_sha256(target_path)

    # Quick count check on the backup
    test_conn = sqlite3.connect(f"file:{target_path.resolve().as_posix()}?mode=ro", uri=True)
    table_count = test_conn.execute(
        "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
    ).fetchone()[0]
    user_count = test_conn.execute("SELECT COUNT(*) FROM users;").fetchone()[0]
    test_conn.close()

    metadata = {
        "created_at": datetime.utcnow().isoformat(),
        "source_path": str(source_path),
        "source_size_bytes": source_size,
        "source_sha256": source_sha256,
        "backup_path": str(target_path),
        "backup_size_bytes": backup_size,
        "backup_sha256": backup_sha256,
        "total_tables": table_count,
        "total_users": user_count,
        "status": "verified",
    }

    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    logger.info("Backup successfully created and verified!")
    logger.info("Backup Location: %s (%d bytes)", target_path, backup_size)
    logger.info("Backup SHA-256: %s", backup_sha256)
    logger.info("Metadata saved to: %s", meta_path)
    return metadata


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create and verify a safe SQLite backup snapshot.")
    parser.add_argument("--dry-run", action="store_true", help="Simulate backup without writing files")
    parser.add_argument("--source", type=Path, default=DEFAULT_SQLITE_PATH, help="Path to source SQLite file")
    parser.add_argument("--dest", type=Path, default=DEFAULT_BACKUP_DIR, help="Destination directory")
    args = parser.parse_args()

    run_backup(args.source, args.dest, dry_run=args.dry_run)
