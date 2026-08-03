from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import get_db
from app.models.rfid_chip import Chip
from app.schemas.rfid_chip import ChipCreate, ChipUpdate, ChipResponse

router = APIRouter(prefix="/api/chips", tags=["Chips"])

def serialize_chip(chip: Chip):
    return {
        "id": chip.id,
        "chip_id": chip.chip_id,
        "name": chip.name,
        "is_allowed": chip.is_allowed,
        "is_one_time": chip.is_one_time,
        "valid_until": chip.valid_until.isoformat() if chip.valid_until else None
    }

@router.get("", response_model=List[ChipResponse])
def get_chips(db: Session = Depends(get_db)):
    chips = db.query(Chip).order_by(Chip.name).all()
    return [serialize_chip(c) for c in chips]

@router.post("", response_model=ChipResponse, status_code=status.HTTP_201_CREATED)
def create_chip(chip_in: ChipCreate, db: Session = Depends(get_db)):
    existing = db.query(Chip).filter(Chip.chip_id == chip_in.chip_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Chip ID already registered")
        
    new_chip = Chip(
        chip_id=chip_in.chip_id,
        name=chip_in.name,
        is_allowed=chip_in.is_allowed,
        is_one_time=chip_in.is_one_time,
        valid_until=chip_in.valid_until
    )
    db.add(new_chip)
    db.commit()
    db.refresh(new_chip)
    return serialize_chip(new_chip)

@router.put("/{chip_id}", response_model=ChipResponse)
def update_chip(chip_id: int, chip_in: ChipUpdate, db: Session = Depends(get_db)):
    chip = db.query(Chip).filter(Chip.id == chip_id).first()
    if not chip:
        raise HTTPException(status_code=404, detail="Chip not found")
        
    if chip_in.chip_id is not None:
        chip.chip_id = chip_in.chip_id
    if chip_in.name is not None:
        chip.name = chip_in.name
    if chip_in.is_allowed is not None:
        chip.is_allowed = chip_in.is_allowed
    if chip_in.is_one_time is not None:
        chip.is_one_time = chip_in.is_one_time
    if chip_in.valid_until is not None:
        chip.valid_until = chip_in.valid_until
        
    db.commit()
    db.refresh(chip)
    return serialize_chip(chip)

@router.delete("/{chip_id}")
def delete_chip(chip_id: int, db: Session = Depends(get_db)):
    chip = db.query(Chip).filter(Chip.id == chip_id).first()
    if not chip:
        raise HTTPException(status_code=404, detail="Chip not found")
        
    db.delete(chip)
    db.commit()
    return {"message": "Chip deleted successfully"}
