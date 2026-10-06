from __future__ import annotations

from typing import Any


class StudentCommandCenterService:
    """Read-model orchestration for the student dashboard command center."""

    @staticmethod
    def _display_skill(skill_name: str | None, *, skill_id: str | None = None) -> str:
        value = (skill_name or "Skill").strip()
        if not value:
            return "Skill"
        normalized = value.replace("-", " ").replace("_", " ")
        lower = normalized.lower()
        if (skill_id or "").startswith("sql."):
            if lower == "join":
                return "SQL JOINs"
            if lower == "select":
                return "SQL SELECT"
            if lower == "group by":
                return "SQL GROUP BY"
            return f"SQL {normalized.title()}"
        if (skill_id or "").startswith("dsa.") and lower in {"arrays", "strings", "graphs", "trees", "hashing", "searching", "sorting", "linked lists", "stack", "queue", "recursion", "dynamic programming"}:
            return f"DSA {normalized.title()}"
        return normalized.title()

    @staticmethod
    def _priority_rank(priority: str | None) -> int:
        return {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3, "UNKNOWN": 4}.get((priority or "UNKNOWN").upper(), 99)

    def build_command_center(
        self,
        *,
        skill_profile: dict[str, Any],
        xp: int = 0,
        streak: int = 0,
        target_company: str | None = None,
        study_hours: int | None = None,
        roadmap: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        gaps = list(skill_profile.get("gaps") or [])
        ordered_gap_list = sorted(gaps, key=lambda item: (self._priority_rank(item.get("priority")), -int(item.get("score", 0) or 0)))

        next_best = skill_profile.get("next_best_action") or (ordered_gap_list[0] if ordered_gap_list else None)
        next_best_title = "Set your next study target"
        next_best_why = "Add evidence through practice or a battle to generate a stronger recommendation."
        next_best_type = "SETUP"
        if next_best:
            skill_id = next_best.get("skill_id") or ""
            skill_name = next_best.get("skill_name") or skill_id or "Skill"
            if next_best.get("action") == "PRACTICE_SKILL":
                next_best_type = "PRACTICE"
                next_best_title = f"Practice {self._display_skill(skill_name, skill_id=skill_id)}"
            elif next_best.get("action") == "BATTLE_SKILL":
                next_best_type = "BATTLE"
                next_best_title = f"Battle {self._display_skill(skill_name, skill_id=skill_id)}"
            elif next_best.get("action") == "REASSESS_SKILL":
                next_best_type = "REASSESS"
                next_best_title = f"Reassess {self._display_skill(skill_name, skill_id=skill_id)}"
            else:
                next_best_type = "PRACTICE"
                next_best_title = f"Practice {self._display_skill(skill_name, skill_id=skill_id)}"
            next_best_why = next_best.get("reason") or next_best_why

        skills = list(skill_profile.get("skills") or [])
        strong_skills = [skill for skill in skills if (skill.get("mastery") or "UNKNOWN") in {"COMPETENT", "STRONG", "MASTERED"}]
        weak_skills = [skill for skill in skills if (skill.get("mastery") or "UNKNOWN") in {"UNKNOWN", "LEARNING", "DEVELOPING"}]

        daily_actions: list[dict[str, Any]] = []
        if study_hours is None or int(study_hours) <= 0:
            daily_actions.append({
                "type": "SETUP",
                "title": "Set your daily study time",
                "description": "Add your study-hours preference so the dashboard can generate a realistic plan.",
                "time": "Configure",
                "priority": "MEDIUM",
            })
        elif ordered_gap_list:
            top_gap = ordered_gap_list[0]
            skill_id = top_gap.get("skill_id") or ""
            skill_name = top_gap.get("skill_name") or skill_id or "Skill"
            daily_actions.append({
                "type": "PRACTICE",
                "title": f"Practice {self._display_skill(skill_name, skill_id=skill_id)}",
                "description": top_gap.get("reason") or "Target the current highest-value gap with a focused practice session.",
                "time": "20 min",
                "priority": top_gap.get("priority", "MEDIUM"),
            })
            if top_gap.get("priority") in {"HIGH", "CRITICAL"}:
                daily_actions.append({
                    "type": "BATTLE",
                    "title": f"Recommended Battle: {self._display_skill(skill_name, skill_id=skill_id)}",
                    "description": "Use a short battle to convert your weak area into measurable evidence.",
                    "time": "15 min",
                    "priority": "HIGH",
                })
            daily_actions.append({
                "type": "REASSESS",
                "title": f"Reassess {self._display_skill(skill_name, skill_id=skill_id)}",
                "description": "After practice, validate whether the skill gap has improved with a targeted check.",
                "time": "10 min",
                "priority": "MEDIUM",
            })
        else:
            daily_actions.append({
                "type": "REVIEW",
                "title": "Review recent activity",
                "description": "There is no current gap signal yet; review recent practice and battle evidence.",
                "time": "15 min",
                "priority": "LOW",
            })

        mini_gap_list = []
        for item in ordered_gap_list[:3]:
            mini_gap_list.append({
                "skill_id": item.get("skill_id") or item.get("skill_name") or "skill",
                "skill_name": item.get("skill_name") or self._display_skill(item.get("skill_id") or "Skill"),
                "mastery": item.get("mastery") or "UNKNOWN",
                "confidence": item.get("confidence") or "LOW",
                "trend": item.get("trend") or "INSUFFICIENT_DATA",
                "priority": item.get("priority") or "UNKNOWN",
                "reason": item.get("reason") or "Evidence indicates this gap should be addressed.",
            })

        readiness = skill_profile.get("placement_readiness") or {"state": "BUILDING", "confidence": "LOW", "matrix": {}}
        roadmap_payload = {
            "title": (roadmap or {}).get("title") or "Roadmap",
            "progress": int((roadmap or {}).get("progress") or 0),
            "milestone": (roadmap or {}).get("milestone") or "Roadmap active",
            "target_company": target_company or "",
        }

        return {
            "student_state": {
                "xp": int(xp or 0),
                "streak": int(streak or 0),
                "target_company": target_company or "",
                "study_hours": {
                    "configured": bool(study_hours and int(study_hours) > 0),
                    "minutes": int(study_hours or 0),
                },
            },
            "members": {
                "strong_skills": [skill.get("skill_name") for skill in strong_skills[:3]],
                "weak_skills": [skill.get("skill_name") for skill in weak_skills[:3]],
            },
            "next_best_action": {
                "title": next_best_title,
                "type": next_best_type,
                "why": next_best_why,
                "skill_id": (next_best or {}).get("skill_id"),
                "skill_name": (next_best or {}).get("skill_name") or self._display_skill((next_best or {}).get("skill_id") or "Skill"),
            },
            "daily_actions": daily_actions[:3],
            "placement_readiness": readiness,
            "skill_gaps": mini_gap_list,
            "roadmap": roadmap_payload,
            "study_hours": {
                "configured": bool(study_hours and int(study_hours) > 0),
                "minutes": int(study_hours or 0),
            },
            "summary": {
                "strong_skills": len(strong_skills),
                "weak_skills": len(weak_skills),
                "gap_count": len(mini_gap_list),
            },
        }


student_command_center_service = StudentCommandCenterService()
