from pydantic import BaseModel
from app.models.user import UserRole

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str
    full_name: str
    role: UserRole
    permissions: list[str]
