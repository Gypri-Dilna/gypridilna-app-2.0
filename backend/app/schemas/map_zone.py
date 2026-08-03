from pydantic import BaseModel

class MapZoneCreate(BaseModel):
    zone_code: str
    rack_number: int
    display_name: str
    grid_x: int = 0
    grid_y: int = 0
    width: int = 100
    height: int = 100
    color_hex: str = "#3AA69A"
    zone_type: str = "RACK"

class MapZoneUpdate(BaseModel):
    display_name: str | None = None
    rack_number: int | None = None
    grid_x: int | None = None
    grid_y: int | None = None
    width: int | None = None
    height: int | None = None
    color_hex: str | None = None
    zone_type: str | None = None

class MapZoneOut(BaseModel):
    id: int
    zone_code: str
    rack_number: int
    display_name: str
    grid_x: int
    grid_y: int
    width: int
    height: int
    color_hex: str
    zone_type: str

    class Config:
        from_attributes = True
