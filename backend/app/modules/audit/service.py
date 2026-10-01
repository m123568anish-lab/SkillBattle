from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.audit.model import AuditLog
from app.modules.audit.repository import audit_repository


class AuditService:

    _sensitive_key_fragments = ("password", "token", "secret", "api_key", "credential")

    @classmethod
    def _safe_metadata(cls, metadata: dict[str, Any] | None) -> dict[str, Any]:
        def sanitize(value: Any) -> Any:
            if isinstance(value, dict):
                return {
                    key: sanitize(item)
                    for key, item in value.items()
                    if not any(
                        fragment in str(key).lower()
                        for fragment in cls._sensitive_key_fragments
                    )
                }
            if isinstance(value, (list, tuple)):
                return [sanitize(item) for item in value]
            return value

        return sanitize(metadata or {})

    def enqueue(
        self,
        db: AsyncSession,
        action: str,
        module: str,
        user_id: str | None = None,
        organization_type: str | None = None,
        organization_id: str | int | None = None,
        entity_type: str | None = None,
        entity_id: str | int | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> AuditLog:
        record = AuditLog(
            user_id=user_id,
            action=action,
            module=module,
            organization_type=organization_type,
            organization_id=str(organization_id) if organization_id is not None else None,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id is not None else None,
            metadata_json=self._safe_metadata(metadata),
        )
        db.add(record)
        return record

    async def log(

        self,

        db: AsyncSession,

        action: str,

        module: str,

        user_id: str | None = None,

        ip: str | None = None,

        user_agent: str | None = None,

        organization_type: str | None = None,

        organization_id: str | int | None = None,

        entity_type: str | None = None,

        entity_id: str | int | None = None,

        metadata: dict[str, Any] | None = None,

    ):
        record = self.enqueue(
            db,
            action,
            module,
            user_id=user_id,
            organization_type=organization_type,
            organization_id=organization_id,
            entity_type=entity_type,
            entity_id=entity_id,
            metadata=metadata,
        )
        record.ip_address = ip
        record.user_agent = user_agent
        await db.flush()
        await db.refresh(record)
        await audit_repository.commit(db)
        return record


audit_service = AuditService()