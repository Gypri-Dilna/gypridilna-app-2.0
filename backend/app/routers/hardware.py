from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from datetime import datetime, timezone, time as time_obj
from typing import Optional

from app.database import get_db
from app.models.rfid_chip import Chip
from app.models.user import User
from app.models.audit_log import AccessLog

router = APIRouter(prefix="/api", tags=["Hardware & Access Control"])

# Global state in memory matching Arduino/ESP32 hardware protocol
REMOTE_OPENING_REQUESTED = False
SERVICE_MODE_ENABLED = False
LAST_UNKNOWN_CHIP_ID = None

@router.post("/check-access")
def check_access(data: dict = Body(...), db: Session = Depends(get_db)):
    global SERVICE_MODE_ENABLED, LAST_UNKNOWN_CHIP_ID
    
    chip_id = data.get("chip_id")
    if not chip_id:
        raise HTTPException(status_code=400, detail="NO_CHIP_ID")

    if SERVICE_MODE_ENABLED:
        log = AccessLog(chip_id=chip_id, name="Service Mode", result="GRANTED (SERVICE)")
        db.add(log)
        db.commit()
        return {"status": "GRANTED", "reason": "SERVICE_MODE_ACTIVE"}

    chip = db.query(Chip).filter(Chip.chip_id == chip_id).first()

    if not chip:
        LAST_UNKNOWN_CHIP_ID = chip_id
        log = AccessLog(chip_id=chip_id, name="Unknown", result="DENIED (UNKNOWN_CHIP)")
        db.add(log)
        db.commit()
        return {"status": "DENIED", "reason": "UNKNOWN_CHIP"}

    if not chip.is_allowed:
        log = AccessLog(chip_id=chip_id, name=chip.name, result="DENIED (BLOCKED)")
        db.add(log)
        db.commit()
        return {"status": "DENIED", "reason": "CHIP_BLOCKED"}

    if chip.valid_until and datetime.now(timezone.utc).replace(tzinfo=None) > chip.valid_until:
        log = AccessLog(chip_id=chip_id, name=chip.name, result="DENIED (EXPIRED)")
        db.add(log)
        db.commit()
        return {"status": "DENIED", "reason": "CHIP_EXPIRED"}

    today_start = datetime.combine(datetime.now(timezone.utc).date(), time_obj.min)
    todays_entries = db.query(AccessLog).filter(
        AccessLog.chip_id == chip_id,
        AccessLog.result == "GRANTED",
        AccessLog.timestamp >= today_start
    ).count()

    daily_entry_count = todays_entries + 1

    if chip.is_one_time:
        chip.is_allowed = False

    log = AccessLog(chip_id=chip_id, name=chip.name, result="GRANTED")
    db.add(log)
    db.commit()

    return {
        "status": "GRANTED",
        "name": chip.name,
        "daily_entry_count": daily_entry_count
    }

@router.post("/remote-opening")
def remote_opening(data: dict = Body(...), db: Session = Depends(get_db)):
    global REMOTE_OPENING_REQUESTED
    username = data.get("username", "Unknown User")

    log_name = username
    user = db.query(User).filter(User.username == username).first()
    if user and user.chip_id:
        chip = db.query(Chip).filter(Chip.chip_id == user.chip_id).first()
        if chip:
            log_name = chip.name

    REMOTE_OPENING_REQUESTED = True

    log = AccessLog(chip_id="REMOTE_OPENING", name=log_name, result="GRANTED (REMOTE)")
    db.add(log)
    db.commit()

    return {"status": "OPENING_REQUESTED"}

@router.get("/override-status")
def get_override_status():
    global REMOTE_OPENING_REQUESTED
    if REMOTE_OPENING_REQUESTED:
        REMOTE_OPENING_REQUESTED = False
        return {"override": True}
    return {"override": False}

@router.get("/service-mode")
def set_service_mode(enabled: str = Query("false"), username: str = Query("Admin"), db: Session = Depends(get_db)):
    global SERVICE_MODE_ENABLED
    is_enabled = enabled.lower() in ["true", "1", "t", "yes"]
    SERVICE_MODE_ENABLED = is_enabled

    status_str = "ENABLED" if is_enabled else "DISABLED"
    log = AccessLog(chip_id="SERVICE_MODE", name=username, result=f"SERVICE_MODE_{status_str}")
    db.add(log)
    db.commit()

    return {"status": f"Service mode {status_str.lower()}"}

@router.get("/service-mode-status")
def get_service_mode_status():
    global SERVICE_MODE_ENABLED
    return {"enabled": SERVICE_MODE_ENABLED}

@router.get("/last-unknown-chip")
def get_last_unknown_chip():
    global LAST_UNKNOWN_CHIP_ID
    if LAST_UNKNOWN_CHIP_ID:
        chip_id_to_send = LAST_UNKNOWN_CHIP_ID
        LAST_UNKNOWN_CHIP_ID = None
        return {"chip_id": chip_id_to_send}
    return {"chip_id": None}
