from dataclasses import dataclass


@dataclass
class Cursor:

    user_id: str

    line: int = 1

    column: int = 1