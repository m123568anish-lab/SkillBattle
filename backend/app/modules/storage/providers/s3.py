"""
=========================================================

AWS S3 Storage

=========================================================
"""

from __future__ import annotations

from .base import StorageProvider
import os
import tempfile


class S3Storage(StorageProvider):

    async def upload(
        self,
        file,
        filename: str,
    ):
        # Local fallback to store file in temp dir for development/testing.
        tmp = tempfile.gettempdir()
        dest = os.path.join(tmp, "skillbattle_uploads")
        os.makedirs(dest, exist_ok=True)
        dest_path = os.path.join(dest, filename)
        if hasattr(file, "read"):
            content = file.read()
        else:
            content = file
        mode = "wb" if isinstance(content, (bytes, bytearray)) else "w"
        with open(dest_path, mode) as f:
            f.write(content)
        return dest_path

    async def delete(
        self,
        path: str,
    ):
        try:
            os.remove(path)
            return True
        except Exception:
            return False

    async def url(
        self,
        path: str,
    ):
        return f"file://{path}"