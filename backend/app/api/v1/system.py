import time
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.sensor import SensorNode
from app.schemas.system import SystemHealthResponse

router = APIRouter(prefix="/system", tags=["System Health"])

_START_TIME = time.time()

@router.get("/health", response_model=SystemHealthResponse)
def get_system_health(db: Session = Depends(get_db)):
    nodes = db.query(SensorNode).all()
    total = len(nodes)
    online = sum(1 for n in nodes if n.status != "OFFLINE")
    offline = total - online
    low_battery = sum(1 for n in nodes if n.battery_level < 25.0)
    weak_signal = sum(1 for n in nodes if n.signal_strength_rssi < -85)

    mesh_status = "HEALTHY" if offline == 0 else ("DEGRADED" if offline <= 2 else "CRITICAL")
    
    uptime = time.time() - _START_TIME

    return SystemHealthResponse(
        gateway_status="ONLINE",
        database_status="ONLINE",
        ai_engine_status="RUNNING",
        mesh_network_status=mesh_status,
        mqtt_status="ONLINE",
        total_nodes=total,
        nodes_online=online,
        nodes_offline=offline,
        nodes_low_battery=low_battery,
        nodes_weak_signal=weak_signal,
        last_synchronization=datetime.utcnow(),
        uptime_seconds=round(uptime, 1),
        cpu_usage_pct=8.4,
        memory_usage_mb=142.6
    )
