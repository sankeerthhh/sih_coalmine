from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.models.sensor import SensorNode
from app.schemas.sensor import SensorNodeCreate, SensorNodeUpdate, SensorNodeResponse

router = APIRouter(prefix="/admin", tags=["Admin Settings"])

@router.post("/sensors", response_model=SensorNodeResponse)
def create_sensor(payload: SensorNodeCreate, db: Session = Depends(get_db)):
    existing = db.query(SensorNode).filter(SensorNode.id == payload.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Sensor ID already exists")

    node = SensorNode(
        id=payload.id,
        panel_id=payload.panel_id,
        name=payload.name,
        latitude=payload.latitude,
        longitude=payload.longitude,
        hardware_model=payload.hardware_model or "LoRa-SX1262-Subsidence-V2",
        mesh_parent_id=payload.mesh_parent_id,
        is_gateway=payload.is_gateway or False,
        status="ONLINE"
    )
    db.add(node)
    db.commit()
    db.refresh(node)
    return SensorNodeResponse.model_validate(node)

@router.patch("/sensors/{sensor_id}", response_model=SensorNodeResponse)
def update_sensor(sensor_id: str, payload: SensorNodeUpdate, db: Session = Depends(get_db)):
    node = db.query(SensorNode).filter(SensorNode.id == sensor_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Sensor node not found")

    if payload.name is not None:
        node.name = payload.name
    if payload.panel_id is not None:
        node.panel_id = payload.panel_id
    if payload.status is not None:
        node.status = payload.status
    if payload.mesh_parent_id is not None:
        node.mesh_parent_id = payload.mesh_parent_id
    if payload.latitude is not None:
        node.latitude = payload.latitude
    if payload.longitude is not None:
        node.longitude = payload.longitude

    db.commit()
    db.refresh(node)
    return SensorNodeResponse.model_validate(node)

@router.delete("/sensors/{sensor_id}")
def deactivate_sensor(sensor_id: str, db: Session = Depends(get_db)):
    node = db.query(SensorNode).filter(SensorNode.id == sensor_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Sensor node not found")
    node.status = "OFFLINE"
    db.commit()
    return {"message": f"Sensor node {sensor_id} marked OFFLINE."}

@router.get("/config")
def get_system_config():
    return {
        "threshold_normal": settings.THRESHOLD_NORMAL,
        "threshold_warning": settings.THRESHOLD_WARNING,
        "threshold_high": settings.THRESHOLD_HIGH,
        "threshold_critical": settings.THRESHOLD_CRITICAL,
        "default_mine": settings.DEFAULT_MINE_ID,
        "default_panel": settings.DEFAULT_PANEL_ID
    }
