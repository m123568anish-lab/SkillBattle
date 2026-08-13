"""
=========================================================

SkillBattle

PDF Resume Parser

Uses PyMuPDF to extract text from PDF resumes.

=========================================================
"""

from __future__ import annotations

from pathlib import Path

import fitz


class PDFParser:

    """
    PDF text extraction using PyMuPDF.
    """

    def extract_text(
        self,
        pdf_path: str,
    ) -> str:

        path = Path(pdf_path)

        if not path.exists():
            raise FileNotFoundError(
                f"File not found: {pdf_path}"
            )

        document = fitz.open(pdf_path)

        pages: list[str] = []

        try:

            for page in document:

                text = page.get_text("text")

                if text:
                    pages.append(text)

        finally:

            document.close()

        return "\n".join(pages)

    # ---------------------------------------------

    def page_count(
        self,
        pdf_path: str,
    ) -> int:

        document = fitz.open(pdf_path)

        try:
            return len(document)
        finally:
            document.close()

    # ---------------------------------------------

    def metadata(
        self,
        pdf_path: str,
    ) -> dict:

        document = fitz.open(pdf_path)

        try:

            return document.metadata

        finally:

            document.close()


pdf_parser = PDFParser()