import time
from datetime import datetime, timezone
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

    # Attempt real system metrics; fall back to safe defaults if psutil is unavailable
    try:
        import psutil
        cpu_usage = round(psutil.cpu_percent(interval=None), 1)
        mem_info = psutil.virtual_memory()
        memory_mb = round(mem_info.used / 1024 / 1024, 1)
    except ImportError:
        cpu_usage = -1.0   # -1 signals "unavailable" to the frontend
        memory_mb = -1.0

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
        last_synchronization=datetime.now(timezone.utc),
        uptime_seconds=round(uptime, 1),
        cpu_usage_pct=cpu_usage,
        memory_usage_mb=memory_mb
    )
