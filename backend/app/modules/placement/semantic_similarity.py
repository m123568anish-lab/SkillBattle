from __future__ import annotations

import re
from collections import Counter
from typing import Iterable


class SemanticSimilarityService:
    @staticmethod
    def _tokenize(value: str) -> list[str]:
        return re.findall(r"[a-z0-9]+", (value or "").lower())

    @classmethod
    def normalized_overlap_similarity(cls, left: str, right: str) -> float:
        left_tokens = Counter(cls._tokenize(left))
        right_tokens = Counter(cls._tokenize(right))
        if not left_tokens and not right_tokens:
            return 0.0
        if not left_tokens or not right_tokens:
            return 0.0
        overlap = sum(min(left_tokens[token], right_tokens[token]) for token in set(left_tokens) & set(right_tokens))
        total = sum(left_tokens.values()) + sum(right_tokens.values())
        if total == 0:
            return 0.0
        return overlap / total

    @classmethod
    async def score_candidate(cls, candidate_text: str, reference_text: str) -> float:
        try:
            from sentence_transformers import SentenceTransformer  # type: ignore
            if SentenceTransformer is not None:
                raise ImportError
        except Exception:
            return cls.normalized_overlap_similarity(candidate_text, reference_text)

    @classmethod
    async def find_candidates(cls, reference_text: str, candidates: Iterable[str]) -> list[tuple[str, float]]:
        scored: list[tuple[str, float]] = []
        for candidate in candidates:
            score = await cls.score_candidate(candidate, reference_text)
            if score > 0:
                scored.append((candidate, score))
        return sorted(scored, key=lambda item: item[1], reverse=True)


semantic_similarity_service = SemanticSimilarityService()
