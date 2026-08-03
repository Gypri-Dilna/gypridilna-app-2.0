from datetime import datetime
from pydantic import BaseModel

class AuditLogOut(BaseModel):
    id: int
    timestamp: datetime
    event_type: str
    actor_type: str
    actor_id: str | None = None
    actor_name: str | None = None
    result: str
    details: dict | list | None = None
    ip_address: str | None = None

    class Config:
        from_attributes = True
