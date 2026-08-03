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

@router.get("", response_model=List[InventoryItemResponse])
def get_inventory(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    zone: Optional[str] = Query(None),
    low_stock_only: bool = Query(False),
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

    if low_stock_only:
        query = query.filter(InventoryItem.quantity <= InventoryItem.min_quantity)

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
    existing = db.query(InventoryItem).filter(InventoryItem.qr_code == item_in.qr_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Item with this QR Code / SKU already exists")

    new_item = InventoryItem(**item_in.model_dump())
    db.add(new_item)
    
    # Audit Log
    audit = SystemAuditLog(
        action="ITEM_CREATED",
        performed_by="System User",
        details=f"Added '{new_item.title}' ({new_item.quantity} {new_item.unit}) at {new_item.location_code}"
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

@router.post("/{item_id}/adjust-stock")
def adjust_stock(item_id: int, delta: int = Query(...), performed_by: str = Query("Workshop Staff"), db: Session = Depends(get_db)):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    new_qty = item.quantity + delta
    if new_qty < 0:
        raise HTTPException(status_code=400, detail="Stock quantity cannot be negative")

    item.quantity = new_qty
    item.last_updated = datetime.now(timezone.utc)

    action_type = "STOCK_CHECKOUT" if delta < 0 else "STOCK_CHECKIN"
    audit = SystemAuditLog(
        action=action_type,
        performed_by=performed_by,
        details=f"Adjusted stock for '{item.title}' by {delta:+d} (New Total: {item.quantity})"
    )
    db.add(audit)

    db.commit()
    return {"message": "Stock adjusted", "new_quantity": item.quantity}

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
