"""
=========================================================

SkillBattle

Authentication Request Schemas — Pydantic v2, strict validation

=========================================================
"""

from __future__ import annotations

import re
from typing import Annotated

from pydantic import BaseModel
from pydantic import ConfigDict
from pydantic import EmailStr
from pydantic import Field
from pydantic import field_validator

# ---------------------------------------------------------------------------
# Safe-string patterns — block XSS, SQLi, and control characters.
# ---------------------------------------------------------------------------
_SAFE_NAME = re.compile(r"^[\w\s'\-.,À-ÿ]+$")       # letters, spaces, accents, hyphens, apostrophes
_SAFE_USERNAME = re.compile(r"^[a-zA-Z0-9_\-\.]+$")  # alphanumeric + _ - .
_HTTP_URL = re.compile(r"^https?://[^\s<>\"']+$")


class RegisterRequest(BaseModel):

    username: str = Field(min_length=1, max_length=50)
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=120)
    password: str = Field(min_length=8, max_length=128)
    avatar_url: str | None = Field(default=None, max_length=500)

    model_config = ConfigDict(
        extra="forbid",           # Reject unknown/extra fields
        str_strip_whitespace=True,
    )

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if not _SAFE_USERNAME.match(v):
            raise ValueError(
                "Username may only contain letters, numbers, underscores, hyphens, and dots."
            )
        return v.lower()

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        if not _SAFE_NAME.match(v):
            raise ValueError("Full name contains invalid characters.")
        return v

    @field_validator("avatar_url")
    @classmethod
    def validate_avatar_url(cls, v: str | None) -> str | None:
        if v is not None:
            v_str = v.strip()
            if not v_str:
                return None
            if not (v_str.startswith("http://") or v_str.startswith("https://") or v_str.startswith("data:image/") or v_str.startswith("blob:")):
                # If invalid URL, fallback to default dicebear avatar instead of rejecting registration
                return "https://api.dicebear.com/7.x/bottts/svg?seed=CyberCoder"
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        # Must contain at least one digit and one letter
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit.")
        if not any(c.isalpha() for c in v):
            raise ValueError("Password must contain at least one letter.")
        return v


class LoginRequest(BaseModel):

    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

    model_config = ConfigDict(extra="forbid")


class RefreshTokenRequest(BaseModel):

    refresh_token: str = Field(min_length=10, max_length=2048)

    model_config = ConfigDict(extra="forbid")


class ChangePasswordRequest(BaseModel):

    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)

    model_config = ConfigDict(extra="forbid")

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        if not any(c.isdigit() for c in v):
            raise ValueError("New password must contain at least one digit.")
        if not any(c.isalpha() for c in v):
            raise ValueError("New password must contain at least one letter.")
        return v


class ForgotPasswordRequest(BaseModel):

    email: EmailStr

    model_config = ConfigDict(extra="forbid")


class ResetPasswordRequest(BaseModel):

    token: str = Field(min_length=10, max_length=2048)
    new_password: str = Field(min_length=8, max_length=128)

    model_config = ConfigDict(extra="forbid")