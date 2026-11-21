"""
=========================================================
SkillBattle / Qubira — Webhook Signature Verifier
HMAC-SHA256 signature verification & generation with
constant-time comparison and timestamp replay protection.
=========================================================
"""

from __future__ import annotations

import hmac
import hashlib
import time
from typing import Tuple


def sign_webhook_payload(
    payload_bytes: bytes,
    secret: str,
    timestamp: int | None = None,
) -> Tuple[str, int]:
    """
    Generate an HMAC-SHA256 signature for outbound webhooks.
    Includes UNIX timestamp to protect against replay attacks.
    """
    if timestamp is None:
        timestamp = int(time.time())

    # Format: t={timestamp}.v1={hex_digest}
    signed_payload = f"{timestamp}.".encode("utf-8") + payload_bytes
    signature = hmac.new(
        secret.encode("utf-8"),
        signed_payload,
        hashlib.sha256,
    ).hexdigest()

    header_value = f"t={timestamp},v1={signature}"
    return header_value, timestamp


def verify_webhook_signature(
    payload_bytes: bytes,
    signature_header: str,
    secret: str,
    tolerance_seconds: int = 300,
) -> bool:
    """
    Verify HMAC-SHA256 signature on inbound webhooks.
    Uses hmac.compare_digest for constant-time comparison to prevent timing attacks.
    Supports:
      - Stripe/Neon style: 't=1612345678,v1=abcdef...'
      - Raw hex signature: 'abcdef...'
    """
    if not signature_header or not secret:
        return False

    header_clean = signature_header.strip()

    # Case 1: Structured header with timestamp (e.g. t=12345,v1=abc)
    if "t=" in header_clean and "v1=" in header_clean:
        parts = {}
        for item in header_clean.split(","):
            if "=" in item:
                k, v = item.strip().split("=", 1)
                parts[k] = v

        timestamp_str = parts.get("t")
        expected_sig = parts.get("v1")
        if not timestamp_str or not expected_sig:
            return False

        try:
            ts = int(timestamp_str)
        except ValueError:
            return False

        # Check timestamp replay tolerance
        now = int(time.time())
        if abs(now - ts) > tolerance_seconds:
            return False

        signed_payload = f"{timestamp_str}.".encode("utf-8") + payload_bytes
        computed = hmac.new(
            secret.encode("utf-8"),
            signed_payload,
            hashlib.sha256,
        ).hexdigest()

        return hmac.compare_digest(computed, expected_sig)

    # Case 2: Plain hex signature (legacy or standard header)
    clean_sig = header_clean.removeprefix("sha256=").strip()
    computed = hmac.new(
        secret.encode("utf-8"),
        payload_bytes,
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(computed, clean_sig)
