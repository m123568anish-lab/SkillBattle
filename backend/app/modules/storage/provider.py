"""
=========================================================

SkillBattle

Storage Provider Factory

=========================================================
"""

from __future__ import annotations

from app.core.config import settings

from app.modules.storage.providers import (
    LocalStorage,
    S3Storage,
    CloudinaryStorage,
    MinIOStorage,
)


class StorageFactory:

    @staticmethod
    def get():

        provider = getattr(

            settings,

            "STORAGE_PROVIDER",

            "local",

        ).lower()

        if provider == "local":

            return LocalStorage()

        if provider == "s3":

            return S3Storage()

        if provider == "cloudinary":

            return CloudinaryStorage()

        if provider == "minio":

            return MinIOStorage()

        raise ValueError(

            f"Unknown storage provider: {provider}"

        )


storage_provider = StorageFactory.get()