"""
=========================================================

SkillBattle

Vector Store

=========================================================
"""

from __future__ import annotations

import math


class VectorStore:

    def __init__(self):

        self.documents = []

    # =====================================================
    # Add
    # =====================================================

    async def add(

        self,

        document_id: str,

        embedding: list[float],

        metadata: dict,

    ):

        self.documents.append(

            {

                "id": document_id,

                "embedding": embedding,

                "metadata": metadata,

            }

        )

    # =====================================================
    # Search
    # =====================================================

    async def search(

        self,

        embedding: list[float],

        top_k: int = 5,

    ):

        scored = []

        for document in self.documents:

            similarity = self.cosine_similarity(

                embedding,

                document["embedding"],

            )

            scored.append(

                (

                    similarity,

                    document,

                )

            )

        scored.sort(

            reverse=True,

            key=lambda item: item[0],

        )

        return [

            doc

            for _, doc in scored[:top_k]

        ]

    # =====================================================
    # Cosine Similarity
    # =====================================================

    @staticmethod
    def cosine_similarity(

        a,

        b,

    ):

        dot = sum(

            x * y

            for x, y in zip(a, b)

        )

        norm_a = math.sqrt(

            sum(

                x * x

                for x in a

            )

        )

        norm_b = math.sqrt(

            sum(

                y * y

                for y in b

            )

        )

        if norm_a == 0 or norm_b == 0:

            return 0.0

        return dot / (norm_a * norm_b)


vector_store = VectorStore()