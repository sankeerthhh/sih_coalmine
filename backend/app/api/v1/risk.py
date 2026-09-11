from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.risk_assessment import RiskAssessment
from app.models.sensor import SensorNode
from app.models.reading import SensorReading
from app.schemas.risk import RiskSummaryResponse, RiskAssessmentResponse
from app.ai.risk_scorer import RiskScorer
from app.ai.ml_classifier import subsidence_classifier
from app.ai.subsidence_fingerprint import subsidence_fingerprint_engine
from app.ai.early_warning_engine import early_warning_engine
from app.ai.anomaly_detector import anomaly_detector
from app.ai.feature_extraction import feature_extractor

router = APIRouter(prefix="/risk", tags=["AI Risk Assessment"])

@router.get("/current", response_model=RiskSummaryResponse)
def get_current_risk(panel_id: str = Query("PANEL-B3"), db: Session = Depends(get_db)):
    latest = (
        db.query(RiskAssessment)
        .filter(RiskAssessment.panel_id == panel_id)
        .order_by(RiskAssessment.timestamp.desc())
        .first()
    )

    # Find the node in this panel with highest displacement or latest reading
    target_node = "N14"
    if latest and latest.primary_contributing_node_id:
        target_node = latest.primary_contributing_node_id

    latest_reading = (
        db.query(SensorReading)
        .filter(SensorReading.node_id == target_node)
        .order_by(SensorReading.timestamp.desc())
        .first()
    )

    if latest_reading:
        tilt_x = latest_reading.tilt_x
        tilt_y = latest_reading.tilt_y
        disp = latest_reading.displacement
        vib = latest_reading.vibration
        crack = latest_reading.crack_detected
    else:
        tilt_x = 0.2
        tilt_y = 0.1
        disp = 1.8
        vib = 0.5
        crack = False

    features = feature_extractor.extract_node_features(
        node_id=target_node,
        timestamp=latest_reading.timestamp if latest_reading else None,
        tilt_x=tilt_x,
        tilt_y=tilt_y,
        displacement=disp,
        vibration=vib,
        crack_detected=crack
    )

    anomaly = anomaly_detector.detect_anomaly(features)
    ml_result = subsidence_classifier.predict_risk(features)
    fused_risk = RiskScorer.calculate_node_risk(features, anomaly["anomaly_score"], ml_result)
    fingerprint = subsidence_fingerprint_engine.evaluate_fingerprint(features, anomaly["anomaly_score"], ml_result)
    early_warning = early_warning_engine.evaluate_early_warning(panel_id, fused_risk, fingerprint, ml_result, features, target_node)

    if latest:
        score = latest.risk_score
        classification = latest.risk_classification
        explanation_text = latest.explanation or fused_risk["explanation"]
        factors = {
            "Displacement Velocity": latest.displacement_factor,
            "Tilt Increase": latest.tilt_factor,
            "Spatial Correlation": latest.spatial_correlation_factor,
            "Vibration RMS": latest.vibration_factor
        }
        latest_resp = RiskAssessmentResponse.model_validate(latest)
    else:
        score = fused_risk["risk_score"]
        classification = fused_risk["risk_classification"]
        explanation_text = fused_risk["explanation"]
        factors = {
            "Displacement Velocity": fused_risk["displacement_factor"],
            "Tilt Increase": fused_risk["tilt_factor"],
            "Spatial Correlation": fused_risk["spatial_correlation_factor"],
            "Vibration RMS": fused_risk["vibration_factor"]
        }
        latest_resp = None

    trend_direction = "INCREASING" if score > 50 else "STABLE"

    if fingerprint:
        fingerprint["state"] = fingerprint.get("fingerprint_state", "STABLE")
        fingerprint["signals"] = fingerprint.get("contributing_signals", [])
    if early_warning:
        early_warning["level"] = early_warning.get("warning_level", "NORMAL")
        early_warning["action"] = early_warning.get("recommended_action", "")

    return RiskSummaryResponse(
        current_risk_score=score,
        risk_classification=classification,
        primary_panel=panel_id,
        affected_cluster=f"Cluster {target_node} & adjacent nodes" if score > 30 else "None (Quiescent)",
        factors=factors,
        trend_direction=trend_direction,
        scientific_disclaimer=RiskScorer.DISCLAIMER,
        latest_assessment=latest_resp,
        explanation=explanation_text,
        geotechnical_score=fused_risk["geotechnical_heuristic_score"],
        ml_severity_score=fused_risk["ml_severity_score"],
        fusion_weights=fused_risk["fusion_weights"],
        ml_prediction=ml_result,
        fingerprint=fingerprint,
        early_warning=early_warning
    )

@router.get("/history", response_model=List[RiskAssessmentResponse])
def get_risk_history(
    panel_id: str = Query("PANEL-B3"),
    hours: int = Query(24, ge=1, le=168),
    db: Session = Depends(get_db)
):
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    records = (
        db.query(RiskAssessment)
        .filter(RiskAssessment.panel_id == panel_id, RiskAssessment.timestamp >= since)
        .order_by(RiskAssessment.timestamp.asc())
        .all()
    )
    return records
