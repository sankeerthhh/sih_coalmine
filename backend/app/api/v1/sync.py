from typing import List, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.sensor import SensorReadingCreate
from app.services.sensor_service import sensor_service

router = APIRouter(prefix="/sync", tags=["Offline Synchronization"])

class OfflineBatchSyncRequest(BaseModel):
    client_id: str = "OFFLINE-BUFFER-CLIENT"
    timestamp: str
    readings: List[SensorReadingCreate]

class OfflineSyncResponse(BaseModel):
    status: str
    synced_records_count: int
    rejected_count: int
    latest_sync_timestamp: str
    details: List[Dict[str, Any]]

@router.post("/buffer", response_model=OfflineSyncResponse)
async def sync_offline_buffer(payload: OfflineBatchSyncRequest, db: Session = Depends(get_db)):
    """
    Receives batch buffered telemetry collected while disconnected,
    validates and processes each reading through the AI/ML pipeline in chronological order,
    and commits to the central database.
    """
    synced = 0
    rejected = 0
    details = []

    # Sort readings chronologically if timestamp exists
    sorted_readings = sorted(
        payload.readings,
        key=lambda r: r.timestamp or datetime.min.replace(tzinfo=timezone.utc)
    )

    for reading in sorted_readings:
        try:
            res = await sensor_service.process_telemetry(db, reading)
            synced += 1
            details.append({
                "node_id": reading.node_id,
                "reading_id": res.get("reading_id"),
                "status": "COMMITTED"
            })
        except Exception as exc:
            rejected += 1
            details.append({
                "node_id": reading.node_id,
                "error": str(exc),
                "status": "REJECTED"
            })

    return OfflineSyncResponse(
        status="SYNC_COMPLETE" if rejected == 0 else "PARTIAL_SYNC",
        synced_records_count=synced,
        rejected_count=rejected,
        latest_sync_timestamp=datetime.now(timezone.utc).isoformat(),
        details=details
    )
