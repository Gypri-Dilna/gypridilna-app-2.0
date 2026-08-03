from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class RfidChip(Base):
    __tablename__ = "rfid_chips"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    chip_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    user_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_allowed: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_one_time: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    valid_until: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", backref="rfid_chips")
