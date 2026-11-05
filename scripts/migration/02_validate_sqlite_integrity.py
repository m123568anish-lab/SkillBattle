"""
====================================================================
Step 02: SQLite Integrity & Relational Health Validation
====================================================================
Performs deep read-only integrity, foreign-key, and user data checks.
"""

from __future__ import annotations

import argparse
import json
import sqlite3
import sys
import uuid
from pathlib import Path
from typing import Dict, Any, List

from common import (
    DEFAULT_SQLITE_PATH,
    TOPOLOGICAL_MIGRATION_ORDER,
    get_sqlite_ro_uri,
    logger,
)


def run_integrity_validation(db_path: Path = DEFAULT_SQLITE_PATH) -> Dict[str, Any]:
    if not db_path.exists():
        logger.error("Database file not found: %s", db_path)
        sys.exit(1)

    logger.info("====================================================")
    logger.info("Step 02: SQLite Database Health & Integrity Audit")
    logger.info("====================================================")
    logger.info("Connecting in READ-ONLY mode: %s", db_path)

    uri = get_sqlite_ro_uri(db_path)
    conn = sqlite3.connect(uri, uri=True)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    results: Dict[str, Any] = {"passed": True, "checks": {}}

    # 1. PRAGMA integrity_check
    logger.info("Running PRAGMA integrity_check...")
    cursor.execute("PRAGMA integrity_check;")
    integrity = [r[0] for r in cursor.fetchall()]
    passed_integrity = integrity == ["ok"]
    results["checks"]["integrity_check"] = {"status": "ok" if passed_integrity else "failed", "details": integrity}
    if not passed_integrity:
        results["passed"] = False
        logger.error("Integrity check failed: %s", integrity)

    # 2. PRAGMA quick_check
    logger.info("Running PRAGMA quick_check...")
    cursor.execute("PRAGMA quick_check;")
    quick = [r[0] for r in cursor.fetchall()]
    passed_quick = quick == ["ok"]
    results["checks"]["quick_check"] = {"status": "ok" if passed_quick else "failed", "details": quick}
    if not passed_quick:
        results["passed"] = False
        logger.error("Quick check failed: %s", quick)

    # 3. PRAGMA foreign_key_check
    logger.info("Running PRAGMA foreign_key_check with FK enabled...")
    conn.execute("PRAGMA foreign_keys = ON;")
    cursor.execute("PRAGMA foreign_key_check;")
    fk_violations = [dict(r) for r in cursor.fetchall()]
    passed_fk = len(fk_violations) == 0
    results["checks"]["foreign_key_check"] = {
        "status": "ok" if passed_fk else "violations_found",
        "violations_count": len(fk_violations),
        "violations": fk_violations,
    }
    if not passed_fk:
        results["passed"] = False
        logger.error("Foreign key check found %d violations!", len(fk_violations))

    # 4. Check all 78 tables exist
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    existing_tables = set(r[0] for r in cursor.fetchall())
    expected_tables = set(TOPOLOGICAL_MIGRATION_ORDER)
    missing_tables = list(expected_tables - existing_tables)
    results["checks"]["table_existence"] = {
        "expected_count": len(expected_tables),
        "found_count": len(existing_tables),
        "missing": missing_tables,
    }
    if missing_tables:
        results["passed"] = False
        logger.error("Missing expected tables: %s", missing_tables)

    # 5. User data uniqueness and null checks
    cursor.execute("SELECT COUNT(*) FROM users;")
    total_users = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM users WHERE email IS NULL OR email = '';")
    null_emails = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(DISTINCT email), COUNT(DISTINCT username) FROM users;")
    distinct_emails, distinct_usernames = cursor.fetchone()
    dup_emails = total_users - distinct_emails
    dup_usernames = total_users - distinct_usernames

    results["checks"]["user_uniqueness"] = {
        "total_users": total_users,
        "null_emails": null_emails,
        "duplicate_emails": dup_emails,
        "duplicate_usernames": dup_usernames,
    }

    if null_emails > 0 or dup_emails > 0 or dup_usernames > 0:
        results["passed"] = False
        logger.error(
            "User uniqueness check failed: null_emails=%d, dup_emails=%d, dup_usernames=%d",
            null_emails, dup_emails, dup_usernames
        )

    # 6. User ID UUID validity
    cursor.execute("SELECT id FROM users;")
    invalid_uuids = 0
    for r in cursor.fetchall():
        try:
            uuid.UUID(r[0])
        except Exception:
            invalid_uuids += 1

    results["checks"]["user_id_uuids"] = {
        "total_checked": total_users,
        "invalid_count": invalid_uuids,
    }
    if invalid_uuids > 0:
        results["passed"] = False
        logger.error("Found %d non-UUID user IDs!", invalid_uuids)

    conn.close()

    if results["passed"]:
        logger.info("ALL INTEGRITY CHECKS PASSED SUCCESSFULLY! (Tables: %d, Users: %d)", len(existing_tables), total_users)
    else:
        logger.error("INTEGRITY CHECKS FAILED! Inspect diagnostic results.")

    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Validate SQLite database integrity and data health.")
    parser.add_argument("--source", type=Path, default=DEFAULT_SQLITE_PATH, help="Path to SQLite file")
    args = parser.parse_args()

    res = run_integrity_validation(args.source)
    sys.exit(0 if res["passed"] else 1)
