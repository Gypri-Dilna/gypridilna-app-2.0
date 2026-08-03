from sqlalchemy import Column, Integer, String, Float
from app.database import Base

class MapZone(Base):
    __tablename__ = "map_zones"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False) # e.g. Zone A - CNC & Woodworking
    code = Column(String(50), nullable=False, unique=True) # ZONE_A
    color = Column(String(50), default="#00F0FF") # Accent hex color
    x = Column(Float, nullable=False) # Top left X %
    y = Column(Float, nullable=False) # Top left Y %
    width = Column(Float, nullable=False) # Width %
    height = Column(Float, nullable=False) # Height %
    description = Column(String(200), nullable=True)
