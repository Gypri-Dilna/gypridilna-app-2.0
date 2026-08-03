from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class MapZone(Base):
    __tablename__ = "map_zones"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    zone_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False) # e.g. RACK-6
    rack_number: Mapped[int] = mapped_column(Integer, unique=True, index=True, nullable=False) # e.g. 6
    display_name: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. Rack 6 - Screwdrivers & Hand Tools
    grid_x: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    grid_y: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    width: Mapped[int] = mapped_column(Integer, nullable=False, default=100)
    height: Mapped[int] = mapped_column(Integer, nullable=False, default=100)
    color_hex: Mapped[str] = mapped_column(String(10), default="#3AA69A", nullable=False)
    zone_type: Mapped[str] = mapped_column(String(50), default="RACK", nullable=False) # RACK, WORKBENCH, STORAGE, CHEMICAL
