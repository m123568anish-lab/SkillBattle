"""
=========================================================

SkillBattle

Embedding Engine

=========================================================
"""

from __future__ import annotations

import hashlib


class EmbeddingEngine:

    """
    Placeholder embedding engine.

    Replace with sentence-transformers,
    OpenAI embeddings or Ollama embeddings later.
    """

    async def embed(
        self,
        text: str,
    ) -> list[float]:

        digest = hashlib.sha256(
            text.encode("utf-8")
        ).digest()

        return [

            byte / 255.0

            for byte in digest[:128]

        ]


embedding_engine = EmbeddingEngine()