from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime, timezone
from app.database import Base

class AccessLog(Base):
    __tablename__ = "access_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    chip_id = Column(String(100), nullable=False)
    name = Column(String(100), nullable=False)
    result = Column(String(50), nullable=False)

class SystemAuditLog(Base):
    __tablename__ = "system_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    action = Column(String(100), nullable=False) # e.g. INVENTORY_CHECKOUT, ITEM_ADDED, PERMISSION_CHANGE
    performed_by = Column(String(100), nullable=False)
    details = Column(String(500), nullable=True)
