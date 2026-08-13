"""
=========================================================

SkillBattle

RAG Engine

=========================================================
"""

from __future__ import annotations

from app.modules.ai.embeddings import (
    embedding_engine,
)

from app.modules.ai.vectorstore import (
    vector_store,
)

from app.modules.ai.provider import (
    ai_provider,
)


class RAGEngine:

    # =====================================================
    # Ask
    # =====================================================

    async def ask(
        self,
        question: str,
    ) -> str:

        embedding = await embedding_engine.embed(
            question,
        )

        context = await vector_store.search(
            embedding,
        )

        context_text = "\n\n".join(

            str(item["metadata"])

            for item in context

        )

        prompt = f"""
Context

{context_text}

Question

{question}

Answer using the context above.
"""

        return await ai_provider.generate(
            prompt,
        )

    # =====================================================
    # Index Document
    # =====================================================

    async def index(
        self,
        document_id: str,
        text: str,
        metadata: dict,
    ):

        embedding = await embedding_engine.embed(
            text,
        )

        await vector_store.add(

            document_id,

            embedding,

            metadata,

        )


rag_engine = RAGEngine()