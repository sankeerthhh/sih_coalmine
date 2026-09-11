from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.mine import Mine
from app.models.panel import Panel
from app.models.sensor import SensorNode

router = APIRouter(prefix="/mines", tags=["Mines & Panels Hierarchy"])

@router.get("")
def list_mines(db: Session = Depends(get_db)):
    """Lists all registered coal mines in the enterprise network"""
    mines = db.query(Mine).all()
    results = []
    for m in mines:
        panels = db.query(Panel).filter(Panel.mine_id == m.id).all()
        results.append({
            "id": m.id,
            "name": m.name,
            "organization": m.organization,
            "latitude": m.latitude,
            "longitude": m.longitude,
            "panels_count": len(panels),
            "panels": [
                {
                    "id": p.id,
                    "name": p.name,
                    "status": p.extraction_status,
                    "depth_meters": p.depth_meters,
                    "risk_level": p.risk_level
                }
                for p in panels
            ]
        })
    return results

@router.get("/{mine_id}/panels")
def list_mine_panels(mine_id: str, db: Session = Depends(get_db)):
    """Lists all extraction panels and monitoring zones for a specific coal mine"""
    panels = db.query(Panel).filter(Panel.mine_id == mine_id).all()
    if not panels:
        # Check if mine exists
        mine = db.query(Mine).filter(Mine.id == mine_id).first()
        if not mine:
            raise HTTPException(status_code=404, detail="Mine not found")
    
    results = []
    for p in panels:
        sensor_count = db.query(SensorNode).filter(SensorNode.panel_id == p.id).count()
        results.append({
            "id": p.id,
            "mine_id": p.mine_id,
            "name": p.name,
            "status": p.extraction_status,
            "depth_meters": p.depth_meters,
            "risk_level": p.risk_level,
            "sensor_nodes_count": sensor_count
        })
    return results
