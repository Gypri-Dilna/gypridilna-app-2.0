import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_esp32_check_access_endpoints():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Check unknown chip
        resp = await ac.post("/api/check-access", json={"chip_id": "UNKNOWN_999"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "DENIED"
        assert data["reason"] == "UNKNOWN_CHIP"

        # Check seeded chip
        resp_granted = await ac.post("/api/check-access", json={"chip_id": "1A2B3C4D"})
        assert resp_granted.status_code == 200
        data_granted = resp_granted.json()
        assert data_granted["status"] == "GRANTED"
        assert data_granted["name"] == "John Doe"

@pytest.mark.asyncio
async def test_esp32_polling_endpoints():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res_override = await ac.get("/api/override-status")
        assert res_override.status_code == 200
        assert "override" in res_override.json()

        res_service = await ac.get("/api/service-mode-status")
        assert res_service.status_code == 200
        assert "enabled" in res_service.json()
