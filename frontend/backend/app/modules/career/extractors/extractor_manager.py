"""
=========================================================

SkillBattle

Extractor Manager

Coordinates all resume extractors and
returns one structured result.

=========================================================
"""

from __future__ import annotations

from app.modules.career.extractors.contact_extractor import (
    contact_extractor,
)

from app.modules.career.extractors.skills_extractor import (
    skills_extractor,
)

from app.modules.career.extractors.education_extractor import (
    education_extractor,
)

from app.modules.career.extractors.experience_extractor import (
    experience_extractor,
)

from app.modules.career.extractors.project_extractor import (
    project_extractor,
)

from app.modules.career.extractors.certification_extractor import (
    certification_extractor,
)


class ExtractorManager:

    """
    Central Resume Extraction Engine
    """

    # =====================================================

    def extract(

        self,

        text: str,

    ) -> dict:

        contact = contact_extractor.extract(text)

        skills = skills_extractor.extract(text)

        education = education_extractor.extract(text)

        experience = experience_extractor.extract(text)

        projects = project_extractor.extract(text)

        certifications = certification_extractor.extract(text)

        statistics = self.statistics(

            text,

            skills,

            education,

            experience,

            projects,

            certifications,

        )

        return {

            "contact": contact,

            "skills": skills,

            "education": education,

            "experience": experience,

            "projects": projects,

            "certifications": certifications,

            "statistics": statistics,

        }

    # =====================================================

    def statistics(

        self,

    text: str,

    contact: dict,

    skills: dict,

    education: dict,

    experience: dict,

    projects: dict,

    certifications: dict,

    ) -> dict:

        return {

            "characters": len(text),

            "words": len(text.split()),

            "skills_found": skills["total"],

            "degrees": len(

                education["degrees"]

            ),

            "companies": len(

                experience["companies"]

            ),

            "projects": len(

                projects["projects"]

            ),

            "certifications": len(

                certifications["certifications"]

            ),

            "github_present": bool(

                projects["github"]

            ),

            "linkedin_present": bool(

                contact["linkedin"]

            ),

            "portfolio_present": bool(

                contact["portfolio"]

            ),

        }


extractor_manager = ExtractorManager()