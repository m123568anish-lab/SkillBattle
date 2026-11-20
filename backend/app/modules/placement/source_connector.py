from __future__ import annotations

import html
import re
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.placement_jobs import PlacementSourceRecord
from app.modules.placement.intelligence_service import get_topic_taxonomy


class PublicSourceConnector:
    """Fetches a permitted public resource and records source provenance."""

    ALLOWED_HOSTS = {
        "www.google.com",
        "career.google.com",
        "www.microsoft.com",
        "careers.microsoft.com",
        "www.amazon.jobs",
        "www.geeksforgeeks.org",
        "www.interviewbit.com",
        "github.com",
        "raw.githubusercontent.com",
    }

    @staticmethod
    def _strip_html(value: str) -> str:
        text = html.unescape(value or "")
        text = re.sub(r"<script.*?</script>", " ", text, flags=re.S | re.I)
        text = re.sub(r"<style.*?</style>", " ", text, flags=re.S | re.I)
        text = re.sub(r"<[^>]+>", " ", text)
        text = re.sub(r"\s+", " ", text)
        return text.strip()

    @staticmethod
    def _extract_title(raw: str) -> str:
        match = re.search(r"<title[^>]*>(.*?)</title>", raw, flags=re.I | re.S)
        if match:
            return PublicSourceConnector._strip_html(match.group(1))[:220]
        return "Public placement preparation resource"

    @staticmethod
    def _extract_summary(raw: str) -> str:
        cleaned = PublicSourceConnector._strip_html(raw)
        if len(cleaned) <= 260:
            return cleaned
        return cleaned[:260].rstrip() + "..."

    @staticmethod
    def _extract_topics(raw: str) -> list[str]:
        text = (raw or "").lower()
        matches: list[str] = []
        tax = get_topic_taxonomy()
        for category, topics in tax.items():
            for topic in topics:
                if topic.lower() in text:
                    matches.append(topic)
        return matches[:10]

    @classmethod
    async def fetch_and_record(
        cls,
        db: AsyncSession,
        source_url: str,
        *,
        company: str = "",
        role: str = "",
        source_classification: str = "official-public-material",
        license: str = "public reference resource",
    ) -> PlacementSourceRecord:
        normalized = (source_url or "").strip()
        if not normalized:
            raise ValueError("source_url is required.")

        existing = (
            await db.execute(select(PlacementSourceRecord).where(PlacementSourceRecord.source_url == normalized))
        ).scalar_one_or_none()
        if existing is not None:
            return existing

        host = re.sub(r"^https?://", "", normalized).split("/", 1)[0].lower()
        if host not in cls.ALLOWED_HOSTS and not host.endswith(".githubusercontent.com"):
            raise ValueError(f"Public source host '{host}' is not approved for placement ingestion.")

        async with httpx.AsyncClient(timeout=25) as client:
            response = await client.get(normalized)
            response.raise_for_status()
            raw_html = response.text

        title = cls._extract_title(raw_html)
        summary = cls._extract_summary(raw_html)
        extracted_topics = cls._extract_topics(raw_html)
        record = PlacementSourceRecord(
            source_url=normalized,
            source_classification=source_classification,
            company=company,
            role=role,
            title=title,
            summary=summary,
            topics=sorted(set(extracted_topics)),
            extracted_topics=sorted(set(extracted_topics)),
            license=license,
            raw_content=raw_html[:12000],
            processed=True,
        )
        db.add(record)
        await db.commit()
        await db.refresh(record)
        return record


public_source_connector = PublicSourceConnector()
