import json
import bcrypt
import urllib.request
import urllib.parse
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserLogin, UserResponse, ChangePasswordRequest, GoogleLoginRequest

router = APIRouter(prefix="/api", tags=["Auth"])

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "rfid_admin_pass"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not plain_password or not hashed_password:
        return False
    try:
        p_bytes = plain_password.encode('utf-8')[:72]
        h_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(p_bytes, h_bytes)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    p_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(p_bytes, salt).decode('utf-8')

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

@router.post("/google-login")
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    if not payload.credential or not payload.credential.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Google OAuth ID token credential."
        )

    google_email = None
    try:
        url = f"https://oauth2.googleapis.com/tokeninfo?id_token={payload.credential.strip()}"
        with urllib.request.urlopen(url, timeout=6) as response:
            if response.status == 200:
                data = json.loads(response.read().decode("utf-8"))
                google_email = data.get("email")
    except Exception as e:
        print("Google token verification failed:", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google OAuth ID token verification failed or expired. Please sign in again."
        )

    if not google_email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google OAuth credential. Email address not found."
        )

    clean_email = google_email.strip().lower()

    # Search for system user assigned to this Google email
    user = db.query(User).filter(User.email.ilike(clean_email)).first()

    # STRICT REJECTION RULE: If no user account is assigned to this Google email, reject login!
    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access Denied: Google account ({google_email}) is not assigned to any user. Please contact an administrator."
        )

    perms = json.loads(user.permissions) if isinstance(user.permissions, str) and user.permissions else {}
    return {
        "status": "success",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_admin": user.is_admin,
            "permissions": perms,
            "chip_id": user.chip_id
        }
    }
