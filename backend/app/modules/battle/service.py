"""
=========================================================

SkillBattle

Battle Service

Core Battle Engine Logic for General, Placement, Company, College,
Tournament, and Practice assessment formats.

=========================================================
"""
from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError

from app.models.user import User
from app.models.user_stats import UserStats
from app.models.battle import BattleRoom, BattleParticipant, BattleSubmission, BattleResult
from app.models.question import Question, UserSubmission
from app.models.user_skill_stat import UserSkillStat
from app.models.quest_map import QuestProgress
from app.models.company import CandidateApplication, Company
from app.models.college import CollegeStudent

from app.modules.battle.repository import battle_repository
from app.modules.battle.schemas import (
    CreateBattleRequest,
    JoinBattleRequest,
    MatchmakingRequest,
    SubmitAnswerRequest,
    BattleTypeEnum,
)
from app.models.skill_intelligence import SkillEvidence
from app.modules.skill_intelligence.service import normalize_skill_id
from app.modules.battle.config.service import battle_config_service
from app.modules.battle.question_engine import question_engine
from app.modules.battle.score import battle_score_manager
from app.modules.battle.result import battle_result_engine
from app.modules.battle.scoring import battle_scoring_service
from app.modules.battle.ranking import rank_players
from app.modules.battle.websocket import battle_ws
from app.modules.battle.events import BattleEvent
from app.modules.battle.matchmaking import matchmaking_engine
from app.modules.battle.orchestrator import battle_orchestrator
from app.modules.xp.service import xp_service
from app.modules.notification.service import notification_service
from app.modules.audit.service import audit_service

logger = logging.getLogger(__name__)


