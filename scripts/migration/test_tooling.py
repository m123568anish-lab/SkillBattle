"""
====================================================================
Qubira — Automated Test Suite for Migration Tooling
====================================================================
Tests backup, type conversion, topological ordering, retries, and integrity.
"""

from __future__ import annotations

import json
import os
import sqlite3
import tempfile
import unittest
from pathlib import Path

from common import (
    SERIAL_SEQUENCE_TABLES,
    TOPOLOGICAL_MIGRATION_ORDER,
    MigrationCheckpoint,
    compute_sha256,
    sanitize_value,
)
from importlib import import_module


class TestMigrationTooling(unittest.TestCase):

    def setUp(self):
        # Create a small temporary SQLite database for testing
        self.temp_dir = tempfile.TemporaryDirectory()
        self.temp_path = Path(self.temp_dir.name)
        self.mock_db_path = self.temp_path / "mock_skillbattle.db"
        self.backup_dir = self.temp_path / "backups"

        conn = sqlite3.connect(self.mock_db_path)
        conn.execute("CREATE TABLE users (id VARCHAR(36) PRIMARY KEY, email VARCHAR(255), is_active BOOLEAN);")
        conn.execute("INSERT INTO users VALUES ('00000000-0000-0000-0000-000000000001', 'test@example.com', 1);")
        conn.commit()
        conn.close()

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_backup_and_sha256(self):
        """Test backup creation, SHA-256 consistency, and metadata generation."""
        backup_mod = import_module("01_backup_and_verify_sqlite")
        meta = backup_mod.run_backup(
            source_path=self.mock_db_path,
            backup_dir=self.backup_dir,
            dry_run=False,
        )

        self.assertEqual(meta["status"], "verified")
        self.assertTrue(Path(meta["backup_path"]).exists())
        self.assertEqual(meta["source_sha256"], compute_sha256(self.mock_db_path))
        self.assertEqual(meta["backup_sha256"], compute_sha256(Path(meta["backup_path"])))
        self.assertEqual(meta["total_users"], 1)

    def test_type_sanitization(self):
        """Test conversions of booleans, JSON, timestamps, and nulls."""
        # Booleans
        self.assertIs(sanitize_value(1, "BOOLEAN"), True)
        self.assertIs(sanitize_value(0, "BOOLEAN"), False)
        self.assertIs(sanitize_value("1", "BOOLEAN"), True)
        self.assertIs(sanitize_value("true", "BOOLEAN"), True)
        self.assertIs(sanitize_value(None, "BOOLEAN"), None)

        # JSON
        sample_dict = {"tier": 1, "unlocked": True}
        self.assertEqual(sanitize_value(sample_dict, "JSON"), json.dumps(sample_dict))
        self.assertEqual(sanitize_value('{"valid": true}', "JSON"), '{"valid": true}')
        self.assertIs(sanitize_value(None, "JSON"), None)

        # Datetimes
        self.assertEqual(sanitize_value("2026-11-05 18:00:00", "DATETIME"), "2026-11-05T18:00:00")
        self.assertIs(sanitize_value(None, "DATETIME"), None)

    def test_topological_order_dag_properties(self):
        """Verify topological order list contains all 78 tables and respects parent-child relationships."""
        self.assertEqual(len(TOPOLOGICAL_MIGRATION_ORDER), 78)
        self.assertEqual(len(set(TOPOLOGICAL_MIGRATION_ORDER)), 78, "No duplicate tables in migration order")

        # Key relational assertions:
        # users must precede profiles, xp, battle_participants, etc.
        user_idx = TOPOLOGICAL_MIGRATION_ORDER.index("users")
        self.assertLess(user_idx, TOPOLOGICAL_MIGRATION_ORDER.index("profiles"))
        self.assertLess(user_idx, TOPOLOGICAL_MIGRATION_ORDER.index("xp"))
        self.assertLess(user_idx, TOPOLOGICAL_MIGRATION_ORDER.index("battle_participants"))
        self.assertLess(user_idx, TOPOLOGICAL_MIGRATION_ORDER.index("candidate_applications"))

        # colleges must precede departments and college_assessments
        colleges_idx = TOPOLOGICAL_MIGRATION_ORDER.index("colleges")
        self.assertLess(colleges_idx, TOPOLOGICAL_MIGRATION_ORDER.index("departments"))
        self.assertLess(colleges_idx, TOPOLOGICAL_MIGRATION_ORDER.index("college_assessments"))

        # companies must precede job_postings and company_members
        companies_idx = TOPOLOGICAL_MIGRATION_ORDER.index("companies")
        self.assertLess(companies_idx, TOPOLOGICAL_MIGRATION_ORDER.index("job_postings"))
        self.assertLess(companies_idx, TOPOLOGICAL_MIGRATION_ORDER.index("company_members"))

    def test_checkpoint_and_resumability(self):
        """Test checkpoint recording, persistence, and skipping completed tables."""
        chk_file = self.temp_path / "test_checkpoint.json"
        chk = MigrationCheckpoint(checkpoint_path=chk_file)

        self.assertFalse(chk.is_completed("users"))
        chk.record_success("users", 1845)
        self.assertTrue(chk.is_completed("users"))

        # Reload from disk
        chk2 = MigrationCheckpoint(checkpoint_path=chk_file)
        self.assertTrue(chk2.is_completed("users"))
        self.assertEqual(chk2.data["completed_tables"]["users"]["rows"], 1845)

        # Test failure recording
        chk2.record_failure("battle_rooms", "Mock network error")
        self.assertIn("battle_rooms", chk2.data["failed_tables"])

    def test_argon2_parameter_extraction(self):
        """Test that Argon2 parameter parser extracts memory, time, parallelism and version correctly."""
        auth_mod = import_module("09_test_supabase_auth_import")
        sample_hash = "$argon2id$v=19$m=65536,t=3,p=4$2qR8...$xyz..."
        params = auth_mod.parse_argon2_params(sample_hash)

        self.assertTrue(params["valid_argon2_mcf"])
        self.assertEqual(params["variant"], "argon2id")
        self.assertEqual(params["version"], 19)
        self.assertEqual(params["memory_cost_kib"], 65536)
        self.assertEqual(params["time_cost_iterations"], 3)
        self.assertEqual(params["parallelism_threads"], 4)

    def test_serial_sequence_table_count(self):
        """Verify that all 44 sequence tables belong to the known table catalog."""
        self.assertEqual(len(SERIAL_SEQUENCE_TABLES), 44)
        for tbl in SERIAL_SEQUENCE_TABLES:
            self.assertIn(tbl, TOPOLOGICAL_MIGRATION_ORDER)


if __name__ == "__main__":
    unittest.main()
