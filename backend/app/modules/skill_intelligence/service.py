from __future__ import annotations

import hashlib
import json
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any

MASTERY_ORDER = {
    "UNKNOWN": 0,
    "LEARNING": 1,
    "DEVELOPING": 2,
    "COMPETENT": 3,
    "STRONG": 4,
    "MASTERED": 5,
}

TREND_ORDER = {
    "INSUFFICIENT_DATA": 0,
    "DECLINING": 1,
    "STABLE": 2,
    "IMPROVING": 3,
}

CANONICAL_SKILL_TREE: dict[str, list[str]] = {
    "dsa": [
        "Arrays",
        "Strings",
        "Linked Lists",
        "Stack",
        "Queue",
        "Trees",
        "Graphs",
        "Recursion",
        "Dynamic Programming",
        "Hashing",
        "Searching",
        "Sorting",
    ],
    "coding": [
        "Problem Solving",
        "Debugging",
        "Optimization",
    ],
    "sql": [
        "SELECT",
        "JOIN",
        "GROUP BY",
        "HAVING",
        "Subqueries",
        "CTE",
        "Window Functions",
    ],
    "oop": ["OOP"],
    "dbms": ["DBMS"],
    "operating-systems": ["Operating Systems"],
    "computer-networks": ["Computer Networks"],
    "software-engineering": ["Software Engineering"],
    "aptitude": [
        "Quantitative",
        "Logical Reasoning",
        "Verbal",
        "Data Interpretation",
    ],
}

SKILL_ALIASES: dict[str, str] = {
    "arrays": "dsa.arrays",
    "array": "dsa.arrays",
    "strings": "dsa.strings",
    "string": "dsa.strings",
    "linked list": "dsa.linked-lists",
    "linked lists": "dsa.linked-lists",
    "stack": "dsa.stack",
    "queue": "dsa.queue",
    "trees": "dsa.trees",
    "tree": "dsa.trees",
    "graphs": "dsa.graphs",
    "graph": "dsa.graphs",
    "recursion": "dsa.recursion",
    "dynamic programming": "dsa.dynamic-programming",
    "hashing": "dsa.hashing",
    "searching": "dsa.searching",
    "sorting": "dsa.sorting",
    "problem solving": "coding.problem-solving",
    "debugging": "coding.debugging",
    "optimization": "coding.optimization",
    "select": "sql.select",
    "join": "sql.join",
    "group by": "sql.group-by",
    "having": "sql.having",
    "subqueries": "sql.subqueries",
    "cte": "sql.cte",
    "window functions": "sql.window-functions",
    "window function": "sql.window-functions",
    "oop": "oop",
    "dbms": "dbms",
    "operating systems": "operating-systems",
    "os": "operating-systems",
    "computer networks": "computer-networks",
    "networks": "computer-networks",
    "software engineering": "software-engineering",
    "aptitude": "aptitude",
    "quantitative": "aptitude.quantitative",
    "logical reasoning": "aptitude.logical-reasoning",
    "verbal": "aptitude.verbal",
    "data interpretation": "aptitude.data-interpretation",
    "dsa": "dsa",
    "coding": "coding",
    "sql": "sql",
}


def normalize_skill_id(skill_name: str | None) -> str:
    raw = (skill_name or "General").strip()
    if not raw:
        return "general"
    key = raw.lower().replace("&", " and ").replace("/", " ")
    key = " ".join(key.split())
    if key in SKILL_ALIASES:
        return SKILL_ALIASES[key]
    normalized = key.replace("-", " ")
    for alias, canonical in SKILL_ALIASES.items():
        if alias in normalized:
            return canonical
    root = "general"
    if "dsa" in normalized:
        root = "dsa"
    elif "coding" in normalized:
        root = "coding"
    elif "sql" in normalized:
        root = "sql"
    elif "oop" in normalized:
        root = "oop"
    elif "dbms" in normalized:
        root = "dbms"
    elif "network" in normalized:
        root = "computer-networks"
    elif "system" in normalized or "software" in normalized:
        root = "software-engineering"
    elif "apt" in normalized:
        root = "aptitude"
    return root


