import os
from typing import List, Optional, Union
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

    # CORS — comma-separated list or JSON array of allowed origins.
    # DO NOT include "*" in production.
    BACKEND_CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

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

    # Multi-Channel Alert & Notification Configuration
    # SMTP Email Gateway (e.g., Gmail, AWS SES, SendGrid, Outlook, or DGMS Gov relay)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = "Mine Subsidence Early Warning System (DGMS/SECL)"
    SMTP_TLS: bool = True
    SMTP_SSL: bool = False

    # SMS Gateway Provider (Twilio, Fast2SMS, or generic SMS webhook)
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_FROM_NUMBER: str = ""

    FAST2SMS_API_KEY: str = ""
    FAST2SMS_SENDER_ID: str = ""

    SMS_WEBHOOK_URL: str = ""
    SMS_WEBHOOK_TOKEN: str = ""

    model_config = {
        "case_sensitive": True,
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }


settings = Settings()
