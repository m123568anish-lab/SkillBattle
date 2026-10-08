from __future__ import annotations

import hashlib
from datetime import datetime, timedelta
from typing import Any, Iterable, List

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.campaign import UserCampaignProgress
from app.models.campaign_attempt import CampaignAttempt
from app.models.compiler import CodeSubmission
from app.models.problem import Problem
from app.models.question import Question
from app.models.question_exposure import QuestionExposure
from app.models.xp import XP
from .level_data import LEVEL_DATA
from .schemas import (
    CampaignLevelResponse,
    CampaignStatusResponse,
    CodingProblemOption,
    LevelStatus,
    LevelSubmitRequest,
    LevelSubmitResponse,
    QuestionOption,
    TrackStatus,
)


class CampaignService:
    MCQ_COUNT = 5
    CODING_COUNT = 2
    RECENT_LEVEL_WINDOW = 3

    def get_rank_from_points(self, points: int) -> str:
        if points <= 300:
            return "Bronze"
        if points <= 800:
            return "Silver"
        if points <= 1500:
            return "Gold"
        if points <= 2400:
            return "Platinum"
        if points <= 3500:
            return "Diamond"
        if points <= 5000:
            return "Heroic"
        return "Grandmaster"

    def _level_metadata(self, track: str, level_id: int) -> dict[str, Any]:
        normalized = (track or "").lower()
        levels = LEVEL_DATA.get(normalized, [])
        for level in levels:
            if int(level["level_id"]) == int(level_id):
                return level
        raise ValueError(f"Level {level_id} not found for track {track}")

    def _normalize_question_options(self, options: Any) -> list[str]:
        if not isinstance(options, list):
            return []
        cleaned: list[str] = []
        for option in options:
            if isinstance(option, dict):
                if "text" in option:
                    cleaned.append(str(option["text"]))
                elif "option" in option:
                    cleaned.append(str(option["option"]))
            else:
                cleaned.append(str(option))
        return cleaned

    def _question_display_text(self, question: Question) -> str:
        text = (getattr(question, "title", "") or "").strip()
        if text:
            return text
        return (getattr(question, "description", "") or "").strip() or "Question"

    def _serialize_question(self, question: Question) -> QuestionOption:
        return QuestionOption(
            id=int(question.id),
            text=self._question_display_text(question),
            options=self._normalize_question_options(getattr(question, "options", []) or []),
        )

    def _serialize_problem(self, problem: Problem) -> CodingProblemOption:
        return CodingProblemOption(
            id=int(problem.id),
            title=str(problem.title),
            description=str(problem.description),
            difficulty=str(problem.difficulty).lower(),
            category=str(problem.category or "General"),
        )

    def _difficulty_window(self, level_id: int) -> set[str]:
        if level_id <= 5:
            return {"easy"}
        if level_id <= 10:
            return {"easy", "medium"}
        if level_id <= 20:
            return {"medium"}
        if level_id <= 30:
            return {"medium", "hard"}
        return {"hard", "medium"}

    async def _question_exposure(self, db: AsyncSession, user_id: str, question_id: int) -> QuestionExposure | None:
        stmt = select(QuestionExposure).where(
            QuestionExposure.user_id == user_id,
            QuestionExposure.question_id == question_id,
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def _problem_seen_recently(self, db: AsyncSession, user_id: str, problem_id: int) -> bool:
        stmt = select(CodeSubmission).where(
            CodeSubmission.user_id == user_id,
            CodeSubmission.problem_id == problem_id,
        )
        result = await db.execute(stmt)
        submissions = result.scalars().all()
        if not submissions:
            return False
        latest = max((item.submitted_at for item in submissions if getattr(item, "submitted_at", None)), default=None)
        if latest is None:
            return False
        return datetime.utcnow() - latest < timedelta(days=14)

    async def _eligible_mcq_questions(self, db: AsyncSession, track: str, level_id: int) -> list[Question]:
        allowed_difficulties = self._difficulty_window(level_id)
        stmt = select(Question).where(
            Question.question_type == "mcq",
            Question.is_active.is_(True),
            Question.is_validated.is_(True),
            func.lower(Question.difficulty).in_([difficulty.lower() for difficulty in allowed_difficulties]),
        )
        result = await db.execute(stmt)
        rows = result.scalars().all()
        return [row for row in rows if (getattr(row, "options", None) or []) and getattr(row, "correct_option", None)]

    async def _eligible_coding_problems(self, db: AsyncSession, track: str, level_id: int) -> list[Problem]:
        allowed_difficulties = self._difficulty_window(level_id)
        stmt = select(Problem).where(
            Problem.is_active.is_(True),
            func.lower(Problem.difficulty).in_([difficulty.lower() for difficulty in allowed_difficulties]),
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    def _question_priority(self, question: Question, selected_categories: dict[str, int], seen_recently: bool, is_unseen: bool, allowed_difficulties: set[str]) -> float:
        score = 0.0
        if is_unseen:
            score += 100.0
        score -= (getattr(question, "estimated_time_minutes", 0) or 0) * 0.1
        difficulty = str(getattr(question, "difficulty", "")).lower()
        if difficulty in allowed_difficulties:
            score += 15.0
        else:
            score -= 25.0
        category = str(getattr(question, "skill_category", "") or "General").strip()
        if category and category not in selected_categories:
            score += 12.0
        if seen_recently:
            score -= 30.0
        return score

    def _problem_priority(self, problem: Problem, selected_categories: dict[str, int], seen_recently: bool, is_unseen: bool, allowed_difficulties: set[str]) -> float:
        score = 0.0
        if is_unseen:
            score += 100.0
        difficulty = str(getattr(problem, "difficulty", "")).lower()
        if difficulty in allowed_difficulties:
            score += 15.0
        category = str(getattr(problem, "category", "") or "General").strip()
        if category and category not in selected_categories:
            score += 12.0
        if seen_recently:
            score -= 30.0
        return score

    async def _pick_question_subset(self, db: AsyncSession, user_id: str, candidates: list[Question], required: int, level_id: int) -> list[Question]:
        if len(candidates) < required:
            raise ValueError("CAMPAIGN_LEVEL_UNAVAILABLE: not enough eligible MCQ questions to start the level.")

        allowed_difficulties = self._difficulty_window(level_id)
        scored: list[tuple[float, Question]] = []
        selected_categories: dict[str, int] = {}

        for candidate in candidates:
            exposure = await self._question_exposure(db, user_id, int(candidate.id))
            seen_recently = bool(exposure and exposure.last_seen_at and datetime.utcnow() - exposure.last_seen_at < timedelta(days=14))
            is_unseen = exposure is None
            score = self._question_priority(candidate, selected_categories, seen_recently, is_unseen, allowed_difficulties)
            scored.append((score, candidate))

        scored.sort(key=lambda item: item[0], reverse=True)
        selected: list[Question] = []
        seen_ids: set[int] = set()
        for _, candidate in scored:
            if len(selected) >= required:
                break
            if candidate.id in seen_ids:
                continue
            seen_ids.add(int(candidate.id))
            selected.append(candidate)
            category = str(getattr(candidate, "skill_category", "") or "General").strip()
            if category:
                selected_categories[category] = selected_categories.get(category, 0) + 1

        if len(selected) < required:
            raise ValueError("CAMPAIGN_LEVEL_UNAVAILABLE: not enough valid content for this campaign level.")
        return selected

    async def _pick_problem_subset(self, db: AsyncSession, user_id: str, candidates: list[Problem], required: int, level_id: int) -> list[Problem]:
        if len(candidates) < required:
            raise ValueError("CAMPAIGN_LEVEL_UNAVAILABLE: not enough eligible coding problems to start the level.")

        allowed_difficulties = self._difficulty_window(level_id)
        scored: list[tuple[float, Problem]] = []
        selected_categories: dict[str, int] = {}

        for candidate in candidates:
            seen_recently = await self._problem_seen_recently(db, user_id, int(candidate.id))
            is_unseen = not seen_recently
            score = self._problem_priority(candidate, selected_categories, seen_recently, is_unseen, allowed_difficulties)
            scored.append((score, candidate))

        scored.sort(key=lambda item: item[0], reverse=True)
        selected: list[Problem] = []
        seen_ids: set[int] = set()
        for _, candidate in scored:
            if len(selected) >= required:
                break
            if candidate.id in seen_ids:
                continue
            seen_ids.add(int(candidate.id))
            selected.append(candidate)
            category = str(getattr(candidate, "category", "") or "General").strip()
            if category:
                selected_categories[category] = selected_categories.get(category, 0) + 1

        if len(selected) < required:
            raise ValueError("CAMPAIGN_LEVEL_UNAVAILABLE: not enough valid coding content for this campaign level.")
        return selected

    async def _generate_attempt(self, db: AsyncSession, user_id: str, track: str, level_id: int) -> CampaignAttempt:
        track_key = (track or "").lower()
        self._level_metadata(track_key, level_id)
        mcq_candidates = await self._eligible_mcq_questions(db, track_key, level_id)
        coding_candidates = await self._eligible_coding_problems(db, track_key, level_id)
        selected_mcqs = await self._pick_question_subset(db, user_id, mcq_candidates, self.MCQ_COUNT, level_id)
        selected_problems = await self._pick_problem_subset(db, user_id, coding_candidates, self.CODING_COUNT, level_id)

        digest = hashlib.sha256(
            f"{user_id}:{track_key}:{level_id}:{','.join(str(item.id) for item in selected_mcqs)}:{','.join(str(item.id) for item in selected_problems)}".encode()
        ).hexdigest()

        attempt = CampaignAttempt(
            user_id=user_id,
            track=track_key,
            level_id=int(level_id),
            status="active",
            mcq_ids=[int(item.id) for item in selected_mcqs],
            coding_problem_ids=[int(item.id) for item in selected_problems],
            challenge_hash=digest,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(attempt)
        await db.commit()
        await db.refresh(attempt)
        return attempt

    async def _get_or_create_attempt(self, db: AsyncSession, user_id: str, track: str, level_id: int) -> CampaignAttempt:
        existing_stmt = select(CampaignAttempt).where(
            CampaignAttempt.user_id == user_id,
            CampaignAttempt.track == (track or "").lower(),
            CampaignAttempt.level_id == int(level_id),
        )
        existing_result = await db.execute(existing_stmt)
        attempt = existing_result.scalar_one_or_none()
        if attempt is not None:
            return attempt
        return await self._generate_attempt(db, user_id, (track or "").lower(), int(level_id))

    async def get_status(self, db: AsyncSession, user_id: str) -> CampaignStatusResponse:
        stmt = select(UserCampaignProgress).where(UserCampaignProgress.user_id == user_id)
        result = await db.execute(stmt)
        progress_list = result.scalars().all()

        progress_map = {(p.track, p.level_id): p.stars for p in progress_list}
        tracks = ["dsa", "os", "dbms"]
        track_statuses = []
        total_points = 0

        for track in tracks:
            levels = LEVEL_DATA.get(track, [])
            level_statuses = []
            unlocked = True
            current_level = 1

            for level in levels:
                lvl_id = int(level["level_id"])
                stars = progress_map.get((track, lvl_id), 0)
                total_points += stars * 100
                level_statuses.append(
                    LevelStatus(
                        level_id=lvl_id,
                        title=level["title"],
                        description=level["description"],
                        stars=stars,
                        unlocked=unlocked,
                    )
                )
                if stars > 0:
                    unlocked = True
                    current_level = max(current_level, lvl_id + 1)
                else:
                    unlocked = False

            track_statuses.append(
                TrackStatus(
                    track=track.upper(),
                    current_level=min(current_level, len(levels)),
                    levels=level_statuses,
                )
            )

        return CampaignStatusResponse(
            rank=self.get_rank_from_points(total_points),
            points=total_points,
            tracks=track_statuses,
        )

    async def get_level(self, db: AsyncSession, user_id: str, track: str, level_id: int) -> CampaignLevelResponse:
        track_key = (track or "").lower()
        if track_key not in LEVEL_DATA:
            raise ValueError("Invalid track name")

        level = self._level_metadata(track_key, level_id)
        attempt = await self._get_or_create_attempt(db, user_id, track_key, level_id)

        mcq_ids = list(attempt.mcq_ids or [])
        coding_ids = list(attempt.coding_problem_ids or [])

        if not mcq_ids or not coding_ids:
            raise ValueError("CAMPAIGN_LEVEL_UNAVAILABLE: no active challenge snapshot was created for this level.")

        mcq_stmt = select(Question).where(Question.id.in_(mcq_ids))
        mcq_result = await db.execute(mcq_stmt)
        mcq_rows = {int(row.id): row for row in mcq_result.scalars().all()}
        ordered_questions = [mcq_rows[int(qid)] for qid in mcq_ids if int(qid) in mcq_rows]

        coding_stmt = select(Problem).where(Problem.id.in_(coding_ids))
        coding_result = await db.execute(coding_stmt)
        coding_rows = {int(row.id): row for row in coding_result.scalars().all()}
        ordered_coding = [coding_rows[int(pid)] for pid in coding_ids if int(pid) in coding_rows]

        serialized_questions = [self._serialize_question(q) for q in ordered_questions]
        serialized_coding = [self._serialize_problem(p) for p in ordered_coding]

        return CampaignLevelResponse(
            level_id=int(level["level_id"]),
            title=level["title"],
            description=level["description"],
            questions=serialized_questions,
            coding_problems=serialized_coding,
            mcq_count=len(serialized_questions),
            coding_count=len(serialized_coding),
        )

    async def submit_level(self, db: AsyncSession, user_id: str, req: LevelSubmitRequest) -> LevelSubmitResponse:
        track_key = (req.track or "").lower()
        if track_key not in LEVEL_DATA:
            raise ValueError("Invalid track name")

        attempt = await self._get_or_create_attempt(db, user_id, track_key, req.level_id)
        valid_question_ids = set(int(item) for item in attempt.mcq_ids or [])

        if not valid_question_ids:
            raise ValueError("CAMPAIGN_LEVEL_UNAVAILABLE: level attempt does not have a valid question set.")

        total_q = len(valid_question_ids)
        correct_count = 0

        for answer in req.answers:
            qid = int(answer.question_id)
            if qid not in valid_question_ids:
                raise ValueError(f"Question {qid} is not part of this campaign level attempt.")

            question = await db.get(Question, qid)
            if question is None:
                raise ValueError(f"Question {qid} does not exist.")

            selected_option = answer.selected_option
            answer_text = None
            if isinstance(selected_option, int) and 0 <= selected_option < len(getattr(question, "options", []) or []):
                answer_text = str((getattr(question, "options", []) or [])[selected_option])
            if getattr(question, "correct_option", None) == answer_text:
                correct_count += 1

            exposure = await self._question_exposure(db, user_id, qid)
            if exposure is None:
                exposure = QuestionExposure(
                    user_id=user_id,
                    question_id=qid,
                    first_seen_at=datetime.utcnow(),
                    last_seen_at=datetime.utcnow(),
                )
                db.add(exposure)
            exposure.exposure_count = (exposure.exposure_count or 0) + 1
            exposure.attempt_count = (exposure.attempt_count or 0) + 1
            exposure.last_seen_at = datetime.utcnow()
            exposure.last_result = "correct" if getattr(question, "correct_option", None) == answer_text else "incorrect"
            if exposure.last_result == "correct":
                exposure.correct_count = (exposure.correct_count or 0) + 1
            else:
                exposure.incorrect_count = (exposure.incorrect_count or 0) + 1
            exposure.last_score = 100.0 if exposure.last_result == "correct" else 0.0

        score_pct = (correct_count / total_q) * 100 if total_q else 0
        if correct_count == total_q:
            stars = 3
        elif correct_count >= 2:
            stars = 2
        elif correct_count >= 1:
            stars = 1
        else:
            stars = 0

        initial_status = await self.get_status(db, user_id)
        old_points = initial_status.points
        old_rank = initial_status.rank

        progress = await db.execute(
            select(UserCampaignProgress).where(
                UserCampaignProgress.user_id == user_id,
                UserCampaignProgress.track == track_key,
                UserCampaignProgress.level_id == req.level_id,
            )
        )
        progress_record = progress.scalar_one_or_none()

        unlocked_next = stars > 0
        if progress_record is None:
            if unlocked_next:
                progress_record = UserCampaignProgress(
                    user_id=user_id,
                    track=track_key,
                    level_id=req.level_id,
                    stars=stars,
                    completed=True,
                    completed_at=datetime.utcnow(),
                )
                db.add(progress_record)
        else:
            if stars > progress_record.stars:
                progress_record.stars = stars
                progress_record.completed = True
                progress_record.completed_at = datetime.utcnow()

        if unlocked_next:
            xp_stmt = select(XP).where(XP.user_id == user_id)
            xp_result = await db.execute(xp_stmt)
            user_xp = xp_result.scalar_one_or_none()
            xp_reward = stars * 100
            if user_xp:
                user_xp.xp += xp_reward
                user_xp.level = (user_xp.xp // 2500) + 1
            else:
                db.add(XP(user_id=user_id, xp=xp_reward, level=(xp_reward // 2500) + 1))

        attempt.status = "completed"
        attempt.completed_at = datetime.utcnow()
        attempt.updated_at = datetime.utcnow()
        await db.commit()

        final_status = await self.get_status(db, user_id)
        new_points = final_status.points
        new_rank = final_status.rank

        points_earned = new_points - old_points
        rank_upgraded = new_rank != old_rank

        return LevelSubmitResponse(
            score=int(score_pct),
            total=total_q,
            stars=stars,
            points_earned=points_earned,
            unlocked_next=unlocked_next,
            rank_upgraded=rank_upgraded,
            new_rank=new_rank,
            correct_count=correct_count,
        )


campaign_service = CampaignService()

