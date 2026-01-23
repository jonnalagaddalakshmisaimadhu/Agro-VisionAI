from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "FarmIQ AI Agro"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Database
    DATABASE_URL: str = "sqlite:///./farmiq.db"
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173,http://localhost:8080"
    
    @property
    def allowed_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
    
    # External APIs
    OPENWEATHER_API_KEY: str = "5b88263f64d6c71a355d39ea646359c6"
    AGRIMART_API_KEY: str = ""
    AGMARKNET_RESOURCE_ID: str = "9ef84268-d588-465a-a308-a864a43d0070"
    
    # File Upload
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    UPLOAD_DIR: str = "uploads"
    
    # Model Settings
    MODEL_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
