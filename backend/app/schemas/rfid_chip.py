from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ChipBase(BaseModel):
    chip_id: str
    name: str
    is_allowed: bool = True
    is_one_time: bool = False
    valid_until: Optional[datetime] = None

class ChipCreate(ChipBase):
    pass

class ChipUpdate(BaseModel):
    chip_id: Optional[str] = None
    name: Optional[str] = None
    is_allowed: Optional[bool] = None
    is_one_time: Optional[bool] = None
    valid_until: Optional[datetime] = None

class ChipResponse(ChipBase):
    id: int

    class Config:
        from_attributes = True
