from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.rfid_chip import RfidChip
from app.models.system_setting import SystemSetting
from app.models.audit_log import AuditLog
from app.schemas.rfid_chip import ChipCreate, ChipUpdate, ChipOut
from app.core.security import get_current_user, require_permission
from app.models.user import User

router = APIRouter(prefix="/api", tags=["RFID Chip Management & Door Control"])

@router.get("/chips", response_model=list[ChipOut])
async def list_chips(db: AsyncSession = Depends(get_db)):
    stmt = select(RfidChip).order_by(RfidChip.id)
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/chips", response_model=ChipOut, status_code=201)
async def create_chip(
    body: ChipCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(RfidChip).where(RfidChip.chip_id == body.chip_id.strip())
    res = await db.execute(stmt)
    if res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Chip ID already registered")

    chip = RfidChip(
        chip_id=body.chip_id.strip(),
        name=body.name.strip(),
        is_allowed=body.is_allowed,
        is_one_time=body.is_one_time,
        valid_until=body.valid_until,
        user_id=body.user_id
    )
    db.add(chip)
    
    log = AuditLog(
        event_type="CHIP_CREATED",
        actor_type="USER",
        actor_id=str(current_user.id),
        actor_name=current_user.full_name,
        result="SUCCESS",
        details={"chip_id": chip.chip_id, "name": chip.name}
    )
    db.add(log)
    await db.commit()
    await db.refresh(chip)
    return chip

@router.put("/chips/{chip_id_or_db_id}", response_model=ChipOut)
async def update_chip(
    chip_id_or_db_id: str,
    body: ChipUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chip = None
    if chip_id_or_db_id.isdigit():
        chip = await db.get(RfidChip, int(chip_id_or_db_id))
    if not chip:
        stmt = select(RfidChip).where(RfidChip.chip_id == chip_id_or_db_id)
        res = await db.execute(stmt)
        chip = res.scalar_one_or_none()

    if not chip:
        raise HTTPException(status_code=404, detail="Chip not found")

    if body.name is not None:
        chip.name = body.name.strip()
    if body.chip_id is not None:
        chip.chip_id = body.chip_id.strip()
    if body.is_allowed is not None:
        chip.is_allowed = body.is_allowed
    if body.is_one_time is not None:
        chip.is_one_time = body.is_one_time
    if body.valid_until is not None:
        chip.valid_until = body.valid_until
    if body.user_id is not None:
        chip.user_id = body.user_id

    log = AuditLog(
        event_type="CHIP_UPDATED",
        actor_type="USER",
        actor_id=str(current_user.id),
        actor_name=current_user.full_name,
        result="SUCCESS",
        details={"chip_id": chip.chip_id, "name": chip.name}
    )
    db.add(log)
    await db.commit()
    await db.refresh(chip)
    return chip

@router.delete("/chips/{chip_id_or_db_id}")
async def delete_chip(
    chip_id_or_db_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chip = None
    if chip_id_or_db_id.isdigit():
        chip = await db.get(RfidChip, int(chip_id_or_db_id))
    if not chip:
        stmt = select(RfidChip).where(RfidChip.chip_id == chip_id_or_db_id)
        res = await db.execute(stmt)
        chip = res.scalar_one_or_none()

    if not chip:
        raise HTTPException(status_code=404, detail="Chip not found")

    chip_info = {"chip_id": chip.chip_id, "name": chip.name}
    await db.delete(chip)

    log = AuditLog(
        event_type="CHIP_DELETED",
        actor_type="USER",
        actor_id=str(current_user.id),
        actor_name=current_user.full_name,
        result="SUCCESS",
        details=chip_info
    )
    db.add(log)
    await db.commit()
    return {"message": "Chip deleted successfully"}

# Dashboard Door Unlock Trigger
@router.get("/manual-override")
async def request_manual_override(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("unlock_door_remotely"))
):
    setting = await db.get(SystemSetting, "manual_override_requested")
    if setting:
        setting.value = "true"
    else:
        db.add(SystemSetting(key="manual_override_requested", value="true"))

    log = AuditLog(
        event_type="REMOTE_DOOR_UNLOCK",
        actor_type="USER",
        actor_id=str(current_user.id),
        actor_name=current_user.full_name,
        result="GRANTED (OVERRIDE)",
        details={"triggered_by": current_user.username}
    )
    db.add(log)
    await db.commit()
    return {"status": "OVERRIDE_REQUESTED"}

# Service Mode Toggle
@router.get("/service-mode")
async def set_service_mode(
    enabled: bool = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("toggle_service_mode"))
):
    setting = await db.get(SystemSetting, "service_mode_enabled")
    val_str = "true" if enabled else "false"
    if setting:
        setting.value = val_str
    else:
        db.add(SystemSetting(key="service_mode_enabled", value=val_str))

    log = AuditLog(
        event_type="SERVICE_MODE_TOGGLE",
        actor_type="USER",
        actor_id=str(current_user.id),
        actor_name=current_user.full_name,
        result="SUCCESS",
        details={"enabled": enabled}
    )
    db.add(log)
    await db.commit()
    return {"status": f"Service mode {'enabled' if enabled else 'disabled'}"}
