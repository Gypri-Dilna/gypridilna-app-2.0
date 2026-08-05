from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class InventoryItemBase(BaseModel):
    title: str = Field(..., max_length=30, description="Title limited to 30 characters")
    category: str = Field(..., max_length=22, description="Category limited to 22 characters")
    quantity: int = 1
    unit: str = "pcs"
    min_quantity: int = 1
    location_code: str
    location_x: float = 50.0
    location_y: float = 50.0
    zone: str = "General Storage"
    qr_code: str
    notes: Optional[str] = None

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItemUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=30)
    category: Optional[str] = Field(None, max_length=22)
    quantity: Optional[int] = None
    unit: Optional[str] = None
    min_quantity: Optional[int] = None
    location_code: Optional[str] = None
    location_x: Optional[float] = None
    location_y: Optional[float] = None
    zone: Optional[str] = None
    qr_code: Optional[str] = None
    notes: Optional[str] = None

class InventoryItemResponse(InventoryItemBase):
    id: int
    last_updated: Optional[datetime] = None

    class Config:
        from_attributes = True
