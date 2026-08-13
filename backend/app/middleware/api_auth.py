from fastapi import (
    Depends,
    Header,
    HTTPException,
)

from sqlalchemy.orm import Session

from app.database.database import get_db

from app.modules.developer.repository import (
    developer_repository,
)
from app.core.redis.rate_limiter import (
    rate_limiter,
)

async def verify_api_key(

    x_api_key: str = Header(...),

    db: Session = Depends(get_db),

):

    key = developer_repository.get_api_key(

        db,

        x_api_key,

    )

    if key is None:

        raise HTTPException(

            status_code=401,

            detail="Invalid API Key",

        )

    allowed = await rate_limiter.allow(
        key.api_key,
        120,
        60,
    )

    if not allowed:

        raise HTTPException(

            status_code=429,

            detail="Rate limit exceeded",

        )

    return key
def verify_scope(
    key,
    required,
):

    levels = {
        "read": 1,
        "write": 2,
        "admin": 3,
    }

    return levels[key.scope] >= levels[required]