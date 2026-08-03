import re
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from app.database import get_db
from app.models.inventory import InventoryItem
from app.models.audit_log import SystemAuditLog
from app.schemas.inventory import (
    InventoryItemCreate, 
    InventoryItemUpdate, 
    InventoryItemResponse
)

router = APIRouter(prefix="/api/inventory", tags=["Inventory System"])

def auto_sequence_location_code(location_code: str, db: Session) -> str:
    if not location_code:
        return "11-0001"
        
    clean_code = location_code.strip()
    match = re.match(r"^(\d)(\d)-(\d)(\d{3})$", clean_code)
    if not match:
        return clean_code

    rack, sector, box, item_id = match.groups()
    prefix = f"{rack}{sector}-{box}"

    existing_items = db.query(InventoryItem.location_code).filter(
        InventoryItem.location_code.like(f"{prefix}%")
    ).all()

    existing_codes = {item[0] for item in existing_items if item[0]}
    
    if clean_code in existing_codes or item_id == "000":
        max_seq = 0
        for code in existing_codes:
            m = re.match(r"^\d\d-\d(\d{3})$", code)
            if m:
                try:
                    seq = int(m.group(1))
                    if seq > max_seq:
                        max_seq = seq
                except ValueError:
                    pass
        next_seq = max_seq + 1
        return f"{prefix}{next_seq:03d}"

    return clean_code

@router.get("", response_model=List[InventoryItemResponse])
def get_inventory(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    zone: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(InventoryItem)

    if search:
        s = f"%{search}%"
        query = query.filter(
            (InventoryItem.title.ilike(s)) | 
            (InventoryItem.location_code.ilike(s)) | 
            (InventoryItem.qr_code.ilike(s)) |
            (InventoryItem.notes.ilike(s))
        )
    
    if category:
        query = query.filter(InventoryItem.category == category)
        
    if zone:
        query = query.filter(InventoryItem.zone == zone)

    return query.order_by(InventoryItem.title).all()

@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(InventoryItem.category).distinct().all()
    return [c[0] for c in categories if c[0]]

@router.get("/zones")
def get_zones(db: Session = Depends(get_db)):
    zones = db.query(InventoryItem.zone).distinct().all()
    return [z[0] for z[0] in zones if z[0]]

@router.get("/lookup/{qr_code}", response_model=InventoryItemResponse)
def lookup_by_qr(qr_code: str, db: Session = Depends(get_db)):
    item = db.query(InventoryItem).filter(InventoryItem.qr_code == qr_code).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item with this QR Code / SKU not found")
    return item

@router.post("", response_model=InventoryItemResponse, status_code=status.HTTP_201_CREATED)
def create_inventory_item(item_in: InventoryItemCreate, db: Session = Depends(get_db)):
    item_data = item_in.model_dump()

    # Auto-assign sequential AAA location code based on order of registration at location XY-Z
    final_location_code = auto_sequence_location_code(item_data["location_code"], db)
    item_data["location_code"] = final_location_code
    
    # QR Code is generated directly from the actual location ID (e.g. 12-0001)
    item_data["qr_code"] = final_location_code

    new_item = InventoryItem(**item_data)
    db.add(new_item)
    
    # Audit Log
    audit = SystemAuditLog(
        action="ITEM_CREATED",
        performed_by="System User",
        details=f"Added '{new_item.title}' at {new_item.location_code}"
    )
    db.add(audit)
    
    db.commit()
    db.refresh(new_item)
    return new_item

@router.put("/{item_id}", response_model=InventoryItemResponse)
def update_inventory_item(item_id: int, item_in: InventoryItemUpdate, db: Session = Depends(get_db)):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    update_data = item_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)
        
    item.last_updated = datetime.now(timezone.utc)
    
    audit = SystemAuditLog(
        action="ITEM_UPDATED",
        performed_by="System User",
        details=f"Updated item #{item.id} '{item.title}'"
    )
    db.add(audit)

    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}")
def delete_inventory_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    audit = SystemAuditLog(
        action="ITEM_DELETED",
        performed_by="System User",
        details=f"Deleted '{item.title}' (#{item.id})"
    )
    db.add(audit)

    db.delete(item)
    db.commit()
    return {"message": "Inventory item deleted"}
