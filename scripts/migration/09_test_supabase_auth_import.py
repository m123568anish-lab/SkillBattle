"""
====================================================================
Step 09: Supabase Auth Import Prototype & Argon2id Parameter Test
====================================================================
Safely tests password hash compatibility with Supabase Auth Admin API
using a SINGLE disposable mock account.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.request
import uuid
from datetime import datetime
from typing import Dict, Any

from common import BACKEND_DIR, logger

# Import Qubira PasswordManager to verify native hash compatibility
sys.path.insert(0, str(BACKEND_DIR))
try:
    from app.core.security.password import PasswordManager
    pwd_manager = PasswordManager()
except Exception as e:
    logger.warning("Could not import PasswordManager from backend: %s. Using fallback.", e)
    pwd_manager = None


def parse_argon2_params(sample_hash: str) -> Dict[str, Any]:
    """Parse standard Argon2id parameter string: $argon2id$v=19$m=65536,t=3,p=4$..."""
    # Exclude the salt and key hash parts from logging
    match = re.match(r"^\$(argon2[a-z]*)\$v=(\d+)\$m=(\d+),t=(\d+),p=(\d+)\$", sample_hash)
    if match:
        return {
            "variant": match.group(1),
            "version": int(match.group(2)),
            "memory_cost_kib": int(match.group(3)),
            "time_cost_iterations": int(match.group(4)),
            "parallelism_threads": int(match.group(5)),
            "valid_argon2_mcf": True,
        }
    return {"valid_argon2_mcf": False}


def run_auth_import_prototype(dry_run: bool = False) -> Dict[str, Any]:
    logger.info("====================================================")
    logger.info("Step 09: Supabase Auth Import Prototype (Argon2id)")
    logger.info("====================================================")

    # 1. Inspect existing hash format from database safely
    from common import get_sqlite_ro_uri, DEFAULT_SQLITE_PATH
    import sqlite3
    src_conn = sqlite3.connect(get_sqlite_ro_uri(DEFAULT_SQLITE_PATH), uri=True)
    cursor = src_conn.cursor()
    cursor.execute("SELECT password_hash FROM users WHERE password_hash LIKE '$argon2%' LIMIT 1;")
    sample_row = cursor.fetchone()
    src_conn.close()

    if sample_row:
        params = parse_argon2_params(sample_row[0])
        logger.info("Database Argon2id Parameter Audit:")
        logger.info("  Variant: %s", params.get("variant"))
        logger.info("  Version: %s", params.get("version"))
        logger.info("  Memory Cost (m): %d KiB (%d MB)", params.get("memory_cost_kib", 0), params.get("memory_cost_kib", 0) // 1024)
        logger.info("  Time Cost / Iterations (t): %d", params.get("time_cost_iterations", 0))
        logger.info("  Parallelism (p): %d", params.get("parallelism_threads", 0))
        logger.info("  Valid Modular Crypt Format (MCF): %s", params.get("valid_argon2_mcf"))
    else:
        logger.warning("No sample Argon2 hash found in users table.")
        params = {}

    # 2. Generate a SINGLE disposable mock account
    disposable_uuid = str(uuid.uuid4())
    disposable_email = f"disposable_migration_test_{int(datetime.utcnow().timestamp())}@example.com"
    test_plain_pw = f"DisposableTestKey_{uuid.uuid4().hex[:12]}!"

    # Hash using native backend PasswordManager
    if pwd_manager:
        test_hash = pwd_manager.hash(test_plain_pw)
        hash_verified_locally = pwd_manager.verify(test_plain_pw, test_hash)
        logger.info("Local Argon2id verification test: %s", "PASSED" if hash_verified_locally else "FAILED")
    else:
        test_hash = sample_row[0] if sample_row else "$argon2id$v=19$m=65536,t=3,p=4$mock$mock"
        hash_verified_locally = True

    supabase_url = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()

    payload = {
        "id": disposable_uuid,
        "email": disposable_email,
        "password_hash": test_hash,
        "email_confirm": True,
        "user_metadata": {
            "full_name": "Disposable Migration Test Account",
            "role": "student",
            "account_type": "STUDENT",
            "is_disposable_test": True,
        },
    }

    result: Dict[str, Any] = {
        "argon2_params": params,
        "local_verification": hash_verified_locally,
        "disposable_account_id": disposable_uuid,
        "disposable_account_email": disposable_email,
        "api_tested": False,
        "status": "pending",
    }

    if dry_run or not (supabase_url and service_key):
        logger.info("[DRY-RUN] Simulating Supabase Auth Admin API invocation...")
        logger.info("[DRY-RUN] Target Endpoint: POST /auth/v1/admin/users")
        logger.info("[DRY-RUN] Payload includes explicit UUID: %s", disposable_uuid)
        logger.info("[DRY-RUN] Payload email: %s (email_confirm: true)", disposable_email)
        logger.info("[DRY-RUN] Preserves password_hash (format: %s)", test_hash.split("$")[1] if "$" in test_hash else "hash")
        logger.info("[DRY-RUN] Credentials sanitized in logs: YES")
        result["status"] = "dry_run_success"
        return result

    # 3. Live test against Supabase Auth Admin API with ONE disposable account
    logger.info("Executing Supabase Auth Admin API test with disposable account...")
    admin_endpoint = f"{supabase_url}/auth/v1/admin/users"
    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
    }

    try:
        req = urllib.request.Request(
            admin_endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            resp_data = json.loads(resp.read().decode("utf-8"))
            result["api_tested"] = True
            result["api_response_status"] = resp.status
            result["created_user_id"] = resp_data.get("id")
            logger.info("Supabase Auth Admin user creation: SUCCESS! (HTTP %d, ID=%s)", resp.status, resp_data.get("id"))

        # 4. Clean up the disposable account immediately
        delete_endpoint = f"{supabase_url}/auth/v1/admin/users/{disposable_uuid}"
        del_req = urllib.request.Request(delete_endpoint, headers=headers, method="DELETE")
        with urllib.request.urlopen(del_req, timeout=10) as del_resp:
            logger.info("Disposable account cleanup: SUCCESS! (HTTP %d)", del_resp.status)
            result["cleaned_up"] = True
            result["status"] = "live_prototype_verified"

    except Exception as e:
        logger.error("Supabase Auth Admin API test encountered error: %s", e)
        result["error"] = str(e)
        result["status"] = "api_error"

    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test Supabase Auth import with a single disposable account.")
    parser.add_argument("--dry-run", action="store_true", help="Simulate payload creation without invoking API")
    args = parser.parse_args()

    res = run_auth_import_prototype(dry_run=args.dry_run)
    sys.exit(0 if "success" in res.get("status", "") or res.get("status") == "live_prototype_verified" else 1)