def display_name_for_skill(skill_id: str) -> str:
    if skill_id == "general":
        return "General"
    last = skill_id.split(".")[-1]
    return last.replace("-", " ").title()


def skill_parent(skill_id: str) -> str | None:
    if "." not in skill_id:
        return None
    return skill_id.rsplit(".", 1)[0]


class SkillIntelligenceService:
    """Deterministic evidence-driven skill intelligence built on top of real evidence."""

    def normalize_evidence(self, record: dict[str, Any]) -> dict[str, Any]:
        skill_id = normalize_skill_id(record.get("skill_id") or record.get("skill") or record.get("skill_name"))
        source_type = str(record.get("source_type") or "ASSESSMENT").upper().replace(" ", "_")
        source_id = str(record.get("source_id") or record.get("source") or record.get("battle_id") or record.get("attempt_id") or "anonymous")
        question_id = str(record.get("question_id") or record.get("question") or "")
        submission_id = str(record.get("submission_id") or record.get("event_id") or record.get("attempt_id") or "")
        score = float(record.get("score", 0.0) or 0.0)
        max_score = float(record.get("max_score") or 1.0 or 1.0)
        if max_score <= 0:
            max_score = 1.0
        correct_flag = bool(record.get("correct"))
        if record.get("correct") is None and max_score > 0:
            correct_flag = score >= (max_score * 0.5)
        difficulty = (record.get("difficulty") or "medium").lower()
        created_at = record.get("timestamp") or record.get("created_at") or datetime.utcnow().isoformat()
        if isinstance(created_at, str):
            try:
                created_at_dt = datetime.fromisoformat(created_at)
            except ValueError:
                created_at_dt = datetime.utcnow()
        else:
            created_at_dt = created_at

        dedupe_payload = {
            "user_id": str(record.get("user_id") or ""),
            "source_type": source_type,
            "source_id": source_id,
            "submission_id": submission_id,
            "question_id": question_id,
            "skill_id": skill_id,
        }
        dedupe_key = hashlib.sha256(json.dumps(dedupe_payload, sort_keys=True).encode("utf-8")).hexdigest()

        return {
            "user_id": str(record.get("user_id") or ""),
            "skill_id": skill_id,
            "skill_name": display_name_for_skill(skill_id),
            "parent_skill_id": skill_parent(skill_id),
            "source_type": source_type,
            "source_id": source_id,
            "submission_id": submission_id,
            "question_id": question_id,
            "difficulty": difficulty,
            "correct": correct_flag,
            "score": score,
            "max_score": max_score,
            "response_time_ms": int(record.get("response_time_ms") or record.get("response_time") or 0),
            "attempt_number": int(record.get("attempt_number") or 1),
            "timestamp": created_at_dt.isoformat(),
            "dedupe_key": dedupe_key,
        }

    def dedupe_records(self, records: list[dict[str, Any]]) -> list[dict[str, Any]]:
        seen: set[str] = set()
        unique: list[dict[str, Any]] = []
        for record in records:
            dedupe_key = record.get("dedupe_key") or self.normalize_evidence(record)["dedupe_key"]
            if dedupe_key in seen:
                continue
            seen.add(dedupe_key)
            unique.append(record)
        return unique

    def _recent_window(self, records: list[dict[str, Any]], hours: int) -> list[dict[str, Any]]:
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        return [
            record
            for record in records
            if datetime.fromisoformat(record["timestamp"]) >= cutoff
        ]

    def _mean_accuracy(self, records: list[dict[str, Any]]) -> float:
        if not records:
            return 0.0
        return sum(1.0 for record in records if record["correct"]) / len(records)

    def _difficulty_weight(self, difficulty: str) -> float:
        map_values = {"easy": 1.0, "medium": 2.0, "hard": 3.0}
        return map_values.get(difficulty.lower(), 2.0)

    def calculate_skill_state(self, records: list[dict[str, Any]]) -> dict[str, Any]:
        normalized = self.dedupe_records([self.normalize_evidence(record) for record in records])
        if not normalized:
            return {
                "skill_id": "unknown",
                "skill_name": "Unknown",
                "mastery": "UNKNOWN",
                "confidence": "LOW",
                "trend": "INSUFFICIENT_DATA",
                "evidence_count": 0,
                "accuracy": 0.0,
                "recent_accuracy": 0.0,
                "score": 0.0,
                "last_seen": None,
            }

        skill_id = normalized[0]["skill_id"]
        total_attempts = len(normalized)
        correct_attempts = sum(1 for record in normalized if record["correct"])
        accuracy = correct_attempts / total_attempts
        weighted_accuracy = sum((1.0 if record["correct"] else 0.0) * self._difficulty_weight(record["difficulty"]) for record in normalized)
        weighted_accuracy /= sum(self._difficulty_weight(record["difficulty"]) for record in normalized)
        recent = self._recent_window(normalized, 48)
        recent_accuracy = self._mean_accuracy(recent)
        historical = [record for record in normalized if record not in recent]
        historical_accuracy = self._mean_accuracy(historical)

        if total_attempts < 3:
            mastery = "LEARNING" if correct_attempts >= 1 else "UNKNOWN"
        elif accuracy >= 0.92 and total_attempts >= 12 and weighted_accuracy >= 0.85:
            mastery = "MASTERED"
        elif accuracy >= 0.78 and total_attempts >= 8 and weighted_accuracy >= 0.72:
            mastery = "STRONG"
        elif accuracy >= 0.62 and total_attempts >= 5:
            mastery = "COMPETENT"
        elif accuracy >= 0.45:
            mastery = "DEVELOPING"
        else:
            mastery = "LEARNING"

        if total_attempts < 3:
            confidence = "LOW"
        elif total_attempts < 6:
            confidence = "MEDIUM"
        elif weighted_accuracy >= 0.75 and total_attempts >= 8:
            confidence = "HIGH"
        else:
            confidence = "MEDIUM"

        if total_attempts < 3 or len(recent) < 2 or len(historical) < 2:
            trend = "INSUFFICIENT_DATA"
        else:
            delta = recent_accuracy - historical_accuracy
            if delta >= 0.12:
                trend = "IMPROVING"
            elif delta <= -0.12:
                trend = "DECLINING"
            else:
                trend = "STABLE"

        if total_attempts == 0:
            score = 0.0
        else:
            score = round(accuracy * 100, 1)

        last_seen = max(datetime.fromisoformat(item["timestamp"]) for item in normalized)
        return {
            "skill_id": skill_id,
            "skill_name": display_name_for_skill(skill_id),
            "mastery": mastery,
            "confidence": confidence,
            "trend": trend,
            "evidence_count": total_attempts,
            "accuracy": round(accuracy, 4),
            "recent_accuracy": round(recent_accuracy, 4),
            "score": score,
            "last_seen": last_seen.isoformat(),
        }

    def calculate_gap(self, records: list[dict[str, Any]]) -> dict[str, Any]:
        state = self.calculate_skill_state(records)
        skill_id = state["skill_id"]
        if state["evidence_count"] == 0:
            return {
                "skill_id": skill_id,
                "skill_name": state["skill_name"],
                "mastery": "UNKNOWN",
                "confidence": "LOW",
                "trend": "INSUFFICIENT_DATA",
                "priority": "UNKNOWN",
                "reason": "Insufficient data to assess this skill.",
            }

        if state["mastery"] in {"UNKNOWN", "LEARNING"}:
            priority = "HIGH" if state["confidence"] in {"MEDIUM", "HIGH"} else "MEDIUM"
        elif state["trend"] == "DECLINING" and state["confidence"] in {"MEDIUM", "HIGH"}:
            priority = "CRITICAL"
        elif state["mastery"] in {"DEVELOPING", "COMPETENT"}:
            priority = "MEDIUM"
        else:
            priority = "LOW"

        return {
            "skill_id": skill_id,
            "skill_name": state["skill_name"],
            "mastery": state["mastery"],
            "confidence": state["confidence"],
            "trend": state["trend"],
            "priority": priority,
            "reason": (
                f"{state['skill_name']} is {state['mastery']} with {state['confidence']} confidence "
                f"and {state['trend']} trend."
            ),
        }

    def calculate_placement_readiness(self, evidence_by_skill: dict[str, list[dict[str, Any]]]) -> dict[str, Any]:
        matrix: dict[str, dict[str, Any]] = {}
        relevant_roots = [
            "dsa",
            "coding",
            "sql",
            "oop",
            "dbms",
            "operating-systems",
            "computer-networks",
            "aptitude",
        ]

        for root in relevant_roots:
            grouped = []
            for skill_id, records in evidence_by_skill.items():
                if skill_id.startswith(root):
                    grouped.extend(records)
            if grouped:
                state = self.calculate_skill_state(grouped)
                matrix[root] = {
                    "mastery": state["mastery"],
                    "confidence": state["confidence"],
                    "score": state["score"],
                    "evidence_count": state["evidence_count"],
                }
            else:
                matrix[root] = {
                    "mastery": "UNKNOWN",
                    "confidence": "LOW",
                    "score": 0.0,
                    "evidence_count": 0,
                }

        all_states = [state["mastery"] for state in matrix.values()]
        readiness_value = 0
        for mastery in all_states:
            readiness_value += MASTERY_ORDER.get(mastery, 0)
        readiness_average = readiness_value / len(all_states) if all_states else 0

        if any(value["mastery"] in {"UNKNOWN", "LEARNING"} for value in matrix.values()):
            state = "BUILDING"
        elif readiness_average < 2.5:
            state = "DEVELOPING"
        elif readiness_average < 3.5:
            state = "NEAR_READY"
        else:
            state = "PLACEMENT_READY"

        confidence = "LOW"
        confident_roots = sum(1 for value in matrix.values() if value["confidence"] in {"HIGH", "MEDIUM"})
        if confident_roots >= 5:
            confidence = "HIGH"
        elif confident_roots >= 3:
            confidence = "MEDIUM"

        return {
            "state": state,
            "confidence": confidence,
            "matrix": matrix,
        }

    def build_profile(self, records: list[dict[str, Any]]) -> dict[str, Any]:
        normalized = self.dedupe_records([self.normalize_evidence(record) for record in records])
        grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
        for record in normalized:
            grouped[record["skill_id"]].append(record)

        skills = [
            {
                **self.calculate_skill_state(skill_records),
                "source_count": len({record["source_type"] for record in skill_records}),
            }
            for skill_id, skill_records in sorted(grouped.items())
        ]

        gaps = [
            self.calculate_gap(skill_records)
            for skill_id, skill_records in sorted(grouped.items())
        ]
        gaps = [gap for gap in gaps if gap["priority"] != "LOW"]
        readiness = self.calculate_placement_readiness(grouped)
        next_action = None
        if gaps:
            priority_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3, "UNKNOWN": 4}
            top_gap = min(
                gaps,
                key=lambda item: (
                    priority_order.get(item["priority"], 99),
                    -MASTERY_ORDER.get(item["mastery"], 0),
                ),
            )
            next_action = {
                "skill_id": top_gap["skill_id"],
                "skill_name": top_gap["skill_name"],
                "action": "PRACTICE_SKILL",
                "reason": top_gap["reason"],
            }

        return {
            "skills": skills,
            "gaps": gaps,
            "placement_readiness": readiness,
            "next_best_action": next_action,
        }


skill_intelligence_service = SkillIntelligenceService()

__all__ = [
    "CANONICAL_SKILL_TREE",
    "SkillIntelligenceService",
    "normalize_skill_id",
    "skill_intelligence_service",
]
