"""
=========================================================
SkillBattle Career Platform

Portfolio Model

Represents a candidate's technical portfolio.

=========================================================
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import List


@dataclass(slots=True)
class PortfolioProject:
    """
    Represents one project in the portfolio.
    """

    title: str

    description: str

    category: str

    technologies: List[str] = field(
        default_factory=list
    )

    github_url: str = ""

    live_url: str = ""

    demo_video: str = ""

    documentation_url: str = ""

    stars: int = 0

    forks: int = 0

    completed: bool = True

    featured: bool = False

    created_at: datetime = field(
        default_factory=datetime.utcnow
    )


@dataclass(slots=True)
class Portfolio:

    """
    Complete developer portfolio.
    """

    id: str

    user_id: str

    github_username: str = ""

    linkedin_url: str = ""

    portfolio_url: str = ""

    kaggle_username: str = ""

    leetcode_username: str = ""

    codeforces_username: str = ""

    hackerrank_username: str = ""

    projects: List[PortfolioProject] = field(
        default_factory=list
    )

    certifications: List[str] = field(
        default_factory=list
    )

    research_papers: List[str] = field(
        default_factory=list
    )

    hackathons: List[str] = field(
        default_factory=list
    )

    open_source_contributions: int = 0

    total_commits: int = 0

    total_repositories: int = 0

    profile_score: float = 0.0

    created_at: datetime = field(
        default_factory=datetime.utcnow
    )

    updated_at: datetime = field(
        default_factory=datetime.utcnow
    )

    def add_project(
        self,
        project: PortfolioProject,
    ):

        self.projects.append(project)

        self.updated_at = datetime.utcnow()

    def add_certificate(
        self,
        certificate: str,
    ):

        if certificate not in self.certifications:

            self.certifications.append(
                certificate
            )

            self.updated_at = datetime.utcnow()

    @property
    def total_projects(self):

        return len(self.projects)

    @property
    def featured_projects(self):

        return [

            project

            for project in self.projects

            if project.featured

        ]

    @property
    def ai_projects(self):

        return [

            project

            for project in self.projects

            if project.category.lower()

            in {

                "ai",

                "machine learning",

                "deep learning",

                "generative ai",

            }

        ]

    @property
    def web_projects(self):

        return [

            project

            for project in self.projects

            if project.category.lower()

            == "web"

        ]

    @property
    def mobile_projects(self):

        return [

            project

            for project in self.projects

            if project.category.lower()

            == "mobile"

        ]

    def update_score(
        self,
        score: float,
    ):

        self.profile_score = max(
            0,
            min(score, 100),
        )

        self.updated_at = datetime.utcnow()