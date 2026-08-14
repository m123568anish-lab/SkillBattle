from app.modules.battle_engine.managers.connection_manager import (
    connection_manager,
)

from .document_manager import (
    document_manager,
)


class SyncService:

    async def synchronize(

        self,

        room_id,

        source_code,

    ):

        document = document_manager.update(

            room_id,

            source_code,

        )

        await connection_manager.broadcast(

            room_id,

            {

                "event": "code_sync",

                "version": document.version,

                "source_code": document.source_code,

            },

        )


sync_service = SyncService()