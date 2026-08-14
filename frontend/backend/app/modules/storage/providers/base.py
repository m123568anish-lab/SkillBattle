"""
=========================================================

Storage Provider

=========================================================
"""

from __future__ import annotations

from abc import ABC
from abc import abstractmethod


class StorageProvider(ABC):

    @abstractmethod
    async def upload(
        self,
        file,
        filename: str,
    ) -> str:
        ...

    @abstractmethod
    async def delete(
        self,
        path: str,
    ):
        ...

    @abstractmethod
    async def url(
        self,
        path: str,
    ) -> str:
        ...