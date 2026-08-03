from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserCreate, UserUpdate, UserOut
from app.core.security import verify_password, hash_password, create_access_token, get_current_user, require_permission
from app.models.audit_log import AuditLog

router = APIRouter(prefix="/api", tags=["Authentication & Users"])

@router.post("/auth/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.username == body.username, User.is_active == True)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    user.last_login = datetime.now(timezone.utc)
    
    # Audit log
    log_entry = AuditLog(
        event_type="USER_LOGIN",
        actor_type="USER",
        actor_id=str(user.id),
        actor_name=user.full_name,
        result="SUCCESS",
        details={"username": user.username}
    )
    db.add(log_entry)
    await db.commit()

    token = create_access_token(data={"sub": user.username, "role": user.role.value})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        username=user.username,
        full_name=user.full_name,
        role=user.role,
        permissions=user.permissions or []
    )

@router.get("/users/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/users", response_model=list[UserOut])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("manage_users"))
):
    stmt = select(User).order_by(User.id)
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/users", response_model=UserOut, status_code=201)
async def create_user(
    body: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("manage_users"))
):
    stmt = select(User).where(User.username == body.username)
    res = await db.execute(stmt)
    if res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already exists")

    new_user = User(
        username=body.username.strip(),
        password_hash=hash_password(body.password),
        full_name=body.full_name.strip(),
        role=body.role,
        permissions=body.permissions,
        is_active=True
    )
    db.add(new_user)
    await db.flush()

    # Log user creation
    log = AuditLog(
        event_type="USER_CREATED",
        actor_type="USER",
        actor_id=str(current_user.id),
        actor_name=current_user.full_name,
        result="SUCCESS",
        details={"target_username": new_user.username, "role": new_user.role.value}
    )
    db.add(log)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@router.put("/users/{user_id}", response_model=UserOut)
async def update_user(
    user_id: int,
    body: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("manage_users"))
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if body.full_name is not None:
        user.full_name = body.full_name.strip()
    if body.role is not None:
        user.role = body.role
    if body.permissions is not None:
        user.permissions = body.permissions
    if body.is_active is not None:
        user.is_active = body.is_active
    if body.password:
        user.password_hash = hash_password(body.password)

    log = AuditLog(
        event_type="USER_UPDATED",
        actor_type="USER",
        actor_id=str(current_user.id),
        actor_name=current_user.full_name,
        result="SUCCESS",
        details={"target_user_id": user_id, "updated_fields": list(body.model_dump(exclude_unset=True).keys())}
    )
    db.add(log)
    await db.commit()
    await db.refresh(user)
    return user

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("manage_users"))
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = False
    log = AuditLog(
        event_type="USER_DEACTIVATED",
        actor_type="USER",
        actor_id=str(current_user.id),
        actor_name=current_user.full_name,
        result="SUCCESS",
        details={"target_user_id": user_id}
    )
    db.add(log)
    await db.commit()
    return {"message": "User deactivated successfully"}
