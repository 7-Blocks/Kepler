import logging
import secrets

import httpx
from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from database.session import get_db
from models.db_models import User, Role, Organization
from schemas.api_schemas import (
    APIResponse,
    Token,
    UserResponse,
    UserCreate,
    GoogleAuthRequest,
)
from app.core.config import settings
from app.core.exceptions import (
    ConflictError,
    UnauthorizedError,
    BadRequestError,
)
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
)

logger = logging.getLogger("app.auth")

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"
GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------

def _default_org_and_role(db: Session) -> tuple[Organization, Role]:
    """Return the default organisation/role, creating them on first use."""
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

    return org, role


def _issue_tokens(user: User) -> Token:
    """Mint an access/refresh token pair for an authenticated user."""
    return Token(
        access_token=create_access_token(subject=user.email),
        refresh_token=create_refresh_token(subject=user.email),
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


# ---------------------------------------------------------------------------
# email / password
# ---------------------------------------------------------------------------

@router.post("/register", response_model=APIResponse[UserResponse])
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise ConflictError(
            "An operator is already registered with this email address.",
            details={"field": "email", "value": user_in.email},
        )

    org, role = _default_org_and_role(db)

    user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        auth_provider="local",
        role_id=user_in.role_id or role.id,
        organization_id=user_in.organization_id or org.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return APIResponse(
        success=True,
        message="Operator registration successful",
        data=UserResponse.model_validate(user),
    )


@router.post("/token", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not user.hashed_password or not verify_password(
        form_data.password, user.hashed_password
    ):
        raise UnauthorizedError("Incorrect email or password.")

    return _issue_tokens(user)


# ---------------------------------------------------------------------------
# Google OAuth
# ---------------------------------------------------------------------------

def _verify_google_token(payload: GoogleAuthRequest) -> dict:
    """
    Resolve a verified Google profile from either an access token or an id_token.

    Both paths call Google directly, so a client can never forge a profile: the
    token has to have been minted by Google. When ``GOOGLE_CLIENT_ID`` is set we
    additionally assert the token's audience matches, so tokens issued for a
    *different* application are rejected.
    """
    try:
        with httpx.Client(timeout=10.0) as client:
            if payload.id_token:
                resp = client.get(
                    GOOGLE_TOKENINFO_URL, params={"id_token": payload.id_token}
                )
                resp.raise_for_status()
                info = resp.json()
                aud = info.get("aud")
            elif payload.access_token:
                # Confirm the access token belongs to us, then read the profile.
                token_resp = client.get(
                    GOOGLE_TOKENINFO_URL,
                    params={"access_token": payload.access_token},
                )
                token_resp.raise_for_status()
                token_info = token_resp.json()
                aud = token_info.get("aud") or token_info.get("azp")

                userinfo_resp = client.get(
                    GOOGLE_USERINFO_URL,
                    headers={"Authorization": f"Bearer {payload.access_token}"},
                )
                userinfo_resp.raise_for_status()
                info = userinfo_resp.json()
            else:
                raise BadRequestError(
                    "A Google access_token or id_token is required.",
                    details={"field": "access_token"},
                )
    except httpx.HTTPError as exc:
        logger.warning("Google token verification failed: %s", exc)
        raise UnauthorizedError(
            "Could not verify your Google sign-in. Please try again."
        )

    if settings.GOOGLE_CLIENT_ID and aud and aud != settings.GOOGLE_CLIENT_ID:
        logger.warning("Google token audience mismatch: %s", aud)
        raise UnauthorizedError("This Google sign-in was issued for another app.")

    email = info.get("email")
    if not email:
        raise UnauthorizedError("Google did not return an email for this account.")

    email_verified = info.get("email_verified")
    if email_verified in (False, "false"):
        raise UnauthorizedError("Your Google email address is not verified.")

    return {
        "sub": info.get("sub"),
        "email": email,
        "name": info.get("name"),
        "picture": info.get("picture"),
    }


@router.post("/google", response_model=Token)
def google_auth(payload: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Sign in (or transparently register) a user with Google.

    First-time Google users get an account created automatically; returning
    users are matched by Google `sub` first, then by email so a pre-existing
    local account is linked instead of duplicated.
    """
    profile = _verify_google_token(payload)

    user = None
    if profile["sub"]:
        user = db.query(User).filter(User.google_sub == profile["sub"]).first()
    if not user:
        user = db.query(User).filter(User.email == profile["email"]).first()

    if user:
        # Link / refresh Google details on an existing account.
        updated = False
        if not user.google_sub and profile["sub"]:
            user.google_sub = profile["sub"]
            user.auth_provider = "google"
            updated = True
        if profile["name"] and user.full_name != profile["name"]:
            user.full_name = user.full_name or profile["name"]
            updated = True
        if profile["picture"] and user.avatar_url != profile["picture"]:
            user.avatar_url = profile["picture"]
            updated = True
        if updated:
            db.commit()
            db.refresh(user)
    else:
        org, role = _default_org_and_role(db)
        user = User(
            email=profile["email"],
            full_name=profile["name"],
            avatar_url=profile["picture"],
            # OAuth accounts have no usable password; store an unguessable hash
            # so the row satisfies NOT NULL and can never be logged into locally.
            hashed_password=get_password_hash(secrets.token_urlsafe(32)),
            auth_provider="google",
            google_sub=profile["sub"],
            role_id=role.id,
            organization_id=org.id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    if not user.is_active:
        raise UnauthorizedError("This account has been deactivated.")

    return _issue_tokens(user)
