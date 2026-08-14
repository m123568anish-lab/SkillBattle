"""
=========================================================

Local Storage

=========================================================
"""

from __future__ import annotations

from pathlib import Path

from .base import StorageProvider


class LocalStorage(StorageProvider):

    ROOT = Path("uploads")

    def __init__(self):

        self.ROOT.mkdir(

            exist_ok=True,

        )

    async def upload(

        self,

        file,

        filename: str,

    ) -> str:

        destination = self.ROOT / filename

        with open(

            destination,

            "wb",

        ) as output:

            output.write(

                await file.read(),

            )

        return filename

    async def delete(

        self,

        path: str,

    ):

        file = self.ROOT / path

        if file.exists():

            file.unlink()

    async def url(

        self,

        path: str,

    ):

        return f"/uploads/{path}"