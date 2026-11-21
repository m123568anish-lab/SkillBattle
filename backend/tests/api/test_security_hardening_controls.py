"""
=========================================================
SkillBattle / Qubira — Security Controls Regression Test Suite
Validates all 20 security hardening controls.
=========================================================
"""

import pytest
import time
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient

from app.core.security.ssrf import validate_url_for_ssrf, is_safe_url, is_safe_ip, SSRFSecurityError
from app.core.security.file_upload import (
    validate_image_file,
    validate_document_file,
    safe_storage_path,
    FileValidationError,
)
from app.core.security.password import (
    hash_password,
    verify_password,
    needs_rehash,
)
from app.core.security.jwt import jwt_manager
from app.core.security.permissions import (
    check_resource_ownership,
    require_resource_ownership,
    RoleChecker,
)
from app.core.security.webhook_verifier import (
    sign_webhook_payload,
    verify_webhook_signature,
)
from app.core.security.redact import (
    redact_sensitive_text,
    redact_sensitive_dict,
)
from app.core.security.csrf import CSRFMiddleware
from app.middleware.xss_guard import XSSGuardMiddleware
from app.modules.admin.security_router import router as security_router


# ============================================================================
# Control 01 & 02: SQL Injection & XSS Defense
# ============================================================================

def test_xss_and_sqli_guard_blocks_injection_patterns():
    app = FastAPI()
    app.add_middleware(XSSGuardMiddleware)

    @app.post("/test-endpoint")
    async def sample_post(payload: dict):
        return {"received": payload}

    client = TestClient(app)

    # 1. Clean JSON payload passes
    clean_res = client.post("/test-endpoint", json={"name": "Alex", "bio": "Software Engineer"})
    assert clean_res.status_code == 200

    # 2. XSS payload with <script> tag blocked
    xss_res = client.post("/test-endpoint", json={"content": "<script>alert(1)</script>"})
    assert xss_res.status_code == 400
    assert xss_res.json()["success"] is False

    # 3. XSS payload with javascript: URI blocked
    xss_res2 = client.post("/test-endpoint", json={"avatar": "javascript:eval('xss')"})
    assert xss_res2.status_code == 400

    # 4. SQL Injection payload with UNION SELECT blocked
    sqli_res = client.post("/test-endpoint", json={"query": "admin' UNION SELECT * FROM users--"})
    assert sqli_res.status_code == 400

    # 5. SQL Injection payload with ' OR '1'='1 blocked
    sqli_res2 = client.post("/test-endpoint", json={"filter": "' OR '1'='1"})
    assert sqli_res2.status_code == 400


# ============================================================================
# Control 03: CSRF Defense
# ============================================================================

def test_csrf_middleware_enforcement_for_ambient_cookies():
    app = FastAPI()
    app.add_middleware(CSRFMiddleware)

    @app.post("/api/v1/update")
    async def update_resource():
        return {"ok": True}

    client = TestClient(app)

    # 1. Mutating request with ambient session cookie and no CSRF token -> Rejected (403)
    res_rejected = client.post("/api/v1/update", cookies={"session": "user-session-123"})
    assert res_rejected.status_code == 403
    assert "CSRF validation failed" in res_rejected.json()["message"]

    # 2. Mutating request with ambient session cookie and valid X-CSRF-Token header -> Accepted (200)
    res_accepted = client.post(
        "/api/v1/update",
        cookies={"session": "user-session-123", "csrf_token": "valid-token-abc"},
        headers={"X-CSRF-Token": "valid-token-abc"},
    )
    assert res_accepted.status_code == 200

    # 3. Explicit Bearer token header bypasses ambient cookie CSRF -> Accepted (200)
    res_bearer = client.post(
        "/api/v1/update",
        cookies={"session": "user-session-123"},
        headers={"Authorization": "Bearer eyJhbGciOi..."},
    )
    assert res_bearer.status_code == 200


# ============================================================================
# Control 04: Secure File Uploads & Path Traversal
# ============================================================================

