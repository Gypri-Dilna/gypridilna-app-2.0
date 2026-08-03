import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.location_parser import format_item_code, parse_item_code

def test_location_parser_xy_zaaa():
    # Test formatting with no box (defaults to 0)
    code1 = format_item_code(rack=6, pozice=1, box=0, number=1)
    assert code1 == "61-0001"

    # Test formatting with box
    code2 = format_item_code(rack=6, pozice=1, box=2, number=1)
    assert code2 == "61-2001"

    # Test parsing
    parsed = parse_item_code("61-2001")
    assert parsed["rack"] == 6
    assert parsed["pozice"] == 1
    assert parsed["box"] == 2
    assert parsed["number"] == 1

@pytest.mark.asyncio
async def test_get_inventory_seeded_item():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/api/inventory")
        assert resp.status_code == 200
        items = resp.json()
        assert len(items) >= 1
        assert items[0]["item_code"] == "61-0001"
        assert items[0]["name"] == "Šroubovák červený křížový"
