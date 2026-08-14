"""
=========================================================
SkillBattle Career Platform

Career Profile Model

Central profile used by every AI career module.

=========================================================
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List


@dataclass(slots=True)
class CareerProfile:
    """
    Complete AI Career Profile.
    """

    id: str

    user_id: str

    full_name: str

    email: str

    target_role: str = ""

    target_company: str = ""

    experience_level: str = "Student"

    years_of_experience: float = 0.0

    current_ctc: float = 0.0

    expected_ctc: float = 0.0

    current_location: str = ""

    preferred_locations: List[str] = field(
        default_factory=list
    )

    resume_id: str | None = None

    portfolio_id: str | None = None

    github_username: str = ""

    linkedin_url: str = ""

    coding_rating: int = 1200

    interview_score: float = 0.0

    resume_score: float = 0.0

    portfolio_score: float = 0.0

    placement_score: float = 0.0

    ats_score: float = 0.0

    strengths: List[str] = field(
        default_factory=list
    )

    weaknesses: List[str] = field(
        default_factory=list
    )

    certifications: List[str] = field(
        default_factory=list
    )

    skills: List[str] = field(
        default_factory=list
    )

    missing_skills: List[str] = field(
        default_factory=list
    )

    completed_roadmaps: List[str] = field(
        default_factory=list
    )

    active_roadmap: str = ""

    achievements: List[str] = field(
        default_factory=list
    )

    recommendations: List[str] = field(
        default_factory=list
    )

    social_links: Dict[str, str] = field(
        default_factory=dict
    )

    created_at: datetime = field(
        default_factory=datetime.utcnow
    )

    updated_at: datetime = field(
        default_factory=datetime.utcnow
    )

    # =====================================================
    # Update Methods
    # =====================================================

    def update_resume_score(
        self,
        score: float,
    ):

        self.resume_score = max(
            0,
            min(score, 100),
        )

        self.updated_at = datetime.utcnow()

    def update_portfolio_score(
        self,
        score: float,
    ):

        self.portfolio_score = max(
            0,
            min(score, 100),
        )

        self.updated_at = datetime.utcnow()

    def update_interview_score(
        self,
        score: float,
    ):

        self.interview_score = max(
            0,
            min(score, 100),
        )

        self.updated_at = datetime.utcnow()

    def update_placement_score(
        self,
        score: float,
    ):

        self.placement_score = max(
            0,
            min(score, 100),
        )

        self.updated_at = datetime.utcnow()

    # =====================================================
    # Skills
    # =====================================================

    def add_skill(
        self,
        skill: str,
    ):

        skill = skill.strip()

        if skill and skill not in self.skills:

            self.skills.append(skill)

    def add_missing_skill(
        self,
        skill: str,
    ):

        skill = skill.strip()

        if skill and skill not in self.missing_skills:

            self.missing_skills.append(skill)

    # =====================================================
    # Recommendations
    # =====================================================

    def add_recommendation(
        self,
        recommendation: str,
    ):

        if recommendation not in self.recommendations:

            self.recommendations.append(
                recommendation
            )

    # =====================================================
    # Readiness
    # =====================================================

    @property
    def overall_score(self) -> float:

        scores = [

            self.resume_score,

            self.portfolio_score,

            self.interview_score,

            self.placement_score,

            self.ats_score,

        ]

        valid_scores = [

            score

            for score in scores

            if score > 0

        ]

        if not valid_scores:

            return 0.0

        return round(

            sum(valid_scores)

            / len(valid_scores),

            2,

        )

    @property
    def ready_for_interviews(self) -> bool:

        return (

            self.overall_score >= 75

            and len(self.skills) >= 10

        )

    @property
    def ready_for_placements(self) -> bool:

        return self.overall_score >= 80

    @property
    def profile_completion(self) -> int:

        completed = 0

        total = 12

        if self.resume_id:
            completed += 1

        if self.portfolio_id:
            completed += 1

        if self.github_username:
            completed += 1

        if self.linkedin_url:
            completed += 1

        if self.skills:
            completed += 1

        if self.certifications:
            completed += 1

        if self.target_role:
            completed += 1

        if self.target_company:
            completed += 1

        if self.strengths:
            completed += 1

        if self.active_roadmap:
            completed += 1

        if self.recommendations:
            completed += 1

        if self.social_links:
            completed += 1

        return int(

            completed

            / total

            * 100

        )