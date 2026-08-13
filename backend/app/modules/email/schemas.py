"""
=========================================================

Email Schemas

=========================================================
"""

from __future__ import annotations

from pydantic import BaseModel
from pydantic import EmailStr


class EmailRequest(BaseModel):

    recipient: EmailStr

    subject: str

    body: str


class VerificationEmailRequest(BaseModel):

    recipient: EmailStr

    username: str

    verification_url: str


class PasswordResetRequest(BaseModel):

    recipient: EmailStr

    username: str

    reset_url: str