from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.alert import Alert
from app.schemas.alert import (
    AlertResponse,
    AlertAcknowledgeRequest,
    AlertResolveRequest,
    TestBroadcastRequest,
    NotificationProviderStatus
)
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
    payload: Optional[TestBroadcastRequest] = None,
    db: Session = Depends(get_db)
):
    eff_panel_id = payload.panel_id if (payload and payload.panel_id) else panel_id
    sms_target_name = payload.sms_target_name if payload else None
    sms_target_phone = payload.sms_target_phone if payload else None
    email_recipient_name = payload.email_recipient_name if payload else None
    email_recipient_address = payload.email_recipient_address if payload else None
    siren_location = payload.siren_location if payload else None
    siren_channel = payload.siren_relay_channel if payload else None

    # 1. Create or update alert in database so Emergency Alert Banner and table reflect it
    alert = alert_service.create_or_update_alert(
        db=db,
        panel_id=eff_panel_id,
        node_cluster=f"Cluster N14-N15 ({eff_panel_id})",
        title="EMERGENCY SUBSIDENCE DRILL: Accelerated Displacement",
        condition_detected=(
            f"Multi-channel emergency drill dispatched. Displacement 14.8mm, Tilt 2.3°. "
            f"Targets: {sms_target_name or 'Safety Officer'} ({sms_target_phone or 'Default'}) & "
            f"{email_recipient_name or 'DGMS'} ({email_recipient_address or 'Default'})."
        ),
        severity="CRITICAL",
        ai_risk_score=88.0,
        measured_tilt=2.3,
        measured_displacement=14.8,
        crack_detected=True,
        recommended_action="Surface perimeter evacuated within 150m. Verify field receiver acknowledgments and siren operation."
    )

    # 2. Dispatch multi-channel notification via real providers or transparent simulation
    from app.services.notification_service import notification_service
    record = notification_service.dispatch_critical_warning(
        panel_id=eff_panel_id,
        title="EMERGENCY SUBSIDENCE DRILL: Accelerated Displacement at B3",
        measured_displacement=14.8,
        measured_tilt=2.3,
        crack_detected=True,
        hours_to_breach=16.4,
        recommended_action="Halt extraction. Evacuate surface perimeter within 150m. Deploy geodetic verification.",
        target_sms_name=sms_target_name,
        target_sms_phone=sms_target_phone,
        target_email_name=email_recipient_name,
        target_email_address=email_recipient_address,
        siren_location=siren_location,
        siren_channel=siren_channel,
        alert_id=alert.id
    )
    return record


@router.get("/broadcast-logs")
def get_broadcast_logs():
    from app.services.notification_service import notification_service
    return notification_service.get_dispatch_logs()


@router.get("/notification-providers", response_model=NotificationProviderStatus)
def get_notification_provider_status():
    from app.services.notification_service import notification_service
    return notification_service.get_provider_status()


