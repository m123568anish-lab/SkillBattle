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
from datetime import datetime
from typing import Dict, Any, List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.models.user_stats import UserStats
from app.models.battle import BattleRoom, BattleParticipant, BattleSubmission, BattleResult
from app.models.question import Question, UserSubmission
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
from app.modules.battle.config.service import battle_config_service
from app.modules.battle.question_engine import question_engine
from app.modules.battle.score import battle_score_manager
from app.modules.battle.result import battle_result_engine
from app.modules.battle.ranking import rank_players
from app.modules.battle.websocket import battle_ws
from app.modules.battle.events import BattleEvent
from app.modules.battle.matchmaking import matchmaking_engine
from app.modules.battle.orchestrator import battle_orchestrator
from app.modules.xp.service import xp_service
from app.modules.notification.service import notification_service
from app.modules.audit.service import audit_service


class BattleService:

    # ==========================================================
    # Create Battle Room
    # ==========================================================

    async def create_battle(
        self,
        db: AsyncSession,
        current_user: User,
        request: CreateBattleRequest,
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

        # Resolve Questions for each section in the configuration
        resolved_sections = await question_engine.resolve_questions_for_sections(
            db, sections_config, difficulty=difficulty
        )

        is_solo_assessment = db_config is not None and db_config.battle_type in {"company", "college"} and request.max_players == 1
        battle = BattleRoom(
            config_id=request.config_id,
            title=request.title,
            battle_type=battle_type_val,
            difficulty=difficulty,
            problem_id=request.problem_id,
            max_players=request.max_players,
            current_section_index=0,
            sections_config=sections_config,
            questions_data=resolved_sections,
            status="running" if is_solo_assessment else "waiting",
            company_id=str(db_config.company_id) if db_config and db_config.company_id is not None else None,
            college_id=str(db_config.college_id) if db_config and db_config.college_id is not None else None,
            started_at=datetime.utcnow() if is_solo_assessment else None,
            created_at=datetime.utcnow(),
        )

        battle = await battle_repository.create_battle(db, battle)

        participant = BattleParticipant(
            battle_id=battle.id,
            user_id=current_user.id,
            score=0,
            rank=1,
        )

        await battle_repository.add_participant(db, participant)

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

    async def get_or_create_daily_battle(
        self,
        db: AsyncSession,
        current_user: User,
    ) -> BattleRoom:
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        result = await db.execute(
            select(BattleRoom).where(
                BattleRoom.creator_id == current_user.id,
                BattleRoom.battle_type == "practice",
                BattleRoom.created_at >= today_start,
            ).order_by(BattleRoom.created_at.desc()).limit(1)
        )
        existing = result.scalar_one_or_none()
        if existing is not None:
            return existing

        request = CreateBattleRequest(
            title="Daily Battle",
            difficulty="medium",
            battle_type=BattleTypeEnum.PRACTICE,
            max_players=1,
        )
        return await self.create_battle(db, current_user, request)

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
        if qtype == "mcq":
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
                problem_id=battle.problem_id,
            )
            verdict = judge_res.get("verdict", "Accepted")
            passed_tests = judge_res.get("passed_tests", 1)
            total_tests = judge_res.get("total_tests", 1)
            runtime_ms = judge_res.get("runtime_ms", 10.0)
            memory_mb = judge_res.get("memory_mb", 5.0)

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

        # Check existing result record first for idempotency
        stmt_existing = select(BattleResult).where(BattleResult.battle_id == battle_id)
        existing_res = (await db.execute(stmt_existing)).scalar_one_or_none()

        participants = await battle_repository.get_participants(db, battle_id)
        stmt_subs = select(BattleSubmission).where(BattleSubmission.battle_id == battle_id)
        submissions = list((await db.execute(stmt_subs)).scalars().all())

        # Generate Comprehensive Results & Placement Readiness
        res_data = battle_result_engine.generate_comprehensive_result(
            battle, participants, submissions
        )
        res_data["rewards"] = [
            {
                "user_id": p.user_id,
                "xp": 150 if p.user_id == res_data.get("winner_id") and not res_data.get("is_draw") else 50,
                "rating_change": 25 if p.user_id == res_data.get("winner_id") and not res_data.get("is_draw") else -10,
            }
            for p in participants
        ]

        if existing_res is not None:
            return res_data

        battle.status = "completed"
        battle.ended_at = datetime.utcnow()

        # Calculate duration
        duration_sec = 0
        if battle.started_at and battle.ended_at:
            duration_sec = int((battle.ended_at - battle.started_at).total_seconds())

        # Persist BattleResult Record
        result_record = BattleResult(
            battle_id=battle.id,
            participant_id=res_data.get("participant_id") or (participants[0].user_id if participants else None),
            winner_id=res_data["winner_id"],
            battle_type=battle.battle_type,
            is_draw=res_data["is_draw"],
            total_players=res_data["total_players"],
            duration_seconds=duration_sec,
            winner_score=res_data["winner_score"],
            average_score=res_data["average_score"],
            knowledge_score=float(res_data.get("knowledge_score", 0.0) or 0.0),
            coding_score=float(res_data.get("coding_score", 0.0) or 0.0),
            debugging_score=float(res_data.get("debugging_score", 0.0) or 0.0),
            technical_score=float(res_data.get("technical_score", 0.0) or 0.0),
            overall_score=float(res_data.get("overall_score", res_data.get("accuracy_percentage", 0.0)) or 0.0),
            accuracy_percentage=res_data["accuracy_percentage"],
            accuracy=float(res_data.get("accuracy", res_data.get("accuracy_percentage", 0.0)) or 0.0),
            completion_status=res_data.get("completion_status", "completed"),
            result_status=res_data.get("result_status", "result"),
            rank=str(res_data.get("rank") or "PENDING"),
            section_scores=res_data["section_scores"],
            question_breakdown=res_data["question_breakdown"],
            skill_breakdown=res_data["skill_breakdown"],
            placement_readiness=res_data["placement_readiness"],
            recommendations=res_data["recommendations"],
            scoring_metadata=res_data.get("scoring_metadata", {}),
            xp_earned=sum(r["xp"] for r in res_data["rewards"]),
            rating_change=25 if res_data["winner_id"] and not res_data["is_draw"] else 0,
        )
        db.add(result_record)

        # Award XP & update rating for all participants once
        for p in participants:
            is_winner = (p.user_id == res_data["winner_id"]) and not res_data["is_draw"]
            xp_earned = 150 if is_winner else 50
            rating_change = 25 if is_winner else -10

            user = await db.get(User, p.user_id)
            if user:
                await xp_service.add_xp(db, user, xp_earned, commit=False)
                user.coding_rating = max(0, (user.coding_rating or 1000) + rating_change)
                stats_res = await db.execute(
                    select(UserStats).where(UserStats.user_id == user.id)
                )
                stats = stats_res.scalar_one_or_none()
                if stats:
                    stats.rating = max(0, stats.rating + rating_change)

        company_application_result = await db.execute(
            select(CandidateApplication).where(CandidateApplication.assessment_battle_id == battle_id)
        )
        company_application = company_application_result.scalar_one_or_none()
        if company_application:
            company_application.assessment_status = "completed"
            company_application.assessment_score = float(res_data["accuracy_percentage"])

        for participant in participants:
            is_winner = participant.user_id == res_data.get("winner_id") and not res_data["is_draw"]
            audit_service.enqueue(
                db,
                action="battle_completed",
                module="battle",
                user_id=participant.user_id,
                entity_type="battle",
                entity_id=battle.id,
                metadata={
                    "outcome": "draw" if res_data["is_draw"] else "win" if is_winner else "completed",
                    "xp_earned": 50 + (100 if is_winner else 0),
                },
            )
            if company_application:
                result_message = "Your company assessment result is ready."
                notification_type = "assessment"
            elif res_data["is_draw"]:
                result_message = "Your battle ended in a draw. View the final results."
                notification_type = "battle"
            elif participant.user_id == res_data.get("winner_id"):
                result_message = "You won the battle. View your final results."
                notification_type = "battle"
            else:
                result_message = "Your battle is complete. View your final results."
                notification_type = "battle"

            notification_service.enqueue(
                db,
                user_id=participant.user_id,
                title="Battle result ready",
                message=result_message,
                notification_type=notification_type,
                related_entity_type="battle",
                related_entity_id=str(battle.id),
            )

        await db.commit()

        # Broadcast Battle Finished Event
        await battle_ws.broadcast(
            battle_id,
            BattleEvent.BATTLE_FINISHED.value,
            {
                "battle_id": battle.id,
                "winner_id": res_data["winner_id"],
                "draw": res_data["is_draw"],
                "result": res_data,
                "leaderboard": [
                    {"user_id": p.user_id, "score": p.score, "rank": p.rank} for p in participants
                ],
            },
        )

        return res_data


battle_service = BattleService()

