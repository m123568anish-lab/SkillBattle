from app.modules.battle_engine.synchronization.models.document import (
    Document,
)


class DocumentManager:

    def __init__(self):

        self.documents = {}

    def create(

        self,

        room_id,

        language,

    ):

        document = Document(

            room_id=room_id,

            language=language,

        )

        self.documents[room_id] = document

        return document

    def get(

        self,

        room_id,

    ):

        return self.documents.get(room_id)

    def update(

        self,

        room_id,

        source_code,

    ):

        document = self.documents[room_id]

        document.source_code = source_code

        document.version += 1

        return document


document_manager = DocumentManager()