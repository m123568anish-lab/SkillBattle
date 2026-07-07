from sqlalchemy.orm import Session

from app.models.user import User
from app.modules.battle.matchmaking import (
    matchmaking_engine,
)
from app.models.battle import (
    BattleRoom,
    BattleParticipant,
)
from app.modules.battle.config import (
    battle_config_service,
)
from app.modules.battle.repository import (
    battle_repository,
)

from app.modules.battle.schemas import (
    CreateBattleRequest,
)
import asyncio

from app.modules.battle.orchestrator import (
    battle_orchestrator,
)
class BattleService:

    # ==========================================================
    # Create Battle
    # ==========================================================

    def create_battle(
        self,
        db: Session,
        current_user: User,
        request: CreateBattleRequest,
    ):

        battle = BattleRoom(

            title=request.title,

            difficulty=request.difficulty,

            problem_id=request.problem_id,

            max_players=request.max_players,

            status="waiting",

        )

        battle_repository.create_battle(
            db,
            battle,
        )

        participant = BattleParticipant(

            battle_id=battle.id,

            user_id=current_user.id,

            score=0,

            rank=1,

        )

        battle_repository.add_participant(
            db,
            participant,
        )

        battle_repository.commit(db)

        battle_repository.refresh(
            db,
            battle,
        )

        return battle

    # ==========================================================
    # Join Battle
    # ==========================================================

    def join_battle(
        self,
        db: Session,
        battle_id: str,
        current_user: User,
    ):

        battle = battle_repository.get_battle(
            db,
            battle_id,
        )

        if battle is None:

            raise ValueError(
                "Battle not found."
            )

        participant = battle_repository.get_participant(

            db,

            battle_id,

            current_user.id,

        )

        if participant:

            return battle

        players = battle_repository.get_participants(

            db,

            battle_id,

        )

        if len(players) >= battle.max_players:

            raise ValueError(
                "Battle is already full."
            )

        participant = BattleParticipant(

            battle_id=battle.id,

            user_id=current_user.id,

            score=0,

            rank=0,

        )

        battle_repository.add_participant(

            db,

            participant,

        )

        players = battle_repository.get_participants(

            db,

            battle.id,

        )

        if len(players) == battle.max_players:

            battle.status = "running"

            battle_repository.update_battle(

                db,

                battle,

            )

        battle_repository.commit(db)

        return battle

    # ==========================================================
    # Leave Battle
    # ==========================================================

    def leave_battle(

        self,

        db: Session,

        battle_id: str,

        current_user: User,

    ):

        participant = battle_repository.get_participant(

            db,

            battle_id,

            current_user.id,

        )

        if participant is None:

            return

        battle_repository.remove_participant(

            db,

            participant,

        )

        battle_repository.commit(db)

    # ==========================================================
    # Waiting Battles
    # ==========================================================

    def waiting_battles(

        self,

        db: Session,

    ):

        return battle_repository.get_waiting_battles(db)

    # ==========================================================
    # Battle Details
    # ==========================================================

    def get_battle(

        self,

        db: Session,

        battle_id: str,

    ):

        return battle_repository.get_battle(

            db,

            battle_id,

        )

    # ==========================================================
    # Participants
    # ==========================================================

    def participants(

        self,

        db: Session,

        battle_id: str,

    ):

        return battle_repository.get_participants(

            db,

            battle_id,

        )
    # ==========================================================
# Join Matchmaking Queue
# ==========================================================

def join_queue(
    self,
    db: Session,
    current_user: User,
):

    match = matchmaking_engine.join_queue(
        user_id=current_user.id,
    )

    players = matchmaking_engine.find_match()

    if players is None:

        return {

            "status": "waiting",

            "queue_size": match["queue_size"],

        }

    config = battle_config_service.build_config(
    rating=players["player1"].rating,
)

    battle = BattleRoom(

    title=config["title"],

    difficulty=config["difficulty"],

    problem_id=config["problem_id"],

    status="running",

    max_players=config["max_players"],

)

    battle_repository.create_battle(
        db,
        battle,
    )

    battle_repository.add_participant(

        db,

        BattleParticipant(

            battle_id=battle.id,

            user_id=players["player1"].user_id,

        ),

    )

    battle_repository.add_participant(

        db,

        BattleParticipant(

            battle_id=battle.id,

            user_id=players["player2"].user_id,

        ),

    )

    asyncio.create_task(

    battle_orchestrator.start_battle(

        battle.id,

        config["duration"],

    )

)

    battle_repository.refresh(
        db,
        battle,
    )

    return {

        "status": "matched",

        "battle_id": battle.id,

    }
# ==========================================================
# Leave Queue
# ==========================================================

def leave_queue(

    self,

    current_user: User,

):

    matchmaking_engine.leave_queue(

        current_user.id,

    )

    return {

        "message": "Removed from queue."

    }

# ==========================================================
# Create System Battle
# ==========================================================

def create_system_battle(
    self,
    db: Session,
    title: str,
    difficulty: str,
    problem_id: int,
    player_one_id: str,
    player_two_id: str,
):

    battle = BattleRoom(

        title=title,

        difficulty=difficulty,

        problem_id=problem_id,

        status="running",

        max_players=2,

    )

    battle_repository.create_battle(
        db,
        battle,
    )

    player_one = BattleParticipant(

        battle_id=battle.id,

        user_id=player_one_id,

        score=0,

        rank=1,

    )

    player_two = BattleParticipant(

        battle_id=battle.id,

        user_id=player_two_id,

        score=0,

        rank=2,

    )

    battle_repository.add_participant(
        db,
        player_one,
    )

    battle_repository.add_participant(
        db,
        player_two,
    )

    battle_repository.commit(db)

    battle_repository.refresh(
        db,
        battle,
    )

    config = battle_config_service.build_config(
    rating=1200,
)

    import asyncio

    asyncio.create_task(

    battle_orchestrator.start_battle(

        db,

        battle.id,

        config["duration"],

    )

)

    return battle
battle_service = BattleService()