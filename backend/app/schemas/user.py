from datetime import datetime
from pydantic import BaseModel
from app.models.user import UserRole

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    role: UserRole = UserRole.MEMBER
    permissions: list[str] = []

class UserUpdate(BaseModel):
    full_name: str | None = None
    role: UserRole | None = None
    permissions: list[str] | None = None
    is_active: bool | None = None
    password: str | None = None

class UserOut(BaseModel):
    id: int
    username: str
    full_name: str
    role: UserRole
    permissions: list[str]
    is_active: bool
    created_at: datetime
    last_login: datetime | None = None

    class Config:
        from_attributes = True
