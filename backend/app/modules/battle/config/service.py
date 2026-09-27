import random
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.battle.battle_config import BattleConfig
from app.modules.battle.schemas import BattleConfigCreate, BattleTypeEnum, QuestionTypeEnum


class BattleConfigService:
    """
    Responsible for creating, resolving, and retrieving Battle Engine configurations
    for General, Placement, Company, College, Tournament, and Practice battles.
    """

    DEFAULT_TEMPLATES: Dict[str, Dict[str, Any]] = {
        "general": {
            "title": "Standard Competitive Battle",
            "description": "General 1v1 competitive coding battle focused on algorithmic speed.",
            "battle_type": "general",
            "difficulty": "medium",
            "duration_minutes": 20,
            "question_count": 1,
            "negative_marking": False,
            "sections": [
                {
                    "title": "Coding Challenge",
                    "question_type": "coding",
                    "question_count": 1,
                    "weight": 1.0,
                    "duration_minutes": 20,
                    "negative_marking": False,
                }
            ],
            "allowed_languages": ["python", "javascript", "cpp", "java"],
            "scoring_rules": {
                "coding_points": 100,
                "negative_penalty": 0,
            },
        },
        "placement": {
            "title": "Full Placement Battle Assessment",
            "description": "Comprehensive placement assessment covering Aptitude/CS MCQs, DSA Coding, Debugging, and Technical interview concepts.",
            "battle_type": "placement",
            "difficulty": "medium",
            "duration_minutes": 60,
            "question_count": 9,
            "negative_marking": True,
            "sections": [
                {
                    "title": "Aptitude & Technical MCQs",
                    "question_type": "mcq",
                    "question_count": 5,
                    "weight": 0.25,
                    "duration_minutes": 15,
                    "negative_marking": True,
                },
                {
                    "title": "DSA Coding Problems",
                    "question_type": "coding",
                    "question_count": 2,
                    "weight": 0.50,
                    "duration_minutes": 30,
                    "negative_marking": False,
                },
                {
                    "title": "Code Debugging Challenge",
                    "question_type": "debugging",
                    "question_count": 1,
                    "weight": 0.15,
                    "duration_minutes": 10,
                    "negative_marking": False,
                },
                {
                    "title": "Technical Concept Review",
                    "question_type": "technical",
                    "question_count": 1,
                    "weight": 0.10,
                    "duration_minutes": 5,
                    "negative_marking": False,
                },
            ],
            "allowed_languages": ["python", "javascript", "cpp", "java", "sql"],
            "scoring_rules": {
                "mcq_points": 10,
                "coding_points": 50,
                "debugging_points": 25,
                "technical_points": 15,
                "negative_penalty": 2.5,
            },
        },
        "company": {
            "title": "Company-Style Assessment Battle",
            "description": "Assessment tailored around publicly known industry hiring patterns and core competencies.",
            "battle_type": "company",
            "difficulty": "hard",
            "duration_minutes": 45,
            "question_count": 6,
            "negative_marking": False,
            "sections": [
                {
                    "title": "Domain & Fundamentals MCQs",
                    "question_type": "mcq",
                    "question_count": 4,
                    "weight": 0.3,
                    "duration_minutes": 15,
                    "negative_marking": False,
                },
                {
                    "title": "Engineering Coding Task",
                    "question_type": "coding",
                    "question_count": 1,
                    "weight": 0.5,
                    "duration_minutes": 20,
                    "negative_marking": False,
                },
                {
                    "title": "Debugging Challenge",
                    "question_type": "debugging",
                    "question_count": 1,
                    "weight": 0.2,
                    "duration_minutes": 10,
                    "negative_marking": False,
                },
            ],
            "allowed_languages": ["python", "javascript", "cpp", "java", "sql"],
            "scoring_rules": {
                "mcq_points": 15,
                "coding_points": 60,
                "debugging_points": 25,
                "negative_penalty": 0,
            },
        },
        "college": {
            "title": "College Placement Assessment",
            "description": "Standard institutional assessment for batch placement preparation.",
            "battle_type": "college",
            "difficulty": "medium",
            "duration_minutes": 45,
            "question_count": 7,
            "negative_marking": True,
            "sections": [
                {
                    "title": "CS Fundamentals & Aptitude",
                    "question_type": "mcq",
                    "question_count": 5,
                    "weight": 0.3,
                    "duration_minutes": 15,
                    "negative_marking": True,
                },
                {
                    "title": "Data Structures & Algorithms",
                    "question_type": "coding",
                    "question_count": 1,
                    "weight": 0.5,
                    "duration_minutes": 20,
                    "negative_marking": False,
                },
                {
                    "title": "Syntax & Logic Debugging",
                    "question_type": "debugging",
                    "question_count": 1,
                    "weight": 0.2,
                    "duration_minutes": 10,
                    "negative_marking": False,
                },
            ],
            "allowed_languages": ["python", "javascript", "cpp", "java"],
            "scoring_rules": {
                "mcq_points": 10,
                "coding_points": 50,
                "debugging_points": 20,
                "negative_penalty": 2.0,
            },
        },
        "tournament": {
            "title": "SkillBattle Championship Match",
            "description": "High stakes ranked tournament duel.",
            "battle_type": "tournament",
            "difficulty": "hard",
            "duration_minutes": 30,
            "question_count": 2,
            "negative_marking": False,
            "sections": [
                {
                    "title": "Tournament Speed Coding",
                    "question_type": "coding",
                    "question_count": 2,
                    "weight": 1.0,
                    "duration_minutes": 30,
                    "negative_marking": False,
                }
            ],
            "allowed_languages": ["python", "javascript", "cpp", "java"],
            "scoring_rules": {
                "coding_points": 100,
                "negative_penalty": 0,
            },
        },
        "practice": {
            "title": "Solo Skill Practice",
            "description": "Self-paced solo practice with MCQs and coding tasks.",
            "battle_type": "practice",
            "difficulty": "easy",
            "duration_minutes": 30,
            "question_count": 4,
            "negative_marking": False,
            "sections": [
                {
                    "title": "Knowledge Check MCQs",
                    "question_type": "mcq",
                    "question_count": 3,
                    "weight": 0.3,
                    "duration_minutes": 10,
                    "negative_marking": False,
                },
                {
                    "title": "Coding Practice",
                    "question_type": "coding",
                    "question_count": 1,
                    "weight": 0.7,
                    "duration_minutes": 20,
                    "negative_marking": False,
                },
            ],
            "allowed_languages": ["python", "javascript", "cpp", "java", "sql"],
            "scoring_rules": {
                "mcq_points": 10,
                "coding_points": 70,
                "negative_penalty": 0,
            },
        },
    }

    def get_template(self, battle_type: str, difficulty: str = "medium") -> Dict[str, Any]:
        bt = (battle_type or "general").lower()
        template = dict(self.DEFAULT_TEMPLATES.get(bt, self.DEFAULT_TEMPLATES["general"]))
        template["difficulty"] = difficulty
        return template

    async def create_config(self, db: AsyncSession, data: BattleConfigCreate) -> BattleConfig:
        sections_dict = [s.model_dump() for s in data.sections]
        config = BattleConfig(
            title=data.title,
            description=data.description,
            battle_type=data.battle_type.value,
            difficulty=data.difficulty,
            duration_minutes=data.duration_minutes,
            question_count=data.question_count,
            sections=sections_dict,
            allowed_languages=data.allowed_languages,
            scoring_rules=data.scoring_rules or {
                "mcq_points": 10,
                "coding_points": 50,
                "debugging_points": 25,
                "technical_points": 15,
                "negative_penalty": 2.5 if data.negative_marking else 0,
            },
            negative_marking=data.negative_marking,
            visibility=data.visibility,
            company_id=data.company_id,
            college_id=data.college_id,
        )
        db.add(config)
        await db.commit()
        await db.refresh(config)
        return config

    async def get_config(self, db: AsyncSession, config_id: str) -> BattleConfig | None:
        stmt = select(BattleConfig).where(BattleConfig.id == config_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_configs(self, db: AsyncSession, battle_type: str | None = None) -> List[BattleConfig]:
        stmt = select(BattleConfig).where(BattleConfig.is_active == True)
        if battle_type:
            stmt = stmt.where(BattleConfig.battle_type == battle_type.lower())
        stmt = stmt.order_by(BattleConfig.created_at.desc())
        result = await db.execute(stmt)
        return list(result.scalars().all())

    # Legacy helper compatibility
    def build_config(self, rating: int) -> Dict[str, Any]:
        if rating < 1200:
            diff = "Easy"
            prob_id = 1
        elif rating < 1700:
            diff = "Medium"
            prob_id = 2
        else:
            diff = "Hard"
            prob_id = 3

        return {
            "problem_id": prob_id,
            "difficulty": diff,
            "max_players": 2,
            "duration": 1800,
            "title": f"{diff} Ranked Battle",
        }


battle_config_service = BattleConfigService()