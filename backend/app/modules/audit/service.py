from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.audit.model import AuditLog

from app.modules.audit.repository import (
    audit_repository,
)


class AuditService:

    async def log(

        self,

        db: AsyncSession,

        action: str,

        module: str,

        user_id: str | None = None,

        ip: str | None = None,

        user_agent: str | None = None,

    ):

        record = AuditLog(

            user_id=user_id,

            action=action,

            module=module,

            ip_address=ip,

            user_agent=user_agent,

        )

        await audit_repository.create(

            db,

            record,

        )

        await audit_repository.commit(

            db,

        )

        return record


audit_service = AuditService()