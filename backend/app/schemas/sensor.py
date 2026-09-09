from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class SensorReadingCreate(BaseModel):
    node_id: str
    timestamp: Optional[datetime] = None
    tilt_x: float = Field(..., ge=-90.0, le=90.0)
    tilt_y: float = Field(..., ge=-90.0, le=90.0)
    displacement: float = Field(..., ge=0.0, le=1000.0) # mm
    vibration: float = Field(..., ge=0.0, le=100.0)    # mm/s RMS
    crack_detected: bool = False
    battery_level: float = Field(..., ge=0.0, le=100.0)
    signal_strength: int = Field(..., ge=-140, le=0)   # dBm

class SensorReadingResponse(BaseModel):
    id: int
    node_id: str
    timestamp: datetime
    tilt_x: float
    tilt_y: float
    displacement: float
    vibration: float
    crack_detected: bool
    battery_level: float
    signal_strength: int
    anomaly_score: float
    is_outlier: bool

    class Config:
        from_attributes = True

class SensorNodeResponse(BaseModel):
    id: str
    panel_id: str
    name: str
    latitude: float
    longitude: float
    hardware_model: str
    mesh_parent_id: Optional[str] = None
    is_gateway: bool
    status: str
    battery_level: float
    signal_strength_rssi: int
    last_seen_at: datetime
    latest_reading: Optional[SensorReadingResponse] = None

    class Config:
        from_attributes = True

class SensorNodeCreate(BaseModel):
    id: str
    panel_id: str
    name: str
    latitude: float
    longitude: float
    hardware_model: Optional[str] = "LoRa-SX1262-Subsidence-V2"
    mesh_parent_id: Optional[str] = None
    is_gateway: Optional[bool] = False

class SensorNodeUpdate(BaseModel):
    name: Optional[str] = None
    panel_id: Optional[str] = None
    status: Optional[str] = None
    mesh_parent_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
