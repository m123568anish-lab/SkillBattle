"""
=========================================================
SkillBattle / Qubira — File Upload Security Utility

Validates uploaded file contents using actual file signatures
(magic bytes), prevents path traversal, and enforces strict
size and extension allowlists.
=========================================================
"""

from __future__ import annotations

import os
import re
import uuid
from pathlib import Path
from typing import Final

# Maximum file sizes
MAX_IMAGE_SIZE_BYTES: Final[int] = 5 * 1024 * 1024       # 5 MB for avatars/images
MAX_DOCUMENT_SIZE_BYTES: Final[int] = 15 * 1024 * 1024   # 15 MB for resumes/documents

# Allowed image extensions & signatures
IMAGE_MAGIC_SIGNATURES: Final[dict[str, list[bytes]]] = {
    ".jpg": [b"\xFF\xD8\xFF"],
    ".jpeg": [b"\xFF\xD8\xFF"],
    ".png": [b"\x89PNG\r\n\x1a\n"],
    ".gif": [b"GIF87a", b"GIF89a"],
    ".webp": [b"RIFF"],  # Checked further: bytes 8-12 must be b"WEBP"
}

# Allowed document extensions & signatures
DOCUMENT_MAGIC_SIGNATURES: Final[dict[str, list[bytes]]] = {
    ".pdf": [b"%PDF-"],
    ".docx": [b"PK\x03\x04"],  # ZIP container used by OOXML (.docx)
}

ALLOWED_AVATAR_EXTENSIONS: Final[set[str]] = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_DOCUMENT_EXTENSIONS: Final[set[str]] = {".pdf", ".docx"}


class FileValidationError(ValueError):
    """Raised when an uploaded file fails security validation."""
    pass


def sanitize_filename(filename: str) -> str:
    """
    Remove directory traversal sequences, control characters, and dangerous characters.
    Returns a clean base name.
    """
    if not filename or not isinstance(filename, str):
        return f"file_{uuid.uuid4().hex[:8]}"

    # Strip path separators and null bytes
    cleaned = filename.replace("\x00", "").replace("\\", "/").split("/")[-1].strip()

    # Retain only safe alphanumeric characters, dashes, underscores, and dots
    cleaned = re.sub(r"[^\w.\-]", "_", cleaned)
    cleaned = re.sub(r"\.{2,}", ".", cleaned)  # collapse multiple dots

    if not cleaned or cleaned.startswith("."):
        cleaned = f"file_{uuid.uuid4().hex[:8]}{cleaned}"

    return cleaned[:100]


def validate_image_file(
    content: bytes,
    original_filename: str,
    *,
    max_size: int = MAX_IMAGE_SIZE_BYTES,
) -> tuple[str, str]:
    """
    Validate an image upload by checking:
    1. Size limit
    2. Extension allowlist
    3. Magic byte signature (actual file bytes)
    
    Returns:
        (sanitized_filename, validated_extension)
    """
    if not content:
        raise FileValidationError("Uploaded file is empty.")

    if len(content) > max_size:
        raise FileValidationError(
            f"File size ({len(content)} bytes) exceeds the maximum limit of {max_size // (1024 * 1024)} MB."
        )

    clean_name = sanitize_filename(original_filename)
    ext = os.path.splitext(clean_name)[1].lower()

    if ext not in ALLOWED_AVATAR_EXTENSIONS:
        raise FileValidationError(
            f"Unsupported image extension '{ext}'. Allowed formats: {', '.join(sorted(ALLOWED_AVATAR_EXTENSIONS))}"
        )

    signatures = IMAGE_MAGIC_SIGNATURES.get(ext, [])
    matches_signature = any(content.startswith(sig) for sig in signatures)

    # Special check for WebP: begins with RIFF, bytes 8-12 must be WEBP
    if ext == ".webp":
        matches_signature = content.startswith(b"RIFF") and len(content) > 12 and content[8:12] == b"WEBP"

    if not matches_signature:
        raise FileValidationError(
            f"File content does not match the expected signature for {ext} image."
        )

    return clean_name, ext


def validate_document_file(
    content: bytes,
    original_filename: str,
    *,
    max_size: int = MAX_DOCUMENT_SIZE_BYTES,
) -> tuple[str, str]:
    """
    Validate a document upload (.pdf, .docx) by checking:
    1. Size limit
    2. Extension allowlist
    3. Magic byte signature
    
    Returns:
        (sanitized_filename, validated_extension)
    """
    if not content:
        raise FileValidationError("Uploaded document is empty.")

    if len(content) > max_size:
        raise FileValidationError(
            f"Document size exceeds maximum limit of {max_size // (1024 * 1024)} MB."
        )

    clean_name = sanitize_filename(original_filename)
    ext = os.path.splitext(clean_name)[1].lower()

    if ext not in ALLOWED_DOCUMENT_EXTENSIONS:
        raise FileValidationError(
            f"Unsupported document type '{ext}'. Allowed formats: {', '.join(sorted(ALLOWED_DOCUMENT_EXTENSIONS))}"
        )

    signatures = DOCUMENT_MAGIC_SIGNATURES.get(ext, [])
    if not any(content.startswith(sig) for sig in signatures):
        raise FileValidationError(
            f"File content does not match the valid signature for a {ext} document."
        )

    return clean_name, ext


def safe_storage_path(base_or_path: str | Path, target_filename: str | None = None) -> str:
    """
    Resolve and verify that target_filename resolves strictly inside base_dir,
    or if single argument provided, verifies no directory traversal (../ or root escape).
    Returns sanitized normalized POSIX path string.
    """
    if target_filename is not None:
        base = Path(base_or_path).resolve()
        target = (base / target_filename).resolve()
        if not str(target).startswith(str(base)):
            raise FileValidationError("Path traversal attempt detected.")
        return str(target)

    # Single path verification
    raw_path = str(base_or_path).replace("\\", "/").strip()
    if "\x00" in raw_path or ".." in raw_path.split("/") or raw_path.startswith("/") or ":" in raw_path:
        raise FileValidationError("Invalid or traversing path detected.")

    # Normalize parts
    parts = [p for p in raw_path.split("/") if p and p != "."]
    if not parts or any(p == ".." for p in parts):
        raise FileValidationError("Invalid path structure.")

    return "/".join(parts)
