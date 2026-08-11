import json
import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.routers.auth import get_current_user_from_token

router = APIRouter(prefix="/api/users", tags=["Users"])

def require_admin_user(user: User = Depends(get_current_user_from_token)):
    if not user or not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Přístup odepřen: Vyžadována administrátorská práva."
        )
    return user

def get_password_hash(password: str) -> str:
    p_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(p_bytes, salt).decode('utf-8')

def serialize_user(user: User):
    perms = json.loads(user.permissions) if isinstance(user.permissions, str) and user.permissions else {}
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "is_admin": user.is_admin,
        "permissions": perms,
        "chip_id": user.chip_id
    }

@router.get("", response_model=List[UserResponse])
def get_users(current_user: User = Depends(require_admin_user), db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [serialize_user(u) for u in users]

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user_in: UserCreate, current_user: User = Depends(require_admin_user), db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == user_in.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    if user_in.email:
        existing_email = db.query(User).filter(User.email.ilike(user_in.email.strip())).first()
        if existing_email:
            raise HTTPException(status_code=400, detail=f"Email '{user_in.email}' is already assigned to user '{existing_email.username}'")
        
    hashed = get_password_hash(user_in.password)
    perms_str = json.dumps(user_in.permissions)
    
    new_user = User(
        username=user_in.username,
        email=user_in.email.strip().lower() if user_in.email else None,
        password_hash=hashed,
        is_admin=user_in.is_admin,
        permissions=perms_str,
        chip_id=user_in.chip_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return serialize_user(new_user)

@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_in: UserUpdate, current_user: User = Depends(require_admin_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user_in.username is not None:
        user.username = user_in.username

    if user_in.email is not None:
        clean_email = user_in.email.strip().lower() if user_in.email else None
        if clean_email:
            existing_email = db.query(User).filter(User.email.ilike(clean_email), User.id != user_id).first()
            if existing_email:
                raise HTTPException(status_code=400, detail=f"Email '{clean_email}' is already assigned to user '{existing_email.username}'")
        user.email = clean_email

    if user_in.password:
        user.password_hash = get_password_hash(user_in.password)
    if user_in.is_admin is not None:
        user.is_admin = user_in.is_admin
    if user_in.permissions is not None:
        user.permissions = json.dumps(user_in.permissions)
    if user_in.chip_id is not None:
        user.chip_id = user_in.chip_id
        
    db.commit()
    db.refresh(user)
    return serialize_user(user)

@router.delete("/{user_id}")
def delete_user(user_id: int, current_user: User = Depends(require_admin_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.is_admin and db.query(User).filter(User.is_admin == True).count() <= 1:
        raise HTTPException(status_code=400, detail="Cannot delete the last administrator")
        
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}
