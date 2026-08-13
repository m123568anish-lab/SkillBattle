"""
=========================================================

SkillBattle Career Platform

Career Manager

Manages career profiles, reports and user state.

=========================================================
"""

from __future__ import annotations

from datetime import datetime

from app.modules.career.models.career_profile import CareerProfile
from app.modules.career.models.portfolio import Portfolio
from app.modules.career.models.resume import Resume


class CareerManager:

    def __init__(self):

        self._profiles: dict[str, CareerProfile] = {}

        self._resumes: dict[str, Resume] = {}

        self._portfolios: dict[str, Portfolio] = {}

        self._dashboard_cache: dict[str, dict] = {}

        self._mentor_history: dict[str, list] = {}

        self._milestones: dict[str, list] = {}

    # =====================================================
    # Profile
    # =====================================================

    def save_profile(

        self,

        profile: CareerProfile,

    ) -> None:

        self._profiles[

            profile.user_id

        ] = profile

    def get_profile(

        self,

        user_id: str,

    ) -> CareerProfile | None:

        return self._profiles.get(

            user_id,

        )

    def delete_profile(

        self,

        user_id: str,

    ) -> bool:

        return (

            self._profiles.pop(

                user_id,

                None,

            )

            is not None

        )

    # =====================================================
    # Resume
    # =====================================================

    def save_resume(

        self,

        resume: Resume,

    ) -> None:

        self._resumes[

            resume.user_id

        ] = resume

    def get_resume(

        self,

        user_id: str,

    ) -> Resume | None:

        return self._resumes.get(

            user_id,

        )

    # =====================================================
    # Portfolio
    # =====================================================

    def save_portfolio(

        self,

        portfolio: Portfolio,

    ) -> None:

        self._portfolios[

            portfolio.user_id

        ] = portfolio

    def get_portfolio(

        self,

        user_id: str,

    ) -> Portfolio | None:

        return self._portfolios.get(

            user_id,

        )

    # =====================================================
    # Dashboard Cache
    # =====================================================

    def cache_dashboard(

        self,

        user_id: str,

        dashboard: dict,

    ) -> None:

        dashboard["cached_at"] = (

            datetime.utcnow()

            .isoformat()

        )

        self._dashboard_cache[

            user_id

        ] = dashboard

    def dashboard(

        self,

        user_id: str,

    ) -> dict | None:

        return self._dashboard_cache.get(

            user_id,

        )

    def clear_dashboard(

        self,

        user_id: str,

    ) -> None:

        self._dashboard_cache.pop(

            user_id,

            None,

        )

    # =====================================================
    # Mentor History
    # =====================================================

    def add_conversation(

        self,

        user_id: str,

        question: str,

        answer: str,

    ) -> None:

        history = self._mentor_history.setdefault(

            user_id,

            [],

        )

        history.append(

            {

                "question": question,

                "answer": answer,

                "created_at":

                datetime.utcnow().isoformat(),

            }

        )

    def mentor_history(

        self,

        user_id: str,

    ) -> list:

        return self._mentor_history.get(

            user_id,

            [],

        )

    # =====================================================
    # Milestones
    # =====================================================

    def add_milestone(

        self,

        user_id: str,

        title: str,

    ) -> None:

        milestones = self._milestones.setdefault(

            user_id,

            [],

        )

        milestones.append(

            {

                "title": title,

                "completed_at":

                datetime.utcnow().isoformat(),

            }

        )

    def milestones(

        self,

        user_id: str,

    ) -> list:

        return self._milestones.get(

            user_id,

            [],

        )

    # =====================================================
    # Reset
    # =====================================================

    def reset_user(

        self,

        user_id: str,

    ) -> None:

        self._profiles.pop(

            user_id,

            None,

        )

        self._resumes.pop(

            user_id,

            None,

        )

        self._portfolios.pop(

            user_id,

            None,

        )

        self._dashboard_cache.pop(

            user_id,

            None,

        )

        self._mentor_history.pop(

            user_id,

            None,

        )

        self._milestones.pop(

            user_id,

            None,

        )


career_manager = CareerManager()