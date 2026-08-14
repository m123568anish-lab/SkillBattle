"""
=========================================================

SkillBattle

Parser Manager

Automatically selects the correct parser
and cleans extracted text.

=========================================================
"""

from __future__ import annotations

from pathlib import Path

from app.modules.career.parsers.pdf_parser import (
    pdf_parser,
)

from app.modules.career.parsers.docx_parser import (
    docx_parser,
)

from app.modules.career.parsers.text_cleaner import (
    text_cleaner,
)


class ParserManager:

    """
    Central Resume Parser
    """

    SUPPORTED_EXTENSIONS = {

        ".pdf",

        ".docx",

    }

    # --------------------------------------------------
    # Parse Resume
    # --------------------------------------------------

    def parse(

        self,

        file_path: str,

    ) -> dict:

        path = Path(file_path)

        if not path.exists():

            raise FileNotFoundError(

                f"Resume not found: {file_path}"

            )

        extension = path.suffix.lower()

        if extension not in self.SUPPORTED_EXTENSIONS:

            raise ValueError(

                f"Unsupported file format: {extension}"

            )

        # ------------------------------------------

        if extension == ".pdf":

            raw_text = pdf_parser.extract_text(

                file_path,

            )

            metadata = pdf_parser.metadata(

                file_path,

            )

            pages = pdf_parser.page_count(

                file_path,

            )

        else:

            raw_text = docx_parser.extract_text(

                file_path,

            )

            metadata = docx_parser.metadata(

                file_path,

            )

            pages = docx_parser.paragraph_count(

                file_path,

            )

        # ------------------------------------------

        cleaned_text = text_cleaner.clean(

            raw_text,

        )

        return {

            "extension": extension,

            "raw_text": raw_text,

            "clean_text": cleaned_text,

            "word_count": text_cleaner.word_count(

                cleaned_text,

            ),

            "character_count": text_cleaner.character_count(

                cleaned_text,

            ),

            "pages": pages,

            "metadata": metadata,

        }

    # --------------------------------------------------

    def supported_formats(

        self,

    ) -> list[str]:

        return sorted(

            self.SUPPORTED_EXTENSIONS,

        )


parser_manager = ParserManager()