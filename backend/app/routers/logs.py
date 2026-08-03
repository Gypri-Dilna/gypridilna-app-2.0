from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogOut

router = APIRouter(prefix="/api", tags=["Access & Audit Logs"])

@router.get("/logs", response_model=list[AuditLogOut])
async def get_logs(
    limit: int = Query(100, ge=1, le=1000),
    event_type: str | None = Query(None),
    actor_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AuditLog)
    if event_type:
        stmt = stmt.where(AuditLog.event_type == event_type)
    if actor_id:
        stmt = stmt.where(AuditLog.actor_id == actor_id)

    stmt = stmt.order_by(AuditLog.timestamp.desc()).limit(limit)
    res = await db.execute(stmt)
    return res.scalars().all()
