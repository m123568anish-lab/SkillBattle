from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict, Any
from app.models.campaign import UserCampaignProgress
from app.models.xp import XP
from .level_data import LEVEL_DATA
from .schemas import (
    CampaignStatusResponse,
    TrackStatus,
    LevelStatus,
    CampaignLevelResponse,
    QuestionOption,
    LevelSubmitRequest,
    LevelSubmitResponse
)

class CampaignService:
    def get_rank_from_points(self, points: int) -> str:
        if points <= 300:
            return "Bronze"
        elif points <= 800:
            return "Silver"
        elif points <= 1500:
            return "Gold"
        elif points <= 2400:
            return "Platinum"
        elif points <= 3500:
            return "Diamond"
        elif points <= 5000:
            return "Heroic"
        return "Grandmaster"

    async def get_status(self, db: AsyncSession, user_id: str) -> CampaignStatusResponse:
        # Get progress from database
        stmt = select(UserCampaignProgress).where(UserCampaignProgress.user_id == user_id)
        result = await db.execute(stmt)
        progress_list = result.scalars().all()

        # Map by track and level
        progress_map = {}
        for p in progress_list:
            progress_map[(p.track, p.level_id)] = p.stars

        tracks = ["dsa", "os", "dbms"]
        track_statuses = []

        total_points = 0

        for track in tracks:
            levels = LEVEL_DATA[track]
            level_statuses = []
            
            # Level 1 is always unlocked
            unlocked = True
            current_level = 1

            for lvl in levels:
                lvl_id = lvl["level_id"]
                stars = progress_map.get((track, lvl_id), 0)
                
                total_points += stars * 100

                level_statuses.append(
                    LevelStatus(
                        level_id=lvl_id,
                        title=lvl["title"],
                        description=lvl["description"],
                        stars=stars,
                        unlocked=unlocked
                    )
                )

                # Next level is unlocked if current level has at least 1 star (completed)
                if stars > 0:
                    unlocked = True
                    current_level = max(current_level, lvl_id + 1)
                else:
                    unlocked = False

            track_statuses.append(
                TrackStatus(
                    track=track.upper(),
                    current_level=min(current_level, len(levels)),
                    levels=level_statuses
                )
            )

        rank = self.get_rank_from_points(total_points)

        return CampaignStatusResponse(
            rank=rank,
            points=total_points,
            tracks=track_statuses
        )

    def get_level(self, track: str, level_id: int) -> CampaignLevelResponse:
        track = track.lower()
        if track not in LEVEL_DATA:
            raise ValueError("Invalid track name")

        levels = LEVEL_DATA[track]
        matching = [l for l in levels if l["level_id"] == level_id]
        if not matching:
            raise ValueError("Level not found")

        level = matching[0]
        # Map questions without correct answers
        q_options = []
        for q in level["questions"]:
            q_options.append(
                QuestionOption(
                    id=q["id"],
                    text=q["text"],
                    options=q["options"]
                )
            )

        return CampaignLevelResponse(
            level_id=level["level_id"],
            title=level["title"],
            description=level["description"],
            questions=q_options
        )

    async def submit_level(self, db: AsyncSession, user_id: str, req: LevelSubmitRequest) -> LevelSubmitResponse:
        track = req.track.lower()
        if track not in LEVEL_DATA:
            raise ValueError("Invalid track name")

        levels = LEVEL_DATA[track]
        matching = [l for l in levels if l["level_id"] == req.level_id]
        if not matching:
            raise ValueError("Level not found")

        level = matching[0]
        total_q = len(level["questions"])
        correct_count = 0

        # Map request answers
        user_ans = {a.question_id: a.selected_option for a in req.answers}

        for q in level["questions"]:
            q_id = q["id"]
            if q_id in user_ans and user_ans[q_id] == q["correct"]:
                correct_count += 1

        score_pct = (correct_count / total_q) * 100
        
        # Calculate stars
        if correct_count == total_q:
            stars = 3
        elif correct_count >= 2:
            stars = 2
        elif correct_count >= 1:
            stars = 1
        else:
            stars = 0

        # Get initial points
        initial_status = await self.get_status(db, user_id)
        old_points = initial_status.points
        old_rank = initial_status.rank

        # Save or update progress
        stmt = select(UserCampaignProgress).where(
            UserCampaignProgress.user_id == user_id,
            UserCampaignProgress.track == track,
            UserCampaignProgress.level_id == req.level_id
        )
        res = await db.execute(stmt)
        progress = res.scalar_one_or_none()

        unlocked_next = stars > 0

        if not progress:
            if unlocked_next:
                progress = UserCampaignProgress(
                    user_id=user_id,
                    track=track,
                    level_id=req.level_id,
                    stars=stars,
                    completed=True
                )
                db.add(progress)
        else:
            # Only update stars if they improved
            if stars > progress.stars:
                progress.stars = stars
                progress.completed = True

        # Grant platform XP if completed
        if unlocked_next:
            # Grant some platform XP too! (e.g. 100 XP per star)
            xp_stmt = select(XP).where(XP.user_id == user_id)
            xp_res = await db.execute(xp_stmt)
            user_xp = xp_res.scalar_one_or_none()
            
            xp_reward = stars * 100
            if user_xp:
                user_xp.xp += xp_reward
                # Recalculate level
                user_xp.level = (user_xp.xp // 2500) + 1
            else:
                new_xp = XP(user_id=user_id, xp=xp_reward, level=(xp_reward // 2500) + 1)
                db.add(new_xp)

        await db.commit()

        # Recalculate points & rank
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
            correct_count=correct_count
        )

campaign_service = CampaignService()
