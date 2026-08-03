from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from datetime import datetime, timezone
from app.database import Base

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True) # e.g. Power Tools, Hand Tools, Consumables, Electronics
    quantity = Column(Integer, default=1, nullable=False)
    unit = Column(String(50), default="pcs", nullable=False) # pcs, kg, meters, rolls, etc.
    min_quantity = Column(Integer, default=1, nullable=False)
    location_code = Column(String(100), nullable=False, default="A1-01") # e.g. A1-Rack-02, B3-Shelf-04
    location_x = Column(Float, default=50.0) # Percentage 0-100% on minimap
    location_y = Column(Float, default=50.0) # Percentage 0-100% on minimap
    zone = Column(String(100), default="General Storage") # e.g. Woodworking, Electronics Bench, Metal Rack
    qr_code = Column(String(100), unique=True, nullable=False, index=True) # Unique SKU or barcode
    notes = Column(Text, nullable=True)
    last_updated = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
