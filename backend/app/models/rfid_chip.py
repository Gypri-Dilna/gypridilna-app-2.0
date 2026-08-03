from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.database import Base

class Chip(Base):
    __tablename__ = "chips"

    id = Column(Integer, primary_key=True, index=True)
    chip_id = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    is_allowed = Column(Boolean, default=True)
    is_one_time = Column(Boolean, default=False)
    valid_until = Column(DateTime, nullable=True)
