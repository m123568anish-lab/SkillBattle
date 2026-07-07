"""
=========================================================

SkillBattle

File Storage Service

Handles secure storage of uploaded resumes.

=========================================================
"""

from __future__ import annotations

import hashlib
import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException
from fastapi import UploadFile
from starlette import status

from app.core.config import settings


class FileStorage:

    ALLOWED_TYPES = {
        "application/pdf": ".pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    }

    def __init__(self) -> None:

        self.upload_dir = Path(settings.UPLOAD_DIR)

        self.upload_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

    # =====================================================
    # Validation
    # =====================================================

    def validate_file(
        self,
        file: UploadFile,
    ) -> None:

        if file.content_type not in self.ALLOWED_TYPES:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF and DOCX files are allowed.",
            )

    # =====================================================
    # Save File
    # =====================================================

    async def save(
        self,
        file: UploadFile,
    ) -> dict:

        self.validate_file(file)

        extension = self.ALLOWED_TYPES[file.content_type]

        filename = f"{uuid4()}{extension}"

        destination = self.upload_dir / filename

        size = 0

        sha256 = hashlib.sha256()

        with destination.open("wb") as buffer:

            while True:

                chunk = await file.read(1024 * 1024)

                if not chunk:
                    break

                size += len(chunk)

                if size > settings.MAX_UPLOAD_SIZE:

                    destination.unlink(missing_ok=True)

                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="File exceeds maximum upload size.",
                    )

                sha256.update(chunk)

                buffer.write(chunk)

        await file.close()

        return {

            "stored_filename": filename,

            "original_filename": file.filename,

            "content_type": file.content_type,

            "file_path": str(destination),

            "file_size": size,

            "checksum": sha256.hexdigest(),

        }

    # =====================================================
    # Delete
    # =====================================================

    def delete(
        self,
        path: str,
    ) -> bool:

        file_path = Path(path)

        if not file_path.exists():

            return False

        file_path.unlink()

        return True

    # =====================================================
    # Exists
    # =====================================================

    def exists(
        self,
        path: str,
    ) -> bool:

        return Path(path).exists()

    # =====================================================
    # Read Bytes
    # =====================================================

    def read(
        self,
        path: str,
    ) -> bytes:

        return Path(path).read_bytes()


file_storage = FileStorage()