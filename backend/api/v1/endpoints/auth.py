from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from database.session import get_db
from models.db_models import User, Role, Organization
from schemas.api_schemas import APIResponse, Token, UserResponse, UserCreate
from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token
import logging

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

@router.post("/register", response_model=APIResponse[UserResponse])
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        # 409, not 400: the request is well-formed, it conflicts with existing state.
        raise ConflictError(
            "An operator is already registered with this email address.",
            details={"field": "email", "value": user_in.email},
        )

    
    hashed_pwd = get_password_hash(user_in.password)
    
    
    org = db.query(Organization).first()
    if not org:
        org = Organization(name="Global Space Command")
        db.add(org)
        db.commit()
        db.refresh(org)
        
    role = db.query(Role).first()
    if not role:
        role = Role(name="Operator", description="Mission Control Operator")
        db.add(role)
        db.commit()
        db.refresh(role)

    user = User(
        email=user_in.email,
        hashed_password=hashed_pwd,
        role_id=user_in.role_id or role.id,
        organization_id=user_in.organization_id or org.id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return APIResponse(
        success=True,
        message="Operator registration successful",
        data=UserResponse.from_attributes(user)
    )

@router.post("/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        # Deliberately does not say which of the two was wrong — that would let an
        # attacker enumerate registered operator accounts.
        raise UnauthorizedError("Incorrect email or password.")


    access_token = create_access_token(subject=user.email)
    refresh_token = create_refresh_token(subject=user.email)
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer"
    )
