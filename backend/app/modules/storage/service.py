"""
=========================================================

SkillBattle

Storage Service

=========================================================
"""

from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import UploadFile

from app.modules.storage.provider import (
    storage_provider,
)


class StorageService:

    async def upload(

        self,

        file: UploadFile,

        folder: str = "general",

    ) -> dict:

        extension = Path(

            file.filename,

        ).suffix

        filename = (

            f"{folder}/"

            f"{uuid.uuid4()}{extension}"

        )

        path = await storage_provider.upload(

            file,

            filename,

        )

        url = await storage_provider.url(

            path,

        )

        return {

            "filename": filename,

            "path": path,

            "url": url,

        }

    async def delete(

        self,

        path: str,

    ):

        await storage_provider.delete(

            path,

        )


storage_service = StorageService()