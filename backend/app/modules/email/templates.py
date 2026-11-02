"""
=========================================================
Email Templates — QUBIRA
=========================================================
"""

from __future__ import annotations


class EmailTemplates:

    @staticmethod
    def verification(username: str, verification_url: str) -> str:
        return f"""
Hello {username},

Welcome to Qubira!

Please verify your account using the secure link below:

{verification_url}

Learn. Build. Compete.

Thank you,
The Qubira Team
"""

    @staticmethod
    def password_reset(username: str, reset_url: str) -> str:
        return f"""
Hello {username},

Reset your Qubira password using the link below:

{reset_url}

If you did not request this, you can safely ignore this email.

The Qubira Team
"""

    @staticmethod
    def welcome(username: str) -> str:
        return f"""
Welcome {username}!

Your Qubira account is ready.

Start practicing code, taking interactive quizzes, and joining live challenges!

Learn. Build. Compete.

The Qubira Team
"""


email_templates = EmailTemplates()
