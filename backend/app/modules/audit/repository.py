from __future__ import annotations

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

    async def list_for_user(
        self,
        db: AsyncSession,
        user_id: str,
        limit: int = 50,
    ) -> list[AuditLog]:
        result = await db.execute(
            select(AuditLog)
            .where(AuditLog.user_id == user_id)
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def list_for_organization(
        self,
        db: AsyncSession,
        organization_type: str,
        organization_id: str | int,
        limit: int = 100,
    ) -> list[AuditLog]:
        result = await db.execute(
            select(AuditLog)
            .where(
                AuditLog.organization_type == organization_type,
                AuditLog.organization_id == str(organization_id),
            )
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def commit(

        self,

        db: AsyncSession,

    ):

        await db.commit()


audit_repository = AuditRepository()