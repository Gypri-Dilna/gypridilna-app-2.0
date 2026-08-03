import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserLogin, UserResponse, ChangePasswordRequest

router = APIRouter(prefix="/api", tags=["Auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "rfid_admin_pass"

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

@router.post("/login")
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == login_data.username).first()
    
    if user and verify_password(login_data.password, user.password_hash):
        return {
            "status": "success",
            "user": {
                "id": user.id,
                "username": user.username,
                "is_admin": user.is_admin,
                "permissions": json.loads(user.permissions) if isinstance(user.permissions, str) else user.permissions,
                "chip_id": user.chip_id
            }
        }
    
    # Fallback to create initial admin if no users exist
    user_count = db.query(User).count()
    if user_count == 0 and login_data.username == ADMIN_USERNAME and login_data.password == ADMIN_PASSWORD:
        admin_perms = {
            "service_mode": True,
            "add_chips": True,
            "view_logs": True,
            "remote_opening": True,
            "erase_logs": True,
            "inventory_edit": True
        }
        new_admin = User(
            username=ADMIN_USERNAME,
            password_hash=get_password_hash(ADMIN_PASSWORD),
            is_admin=True,
            permissions=json.dumps(admin_perms)
        )
        db.add(new_admin)
        db.commit()
        db.refresh(new_admin)
        return {
            "status": "success",
            "user": {
                "id": new_admin.id,
                "username": new_admin.username,
                "is_admin": new_admin.is_admin,
                "permissions": admin_perms,
                "chip_id": new_admin.chip_id
            }
        }
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid username or password."
    )

@router.post("/change-password")
def change_password(req: ChangePasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if not verify_password(req.old_password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect current password")
        
    user.password_hash = get_password_hash(req.new_password)
    db.commit()
    return {"message": "Password changed successfully"}
