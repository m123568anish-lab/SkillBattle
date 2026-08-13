from pydantic import BaseModel


class JoinQueueRequest(BaseModel):

    mode: str

    rating: int