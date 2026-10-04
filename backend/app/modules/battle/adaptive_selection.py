from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime
from typing import Any


@dataclass(frozen=True)
class AdaptiveSelectionPolicy:
    skill_weight: float = 0.34
    novelty_weight: float = 0.24
    performance_weight: float = 0.14
    difficulty_weight: float = 0.18
    topic_diversity_weight: float = 0.06
    type_diversity_weight: float = 0.04
    repeat_penalty: float = 0.22
    exposure_decay_days: float = 14.0
    candidate_limit: int = 500
    recent_submission_limit: int = 120


DEFAULT_SELECTION_POLICY = AdaptiveSelectionPolicy()
DIFFICULTY_LEVELS = {"easy": 0, "medium": 1, "hard": 2}


def normalized_difficulty(value: str | None) -> int:
    return DIFFICULTY_LEVELS.get((value or "").strip().lower(), 1)


def calibrated_difficulty(base_difficulty: str, skill_accuracy: float | None) -> int:
    level = normalized_difficulty(base_difficulty)
    if skill_accuracy is None:
        return level
    if skill_accuracy < 0.45:
        return max(0, level - 1)
    if skill_accuracy >= 0.82:
        return min(2, level + 1)
    return level


def novelty_score(
    last_seen_at: datetime | None,
    exposure_count: int,
    now: datetime,
    policy: AdaptiveSelectionPolicy = DEFAULT_SELECTION_POLICY,
) -> float:
    if last_seen_at is None:
        return 1.0
    age_days = max(0.0, (now - last_seen_at).total_seconds() / 86400)
    repeat_factor = 1.0 + 0.18 * max(0, exposure_count - 1)
    penalty = min(
        0.92,
        math.exp(-age_days / policy.exposure_decay_days) * 0.72 * repeat_factor,
    )
    return 1.0 - penalty


def score_question(
    question: Any,
    *,
    skill_accuracy: float | None,
    type_accuracy: float | None,
    last_seen_at: datetime | None,
    exposure_count: int,
    last_question_correct: bool | None,
    requested_difficulty: str,
    now: datetime,
    selected_categories: dict[str, int],
    selected_types: dict[str, int],
    policy: AdaptiveSelectionPolicy = DEFAULT_SELECTION_POLICY,
) -> float:
    category = (question.skill_category or "").strip().casefold()
    question_type = (question.question_type or "").strip().casefold()
    category_accuracy = skill_accuracy

    skill_score = 1.0 - category_accuracy if category_accuracy is not None else 0.5
    type_score = 1.0 - type_accuracy if type_accuracy is not None else 0.5
    performance_score = (
        0.75 if last_question_correct is False
        else 0.3 if last_question_correct is True
        else type_score
    )

    target_level = calibrated_difficulty(requested_difficulty, category_accuracy)
    candidate_level = normalized_difficulty(question.difficulty)
    difficulty_score = max(0.0, 1.0 - abs(candidate_level - target_level) / 2.0)
    fresh_score = novelty_score(last_seen_at, exposure_count, now, policy)
    topic_penalty = min(
        policy.repeat_penalty,
        policy.repeat_penalty * selected_categories.get(category, 0),
    )
    type_penalty = min(
        policy.repeat_penalty,
        policy.repeat_penalty * selected_types.get(question_type, 0),
    )

    score = (
        policy.skill_weight * skill_score
        + policy.novelty_weight * fresh_score
        + policy.performance_weight * performance_score
        + policy.difficulty_weight * difficulty_score
        + policy.topic_diversity_weight * (1.0 - topic_penalty)
        + policy.type_diversity_weight * (1.0 - type_penalty)
    )
    return round(score, 6)
