import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select

from app.config import settings
from app.database import engine, Base, AsyncSessionLocal
from app.models.user import User, UserRole
from app.models.rfid_chip import RfidChip
from app.models.inventory import InventoryItem
from app.models.map_zone import MapZone
from app.core.security import hash_password

from app.routers import hardware, auth, chips, inventory, map, logs

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed default admin user & sample data if empty
    async with AsyncSessionLocal() as db:
        admin_res = await db.execute(select(User).where(User.username == "admin"))
        if not admin_res.scalar_one_or_none():
            admin_user = User(
                username="admin",
                password_hash=hash_password("password"),
                full_name="Workshop Administrator",
                role=UserRole.ADMIN,
                permissions=["manage_users", "unlock_door_remotely", "toggle_service_mode", "manage_map_grid", "manage_inventory"],
                is_active=True
            )
            db.add(admin_user)
            await db.commit()

        # Seed initial sample item from user screenshot if empty
        inv_res = await db.execute(select(InventoryItem))
        if not inv_res.scalars().first():
            sample_item = InventoryItem(
                id="3fa85f64-5717-4562-b3fc-2c963f66afa6",
                item_code="61-0001",
                name="Šroubovák červený křížový",
                rack=6,
                pozice=1,
                box=0,
                number=1,
                category="Ruční nářadí",
                note="Červený křížový šroubovák z dílny",
                barcode="61-0001"
            )
            db.add(sample_item)

            # Seed sample RFID chip
            sample_chip = RfidChip(
                chip_id="1A2B3C4D",
                name="John Doe",
                is_allowed=True,
                is_one_time=False
            )
            db.add(sample_chip)
            await db.commit()

    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploaded photo assets
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(hardware.router)
app.include_router(auth.router)
app.include_router(chips.router)
app.include_router(inventory.router)
app.include_router(map.router)
app.include_router(logs.router)

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION
    }
