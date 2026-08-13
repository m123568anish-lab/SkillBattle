from dataclasses import dataclass, field

from app.modules.battle_engine.models.player import Player
from app.modules.battle_engine.state.battle_state import BattleState


@dataclass
class BattleRoom:

    id: str

    players: dict[str, Player] = field(default_factory=dict)

    state: BattleState = BattleState.WAITING

    duration: int = 900

    remaining_time: int = 900

    problem_id: str | None = None

    winner_id: str | None = None

    spectators: set[str] = field(default_factory=set)