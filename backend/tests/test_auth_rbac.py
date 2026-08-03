import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_auth_login_and_rbac():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Test admin login
        login_res = await ac.post("/api/auth/login", json={"username": "admin", "password": "password"})
        assert login_res.status_code == 200
        data = login_res.json()
        assert "access_token" in data
        assert data["username"] == "admin"
        assert data["role"] == "ADMIN"
        
        token = data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Test fetching current user
        me_res = await ac.get("/api/users/me", headers=headers)
        assert me_res.status_code == 200
        assert me_res.json()["username"] == "admin"

        # Test listing users (Admin allowed)
        users_res = await ac.get("/api/users", headers=headers)
        assert users_res.status_code == 200
        assert len(users_res.json()) >= 1
