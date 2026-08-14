from dataclasses import dataclass


@dataclass
class Document:

    room_id: str

    language: str

    source_code: str = ""

    version: int = 1