"""
=========================================================
SkillBattle Email Service (Resend Integration)
=========================================================
"""

import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


def send_otp_email(to_email: str, otp_code: str) -> bool:
    """
    Send 6-digit OTP verification email via Resend API.
    Falls back to logging plain OTP if RESEND_API_KEY is not configured.
    """
    if not settings.RESEND_API_KEY or settings.RESEND_API_KEY.startswith("re_placeholder"):
        logger.info(f"📧 [DEV MODE] OTP for {to_email}: {otp_code}")
        return True

    try:
        import resend
        resend.api_key = settings.RESEND_API_KEY

        params = {
            "from": settings.EMAIL_FROM,
            "to": [to_email],
            "subject": "Your SkillBattle Verification Code",
            "html": f"""
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #6366f1; text-align: center;">SkillBattle</h2>
                <p>Hello,</p>
                <p>Your verification code is below. Enter this code in SkillBattle to verify your account:</p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #111827; margin: 20px 0;">
                    {otp_code}
                </div>
                <p style="font-size: 13px; color: #6b7280;">This code will expire in 10 minutes. If you did not request this code, please ignore this email.</p>
            </div>
            """
        }
        response = resend.Emails.send(params)
        logger.info(f"✅ OTP email sent successfully to {to_email}. Response: {response}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to send OTP email via Resend: {e}", exc_info=True)
        return False
