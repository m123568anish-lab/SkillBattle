import logging
from app.modules.battle_engine.events.event import BattleEvent

logger = logging.getLogger(__name__)


class ScoreboardHandler:

    async def handle(
        self,
        event: BattleEvent,
    ):
        logger.info("[Scoreboard] Handling event: %s", event.name)


scoreboard_handler = ScoreboardHandler()