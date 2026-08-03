from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.rfid_chip import RfidChip
from app.models.audit_log import AuditLog
from app.models.system_setting import SystemSetting
from app.schemas.rfid_chip import ChipCheckRequest

router = APIRouter(tags=["Hardware Compatibility"])

@router.post("/api/check-access")
async def check_access(body: ChipCheckRequest, request: Request, db: AsyncSession = Depends(get_db)):
    chip_id = body.chip_id.strip() if body.chip_id else None
    
    if not chip_id:
        return JSONResponse(status_code=400, content={"status": "DENIED", "reason": "NO_CHIP_ID"})

    stmt = select(RfidChip).where(RfidChip.chip_id == chip_id)
    result = await db.execute(stmt)
    chip = result.scalar_one_or_none()

    client_ip = request.client.host if request.client else "unknown"

    if not chip:
        # Save last unknown chip for Learn Mode
        unknown_setting = await db.get(SystemSetting, "last_unknown_chip_id")
        if unknown_setting:
            unknown_setting.value = chip_id
        else:
            db.add(SystemSetting(key="last_unknown_chip_id", value=chip_id))
        
        log_entry = AuditLog(
            event_type="RFID_SCAN",
            actor_type="ESP32_HARDWARE",
            actor_id=chip_id,
            actor_name="Unknown Chip",
            result="DENIED",
            details={"reason": "UNKNOWN_CHIP"},
            ip_address=client_ip
        )
        db.add(log_entry)
        await db.commit()
        return {"status": "DENIED", "reason": "UNKNOWN_CHIP"}

    # Check if chip is allowed
    if not chip.is_allowed:
        log_entry = AuditLog(
            event_type="RFID_SCAN",
            actor_type="ESP32_HARDWARE",
            actor_id=chip.chip_id,
            actor_name=chip.name,
            result="DENIED",
            details={"reason": "CHIP_BLOCKED"},
            ip_address=client_ip
        )
        db.add(log_entry)
        await db.commit()
        return {"status": "DENIED", "reason": "CHIP_BLOCKED"}

    # Check expiration date
    if chip.valid_until and chip.valid_until.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        log_entry = AuditLog(
            event_type="RFID_SCAN",
            actor_type="ESP32_HARDWARE",
            actor_id=chip.chip_id,
            actor_name=chip.name,
            result="DENIED",
            details={"reason": "CHIP_EXPIRED"},
            ip_address=client_ip
        )
        db.add(log_entry)
        await db.commit()
        return {"status": "DENIED", "reason": "CHIP_EXPIRED"}

    # Compute daily entry count
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    count_stmt = select(func.count(AuditLog.id)).where(
        AuditLog.actor_id == chip.chip_id,
        AuditLog.result == "GRANTED",
        AuditLog.timestamp >= today_start
    )
    count_res = await db.execute(count_stmt)
    daily_count = (count_res.scalar() or 0) + 1

    # Log successful entry
    log_entry = AuditLog(
        event_type="RFID_SCAN",
        actor_type="ESP32_HARDWARE",
        actor_id=chip.chip_id,
        actor_name=chip.name,
        result="GRANTED",
        details={"daily_entry_count": daily_count, "is_one_time": chip.is_one_time},
        ip_address=client_ip
    )
    db.add(log_entry)

    # Disable one-time chip after use
    if chip.is_one_time:
        chip.is_allowed = False

    await db.commit()

    return {
        "status": "GRANTED",
        "name": chip.name,
        "daily_entry_count": daily_count
    }

@router.get("/api/override-status")
async def get_override_status(db: AsyncSession = Depends(get_db)):
    setting = await db.get(SystemSetting, "manual_override_requested")
    if setting and setting.value == "true":
        setting.value = "false"
        await db.commit()
        return {"override": True}
    return {"override": False}

@router.get("/api/service-mode-status")
async def get_service_mode_status(db: AsyncSession = Depends(get_db)):
    setting = await db.get(SystemSetting, "service_mode_enabled")
    if setting and setting.value == "true":
        return {"enabled": True}
    return {"enabled": False}

@router.get("/api/last-unknown-chip")
async def get_last_unknown_chip(db: AsyncSession = Depends(get_db)):
    setting = await db.get(SystemSetting, "last_unknown_chip_id")
    chip_id = setting.value if setting else None
    if chip_id:
        setting.value = ""
        await db.commit()
    return {"chip_id": chip_id or None}
