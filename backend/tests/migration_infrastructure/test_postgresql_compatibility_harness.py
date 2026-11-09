from __future__ import annotations

import hashlib
import json

import pytest

from app.database.migration_infrastructure.schema_manifest import (
    manifest_fingerprint,
)
from tests.migration_infrastructure.postgresql_compatibility_harness import (
    CompatibilityHarnessError,
    load_verified_profile,
)


def _manifest() -> dict:
    return {
        "format_version": 2,
        "engine": {
            "dialect": "postgresql",
            "server_version": [18, 6],
            "default_schema": "public",
        },
        "schema": "public",
        "tables": [
            {
                "name": "synthetic_accounts",
                "columns": [{"name": "id", "type": "INTEGER", "nullable": False}],
                "primary_key": {"name": "pk_synthetic_accounts", "columns": ["id"]},
                "foreign_keys": [],
                "unique_constraints": [],
                "check_constraints": [],
                "indexes": [],
            }
        ],
        "views": [],
        "materialized_views": [],
        "materialized_view_indexes": [],
        "triggers": [],
        "sequences": [],
        "types": [],
        "routines": [],
        "policies": [],
        "row_security": [],
        "partitioned_tables": [],
        "partitions": [],
        "schema_ownership": [],
        "object_ownership": [],
        "privileges": [],
        "default_privileges": [],
        "cross_schema_foreign_keys": [],
    }


def _write_profile(tmp_path, *, synthetic_data_only: bool = True):
    source_manifest = _manifest()
    target_manifest = _manifest()
    document = {
        "format_version": 1,
        "profile_id": "unit-test-profile",
        "fixture_id": "synthetic-fixture-only",
        "review_evidence_id": "unit-test-review",
        "synthetic_data_only": synthetic_data_only,
        "supported_starting_revision": "c9b0f2d5a713",
        "target_revision": "d1f5a8e7c2b4",
        "server_version": "18.6",
        "schema_name": "public",
        "source_manifest": source_manifest,
        "source_manifest_sha256": manifest_fingerprint(source_manifest),
        "target_manifest": target_manifest,
        "target_manifest_sha256": manifest_fingerprint(target_manifest),
        "preservation_tables": ["synthetic_accounts"],
    }
    path = tmp_path / "verified-profile.json"
    raw = json.dumps(document, sort_keys=True).encode("utf-8")
    path.write_bytes(raw)
    return path, hashlib.sha256(raw).hexdigest()


def test_profile_requires_external_reviewed_digest_and_synthetic_fixture(tmp_path) -> None:
    path, digest = _write_profile(tmp_path)

    profile = load_verified_profile(path, expected_profile_sha256=digest)

    assert profile.profile_id == "unit-test-profile"
    assert profile.supported_starting_revision == "c9b0f2d5a713"
    assert profile.target_revision == "d1f5a8e7c2b4"
    assert profile.preservation_tables == ("synthetic_accounts",)
    with pytest.raises(CompatibilityHarnessError, match="operator-approved digest"):
        load_verified_profile(path, expected_profile_sha256="0" * 64)


def test_profile_rejects_non_synthetic_data_and_missing_primary_key(tmp_path) -> None:
    path, digest = _write_profile(tmp_path, synthetic_data_only=False)
    with pytest.raises(CompatibilityHarnessError, match="synthetic data"):
        load_verified_profile(path, expected_profile_sha256=digest)

    path, _ = _write_profile(tmp_path)
    document = json.loads(path.read_text(encoding="utf-8"))
    document["source_manifest"]["tables"][0]["primary_key"]["columns"] = []
    document["source_manifest_sha256"] = manifest_fingerprint(
        document["source_manifest"]
    )
    raw = json.dumps(document, sort_keys=True).encode("utf-8")
    path.write_bytes(raw)
    digest = hashlib.sha256(raw).hexdigest()
    with pytest.raises(CompatibilityHarnessError, match="must have a primary key"):
        load_verified_profile(path, expected_profile_sha256=digest)


def test_profile_rejects_incomplete_schema_manifest(tmp_path) -> None:
    path, _ = _write_profile(tmp_path)
    document = json.loads(path.read_text(encoding="utf-8"))
    del document["source_manifest"]["policies"]
    document["source_manifest_sha256"] = manifest_fingerprint(
        document["source_manifest"]
    )
    raw = json.dumps(document, sort_keys=True).encode("utf-8")
    path.write_bytes(raw)

    with pytest.raises(CompatibilityHarnessError, match="incomplete"):
        load_verified_profile(
            path,
            expected_profile_sha256=hashlib.sha256(raw).hexdigest(),
        )


def test_profile_rejects_unknown_starting_revision(tmp_path) -> None:
    path, _ = _write_profile(tmp_path)
    document = json.loads(path.read_text(encoding="utf-8"))
    document["supported_starting_revision"] = "unknown_revision"
    raw = json.dumps(document, sort_keys=True).encode("utf-8")
    path.write_bytes(raw)

    with pytest.raises(CompatibilityHarnessError, match="not present in the repository graph"):
        load_verified_profile(
            path,
            expected_profile_sha256=hashlib.sha256(raw).hexdigest(),
        )
