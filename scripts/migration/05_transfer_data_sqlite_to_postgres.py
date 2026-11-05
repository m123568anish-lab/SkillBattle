"""
====================================================================
Step 05: Table-by-Table Data Transfer (SQLite -> Supabase PostgreSQL)
====================================================================
Topological, chunked, resumable data pipeline with type normalization.
"""

from __future__ import annotations

import argparse
import os
import sqlite3
import sys
from pathlib import Path
from typing import Any, Dict, List, Tuple

from common import (
    CHECKPOINT_FILE,
    DEFAULT_SQLITE_PATH,
    TOPOLOGICAL_MIGRATION_ORDER,
    MigrationCheckpoint,
    get_sqlite_ro_uri,
    logger,
    sanitize_value,
)


def get_table_metadata(cursor: sqlite3.Cursor, table: str) -> List[Tuple[str, str]]:
    """Return list of (column_name, column_type) for a table."""
    cursor.execute(f'PRAGMA table_info("{table}");')
    return [(r["name"], r["type"]) for r in cursor.fetchall()]


def run_data_transfer(
    source_path: Path = DEFAULT_SQLITE_PATH,
    target_url: str | None = None,
    dry_run: bool = False,
    resume: bool = True,
    chunk_size: int = 500,
    table_filter: str | None = None,
) -> Dict[str, Any]:
    db_url = (
        target_url
        or os.getenv("SUPABASE_DATABASE_URL")
        or os.getenv("DATABASE_URL")
        or ""
    ).strip()

    is_postgres = bool(db_url and ("postgres" in db_url or "postgresql" in db_url))

    logger.info("====================================================")
    logger.info("Step 05: Topological Data Transfer Engine")
    logger.info("====================================================")
    logger.info("Source SQLite: %s", source_path)
    logger.info("Dry-Run: %s", dry_run)
    logger.info("Resume: %s", resume)
    logger.info("Chunk Size: %d", chunk_size)

    checkpoint = MigrationCheckpoint()
    source_uri = get_sqlite_ro_uri(source_path)
    src_conn = sqlite3.connect(source_uri, uri=True)
    src_conn.row_factory = sqlite3.Row
    src_cursor = src_conn.cursor()

    # Determine tables to process
    tables_to_process = (
        [table_filter] if table_filter else TOPOLOGICAL_MIGRATION_ORDER
    )

    stats: Dict[str, Any] = {
        "total_tables": len(tables_to_process),
        "migrated_tables": 0,
        "skipped_tables": 0,
        "total_rows_transferred": 0,
        "table_reports": {},
    }

    pg_engine = None
    if not dry_run and is_postgres:
        from sqlalchemy import create_engine
        normalized_url = db_url.replace("postgres://", "postgresql://", 1)
        pg_engine = create_engine(normalized_url, pool_pre_ping=True)

    for idx, table in enumerate(tables_to_process, start=1):
        # Check if already completed
        if resume and checkpoint.is_completed(table) and not dry_run:
            logger.info("[%2d/%2d] Table '%s' already migrated in checkpoint. Skipping.", idx, len(tables_to_process), table)
            stats["skipped_tables"] += 1
            continue

        cols_meta = get_table_metadata(src_cursor, table)
        if not cols_meta:
            logger.warning("[%2d/%2d] Table '%s' has no columns or does not exist in source. Skipping.", idx, len(tables_to_process), table)
            continue

        col_names = [c[0] for c in cols_meta]
        col_types = {c[0]: c[1] for c in cols_meta}

        # Row count
        src_cursor.execute(f'SELECT COUNT(*) FROM "{table}";')
        row_count = src_cursor.fetchone()[0]

        logger.info(
            "[%2d/%2d] Processing table '%s' (%d rows, %d columns)...",
            idx, len(tables_to_process), table, row_count, len(col_names)
        )

        if row_count == 0:
            if not dry_run:
                checkpoint.record_success(table, 0)
            stats["table_reports"][table] = {"rows": 0, "status": "empty_table"}
            continue

        # In dry run, sample rows to test sanitization
        if dry_run or not is_postgres:
            src_cursor.execute(f'SELECT * FROM "{table}" LIMIT 5;')
            sample_rows = src_cursor.fetchall()
            for r in sample_rows:
                for c in col_names:
                    _ = sanitize_value(r[c], col_types[c])

            stats["total_rows_transferred"] += row_count
            stats["migrated_tables"] += 1
            stats["table_reports"][table] = {
                "rows": row_count,
                "status": "dry_run_validated",
                "sample_checked": len(sample_rows),
            }
            continue

        # Active PostgreSQL transfer
        from sqlalchemy import text
        try:
            with pg_engine.begin() as conn:
                quoted_cols = ", ".join(f'"{c}"' for c in col_names)
                placeholders = ", ".join(f":{c}" for c in col_names)
                insert_sql = text(f'INSERT INTO public."{table}" ({quoted_cols}) VALUES ({placeholders}) ON CONFLICT DO NOTHING;')

                offset = 0
                while offset < row_count:
                    src_cursor.execute(f'SELECT * FROM "{table}" LIMIT {chunk_size} OFFSET {offset};')
                    chunk_rows = src_cursor.fetchall()
                    if not chunk_rows:
                        break

                    chunk_dicts = []
                    for row in chunk_rows:
                        row_dict = {}
                        for c in col_names:
                            row_dict[c] = sanitize_value(row[c], col_types[c])
                        chunk_dicts.append(row_dict)

                    conn.execute(insert_sql, chunk_dicts)
                    offset += len(chunk_rows)

            checkpoint.record_success(table, row_count)
            stats["total_rows_transferred"] += row_count
            stats["migrated_tables"] += 1
            stats["table_reports"][table] = {"rows": row_count, "status": "migrated"}
            logger.info("Successfully transferred %d rows for table '%s'.", row_count, table)

        except Exception as e:
            checkpoint.record_failure(table, str(e))
            logger.error("Failed to migrate table '%s': %s", table, str(e))
            stats["table_reports"][table] = {"rows": row_count, "status": "failed", "error": str(e)}
            src_conn.close()
            return stats

    src_conn.close()
    logger.info("====================================================")
    logger.info(
        "Data Transfer Phase Completed: %d tables processed, %d total rows %s.",
        stats["migrated_tables"], stats["total_rows_transferred"],
        "simulated" if dry_run or not is_postgres else "transferred"
    )
    logger.info("====================================================")
    return stats


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Transfer data from SQLite to PostgreSQL.")
    parser.add_argument("--dry-run", action="store_true", help="Simulate data validation without writing to DB")
    parser.add_argument("--url", type=str, default=None, help="Target PostgreSQL connection string")
    parser.add_argument("--source", type=Path, default=DEFAULT_SQLITE_PATH, help="Path to source SQLite file")
    parser.add_argument("--chunk-size", type=int, default=500, help="Batch chunk size for inserts")
    parser.add_argument("--table", type=str, default=None, help="Migrate a single table only")
    parser.add_argument("--no-resume", action="store_true", help="Do not skip previously completed tables")
    args = parser.parse_args()

    run_data_transfer(
        source_path=args.source,
        target_url=args.url,
        dry_run=args.dry_run,
        resume=not args.no_resume,
        chunk_size=args.chunk_size,
        table_filter=args.table,
    )
