from datetime import datetime, timedelta, timezone

import jwt
from passlib.context import CryptContext


# ============================================================
# Password Configuration
# ============================================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


def hash_password(password: str) -> str:
    """Hash a plain-text password using bcrypt."""

    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    """Verify a password against its stored hash."""

    return pwd_context.verify(
        plain_password,
        hashed_password
    )


# ============================================================
# JWT Configuration
# ============================================================

SECRET_KEY = "retina-ai-super-secret-key-change-this-later"

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60


# ============================================================
# Create Access Token
# ============================================================

def create_access_token(
    user_id: int,
    role: str
) -> str:
    """Create a JWT access token."""

    expire = (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    payload = {
        "user_id": user_id,
        "role": role,
        "exp": expire
    }

    token = jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return token


# ============================================================
# Verify Access Token
# ============================================================

def verify_access_token(token: str) -> dict:
    """Verify JWT token and return user information."""

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("user_id")
        role = payload.get("role")

        if user_id is None or role is None:
            raise ValueError("Invalid token")

        return {
            "user_id": int(user_id),
            "role": role
        }

    except jwt.ExpiredSignatureError:

        raise ValueError("Token has expired")

    except jwt.InvalidTokenError:

        raise ValueError("Invalid token")