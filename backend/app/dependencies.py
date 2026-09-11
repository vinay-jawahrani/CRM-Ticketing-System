from fastapi import Header, HTTPException, status
from app.config import settings

async def verify_api_key(authorization: str | None = Header(default=None)) -> None:
    """Verify Bearer token against API_KEY env var."""
    # If no API key is configured, skip authentication (development mode)
    if not settings.api_key:
        return
    
    if authorization != f"Bearer {settings.api_key}":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key",
            headers={"WWW-Authenticate": "Bearer"},
        )