"""
=========================================================

Email Templates

=========================================================
"""

from __future__ import annotations


class EmailTemplates:

    @staticmethod
    def verification(

        username: str,

        verification_url: str,

    ):

        return f"""
Hello {username},

Welcome to SkillBattle!

Please verify your account.

{verification_url}

Thank you.

SkillBattle Team
"""

    @staticmethod
    def password_reset(

        username: str,

        reset_url: str,

    ):

        return f"""
Hello {username},

Reset your password using the link below.

{reset_url}

If you didn't request this, ignore this email.

SkillBattle Team
"""

    @staticmethod
    def welcome(

        username: str,

    ):

        return f"""
Welcome {username}!

Your SkillBattle account is ready.

Happy Coding!

SkillBattle Team
"""


email_templates = EmailTemplates()