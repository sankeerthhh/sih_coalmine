from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.sensor import SensorNode
from app.models.alert import Alert
from app.models.panel import Panel
from app.models.mine import Mine
from app.models.risk_assessment import RiskAssessment
from app.schemas.system import DashboardSummaryResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    mine = db.query(Mine).first()
    mine_name = mine.name if mine else "Korba Underground Coal Mine (Block-A)"
    
    total_nodes = db.query(SensorNode).count()
    offline_nodes = db.query(SensorNode).filter(SensorNode.status == "OFFLINE").count()
    active_nodes = total_nodes - offline_nodes

    active_alerts = db.query(Alert).filter(Alert.status == "ACTIVE").count()

    # Get latest panel B3 risk assessment or highest risk across panels
    latest_risk = db.query(RiskAssessment).order_by(RiskAssessment.timestamp.desc()).first()
    risk_level = latest_risk.risk_classification if latest_risk else "NORMAL"
    risk_score = latest_risk.risk_score if latest_risk else 12.5

    # Look for most recent reading timestamp
    last_update = latest_risk.timestamp if latest_risk else datetime.now(timezone.utc)

    return DashboardSummaryResponse(
        mine_name=mine_name,
        active_panel="Panel B3 (Active Depillaring)",
        system_status="● All Systems Operational",
        active_sensor_nodes=active_nodes,
        offline_sensor_nodes=offline_nodes,
        current_risk_level=risk_level,
        current_risk_score=risk_score,
        active_alerts_count=active_alerts,
        area_under_monitoring_sq_km=4.85,
        last_data_update=last_update,
        disclaimer="Prototype / Simulated Sensor Data. Geotechnical decision-support platform."
    )
