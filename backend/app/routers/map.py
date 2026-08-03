from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.map_zone import MapZone

router = APIRouter(prefix="/api/map", tags=["Workshop Minimap"])

DEFAULT_ZONES = [
    {"name": "Zone A: CNC & Woodworking", "code": "ZONE_A", "color": "#00F0FF", "x": 5.0, "y": 10.0, "width": 40.0, "height": 38.0, "description": "CNC routers, Table saws, Sanders & Dust extractors"},
    {"name": "Zone B: Metal & Welding Lab", "code": "ZONE_B", "color": "#F59E0B", "x": 50.0, "y": 10.0, "width": 45.0, "height": 38.0, "description": "TIG/MIG Welders, Plasma cutter, Angle grinders, Drill press"},
    {"name": "Zone C: Electronics & Soldering", "code": "ZONE_C", "color": "#10B981", "x": 5.0, "y": 55.0, "width": 40.0, "height": 38.0, "description": "Oscilloscopes, Soldering stations, Microcontrollers, RFID gear"},
    {"name": "Zone D: 3D Printing & CAD Station", "code": "ZONE_D", "color": "#EC4899", "x": 50.0, "y": 55.0, "width": 25.0, "height": 38.0, "description": "Prusa & Bambu Lab 3D printers, Resin post-processing"},
    {"name": "Zone E: Entrance & Access Gate", "code": "ZONE_E", "color": "#8B5CF6", "x": 78.0, "y": 55.0, "width": 17.0, "height": 38.0, "description": "RFID Door Access Gate, Member check-in terminal"}
]

@router.get("/zones")
def get_map_zones(db: Session = Depends(get_db)):
    zones = db.query(MapZone).all()
    if not zones:
        for z in DEFAULT_ZONES:
            db_zone = MapZone(**z)
            db.add(db_zone)
        db.commit()
        zones = db.query(MapZone).all()
    return zones

@router.post("/zones")
def update_map_zone(zone_data: dict, db: Session = Depends(get_db)):
    code = zone_data.get("code")
    zone = db.query(MapZone).filter(MapZone.code == code).first()
    if not zone:
        zone = MapZone(**zone_data)
        db.add(zone)
    else:
        for k, v in zone_data.items():
            setattr(zone, k, v)
    db.commit()
    db.refresh(zone)
    return zone
