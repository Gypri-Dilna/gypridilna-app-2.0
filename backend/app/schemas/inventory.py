from datetime import datetime
from pydantic import BaseModel

class InventoryCreate(BaseModel):
    name: str
    rack: int
    pozice: int
    box: int = 0
    category: str | None = None
    note: str | None = None
    barcode: str | None = None
    photo_url: str | None = None

class InventoryUpdate(BaseModel):
    name: str | None = None
    rack: int | None = None
    pozice: int | None = None
    box: int | None = None
    category: str | None = None
    note: str | None = None
    barcode: str | None = None
    photo_url: str | None = None

class InventoryOut(BaseModel):
    id: str
    item_code: str # e.g. 61-0001
    name: str
    rack: int
    pozice: int
    box: int
    number: int
    category: str | None = None
    note: str | None = None
    barcode: str | None = None
    photo_url: str | None = None
    created_by_user_id: int | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
