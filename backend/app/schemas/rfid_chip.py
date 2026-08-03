from datetime import datetime
from pydantic import BaseModel

class ChipCheckRequest(BaseModel):
    chip_id: str

class ChipCreate(BaseModel):
    chip_id: str
    name: str
    is_allowed: bool = True
    is_one_time: bool = False
    valid_until: datetime | None = None
    user_id: int | None = None

class ChipUpdate(BaseModel):
    name: str | None = None
    chip_id: str | None = None
    is_allowed: bool | None = None
    is_one_time: bool | None = None
    valid_until: datetime | None = None
    user_id: int | None = None

class ChipOut(BaseModel):
    id: int
    chip_id: str
    name: str
    is_allowed: bool
    is_one_time: bool
    valid_until: datetime | None = None
    user_id: int | None = None
    created_at: datetime

    class Config:
        from_attributes = True