class BattleService:

    # ==========================================================
    # Create Battle Room
    # ==========================================================

    async def create_battle(
        self,
        db: AsyncSession,
        current_user: User,
        request: CreateBattleRequest,
        *,
        sections_override: list[dict[str, Any]] | None = None,
        start_immediately: bool = False,
        commit: bool = True,
    ) -> BattleRoom:

        battle_type_val = request.battle_type.value if hasattr(request.battle_type, "value") else str(request.battle_type)

        # Resolve Configuration Template or Database Config
        sections_config = []
        company_application = None
        db_config = None
        if request.config_id:
            db_config = await battle_config_service.get_config(db, request.config_id)
            if not db_config:
                raise ValueError("Assessment configuration not found.")

            battle_type_val = db_config.battle_type
            sections_config = db_config.sections
            difficulty = db_config.difficulty

            if db_config.company_id is not None:
                company = await db.get(Company, db_config.company_id)
                if not company or company.status != "verified" or db_config.job_id is None:
                    raise ValueError("Company assessment is unavailable.")

                application_result = await db.execute(
                    select(CandidateApplication).where(
                        CandidateApplication.candidate_user_id == current_user.id,
                        CandidateApplication.job_id == db_config.job_id,
                    )
                )
                company_application = application_result.scalar_one_or_none()
                if not company_application:
                    raise ValueError("Apply to this job before taking its assessment.")
                if company_application.assessment_status == "completed":
                    raise ValueError("This application assessment has already been completed.")
                if company_application.assessment_status == "in_progress":
                    raise ValueError("This application already has an assessment in progress.")
            elif db_config.battle_type == "company":
                raise ValueError("Company assessments must be attached to a verified job.")

            if db_config.college_id is not None:
                student_link_result = await db.execute(
                    select(CollegeStudent).where(
                        CollegeStudent.user_id == current_user.id,
                        CollegeStudent.college_id == db_config.college_id,
                    )
                )
                if student_link_result.scalar_one_or_none() is None:
                    raise ValueError("Join the college before taking its assessment.")
        else:
            if battle_type_val in {"company", "college"}:
                raise ValueError("Organization assessments must use an assigned configuration.")
            tmpl = battle_config_service.get_template(battle_type_val, request.difficulty)
            sections_config = tmpl["sections"]
            difficulty = request.difficulty

        if sections_override is not None:
            sections_config = sections_override

        # Resolve Questions for each section in the configuration
        resolved_sections = await question_engine.resolve_questions_for_sections(
            db, sections_config, difficulty=difficulty
        )

        # Battle rooms remain in a server-controlled lifecycle until the host starts
        # the session. This preserves the canonical state machine instead of forcing
        # newly created rooms into an already-active submission state.
        section_duration_minutes = max(1, sum(
            int(section.get("duration_minutes", 10)) for section in sections_config if isinstance(section, dict)
        ))
        created_at = datetime.utcnow()
        battle = BattleRoom(
            config_id=request.config_id,
            creator_id=current_user.id,
            title=request.title,
            battle_type=battle_type_val,
            battle_mode=(request.battle_mode.value if hasattr(request.battle_mode, "value") else str(request.battle_mode)).lower(),
            difficulty=difficulty,
            problem_id=request.problem_id,
            max_players=request.max_players,
            current_round=1,
            current_section_index=0,
            sections_config=sections_config,
            questions_data=resolved_sections,
            status="created",
            round_status="created",
            company_id=str(db_config.company_id) if db_config and db_config.company_id is not None else None,
            college_id=str(db_config.college_id) if db_config and db_config.college_id is not None else None,
            started_at=None,
            created_at=created_at,
            expires_at=None,
            last_transition_at=created_at,
            state_history=[{
                "event": "battle_created",
                "timestamp": created_at.isoformat(),
                "user_id": current_user.id,
                "status": "created",
            }],
        )

        battle = await battle_repository.create_battle(db, battle)

        participant = BattleParticipant(
            battle_id=battle.id,
            user_id=current_user.id,
            score=0,
            rank=1,
        )

        await battle_repository.add_participant(db, participant)
        await question_engine.record_question_exposures(
            db,
            user_id=current_user.id,
            questions_data=resolved_sections,
        )

        if company_application:
            company_application.assessment_battle_id = battle.id
            company_application.assessment_status = "in_progress"
            company_application.assessment_score = None

        # Auto-add a friend if available and max_players > 1
        from app.modules.friend.service import friend_service
        friends = await friend_service.get_friends(db, current_user)
        if friends and request.max_players > 1:
            friend_row = friends[0]
            friend_user_id = (
                friend_row.friend_id
                if friend_row.user_id == current_user.id
                else friend_row.user_id
            )
            friend_participant = BattleParticipant(
                battle_id=battle.id,
                user_id=friend_user_id,
                score=0,
                rank=2,
            )
            await battle_repository.add_participant(db, friend_participant)
            await question_engine.record_question_exposures(
                db,
                user_id=friend_user_id,
                questions_data=resolved_sections,
            )

        if commit:
            await db.commit()
        return battle

    async def get_or_create_daily_battle(
        self,
        db: AsyncSession,
        current_user: User,
    ) -> BattleRoom:
        daily_date = datetime.utcnow().date()
        existing_result = await db.execute(
            select(BattleRoom).where(
                BattleRoom.adaptive_owner_id == current_user.id,
                BattleRoom.adaptive_date == daily_date,
            )
        )
        existing = existing_result.scalar_one_or_none()
        if existing is not None:
            return existing

        template = battle_config_service.get_template("practice", "medium")
        sections = [dict(section) for section in template["sections"]]
        resolved_sections = await question_engine.get_adaptive_questions_for_user(
            db,
            user_id=current_user.id,
            sections_config=sections,
            difficulty="medium",
        )
        now = datetime.utcnow()
        battle = BattleRoom(
            title="Daily Adaptive Battle",
            battle_type="practice",
            difficulty="adaptive",
            problem_id=1,
            max_players=1,
            current_section_index=0,
            sections_config=sections,
            questions_data=resolved_sections,
            status="running",
            started_at=now,
            adaptive_owner_id=current_user.id,
            adaptive_date=daily_date,
        )
        try:
            await battle_repository.create_battle(db, battle)
            await battle_repository.add_participant(
                db,
                BattleParticipant(
                    battle_id=battle.id,
                    user_id=current_user.id,
                    score=0,
                    rank=1,
                ),
            )
            await question_engine.record_question_exposures(
                db,
                user_id=current_user.id,
                questions_data=resolved_sections,
            )
            await db.commit()
        except IntegrityError:
            await db.rollback()
            existing_result = await db.execute(
                select(BattleRoom).where(
                    BattleRoom.adaptive_owner_id == current_user.id,
                    BattleRoom.adaptive_date == daily_date,
                )
            )
            existing = existing_result.scalar_one_or_none()
            if existing is None:
                raise
            return existing
        logger.info(
            "battle_created_adaptive user_id=%s battle_id=%s date=%s",
            current_user.id,
            battle.id,
            daily_date.isoformat(),
        )
        return battle

    async def start_battle(
        self,
        db: AsyncSession,
        battle_id: str,
        current_user: User,
    ) -> BattleRoom:
        battle = await battle_repository.get_battle(db, battle_id)
        if battle is None:
            raise ValueError("Battle not found.")

        participant = await battle_repository.get_participant(db, battle_id, current_user.id)
        if participant is None:
            raise ValueError("You are not a participant in this battle.")

        if battle.status in {"finalized", "analysis", "result", "evaluating", "completed"}:
            raise ValueError("Battle is already finalized and cannot be started again.")

        if battle.status in {"ready", "countdown", "knowledge_round", "coding_round", "running"} and battle.started_at is not None:
            return battle

        if battle.status in {"created", "waiting"}:
            battle.status = "ready"
            battle.round_status = "ready"
        elif battle.started_at is not None and battle.status not in {"created", "waiting"}:
            raise ValueError("Battle has already started.")

        battle.current_round = 1
        battle.started_at = battle.started_at or datetime.utcnow()
        duration_minutes = max(1, sum(
            int(section.get("duration_minutes", 10)) for section in (battle.sections_config or []) if isinstance(section, dict)
        ))
        battle.expires_at = battle.expires_at or (battle.started_at + timedelta(minutes=duration_minutes))
        battle.last_transition_at = battle.started_at
        battle.state_history = list(battle.state_history or []) + [{
            "event": "battle_started",
            "timestamp": battle.started_at.isoformat(),
            "user_id": current_user.id,
            "status": battle.status,
        }]
        await battle_repository.update_battle(db, battle)
        await db.commit()
        return battle

    async def advance_battle_round(
        self,
        db: AsyncSession,
        battle_id: str,
        current_user: User,
        target_round: str | None = None,
    ) -> BattleRoom:
        battle = await battle_repository.get_battle(db, battle_id)
        if battle is None:
            raise ValueError("Battle not found.")

        participant = await battle_repository.get_participant(db, battle_id, current_user.id)
        if participant is None:
            raise ValueError("You are not authorized to modify this battle.")

        if battle.status in {"finalized", "completed"}:
            raise ValueError("Battle is already finalized.")

        current_state = battle.status or "created"
        valid_transitions = {
            "created": {"waiting"},
            "waiting": {"ready"},
            "ready": {"countdown"},
            "countdown": {"knowledge_round"},
            "knowledge_round": {"coding_round"},
            "coding_round": {"evaluating"},
            "evaluating": {"result"},
            "result": {"analysis"},
            "analysis": {"finalized"},
            "finalized": set(),
        }
        if current_state not in valid_transitions:
            raise ValueError(f"Invalid transition from battle state '{current_state}'.")

        target = (target_round or "").strip().lower().replace(" ", "_")
        normalized_target = target if target in {"created", "waiting", "ready", "countdown", "knowledge_round", "coding_round", "evaluating", "result", "analysis", "finalized"} else None
        if normalized_target is not None:
            if normalized_target not in valid_transitions.get(current_state, set()):
                raise ValueError(f"Invalid transition from '{current_state}' to '{target_round}'.")
        elif target in {"knowledge", "coding"}:
            mapped_target = "knowledge_round" if target == "knowledge" else "coding_round"
            if mapped_target not in valid_transitions.get(current_state, set()):
                raise ValueError(f"Invalid transition from '{current_state}' to '{target_round}'.")
            normalized_target = mapped_target

        if target and normalized_target is None:
            raise ValueError("Invalid round target.")

        next_state = normalized_target or next(iter(valid_transitions[current_state]))
        if current_state == "created":
            battle.status = "waiting"
            battle.round_status = "waiting"
        elif current_state == "waiting":
            battle.status = "ready"
            battle.round_status = "ready"
        elif current_state == "ready":
            battle.status = "countdown"
            battle.round_status = "countdown"
        elif current_state == "countdown":
            battle.status = "knowledge_round"
            battle.round_status = "knowledge"
            battle.current_round = 1
        elif current_state == "knowledge_round":
            battle.status = "coding_round"
            battle.round_status = "coding"
            battle.current_round = 2
        elif current_state == "coding_round":
            battle.status = "evaluating"
            battle.round_status = "evaluating"
        elif current_state == "evaluating":
            battle.status = "result"
            battle.round_status = "result"
        elif current_state == "result":
            battle.status = "analysis"
            battle.round_status = "analysis"
        elif current_state == "analysis":
            battle.status = "finalized"
            battle.round_status = "finalized"
            battle.ended_at = battle.ended_at or datetime.utcnow()
            battle.expires_at = battle.ended_at
        else:
            raise ValueError(f"Battle state '{current_state}' cannot be advanced.")

        battle.last_transition_at = datetime.utcnow()
        battle.state_history = list(battle.state_history or []) + [{
            "event": f"state_{battle.status}",
            "timestamp": battle.last_transition_at.isoformat(),
            "user_id": current_user.id,
            "status": battle.status,
        }]
        await battle_repository.update_battle(db, battle)
        await db.commit()
        return battle

    # ==========================================================
    # Join Battle
    # ==========================================================

    async def join_battle(
        self,
        db: AsyncSession,
        battle_id: str,
        current_user: User,
    ) -> BattleRoom:

        battle = await battle_repository.get_battle(db, battle_id)
        if battle is None:
            raise ValueError("Battle not found.")

        existing = await battle_repository.get_participant(db, battle_id, current_user.id)
        if existing:
            return battle

        players = await battle_repository.get_participants(db, battle_id)
        if len(players) >= battle.max_players:
            raise ValueError("Battle is already full.")

        participant = BattleParticipant(
            battle_id=battle.id,
            user_id=current_user.id,
            score=0,
            rank=len(players) + 1,
        )

        await battle_repository.add_participant(db, participant)
        await question_engine.record_question_exposures(
            db,
            user_id=current_user.id,
            questions_data=battle.questions_data,
        )
        players = await battle_repository.get_participants(db, battle.id)

        if len(players) >= battle.max_players:
            battle.status = "running"
            battle.started_at = datetime.utcnow()
            await battle_repository.update_battle(db, battle)

        await db.commit()
        return battle

    # ==========================================================
    # Leave Battle
    # ==========================================================

    async def leave_battle(
        self,
        db: AsyncSession,
        battle_id: str,
        current_user: User,
    ) -> None:
        participant = await battle_repository.get_participant(db, battle_id, current_user.id)
        if participant is None:
            return
        await battle_repository.remove_participant(db, participant)
        await db.commit()

    # ==========================================================
    # Waiting & Details
    # ==========================================================

    async def waiting_battles(self, db: AsyncSession):
        return await battle_repository.get_waiting_battles(db)

    async def get_battle(self, db: AsyncSession, battle_id: str):
        return await battle_repository.get_battle(db, battle_id)

    async def participants(self, db: AsyncSession, battle_id: str):
        return await battle_repository.get_participants(db, battle_id)

    # ==========================================================
    # Submit Question / Section Answer (Server Authoritative)
    # ==========================================================

    async def submit_answer(
        self,
        db: AsyncSession,
        current_user: User,
        request: SubmitAnswerRequest,
    ) -> BattleSubmission:
        battle = await battle_repository.get_battle(db, request.battle_id)
        if battle is None:
            raise ValueError("Battle not found.")

        participant = await battle_repository.get_participant(db, request.battle_id, current_user.id)
        if participant is None:
            raise ValueError("Player is not a participant in this battle.")
        active_states = {"created", "waiting", "running", "ready", "countdown", "knowledge_round", "coding_round"}
        if battle.status not in active_states:
            raise ValueError("This battle is not accepting submissions.")
        duration_seconds = sum(
            max(0, int(section.get("duration_minutes", 0))) * 60
            for section in (battle.sections_config or [])
        )
        if battle.started_at is not None and duration_seconds:
            elapsed_seconds = (datetime.utcnow() - battle.started_at).total_seconds()
            if elapsed_seconds >= duration_seconds:
                battle.status = "expired"
                await db.commit()
                raise ValueError("This battle has expired and no longer accepts submissions.")

        qtype = request.question_type.value if hasattr(request.question_type, "value") else str(request.question_type)
        if request.question_id is None:
            raise ValueError("A question id is required for scored submissions.")
        if request.section_index < 0 or request.section_index >= len(battle.questions_data or []):
            raise ValueError("Question section is not part of this battle.")

        section = battle.questions_data[request.section_index]
        if str(section.get("question_type", "")).lower() != qtype:
            raise ValueError("Question type does not match the selected section.")
        selected_question = next(
            (
                question
                for question in section.get("questions", [])
                if question.get("id") == request.question_id
            ),
            None,
        )
        if selected_question is None:
            raise ValueError("Question does not belong to this battle section.")

        duplicate_result = await db.execute(
            select(BattleSubmission.id).where(
                BattleSubmission.battle_id == battle.id,
                BattleSubmission.user_id == current_user.id,
                BattleSubmission.question_id == request.question_id,
            )
        )
        if duplicate_result.scalar_one_or_none():
            raise ValueError("This question has already been submitted.")

        score_earned = 0.0
        verdict = "Submitted"
        passed_tests = 0
        total_tests = 1

        # Resolve the authoritative question record after confirming room membership.
        stmt = select(Question).where(Question.id == request.question_id)
        q_obj = (await db.execute(stmt)).scalar_one_or_none()
        if q_obj is None:
            raise ValueError("Question was not found.")

        # Evaluate based on Question Type
        if qtype in {"mcq", "aptitude"}:
            correct_opt = q_obj.correct_option
            neg_marking = False
            if battle.sections_config and request.section_index < len(battle.sections_config):
                neg_marking = battle.sections_config[request.section_index].get("negative_marking", False)

            score_earned = battle_score_manager.calculate_mcq_score(
                student_option=request.mcq_option,
                correct_option=correct_opt,
                points=10.0,
                negative_penalty=2.5,
                negative_marking=neg_marking,
            )
            verdict = "Correct" if score_earned > 0 else "Incorrect"
            passed_tests = 1 if score_earned > 0 else 0
            total_tests = 1

        elif qtype in ("coding", "debugging"):
            from app.modules.battle.judge import battle_judge
            judge_res = await battle_judge.evaluate(
                request.language,
                request.source_code or "",
                question=q_obj,
            )
            verdict = judge_res["verdict"]
            passed_tests = judge_res["passed_tests"]
            total_tests = judge_res["total_tests"]
            runtime_ms = judge_res["runtime_ms"]
            memory_mb = judge_res["memory_mb"]

            if qtype == "coding":
                score_earned = battle_score_manager.calculate_coding_score(
                    verdict=verdict,
                    passed_tests=passed_tests,
                    total_tests=total_tests,
                    runtime_ms=runtime_ms,
                    memory_mb=memory_mb,
                    max_points=50.0,
                )
            else:
                score_earned = battle_score_manager.calculate_debugging_score(
                    verdict=verdict,
                    passed_tests=passed_tests,
                    total_tests=total_tests,
                    max_points=25.0,
                )

        elif qtype == "technical":
            rubric = q_obj.rubric or {"key_concepts": ["architecture", "logic"]}
            score_earned = battle_score_manager.calculate_technical_score(
                student_response=request.source_code,
                rubric=rubric,
                max_points=15.0,
            )
            verdict = "Evaluated"
            passed_tests = 1 if score_earned > 0 else 0
            total_tests = 1
        else:
            raise ValueError(f"Question type '{qtype}' is not supported by the battle evaluator.")

        # Create Battle Submission Record
        sub = BattleSubmission(
            battle_id=battle.id,
            user_id=current_user.id,
            question_id=request.question_id,
            section_index=request.section_index,
            question_type=qtype,
            mcq_option=request.mcq_option,
            language=request.language,
            source_code=request.source_code or "",
            verdict=verdict,
            passed_tests=passed_tests,
            total_tests=total_tests,
            score=int(score_earned),
            score_earned=score_earned,
            max_possible_score=100.0,
            time_taken_seconds=request.time_taken_seconds,
            telemetry=request.telemetry or {},
            submitted_at=datetime.utcnow(),
        )
        db.add(sub)

        is_correct = verdict in ("Accepted", "Correct")
        if qtype == "technical":
            is_correct = score_earned >= 10.5
        skill_subject = (q_obj.skill_category or "Problem Solving").strip()
        skill_result = await db.execute(
            select(UserSkillStat).where(
                UserSkillStat.user_id == current_user.id,
                func.lower(UserSkillStat.subject) == skill_subject.casefold(),
            ).limit(1)
        )
        skill_stat = skill_result.scalar_one_or_none()
        if skill_stat is None:
            skill_stat = UserSkillStat(
                user_id=current_user.id,
                subject=skill_subject,
                correct_attempts=0,
                total_attempts=0,
            )
            db.add(skill_stat)
        skill_stat.total_attempts += 1
        skill_stat.correct_attempts += int(is_correct)
        await question_engine.record_question_result(
            db,
            user_id=current_user.id,
            question_id=q_obj.id,
            verdict="Correct" if is_correct else "Incorrect",
            score=score_earned,
        )

        # Update Participant Score atomically
        participant.score += int(score_earned)
        await db.commit()

        # Broadcast real-time score update over WebSocket
        players = await battle_repository.get_participants(db, battle.id)
        players = rank_players(players)

        await battle_ws.broadcast(
            battle.id,
            BattleEvent.SCORE_UPDATED.value,
            {
                "user_id": current_user.id,
                "score_added": score_earned,
                "total_score": participant.score,
                "verdict": verdict,
                "leaderboard": [
                    {"user_id": p.user_id, "score": p.score, "rank": p.rank} for p in players
                ],
            },
        )

        return sub

    # ==========================================================
    # Anti-Cheating Telemetry Logging
    # ==========================================================

    async def record_anti_cheat_event(
        self,
        db: AsyncSession,
        battle_id: str,
        current_user: User,
        event_type: str,
        metadata: Dict[str, Any],
    ) -> Dict[str, Any]:
        battle = await battle_repository.get_battle(db, battle_id)
        if not battle:
            return {"status": "error", "message": "Battle not found"}

        logs = list(battle.anti_cheat_logs or [])
        entry = {
            "user_id": current_user.id,
            "username": current_user.username,
            "event_type": event_type,
            "metadata": metadata,
            "timestamp": datetime.utcnow().isoformat(),
        }
        logs.append(entry)
        battle.anti_cheat_logs = logs
        await db.commit()

        if event_type in ("tab_switch", "multiple_sessions_detected"):
            await battle_ws.broadcast(
                battle_id,
                BattleEvent.ANTI_CHEAT_WARNING.value,
                {
                    "user_id": current_user.id,
                    "event_type": event_type,
                    "warning": "Suspicious activity flagged on server.",
                },
            )

        return {"status": "logged", "entry": entry}

    # ==========================================================
    # Join Matchmaking Queue
    # ==========================================================

    async def join_queue(
        self,
        db: AsyncSession,
        current_user: User,
        request: MatchmakingRequest | None = None,
    ):
        active = await battle_repository.get_active_battle_for_user(db, current_user.id)
        if active:
            return {"status": "already_in_battle", "battle_id": active.battle_id}

        request = request or MatchmakingRequest()

        if request.mode == "friend":
            if not request.friend_id:
                raise ValueError("friend_id is required for friend matchmaking.")
            if request.friend_id == current_user.id:
                raise ValueError("Cannot invite yourself.")

            from app.modules.friend.service import friend_service
            friends = await friend_service.get_friends(db, current_user)
            friend_ids = {
                f.friend_id if f.user_id == current_user.id else f.user_id
                for f in friends
            }
            if request.friend_id not in friend_ids:
                raise ValueError("You can only invite confirmed friends.")

            battle_type_val = request.battle_type.value if hasattr(request.battle_type, "value") else str(request.battle_type)
            tmpl = battle_config_service.get_template(battle_type_val, request.difficulty)
            resolved_sections = await question_engine.resolve_questions_for_sections(
                db, tmpl["sections"], difficulty=request.difficulty
            )

            battle = BattleRoom(
                title=f"{current_user.username} vs Friend Duel",
                battle_type=battle_type_val,
                difficulty=request.difficulty or tmpl["difficulty"],
                problem_id=1,
                sections_config=tmpl["sections"],
                questions_data=resolved_sections,
                status="waiting",
                max_players=2,
            )
            battle = await battle_repository.create_battle(db, battle)
            await battle_repository.add_participant(
                db,
                BattleParticipant(
                    battle_id=battle.id,
                    user_id=current_user.id,
                    score=0,
                    rank=1,
                ),
            )
            await question_engine.record_question_exposures(
                db,
                user_id=current_user.id,
                questions_data=resolved_sections,
            )
            await db.commit()
            return {"status": "invited", "battle_id": battle.id}

        match = matchmaking_engine.join_queue(user_id=current_user.id)
        players = matchmaking_engine.find_match()

        if players is None:
            return {"status": "waiting", "queue_size": match["queue_size"]}

        battle_type_val = request.battle_type.value if hasattr(request.battle_type, "value") else str(request.battle_type)
        tmpl = battle_config_service.get_template(battle_type_val, request.difficulty)
        resolved_sections = await question_engine.resolve_questions_for_sections(
            db, tmpl["sections"], difficulty=request.difficulty
        )

        battle = BattleRoom(
            title=f"{request.difficulty.capitalize()} {battle_type_val.capitalize()} Battle",
            battle_type=battle_type_val,
            difficulty=request.difficulty,
            problem_id=1,
            sections_config=tmpl["sections"],
            questions_data=resolved_sections,
            status="running",
            max_players=2,
            started_at=datetime.utcnow(),
        )

        battle = await battle_repository.create_battle(db, battle)

        await battle_repository.add_participant(
            db, BattleParticipant(battle_id=battle.id, user_id=players["player1"].user_id)
        )
        await battle_repository.add_participant(
            db, BattleParticipant(battle_id=battle.id, user_id=players["player2"].user_id)
        )
        for player in (players["player1"], players["player2"]):
            await question_engine.record_question_exposures(
                db,
                user_id=player.user_id,
                questions_data=resolved_sections,
            )

        await db.commit()

        asyncio.create_task(
            battle_orchestrator.start_battle(battle.id, tmpl["duration_minutes"] * 60)
        )

        return {"status": "matched", "battle_id": battle.id}

    async def leave_queue(self, current_user: User):
        matchmaking_engine.leave_queue(current_user.id)
        return {"message": "Removed from queue."}

    # ==========================================================
    # Finish Battle & Persist Advanced Results
    # ==========================================================

    async def finish_battle(self, db: AsyncSession, battle_id: str):
        battle = await battle_repository.get_battle(db, battle_id)
        if battle is None:
            return None

        stmt_existing = select(BattleResult).where(BattleResult.battle_id == battle_id)
        existing_res = (await db.execute(stmt_existing)).scalar_one_or_none()
        if existing_res is not None:
            return {
                "id": existing_res.id,
                "battle_id": existing_res.battle_id,
                "participant_id": existing_res.participant_id,
                "winner_id": existing_res.winner_id,
                "battle_type": existing_res.battle_type,
                "is_draw": existing_res.is_draw,
                "total_players": existing_res.total_players,
                "duration_seconds": existing_res.duration_seconds,
                "winner_score": existing_res.winner_score,
                "average_score": existing_res.average_score,
                "accuracy_percentage": existing_res.accuracy_percentage,
                "knowledge_score": existing_res.knowledge_score,
                "coding_score": existing_res.coding_score,
                "overall_score": existing_res.overall_score,
                "accuracy": existing_res.accuracy,
                "completion_status": existing_res.completion_status,
                "result_status": existing_res.result_status,
                "rank": existing_res.rank,
                "section_scores": existing_res.section_scores,
                "question_breakdown": existing_res.question_breakdown,
                "skill_breakdown": existing_res.skill_breakdown,
                "placement_readiness": existing_res.placement_readiness,
                "recommendations": existing_res.recommendations,
                "xp_earned": existing_res.xp_earned,
                "rating_change": existing_res.rating_change,
                "created_at": existing_res.created_at,
                "finalized_at": existing_res.finalized_at,
                "scoring_metadata": existing_res.scoring_metadata,
            }

        participants = await battle_repository.get_participants(db, battle_id)
        stmt_subs = select(BattleSubmission).where(BattleSubmission.battle_id == battle_id)
        submissions = list((await db.execute(stmt_subs)).scalars().all())

        participant_metrics: dict[str, dict[str, Any]] = {}
        for participant in participants:
            participant_submissions = [s for s in submissions if s.user_id == participant.user_id]
            metrics = battle_scoring_service.compute_result_metrics(battle, participant_submissions, participant.user_id)
            participant_metrics[participant.user_id] = metrics

        if not participants:
            battle.status = "completed"
            battle.round_status = "completed"
            battle.ended_at = battle.ended_at or datetime.utcnow()
            await db.commit()
            return {"battle_id": battle_id, "winner_id": None, "rewards": [], "participant_id": None, "xp_earned": 0}

        winner = max(
            participants,
            key=lambda p: (float(getattr(p, "score", 0) or 0), participant_metrics.get(p.user_id, {}).get("overall_score", 0.0)),
        )
        winner_id = winner.user_id
        top_score = max((float(getattr(p, "score", 0) or 0) for p in participants), default=0.0)
        draw = len(participants) > 1 and all(float(getattr(p, "score", 0) or 0) == top_score for p in participants)

        ordered_participants = sorted(participants, key=lambda p: (p.user_id != winner_id, p.user_id))

        rewards = []
        total_xp_earned = 0
        for participant in ordered_participants:
            is_winner = participant.user_id == winner_id and not draw
            xp_earned = 150 if is_winner else 50
            total_xp_earned += xp_earned

            user_result = await db.execute(select(User).where(User.id == participant.user_id))
            user = user_result.scalar_one_or_none()
            if user is None:
                continue

            progression = await xp_service.add_xp(db, user, xp_earned, commit=False)
            user.coding_rating = max(0, (user.coding_rating or 1000) + (25 if is_winner else -10))
            stats_result = await db.execute(
                select(UserStats).where(UserStats.user_id == user.id).with_for_update()
            )
            stats = stats_result.scalar_one_or_none()
            if stats is not None:
                stats.rating = max(0, (stats.rating or 1000) + (25 if is_winner else -10))
                stats.xp = progression.total_xp
                stats.level = progression.level

            rewards.append({
                "user_id": participant.user_id,
                "winner": is_winner,
                "xp": xp_earned,
                "rating_change": 25 if is_winner else -10,
                "total_xp": progression.total_xp,
                "level": progression.level,
            })

        battle.status = "completed"
        battle.round_status = "completed"
        battle.ended_at = battle.ended_at or datetime.utcnow()
        duration_sec = int((battle.ended_at - (battle.started_at or battle.created_at)).total_seconds()) if battle.started_at or battle.created_at else 0

        aggregate_metrics = {
            "winner_id": winner_id,
            "winner_score": max((participant_metrics.get(p.user_id, {}).get("overall_score", 0) for p in participants), default=0.0),
            "is_draw": draw,
            "total_players": len(participants),
            "average_score": round(sum(m["overall_score"] for m in participant_metrics.values()) / len(participant_metrics), 2) if participant_metrics else 0.0,
            "accuracy_percentage": round(sum(m["accuracy"] for m in participant_metrics.values()) / len(participant_metrics), 2) if participant_metrics else 0.0,
            "knowledge_score": round(sum(m["knowledge_score"] for m in participant_metrics.values()) / len(participant_metrics), 2) if participant_metrics else 0.0,
            "coding_score": round(sum(m["coding_score"] for m in participant_metrics.values()) / len(participant_metrics), 2) if participant_metrics else 0.0,
            "overall_score": round(sum(m["overall_score"] for m in participant_metrics.values()) / len(participant_metrics), 2) if participant_metrics else 0.0,
            "accuracy": round(sum(m["accuracy"] for m in participant_metrics.values()) / len(participant_metrics), 2) if participant_metrics else 0.0,
            "completion_status": "completed" if participant_metrics else "pending",
            "result_status": "result",
            "rank": "1" if winner_id else "PENDING",
            "section_scores": {},
            "question_breakdown": [],
            "skill_breakdown": {},
            "placement_readiness": {"overall_status": "Ready" if (sum(m["overall_score"] for m in participant_metrics.values()) / len(participant_metrics) if participant_metrics else 0) >= 60 else "Pending"},
            "recommendations": [],
        }

        winner_metrics = participant_metrics.get(winner_id, {})
        battle_result_record = BattleResult(
            battle_id=battle.id,
            participant_id=winner_id,
            winner_id=winner_id,
            battle_type=battle.battle_type,
            is_draw=draw,
            total_players=len(participants),
            duration_seconds=duration_sec,
            winner_score=int(aggregate_metrics["winner_score"]),
            average_score=aggregate_metrics["average_score"],
            accuracy_percentage=aggregate_metrics["accuracy_percentage"],
            knowledge_score=winner_metrics.get("knowledge_score", 0.0),
            coding_score=winner_metrics.get("coding_score", 0.0),
            overall_score=winner_metrics.get("overall_score", 0.0),
            accuracy=winner_metrics.get("accuracy", 0.0),
            completion_status=aggregate_metrics["completion_status"],
            result_status=aggregate_metrics["result_status"],
            rank=aggregate_metrics["rank"],
            section_scores=aggregate_metrics["section_scores"],
            question_breakdown=aggregate_metrics["question_breakdown"],
            skill_breakdown=aggregate_metrics["skill_breakdown"],
            placement_readiness=aggregate_metrics["placement_readiness"],
            recommendations=aggregate_metrics["recommendations"],
            xp_earned=total_xp_earned,
            rating_change=25 if winner_id else 0,
            created_at=datetime.utcnow(),
            finalized_at=datetime.utcnow(),
            scoring_metadata={
                "knowledge": winner_metrics,
                "participants": participant_metrics,
                "rewards": rewards,
                "selected_participant_id": winner_id,
            },
        )
        db.add(battle_result_record)

        for participant in ordered_participants:
            participant_submissions = [s for s in submissions if s.user_id == participant.user_id]
            for sub in participant_submissions:
                if sub.question_id is None:
                    continue
                question = await db.get(Question, sub.question_id)
                skill_name = question.skill_category if question and question.skill_category else sub.question_type or "General"
                skill_id = normalize_skill_id(skill_name)
                evidence = SkillEvidence(
                    user_id=participant.user_id,
                    skill_id=skill_id,
                    skill_name=skill_name,
                    parent_skill_id=None,
                    source_type="BATTLE",
                    source_id=f"battle:{battle.id}",
                    submission_id=str(sub.id),
                    question_id=str(sub.question_id),
                    difficulty=(question.difficulty if question and question.difficulty else "medium").lower(),
                    correct=bool(sub.accepted or sub.verdict in ("Accepted", "Correct")),
                    score=float(sub.score_earned or sub.score or 0),
                    max_score=float(sub.max_possible_score or 100.0 or 1.0),
                    response_time_ms=int((sub.time_taken_seconds or 0) * 1000),
                    attempt_number=1,
                    extra={
                        "battle_id": battle.id,
                        "question_type": sub.question_type,
                        "verdict": sub.verdict,
                    },
                )
                db.add(evidence)

        await db.commit()

        return {
            "id": battle_result_record.id,
            "battle_id": battle.id,
            "winner_id": winner_id,
            "participant_id": winner_id,
            "is_draw": draw,
            "winner_score": aggregate_metrics["winner_score"],
            "average_score": aggregate_metrics["average_score"],
            "accuracy_percentage": aggregate_metrics["accuracy_percentage"],
            "knowledge_score": winner_metrics.get("knowledge_score", 0.0),
            "coding_score": winner_metrics.get("coding_score", 0.0),
            "overall_score": winner_metrics.get("overall_score", 0.0),
            "accuracy": winner_metrics.get("accuracy", 0.0),
            "completion_status": aggregate_metrics["completion_status"],
            "result_status": aggregate_metrics["result_status"],
            "rank": aggregate_metrics["rank"],
            "section_scores": aggregate_metrics["section_scores"],
            "question_breakdown": aggregate_metrics["question_breakdown"],
            "skill_breakdown": aggregate_metrics["skill_breakdown"],
            "placement_readiness": aggregate_metrics["placement_readiness"],
            "recommendations": aggregate_metrics["recommendations"],
            "xp_earned": total_xp_earned,
            "rewards": rewards,
            "rating_change": 25 if winner_id else 0,
            "created_at": battle_result_record.created_at,
            "finalized_at": battle_result_record.finalized_at,
            "scoring_metadata": battle_result_record.scoring_metadata,
        }


battle_service = BattleService()
