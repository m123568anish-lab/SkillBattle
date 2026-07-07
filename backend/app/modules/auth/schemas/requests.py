"""
=========================================================

SkillBattle

Authentication Request Schemas

=========================================================
"""

from __future__ import annotations

from pydantic import BaseModel
from pydantic import ConfigDict
from pydantic import EmailStr
from pydantic import Field


class RegisterRequest(BaseModel):

    username: str = Field(
        min_length=3,
        max_length=30,
    )

    email: EmailStr

    full_name: str = Field(
        min_length=2,
        max_length=255,
    )

    password: str = Field(
        min_length=8,
        max_length=128,
    )

    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )


class LoginRequest(BaseModel):

    email: EmailStr

    password: str

    model_config = ConfigDict(
        extra="forbid",
    )


class RefreshTokenRequest(BaseModel):

    refresh_token: str


class ChangePasswordRequest(BaseModel):

    current_password: str

    new_password: str = Field(
        min_length=8,
        max_length=128,
    )


class ForgotPasswordRequest(BaseModel):

    email: EmailStr


class ResetPasswordRequest(BaseModel):

    token: str

    new_password: str = Field(
        min_length=8,
        max_length=128,
    )