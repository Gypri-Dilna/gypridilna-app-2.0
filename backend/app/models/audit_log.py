from datetime import datetime, timezone
from sqlalchemy import String, Integer, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), index=True, nullable=False)
    event_type: Mapped[str] = mapped_column(String(100), index=True, nullable=False) # e.g. RFID_SCAN, REMOTE_UNLOCK, SERVICE_MODE, ITEM_CREATED, ITEM_UPDATED, CHIP_UPDATED, USER_PERMISSION_CHANGE
    actor_type: Mapped[str] = mapped_column(String(50), nullable=False) # ESP32_HARDWARE, USER, SYSTEM
    actor_id: Mapped[str | None] = mapped_column(String(100), nullable=True) # Chip ID or User ID
    actor_name: Mapped[str | None] = mapped_column(String(100), nullable=True) # User full name or Chip owner name
    result: Mapped[str] = mapped_column(String(50), nullable=False) # GRANTED, DENIED, SUCCESS, FAILED
    details: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(50), nullable=True)
