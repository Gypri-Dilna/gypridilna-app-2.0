import pytest_asyncio
from app.database import engine, Base
from app.main import lifespan, app

@pytest_asyncio.fixture(autouse=True, scope="function")
async def setup_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Run lifespan startup logic
    async with lifespan(app):
        yield
