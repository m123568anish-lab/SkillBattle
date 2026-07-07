"""
=========================================================
SkillBattle Career Platform

Job Model

Represents a job posting that can be analyzed
against a candidate's resume.

=========================================================
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import List


@dataclass(slots=True)
class Job:

    """
    Represents a company job description.
    """

    id: str

    company: str

    title: str

    description: str

    location: str = ""

    employment_type: str = "Full Time"

    work_mode: str = "Hybrid"

    experience_required: int = 0

    minimum_salary: int = 0

    maximum_salary: int = 0

    required_skills: List[str] = field(
        default_factory=list
    )

    preferred_skills: List[str] = field(
        default_factory=list
    )

    required_projects: List[str] = field(
        default_factory=list
    )

    certifications: List[str] = field(
        default_factory=list
    )

    responsibilities: List[str] = field(
        default_factory=list
    )

    interview_topics: List[str] = field(
        default_factory=list
    )

    ats_keywords: List[str] = field(
        default_factory=list
    )

    difficulty: str = "Medium"

    department: str = "Engineering"

    openings: int = 1

    deadline: datetime | None = None

    created_at: datetime = field(
        default_factory=datetime.utcnow
    )

    is_active: bool = True

    @property
    def average_salary(self) -> int:

        if self.minimum_salary == 0 and self.maximum_salary == 0:

            return 0

        return int(

            (self.minimum_salary + self.maximum_salary)

            / 2

        )

    @property
    def total_required_skills(self) -> int:

        return len(self.required_skills)

    @property
    def total_preferred_skills(self) -> int:

        return len(self.preferred_skills)

    def add_skill(self, skill: str):

        skill = skill.strip()

        if skill and skill not in self.required_skills:

            self.required_skills.append(skill)

    def add_keyword(self, keyword: str):

        keyword = keyword.strip()

        if keyword and keyword not in self.ats_keywords:

            self.ats_keywords.append(keyword)

    def add_topic(self, topic: str):

        topic = topic.strip()

        if topic and topic not in self.interview_topics:

            self.interview_topics.append(topic)

    def is_open(self) -> bool:

        if not self.is_active:

            return False

        if self.deadline is None:

            return True

        return datetime.utcnow() <= self.deadline