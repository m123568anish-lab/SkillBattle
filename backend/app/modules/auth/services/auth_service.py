"""
=========================================================

SkillBattle

Authentication Service

Business logic for authentication.

=========================================================
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import logging
import secrets
import struct
import time
import uuid
from collections import defaultdict, deque
from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password_async,
    verify_password_async,
)

from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.models.user_stats import UserSettings, UserStats
from app.models.xp import XP

from app.modules.auth.repositories.user_repository import (
    user_repository,
)

from app.modules.auth.schemas.requests import (
    ChangePasswordRequest,
    LoginRequest,
    RegisterRequest,
)

logger = logging.getLogger(__name__)

_LOGIN_FAILURES: dict[str, deque[datetime]] = defaultdict(deque)
_LOGIN_FAILURE_WINDOW = timedelta(minutes=15)
_LOGIN_MAX_FAILURES = 5


def _normalize_login_key(value: str | None) -> str:
    return (value or "unknown").strip().lower()


def _is_login_allowed(email: str | None, ip_address: str | None) -> bool:
    key = f"{_normalize_login_key(email)}|{_normalize_login_key(ip_address)}"
    now = datetime.utcnow()
    window = _LOGIN_FAILURES.get(key, deque())
    while window and now - window[0] > _LOGIN_FAILURE_WINDOW:
        window.popleft()
    if len(window) >= _LOGIN_MAX_FAILURES:
        return False
    return True


def _record_failed_login(email: str | None, ip_address: str | None) -> None:
    key = f"{_normalize_login_key(email)}|{_normalize_login_key(ip_address)}"
    _LOGIN_FAILURES[key].append(datetime.utcnow())
    while len(_LOGIN_FAILURES[key]) > _LOGIN_MAX_FAILURES:
        _LOGIN_FAILURES[key].popleft()


def _clear_login_failures(email: str | None, ip_address: str | None) -> None:
    key = f"{_normalize_login_key(email)}|{_normalize_login_key(ip_address)}"
    _LOGIN_FAILURES.pop(key, None)


def _generate_totp_secret() -> str:
    return base64.b32encode(secrets.token_bytes(20)).decode("ascii").rstrip("=")


def _totp_code(secret: str, current_time: int | None = None) -> str:
    key = base64.b32decode(secret.upper() + "=" * ((8 - len(secret) % 8) % 8), casefold=True)
    now = int(time.time() if current_time is None else current_time)
    counter = now // 30
    msg = struct.pack(">Q", counter)
    digest = hmac.new(key, msg, hashlib.sha1).digest()
    offset = digest[-1] & 0x0F
    binary = struct.unpack(">I", digest[offset:offset + 4])[0] & 0x7FFFFFFF
    return str(binary % 10**6).zfill(6)


def _hash_recovery_code(code: str) -> str:
    return hashlib.sha256(code.strip().encode("utf-8")).hexdigest()


class AuthService:

    # --------------------------------------------------
    async def register(self, db: AsyncSession, request: RegisterRequest) -> User:
        logger.info(
            "Registration attempt: email=%s username=%s account_type=%s",
            request.email,
            request.username,
            request.account_type,
        )

        existing_email = await user_repository.get_by_email(db, request.email)
        if existing_email:
            logger.warning("Registration rejected: email already exists email=%s", request.email)
            raise ValueError("Email already registered.")

        existing_username = await user_repository.get_by_username(db, request.username)
        if existing_username:
            suffix = uuid.uuid4().hex[:4]
            request.username = f"{request.username[:20]}_{suffix}"
            logger.info("Username collision — assigned new username=%s", request.username)

        account_type = request.account_type.upper()
        if account_type == "STUDENT":
            role = "student"
            status = "ACTIVE"
            requested_role = None
        elif account_type == "COLLEGE":
            role = "student"
            status = "PENDING_VERIFICATION"
            requested_role = "COLLEGE_ADMIN"
        elif account_type == "COMPANY":
            role = "student"
            status = "PENDING_VERIFICATION"
            requested_role = "COMPANY_ADMIN"
        else:
            raise ValueError("Unsupported account type.")

        hashed = await hash_password_async(request.password)
        user = User(
            username=request.username,
            email=request.email,
            full_name=request.full_name,
            password_hash=hashed,
            avatar_url=request.avatar_url,
            role=role,
            account_type=account_type,
            requested_role=requested_role,
            status=status,
            is_active=True,
            is_verified=account_type == "STUDENT",
            onboarding_completed=False,
        )

        created = await user_repository.create_user(db, user)
        db.add(UserStats(user_id=created.id, level=1, rating=1000, xp=0))
        db.add(UserSettings(user_id=created.id, theme="dark", language="python"))
        db.add(XP(user_id=created.id, total_xp=0, weekly_xp=0, daily_xp=0, level=1, rank=99999))
        await db.commit()
        await db.refresh(created)
        logger.info("User created successfully: user_id=%s email=%s account_type=%s status=%s", created.id, created.email, created.account_type, created.status)
        return created

    # --------------------------------------------------

    async def login(

        self,

        db: AsyncSession,

        request: LoginRequest,

        device_name: str | None = None,

        device_os: str | None = None,

        browser: str | None = None,

        ip_address: str | None = None,

        user_agent: str | None = None,

    ) -> dict:

        if not _is_login_allowed(request.email, ip_address):
            raise ValueError("Too many login attempts. Please try again later.")

        user = await user_repository.get_by_email(

            db,

            request.email,

        )

        if user is None:
            _record_failed_login(request.email, ip_address)
            raise ValueError(

                "Invalid email or password."

            )

        is_valid = await verify_password_async(

            request.password,

            user.password_hash,

        )

        if not is_valid:
            _record_failed_login(request.email, ip_address)
            raise ValueError(

                "Invalid email or password."

            )

        status_value = (getattr(user, "status", "ACTIVE") or "ACTIVE").upper()
        if status_value in {"REJECTED", "SUSPENDED"}:
            if status_value == "REJECTED":
                raise ValueError("Your account verification was rejected.")
            if status_value == "SUSPENDED":
                raise ValueError("Your account is suspended.")
        if status_value not in {"ACTIVE", "APPROVED", "PENDING_VERIFICATION"}:
            raise ValueError("User account is disabled.")

        if not user.is_active:
            raise ValueError("User account is disabled.")

        _clear_login_failures(request.email, ip_address)

        if user.two_factor_enabled:
            raise ValueError("Two-factor authentication is enabled for this account. Please complete the verification challenge.")

        # Validate selected portal role against stored user account role
        if request.role:
            req_role_upper = request.role.strip().upper()
            user_role_lower = (user.role or "user").strip().lower()

            student_roles = {"STUDENT", "USER"}
            college_roles = {"COLLEGE", "COLLEGE_ADMIN", "PLACEMENT_OFFICER", "FACULTY"}
            company_roles = {"COMPANY", "COMPANY_ADMIN", "RECRUITER"}

            role_mismatch = False
            if req_role_upper in student_roles:
                if user_role_lower not in {"user", "student"}:
                    role_mismatch = True
            elif req_role_upper in college_roles:
                if user_role_lower not in {"college", "college_admin", "placement_officer", "faculty"}:
                    role_mismatch = True
            elif req_role_upper in company_roles:
                if user_role_lower not in {"company", "company_admin", "recruiter"}:
                    role_mismatch = True

            if role_mismatch:
                target_portal = "Student"
                if user_role_lower in {"user", "student"}:
                    target_portal = "Student"
                elif user_role_lower in {"college", "college_admin", "placement_officer", "faculty"}:
                    target_portal = "College"
                elif user_role_lower in {"company", "company_admin", "recruiter"}:
                    target_portal = "Company"
                raise ValueError(
                    f"Your account is registered as a {target_portal} account. Please select {target_portal} to continue."
                )

        access_token = create_access_token(

            user.id,

        )

        refresh_token = create_refresh_token(

            user.id,

        )

        token = RefreshToken(

            user_id=user.id,

            token=refresh_token,

            device_name=device_name,

            device_os=device_os,

            browser=browser,

            ip_address=ip_address,

            user_agent=user_agent,

            expires_at=datetime.utcnow()

            + timedelta(

                days=settings.REFRESH_TOKEN_EXPIRE_DAYS,

            ),

        )

        await user_repository.save_refresh_token(

            db,

            token,

        )

        await user_repository.update_login(

            db,

            user,

        )

        return {

            "user": user,

            "access_token": access_token,

            "refresh_token": refresh_token,

            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,

        }

    # --------------------------------------------------

    async def refresh_access_token(

        self,

        db: AsyncSession,

        refresh_token: str,

    ) -> dict:

        stored = await user_repository.get_refresh_token(

            db,

            refresh_token,

        )

        if stored is None:

            raise ValueError(

                "Refresh token not found."

            )

        if stored.revoked:

            raise ValueError(

                "Refresh token revoked."

            )

        if stored.expired:

            raise ValueError(

                "Refresh token expired."

            )

        stored.last_used_at = datetime.utcnow()

        await db.commit()

        access = create_access_token(

            stored.user_id,

        )

        return {

            "access_token": access,

            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,

        }

    # --------------------------------------------------

    async def logout(

        self,

        db: AsyncSession,

        refresh_token: str,

    ) -> bool:

        return await user_repository.revoke_refresh_token(

            db,

            refresh_token,

        )

    # --------------------------------------------------

    async def logout_all_devices(

        self,

        db: AsyncSession,

        user_id: str,

    ) -> int:

        return await user_repository.revoke_all_user_tokens(

            db,

            user_id,

        )

    # --------------------------------------------------

    async def change_password(

        self,

        db: AsyncSession,

        user: User,

        request: ChangePasswordRequest,

    ) -> User:

        if not verify_password(

            request.current_password,

            user.password_hash,

        ):

            raise ValueError(

                "Current password is incorrect."

            )

        user.password_hash = hash_password(

            request.new_password,

        )

        return await user_repository.update_user(

            db,

            user,

        )

    # --------------------------------------------------

    async def setup_two_factor(self, db: AsyncSession, email: str, password: str) -> dict:
        user = await user_repository.get_by_email(db, email)
        if user is None:
            raise ValueError("Invalid email or password.")

        if not await verify_password_async(password, user.password_hash):
            raise ValueError("Invalid email or password.")

        secret = _generate_totp_secret()
        recovery_codes = [f"{uuid.uuid4().hex[:8].upper()}-{uuid.uuid4().hex[:8].upper()}" for _ in range(8)]
        user.two_factor_secret = secret
        user.two_factor_recovery_hashes = "[{}]".format(", ".join(f'"{_hash_recovery_code(code)}"' for code in recovery_codes))
        user.two_factor_enabled = False
        await user_repository.update_user(db, user)

        return {
            "secret": secret,
            "recovery_codes": recovery_codes,
            "otpauth_url": f"otpauth://totp/SkillBattle:{email}?secret={secret}&issuer=SkillBattle",
        }

    async def verify_two_factor(self, db: AsyncSession, email: str, code: str) -> dict:
        user = await user_repository.get_by_email(db, email)
        if user is None or not user.two_factor_secret:
            raise ValueError("Two-factor authentication is not configured for this account.")

        expected_code = _totp_code(user.two_factor_secret)
        if code.strip() != expected_code:
            raise ValueError("Invalid two-factor code.")

        user.two_factor_enabled = True
        await user_repository.update_user(db, user)
        return {"enabled": True, "message": "Two-factor authentication enabled."}

    async def verify_email(

        self,

        db: AsyncSession,

        user: User,

    ) -> User:

        user.is_verified = True

        return await user_repository.update_user(

            db,

            user,

        )


auth_service = AuthService()