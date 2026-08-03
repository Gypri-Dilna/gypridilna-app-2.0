from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.map_zone import MapZone
from app.schemas.map_zone import MapZoneCreate, MapZoneUpdate, MapZoneOut
from app.core.security import get_current_user, require_permission
from app.models.user import User

router = APIRouter(prefix="/api/map", tags=["Configurable 2D Workshop Minimap Grid"])

@router.get("/zones", response_model=list[MapZoneOut])
async def list_map_zones(db: AsyncSession = Depends(get_db)):
    stmt = select(MapZone).order_by(MapZone.rack_number)
    res = await db.execute(stmt)
    zones = res.scalars().all()
    
    # Initialize default workshop rack zones if database is empty
    if not zones:
        default_zones = [
            MapZone(zone_code="RACK-1", rack_number=1, display_name="Rack 1 - Power Tools", grid_x=50, grid_y=50, width=120, height=80, color_hex="#3AA69A", zone_type="RACK"),
            MapZone(zone_code="RACK-2", rack_number=2, display_name="Rack 2 - Fasteners & Hardware", grid_x=200, grid_y=50, width=120, height=80, color_hex="#3AA69A", zone_type="RACK"),
            MapZone(zone_code="RACK-6", rack_number=6, display_name="Rack 6 - Screwdrivers & Hand Tools", grid_x=350, grid_y=50, width=140, height=100, color_hex="#3AA69A", zone_type="RACK"),
            MapZone(zone_code="BENCH-1", rack_number=99, display_name="Main Workbench", grid_x=100, grid_y=200, width=250, height=100, color_hex="#E67E22", zone_type="WORKBENCH"),
        ]
        for dz in default_zones:
            db.add(dz)
        await db.commit()
        res = await db.execute(stmt)
        zones = res.scalars().all()
        
    return zones

@router.post("/zones", response_model=MapZoneOut, status_code=201)
async def create_map_zone(
    body: MapZoneCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("manage_map_grid"))
):
    stmt = select(MapZone).where(MapZone.rack_number == body.rack_number)
    res = await db.execute(stmt)
    if res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"Rack number {body.rack_number} already defined on map")

    zone = MapZone(
        zone_code=body.zone_code.strip(),
        rack_number=body.rack_number,
        display_name=body.display_name.strip(),
        grid_x=body.grid_x,
        grid_y=body.grid_y,
        width=body.width,
        height=body.height,
        color_hex=body.color_hex,
        zone_type=body.zone_type
    )
    db.add(zone)
    await db.commit()
    await db.refresh(zone)
    return zone

@router.put("/zones/{zone_id}", response_model=MapZoneOut)
async def update_map_zone(
    zone_id: int,
    body: MapZoneUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("manage_map_grid"))
):
    zone = await db.get(MapZone, zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Map zone not found")

    if body.display_name is not None:
        zone.display_name = body.display_name.strip()
    if body.rack_number is not None:
        zone.rack_number = body.rack_number
    if body.grid_x is not None:
        zone.grid_x = body.grid_x
    if body.grid_y is not None:
        zone.grid_y = body.grid_y
    if body.width is not None:
        zone.width = body.width
    if body.height is not None:
        zone.height = body.height
    if body.color_hex is not None:
        zone.color_hex = body.color_hex
    if body.zone_type is not None:
        zone.zone_type = body.zone_type

    await db.commit()
    await db.refresh(zone)
    return zone

@router.delete("/zones/{zone_id}")
async def delete_map_zone(
    zone_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("manage_map_grid"))
):
    zone = await db.get(MapZone, zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Map zone not found")

    await db.delete(zone)
    await db.commit()
    return {"message": "Map zone deleted successfully"}
