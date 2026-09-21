"""
=========================================================
SkillBattle Cloud Storage Service (Cloudinary Integration)
=========================================================
"""

import logging
import os

from app.core.config import settings

logger = logging.getLogger(__name__)


def is_cloudinary_configured() -> bool:
    """Check if valid Cloudinary credentials are provided in settings."""
    return bool(
        settings.CLOUDINARY_CLOUD_NAME
        and settings.CLOUDINARY_API_KEY
        and settings.CLOUDINARY_API_SECRET
    )


def upload_file(file_path_or_bytes, folder: str = "skillbattle/uploads", public_id: str | None = None) -> str:
    """
    Upload file/image to Cloudinary.
    Falls back to local file path if Cloudinary credentials are not configured.
    """
    if not is_cloudinary_configured():
        logger.info("ℹ️ Cloudinary credentials missing - storing upload locally.")
        if isinstance(file_path_or_bytes, str):
            return f"/uploads/{os.path.basename(file_path_or_bytes)}"
        return "/uploads/default_avatar.png"

    try:
        import cloudinary
        import cloudinary.uploader

        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
            secure=True
        )

        upload_options = {"folder": folder}
        if public_id:
            upload_options["public_id"] = public_id
            upload_options["overwrite"] = True

        result = cloudinary.uploader.upload(file_path_or_bytes, **upload_options)
        url = result.get("secure_url", "")
        logger.info(f"✅ Cloudinary upload successful: {url}")
        return url
    except Exception as e:
        logger.error(f"❌ Cloudinary upload failed: {e}", exc_info=True)
        return "/uploads/default_avatar.png"
