import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from fastapi.responses import Response
from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.inventory import InventoryItem
from app.models.audit_log import AuditLog
from app.schemas.inventory import InventoryCreate, InventoryUpdate, InventoryOut
from app.core.location_parser import format_item_code, parse_item_code
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api", tags=["Inventory System"])

@router.get("/inventory", response_model=list[InventoryOut])
async def list_inventory(
    search: str | None = Query(None, description="Search term for name or item_code"),
    rack: int | None = Query(None, description="Filter by Rack number"),
    category: str | None = Query(None, description="Filter by Category"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(InventoryItem)
    if search:
        search_term = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                InventoryItem.name.ilike(search_term),
                InventoryItem.item_code.ilike(search_term),
                InventoryItem.category.ilike(search_term),
                InventoryItem.note.ilike(search_term)
            )
        )
    if rack is not None:
        stmt = stmt.where(InventoryItem.rack == rack)
    if category is not None and category.strip():
        stmt = stmt.where(InventoryItem.category.ilike(f"%{category.strip()}%"))

    stmt = stmt.order_by(InventoryItem.rack, InventoryItem.pozice, InventoryItem.number).offset(offset).limit(limit)
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/inventory/{item_id_or_code}", response_model=InventoryOut)
async def get_inventory_item(item_id_or_code: str, db: AsyncSession = Depends(get_db)):
    code_clean = item_id_or_code.strip()
    stmt = select(InventoryItem).where(
        or_(
            InventoryItem.id == code_clean,
            InventoryItem.item_code == code_clean,
            InventoryItem.barcode == code_clean
        )
    )
    res = await db.execute(stmt)
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail=f"Inventory item '{item_id_or_code}' not found")
    return item

@router.post("/inventory", response_model=InventoryOut, status_code=201)
async def create_inventory_item(
    body: InventoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    box_num = body.box if body.box is not None else 0
    
    # Auto calculate next item number for this rack, pozice, box location
    count_stmt = select(func.max(InventoryItem.number)).where(
        InventoryItem.rack == body.rack,
        InventoryItem.pozice == body.pozice,
        InventoryItem.box == box_num
    )
    max_num_res = await db.execute(count_stmt)
    max_num = max_num_res.scalar() or 0
    next_num = max_num + 1

    item_code = format_item_code(rack=body.rack, pozice=body.pozice, box=box_num, number=next_num)

    item = InventoryItem(
        id=str(uuid.uuid4()),
        item_code=item_code,
        name=body.name.strip(),
        rack=body.rack,
        pozice=body.pozice,
        box=box_num,
        number=next_num,
        category=body.category.strip() if body.category else None,
        note=body.note.strip() if body.note else None,
        barcode=body.barcode.strip() if body.barcode else f"GD:INV:{item_code}",
        photo_url=body.photo_url,
        created_by_user_id=current_user.id
    )
    db.add(item)

    log = AuditLog(
        event_type="ITEM_CREATED",
        actor_type="USER",
        actor_id=str(current_user.id),
        actor_name=current_user.full_name,
        result="SUCCESS",
        details={"item_code": item.item_code, "name": item.name, "location": f"XY-ZAAA: {item_code}"}
    )
    db.add(log)
    await db.commit()
    await db.refresh(item)
    return item

@router.put("/inventory/{item_id}", response_model=InventoryOut)
async def update_inventory_item(
    item_id: str,
    body: InventoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = await db.get(InventoryItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    location_changed = False
    if body.rack is not None and body.rack != item.rack:
        item.rack = body.rack
        location_changed = True
    if body.pozice is not None and body.pozice != item.pozice:
        item.pozice = body.pozice
        location_changed = True
    if body.box is not None and body.box != item.box:
        item.box = body.box
        location_changed = True

    if location_changed:
        count_stmt = select(func.max(InventoryItem.number)).where(
            InventoryItem.rack == item.rack,
            InventoryItem.pozice == item.pozice,
            InventoryItem.box == item.box
        )
        max_res = await db.execute(count_stmt)
        item.number = (max_res.scalar() or 0) + 1
        item.item_code = format_item_code(item.rack, item.pozice, item.box, item.number)

    if body.name is not None:
        item.name = body.name.strip()
    if body.category is not None:
        item.category = body.category.strip()
    if body.note is not None:
        item.note = body.note.strip()
    if body.barcode is not None:
        item.barcode = body.barcode.strip()
    if body.photo_url is not None:
        item.photo_url = body.photo_url

    log = AuditLog(
        event_type="ITEM_UPDATED",
        actor_type="USER",
        actor_id=str(current_user.id),
        actor_name=current_user.full_name,
        result="SUCCESS",
        details={"item_code": item.item_code, "name": item.name}
    )
    db.add(log)
    await db.commit()
    await db.refresh(item)
    return item

@router.delete("/inventory/{item_id}")
async def delete_inventory_item(
    item_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = await db.get(InventoryItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    item_info = {"item_code": item.item_code, "name": item.name}
    await db.delete(item)

    log = AuditLog(
        event_type="ITEM_DELETED",
        actor_type="USER",
        actor_id=str(current_user.id),
        actor_name=current_user.full_name,
        result="SUCCESS",
        details=item_info
    )
    db.add(log)
    await db.commit()
    return {"message": f"Item '{item_info['item_code']}' deleted successfully"}

@router.post("/uploads/photo")
async def upload_photo(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    filename = f"item_{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    return {"photo_url": f"/uploads/{filename}"}

# Brother Label Print Queue Endpoint
@router.post("/print/label")
async def queue_label_print(
    item_code: str = Query(...),
    item_name: str = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    log = AuditLog(
        event_type="LABEL_PRINT_TRIGGERED",
        actor_type="USER",
        actor_id=str(current_user.id),
        actor_name=current_user.full_name,
        result="SUCCESS",
        details={"item_code": item_code, "item_name": item_name, "printer": "Brother PT-D460BTVP (18mm)"}
    )
    db.add(log)
    await db.commit()
    return {
        "status": "PRINT_JOB_QUEUED",
        "printer": "Brother PT-D460BTVP (18mm tape)",
        "item_code": item_code,
        "item_name": item_name
    }