def test_file_upload_magic_bytes_and_path_traversal():
    # Valid JPEG magic bytes (\xFF\xD8\xFF)
    valid_jpeg = b"\xFF\xD8\xFF\xE0\x00\x10JFIF" + b"\x00" * 50
    clean_name, ext = validate_image_file(valid_jpeg, "profile.jpg")
    assert ext == ".jpg"
    assert clean_name.endswith(".jpg")

    # Valid PNG magic bytes (\x89PNG\r\n\x1a\n)
    valid_png = b"\x89PNG\r\n\x1a\n" + b"\x00" * 50
    clean_name, ext = validate_image_file(valid_png, "avatar.png")
    assert ext == ".png"

    # Valid PDF magic bytes (%PDF-)
    valid_pdf = b"%PDF-1.4\n" + b"\x00" * 100
    clean_name, ext = validate_document_file(valid_pdf, "resume.pdf")
    assert ext == ".pdf"

    # Spoofed file: executable disguised as .png
    fake_png = b"MZ\x90\x00\x03\x00\x00\x00" + b"\x00" * 50
    with pytest.raises(FileValidationError):
        validate_image_file(fake_png, "malicious.png")

    # Path traversal detection in filenames
    safe_path = safe_storage_path("users/user_123/avatar.png")
    assert safe_path == "users/user_123/avatar.png"

    with pytest.raises(FileValidationError):
        safe_storage_path("../../etc/passwd")

    with pytest.raises(FileValidationError):
        safe_storage_path("users/user_123/../../../windows/system32/cmd.exe")


# ============================================================================
# Control 05: SSRF Prevention
# ============================================================================

def test_ssrf_validator_blocks_internal_and_cloud_metadata():
    # Public domain URLs allowed
    assert is_safe_url("https://qubira.in/webhook") is True
    assert is_safe_url("https://api.github.com/events") is True

    # Cloud metadata endpoint blocked
    assert is_safe_url("http://169.254.169.254/latest/meta-data/") is False
    assert is_safe_url("http://metadata.google.internal/computeMetadata/v1/") is False

    # Loopback addresses blocked
    assert is_safe_url("http://127.0.0.1:8000/internal") is False
    assert is_safe_url("http://localhost:5432") is False

    # Private RFC 1918 IPv4 ranges blocked
    assert is_safe_url("http://10.0.0.1/admin") is False
    assert is_safe_url("http://172.16.0.5/api") is False
    assert is_safe_url("http://192.168.1.100:9000/keys") is False

    # Dangerous protocols blocked
    assert is_safe_url("file:///etc/passwd") is False
    assert is_safe_url("gopher://127.0.0.1:6379/") is False

    # IP safety helper
    assert is_safe_ip("8.8.8.8") is True
    assert is_safe_ip("169.254.169.254") is False
    assert is_safe_ip("127.0.0.1") is False
    assert is_safe_ip("10.0.0.5") is False


# ============================================================================
# Control 06 & 10: BOLA/IDOR & Server-Side Permissions
# ============================================================================

class DummyUser:
    def __init__(self, uid: str, role: str = "user", is_superuser: bool = False):
        self.id = uid
        self.role = role
        self.is_superuser = is_superuser


def test_bola_ownership_enforcement():
    user_a = DummyUser("user_aaa")
    user_b = DummyUser("user_bbb")
    admin_user = DummyUser("admin_999", role="admin")

    # User A owns resource A
    assert check_resource_ownership(user_a, "user_aaa") is True

    # User A does NOT own resource B -> BOLA attempt blocked
    assert check_resource_ownership(user_a, "user_bbb") is False

    # Admin user can access resource B
    assert check_resource_ownership(admin_user, "user_bbb") is True

    # require_resource_ownership raises 403 on violation
    with pytest.raises(HTTPException) as exc_info:
        require_resource_ownership(user_a, "user_bbb")
    assert exc_info.value.status_code == 403


# ============================================================================
# Control 08: Password Hashing & Rehashing
# ============================================================================

