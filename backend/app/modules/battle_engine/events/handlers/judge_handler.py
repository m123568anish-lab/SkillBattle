import logging
from app.modules.battle_event import BattleEvent if False else object
from app.modules.battle_engine.events.event import BattleEvent

logger = logging.getLogger(__name__)


class JudgeHandler:

    async def handle(
        self,
        event: BattleEvent,
    ):
        logger.info("[Judge] Handling event: %s", event.name)


judge_handler = JudgeHandler()