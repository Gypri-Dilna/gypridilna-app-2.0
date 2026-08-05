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

    used_ids = set()
    for item in existing_items:
        if item[0]:
            m = re.match(r"^\d\d-\d(\d{3})$", item[0])
            if m:
                try:
                    used_ids.add(int(m.group(1)))
                except ValueError:
                    pass

    # Find the smallest positive integer missing from used_ids (fills deleted gaps)
    next_seq = 1
    while next_seq in used_ids:
        next_seq += 1

    return f"{prefix}{next_seq:03d}"

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

@router.delete("/categories/{category_name}")
def delete_category(category_name: str, db: Session = Depends(get_db)):
    clean_cat = category_name.strip()
    if clean_cat.lower() in ["general", "all", "všechny"]:
        raise HTTPException(status_code=400, detail="Nelze smazat výchozí systémovou kategorii.")
    
    updated_count = db.query(InventoryItem).filter(
        InventoryItem.category == clean_cat
    ).update({"category": "General"}, synchronize_session=False)
    
    audit = SystemAuditLog(
        action="CATEGORY_DELETED",
        performed_by="System User",
        details=f"Deleted category '{clean_cat}', reassigned {updated_count} items to 'General'"
    )
    db.add(audit)
    db.commit()
    return {"status": "success", "message": f"Kategorie '{clean_cat}' byla smazána. {updated_count} položek bylo přesunuto do 'General'."}

@router.get("/zones")
def get_zones(db: Session = Depends(get_db)):
    zones = db.query(InventoryItem.zone).distinct().all()
    return [z[0] for z[0] in zones if z[0]]

@router.get("/lookup/{qr_code}", response_model=InventoryItemResponse)
def lookup_by_qr(qr_code: str, db: Session = Depends(get_db)):
    clean_code = qr_code.strip()
    item = db.query(InventoryItem).filter(
        (InventoryItem.qr_code.ilike(clean_code)) | 
        (InventoryItem.location_code.ilike(clean_code))
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item with this QR Code or Location ID not found")
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

@router.delete("/categories/{category_name}")
def delete_category(category_name: str, db: Session = Depends(get_db)):
    clean_cat = category_name.strip()
    if not clean_cat or clean_cat.lower() == "general":
        raise HTTPException(status_code=400, detail="Cannot delete default system category 'General'.")

    # Find all items assigned to this category and move them to General
    items_to_update = db.query(InventoryItem).filter(InventoryItem.category == clean_cat).all()
    count = len(items_to_update)
    
    for item in items_to_update:
        item.category = "General"
        item.last_updated = datetime.now(timezone.utc)

    audit = SystemAuditLog(
        action="CATEGORY_DELETED",
        performed_by="System User",
        details=f"Deleted category '{clean_cat}' ({count} items reassigned to 'General')"
    )
    db.add(audit)

    db.commit()
    return {"message": f"Kategorie '{clean_cat}' byla smazána ({count} položek přesunuto do General)."}

import urllib.request
import json
import os

PRINTER_AGENT_URL = os.getenv("PRINTER_AGENT_URL", "http://127.0.0.1:5001/print-label")

@router.post("/{item_id}/print-label")
def print_inventory_label(
    item_id: int, 
    tape_size: str = Query("18mm", regex="^(18mm|9mm)$"),
    db: Session = Depends(get_db)
):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    payload = {
        "title": item.title,
        "location_code": item.location_code,
        "qr_code": item.qr_code or item.location_code,
        "category": item.category or "General",
        "tape_size": tape_size
    }

    try:
        req = urllib.request.Request(
            PRINTER_AGENT_URL,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=8) as response:
            res_body = response.read().decode('utf-8')
            res_json = json.loads(res_body)
            if response.status == 200 and res_json.get("success"):
                return {"status": "success", "message": res_json.get("message")}
            else:
                raise HTTPException(
                    status_code=400, 
                    detail=res_json.get("message", "b-PAC Printer Agent reported an error.")
                )
    except urllib.error.HTTPError as e:
        try:
            err_body = e.read().decode('utf-8')
            err_json = json.loads(err_body)
            msg = err_json.get("message") or err_json.get("detail") or str(e)
        except Exception:
            msg = f"Print Agent HTTP {e.code}: {str(e)}"
        raise HTTPException(status_code=400, detail=msg)
    except urllib.error.URLError as e:
        raise HTTPException(
            status_code=503, 
            detail=f"Printer Workstation (PC B) b-PAC Agent unreachable at {PRINTER_AGENT_URL}. Ensure print_agent.py is running on PC B."
        )
    except Exception as ex:
        raise HTTPException(status_code=500, detail=f"Print error: {str(ex)}")

PRINTER_QUEUE_URL = os.getenv("PRINTER_QUEUE_URL", "http://127.0.0.1:5001/print-queue")

@router.post("/print-queue")
def print_inventory_queue(
    payload: dict,
    db: Session = Depends(get_db)
):
    items = payload.get("items", [])
    if not items:
        raise HTTPException(status_code=400, detail="Tisková fronta je prázdná.")

    try:
        req = urllib.request.Request(
            PRINTER_QUEUE_URL,
            data=json.dumps({"items": items}).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=15) as response:
            res_body = response.read().decode('utf-8')
            res_json = json.loads(res_body)
            if response.status == 200 and res_json.get("success"):
                return {"status": "success", "message": res_json.get("message")}
            else:
                raise HTTPException(
                    status_code=400, 
                    detail=res_json.get("message", "Chyba dávkového tisku b-PAC.")
                )
    except urllib.error.HTTPError as e:
        try:
            err_body = e.read().decode('utf-8')
            err_json = json.loads(err_body)
            msg = err_json.get("message") or err_json.get("detail") or str(e)
        except Exception:
            msg = f"Print Agent HTTP {e.code}: {str(e)}"
        raise HTTPException(status_code=400, detail=msg)
    except urllib.error.URLError as e:
        raise HTTPException(
            status_code=503, 
            detail=f"Tiskový server b-PAC není dostupný na {PRINTER_QUEUE_URL}. Zkontrolujte, že běží print_agent.py na PC s tiskárnou."
        )
    except Exception as ex:
        raise HTTPException(status_code=500, detail=f"Chyba tisku fronty: {str(ex)}")

# Session-based remote scan state for PC <-> Mobile pairing
paired_sessions = {}

@router.post("/remote-scan")
def broadcast_remote_scan(payload: dict):
    session_id = payload.get("session_id", "default")
    qr_code = payload.get("qr_code", "").strip()
    if qr_code:
        paired_sessions[session_id] = {
            "qr_code": qr_code,
            "timestamp": datetime.now(timezone.utc).timestamp()
        }
        return {"status": "broadcasted", "session_id": session_id, "qr_code": qr_code}
    raise HTTPException(status_code=400, detail="Missing qr_code payload")

@router.get("/remote-scan/latest")
def get_latest_remote_scan(session_id: str = "default", since: float = 0.0):
    session_data = paired_sessions.get(session_id, {"qr_code": None, "timestamp": 0.0})
    if session_data["timestamp"] > since:
        return session_data
    return {"qr_code": None, "timestamp": session_data["timestamp"]}



