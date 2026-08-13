"""
=========================================================

SkillBattle Career Platform

Production Resume Engine

Pipeline

Resume
    │
    ▼
PDF / DOCX Parser
    │
    ▼
OCR Fallback
    │
    ▼
Personal Extractor
Skills Extractor
Education Extractor
Experience Extractor
Project Extractor
    │
    ▼
Resume Model

=========================================================
"""

from __future__ import annotations

from pathlib import Path

from app.modules.career.extractors.education_extractor import (
    education_extractor,
)
from app.modules.career.extractors.experience_extractor import (
    experience_extractor,
)
from app.modules.career.extractors.personal_extractor import (
    personal_extractor,
)
from app.modules.career.extractors.project_extractor import (
    project_extractor,
)
from app.modules.career.extractors.skills_extractor import (
    skills_extractor,
)

from app.modules.career.models.resume import Resume

from app.modules.career.parsers.docx_parser import (
    docx_parser,
)

from app.modules.career.parsers.ocr_parser import (
    ocr_parser,
)

from app.modules.career.parsers.pdf_parser import (
    pdf_parser,
)


class ResumeEngine:

    # -----------------------------------------------------

    def parse(

        self,

        file_path: str,

        user_id: str,

    ) -> Resume:

        suffix = Path(file_path).suffix.lower()

        if suffix == ".pdf":

            parsed = pdf_parser.parse(file_path)

            if pdf_parser.requires_ocr(

                parsed["text"]

            ):

                parsed = ocr_parser.parse(

                    file_path,

                )

        elif suffix == ".docx":

            parsed = docx_parser.parse(

                file_path,

            )

        else:

            raise ValueError(

                f"Unsupported resume format: {suffix}"

            )

        text = parsed["text"]

        return self.build_resume(

            user_id,

            file_path,

            text,

            parsed,

        )

    # -----------------------------------------------------

    def build_resume(

        self,

        user_id: str,

        file_path: str,

        text: str,

        parsed: dict,

    ) -> Resume:

        personal = personal_extractor.extract(

            text,

        )

        skills = skills_extractor.extract(

            text,

        )

        education = education_extractor.extract(

            text,

        )

        experience = experience_extractor.extract(

            text,

        )

        project = project_extractor.extract(

            text,

        )

        resume = Resume(

            id=f"resume_{user_id}",

            user_id=user_id,

            title=Path(file_path).stem,

        )

        # ----------------------------------------

        # Personal

        # ----------------------------------------

        resume.full_name = personal["name"]

        resume.email = personal["email"]

        resume.phone = personal["phone"]

        resume.linkedin = personal["linkedin"]

        resume.github = personal["github"]

        resume.portfolio = personal["portfolio"]

        resume.location = personal["location"]

        # ----------------------------------------

        # Skills

        # ----------------------------------------

        all_skills = []

        for values in skills["skills"].values():

            all_skills.extend(values)

        resume.skills = sorted(

            set(all_skills)

        )

        # ----------------------------------------

        # Education

        # ----------------------------------------

        resume.education = [

            education

        ]

        # ----------------------------------------

        # Experience

        # ----------------------------------------

        resume.experience = [

            experience

        ]

        # ----------------------------------------

        # Projects

        # ----------------------------------------

        resume.projects = [

            project

        ]

        # ----------------------------------------

        # Metadata

        # ----------------------------------------

        resume.metadata = parsed.get(

            "metadata",

            {},

        )

        resume.raw_text = text

        return resume

    # -----------------------------------------------------

    def summary(

        self,

        resume: Resume,

    ) -> dict:

        return {

            "name": resume.full_name,

            "email": resume.email,

            "phone": resume.phone,

            "skills": len(resume.skills),

            "projects": len(

                resume.projects

            ),

            "experience": len(

                resume.experience

            ),

            "education": len(

                resume.education

            ),

        }


resume_engine = ResumeEngine()