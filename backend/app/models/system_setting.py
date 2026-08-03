from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class SystemSetting(Base):
    __tablename__ = "system_settings"

    key: Mapped[str] = mapped_column(String(100), primary_key=True, index=True)
    value: Mapped[str | None] = mapped_column(Text, nullable=True)
