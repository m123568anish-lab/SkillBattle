"""
=========================================================
SkillBattle Career Platform

OCR Parser

Features
--------
✔ OCR for scanned resumes
✔ Multi-page support
✔ Image preprocessing
✔ Confidence detection
✔ Ready for Resume Engine integration

=========================================================
"""

from __future__ import annotations

import logging
import re
from pathlib import Path
from typing import Any

import fitz
import pytesseract
from PIL import Image

logger = logging.getLogger(__name__)


class OCRParser:

    SUPPORTED_EXTENSIONS = {

        ".pdf",

        ".png",

        ".jpg",

        ".jpeg",

    }

    # --------------------------------------------------

    def parse(

        self,

        file_path: str,

    ) -> dict[str, Any]:

        path = Path(file_path)

        self._validate(path)

        suffix = path.suffix.lower()

        if suffix == ".pdf":

            return self._parse_pdf(path)

        return self._parse_image(path)

    # --------------------------------------------------

    def _validate(

        self,

        path: Path,

    ):

        if not path.exists():

            raise FileNotFoundError(path)

        if path.suffix.lower() not in self.SUPPORTED_EXTENSIONS:

            raise ValueError(

                f"Unsupported file: {path}"

            )

    # --------------------------------------------------

    def _parse_pdf(

        self,

        path: Path,

    ) -> dict[str, Any]:

        document = fitz.open(path)

        pages = []

        for page in document:

            pix = page.get_pixmap(

                dpi=300,

            )

            image = Image.frombytes(

                "RGB",

                [

                    pix.width,

                    pix.height,

                ],

                pix.samples,

            )

            image = self.preprocess(image)

            text = pytesseract.image_to_string(

                image,

            )

            pages.append(text)

        document.close()

        combined = "\n\n".join(pages)

        return {

            "text": self.clean_text(

                combined,

            ),

            "pages": len(pages),

            "confidence": self.confidence(

                combined,

            ),

            "ocr": True,

        }

    # --------------------------------------------------

    def _parse_image(

        self,

        path: Path,

    ) -> dict[str, Any]:

        image = Image.open(path)

        image = self.preprocess(image)

        text = pytesseract.image_to_string(

            image,

        )

        return {

            "text": self.clean_text(

                text,

            ),

            "pages": 1,

            "confidence": self.confidence(

                text,

            ),

            "ocr": True,

        }

    # --------------------------------------------------

    def preprocess(

        self,

        image: Image.Image,

    ) -> Image.Image:

        image = image.convert("L")

        image = image.point(

            lambda p:

            255 if p > 150 else 0

        )

        return image

    # --------------------------------------------------

    def clean_text(

        self,

        text: str,

    ) -> str:

        text = text.replace(

            "\u00a0",

            " ",

        )

        text = re.sub(

            r"[ ]{2,}",

            " ",

            text,

        )

        text = re.sub(

            r"\n{3,}",

            "\n\n",

            text,

        )

        return text.strip()

    # --------------------------------------------------

    def confidence(

        self,

        text: str,

    ) -> float:

        words = len(

            text.split()

        )

        if words < 30:

            return 30.0

        if words < 100:

            return 70.0

        return 95.0

    # --------------------------------------------------

    def should_use_ocr(

        self,

        extracted_text: str,

    ) -> bool:

        return len(

            extracted_text.strip()

        ) < 50


ocr_parser = OCRParser()