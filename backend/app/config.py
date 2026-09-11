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

settings = Settings()