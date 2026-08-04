from pydantic import BaseModel
from typing import Optional, Dict, Any

class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    is_admin: bool = False
    permissions: Dict[str, bool] = {}
    chip_id: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    is_admin: Optional[bool] = None
    permissions: Optional[Dict[str, bool]] = None
    chip_id: Optional[str] = None

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    username: str
    password: str

class GoogleLoginRequest(BaseModel):
    credential: Optional[str] = None
    email: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    user_id: int
    old_password: str
    new_password: str
