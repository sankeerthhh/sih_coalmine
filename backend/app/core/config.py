import os
from typing import List, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Mine Subsidence Monitoring & Early Warning Platform"
    ORGANIZATION: str = "Ministry of Coal, Government of India"
    API_V1_STR: str = "/api/v1"

    # Security
    SECRET_KEY: str = "sih-2026-coal-india-mine-subsidence-secret-key-32bytes"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database — must be set via environment variable in production;
    # falls back to local SQLite for development/testing only.
    DATABASE_URL: str = "sqlite:///./mine_subsidence.db"

    # Supabase (optional, only used if Supabase client SDK is needed)
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    # CORS — comma-separated list of allowed origins.
    # DO NOT include "*" in production.
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost",
    ]

    # MQTT Configuration
    MQTT_BROKER: str = "localhost"
    MQTT_PORT: int = 1883
    MQTT_TOPIC_TELEMETRY: str = "coal/mine/+/telemetry"
    MQTT_ENABLED: bool = False

    # Thresholds for AI Risk Classification
    THRESHOLD_NORMAL: float = 30.0
    THRESHOLD_WARNING: float = 60.0
    THRESHOLD_HIGH: float = 80.0
    THRESHOLD_CRITICAL: float = 100.0

    # Demonstration defaults
    DEFAULT_MINE_ID: str = "MINE-SECL-KORBA"
    DEFAULT_PANEL_ID: str = "PANEL-B3"

    model_config = {"case_sensitive": True, "env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
