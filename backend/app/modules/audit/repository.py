from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.audit.model import AuditLog


class AuditRepository:

    async def create(

        self,

        db: AsyncSession,

        log: AuditLog,

    ):

        db.add(log)

        await db.flush()

        await db.refresh(log)

        return log

    async def list(

        self,

        db: AsyncSession,

        limit: int = 100,

    ):

        result = await db.execute(

            select(AuditLog)

            .order_by(

                AuditLog.created_at.desc()

            )

            .limit(limit)

        )

        return result.scalars().all()

    async def commit(

        self,

        db: AsyncSession,

    ):

        await db.commit()


audit_repository = AuditRepository()