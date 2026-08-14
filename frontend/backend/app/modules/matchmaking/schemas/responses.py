from pydantic import BaseModel


class QueueStatusResponse(BaseModel):

    in_queue: bool

    position: int

    estimated_wait: int