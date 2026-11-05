"""
====================================================================
Qubira — Unified Migration Orchestrator & CLI Runner
====================================================================
Phase 2: Master Runner for Safe Dry-Run and Production Migration
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Dict, Any

from common import (
    DEFAULT_SQLITE_PATH,
    logger,
)

# Import step modules
from importlib import import_module


def run_pipeline(
    step: int | None = None,
    dry_run: bool = True,
    db_url: str | None = None,
    source: Path = DEFAULT_SQLITE_PATH,
) -> Dict[str, Any]:
    logger.info("====================================================================")
    logger.info("QUBIRA DATABASE MIGRATION ENGINE — PHASE 2 ORCHESTRATOR")
    logger.info("====================================================================")
    logger.info("Mode: %s", "DRY-RUN (Safe Simulation)" if dry_run else "LIVE EXECUTION")
    logger.info("Source SQLite: %s", source)

    results: Dict[str, Any] = {}

    steps_to_run = [step] if step else list(range(1, 10))

    if 1 in steps_to_run:
        mod = import_module("01_backup_and_verify_sqlite")
        results["01_backup"] = mod.run_backup(source_path=source, dry_run=dry_run)

    if 2 in steps_to_run:
        mod = import_module("02_validate_sqlite_integrity")
        results["02_integrity"] = mod.run_integrity_validation(db_path=source)
        if not results["02_integrity"]["passed"]:
            logger.error("Step 02 failed! Halting pipeline.")
            return results

    if 3 in steps_to_run:
        mod = import_module("03_check_supabase_connection")
        results["03_connection"] = mod.run_connection_check(target_url=db_url)

    if 4 in steps_to_run:
        mod = import_module("04_prepare_supabase_schema")
        results["04_schema"] = mod.run_schema_preparation(target_url=db_url, dry_run=dry_run)

    if 5 in steps_to_run:
        mod = import_module("05_transfer_data_sqlite_to_postgres")
        results["05_data_transfer"] = mod.run_data_transfer(
            source_path=source, target_url=db_url, dry_run=dry_run, resume=True
        )

    if 6 in steps_to_run:
        mod = import_module("06_sync_postgres_sequences")
        results["06_sequences"] = mod.run_sequence_sync(target_url=db_url, dry_run=dry_run)

    if 7 in steps_to_run:
        mod = import_module("07_reconcile_identity_mapping")
        results["07_identity"] = mod.run_identity_reconciliation(target_url=db_url, dry_run=dry_run)

    if 8 in steps_to_run:
        mod = import_module("08_validate_migration_parity")
        results["08_parity"] = mod.run_parity_validation(
            source_path=source, target_url=db_url, dry_run=dry_run
        )

    if 9 in steps_to_run:
        mod = import_module("09_test_supabase_auth_import")
        results["09_auth_prototype"] = mod.run_auth_import_prototype(dry_run=dry_run)

    logger.info("====================================================================")
    logger.info("PIPELINE EXECUTION COMPLETE (Steps: %s)", ", ".join(str(s) for s in steps_to_run))
    logger.info("====================================================================")
    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Qubira Database & Auth Migration Orchestrator.")
    parser.add_argument("--step", type=int, default=None, choices=range(1, 10), help="Run a specific step (1-9)")
    parser.add_argument("--execute", action="store_true", help="Execute live migration (Default is DRY-RUN)")
    parser.add_argument("--dry-run", action="store_true", default=True, help="Run in simulation / dry-run mode (Default)")
    parser.add_argument("--url", type=str, default=None, help="Target PostgreSQL connection string")
    parser.add_argument("--source", type=Path, default=DEFAULT_SQLITE_PATH, help="Source SQLite database path")
    args = parser.parse_args()

    # Safety default: dry-run is True unless --execute is explicitly supplied
    is_dry_run = not args.execute
    res = run_pipeline(step=args.step, dry_run=is_dry_run, db_url=args.url, source=args.source)
