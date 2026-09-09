from datetime import datetime, timedelta, timezone
from typing import Optional, Any
import bcrypt
import jwt
from app.core.config import settings


def get_password_hash(password: str) -> str:
    """Hash a plain-text password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against a stored hash."""
    try:
        # Modern bcrypt hash (starts with $2b$ or $2a$)
        if hashed_password.startswith("$2b$") or hashed_password.startswith("$2a$"):
            return bcrypt.checkpw(
                plain_password.encode("utf-8"),
                hashed_password.encode("utf-8")
            )
        # Legacy SHA-256+salt fallback (format: "salt$sha256hex") for backward compat
        if "$" in hashed_password and len(hashed_password.split("$")[0]) == 32:
            import hashlib, hmac as _hmac
            salt, hashed = hashed_password.split("$", 1)
            test_hash = hashlib.sha256((salt + plain_password).encode("utf-8")).hexdigest()
            return _hmac.compare_digest(hashed, test_hash)
    except Exception:
        pass
    return False


def create_access_token(subject: Any, role: str, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {
        "sub": str(subject),
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None
