import logging
import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.models.alert import Alert

logger = logging.getLogger("subsidence.alert_service")


class AlertService:
    @staticmethod
    def create_or_update_alert(
        db: Session,
        panel_id: str,
        node_cluster: str,
        title: str,
        condition_detected: str,
        severity: str,
        ai_risk_score: float,
        measured_tilt: float,
        measured_displacement: float,
        crack_detected: bool,
        recommended_action: str
    ) -> Alert:
        # Check if active alert already exists for this panel to prevent spam
        existing = db.query(Alert).filter(
            Alert.panel_id == panel_id,
            Alert.status.in_(["ACTIVE", "ACKNOWLEDGED"])
        ).first()

        if existing:
            # Upgrade severity if condition worsened
            if severity == "CRITICAL" or existing.severity != "CRITICAL":
                existing.severity = severity
            existing.ai_risk_score = ai_risk_score
            existing.measured_tilt = measured_tilt
            existing.measured_displacement = measured_displacement
            existing.crack_detected = crack_detected or existing.crack_detected
            existing.condition_detected = condition_detected
            existing.recommended_action = recommended_action
            try:
                db.commit()
                db.refresh(existing)
            except Exception:
                db.rollback()
                raise
            return existing

        # Create new alert
        alert_id = f"ALT-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{str(uuid.uuid4())[:4].upper()}"
        alert = Alert(
            id=alert_id,
            panel_id=panel_id,
            node_cluster=node_cluster,
            title=title,
            condition_detected=condition_detected,
            severity=severity,
            status="ACTIVE",
            ai_risk_score=ai_risk_score,
            measured_tilt=measured_tilt,
            measured_displacement=measured_displacement,
            crack_detected=crack_detected,
            recommended_action=recommended_action,
            created_at=datetime.now(timezone.utc)
        )
        try:
            db.add(alert)
            db.commit()
            db.refresh(alert)
        except Exception:
            db.rollback()
            raise
        return alert

    @staticmethod
    def acknowledge_alert(db: Session, alert_id: str, operator_name: str, notes: Optional[str] = None) -> Optional[Alert]:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            return None
        alert.status = "ACKNOWLEDGED"
        alert.acknowledged_by = operator_name
        alert.acknowledged_at = datetime.now(timezone.utc)
        try:
            db.commit()
            db.refresh(alert)
        except Exception:
            db.rollback()
            raise
        return alert

    @staticmethod
    def resolve_alert(db: Session, alert_id: str, operator_name: str, notes: Optional[str] = None) -> Optional[Alert]:
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            return None
        alert.status = "RESOLVED"
        alert.resolved_at = datetime.now(timezone.utc)
        try:
            db.commit()
            db.refresh(alert)
        except Exception:
            db.rollback()
            raise
        return alert


alert_service = AlertService()
