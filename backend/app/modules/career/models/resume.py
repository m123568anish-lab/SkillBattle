"""
=========================================================
SkillBattle Career Platform

Resume Model

Represents a parsed resume after extraction.

=========================================================
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import List


@dataclass(slots=True)
class Resume:

    """
    Parsed resume model.

    This object is produced by the Resume Engine
    after parsing a PDF or DOCX.
    """

    id: str

    user_id: str

    title: str

    summary: str = ""

    full_name: str = ""

    email: str = ""

    phone: str = ""

    location: str = ""

    linkedin: str = ""

    github: str = ""

    portfolio: str = ""

    skills: List[str] = field(
        default_factory=list
    )

    programming_languages: List[str] = field(
        default_factory=list
    )

    frameworks: List[str] = field(
        default_factory=list
    )

    databases: List[str] = field(
        default_factory=list
    )

    cloud: List[str] = field(
        default_factory=list
    )

    tools: List[str] = field(
        default_factory=list
    )

    certifications: List[str] = field(
        default_factory=list
    )

    education: List[dict] = field(
        default_factory=list
    )

    experience: List[dict] = field(
        default_factory=list
    )

    projects: List[dict] = field(
        default_factory=list
    )

    achievements: List[str] = field(
        default_factory=list
    )

    languages_known: List[str] = field(
        default_factory=list
    )

    ats_score: float = 0.0

    created_at: datetime = field(
        default_factory=datetime.utcnow
    )

    updated_at: datetime = field(
        default_factory=datetime.utcnow
    )

    @property
    def total_skills(self) -> int:

        return (

            len(self.skills)

            + len(self.frameworks)

            + len(self.tools)

            + len(self.databases)

            + len(self.cloud)

        )

    @property
    def total_projects(self) -> int:

        return len(self.projects)

    @property
    def total_experience(self) -> int:

        return len(self.experience)

    def add_skill(self, skill: str):

        skill = skill.strip()

        if skill and skill not in self.skills:

            self.skills.append(skill)

    def add_project(self, project: dict):

        self.projects.append(project)

    def add_certification(self, certificate: str):

        if certificate not in self.certifications:

            self.certifications.append(certificate)

    def update_score(self, score: float):

        self.ats_score = max(

            0,

            min(score, 100),

        )

        self.updated_at = datetime.utcnow()