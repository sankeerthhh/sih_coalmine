from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class DashboardSummaryResponse(BaseModel):
    mine_name: str
    active_panel: str
    system_status: str
    active_sensor_nodes: int
    offline_sensor_nodes: int
    current_risk_level: str
    current_risk_score: float
    active_alerts_count: int
    area_under_monitoring_sq_km: float
    last_data_update: datetime
    disclaimer: str

class SystemHealthResponse(BaseModel):
    gateway_status: str
    database_status: str
    ai_engine_status: str
    mesh_network_status: str
    mqtt_status: str
    total_nodes: int
    nodes_online: int
    nodes_offline: int
    nodes_low_battery: int
    nodes_weak_signal: int
    last_synchronization: datetime
    uptime_seconds: float
    cpu_usage_pct: float
    memory_usage_mb: float

class SimulatorScenarioRequest(BaseModel):
    scenario: str # NORMAL, EARLY_WARNING, SUBSIDENCE_CRITICAL, SENSOR_FAILURE, NETWORK_FAILURE, RESET
    speed: Optional[float] = 1.0

class SimulatorStatusResponse(BaseModel):
    is_running: bool
    current_scenario: str
    active_affected_nodes: List[str]
    tick_count: int
