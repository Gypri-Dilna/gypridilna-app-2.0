from sqlalchemy import Column, Integer, String, Boolean, Text
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(200), unique=True, nullable=True, index=True)
    password_hash = Column(String(200), nullable=False)
    is_admin = Column(Boolean, default=False)
    # Permissions stored as JSON string:
    # {"service_mode": bool, "add_chips": bool, "view_logs": bool, "remote_opening": bool, "erase_logs": bool, "inventory_edit": bool}
    permissions = Column(Text, nullable=False, default="{}")
    chip_id = Column(String(100), nullable=True)
