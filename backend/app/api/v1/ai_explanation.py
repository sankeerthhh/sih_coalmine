from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.sensor import SensorNode
from app.models.reading import SensorReading
from app.models.risk_assessment import RiskAssessment
from app.ai.feature_extraction import feature_extractor
from app.ai.anomaly_detector import anomaly_detector
from app.ai.ml_classifier import subsidence_classifier
from app.ai.risk_scorer import risk_scorer
from app.ai.subsidence_fingerprint import subsidence_fingerprint_engine
from app.ai.early_warning_engine import early_warning_engine
from app.ai.spatial_analyzer import spatial_risk_analyzer
from app.services.gemini_service import gemini_service

router = APIRouter(prefix="/ai", tags=["AI Subsidence & Gemini Decision Support"])

class ExplainRequest(BaseModel):
    panel_id: Optional[str] = "PANEL-B3"
    node_id: Optional[str] = "N14"

class PredictionRequest(BaseModel):
    resultant_tilt: float
    tilt_rate: float
    displacement: float
    displacement_velocity: float
    vibration_rms: float
    spatial_deviation: float
    crack_event: float = 0.0

@router.post("/prediction")
def predict_subsidence_risk(payload: PredictionRequest):
    """
    Direct inference using the Supervised Random Forest Classifier.
    Returns predicted risk class, confidence, and probability distribution.
    """
    features = payload.model_dump()
    ml_result = subsidence_classifier.predict_risk(features)
    anomaly_result = anomaly_detector.detect_anomaly(features)
    fused_risk = risk_scorer.calculate_node_risk(
        features=features,
        anomaly_score=anomaly_result["anomaly_score"],
        ml_prediction=ml_result
    )
    fingerprint = subsidence_fingerprint_engine.evaluate_fingerprint(
        features=features,
        anomaly_score=anomaly_result["anomaly_score"],
        ml_prediction=ml_result
    )
    early_warning = early_warning_engine.evaluate_early_warning(
        panel_id="PANEL-B3",
        fused_risk=fused_risk,
        fingerprint=fingerprint,
        ml_prediction=ml_result,
        features=features
    )

    return {
        "ml_classification": ml_result,
        "anomaly_detection": anomaly_result,
        "fused_risk": fused_risk,
        "subsidence_fingerprint": fingerprint,
        "early_warning": early_warning
    }

@router.post("/explain")
async def explain_decision(payload: ExplainRequest, db: Session = Depends(get_db)):
    """
    Produces structured Geotechnical Explanation and Action Advisory via Gemini AI
    based on current sensor, panel, and ML pipeline context.
    """
    # Fetch focus node and readings
    node = db.query(SensorNode).filter(SensorNode.id == payload.node_id).first()
    latest_reading = (
        db.query(SensorReading)
        .filter(SensorReading.node_id == payload.node_id)
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
        node_id=payload.node_id or "N14",
        timestamp=latest_reading.timestamp if latest_reading else None,
        tilt_x=tilt_x,
        tilt_y=tilt_y,
        displacement=disp,
        vibration=vib,
        crack_detected=crack
    )

    anomaly = anomaly_detector.detect_anomaly(features)
    ml_result = subsidence_classifier.predict_risk(features)
    fused = risk_scorer.calculate_node_risk(features, anomaly["anomaly_score"], ml_result)
    fingerprint = subsidence_fingerprint_engine.evaluate_fingerprint(features, anomaly["anomaly_score"], ml_result)

    context = {
        "panel_id": payload.panel_id,
        "focus_node_id": payload.node_id,
        "displacement": disp,
        "resultant_tilt": features["resultant_tilt"],
        "tilt_rate": features["tilt_rate"],
        "displacement_velocity": features["displacement_velocity"],
        "vibration_rms": features["vibration_rms"],
        "crack_detected": crack,
        "fused_risk_score": fused["risk_score"],
        "risk_classification": fused["risk_classification"],
        "ml_predicted_class": ml_result["predicted_class"],
        "ml_confidence": ml_result["confidence"],
        "ml_probabilities": ml_result["probabilities"],
        "anomaly_score": anomaly["anomaly_score"],
        "fingerprint_state": fingerprint["fingerprint_state"],
        "detected_signals": fingerprint["contributing_signals"]
    }

    ai_explanation = await gemini_service.generate_explanation(context)

    return {
        "context": context,
        "ai_explanation": ai_explanation
    }

@router.get("/zones")
def get_predicted_zones(panel_id: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Returns spatial subsidence zone predictions aggregating adjacent mesh clusters.
    """
    nodes = db.query(SensorNode).all()
    node_dicts = []
    for n in nodes:
        latest = (
            db.query(SensorReading)
            .filter(SensorReading.node_id == n.id)
            .order_by(SensorReading.timestamp.desc())
            .first()
        )
        node_dicts.append({
            "id": n.id,
            "panel_id": n.panel_id,
            "latitude": n.latitude,
            "longitude": n.longitude,
            "status": n.status,
            "displacement": latest.displacement if latest else 1.5,
            "resultant_tilt": ((latest.tilt_x**2 + latest.tilt_y**2)**0.5) if latest else 0.3,
            "crack_detected": latest.crack_detected if latest else False,
            "risk_score": 85.0 if n.status == "CRITICAL" else (45.0 if n.status == "WARNING" else 15.0)
        })

    zones = spatial_risk_analyzer.evaluate_spatial_zones(node_dicts)
    if panel_id:
        zones = [z for z in zones if z["panel_id"] == panel_id]
    return zones
