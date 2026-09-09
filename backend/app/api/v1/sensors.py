from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.sensor import SensorNode
from app.models.reading import SensorReading
from app.schemas.sensor import SensorNodeResponse, SensorReadingResponse, SensorReadingCreate
from app.services.sensor_service import sensor_service

router = APIRouter(prefix="/sensors", tags=["Sensors"])

@router.get("", response_model=List[SensorNodeResponse])
def list_sensors(
    panel_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(SensorNode)
    if panel_id:
        query = query.filter(SensorNode.panel_id == panel_id)
    if status:
        query = query.filter(SensorNode.status == status.upper())
    
    nodes = query.order_by(SensorNode.id.asc()).all()
    
    # Attach latest reading to each node
    results = []
    for node in nodes:
        latest = (
            db.query(SensorReading)
            .filter(SensorReading.node_id == node.id)
            .order_by(SensorReading.timestamp.desc())
            .first()
        )
        node_dict = {
            "id": node.id,
            "panel_id": node.panel_id,
            "name": node.name,
            "latitude": node.latitude,
            "longitude": node.longitude,
            "hardware_model": node.hardware_model,
            "mesh_parent_id": node.mesh_parent_id,
            "is_gateway": node.is_gateway,
            "status": node.status,
            "battery_level": node.battery_level,
            "signal_strength_rssi": node.signal_strength_rssi,
            "last_seen_at": node.last_seen_at,
            "latest_reading": latest
        }
        results.append(SensorNodeResponse.model_validate(node_dict))
        
    return results

@router.get("/{sensor_id}", response_model=SensorNodeResponse)
def get_sensor(sensor_id: str, db: Session = Depends(get_db)):
    node = db.query(SensorNode).filter(SensorNode.id == sensor_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Sensor node not found")

    latest = (
        db.query(SensorReading)
        .filter(SensorReading.node_id == node.id)
        .order_by(SensorReading.timestamp.desc())
        .first()
    )
    node_dict = {
        "id": node.id,
        "panel_id": node.panel_id,
        "name": node.name,
        "latitude": node.latitude,
        "longitude": node.longitude,
        "hardware_model": node.hardware_model,
        "mesh_parent_id": node.mesh_parent_id,
        "is_gateway": node.is_gateway,
        "status": node.status,
        "battery_level": node.battery_level,
        "signal_strength_rssi": node.signal_strength_rssi,
        "last_seen_at": node.last_seen_at,
        "latest_reading": latest
    }
    return SensorNodeResponse.model_validate(node_dict)

@router.get("/{sensor_id}/readings", response_model=List[SensorReadingResponse])
def get_sensor_readings(
    sensor_id: str,
    hours: int = Query(24, ge=1, le=720),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    since = datetime.utcnow() - timedelta(hours=hours)
    readings = (
        db.query(SensorReading)
        .filter(SensorReading.node_id == sensor_id, SensorReading.timestamp >= since)
        .order_by(SensorReading.timestamp.desc())
        .limit(limit)
        .all()
    )
    return readings

@router.post("/ingest")
async def ingest_sensor_telemetry(payload: SensorReadingCreate, db: Session = Depends(get_db)):
    try:
        result = await sensor_service.process_telemetry(db, payload)
        return result
    except ValueError as val_err:
        raise HTTPException(status_code=422, detail=str(val_err))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Ingestion processing error: {str(exc)}")
