from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.reading import SensorReading
from app.models.risk_assessment import RiskAssessment
from app.models.sensor import SensorNode

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/trends")
def get_analytics_trends(
    sensor_id: Optional[str] = Query("N14"),
    panel_id: Optional[str] = Query("PANEL-B3"),
    range_str: str = Query("24h"), # 1h, 24h, 7d, 30d
    db: Session = Depends(get_db)
):
    hours_map = {
        "1h": 1,
        "24h": 24,
        "7d": 168,
        "30d": 720
    }
    hours = hours_map.get(range_str.lower(), 24)
    since = datetime.utcnow() - timedelta(hours=hours)

    readings = (
        db.query(SensorReading)
        .filter(SensorReading.node_id == sensor_id, SensorReading.timestamp >= since)
        .order_by(SensorReading.timestamp.asc())
        .all()
    )

    data_points = []
    for r in readings:
        resultant_tilt = (r.tilt_x**2 + r.tilt_y**2)**0.5
        data_points.append({
            "timestamp": r.timestamp.isoformat(),
            "tilt_x": round(r.tilt_x, 2),
            "tilt_y": round(r.tilt_y, 2),
            "resultant_tilt": round(resultant_tilt, 2),
            "displacement": round(r.displacement, 2),
            "vibration": round(r.vibration, 2),
            "crack_detected": 1 if r.crack_detected else 0,
            "anomaly_score": round(r.anomaly_score * 100, 1)
        })

    # Also fetch panel risk trends
    risk_records = (
        db.query(RiskAssessment)
        .filter(RiskAssessment.panel_id == panel_id, RiskAssessment.timestamp >= since)
        .order_by(RiskAssessment.timestamp.asc())
        .all()
    )

    risk_points = [
        {
            "timestamp": r.timestamp.isoformat(),
            "risk_score": r.risk_score,
            "classification": r.risk_classification
        }
        for r in risk_records
    ]

    return {
        "sensor_id": sensor_id,
        "panel_id": panel_id,
        "time_range": range_str,
        "readings_count": len(data_points),
        "telemetry_trends": data_points,
        "risk_trends": risk_points
    }
