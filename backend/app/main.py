import os
import json
import bcrypt
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import engine, Base, SessionLocal
from app.models import User, Chip, InventoryItem, MapZone, AccessLog
from app.routers import auth, users, chips, hardware, logs, inventory, map as map_router

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Gypri Dílna Management Platform API",
    description="Unified API for RFID Door Access Control & Workshop Inventory System",
    version="2.0.0"
)

# CORS configuration to support web app & mobile connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(chips.router)
app.include_router(hardware.router)
app.include_router(logs.router)
app.include_router(inventory.router)
app.include_router(map_router.router)

def get_password_hash(password: str) -> str:
    p_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(p_bytes, salt).decode('utf-8')

def seed_initial_data():
    db = SessionLocal()
    try:
        # Seed Admin user if database is empty
        if db.query(User).count() == 0:
            admin_perms = {
                "service_mode": True,
                "add_chips": True,
                "view_logs": True,
                "remote_opening": True,
                "erase_logs": True,
                "inventory_edit": True
            }
            default_admin = User(
                username="admin",
                password_hash=get_password_hash("rfid_admin_pass"),
                is_admin=True,
                permissions=json.dumps(admin_perms),
                chip_id="CHIP_ADMIN_001"
            )
            db.add(default_admin)

            default_chip = Chip(
                chip_id="CHIP_ADMIN_001",
                name="Admin Master Key",
                is_allowed=True,
                is_one_time=False
            )
            db.add(default_chip)

        # Seed sample workshop inventory items if empty
        if db.query(InventoryItem).count() == 0:
            sample_items = [
                {
                    "title": "Bosch Professional Cordless Drill 18V",
                    "category": "Power Tools",
                    "quantity": 3,
                    "unit": "pcs",
                    "min_quantity": 0,
                    "location_code": "12-0123",
                    "location_x": 20.0,
                    "location_y": 25.0,
                    "zone": "Rack 1",
                    "qr_code": "GYPRI-TOOL-001",
                    "notes": "Includes 2x 4.0Ah batteries & charger."
                },
                {
                    "title": "Prusa MK4 3D Printer Nozzle 0.4mm Brass",
                    "category": "3D Printing",
                    "quantity": 12,
                    "unit": "pcs",
                    "min_quantity": 0,
                    "location_code": "52-0042",
                    "location_x": 55.0,
                    "location_y": 70.0,
                    "zone": "Rack 5",
                    "qr_code": "GYPRI-PRUSA-04",
                    "notes": "V6 compatible brass nozzles."
                },
                {
                    "title": "Weller WT1010 Soldering Station 90W",
                    "category": "Electronics",
                    "quantity": 2,
                    "unit": "pcs",
                    "min_quantity": 0,
                    "location_code": "41-0010",
                    "location_x": 20.0,
                    "location_y": 70.0,
                    "zone": "Rack 4",
                    "qr_code": "GYPRI-ELEC-SOLD-01",
                    "notes": "ESD safe with WTP90 pencil."
                },
                {
                    "title": "PLA Filament 1.75mm Signal Black 1kg",
                    "category": "Consumables",
                    "quantity": 8,
                    "unit": "spools",
                    "min_quantity": 0,
                    "location_code": "51-0008",
                    "location_x": 55.0,
                    "location_y": 70.0,
                    "zone": "Rack 5",
                    "qr_code": "GYPRI-FIL-PLA-BLK",
                    "notes": "Prusament PLA Premium."
                },
                {
                    "title": "M4 Stainless Steel Hex Nut Box (500pcs)",
                    "category": "Fasteners",
                    "quantity": 1,
                    "unit": "boxes",
                    "min_quantity": 0,
                    "location_code": "34-5674",
                    "location_x": 75.0,
                    "location_y": 25.0,
                    "zone": "Rack 3",
                    "qr_code": "GYPRI-FAST-M4-NUT",
                    "notes": "DIN 934 A2 Stainless."
                }
            ]
            for item in sample_items:
                db.add(InventoryItem(**item))

        db.commit()
    except Exception as e:
        print(f"Error seeding initial database: {e}")
    finally:
        db.close()

seed_initial_data()

@app.get("/api/health")
def health_check():
    return {"status": "online", "system": "Gypri Dílna Management Platform", "version": "2.0.0"}

# Serve frontend build if dist folder exists
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")
