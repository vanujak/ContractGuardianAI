import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # App Settings
    PROJECT_NAME: str = "Contract Guardian AI"
    DEBUG: bool = True
    PORT: int = 8000
    
    # Database Settings
    # Fallback to local sqlite to ensure the app runs immediately without manual DB setup
    DATABASE_URL: str = "sqlite:///./contract_guardian.db"
    
    # Gemini API Settings
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.5-flash"
    
    # AWS S3 Settings (optional, fallbacks to local workspace storage if empty)
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    AWS_S3_BUCKET: Optional[str] = None
    
    # Local Storage fallback (used when S3 is not configured)
    LOCAL_STORAGE_DIR: str = "./local_storage"

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Ensure local storage folder exists
if not os.path.exists(settings.LOCAL_STORAGE_DIR):
    os.makedirs(settings.LOCAL_STORAGE_DIR)
