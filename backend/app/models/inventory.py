import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    item_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False) # e.g. 61-0001
    name: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    
    # Location fields adhering to XY-ZAAA scheme
    rack: Mapped[int] = mapped_column(Integer, nullable=False) # X
    pozice: Mapped[int] = mapped_column(Integer, nullable=False) # Y
    box: Mapped[int] = mapped_column(Integer, default=0, nullable=False) # Z (0 if no box)
    number: Mapped[int] = mapped_column(Integer, nullable=False) # AAA (Item index)
    
    # Optional category and notes
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    barcode: Mapped[str | None] = mapped_column(String(100), nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    created_by_user_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    created_by_user = relationship("User", backref="created_inventory_items")
