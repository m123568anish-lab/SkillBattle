"""
=========================================================

SkillBattle

Authentication Response Schemas

=========================================================
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel
from pydantic import ConfigDict
from pydantic import EmailStr


class UserResponse(BaseModel):

    id: str

    username: str

    email: EmailStr

    full_name: str

    role: str

    is_verified: bool

    avatar_url: str | None = None

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


class TokenResponse(BaseModel):

    access_token: str

    refresh_token: str

    token_type: str = "bearer"

    expires_in: int


class LoginResponse(BaseModel):

    user: UserResponse

    tokens: TokenResponse


class MessageResponse(BaseModel):

    message: str


class RefreshResponse(BaseModel):

    access_token: str

    token_type: str = "bearer"

    expires_in: int