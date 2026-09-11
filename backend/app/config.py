from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic_settings import BaseSettings, SettingsConfigDict
class Settings(BaseSettings):
    # Database
    database_url: str
    
    # API Key (empty means auth is disabled for development)
    api_key: str = ""
    
    # CORS
    allowed_origins: str = "*"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


class Settings(BaseSettings):
    database_url: str
    api_key: str = ""
    allowed_origins: str = "*"
    
    # JWT
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24  # 24 hours
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
