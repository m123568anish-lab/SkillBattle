"""
=========================================================

SkillBattle

Email Service

Production Version

=========================================================
"""

from __future__ import annotations

import logging

from app.modules.email.provider import (
    email_provider,
)

from app.modules.email.templates import (
    email_templates,
)

logger = logging.getLogger(__name__)


class EmailService:

    # =====================================================
    # Generic Email
    # =====================================================

    async def send_email(
        self,
        recipient: str,
        subject: str,
        body: str,
    ):

        await email_provider.send(

            recipient,

            subject,

            body,

        )

        logger.info(

            "Email sent to %s",

            recipient,

        )

    # =====================================================
    # Welcome Email
    # =====================================================

    async def send_welcome_email(
        self,
        recipient: str,
        username: str,
    ):

        await self.send_email(

            recipient,

            "Welcome to SkillBattle",

            email_templates.welcome(

                username,

            ),

        )

    # =====================================================
    # Verification Email
    # =====================================================

    async def send_verification_email(
        self,
        recipient: str,
        username: str,
        verification_url: str,
    ):

        await self.send_email(

            recipient,

            "Verify Your Email",

            email_templates.verification(

                username,

                verification_url,

            ),

        )

    # =====================================================
    # Password Reset
    # =====================================================

    async def send_password_reset_email(
        self,
        recipient: str,
        username: str,
        reset_url: str,
    ):

        await self.send_email(

            recipient,

            "Reset Password",

            email_templates.password_reset(

                username,

                reset_url,

            ),

        )


email_service = EmailService()