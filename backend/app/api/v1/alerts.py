from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.alert import Alert
from app.schemas.alert import AlertResponse, AlertAcknowledgeRequest, AlertResolveRequest
from app.services.alert_service import alert_service

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertResponse])
def list_alerts(
    status: Optional[str] = Query(None), # ACTIVE, ACKNOWLEDGED, RESOLVED
    severity: Optional[str] = Query(None), # WARNING, HIGH, CRITICAL
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(Alert)
    if status and status.upper() != "ALL":
        query = query.filter(Alert.status == status.upper())
    if severity and severity.upper() != "ALL":
        query = query.filter(Alert.severity == severity.upper())

    alerts = query.order_by(Alert.created_at.desc()).limit(limit).all()
    return alerts

@router.post("/{alert_id}/acknowledge", response_model=AlertResponse)
def acknowledge_alert(
    alert_id: str,
    payload: AlertAcknowledgeRequest,
    db: Session = Depends(get_db)
):
    alert = alert_service.acknowledge_alert(
        db=db,
        alert_id=alert_id,
        operator_name=payload.acknowledged_by,
        notes=payload.notes
    )
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert

@router.post("/{alert_id}/resolve", response_model=AlertResponse)
def resolve_alert(
    alert_id: str,
    payload: AlertResolveRequest,
    db: Session = Depends(get_db)
):
    alert = alert_service.resolve_alert(
        db=db,
        alert_id=alert_id,
        operator_name=payload.resolved_by,
        notes=payload.notes
    )
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.post("/broadcast-test")
def trigger_test_broadcast(
    panel_id: str = Query("PANEL-B3"),
    db: Session = Depends(get_db)
):
    from app.services.notification_service import notification_service
    record = notification_service.dispatch_critical_warning(
        panel_id=panel_id,
        title="EMERGENCY SUBSIDENCE DRILL: Accelerated Displacement at B3",
        measured_displacement=14.8,
        measured_tilt=2.3,
        crack_detected=True,
        hours_to_breach=16.4,
        recommended_action="Halt extraction. Evacuate surface perimeter within 150m. Deploy geodetic verification."
    )
    return record


@router.get("/broadcast-logs")
def get_broadcast_logs():
    from app.services.notification_service import notification_service
    return notification_service.get_dispatch_logs()