def test_password_hashing_and_rehashing():
    pw = "P@ssw0rdSecure2026!"
    hashed = hash_password(pw)

    # Validates correct password
    assert verify_password(pw, hashed) is True
    # Rejects incorrect password
    assert verify_password("WrongPassword!", hashed) is False

    # Argon2 hash does not need rehash
    assert needs_rehash(hashed) is False


# ============================================================================
# Control 12: JWT Token Type Enforcement
# ============================================================================

def test_jwt_token_type_enforcement():
    access_token = jwt_manager.create_access_token("user_123")
    refresh_token = jwt_manager.create_refresh_token("user_123")

    # Access token verified as access
    payload_access = jwt_manager.verify_access_token(access_token)
    assert payload_access["sub"] == "user_123"
    assert payload_access["type"] == "access"

    # Refresh token verified as refresh
    payload_refresh = jwt_manager.verify_refresh_token(refresh_token)
    assert payload_refresh["sub"] == "user_123"
    assert payload_refresh["type"] == "refresh"

    # Token substitution attack: refresh token presented to access verification -> Rejected
    with pytest.raises(ValueError):
        jwt_manager.verify_access_token(refresh_token)

    # Token substitution attack: access token presented to refresh verification -> Rejected
    with pytest.raises(ValueError):
        jwt_manager.verify_refresh_token(access_token)


# ============================================================================
# Control 17: Webhook Signature & Replay Protection
# ============================================================================

def test_webhook_signature_timing_safe_and_replay_protection():
    payload = b'{"event":"battle.completed","score":95}'
    secret = "whsec_supersecretkey1234567890"

    header, ts = sign_webhook_payload(payload, secret)

    # Valid signature verified
    assert verify_webhook_signature(payload, header, secret, tolerance_seconds=300) is True

    # Tampered payload rejected
    tampered_payload = b'{"event":"battle.completed","score":100}'
    assert verify_webhook_signature(tampered_payload, header, secret) is False

    # Replay attack: expired timestamp rejected
    old_header, old_ts = sign_webhook_payload(payload, secret, timestamp=int(time.time()) - 600)
    assert verify_webhook_signature(payload, old_header, secret, tolerance_seconds=300) is False


# ============================================================================
# Control 19: Clean Production Log Redaction
# ============================================================================

def test_log_redaction_masks_credentials_and_tokens():
    raw_log = "User logged in. token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc123def456 " \
              "Connecting to postgresql://admin:SuperSecretPass123@neon.tech/qubira_db with Bearer secret_bearer_token"

    redacted = redact_sensitive_text(raw_log)

    assert "SuperSecretPass123" not in redacted
    assert "[REDACTED_PASSWORD]" in redacted
    assert "secret_bearer_token" not in redacted
    assert "[REDACTED_TOKEN]" in redacted
    assert "[REDACTED_JWT]" in redacted

    # Dictionary redaction
    sensitive_dict = {
        "username": "alex",
        "password": "ClearTextPassword!",
        "api_key": "sec_live_key_xyz",
        "nested": {"token": "sub_token_123"},
    }
    cleaned_dict = redact_sensitive_dict(sensitive_dict)
    assert cleaned_dict["password"] == "[REDACTED]"
    assert cleaned_dict["api_key"] == "[REDACTED]"
    assert cleaned_dict["nested"]["token"] == "[REDACTED]"
    assert cleaned_dict["username"] == "alex"


# ============================================================================
# Security Trust Center API
# ============================================================================

def test_security_trust_center_status_and_scan():
    app = FastAPI()
    app.include_router(security_router)

    from app.core.dependencies import get_current_admin
    app.dependency_overrides[get_current_admin] = lambda: DummyUser("admin_1", role="admin")

    client = TestClient(app)

    # 1. GET /admin/security/status
    res = client.get("/admin/security/status")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SECURE"
    assert data["grade"] == "A+"
    assert data["total_controls"] == 20
    assert data["passed_controls"] == 20
    assert len(data["controls"]) == 20

    # 2. POST /admin/security/scan
    scan_res = client.post("/admin/security/scan")
    assert scan_res.status_code == 200
    scan_data = scan_res.json()
    assert scan_data["success"] is True
    assert scan_data["data"]["total_controls"] == 20
