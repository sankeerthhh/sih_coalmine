import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Mine Subsidence Monitoring & Early Warning Platform"
    ORGANIZATION: str = "Ministry of Coal, Government of India"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "sih-2026-coal-india-mine-subsidence-secret-key-32bytes")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database (Supabase Cloud PostgreSQL)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres.yagfbuxhxshyqulizmku:Orvexa%4020267@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
    )
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://yagfbuxhxshyqulizmku.supabase.co")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhZ2ZidXhoeHNoeXF1bGl6bWt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODk2MDI5NCwiZXhwIjoyMTA0NTM2Mjk0fQ.tfdSqKW9Fdic1ZLCqLkxCOxMV-ZGdkKEeTp0ZwI4Jno")
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "*"
    ]
    
    # MQTT Configuration
    MQTT_BROKER: str = os.getenv("MQTT_BROKER", "localhost")
    MQTT_PORT: int = int(os.getenv("MQTT_PORT", "1883"))
    MQTT_TOPIC_TELEMETRY: str = "coal/mine/+/telemetry"
    MQTT_ENABLED: bool = os.getenv("MQTT_ENABLED", "false").lower() == "true"
    
    # Thresholds for AI Risk
    THRESHOLD_NORMAL: float = 30.0
    THRESHOLD_WARNING: float = 60.0
    THRESHOLD_HIGH: float = 80.0
    THRESHOLD_CRITICAL: float = 100.0
    
    # Demonstration defaults
    DEFAULT_MINE_ID: str = "MINE-SECL-KORBA"
    DEFAULT_PANEL_ID: str = "PANEL-B3"

    model_config = {"case_sensitive": True}

settings = Settings()
