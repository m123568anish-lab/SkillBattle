"""
=========================================================

SMTP Email Provider

=========================================================
"""

from __future__ import annotations

import aiosmtplib
from email.message import EmailMessage

from app.core.config import settings


class EmailProvider:

    async def send(

        self,

        recipient: str,

        subject: str,

        body: str,

    ):

        message = EmailMessage()

        message["From"] = settings.SMTP_FROM

        message["To"] = recipient

        message["Subject"] = subject

        message.set_content(body)

        await aiosmtplib.send(

            message,

            hostname=settings.SMTP_HOST,

            port=settings.SMTP_PORT,

            username=settings.SMTP_USERNAME,

            password=settings.SMTP_PASSWORD,

            start_tls=True,

        )


email_provider = EmailProvider()